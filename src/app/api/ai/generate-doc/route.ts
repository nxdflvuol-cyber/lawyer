import { NextRequest, NextResponse } from "next/server";
import { callAiModel, DOC_GENERATOR_SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai-client";

// توليد المستندات القانونية - عقود، صحف دعاوى، مذكرات، استشارات
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docType, params, caseContext } = body;

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
- الترقيم المنظم للبنود والفقرات
- استخدم تنسيق Markdown واضح`;

    const messages: ChatMessage[] = [
      { role: "system", content: DOC_GENERATOR_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ];

    const result = await callAiModel(messages, { temperature: 0.6 });

    return NextResponse.json({
      success: true,
      content: result.content,
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
