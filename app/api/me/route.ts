import { ok, err, getUser } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = await getUser(req);
  return u ? ok({ id: u.id, campusId: u.campusId, name: u.name, email: u.email, role: u.role }) : err("Belum login", 401);
}
