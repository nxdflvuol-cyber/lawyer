import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      casesCount,
      activeCases,
      clientsCount,
      tasksCount,
      overdueTasks,
      appointmentsToday,
      pendingFees,
      totalIncome,
      totalExpenses,
      documentsCount,
      casesByType,
      casesByStatus,
      recentCases,
      upcomingAppointments,
      recentTasks,
    ] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: "active" } }),
      db.client.count(),
      db.task.count({ where: { status: { not: "completed" } } }),
      db.task.count({
        where: {
          status: { not: "completed" },
          dueDate: { lt: new Date() },
        },
      }),
      db.appointment.count({
        where: {
          startDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      db.fee.aggregate({
        _sum: { amount: true },
        where: { status: { not: "paid" } },
      }),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.expense.aggregate({ _sum: { amount: true } }),
      db.document.count(),
      db.case.groupBy({ by: ["caseType"], _count: true }),
      db.case.groupBy({ by: ["status"], _count: true }),
      db.case.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      db.appointment.findMany({
        where: {
          startDate: { gte: new Date() },
        },
        take: 5,
        orderBy: { startDate: "asc" },
        include: { case: true, client: true },
      }),
      db.task.findMany({
        take: 5,
        where: { status: { not: "completed" } },
        orderBy: { dueDate: "asc" },
        include: { case: true, client: true },
      }),
    ]);

    // حالات القضايا حسب النوع
    const caseTypeStats = casesByType.map((c) => ({
      type: c.caseType,
      count: c._count,
    }));

    const caseStatusStats = casesByStatus.map((c) => ({
      status: c.status,
      count: c._count,
    }));

    // معدل النجاح
    const wonCases = caseStatusStats.find((s) => s.status === "won")?.count ?? 0;
    const lostCases = caseStatusStats.find((s) => s.status === "lost")?.count ?? 0;
    const settledCases = caseStatusStats.find((s) => s.status === "settled")?.count ?? 0;
    const successRate =
      wonCases + lostCases > 0
        ? Math.round((wonCases / (wonCases + lostCases)) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        cases: casesCount,
        activeCases,
        clients: clientsCount,
        tasks: tasksCount,
        overdueTasks,
        appointmentsToday,
        documents: documentsCount,
        pendingFees: pendingFees._sum.amount ?? 0,
        totalIncome: totalIncome._sum.amount ?? 0,
        totalExpenses: totalExpenses._sum.amount ?? 0,
        netIncome: (totalIncome._sum.amount ?? 0) - (totalExpenses._sum.amount ?? 0),
        successRate,
        wonCases,
        settledCases,
        lostCases,
        caseTypeStats,
        caseStatusStats,
        recentCases,
        upcomingAppointments,
        recentTasks,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في جلب الإحصائيات" },
      { status: 500 }
    );
  }
}
