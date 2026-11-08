import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { domainOk } from "@/lib/auth";
import { ok, err } from "@/lib/server";

// Self-registration. Disabled by default: it does not verify that the person owns the email address.
export async function POST(req: Request) {
  if (process.env.ALLOW_REGISTER !== "true") return err("Pendaftaran mandiri ditutup. Hubungi staf untuk dibuatkan akun.", 403);
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase(), campusId = String(b.campusId ?? "").trim(), name = String(b.name ?? "").trim(), password = String(b.password ?? "");
  if (!email || !campusId || !name) return err("Nama, NIM/NIDN, dan email wajib diisi");
  if (!domainOk(email)) return err("Gunakan email kampus", 403);
  if (password.length < 8) return err("Password minimal 8 karakter");
  if (await prisma.user.findFirst({ where: { OR: [{ email }, { campusId }] } })) return err("Akun sudah terdaftar", 409);
  await prisma.user.create({ data: { email, campusId, name, role: "STUDENT", passwordHash: await bcrypt.hash(password, 12) } });
  return ok({ ok: true }, 201); // role is always STUDENT; staff roles are granted by an admin only
}
