import { ok, releaseExpired } from "@/lib/server";
export const dynamic = "force-dynamic";
// Optional: call from an external cron (or Vercel Cron on a paid plan) for tidy data. Reads already release lazily.
export async function GET() {
  const r = await releaseExpired();
  return ok({ released: r.count });
}
