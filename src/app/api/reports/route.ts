import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// نظام التقارير المتكامل
// ============================================================

interface DateRange {
  gte?: Date;
  lte?: Date;
}

function parseRange(req: NextRequest): { range: DateRange; from?: Date; to?: Date } {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const range: DateRange = {};
  let from: Date | undefined;
  let to: Date | undefined;
  if (fromStr) {
    from = new Date(fromStr);
    range.gte = from;
  }
  if (toStr) {
    to = new Date(toStr);
    to.setHours(23, 59, 59, 999);
    range.lte = to;
  }
  return { range, from, to };
}

// تقرير القضايا
async function casesReport(range: DateRange, caseType?: string | null, status?: string | null) {
  const where: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    where.startDate = {};
    if (range.gte) (where.startDate as Record<string, unknown>).gte = range.gte;
    if (range.lte) (where.startDate as Record<string, unknown>).lte = range.lte;
  }
  if (caseType) where.caseType = caseType;
  if (status) where.status = status;

  const [cases, byType, byStatus, byDegree, byCourt, totalValue] = await Promise.all([
    db.case.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { client: true, _count: { select: { sessions: true, documentLinks: true, tasks: true } } },
      take: 500,
    }),
    db.case.groupBy({ by: ["caseType"], where, _count: true }),
    db.case.groupBy({ by: ["status"], where, _count: true }),
    db.case.groupBy({ by: ["degree"], where, _count: true }),
    db.case.groupBy({ by: ["court"], where, _count: true }),
    db.case.aggregate({ where, _sum: { estimatedValue: true } }),
  ]);

  return {
    items: cases,
    summary: {
      total: cases.length,
      totalValue: totalValue._sum.estimatedValue ?? 0,
      byType: byType.map((c) => ({ name: c.caseType, count: c._count })),
      byStatus: byStatus.map((c) => ({ name: c.status, count: c._count })),
      byDegree: byDegree.map((c) => ({ name: c.degree, count: c._count })),
      byCourt: byCourt.filter((c) => c.court).map((c) => ({ name: c.court ?? "—", count: c._count })),
    },
  };
}

// تقرير المالية
async function financeReport(range: DateRange) {
  const paymentWhere: Record<string, unknown> = {};
  const expenseWhere: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    paymentWhere.paymentDate = {};
    expenseWhere.expenseDate = {};
    if (range.gte) {
      (paymentWhere.paymentDate as Record<string, unknown>).gte = range.gte;
      (expenseWhere.expenseDate as Record<string, unknown>).gte = range.gte;
    }
    if (range.lte) {
      (paymentWhere.paymentDate as Record<string, unknown>).lte = range.lte;
      (expenseWhere.expenseDate as Record<string, unknown>).lte = range.lte;
    }
  }

  const [payments, expenses, fees, invoices, incomeAgg, expenseAgg, feesAgg] = await Promise.all([
    db.payment.findMany({
      where: paymentWhere,
      orderBy: { paymentDate: "desc" },
      include: { client: true, case: true },
      take: 500,
    }),
    db.expense.findMany({
      where: expenseWhere,
      orderBy: { expenseDate: "desc" },
      include: { case: true, client: true },
      take: 500,
    }),
    db.fee.findMany({
      orderBy: { createdAt: "desc" },
      include: { case: { include: { client: true } } },
      take: 500,
    }),
    db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, case: true },
      take: 500,
    }),
    db.payment.aggregate({ where: paymentWhere, _sum: { amount: true }, _count: true }),
    db.expense.aggregate({ where: expenseWhere, _sum: { amount: true }, _count: true }),
    db.fee.aggregate({ _sum: { amount: true, paidAmount: true } }),
  ]);

  // تجميع الأتعاب حسب النوع
  const feesByType: Record<string, number> = {};
  fees.forEach((f) => {
    feesByType[f.feeType] = (feesByType[f.feeType] ?? 0) + f.amount;
  });

  // تجميع المصروفات حسب الفئة
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount;
  });

  // تجميع الدخل الشهري
  const monthlyData: Record<string, { income: number; expense: number; net: number }> = {};
  payments.forEach((p) => {
    const d = new Date(p.paymentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0, net: 0 };
    monthlyData[key].income += p.amount;
  });
  expenses.forEach((e) => {
    const d = new Date(e.expenseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0, net: 0 };
    monthlyData[key].expense += e.amount;
  });
  Object.keys(monthlyData).forEach((k) => {
    monthlyData[k].net = monthlyData[k].income - monthlyData[k].expense;
  });

  return {
    items: { payments, expenses, fees, invoices },
    summary: {
      totalIncome: incomeAgg._sum.amount ?? 0,
      totalExpenses: expenseAgg._sum.amount ?? 0,
      netIncome: (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0),
      totalFees: feesAgg._sum.amount ?? 0,
      collectedFees: feesAgg._sum.paidAmount ?? 0,
      pendingFees: (feesAgg._sum.amount ?? 0) - (feesAgg._sum.paidAmount ?? 0),
      paymentsCount: incomeAgg._count,
      expensesCount: expenseAgg._count,
      invoicesCount: invoices.length,
      feesByType: Object.entries(feesByType).map(([name, value]) => ({ name, value })),
      expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })),
      monthly: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v })),
    },
  };
}

// تقرير الموكلين
async function clientsReport(range: DateRange, clientType?: string | null, status?: string | null) {
  const where: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    where.createdAt = {};
    if (range.gte) (where.createdAt as Record<string, unknown>).gte = range.gte;
    if (range.lte) (where.createdAt as Record<string, unknown>).lte = range.lte;
  }
  if (clientType) where.clientType = clientType;
  if (status) where.status = status;

  const [clients, byType, byStatus, byCity] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { cases: true, documentLinks: true, payments: true } } },
      take: 500,
    }),
    db.client.groupBy({ by: ["clientType"], where, _count: true }),
    db.client.groupBy({ by: ["status"], where, _count: true }),
    db.client.groupBy({ by: ["city"], where, _count: true }),
  ]);

  // أعلى الموكلين دفعاً
  const topPayers = await db.payment.findMany({
    where: paymentRangeFilter(range),
    include: { client: true },
    take: 1000,
  });
  const totalsByClient: Record<string, { name: string; total: number }> = {};
  topPayers.forEach((p) => {
    const key = p.clientId;
    if (!totalsByClient[key]) {
      totalsByClient[key] = { name: p.client?.fullName ?? "—", total: 0 };
    }
    totalsByClient[key].total += p.amount;
  });
  const topClients = Object.values(totalsByClient)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    items: clients,
    summary: {
      total: clients.length,
      byType: byType.map((c) => ({ name: c.clientType, count: c._count })),
      byStatus: byStatus.map((c) => ({ name: c.status, count: c._count })),
      byCity: byCity.filter((c) => c.city).map((c) => ({ name: c.city ?? "—", count: c._count })),
      topClients,
    },
  };
}

function paymentRangeFilter(range: DateRange) {
  const where: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    where.paymentDate = {};
    if (range.gte) (where.paymentDate as Record<string, unknown>).gte = range.gte;
    if (range.lte) (where.paymentDate as Record<string, unknown>).lte = range.lte;
  }
  return where;
}

// تقرير المهام
async function tasksReport(range: DateRange, status?: string | null, priority?: string | null) {
  const where: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    where.createdAt = {};
    if (range.gte) (where.createdAt as Record<string, unknown>).gte = range.gte;
    if (range.lte) (where.createdAt as Record<string, unknown>).lte = range.lte;
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [tasks, byStatus, byPriority, completedCount, overdueCount] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { case: true, client: true },
      take: 500,
    }),
    db.task.groupBy({ by: ["status"], where, _count: true }),
    db.task.groupBy({ by: ["priority"], where, _count: true }),
    db.task.count({ where: { ...where, status: "completed" } }),
    db.task.count({
      where: {
        ...where,
        status: { not: "completed" },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    items: tasks,
    summary: {
      total: tasks.length,
      completed: completedCount,
      overdue: overdueCount,
      completionRate: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
      byStatus: byStatus.map((c) => ({ name: c.status, count: c._count })),
      byPriority: byPriority.map((c) => ({ name: c.priority, count: c._count })),
    },
  };
}

// تقرير الإنتاجية (يستخدم TimeEntry + المهام + الجلسات)
async function productivityReport(range: DateRange) {
  const sessionWhere: Record<string, unknown> = {};
  const procedureWhere: Record<string, unknown> = {};
  if (range.gte || range.lte) {
    sessionWhere.sessionDate = {};
    procedureWhere.date = {};
    if (range.gte) {
      (sessionWhere.sessionDate as Record<string, unknown>).gte = range.gte;
      (procedureWhere.date as Record<string, unknown>).gte = range.gte;
    }
    if (range.lte) {
      (sessionWhere.sessionDate as Record<string, unknown>).lte = range.lte;
      (procedureWhere.date as Record<string, unknown>).lte = range.lte;
    }
  }

  const [sessions, procedures, tasksCompleted, documents, totalCases] = await Promise.all([
    db.caseSession.findMany({
      where: sessionWhere,
      include: { case: { include: { client: true } } },
      orderBy: { sessionDate: "desc" },
      take: 500,
    }),
    db.caseProcedure.findMany({
      where: procedureWhere,
      include: { case: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    db.task.count({
      where: {
        status: "completed",
        ...(range.gte || range.lte
          ? { updatedAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lte ? { lte: range.lte } : {}) } }
          : {}),
      },
    }),
    db.document.count({
      where: range.gte || range.lte
        ? { createdAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lte ? { lte: range.lte } : {}) } }
        : {},
    }),
    db.case.count({
      where: range.gte || range.lte
        ? { createdAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lte ? { lte: range.lte } : {}) } }
        : {},
    }),
  ]);

  // إنتاجية شهرية (اجتماع الجلسات والإجراءات)
  const monthly: Record<string, { sessions: number; procedures: number; documents: number }> = {};
  sessions.forEach((s) => {
    const d = new Date(s.sessionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) monthly[key] = { sessions: 0, procedures: 0, documents: 0 };
    monthly[key].sessions += 1;
  });
  procedures.forEach((p) => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) monthly[key] = { sessions: 0, procedures: 0, documents: 0 };
    monthly[key].procedures += 1;
  });

  // الإجراءات حسب النوع
  const proceduresByType: Record<string, number> = {};
  procedures.forEach((p) => {
    proceduresByType[p.type] = (proceduresByType[p.type] ?? 0) + 1;
  });

  return {
    items: { sessions, procedures },
    summary: {
      totalSessions: sessions.length,
      totalProcedures: procedures.length,
      tasksCompleted,
      documentsCreated: documents,
      newCases: totalCases,
      monthly: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v })),
      proceduresByType: Object.entries(proceduresByType).map(([name, value]) => ({ name, value })),
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "cases";
    const caseType = searchParams.get("caseType");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const clientType = searchParams.get("clientType");
    const { range } = parseRange(req);

    let data: unknown;
    switch (type) {
      case "cases":
        data = await casesReport(range, caseType, status);
        break;
      case "finance":
        data = await financeReport(range);
        break;
      case "clients":
        data = await clientsReport(range, clientType, status);
        break;
      case "tasks":
        data = await tasksReport(range, status, priority);
        break;
      case "productivity":
        data = await productivityReport(range);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "نوع تقرير غير معروف" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, type, data });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
