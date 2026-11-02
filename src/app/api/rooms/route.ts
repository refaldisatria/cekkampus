import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ACTIVE, syncBookingStatuses } from "@/lib/bookings";
import { HttpError, handle, parseDate } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  if (!(await getSessionUser())) throw new HttpError(401, "Belum login");
  const sp = req.nextUrl.searchParams;
  const buildingId = sp.get("buildingId");
  if (!buildingId) throw new HttpError(400, "buildingId wajib");
  const start = parseDate(sp.get("start"), "start");
  const end = parseDate(sp.get("end"), "end");

  await syncBookingStatuses();

  const rooms = await prisma.room.findMany({
    where: { buildingId },
    orderBy: { name: "asc" },
    include: {
      bookings: {
        where: { status: { in: ACTIVE }, startTime: { lt: end }, endTime: { gt: start } },
        select: { endTime: true },
        orderBy: { endTime: "asc" },
      },
    },
  });

  return NextResponse.json(
    rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      status: r.status,
      available: r.status === "AVAILABLE" && r.bookings.length === 0,
      busyUntil: r.bookings.length ? r.bookings[r.bookings.length - 1].endTime : null,
    }))
  );
});
