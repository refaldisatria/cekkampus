import { NextRequest, NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Handler = (req: NextRequest, ctx: any) => Promise<Response>;

export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e?.code === "P2034")
        return NextResponse.json({ error: "Terjadi bentrok pemesanan, coba lagi." }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
  };
}

export function parseDate(v: unknown, label = "Tanggal"): Date {
  const d = new Date(String(v));
  if (isNaN(d.getTime())) throw new HttpError(400, `${label} tidak valid`);
  return d;
}
