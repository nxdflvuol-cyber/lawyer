import { NextRequest, NextResponse } from "next/server";
import { runAgent, type AgentMessage } from "@/lib/ai-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "الرسائل مطلوبة" },
        { status: 400 }
      );
    }

    // تحويل الرسائل لصيغة AgentMessage
    const history: AgentMessage[] = messages
      .filter((m: { role: string; content: string }) => m.role !== "system")
      .map((m: { role: string; content: string }): AgentMessage => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    // آخر رسالة هي رسالة المستخدم الحالية
    const lastUserMessage = history.pop()?.content ?? "";

    // تشغيل الوكيل
    const result = await runAgent(lastUserMessage, history, context);

    return NextResponse.json({
      success: true,
      response: result.content,
      actions: result.actions,
    });
  } catch (error) {
    console.error("AI agent chat error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ في الوكيل الذكي: ${message}` },
      { status: 500 }
    );
  }
}
