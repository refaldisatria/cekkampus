import { prisma } from "@/lib/prisma";
import { ok, err, getUser } from "@/lib/server";

// Kirim pesan: { body }. Pelapor atau staf.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  const c = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!c) return err("Keluhan tidak ditemukan", 404);
  if (c.userId !== u.id && u.role !== "STAFF") return err("Bukan keluhan Anda", 403);
  const b = await req.json().catch(() => ({}));
  const body = String(b.body ?? "").trim();
  if (!body || body.length > 500) return err("Pesan 1-500 karakter");
  return ok(await prisma.complaintMessage.create({ data: { complaintId: c.id, userId: u.id, body } }), 201);
}
