import { prisma } from "@/lib/prisma";
import { ok, err, getUser } from "@/lib/server";

// Pelapor membatalkan keluhannya selama masih BARU.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  const c = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!c || c.userId !== u.id) return err("Keluhan tidak ditemukan", 404);
  if (c.status !== "BARU") return err("Hanya keluhan berstatus BARU yang bisa dibatalkan", 409);
  await prisma.complaint.update({
    where: { id: c.id },
    data: { status: "BATAL", resolvedAt: new Date(), events: { create: { type: "BATAL", text: "Dibatalkan oleh pelapor", actorId: u.id } } },
  });
  return ok({ ok: true });
}
