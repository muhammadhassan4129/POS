'use server';

import { prisma } from '@/src/lib/prisma'; // Apne prisma client ka path use karein
import { revalidatePath } from 'next/cache';

export async function getStoreSettings() {
  try {
    const storeSetting = (prisma as typeof prisma & { storeSetting: any }).storeSetting;
    let settings = await storeSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await storeSetting.create({
        data: { id: 'default' },
      });
    }

    return settings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return null;
  }
}

export async function updateStoreSettings(data: {
  storeName: string;
  phone: string;
  address: string;
  receiptFooterMsg: string;
}) {
  try {
    const storeSetting = (prisma as typeof prisma & { storeSetting: any }).storeSetting;
    await storeSetting.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}