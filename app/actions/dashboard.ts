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

// Khata Defaulters + Current month + All Pending
export async function getKhataDefaulters() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Sirf wo customers jinika khata balance > 0 hai
  // customer.totalDue = source of truth (bilkul wahi jo Installments page dikhata hai)
  const customers = await prisma.customer.findMany({
    where: {
      totalDue: { gt: 0 },
    },
    include: {
      installments: {
        include: {
          sale: { include: { items: { include: { product: true } } } },
          payments: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const mapped = customers.map((c) => {
    // Is month ki total payment (Return Adjustment entries ko payment nahi gina jayega)
    const paidThisMonth = c.installments.reduce(
      (sum, inst) =>
        sum +
        inst.payments
          .filter((p) => new Date(p.paymentDate) >= monthStart)
          .filter((p) => !p.notes?.startsWith('Return Adjustment'))
          .reduce((s, p) => s + p.amountPaid, 0),
      0
    );

    const pendingInstallments = c.installments.filter(
      (i) => i.status === 'PENDING' && i.remainingAmount > 0
    );

    //  Khata balance = customer.totalDue (Installments page jaisa hi)
    const totalDue =
      c.totalDue ??
      pendingInstallments.reduce((s, i) => s + i.remainingAmount, 0);

    const lastBillDate = pendingInstallments.reduce((latest, inst) => {
      const d = inst.createdAt ? new Date(inst.createdAt).getTime() : 0;
      return d > latest ? d : latest;
    }, 0);

    return {
      id: c.id,
      name: c.name,
      fname: c.fname,
      village: c.village,
      phone: c.phone,
      totalDue,
      paidThisMonth,
      lastBillDate: lastBillDate ? new Date(lastBillDate).toISOString() : null,
      pendingBills: pendingInstallments.length,
      itemsPurchased: pendingInstallments.flatMap((inst) =>
        (inst.sale?.items || []).map((item: any) => item.product?.name || 'Item')
      ),
    };
  });

  const withDue = mapped.filter((d) => d.totalDue > 0);

  // Defaulters = is month Rs. 0 payment kiye
  const defaulters = withDue.filter((d) => d.paidThisMonth === 0);

  return {
    defaulters,
    allPending: withDue,
    count: defaulters.length,
    totalCount: withDue.length,
    totalDue: defaulters.reduce((s, d) => s + d.totalDue, 0),
    totalAllDue: withDue.reduce((s, d) => s + d.totalDue, 0),
  };
}


// Sales Report: sari sales (client-side chips se filter hongi)
export async function getSalesReport() {
  const sales = await prisma.sale.findMany({
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          product: { include: { unit: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const mapped = sales.map((s) => {
    const todaySales = new Date(s.createdAt) >= todayStart;
    return {
      id: s.id,
      invoiceNo: s.invoiceNo,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customer?.name || 'Walking Customer',
      customerPhone: s.customer?.phone || null,
      paymentType: s.paymentType,
      netTotal: s.netTotal,
      discountAmount: s.discountAmount,
      itemCount: s.items.length,
      items: s.items.map((i: any) => ({
        name: i.product?.name || 'Item',
        qty: i.qty,
        unitCode: i.product?.unit?.shortCode || '',
      })),
      _isToday: todaySales,
    };
  });

  const todaySales = mapped.filter((s) => s._isToday);

  return {
    sales: mapped,
    todayCount: todaySales.length,
    todayRevenue: todaySales.reduce((sum, s) => sum + s.netTotal, 0),
    totalCount: mapped.length,
  };
}

// Khata History: sari khata payments (chips + date range client-side filter hongi)
export async function getKhataHistory() {
  const payments = await prisma.installmentPayment.findMany({
    include: {
      installment: {
        include: {
          customer: {
            select: { id: true, name: true, village: true, phone: true },
          },
          sale: { select: { invoiceNo: true } },
        },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const mapped = payments.map((p) => {
    // "Return Adjustment:" prefix wale notes = return se khata cut
    const isReturnAdjust = p.notes?.startsWith('Return Adjustment') ?? false;

    return {
      id: p.id,
      amountPaid: p.amountPaid,
      notes: p.notes || null,
      paymentDate: p.paymentDate.toISOString(),
      customerName: p.installment.customer?.name || 'Unknown Customer',
      customerVillage: p.installment.customer?.village || null,
      customerPhone: p.installment.customer?.phone || null,
      invoiceNo: p.installment.sale?.invoiceNo || null,
      type: isReturnAdjust ? ('RETURN_ADJUST' as const) : ('CASH' as const),
      _isToday: new Date(p.paymentDate) >= todayStart,
    };
  });

  const todayPayments = mapped.filter((p) => p._isToday);

  return {
    payments: mapped,
    todayCount: todayPayments.length,
    todayTotal: todayPayments.reduce((s, p) => s + p.amountPaid, 0),
    totalCount: mapped.length,
  };
}