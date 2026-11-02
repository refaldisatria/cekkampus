import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { EARLY_CHECKIN_MINUTES, GRACE_MINUTES, syncBookingStatuses } from "@/lib/bookings";
import { HttpError, handle } from "@/lib/http";

// Dipanggil scanner pintu (header x-door-key) atau staf (check-in manual).
export const POST = handle(async (req) => {
  const key = process.env.DOOR_API_KEY;
  const isDoor = !!key && req.headers.get("x-door-key") === key;
  if (!isDoor) {
    const user = await getSessionUser();
    if (user?.role !== "STAFF") throw new HttpError(401, "Tidak berwenang");
  }

  const { token, roomId } = await req.json();
  if (!token) throw new HttpError(400, "token wajib");

  // Auto-cancel (15 menit) dijalankan SEBELUM validasi check-in
  await syncBookingStatuses();

  const booking = await prisma.booking.findUnique({ where: { qrCodeToken: token } });
  if (!booking) throw new HttpError(404, "QR tidak dikenali");
  if (roomId && roomId !== booking.roomId) throw new HttpError(403, "QR ini bukan untuk ruangan ini");

  if (booking.status === "CANCELLED")
    throw new HttpError(410, `Reservasi dibatalkan otomatis (lewat ${GRACE_MINUTES} menit dari jadwal)`);
  if (booking.status === "COMPLETED") throw new HttpError(410, "Sesi sudah selesai");
  if (booking.status === "CHECKED_IN") return NextResponse.json({ ok: true, alreadyCheckedIn: true });

  if (Date.now() < booking.startTime.getTime() - EARLY_CHECKIN_MINUTES * 60_000)
    throw new HttpError(425, "Belum waktunya check-in");

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CHECKED_IN" } });
  return NextResponse.json({ ok: true, message: "Pintu dibuka" });
});
