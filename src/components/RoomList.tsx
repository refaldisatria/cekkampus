"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Room = {
  id: string; name: string; capacity: number;
  status: "AVAILABLE" | "MAINTENANCE"; available: boolean; busyUntil: string | null;
};

const hm = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

export default function RoomList() {
  const sp = useSearchParams();
  const router = useRouter();
  const buildingId = sp.get("buildingId") ?? "";
  const start = sp.get("start") ?? "";
  const end = sp.get("end") ?? "";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ buildingId, start, end });
    const res = await fetch(`/api/rooms?${q}`, { cache: "no-store" });
    if (res.ok) setRooms(await res.json());
    setLoading(false);
  }, [buildingId, start, end]);

  // Polling tiap 15 detik => ketersediaan "live"
  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function book(roomId: string) {
    setBookingId(roomId); setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, start, end }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBookingId(null); load(); return; }
    router.push(`/ticket/${data.id}`);
  }

  const label = start && end ? `${hm(start)} – ${hm(end)}` : "";

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => router.push("/search")} className="text-sm font-semibold text-secondary">← Ubah pencarian</button>
        <h1 className="font-headline text-2xl font-bold text-primary">Ruangan Tersedia</h1>
        <p className="text-sm text-on-surface-variant">
          {start && new Date(start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })} • {label}
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-tertiary-container">
            <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-fixed-dim" /> Live
          </span>
        </p>
      </div>

      {error && <p className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">{error}</p>}
      {loading && <p className="text-sm text-on-surface-variant">Memuat ketersediaan...</p>}

      {rooms.map((r) => (
        <div key={r.id} className="card flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-lg font-semibold">{r.name}</h2>
            <p className="text-sm text-on-surface-variant">Kapasitas {r.capacity} orang</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
              r.available ? "bg-tertiary-fixed text-tertiary"
              : r.status === "MAINTENANCE" ? "bg-surface-container-high text-outline"
              : "bg-secondary-fixed text-on-secondary-fixed"}`}>
              {r.available ? "Tersedia" : r.status === "MAINTENANCE" ? "Perawatan" : `Terisi s/d ${hm(r.busyUntil)}`}
            </span>
          </div>
          <button className="btn-primary !h-10 !w-auto px-4" disabled={!r.available || bookingId !== null}
            onClick={() => book(r.id)}>
            {bookingId === r.id ? "..." : "Book"}
          </button>
        </div>
      ))}
    </div>
  );
}
