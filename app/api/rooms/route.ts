import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/server";

// Baca database saat ada permintaan, bukan saat build.
export const dynamic = "force-dynamic";

// Daftar lokasi untuk dropdown form keluhan.
export async function GET() {
  return ok(await prisma.room.findMany({ orderBy: [{ building: "asc" }, { floor: "asc" }, { name: "asc" }] }));
}