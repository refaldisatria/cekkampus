import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const domains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
export const domainOk = (email?: string | null) => {
  if (!email) return false;
  if (!domains.length) return process.env.NODE_ENV !== "production"; // production must set ALLOWED_EMAIL_DOMAINS
  return domains.includes(email.split("@")[1]?.toLowerCase() ?? "");
};
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12); // equalises timing for unknown users

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 3600 },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" })] : []),
    ...(process.env.AZURE_AD_CLIENT_ID
      ? [AzureAD({ clientId: process.env.AZURE_AD_CLIENT_ID, clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "", tenantId: process.env.AZURE_AD_TENANT_ID })]
      : []),
    Credentials({
      name: "NIM / Email",
      credentials: { id: { label: "NIM / NIDN / Email" }, password: { label: "Password", type: "password" } },
      async authorize(c) {
        const raw = String(c?.id ?? "").trim();
        const u = raw ? await prisma.user.findFirst({ where: { OR: [{ email: raw.toLowerCase() }, { campusId: raw }] } }) : null;
        const good = await bcrypt.compare(String(c?.password ?? ""), u?.passwordHash ?? DUMMY_HASH);
        return u && u.active && u.passwordHash && good ? { id: u.id, name: u.name, email: u.email } : null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;
      const email = user.email?.toLowerCase();
      if (!email || !domainOk(email)) return false;
      if (account?.provider === "google" && !(profile as { email_verified?: boolean } | undefined)?.email_verified) return false;
      const db = await prisma.user.upsert({ where: { email }, update: {}, create: { email, campusId: email, name: user.name ?? email, role: "STUDENT" } });
      return db.active;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const email = user.email?.toLowerCase();
        const db = account?.provider === "credentials" ? await prisma.user.findUnique({ where: { id: user.id } }) : email ? await prisma.user.findUnique({ where: { email } }) : null;
        token.uid = db?.id;
      }
      if (token.uid) {
        const db = await prisma.user.findUnique({ where: { id: token.uid as string } }); // role changes and deactivation apply immediately
        if (!db || !db.active) return {};
        token.role = db.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) Object.assign(session.user, { id: token.uid, role: token.role });
      return session;
    },
  },
};
