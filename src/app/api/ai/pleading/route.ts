import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// مساعد المرافعة - توليد نقاط المرافعة والردود السريعة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseFacts, opponentDefenses, judgeTendencies, requestType } = body;

    const zai = await ZAI.create();

    const systemPrompt = `أنت مساعد مرافعة قانونية خبير. تساعد المحامي في إعداد المرافعات وتقديم الردود السريعة في الجلسات. أجب بالعربية الفصحى بأسلوب مرافعة قانوني قوي ومقنع.`;

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

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      thinking: { type: "enabled" },
    });

    const result = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      result,
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
