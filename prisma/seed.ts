import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Default Units
  const meter = await prisma.unit.upsert({
    where: { id: 'unit-meter' },
    update: {},
    create: { id: 'unit-meter', name: 'Meter', shortCode: 'm' },
  });

  const yard = await prisma.unit.upsert({
    where: { id: 'unit-yard' },
    update: {},
    create: { id: 'unit-yard', name: 'Yard', shortCode: 'yd' },
  });

  const suit = await prisma.unit.upsert({
    where: { id: 'unit-suit' },
    update: {},
    create: { id: 'unit-suit', name: 'Suit', shortCode: 'st' },
  });

  const piece = await prisma.unit.upsert({
    where: { id: 'unit-piece' },
    update: {},
    create: { id: 'unit-piece', name: 'Piece', shortCode: 'pc' },
  });

  // Create Default Parent Category
  const unstitched = await prisma.category.upsert({
    where: { id: 'cat-unstitched' },
    update: {},
    create: { id: 'cat-unstitched', name: 'Unstitched Fabric' },
  });

  // Create Sub-Categories
  await prisma.category.upsert({
    where: { id: 'cat-lawn' },
    update: {},
    create: { id: 'cat-lawn', name: 'Lawn Collection', parentId: unstitched.id },
  });

  await prisma.category.upsert({
    where: { id: 'cat-cotton' },
    update: {},
    create: { id: 'cat-cotton', name: 'Wash & Wear / Cotton', parentId: unstitched.id },
  });

  // Create Default Admin User
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'admin',
      password: 'adminpassword', // High priority plain password for local dev initial setup
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });