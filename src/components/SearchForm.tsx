"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pad = (n: number) => String(n).padStart(2, "0");

export default function SearchForm({ buildings }: { buildings: { id: string; name: string }[] }) {
  const router = useRouter();
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(120);

  useEffect(() => {
    const now = new Date();
    setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    const m = now.getMinutes() < 30 ? 30 : 0;
    const h = now.getMinutes() < 30 ? now.getHours() : now.getHours() + 1;
    setTime(`${pad(Math.min(Math.max(h, 7), 20))}:${pad(m)}`);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const start = new Date(`${date}T${time}`); // waktu lokal browser
    const end = new Date(start.getTime() + duration * 60_000);
    const q = new URLSearchParams({ buildingId, start: start.toISOString(), end: end.toISOString() });
    router.push(`/rooms?${q}`);
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <div>
        <label className="label">Gedung</label>
        <select className="input" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Tanggal</label>
        <input type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Jam Mulai</label>
          <input type="time" step={1800} min="07:00" max="20:30" className="input" required
            value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label className="label">Durasi</label>
          <select className="input" value={duration} onChange={(e) => setDuration(+e.target.value)}>
            <option value={30}>30 menit</option>
            <option value={60}>1 jam</option>
            <option value={90}>1,5 jam</option>
            <option value={120}>2 jam (maks)</option>
          </select>
        </div>
      </div>
      <button className="btn-primary">Cari Ruangan</button>
    </form>
  );
}
