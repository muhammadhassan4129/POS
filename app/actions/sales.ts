'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

// HELPER: Return ki khata deduction ko pending installments me distribute karta hai
// (bilkul recordCustomerPayment jaisa pattern — taake installment.remainingAmount
// aur customer.totalDue hamesha sync rahe)
async function applyKhataDeductionFromReturn(
  tx: any,
  customerId: string,
  amount: number,
  note: string
) {
  const pendingInstallments = await tx.installment.findMany({
    where: { customerId, status: 'PENDING', remainingAmount: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });

  let remaining = amount;
  const firstInstId: string | null = pendingInstallments[0]?.id || null;

  for (const inst of pendingInstallments) {
    if (remaining <= 0) break;

    const apply = Math.min(remaining, inst.remainingAmount);
    const newPaid = inst.paidAmount + apply;
    const newRemaining = Math.max(0, inst.totalAmount - newPaid);

    await tx.installment.update({
      where: { id: inst.id },
      data: {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'COMPLETED' : 'PENDING',
      },
    });

    remaining -= apply;
  }

  // Customer ka totalDue kam karo
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  const currentDue = customer?.totalDue ?? 0;
  await tx.customer.update({
    where: { id: customerId },
    data: { totalDue: Math.max(0, currentDue - amount) },
  });

  // History log (dashboard isay payment nahi ginta — "Return Adjustment" note)
  if (firstInstId) {
    await tx.installmentPayment.create({
      data: { installmentId: firstInstId, amountPaid: amount, notes: note },
    });
  }
}

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
  refundMethod: 'KHATA' | 'CASH' = 'KHATA',
  notes?: string,
  khataDeductAmount?: number
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
  const basePerUnit = saleItem.baseQty && saleItem.qty ? saleItem.baseQty / saleItem.qty : 1;
  const refundAmount = returnQty * saleItem.unitPrice;

  const isInstallmentSale = sale.paymentType === 'INSTALLMENT';

  // ===== CUSTOM KHATA CUT =====
  // Sirf CASH payment wali khata-customer sale pe chalta hai.
  // Default: poora refund khata se cut hoga. Sale man kam amount de to utna hi katega,
  // baqi amount cash refund maana jayega.
  let khataCut = refundAmount;
  if (sale.customerId && !isInstallmentSale && refundMethod === 'KHATA') {
    if (khataDeductAmount !== undefined && khataDeductAmount !== null) {
      if (!Number.isFinite(khataDeductAmount) || khataDeductAmount <= 0) {
        throw new Error('Khata cut amount must be greater than zero.');
      }
      if (khataDeductAmount > refundAmount) {
        throw new Error(
          `Khata cut (Rs. ${khataDeductAmount}) refund amount (Rs. ${refundAmount}) se zyada nahi ho sakti.`
        );
      }
      khataCut = khataDeductAmount;
    }
  }

  const cashPortion = Math.max(0, refundAmount - khataCut);

  const logNote = `Return Adjustment: ${
    notes?.trim() || `Rs. ${refundAmount} item return me se khata adjust hua`
  }${cashPortion > 0 ? ` (other Rs. ${cashPortion.toFixed(0)} cash refund)` : ''}`;

  await prisma.$transaction(async (tx) => {
    // Stock wapis
    await tx.product.update({
      where: { id: saleItem.productId },
      data: {
        stockQty: { increment: returnQty * basePerUnit },
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
          baseQty: updatedQty * basePerUnit,
        },
      });
    }

    const remainingItems = sale.items.filter(
      (item) => item.id !== saleItemId || item.qty > returnQty
    );

    if (remainingItems.length === 0) {
      // ===== FULL RETURN (ye aakhri item tha) =====
      if (isInstallmentSale && sale.customerId) {
        const installment = sale.installment;
        // remainingAmount use hota hai (advance wala hisaab sahi rahega)
        const amountToReduce = installment ? installment.remainingAmount : sale.netTotal;

        const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
        const currentDue = customer?.totalDue ?? 0;
        const newDue = Math.max(0, currentDue - amountToReduce);

        await tx.customer.update({
          where: { id: sale.customerId },
          data: { totalDue: newDue },
        });

        if (installment) {
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
      } else if (sale.customerId && refundMethod === 'KHATA') {
        // Custom amount (default: full refund) khata se cut hoga
        await applyKhataDeductionFromReturn(tx, sale.customerId, khataCut, logNote);
      }

      await tx.sale.delete({ where: { id: sale.id } });
    } else {
      // ===== PARTIAL RETURN =====
      const newSubtotal = Math.max(0, sale.subtotal - refundAmount);
      const newNetTotal = Math.max(0, sale.netTotal - refundAmount);

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          subtotal: newSubtotal,
          netTotal: newNetTotal,
        },
      });

      if (isInstallmentSale && sale.customerId && sale.installment) {
        const installment = sale.installment;
        const newTotalAmount = Math.max(0, installment.totalAmount - refundAmount);
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
          },
        });
      } else if (sale.customerId && refundMethod === 'KHATA') {
        // Custom amount (default: full refund) khata se cut hoga
        await applyKhataDeductionFromReturn(tx, sale.customerId, khataCut, logNote);
      }
    }
  });

  revalidatePath('/sales');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/installments');
}

export async function returnSale(
  saleId: string,
  refundMethod: 'KHATA' | 'CASH' = 'KHATA',
  notes?: string,
  khataDeductAmount?: number
) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, installment: true, customer: true },
  });

  if (!sale) throw new Error('Sale record not found');

  // ===== CUSTOM KHATA CUT =====
  // Sirf CASH payment wali khata-customer sale pe chalta hai.
  let khataCut = sale.netTotal;
  if (sale.customerId && sale.paymentType !== 'INSTALLMENT' && refundMethod === 'KHATA') {
    if (khataDeductAmount !== undefined && khataDeductAmount !== null) {
      if (!Number.isFinite(khataDeductAmount) || khataDeductAmount <= 0) {
        throw new Error('Khata cut amount must be greater than zero.');
      }
      if (khataDeductAmount > sale.netTotal) {
        throw new Error(
          `Khata cut (Rs. ${khataDeductAmount}) refund amount (Rs. ${sale.netTotal}) se zyada nahi ho sakti.`
        );
      }
      khataCut = khataDeductAmount;
    }
  }

  const cashPortion = Math.max(0, sale.netTotal - khataCut);

  const logNote = `Return Adjustment: ${
    notes?.trim() || `Rs. ${sale.netTotal} full return me se khata adjust hua`
  }${cashPortion > 0 ? ` (Other Rs. ${cashPortion.toFixed(0)} cash refund)` : ''}`;

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.baseQty ?? item.qty } },
      });
    }

    if (sale.paymentType === 'INSTALLMENT' && sale.customerId) {
      const installment = sale.installment;
      // remainingAmount use hota hai
      const amountToReduce = installment ? installment.remainingAmount : sale.netTotal;

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
    } else if (sale.customerId && refundMethod === 'KHATA') {
      // Custom amount (default: full refund) khata se cut hoga
      await applyKhataDeductionFromReturn(tx, sale.customerId, khataCut, logNote);
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