import { ok } from "@/lib/server";

// Hapus cookie sesi (cookie HttpOnly tidak bisa dihapus dari JavaScript browser).
export async function POST() {
  const res = ok({ ok: true });
  res.headers.set("Set-Cookie", "sn_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res;
}
