import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// توليد المستندات القانونية - عقود، صحف دعاوى، مذكرات، استشارات
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docType, params, caseContext } = body;

    const zai = await ZAI.create();

    const systemPrompt = `أنت مصاغ قانوني محترف. تنشئ مستندات قانونية عربية كاملة واحترافية بصياغة دقيقة ولغة قانونية رصينة. تلتزم بالهيكل القانوني الصحيح لكل نوع مستند.`;

    const paramsText = Object.entries(params ?? {})
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const contextText = caseContext
      ? `\n\nسياق القضية:\n${caseContext}`
      : "";

    const prompt = `أنشئ ${docType} كامل ومفصّل باللغة العربية الفصحى باستخدام المعطيات التالية:

المعطيات:
${paramsText}${contextText}

المتطلبات:
- استخدم لغة قانونية رصينة ودقيقة
- اتبع الهيكل القانوني الصحيح للمستند
- تضمين جميع البنود الضرورية
- ترك أماكن للتوقيع والتاريخ
- الترقيم المنظم للبنود والفقرات`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      thinking: { type: "enabled" },
    });

    const content = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      content,
      docType,
    });
  } catch (error) {
    console.error("AI generate-doc error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ: ${message}` },
      { status: 500 }
    );
  }
}
