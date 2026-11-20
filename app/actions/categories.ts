'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategoriesAndUnitsData() {
  const categories = await prisma.category.findMany({
    include: { parent: true, children: true },
    orderBy: { name: 'asc' },
  });

  const units = await prisma.unit.findMany({
    orderBy: { name: 'asc' },
  });

  return { categories, units };
}

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const parentId = (formData.get('parentId') as string) || null;
  if (!name) return;

  await prisma.category.create({
    data: { name, parentId: parentId === 'NONE' ? null : parentId },
  });

  revalidatePath('/categories');
  revalidatePath('/inventory');
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const parentId = (formData.get('parentId') as string) || null;
  if (!id || !name) return;

  await prisma.category.update({
    where: { id },
    data: { name, parentId: parentId === 'NONE' ? null : parentId },
  });

  revalidatePath('/categories');
  revalidatePath('/inventory');
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/categories');
    revalidatePath('/inventory');
  } catch (error) {
    console.error('Failed to delete category:', error);
  }
}

// Measurement Unit Add karna (conversion ke sath)
export async function addUnit(formData: FormData) {
  const name = formData.get('name') as string;
  const shortCode = formData.get('shortCode') as string;
  const conversionQtyRaw = formData.get('conversionQty') as string;
  const conversionUnitName = (formData.get('conversionUnitName') as string)?.trim();

  if (!name || !shortCode) return;

  const conversionQty = conversionQtyRaw ? parseFloat(conversionQtyRaw) : null;
  const hasConversion = !!(conversionQty && conversionQty > 0 && conversionUnitName);

  await prisma.unit.create({
    data: {
      name,
      shortCode,
      conversionQty: hasConversion ? conversionQty : null,
      conversionUnitName: hasConversion ? conversionUnitName : null,
    },
  });

  revalidatePath('/categories');
  revalidatePath('/inventory');
}

export async function updateUnit(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const shortCode = formData.get('shortCode') as string;
  const conversionQtyRaw = formData.get('conversionQty') as string;
  const conversionUnitName = (formData.get('conversionUnitName') as string)?.trim();

  if (!id || !name || !shortCode) return;

  const conversionQty = conversionQtyRaw ? parseFloat(conversionQtyRaw) : null;
  const hasConversion = !!(conversionQty && conversionQty > 0 && conversionUnitName);

  await prisma.unit.update({
    where: { id },
    data: {
      name,
      shortCode,
      conversionQty: hasConversion ? conversionQty : null,
      conversionUnitName: hasConversion ? conversionUnitName : null,
    },
  });

  revalidatePath('/categories');
  revalidatePath('/inventory');
}

export async function deleteUnit(id: string) {
  try {
    await prisma.unit.delete({ where: { id } });
    revalidatePath('/categories');
    revalidatePath('/inventory');
  } catch (error) {
    console.error('Failed to delete unit:', error);
  }
}