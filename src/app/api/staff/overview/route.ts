import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { syncBookingStatuses } from "@/lib/bookings";
import { HttpError, handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await getSessionUser();
  if (user?.role !== "STAFF") throw new HttpError(403, "Khusus staf");
  await syncBookingStatuses();

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.booking.findMany({
      where: { startTime: { gte: dayStart, lt: dayEnd } },
      orderBy: { startTime: "asc" },
      include: { room: { select: { name: true } }, user: { select: { name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({
    rooms,
    bookings: bookings.map((b) => ({
      id: b.id, token: b.qrCodeToken, roomId: b.roomId, roomName: b.room.name,
      userName: b.user.name, startTime: b.startTime, endTime: b.endTime,
      status: b.status, isManualBlock: b.isManualBlock, note: b.note,
    })),
  });
});
