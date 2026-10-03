'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

// Only async functions are exported from this file now!

export async function getUsersData() {
  const users = await prisma.user.findMany({
    include: { permissions: true },
    orderBy: { createdAt: 'desc' },
  });
  return { users };
}

export async function addUser(data: {
  name: string;
  username: string;
  password: string;
  role: string;
  permissions: { pageRoute: string; canAccess: boolean }[];
}) {
  if (!data.name || !data.username || !data.password) {
    throw new Error('Name, Username and Password are required');
  }

  await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      password: data.password,
      role: data.role,
      permissions: {
        create: data.permissions,
      },
    },
  });

  revalidatePath('/users');
}

export async function updateUser(
  userId: string,
  data: {
    name: string;
    username: string;
    password?: string;
    role: string;
    permissions: { pageRoute: string; canAccess: boolean }[];
  }
) {
  const updatePayload: any = {
    name: data.name,
    username: data.username,
    role: data.role,
  };

  if (data.password && data.password.trim() !== '') {
    updatePayload.password = data.password;
  }

  await prisma.$transaction([
    prisma.pagePermission.deleteMany({
      where: { userId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        ...updatePayload,
        permissions: {
          create: data.permissions,
        },
      },
    }),
  ]);

  revalidatePath('/users');
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  revalidatePath('/users');
}