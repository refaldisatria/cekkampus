import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reserveRoom } from "@/lib/bookings";
import { HttpError, handle, parseDate } from "@/lib/http";

export const POST = handle(async (req) => {
  const user = await getSessionUser();
  if (user?.role !== "STAFF") throw new HttpError(403, "Khusus staf");
  const body = await req.json();
  if (!body.roomId || !body.note?.trim()) throw new HttpError(400, "Ruangan & alasan wajib diisi");

  const b = await reserveRoom({
    userId: user.id,
    roomId: body.roomId,
    start: parseDate(body.start, "start"),
    end: parseDate(body.end, "end"),
    manual: true,
    note: body.note.trim(),
  });
  return NextResponse.json({ id: b.id }, { status: 201 });
});
