'use server';

import { prisma } from '@/src/lib/prisma';

export async function getDashboardStats() {
  const totalProducts = await prisma.product.count();

  const lowStockProducts = await prisma.product.findMany({
    where: {
      stockQty: { lte: 10 },
    },
    include: { unit: true },
    take: 5,
  });

  const totalSales = await prisma.sale.aggregate({
    _sum: { netTotal: true },
  });

  const totalUdhaar = await prisma.customer.aggregate({
    _sum: { totalDue: true },
  });

  const recentSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: true,
    },
  });

  return {
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    totalRevenue: totalSales._sum.netTotal || 0,
    totalOutstanding: totalUdhaar._sum.totalDue || 0,
    recentSales,
  };
}