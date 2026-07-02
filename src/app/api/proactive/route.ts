import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// مساعد AI استباقي - يفحص النظام ويقترح إجراءات
export async function GET() {
  try {
    const suggestions: Array<{
      type: string;
      priority: "urgent" | "high" | "medium" | "low";
      title: string;
      description: string;
      actionUrl?: string;
      entityId?: string;
      entityType?: string;
    }> = [];

    // 1. التوكيلات المنتهية أو قريبة الانتهاء
    const expiringPowers = await db.powerOfAttorney.findMany({
      where: {
        status: "active",
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // خلال 30 يوم
        },
      },
      include: { client: true },
    });
    for (const poa of expiringPowers) {
      const daysLeft = Math.ceil((poa.expiryDate!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft < 0) {
        suggestions.push({
          type: "expired_power",
          priority: "urgent",
          title: `توكيل منتهي: ${poa.poaNumber}`,
          description: `توكيل الموكل ${poa.client?.fullName ?? ""} انتهى منذ ${Math.abs(daysLeft)} يوم`,
          entityId: poa.clientId ?? undefined,
          entityType: "client",
        });
      } else if (daysLeft <= 7) {
        suggestions.push({
          type: "expiring_power",
          priority: "urgent",
          title: `توكيل ينتهي قريباً: ${poa.poaNumber}`,
          description: `توكيل الموكل ${poa.client?.fullName ?? ""} ينتهي خلال ${daysLeft} يوم`,
          entityId: poa.clientId ?? undefined,
          entityType: "client",
        });
      } else {
        suggestions.push({
          type: "expiring_power",
          priority: "medium",
          title: `توكيل ينتهي خلال ${daysLeft} يوم: ${poa.poaNumber}`,
          description: `الموكل: ${poa.client?.fullName ?? ""}`,
          entityId: poa.clientId ?? undefined,
          entityType: "client",
        });
      }
    }

    // 2. المهام المتأخرة
    const overdueTasks = await db.task.findMany({
      where: {
        status: { not: "completed" },
        dueDate: { lt: new Date() },
      },
      take: 10,
      include: { case: { select: { internalNumber: true } }, client: { select: { fullName: true } } },
    });
    for (const task of overdueTasks) {
      const daysLate = Math.ceil((Date.now() - task.dueDate!.getTime()) / (24 * 60 * 60 * 1000));
      suggestions.push({
        type: "overdue_task",
        priority: daysLate > 7 ? "urgent" : "high",
        title: `مهمة متأخرة: ${task.title}`,
        description: `متأخرة ${daysLate} يوم${task.case ? ` - قضية ${task.case.internalNumber}` : ""}`,
        entityId: task.id,
        entityType: "task",
      });
    }

    // 3. الجلسات القادمة (خلال 3 أيام)
    const upcomingSessions = await db.appointment.findMany({
      where: {
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        eventType: "court_session",
        status: "scheduled",
      },
      include: { case: { select: { internalNumber: true } }, client: { select: { fullName: true } } },
      orderBy: { startDate: "asc" },
    });
    for (const apt of upcomingSessions) {
      const hoursLeft = Math.ceil((apt.startDate.getTime() - Date.now()) / (60 * 60 * 1000));
      suggestions.push({
        type: "upcoming_session",
        priority: hoursLeft < 24 ? "urgent" : "high",
        title: `جلسة ${hoursLeft < 24 ? "غداً" : "خلال أيام"}`,
        description: `${apt.title}${apt.case ? ` - ${apt.case.internalNumber}` : ""}${apt.location ? ` - ${apt.location}` : ""}`,
        entityId: apt.id,
        entityType: "appointment",
      });
    }

    // 4. ملفات تجهيز جاهزة للتحويل
    const readyPreCases = await db.preCase.findMany({
      where: { status: "ready" },
      include: { client: { select: { fullName: true } } },
    });
    for (const pc of readyPreCases) {
      suggestions.push({
        type: "ready_to_convert",
        priority: "medium",
        title: `ملف جاهز للتحويل: ${pc.preCaseNumber}`,
        description: `ملف التجهيز ${pc.title} جاهز للتحويل إلى قضية`,
        entityId: pc.id,
        entityType: "precase",
      });
    }

    // 5. قضايا بدون إجراءات منذ فترة
    const staleCases = await db.case.findMany({
      where: {
        status: "active",
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      take: 5,
      include: { client: { select: { fullName: true } } },
    });
    for (const c of staleCases) {
      const daysSince = Math.ceil((Date.now() - c.updatedAt.getTime()) / (24 * 60 * 60 * 1000));
      suggestions.push({
        type: "stale_case",
        priority: "low",
        title: `قضية بدون تحديث: ${c.internalNumber}`,
        description: `لم يتم تحديث القضية منذ ${daysSince} يوم`,
        entityId: c.id,
        entityType: "case",
      });
    }

    // 6. أتعاب متأخرة
    const overdueFees = await db.fee.findMany({
      where: {
        status: { not: "paid" },
        dueDate: { lt: new Date() },
      },
      take: 5,
      include: { case: { include: { client: { select: { fullName: true } } } } },
    });
    for (const fee of overdueFees) {
      suggestions.push({
        type: "overdue_fee",
        priority: "high",
        title: `أتعاب متأخرة: ${fee.amount} جنيه`,
        description: `القضية: ${fee.case?.internalNumber ?? ""} - الموكل: ${fee.case?.client?.fullName ?? ""}`,
        entityId: fee.id,
        entityType: "fee",
      });
    }

    // ترتيب حسب الأولوية
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      success: true,
      suggestions,
      total: suggestions.length,
      urgent: suggestions.filter(s => s.priority === "urgent").length,
      high: suggestions.filter(s => s.priority === "high").length,
    });
  } catch (error) {
    console.error("Proactive assistant error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
