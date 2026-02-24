import prisma from '@/lib/prisma';
import 'dotenv/config'

export async function main() {
  await prisma.user.create({
    data: {
      id: "clh9g5l8c0000v6l3yqjv1y7",
      name: "Test User",
      email: "test@example.com",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });
}

main();