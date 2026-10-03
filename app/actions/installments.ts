'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getInstallmentsData() {
  const customers = await prisma.customer.findMany({
    include: {
      installments: {
        include: {
          sale: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              returns: true,
            },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return { customers };
}

export async function getInvoiceByNumber(invoiceNo: string) {
  try {
    const cleanInvoiceNo = invoiceNo.replace('#', '').trim();

    const sale = await prisma.sale.findFirst({
      where: {
        invoiceNo: {
          contains: cleanInvoiceNo,
        },
      },
      include: {
        customer: {
          include: {
            installments: {
              include: {
                payments: true,
              },
            },
          },
        },
        items: true,
        returns: true,
      },
    });

    if (!sale || !sale.customer) {
      return { success: false, message: 'Invoice not found in database.' };
    }

    return { success: true, sale: { ...sale, customerId: sale.customer.id } };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return { success: false, message: 'Server error while searching invoice.' };
  }
}

export async function addCustomer(formData: FormData) {
  const name = formData.get('name') as string;
  const fname = (formData.get('fname') as string) || null;
  const village = (formData.get('village') as string) || null;
  const reference = (formData.get('reference') as string) || null;
  const phone = (formData.get('phone') as string) || null;
  const cnic = (formData.get('cnic') as string) || null;

  if (!name) return;

  await prisma.customer.create({
    data: {
      name,
      fname,
      village,
      reference,
      phone: phone || undefined,
      cnic: cnic || undefined,
    },
  });

  revalidatePath('/installments');
  revalidatePath('/pos');
}
export async function deleteCustomer(formDataOrId: any) {
  // Handle both FormData, plain string ID, or empty object cases safely
  let id: string | null = null;

  if (typeof formDataOrId === 'string') {
    id = formDataOrId;
  } else if (formDataOrId instanceof FormData) {
    id = formDataOrId.get('id') as string;
  } else if (formDataOrId && typeof formDataOrId === 'object') {
    id = formDataOrId.id || null;
  }

  if (!id) {
    console.error('Delete Customer Error: Received invalid ID or empty object:', formDataOrId);
    throw new Error('Customer ID is missing or invalid.');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Pehle customer ki sari sales find karein aur unke items delete karein
      const sales = await tx.sale.findMany({
        where: { customerId: id },
        include: { items: true, installment: true },
      });

      for (const sale of sales) {
        await tx.saleItem.deleteMany({ where: { saleId: sale.id } });

        if (sale.installment) {
          await tx.installmentPayment.deleteMany({
            where: { installmentId: sale.installment.id },
          });
          await tx.installment.delete({
            where: { id: sale.installment.id },
          });
        }
      }
      await tx.sale.deleteMany({ where: { customerId: id } });

      // 2. Independent installments delete karein
      const installments = await tx.installment.findMany({
        where: { customerId: id },
      });

      for (const inst of installments) {
        await tx.installmentPayment.deleteMany({
          where: { installmentId: inst.id },
        });
        await tx.installment.delete({
          where: { id: inst.id },
        });
      }

      // 3. Aakhir mein customer ko delete karein
      await tx.customer.delete({
        where: { id },
      });
    });

    revalidatePath('/installments');
    revalidatePath('/installments/customers');
    revalidatePath('/pos');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete customer - Detailed Error:', error);
    // Yeh line asli database error ko console mein print karegi taake pata chale agar koi aur constraint hai
    throw new Error(`Failed to delete customer: ${error.message || 'Unknown database error'}`);
  }
}
export async function recordCustomerPayment(formData: FormData) {
  const customerId = formData.get('customerId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const notes = (formData.get('notes') as string) || null;

  if (!customerId || !amount || amount <= 0) return;

  try {
    await prisma.$transaction(async (tx) => {
      const pendingInstallments = await tx.installment.findMany({
        where: {
          customerId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'asc' },
      });

      let remainingPaymentToDistribute = amount;

      for (const inst of pendingInstallments) {
        if (remainingPaymentToDistribute <= 0) break;

        const dueOnThisInst = inst.remainingAmount;
        const amountToApply = Math.min(remainingPaymentToDistribute, dueOnThisInst);

        const newPaidAmount = inst.paidAmount + amountToApply;
        const newRemaining = Math.max(0, inst.totalAmount - newPaidAmount);
        const newStatus = newRemaining === 0 ? 'COMPLETED' : 'PENDING';

        await tx.installment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemaining,
            status: newStatus,
          },
        });

        remainingPaymentToDistribute -= amountToApply;
      }

      const targetInstallment = pendingInstallments[0];

      if (targetInstallment) {
        await tx.installmentPayment.create({
          data: {
            installmentId: targetInstallment.id,
            amountPaid: amount,
            notes: notes ? `${notes}` : 'Khata Payment Received',
          },
        });
      }

      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      const currentDue = customer?.totalDue ?? 0;
      const newTotalDue = Math.max(0, currentDue - amount);

      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalDue: newTotalDue,
        },
      });
    });

    revalidatePath('/installments');
  } catch (error) {
    console.error('Error recording customer payment:', error);
  }
}