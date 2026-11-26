import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/server";
import { GRACE_MS, EARLY_MS } from "@/lib/rules";

// Called by the door reader. Body: { bookingId (from the student's QR), roomToken (room.qrToken stored on the reader) }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const booking = await prisma.booking.findUnique({ where: { id: String(b.bookingId ?? "") }, include: { room: true } });
  if (!booking || booking.room.qrToken !== b.roomToken) return err("QR tidak dikenali untuk ruang ini.", 404);
  if (booking.room.closed) return err("Ruang sedang maintenance.", 409);
  if (booking.status === "CHECKED_IN") return ok({ status: "CHECKED_IN", message: "Sudah check-in." });
  if (booking.status !== "ACTIVE") return err("Pemesanan sudah dibatalkan atau dilepas otomatis.", 409);
  const now = Date.now(), s = booking.startTime.getTime();
  if (now < s - EARLY_MS) return err("Belum waktunya. Check-in dibuka 10 menit sebelum jadwal.", 409);
  if (now > s + GRACE_MS) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "RELEASED" } });
    return err("Lewat 15 menit. Pemesanan dilepas otomatis.", 409);
  }
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CHECKED_IN", checkedInAt: new Date() } });
  return ok(updated);
}
