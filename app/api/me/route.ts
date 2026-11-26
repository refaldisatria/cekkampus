import { ok, err, getUser } from "@/lib/server";
export async function GET(req: Request) {
  const u = await getUser(req);
  return u ? ok(u) : err("Belum login", 401);
}
