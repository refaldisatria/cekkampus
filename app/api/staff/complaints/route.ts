import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff } from "@/lib/server";
import { STATUSES, CATEGORIES } from "@/lib/rules";

// Daftar semua keluhan. Filter: ?status=&category=&roomId=
export async function GET(req: Request) {
  if (!(await requireStaff(req))) return err("Khusus staf", 403);
  const q = new URL(req.url).searchParams;
  const status = q.get("status"), category = q.get("category"), roomId = q.get("roomId");
  return ok(
    await prisma.complaint.findMany({
      where: {
        ...(status && (STATUSES as readonly string[]).includes(status) ? { status } : {}),
        ...(category && (CATEGORIES as readonly string[]).includes(category) ? { category } : {}),
        ...(roomId ? { roomId } : {}),
      },
      include: { room: true, user: { select: { name: true, campusId: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
  );
}
