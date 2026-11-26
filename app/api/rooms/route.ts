import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/server";

// Daftar lokasi untuk dropdown form keluhan.
export async function GET() {
  return ok(await prisma.room.findMany({ orderBy: [{ building: "asc" }, { floor: "asc" }, { name: "asc" }] }));
}
