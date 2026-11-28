import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff } from "@/lib/server";
import { STATUSES, TRANSITIONS, FINAL_STATUSES, isPhoto } from "@/lib/rules";

// Staf: { status?, staffNote?, photoAfter? }. Setiap perubahan masuk linimasa.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const staff = await requireStaff(req);
  if (!staff) return err("Khusus staf", 403);
  const b = await req.json().catch(() => ({}));
  const c = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!c) return err("Keluhan tidak ditemukan", 404);
  const note = b.staffNote !== undefined ? String(b.staffNote).trim().slice(0, 500) : undefined;
  const data: { status?: string; resolvedAt?: Date; staffNote?: string; photoAfter?: string } = {};
  let ev: { type: string; text: string } | null = null;
  if (b.status !== undefined && b.status !== c.status) {
    if (!(STATUSES as readonly string[]).includes(b.status)) return err("Status tidak valid");
    if (!TRANSITIONS[c.status].includes(b.status)) return err(`Tidak bisa mengubah ${c.status} menjadi ${b.status}`, 409);
    data.status = b.status;
    if (FINAL_STATUSES.includes(b.status)) data.resolvedAt = new Date();
    ev = { type: b.status, text: note || ({ DIPROSES: "Keluhan sedang ditangani staf", SELESAI: "Perbaikan selesai", DITOLAK: "Keluhan ditolak" } as Record<string, string>)[b.status] };
  } else if (note) ev = { type: "CATATAN", text: note };
  if (note !== undefined) data.staffNote = note;
  if (b.photoAfter !== undefined) {
    if (!isPhoto(b.photoAfter)) return err("Foto tidak valid atau terlalu besar");
    data.photoAfter = b.photoAfter;
    if (!ev) ev = { type: "CATATAN", text: "Foto hasil perbaikan ditambahkan" };
  }
  if (!ev && !Object.keys(data).length) return err("Tidak ada perubahan");
  await prisma.complaint.update({
    where: { id: c.id },
    data: { ...data, ...(ev ? { events: { create: { ...ev, actorId: staff.id } } } : {}) },
  });
  return ok({ ok: true });
}
