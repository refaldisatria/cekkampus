"use client";
import { useCallback, useEffect, useState } from "react";

type Room = { id: string; name: string; status: "AVAILABLE" | "MAINTENANCE" };
type Row = {
  id: string; token: string; roomName: string; userName: string; startTime: string; endTime: string;
  status: "PENDING" | "CHECKED_IN" | "CANCELLED" | "COMPLETED"; isManualBlock: boolean; note: string | null;
};

const hm = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const statusStyle: Record<Row["status"], string> = {
  PENDING: "bg-secondary-fixed text-on-secondary-fixed",
  CHECKED_IN: "bg-tertiary-fixed text-tertiary",
  CANCELLED: "bg-error-container text-on-error-container",
  COMPLETED: "bg-surface-container-high text-on-surface-variant",
};

export default function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/overview", { cache: "no-store" });
    if (res.ok) { const d = await res.json(); setRooms(d.rooms); setRows(d.bookings); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);

  async function call(url: string, method: string, body: unknown, okText: string) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? okText : data.error ?? "Gagal" });
    load();
    return res.ok;
  }

  const toggle = (r: Room) =>
    call(`/api/staff/rooms/${r.id}`, "PATCH",
      { status: r.status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE" },
      `${r.name} diubah menjadi ${r.status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE"}`);

  const manualCheckin = (b: Row) => call("/api/checkin", "POST", { token: b.token }, `Check-in manual: ${b.roomName}`);

  // ---- Form jadwal manual ----
  const [f, setF] = useState({ roomId: "", date: "", start: "15:00", end: "17:00", note: "" });
  useEffect(() => { setF((p) => ({ ...p, date: new Date().toLocaleDateString("en-CA") })); }, []);
  useEffect(() => { if (!f.roomId && rooms[0]) setF((p) => ({ ...p, roomId: rooms[0].id })); }, [rooms, f.roomId]);

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call("/api/staff/blocks", "POST", {
      roomId: f.roomId,
      start: new Date(`${f.date}T${f.start}`).toISOString(),
      end: new Date(`${f.date}T${f.end}`).toISOString(),
      note: f.note,
    }, "Jadwal manual tersimpan");
    if (ok) setF((p) => ({ ...p, note: "" }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-primary">Operasional Ruang Belajar</h1>
        <p className="text-sm text-on-surface-variant">Pemantauan & pengelolaan ruangan hari ini.</p>
      </div>

      {msg && (
        <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-tertiary-fixed text-tertiary" : "bg-error-container text-on-error-container"}`}>
          {msg.text}
        </p>
      )}

      <section className="card">
        <h2 className="mb-3 font-headline text-lg font-semibold">Manajemen Ruangan</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className={`text-xs font-bold ${r.status === "AVAILABLE" ? "text-tertiary-container" : "text-error"}`}>
                  {r.status === "AVAILABLE" ? "Tersedia" : "Maintenance"}
                </p>
              </div>
              <button role="switch" aria-checked={r.status === "AVAILABLE"} onClick={() => toggle(r)}
                className={`relative h-7 w-12 rounded-full transition ${r.status === "AVAILABLE" ? "bg-tertiary-container" : "bg-outline-variant"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${r.status === "AVAILABLE" ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden !p-0">
        <h2 className="p-4 font-headline text-lg font-semibold">Penggunaan Ruangan Hari Ini</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="p-3">Ruangan</th><th className="p-3">Waktu</th>
                <th className="p-3">Penanggung Jawab</th><th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-on-surface-variant">Belum ada jadwal hari ini.</td></tr>
              )}
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-surface-container">
                  <td className="p-3 font-semibold">{b.roomName}</td>
                  <td className="whitespace-nowrap p-3">{hm(b.startTime)} – {hm(b.endTime)}</td>
                  <td className="p-3">
                    {b.userName}
                    {b.isManualBlock && <span className="ml-2 rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold text-primary">Entri Staf</span>}
                    {b.note && <p className="text-xs text-on-surface-variant">{b.note}</p>}
                  </td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[b.status]}`}>{b.status}</span></td>
                  <td className="p-3 text-right">
                    {b.status === "PENDING" && <button className="btn-ghost" onClick={() => manualCheckin(b)}>Check-in Manual</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-headline text-lg font-semibold">Blokir Jadwal Manual</h2>
        <form onSubmit={submitBlock} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Ruangan</label>
            <select className="input" value={f.roomId} onChange={(e) => setF({ ...f, roomId: e.target.value })}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tanggal</label>
            <input type="date" className="input" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Mulai</label>
            <input type="time" className="input" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          </div>
          <div>
            <label className="label">Selesai</label>
            <input type="time" className="input" required value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Alasan / Keterangan</label>
            <input className="input" required value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })}
              placeholder="Contoh: Kuliah pengganti, surat Dekan No. 412" />
          </div>
          <button className="btn-primary sm:col-span-2">Simpan Jadwal Manual</button>
        </form>
      </section>
    </div>
  );
}
