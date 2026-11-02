"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  data: { id: string; token: string; status: string; roomName: string; buildingName: string; start: string; end: string };
};

const GRACE_MS = 15 * 60_000;
const hm = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function TicketView({ data }: Props) {
  const router = useRouter();
  const deadline = new Date(data.start).getTime() + GRACE_MS;
  const [left, setLeft] = useState(deadline - Date.now());

  useEffect(() => {
    if (data.status !== "PENDING") return;
    const t = setInterval(() => {
      const remaining = deadline - Date.now();
      setLeft(remaining);
      if (remaining <= 0) { clearInterval(t); router.refresh(); }
    }, 1000);
    return () => clearInterval(t);
  }, [data.status, deadline, router]);

  // Polling ringan: kalau pintu sudah memindai QR, tiket ikut berubah
  useEffect(() => {
    if (data.status !== "PENDING") return;
    const t = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(t);
  }, [data.status, router]);

  const mm = Math.max(0, Math.floor(left / 60_000));
  const ss = Math.max(0, Math.floor((left % 60_000) / 1000));
  const cancelled = data.status === "CANCELLED";

  const badge: Record<string, string> = {
    PENDING: "bg-secondary-fixed text-on-secondary-fixed",
    CHECKED_IN: "bg-tertiary-fixed text-tertiary",
    CANCELLED: "bg-error-container text-on-error-container",
    COMPLETED: "bg-surface-container-high text-on-surface-variant",
  };
  const badgeText: Record<string, string> = {
    PENDING: "Menunggu Check-in", CHECKED_IN: "Sedang Digunakan",
    CANCELLED: "Dibatalkan Otomatis", COMPLETED: "Selesai",
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-1">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${badge[data.status]}`}>{badgeText[data.status]}</span>
        <h1 className="font-headline text-2xl font-bold text-primary">{data.roomName}</h1>
        <p className="text-sm text-on-surface-variant">{data.buildingName}</p>
        <p className="font-semibold">
          {new Date(data.start).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          {" • "}{hm(data.start)} – {hm(data.end)}
        </p>
      </div>

      {data.status === "PENDING" && (
        <div className="rounded-xl bg-error-container p-3 text-on-error-container">
          <p className="text-sm font-bold">Check-in sebelum {hm(new Date(deadline).toISOString())}</p>
          <p className="font-mono text-2xl font-bold">{String(mm).padStart(2, "0")}m : {String(ss).padStart(2, "0")}d</p>
          <p className="text-xs">Jika terlambat, reservasi dibatalkan otomatis.</p>
        </div>
      )}

      {cancelled ? (
        <div className="card text-center text-sm text-on-surface-variant">
          Reservasi dibatalkan karena tidak check-in dalam 15 menit. Silakan pesan ulang.
          <button className="btn-primary mt-3" onClick={() => router.push("/search")}>Cari Ruangan Lagi</button>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3">
          <QRCodeSVG value={data.token} size={224} level="M" includeMargin fgColor="#00236f" />
          <p className="text-center text-sm font-semibold text-primary">Pindai QR ini di panel pintu ruangan</p>
          <p className="text-xs text-on-surface-variant">Tingkatkan kecerahan layar untuk pemindaian optimal</p>
        </div>
      )}
    </div>
  );
}
