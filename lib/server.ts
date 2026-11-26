import { prisma } from "./prisma";

export const ok = (data: unknown, status = 200) => Response.json(data, { status });
export const err = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function getUser(req: Request) {
  const m = (req.headers.get("cookie") ?? "").match(/sn_user=([^;]+)/);
  return m ? prisma.user.findUnique({ where: { id: m[1] } }) : null;
}
export async function requireStaff(req: Request) {
  const u = await getUser(req);
  return u && u.role === "STAFF" ? u : null;
}
