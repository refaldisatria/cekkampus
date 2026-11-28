import { prisma } from "@/lib/prisma";
import { ok, err, getUser } from "@/lib/server";
import { CATEGORIES, MIN_DESC, MAX_DESC, OPEN_STATUSES, MAX_OPEN_PER_USER_ROOM, SLA_MS, isPhoto } from "@/lib/rules";

export const dynamic = "force-dynamic";

// Keluhan saya (tanpa foto, supaya ringan)
export async function GET(req: Request) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  return ok(
    await prisma.complaint.findMany({
      where: { userId: u.id },
      select: { id: true, category: true, description: true, status: true, urgent: true, dueAt: true, createdAt: true, staffNote: true, room: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
  );
}

// Buat keluhan: { roomId, category, description, urgent?, photo? }
export async function POST(req: Request) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  const b = await req.json().catch(() => ({}));
  const description = String(b.description ?? "").trim();
  if (!CATEGORIES.includes(b.category)) return err("Kategori tidak valid");
  if (description.length < MIN_DESC) return err(`Deskripsi minimal ${MIN_DESC} karakter`);
  if (description.length > MAX_DESC) return err(`Deskripsi maksimal ${MAX_DESC} karakter`);
  if (b.photo && !isPhoto(b.photo)) return err("Foto tidak valid atau terlalu besar");
  const room = await prisma.room.findUnique({ where: { id: String(b.roomId ?? "") } });
  if (!room) return err("Lokasi tidak ditemukan", 404);
  const open = await prisma.complaint.count({ where: { userId: u.id, roomId: room.id, status: { in: OPEN_STATUSES } } });
  if (open >= MAX_OPEN_PER_USER_ROOM) return err("Keluhan terbuka untuk lokasi ini sudah terlalu banyak, tunggu staf menanganinya", 429);
  const urgent = b.urgent === true;
  const c = await prisma.complaint.create({
    data: {
      userId: u.id, roomId: room.id, category: b.category, description, urgent,
      photoBefore: b.photo || null,
      dueAt: new Date(Date.now() + SLA_MS[urgent ? "urgent" : "normal"]),
      events: { create: { type: "DITERIMA", text: urgent ? "Laporan diterima dengan prioritas darurat" : "Laporan diterima" } },
    },
    select: { id: true },
  });
  return ok(c, 201);
}
