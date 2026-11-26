import { prisma } from "@/lib/prisma";
import { ok, err, getUser, releaseExpired } from "@/lib/server";
import { LIVE, SLOT_MS, isValidSlot, isTooLate } from "@/lib/rules";

export const dynamic = "force-dynamic";

// My bookings. `qr` is the payload to render as a QR code on the student's phone.
export async function GET(req: Request) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  await releaseExpired();
  const list = await prisma.booking.findMany({ where: { userId: u.id }, include: { room: true }, orderBy: { startTime: "desc" } });
  return ok(list.map((b) => ({ ...b, qr: b.id, room: { id: b.room.id, name: b.room.name, floor: b.room.floor, building: b.room.building } })));
}

// Body: { roomId, start: ISO datetime of a 2-hour slot start, e.g. "2026-11-09T10:00:00+07:00" }
export async function POST(req: Request) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  const b = await req.json().catch(() => ({}));
  const start = new Date(b.start);
  if (!b.roomId || !isValidSlot(start)) return err("Slot tidak valid. Gunakan slot 2 jam antara 08:00 dan 20:00 WIB.");
  if (isTooLate(start)) return err("Slot ini sudah lewat batas check-in.");
  const room = await prisma.room.findUnique({ where: { id: b.roomId } });
  if (!room) return err("Ruang tidak ditemukan", 404);
  if (room.closed) return err("Ruang sedang ditutup untuk maintenance.", 409);
  await releaseExpired();
  if (await prisma.booking.findFirst({ where: { roomId: room.id, startTime: start, status: { in: LIVE } } })) return err("Slot sudah dipesan.", 409);
  if (await prisma.booking.findFirst({ where: { userId: u.id, startTime: start, status: { in: LIVE } } })) return err("Kamu sudah punya pemesanan di jam yang sama.", 409);
  const created = await prisma.booking.create({ data: { userId: u.id, roomId: room.id, startTime: start, endTime: new Date(start.getTime() + SLOT_MS) } });
  return ok(created, 201);
}
