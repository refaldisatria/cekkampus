import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { HttpError, handle } from "@/lib/http";

export const PATCH = handle(async (req, { params }) => {
  const user = await getSessionUser();
  if (user?.role !== "STAFF") throw new HttpError(403, "Khusus staf");

  const { status } = await req.json();
  if (!["AVAILABLE", "MAINTENANCE"].includes(status)) throw new HttpError(400, "Status tidak valid");

  const room = await prisma.room.update({ where: { id: params.id }, data: { status } });

  // Ruangan ditutup: batalkan reservasi mahasiswa yang belum check-in
  if (status === "MAINTENANCE") {
    await prisma.booking.updateMany({
      where: { roomId: room.id, status: "PENDING", endTime: { gt: new Date() } },
      data: { status: "CANCELLED" },
    });
  }
  return NextResponse.json(room);
});
