'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPosData() {
  const products = await prisma.product.findMany({
    include: { category: true, unit: true },
    where: { stockQty: { gt: 0 } },
    orderBy: { name: 'asc' },
  });

  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });

  return { products, customers };
}

export async function createSale(data: {
  customerId?: string;
  items: Array<{ productId: string; qty: number; unitPrice: number; isSaleApplied: boolean; totalPrice: number; unitId?: string }>;
  subtotal: number;
  discountAmount: number;
  netTotal: number;
  paymentType: string;
  advancePaid?: number;
}) {
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  // Products fetch karo (unit conversion nikalne ke liye)
  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
    include: { unit: true },
  });

  // Har item ka baseQty (product ki unit ke conversion se)
  // e.g. Unit "Meter" pe conversion 4 hai => 1 qty = 4 meter katega
  const processedItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const conv =
      product?.unit?.conversionQty && product.unit.conversionQty > 0
        ? product.unit.conversionQty
        : 1;

    return {
      ...item,
      baseQty: item.qty * conv,
      soldUnitId: product?.unitId || null,
    };
  });

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
        create: processedItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          isSaleApplied: item.isSaleApplied,
          totalPrice: item.totalPrice,
          soldUnitId: item.soldUnitId,
          baseQty: item.baseQty,
        })),
      },
    },
  });

  // Stock baseQty se kamega (1 suit = 4 meter => 4 minus)
  for (const item of processedItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQty: { decrement: item.baseQty } },
    });
  }

  // Udhaar/Khata sale handling
  if (data.paymentType === 'INSTALLMENT' && data.customerId) {
    const advance = Number(data.advancePaid) || 0;
    const remaining = Math.max(0, data.netTotal - advance);

    await prisma.installment.create({
      data: {
        saleId: sale.id,
        customerId: data.customerId,
        totalAmount: data.netTotal,
        paidAmount: advance,
        remainingAmount: remaining,
        status: remaining === 0 ? 'COMPLETED' : 'PENDING',
        ...(advance > 0 && {
          payments: { create: { amountPaid: advance, notes: 'Advance Paid at POS Checkout' } },
        }),
      },
    });

    await prisma.customer.update({
      where: { id: data.customerId },
      data: { totalDue: { increment: remaining } },
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