'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPosData() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      unit: true,
    },
    where: {
      stockQty: { gt: 0 },
    },
    orderBy: { name: 'asc' },
  });

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
  });

  return { products, customers };
}

export async function createSale(data: {
  customerId?: string;
  items: Array<{ productId: string; qty: number; unitPrice: number; isSaleApplied: boolean; totalPrice: number }>;
  subtotal: number;
  discountAmount: number;
  netTotal: number;
  paymentType: string;
  advancePaid?: number; // Added advancePaid property
}) {
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
  
  // Default Admin User ID
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const sale = await prisma.sale.create({
    data: {
      invoiceNo,
      userId: user.id,
      customerId: data.customerId || null,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      netTotal: data.netTotal,
      paymentType: data.paymentType,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          isSaleApplied: item.isSaleApplied,
          totalPrice: item.totalPrice,
        })),
      },
    },
  });

  // Inventory stock update
  for (const item of data.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQty: { decrement: item.qty },
      },
    });
  }

  // Agar Installment/Udhaar payment hai toh advance calculate karke ledger update karein
  if (data.paymentType === 'INSTALLMENT' && data.customerId) {
    const advance = Number(data.advancePaid) || 0;
    const remaining = Math.max(0, data.netTotal - advance);

    await prisma.installment.create({
      data: {
        saleId: sale.id,
        customerId: data.customerId,
        totalAmount: data.netTotal,
        paidAmount: advance, // Save advance amount correctly
        remainingAmount: remaining, // Calculate correct balance
        status: remaining === 0 ? 'COMPLETED' : 'PENDING',
        ...(advance > 0 && {
          payments: {
            create: {
              amountPaid: advance,
              notes: 'Advance Paid at POS Checkout',
            },
          },
        }),
      },
    });

    // Customer balance mein sirf baki (remaining) amount add hoga
    await prisma.customer.update({
      where: { id: data.customerId },
      data: {
        totalDue: { increment: remaining },
      },
    });
  }

  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/installments');
  return sale;
}

// POS Modal se Quick Customer Create karna
export async function addCustomerQuick(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = (formData.get('phone') as string) || null;
  const cnic = (formData.get('cnic') as string) || null;

  if (!name) return null;

  const newCustomer = await prisma.customer.create({
    data: {
      name,
      phone: phone || undefined,
      cnic: cnic || undefined,
    },
  });

  revalidatePath('/pos');
  revalidatePath('/installments');
  return newCustomer;
}