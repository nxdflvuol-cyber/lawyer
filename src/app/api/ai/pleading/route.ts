import { NextRequest, NextResponse } from "next/server";
import { callAiModel, PLEADING_SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai-client";

// مساعد المرافعة - توليد نقاط المرافعة والردود السريعة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseFacts, opponentDefenses, judgeTendencies, requestType } = body;

    let prompt = "";

    switch (requestType) {
      case "pleading_points":
        prompt = `بناءً على بيانات القضية التالية، أنشئ هيكل مرافعة متكاملاً يتضمن:
1. المقدمة (تمهيد قانوني)
2. عرض الوقائع بشكل منظّم
3. الطلبات الرئيسية
4. الأسباب القانونية (مقسّمة لنقاط مرقّمة)
5. الدفوع الموضوعية
6. الرد على دفوع الخصم
7. الخاتمة والطلبات النهائية

بيانات القضية:
${caseFacts}

دفوع الخصم (إن وجدت):
${opponentDefenses ?? "غير متوفرة"}

توجهات القاضي (إن وجدت):
${judgeTendencies ?? "غير متوفرة"}`;
        break;
      case "quick_responses":
        prompt = `قدّم قائمة بالردود السريعة الجاهزة على دفوع الخصم التالية، مع تقديم اعتراضات قانونية شائعة وطلبات إجرائية سريعة:

دفوع الخصم:
${opponentDefenses ?? "غير متوفرة"}

نوع القضية: ${caseFacts}

اجعل الردود قصيرة، حاسمة، وقابلة للاستخدام الفوري في الجلسة.`;
        break;
      case "judge_simulation":
        prompt = `بناءً على ملاحظات توجهات القاضي التالية، اقترح الأسئلة المحتملة التي قد يطرحها القاضي في هذه القضية وقدم إجابات نموذجية لكل سؤال:

توجهات القاضي:
${judgeTendencies ?? "غير متوفرة"}

وقائع القضية:
${caseFacts}

دفوع الخصم:
${opponentDefenses ?? "غير متوفرة"}`;
        break;
      case "weakness_analysis":
        prompt = `حلل نقاط الضعف المحتملة في المرافعة المقترحة التالية واقترح كيفية تقويتها:

${caseFacts}

ركّز على:
1. النقاط التي قد تكون عرضة للاعتراض
2. الحجج التي تحتاج دعماً إضافياً
3. الاستشهادات التي قد تكون غير كافية
4. اقتراحات لتعزيز الموقف القانوني`;
        break;
      default:
        prompt = caseFacts;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: PLEADING_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ];

    const result = await callAiModel(messages, { temperature: 0.7, thinking: true });

    return NextResponse.json({
      success: true,
      result: result.content,
      type: requestType,
    });
  } catch (error) {
    console.error("AI pleading error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ: ${message}` },
      { status: 500 }
    );
  }
}
