import { NextRequest, NextResponse } from "next/server";
import { runLegalAgent } from "@/lib/ai-legal-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "الرسائل مطلوبة" },
        { status: 400 }
      );
    }

    // استخراج آخر رسالة من المستخدم
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === "user")
      .pop()?.content ?? "";

    if (!lastUserMessage) {
      return NextResponse.json(
        { success: false, error: "لا توجد رسالة" },
        { status: 400 }
      );
    }

    // استخدام sessionId للمحافظة على سياق المحادثة
    const session = sessionId || "default";

    // تشغيل الـ Legal Agent
    const result = await runLegalAgent(lastUserMessage, session);

    return NextResponse.json({
      success: true,
      response: result.answer,
      actions: result.actions,
      confidence: result.confidence,
      task_type: result.task_type,
      intent: result.intent,
      steps_executed: result.steps_executed,
      tools_used: result.tools_used,
      missing_info: result.missing_info,
    });
  } catch (error) {
    console.error("Legal Agent error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ: ${message}` },
      { status: 500 }
    );
  }
}
