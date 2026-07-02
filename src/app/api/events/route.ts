import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Event Bus - نشر حدث ومعالجته
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, entityType, entityId, payload, userId } = body;

    // 1. حفظ الحدث في Event Bus
    const event = await db.eventBus.create({
      data: {
        eventType,
        entityType: entityType || "general",
        entityId: entityId || null,
        payload: JSON.stringify(payload || {}),
      },
    });

    // 2. معالجة الحدث - Timeline
    await db.timelineEvent.create({
      data: {
        eventType,
        entityType: entityType || "general",
        entityId: entityId || null,
        title: payload?.title || `حدث: ${eventType}`,
        description: payload?.description || null,
        metadata: JSON.stringify(payload || {}),
        userId: userId || null,
        caseId: payload?.caseId || null,
        preCaseId: payload?.preCaseId || null,
        clientId: payload?.clientId || null,
        documentId: payload?.documentId || null,
      },
    });

    // 3. معالجة Automation Rules
    const rules = await db.automationRule.findMany({
      where: { trigger: eventType, isActive: true },
    });

    for (const rule of rules) {
      try {
        const conditions = JSON.parse(rule.conditions || "[]");
        const actions = JSON.parse(rule.actions || "[]");

        // تنفيذ الإجراءات
        for (const action of actions) {
          await executeAutomationAction(action, payload || {}, userId);
        }

        // سجل التنفيذ
        await db.automationLog.create({
          data: {
            ruleId: rule.id,
            ruleName: rule.name,
            trigger: eventType,
            entityType: entityType || null,
            entityId: entityId || null,
            result: "success",
          },
        });
      } catch (err) {
        await db.automationLog.create({
          data: {
            ruleId: rule.id,
            ruleName: rule.name,
            trigger: eventType,
            entityType: entityType || null,
            entityId: entityId || null,
            result: "failed",
            errorMessage: err instanceof Error ? err.message : "خطأ",
          },
        });
      }
    }

    // 4. تحديث حالة الحدث
    await db.eventBus.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error("Event Bus error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// جلب الأحداث غير المعالجة
export async function GET() {
  try {
    const events = await db.eventBus.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return NextResponse.json({ success: true, events });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// تنفيذ إجراء أتمتة
async function executeAutomationAction(
  action: { type: string; [key: string]: unknown },
  payload: Record<string, unknown>,
  userId?: string
) {
  switch (action.type) {
    case "create_task":
      await db.task.create({
        data: {
          title: action.title as string || "مهمة تلقائية",
          description: action.description as string || null,
          priority: (action.priority as string) || "medium",
          dueDate: action.dueDate ? new Date(action.dueDate as string) : null,
          caseId: (payload.caseId as string) || null,
          clientId: (payload.clientId as string) || null,
          preCaseId: (payload.preCaseId as string) || null,
          status: "todo",
        },
      });
      break;

    case "create_notification":
      await db.notification.create({
        data: {
          userId: userId || null,
          title: action.title as string || "إشعار تلقائي",
          message: action.message as string || "",
          type: (action.notifType as string) || "info",
          entityType: (payload.entityType as string) || null,
          entityId: (payload.entityId as string) || null,
        },
      });
      break;

    case "create_appointment":
      await db.appointment.create({
        data: {
          title: action.title as string || "موعد تلقائي",
          startDate: new Date(action.startDate as string),
          eventType: (action.eventType as string) || "other",
          caseId: (payload.caseId as string) || null,
          clientId: (payload.clientId as string) || null,
          preCaseId: (payload.preCaseId as string) || null,
        },
      });
      break;
  }
}
