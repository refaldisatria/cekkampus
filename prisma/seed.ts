import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const rooms: [string, number, number, string][] = [
  ["Nook Alpha 204", 6, 2, "tv,wb,pw,ac"],
  ["Lab Studio 108", 10, 1, "pj,wb,pw,ac"],
  ["Kwalab Hub 312", 8, 3, "tv,wb,ac"],
  ["Focus Pod 402", 4, 4, "pw,ac"],
  ["Tekno Pod 214", 6, 2, "pj,pw,ac"],
  ["Collab Space 301", 15, 3, "tv,pj,wb,pw,ac"],
  ["Ruang Diskusi 202", 8, 2, "wb,pw"],
  ["Study Nook Silent 105", 4, 1, "pw,ac"],
  ["Meeting Room 401", 12, 4, "pj,tv,wb,ac"],
  ["Innovation Lab 310", 10, 3, "pj,tv,wb,pw,ac"],
];

async function main() {
  for (const [name, capacity, floor, facilities] of rooms) {
    await prisma.room.upsert({
      where: { name },
      update: { capacity, floor, facilities },
      create: { name, capacity, floor, facilities, building: "Gedung Utama" },
    });
  }
  console.log("Seeded", rooms.length, "rooms");
}
main().finally(() => prisma.$disconnect());
