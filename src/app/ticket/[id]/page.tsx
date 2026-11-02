import { notFound, redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import TicketView from "@/components/TicketView";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { syncBookingStatuses } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await syncBookingStatuses(); // pastikan status terbaru (auto-cancel 15 menit)

  const b = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { room: { include: { building: true } } },
  });
  if (!b || (b.userId !== user.id && user.role !== "STAFF")) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md p-4">
        <TicketView
          data={{
            id: b.id,
            token: b.qrCodeToken,
            status: b.status,
            roomName: b.room.name,
            buildingName: b.room.building.name,
            start: b.startTime.toISOString(),
            end: b.endTime.toISOString(),
          }}
        />
      </main>
    </>
  );
}
