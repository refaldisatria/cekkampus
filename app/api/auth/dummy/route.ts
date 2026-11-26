import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/server";

// Simulated campus SSO. Body: { campusId, role?: STUDENT|LECTURER, name? }
// Peran STAFF tidak bisa dibuat lewat endpoint ini; hanya dari seed/database.
export async function POST(req: Request) {
  if (process.env.DEMO_LOGIN !== "true") return err("Login demo dinonaktifkan", 403);
  const b = await req.json().catch(() => ({}));
  const campusId = String(b.campusId ?? "").trim();
  if (!campusId) return err("NIM/NIDN atau email wajib diisi");
  const role = b.role === "LECTURER" ? "LECTURER" : "STUDENT";
  const user = await prisma.user.upsert({
    where: { campusId },
    update: {},
    create: { campusId, role, name: b.name ?? campusId, email: `${campusId}@demo.campus` },
  });
  const res = ok(user);
  res.headers.set("Set-Cookie", `sn_user=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  return res;
}
