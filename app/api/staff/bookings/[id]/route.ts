import { prisma } from "@/lib/prisma";
import { ok, err, requireStaff } from "@/lib/server";

// Staff override: cancel any live booking.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireStaff(req))) return err("Khusus staf gedung", 403);
  return ok(await prisma.booking.update({ where: { id: params.id }, data: { status: "CANCELLED" } }));
}
