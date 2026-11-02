import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const building = await prisma.building.upsert({
    where: { name: "Perpustakaan Pusat" },
    update: {},
    create: { name: "Perpustakaan Pusat" },
  });

  const users = [
    { name: "Rafi Pratama", email: "rafi.pratama@mail.ac.id", role: "STUDENT" as const },
    { name: "Nadia Savitri", email: "nadia.savitri@mail.ac.id", role: "STUDENT" as const },
    { name: "Bambang Supriyanto", email: "bambang@staff.ac.id", role: "STAFF" as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  if ((await prisma.room.count({ where: { buildingId: building.id } })) === 0) {
    const rooms = [
      ["Nook Alpha 201", 4], ["Nook Alpha 202", 4], ["Nook Alpha 203", 6],
      ["Nook Alpha 204", 6], ["Collab Space 301", 8], ["Collab Space 302", 8],
      ["Kreatif Hub 312", 15], ["Focus Pod 401", 2], ["Focus Pod 402", 2],
      ["Tekno Pod 214", 8],
    ] as const;
    await prisma.room.createMany({
      data: rooms.map(([name, capacity]) => ({ name, capacity, buildingId: building.id })),
    });
  }
  console.log("Seed selesai: 1 gedung, 10 ruangan, 3 user.");
}

main().finally(() => prisma.$disconnect());
