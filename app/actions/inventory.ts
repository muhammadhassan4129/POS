'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getInventoryData() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      unit: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    include: { parent: true },
  });

  const units = await prisma.unit.findMany();

  return { products, categories, units };
}

export async function addProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const barcode = (formData.get('barcode') as string) || (formData.get('code') as string) || null;
  const categoryId = formData.get('categoryId') as string;
  const unitId = formData.get('unitId') as string;
  const purchasePrice = parseFloat(formData.get('purchasePrice') as string) || 0;
  const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
  const stockQty = parseFloat(formData.get('stockQty') as string) || 0;
  const isOnSale = formData.get('isOnSale') === 'true';

  await prisma.product.create({
    data: {
      name,
      barcode,
      categoryId,
      unitId,
      purchasePrice,
      salePrice,
      stockQty,
      isOnSale,
    },
  });

  revalidatePath('/inventory');
}

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const barcode = (formData.get('barcode') as string) || (formData.get('code') as string) || null;
  const categoryId = formData.get('categoryId') as string;
  const unitId = formData.get('unitId') as string;
  const purchasePrice = parseFloat(formData.get('purchasePrice') as string) || parseFloat(formData.get('costPrice') as string) || 0;
  const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
  const stockQty = parseFloat(formData.get('stockQty') as string) || 0;
  const isOnSale = formData.get('isOnSale') === 'true';

  if (!id || !name) return;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      barcode,
      categoryId,
      unitId,
      purchasePrice,
      salePrice,
      stockQty,
      isOnSale,
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/pos');
}

export async function deleteProduct(id: string) {
  try {
    await prisma.saleItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/inventory');
    revalidatePath('/pos');
  } catch (error) {
    console.error('Failed to delete product:', error);
  }
}