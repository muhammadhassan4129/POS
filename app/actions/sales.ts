'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSalesData() {
  const sales = await prisma.sale.findMany({
    include: {
      customer: true,
      installment: true,
      items: {
        include: {
          product: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { sales };
}

export async function returnSaleItem(
  saleItemId: string,
  returnQty: number,
  refundMethod: 'KHATA' | 'CASH' = 'KHATA'
) {
  if (returnQty <= 0) throw new Error('Return quantity must be greater than zero.');

  const saleItem = await prisma.saleItem.findUnique({
    where: { id: saleItemId },
    include: { sale: { include: { items: true, installment: true, customer: true } } },
  });

  if (!saleItem) throw new Error('Sale item not found.');

  if (returnQty > saleItem.qty) {
    throw new Error('Return quantity cannot be greater than purchased quantity.');
  }

  const sale = saleItem.sale;
  const refundAmount = returnQty * saleItem.unitPrice;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: saleItem.productId },
      data: {
        stockQty: { increment: returnQty },
      },
    });

    if (returnQty === saleItem.qty) {
      await tx.saleItem.delete({
        where: { id: saleItemId },
      });
    } else {
      const updatedQty = saleItem.qty - returnQty;
      await tx.saleItem.update({
        where: { id: saleItemId },
        data: {
          qty: updatedQty,
          totalPrice: updatedQty * saleItem.unitPrice,
        },
      });
    }

    const remainingItems = sale.items.filter(
      (item) => item.id !== saleItemId || item.qty > returnQty
    );

    if (remainingItems.length === 0) {
      if (sale.paymentType === 'INSTALLMENT' && sale.customerId) {
        const installment = sale.installment;
        const amountToReduce = installment ? installment.totalAmount : sale.netTotal;

        if (refundMethod === 'KHATA') {
          const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
          const currentDue = customer?.totalDue ?? 0;
          const newDue = Math.max(0, currentDue - amountToReduce);

          await tx.customer.update({
            where: { id: sale.customerId },
            data: { totalDue: newDue },
          });

          if (installment) {
            await tx.installmentPayment.create({
              data: {
                installmentId: installment.id,
                amountPaid: 0,
                notes: `Full Return Adjusted to Khata: -Rs. ${amountToReduce}`,
              },
            });

            await tx.installment.update({
              where: { id: installment.id },
              data: {
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
                status: 'COMPLETED',
              },
            });
          }
        } else {
          if (installment) {
            await tx.installmentPayment.create({
              data: {
                installmentId: installment.id,
                amountPaid: 0,
                notes: `Full Return Cash Refund Paid: Rs. ${sale.netTotal}`,
              },
            });
            await tx.installment.delete({
              where: { id: installment.id },
            });
          }
        }
      }

      await tx.sale.delete({ where: { id: sale.id } });
    } else {
      const newSubtotal = Math.max(0, sale.subtotal - refundAmount);
      const newNetTotal = Math.max(0, sale.netTotal - refundAmount);

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          subtotal: newSubtotal,
          netTotal: newNetTotal,
        },
      });

      if (sale.paymentType === 'INSTALLMENT' && sale.customerId && sale.installment) {
        const installment = sale.installment;
        const newTotalAmount = Math.max(0, installment.totalAmount - refundAmount);

        if (refundMethod === 'KHATA') {
          const newRemaining = Math.max(0, installment.remainingAmount - refundAmount);

          const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
          const currentDue = customer?.totalDue ?? 0;
          const newDue = Math.max(0, currentDue - refundAmount);

          await tx.customer.update({
            where: { id: sale.customerId },
            data: { totalDue: newDue },
          });

          await tx.installment.update({
            where: { id: installment.id },
            data: {
              totalAmount: newTotalAmount,
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? 'COMPLETED' : 'PENDING',
              payments: {
                create: {
                  amountPaid: 0,
                  notes: `Item Return Adjusted to Khata: -Rs. ${refundAmount}`,
                },
              },
            },
          });
        } else {
          await tx.installment.update({
            where: { id: installment.id },
            data: {
              totalAmount: newTotalAmount,
              payments: {
                create: {
                  amountPaid: refundAmount,
                  notes: `Item Return Cash Refund Paid: Rs. ${refundAmount}`,
                },
              },
            },
          });
        }
      }
    }
  });

  revalidatePath('/sales');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/installments');
}

export async function returnSale(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, installment: true, customer: true },
  });

  if (!sale) throw new Error('Sale record not found');

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.qty } },
      });
    }

    if (sale.paymentType === 'INSTALLMENT' && sale.customerId) {
      const installment = sale.installment;
      const amountToReduce = installment ? installment.totalAmount : sale.netTotal;

      if (sale.customer) {
        const currentDue = sale.customer.totalDue ?? 0;
        const newDue = Math.max(0, currentDue - amountToReduce);
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalDue: newDue,
          },
        });
      }

      if (installment) {
        await tx.installmentPayment.deleteMany({
          where: { installmentId: installment.id },
        });

        await tx.installment.delete({
          where: { id: installment.id },
        });
      }
    }

    await tx.saleItem.deleteMany({
      where: { saleId: sale.id },
    });

    await tx.sale.delete({
      where: { id: saleId },
    });
  });

  revalidatePath('/sales');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/installments');
}