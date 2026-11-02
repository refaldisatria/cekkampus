import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reserveRoom } from "@/lib/bookings";
import { HttpError, handle, parseDate } from "@/lib/http";

export const POST = handle(async (req) => {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Belum login");
  const body = await req.json();
  if (!body.roomId) throw new HttpError(400, "roomId wajib");

  const booking = await reserveRoom({
    userId: user.id,
    roomId: body.roomId,
    start: parseDate(body.start, "start"),
    end: parseDate(body.end, "end"),
  });
  return NextResponse.json({ id: booking.id }, { status: 201 });
});
