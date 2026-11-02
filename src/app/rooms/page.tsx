import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import RoomList from "@/components/RoomList";

export default function RoomsPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md p-4">
        <Suspense fallback={<p className="text-sm">Memuat...</p>}>
          <RoomList />
        </Suspense>
      </main>
    </>
  );
}
