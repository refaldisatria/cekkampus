import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff } from "@/lib/server";
import { STATUSES, TRANSITIONS } from "@/lib/rules";

// Ubah status / catatan staf: { status?, staffNote? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireStaff(req))) return err("Khusus staf", 403);
  const b = await req.json().catch(() => ({}));
  const c = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!c) return err("Keluhan tidak ditemukan", 404);
  const data: { status?: string; staffNote?: string; resolvedAt?: Date } = {};
  if (b.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(b.status)) return err("Status tidak valid");
    if (b.status !== c.status) {
      if (!TRANSITIONS[c.status].includes(b.status)) return err(`Tidak bisa mengubah ${c.status} menjadi ${b.status}`, 409);
      data.status = b.status;
      if (b.status === "SELESAI") data.resolvedAt = new Date();
    }
  }
  if (b.staffNote !== undefined) data.staffNote = String(b.staffNote).slice(0, 500);
  if (!Object.keys(data).length) return err("Tidak ada perubahan");
  return ok(await prisma.complaint.update({ where: { id: c.id }, data, include: { room: true } }));
}
