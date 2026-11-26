import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const rooms: [string, number][] = [
  ["Nook Alpha 204", 2], ["Lab Studio 108", 1], ["Kwalab Hub 312", 3], ["Focus Pod 402", 4],
  ["Tekno Pod 214", 2], ["Collab Space 301", 3], ["Ruang Diskusi 202", 2],
  ["Study Nook Silent 105", 1], ["Meeting Room 401", 4], ["Innovation Lab 310", 3],
  ["Toilet Lt. 1", 1], ["Toilet Lt. 2", 2], ["Lobi & Koridor", 1],
];

async function main() {
  for (const [name, floor] of rooms) {
    await prisma.room.upsert({ where: { name }, update: { floor }, create: { name, floor, building: "Gedung Utama" } });
  }
  const users = [
    { campusId: "2401234567", name: "Rafi Pratama", email: "rafi@mail.ac.id", role: "STUDENT" },
    { campusId: "198001012005011001", name: "Dr. Sari Wulandari", email: "sari@staff.ac.id", role: "LECTURER" },
    { campusId: "STAFF001", name: "Bambang S.", email: "bambang@staff.ac.id", role: "STAFF" },
  ];
  for (const u of users) await prisma.user.upsert({ where: { campusId: u.campusId }, update: {}, create: u });
  console.log("Seeded", rooms.length, "lokasi dan", users.length, "pengguna");
}
main().finally(() => prisma.$disconnect());
