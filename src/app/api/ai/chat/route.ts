import { NextRequest, NextResponse } from "next/server";
import { callAiModel, LEGAL_THINKER_SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai-client";

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

    // بناء رسائل النظام مع السياق
    const systemContent = context
      ? `${LEGAL_THINKER_SYSTEM_PROMPT}\n\nالسياق الحالي:\n${context}`
      : LEGAL_THINKER_SYSTEM_PROMPT;

    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...messages.map((m: { role: string; content: string }): ChatMessage => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const result = await callAiModel(fullMessages, {
      temperature: 0.7,
      thinking: true,
    });

    return NextResponse.json({
      success: true,
      response: result.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ في الذكاء الاصطناعي: ${message}` },
      { status: 500 }
    );
  }
}
