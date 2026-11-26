import { readFileSync } from "fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// CSV header: campusId,email,name,role,password   (role: STUDENT|LECTURER|STAFF; password optional = Google/Microsoft login only)
// No commas inside values. Run: npm run user:import -- users.csv
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run user:import -- users.csv");
  const [head, ...rows] = readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const cols = head.split(",").map((c) => c.trim());
  for (const line of rows) {
    const v = Object.fromEntries(line.split(",").map((x, i) => [cols[i], x.trim()])) as Record<string, string>;
    if (!v.campusId || !v.email || !v.name) { console.log("Skip (incomplete):", line); continue; }
    const role = ["STUDENT", "LECTURER", "STAFF"].includes(v.role) ? v.role : "STUDENT";
    if (v.password && v.password.length < 8) { console.log("Skip (password < 8 chars):", v.campusId); continue; }
    const passwordHash = v.password ? await bcrypt.hash(v.password, 12) : undefined;
    const email = v.email.toLowerCase();
    await prisma.user.upsert({
      where: { campusId: v.campusId },
      update: { email, name: v.name, role, ...(passwordHash ? { passwordHash } : {}) },
      create: { campusId: v.campusId, email, name: v.name, role, passwordHash },
    });
    console.log("OK:", v.campusId, role);
  }
}
main().finally(() => prisma.$disconnect());
