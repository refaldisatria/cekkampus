import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { GRACE_MS } from "./rules";

export const ok = (data: unknown, status = 200) => Response.json(data, { status });
export const err = (message: string, status = 400) => Response.json({ error: message }, { status });

// Current user from the NextAuth session (null when not signed in or deactivated). Contains passwordHash: never return it to clients.
export async function getUser(_req?: Request) {
  const s = await getServerSession(authOptions);
  const id = (s?.user as { id?: string } | undefined)?.id;
  return id ? prisma.user.findFirst({ where: { id, active: true } }) : null;
}
export async function requireStaff(req?: Request) {
  const u = await getUser(req);
  return u && u.role === "STAFF" ? u : null;
}
// Lazy auto-release: called before reads so no cron is required (Vercel Hobby cron is daily only).
export const releaseExpired = () =>
  prisma.booking.updateMany({
    where: { status: "ACTIVE", startTime: { lt: new Date(Date.now() - GRACE_MS) } },
    data: { status: "RELEASED" },
  });
