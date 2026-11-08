import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff } from "@/lib/server";

// Body: { closed: boolean, note?: string }  (close a room for maintenance / reopen it)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireStaff(req))) return err("Khusus staf gedung", 403);
  const b = await req.json().catch(() => ({}));
  const room = await prisma.room.update({ where: { id: params.id }, data: { closed: !!b.closed, closedNote: b.closed ? b.note ?? null : null } });
  return ok(room);
}
