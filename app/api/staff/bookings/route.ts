import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff, releaseExpired } from "@/lib/server";
import { LIVE, SLOT_MS, dayRange, todayWib, isValidSlot } from "@/lib/rules";

export const dynamic = "force-dynamic";

// Daily usage list: GET /api/staff/bookings?date=YYYY-MM-DD
export async function GET(req: Request) {
  if (!(await requireStaff(req))) return err("Khusus staf gedung", 403);
  await releaseExpired();
  const [from, to] = dayRange(new URL(req.url).searchParams.get("date") ?? todayWib());
  return ok(await prisma.booking.findMany({ where: { startTime: { gte: from, lt: to } }, include: { room: true, user: { select: { name: true, campusId: true, email: true } } }, orderBy: { startTime: "asc" } }));
}

// Manual schedule entry (mitigation when the official schedule is not integrated). Body: { roomId, start, note }
export async function POST(req: Request) {
  const staff = await requireStaff(req);
  if (!staff) return err("Khusus staf gedung", 403);
  const b = await req.json().catch(() => ({}));
  const start = new Date(b.start);
  if (!b.roomId || !isValidSlot(start)) return err("Slot tidak valid.");
  if (await prisma.booking.findFirst({ where: { roomId: b.roomId, startTime: start, status: { in: LIVE } } })) return err("Slot sudah terisi.", 409);
  const created = await prisma.booking.create({
    data: { userId: staff.id, roomId: b.roomId, startTime: start, endTime: new Date(start.getTime() + SLOT_MS), status: "CHECKED_IN", source: "STAFF", note: b.note ?? "Jadwal manual" },
  });
  return ok(created, 201);
}
