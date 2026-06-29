import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// سجل التدقيق الأمني والتنبيهات
export async function GET() {
  try {
    const [auditLogs, failedAttempts, sensitiveAccess] = await Promise.all([
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.auditLog.count({
        where: {
          action: "login_failed",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.auditLog.count({
        where: {
          entity: { in: ["client", "case", "document", "payment"] },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // تحليل النشاط المريب
    const last24h = auditLogs.filter(
      (l) => l.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const suspiciousActivities = last24h.filter((log) => {
      // نشاط في أوقات غير معتادة (ليلاً)
      const hour = new Date(log.createdAt).getHours();
      return hour < 6 || hour > 23;
    });

    return NextResponse.json({
      success: true,
      auditLogs,
      stats: {
        failedAttempts,
        sensitiveAccess,
        suspiciousActivities: suspiciousActivities.length,
        totalToday: last24h.length,
      },
    });
  } catch (error) {
    console.error("Security GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await db.auditLog.create({
      data: {
        userId: body.userId,
        action: body.action,
        entity: body.entity,
        entityId: body.entityId,
        details: body.details,
        ipAddress: body.ipAddress,
      },
    });
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Security POST error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
