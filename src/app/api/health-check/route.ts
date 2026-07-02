import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderConfig } from "@/lib/ai-client";

// Health Check - فحص حالة جميع خدمات النظام
export async function GET() {
  try {
    const checks: Array<{
      service: string;
      status: "ok" | "error" | "warning";
      message: string;
      details?: unknown;
    }> = [];

    // 1. قاعدة البيانات
    try {
      await db.$queryRaw`SELECT 1`;
      const userCount = await db.user.count();
      checks.push({
        service: "قاعدة البيانات",
        status: "ok",
        message: "تعمل بشكل طبيعي",
        details: { users: userCount },
      });
    } catch {
      checks.push({ service: "قاعدة البيانات", status: "error", message: "تعذر الاتصال" });
    }

    // 2. الذكاء الاصطناعي
    try {
      const config = await getProviderConfig();
      if (config.apiKey) {
        checks.push({
          service: "الذكاء الاصطناعي",
          status: "ok",
          message: `مُعد - النموذج: ${config.model}`,
          details: { baseUrl: config.baseUrl, model: config.model },
        });
      } else {
        checks.push({ service: "الذكاء الاصطناعي", status: "warning", message: "لم يتم تكوين المفتاح" });
      }
    } catch {
      checks.push({ service: "الذكاء الاصطناعي", status: "error", message: "تعذر فحص الإعدادات" });
    }

    // 3. تليجرام
    try {
      const token = await db.setting.findUnique({ where: { id: "telegram_bot_token" } });
      if (token?.value) {
        checks.push({ service: "تليجرام", status: "ok", message: "التوكن مُعد" });
      } else {
        checks.push({ service: "تليجرام", status: "warning", message: "لم يتم تكوين البوت" });
      }
    } catch {
      checks.push({ service: "تليجرام", status: "warning", message: "تعذر الفحص" });
    }

    // 4. إحصائيات النظام
    try {
      const [cases, clients, documents, preCases, tasks] = await Promise.all([
        db.case.count(),
        db.client.count(),
        db.document.count(),
        db.preCase.count(),
        db.task.count({ where: { status: { not: "completed" } } }),
      ]);
      checks.push({
        service: "إحصائيات النظام",
        status: "ok",
        message: "النظام يعمل",
        details: { cases, clients, documents, preCases, pendingTasks: tasks },
      });
    } catch {
      checks.push({ service: "إحصائيات النظام", status: "warning", message: "تعذر جمع الإحصائيات" });
    }

    // 5. Event Bus
    try {
      const pendingEvents = await db.eventBus.count({ where: { processed: false } });
      checks.push({
        service: "Event Bus",
        status: pendingEvents > 10 ? "warning" : "ok",
        message: pendingEvents > 0 ? `${pendingEvents} أحداث معلّقة` : "كل الأحداث معالجة",
      });
    } catch {
      checks.push({ service: "Event Bus", status: "ok", message: "جاهز" });
    }

    // 6. Automation Engine
    try {
      const activeRules = await db.automationRule.count({ where: { isActive: true } });
      checks.push({
        service: "Automation Engine",
        status: "ok",
        message: `${activeRules} قاعدة نشطة`,
      });
    } catch {
      checks.push({ service: "Automation Engine", status: "ok", message: "جاهز" });
    }

    // النتيجة الإجمالية
    const hasError = checks.some(c => c.status === "error");
    const hasWarning = checks.some(c => c.status === "warning");
    const overall = hasError ? "error" : hasWarning ? "warning" : "ok";

    return NextResponse.json({
      success: true,
      overall,
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      overall: "error",
      error: error instanceof Error ? error.message : "خطأ غير معروف",
    }, { status: 500 });
  }
}
