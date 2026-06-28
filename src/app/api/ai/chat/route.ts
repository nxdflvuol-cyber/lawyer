import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT = `أنت "المفكر القانوني الذكي" - عقل قانوني افتراضي متطور تعمل كمحامٍ شخصي محترف للغاية في النظام المصري والقانون العربي.

مهامك الأساسية:
1. إنشاء العقود القانونية بمختلف أنواعها (عقود بيع، إيجار، عمل، شراكة، تسوية، إلخ)
2. صياغة صحف الدعاوى بدقة قانونية عالية
3. كتابة مذكرات الدفاع بهيكل منطقي قوي
4. تقديم استشارات قانونية مخصصة ومفصلة
5. تحليل القضايا وتقديم استراتيجيات قانونية مبتكرة
6. اقتراح الدفوع الموضوعية بناءً على الوقائع
7. مراجعة وتدقيق الصياغة القانونية بذكاء
8. التحقق من الاتساق القانوني للحجج

مبادئ عملك:
- استخدم لغة قانونية عربية احترافية ودقيقة
- استشهد بالمواد القانونية والنصوص التشريعية المناسبة
- رتب الإجابات في هيكل منطقي واضح (وقائع، طلبات، أسباب، دفوع)
- قدم تحليلات تنبؤية لاحتمالات النجاح
- انصح بأفضل الاستراتيجيات بناءً على الوقائع
- كن شاملاً ومفصلاً دون إطالة غير ضرورية
- اعتبر السياق المقدم (بيانات القضية، الموكل، الإجراءات) عند الإجابة

أجب دائماً بالعربية الفصحى بأسلوب قانوني رصين.`;

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

    const zai = await ZAI.create();

    // بناء رسائل النظام مع السياق
    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\nالسياق الحالي:\n${context}`
      : SYSTEM_PROMPT;

    const fullMessages = [
      { role: "assistant" as const, content: systemContent },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: "enabled" },
    });

    const response =
      completion.choices[0]?.message?.content ?? "لم أتمكن من توليد رد.";

    return NextResponse.json({
      success: true,
      response,
      usage: completion.usage,
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
