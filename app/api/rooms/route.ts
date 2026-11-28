import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/server";

export const dynamic = "force-dynamic"; // baca database saat diminta, bukan saat build

export async function GET() {
  return ok(await prisma.room.findMany({ orderBy: [{ building: "asc" }, { floor: "asc" }, { name: "asc" }] }));
}
