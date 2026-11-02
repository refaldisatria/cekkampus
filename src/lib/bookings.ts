import { randomBytes } from "crypto";
import { Prisma, BookingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http";

export const MAX_MINUTES = 120;
export const GRACE_MINUTES = 15;
export const EARLY_CHECKIN_MINUTES = 10;
export const ACTIVE: BookingStatus[] = ["PENDING", "CHECKED_IN"];

export const newToken = () => randomBytes(24).toString("hex");

/**
 * Sinkronisasi status (dipanggil lazily di setiap endpoint yang relevan):
 * 1. PENDING yang melewati startTime + 15 menit  -> CANCELLED
 * 2. CHECKED_IN yang melewati endTime            -> COMPLETED
 */
export async function syncBookingStatuses(now = new Date()) {
  const graceLimit = new Date(now.getTime() - GRACE_MINUTES * 60_000);
  const [cancelled] = await prisma.$transaction([
    prisma.booking.updateMany({
      where: { status: "PENDING", startTime: { lt: graceLimit } },
      data: { status: "CANCELLED" },
    }),
    prisma.booking.updateMany({
      where: { status: "CHECKED_IN", endTime: { lt: now } },
      data: { status: "COMPLETED" },
    }),
  ]);
  return cancelled.count;
}

type ReserveInput = {
  userId: string;
  roomId: string;
  start: Date;
  end: Date;
  manual?: boolean; // blokir manual staf: lewati batas 2 jam & waktu lampau
  note?: string;
};

export async function reserveRoom({ userId, roomId, start, end, manual = false, note }: ReserveInput) {
  const minutes = (end.getTime() - start.getTime()) / 60_000;
  if (!(minutes > 0)) throw new HttpError(400, "Rentang waktu tidak valid");
  if (!manual) {
    if (minutes > MAX_MINUTES) throw new HttpError(400, "Pemesanan maksimal 2 jam per sesi");
    if (start.getTime() < Date.now() - 60_000) throw new HttpError(400, "Waktu mulai sudah lewat");
  }

  await syncBookingStatuses();

  // Serializable + cek overlap di dalam transaksi => cegah double booking
  return prisma.$transaction(
    async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new HttpError(404, "Ruangan tidak ditemukan");
      if (room.status !== "AVAILABLE") throw new HttpError(409, "Ruangan sedang ditutup (maintenance)");

      const overlap = { startTime: { lt: end }, endTime: { gt: start }, status: { in: ACTIVE } };

      if (await tx.booking.findFirst({ where: { roomId, ...overlap } }))
        throw new HttpError(409, "Slot sudah terisi, pilih waktu/ruangan lain");

      if (!manual && (await tx.booking.findFirst({ where: { userId, ...overlap } })))
        throw new HttpError(409, "Anda sudah punya pemesanan di rentang waktu ini");

      return tx.booking.create({
        data: {
          userId, roomId, startTime: start, endTime: end,
          qrCodeToken: newToken(),
          status: manual ? "CHECKED_IN" : "PENDING",
          isManualBlock: manual,
          note,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
