import { prisma } from "@/lib/prisma";
import { ok, err, getUser } from "@/lib/server";

export const dynamic = "force-dynamic";

// Detail + linimasa + pesan. Hanya pelapor atau staf.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const u = await getUser(req);
  if (!u) return err("Belum login", 401);
  const c = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      room: true,
      user: { select: { name: true, campusId: true } },
      events: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, role: true } } } },
    },
  });
  if (!c) return err("Keluhan tidak ditemukan", 404);
  if (c.userId !== u.id && u.role !== "STAFF") return err("Bukan keluhan Anda", 403);
  return ok({ ...c, viewer: { id: u.id, role: u.role } });
}
