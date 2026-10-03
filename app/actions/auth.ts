'use server';

import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and Password are required' };
  }

  // Fetch user with page permissions
  const user = await prisma.user.findUnique({
    where: { username },
    include: { permissions: true },
  });

  if (!user || user.password !== password) {
    // Note: Production mein bcrypt.compare() use karein
    return { error: 'Invalid username or password' };
  }

  // Save session cookie
  const cookieStore = await cookies();
  cookieStore.set('userId', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 Days session
    path: '/',
  });

  redirect('/');
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/login');
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}