import { prisma } from "@/lib/prisma";
import { ok, err, releaseExpired } from "@/lib/server";
import { SLOT_HOURS, LIVE, slotStart, dayRange, todayWib, isTooLate } from "@/lib/rules";

export const dynamic = "force-dynamic";

// GET /api/rooms?date=YYYY-MM-DD&building=&minCapacity=&maxCapacity=&facilities=ac,wb&slot=10
export async function GET(req: Request) {
  await releaseExpired();
  const q = new URL(req.url).searchParams;
  const date = q.get("date") ?? todayWib();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("Format tanggal harus YYYY-MM-DD");
  const [from, to] = dayRange(date);
  const min = Number(q.get("minCapacity") ?? 0), max = Number(q.get("maxCapacity") ?? 999);
  const need = (q.get("facilities") ?? "").split(",").filter(Boolean);
  const slot = q.get("slot") ? Number(q.get("slot")) : null;
  const building = q.get("building");

  const [rooms, booked] = await Promise.all([
    prisma.room.findMany({ where: building ? { building } : {}, orderBy: { name: "asc" } }),
    prisma.booking.findMany({ where: { startTime: { gte: from, lt: to }, status: { in: LIVE } }, select: { roomId: true, startTime: true } }),
  ]);
  const taken = new Set(booked.map((b) => `${b.roomId}|${b.startTime.getTime()}`));

  const out = rooms
    .map((r) => {
      const facilities = r.facilities.split(",").filter(Boolean);
      const slots = SLOT_HOURS.map((h) => {
        const start = slotStart(date, h);
        const state = r.closed ? "closed" : taken.has(`${r.id}|${start.getTime()}`) ? "booked" : isTooLate(start) ? "past" : "free";
        return { hour: h, start, state };
      });
      return { id: r.id, name: r.name, building: r.building, floor: r.floor, capacity: r.capacity, facilities, closed: r.closed, closedNote: r.closedNote, slots };
    })
    .filter((r) => r.capacity >= min && r.capacity <= max && need.every((f) => r.facilities.includes(f)))
    .filter((r) => slot == null || r.slots.some((s) => s.hour === slot && s.state === "free"));

  return ok({ date, availableNow: out.filter((r) => r.slots.some((s) => s.state === "free")).length, rooms: out });
}
