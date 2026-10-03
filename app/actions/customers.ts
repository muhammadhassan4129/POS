'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

// Get all customers with their sales and installments info
export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: true,
        installments: true,
      },
      orderBy: { name: 'asc' },
    });
    return customers;
  } catch (error) {
    throw new Error('Failed to fetch customers');
  }
}

// Create a new customer with new fields (fname, village, reference)
export async function createCustomer(data: {
  name: string;
  fname?: string;
  village?: string;
  reference?: string;
  phone?: string;
  cnic?: string;
  totalDue?: number;
}) {
  try {
    if (!data.name) throw new Error('Customer name is required');

    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        fname: data.fname || null,
        village: data.village || null,
        reference: data.reference || null,
        phone: data.phone || null,
        cnic: data.cnic || null,
        totalDue: data.totalDue ? Number(data.totalDue) : 0,
      },
      include: {
        sales: true,
        installments: true,
      },
    });

    revalidatePath('/installments/customers');
    return { success: true, customer: newCustomer };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create customer');
  }
}

export async function deleteCustomer(formDataOrId: FormData | string) {
  const id = typeof formDataOrId === 'string' 
    ? formDataOrId 
    : formDataOrId.get('id') as string;

  if (!id) throw new Error('Customer ID is required');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Pehle customer ki sari sales find karein aur unke items delete karein
      const sales = await tx.sale.findMany({
        where: { customerId: id },
        include: { items: true, installment: true, returns: true },
      });

      for (const sale of sales) {
        // Sale items delete karein
        await tx.saleItem.deleteMany({ where: { saleId: sale.id } });

        // Agar sale returns hain toh woh delete karein
        await tx.return.deleteMany({ where: { saleId: sale.id } });

        // Agar installment judi hui hai toh uski payments aur installment delete karein
        if (sale.installment) {
          await tx.installmentPayment.deleteMany({
            where: { installmentId: sale.installment.id },
          });
          await tx.installment.delete({
            where: { id: sale.installment.id },
          });
        }

        // Aakhir mein sale record delete karein
      }
      await tx.sale.deleteMany({ where: { customerId: id } });

      // 2. Koi independent installments bachi hon toh unhe aur unki payments ko delete karein
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

      // 3. Sabse aakhir mein customer ko delete karein
      await prisma.customer.delete({
        where: { id },
      });
    });

    revalidatePath('/installments');
    revalidatePath('/installments/customers');
    revalidatePath('/pos');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete customer:', error);
    throw new Error(error.message || 'Failed to delete customer due to related records.');
  }
}