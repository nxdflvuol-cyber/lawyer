import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// محلل النصوص القانونية - تحليل العقود والمذكرات وكشف الثغرات
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, analysisType, compareWith } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: "النص مطلوب" }, { status: 400 });
    }

    const zai = await ZAI.create();

    let prompt = "";
    const systemPrompt =
      "أنت محلل نصوص قانونية خبير. تحلل المستندات القانونية وتكشف عن الثغرات والمخاطر والتناقضات. أجب بالعربية الفصحى بهيكل واضح ومنظم.";

    switch (analysisType) {
      case "contract_risk":
        prompt = `حلل العقد التالي واكشف عن:
1. الثغرات القانونية والمخاطر المحتملة
2. البنود غير المتوازنة أو المضرة بأحد الأطراف
3. البنود الناقصة التي ينبغي إضافتها
4. التناقضات بين البنود
5. توصيات للتحسين

العقد:
"""
${text}
"""`;
        break;
      case "memo_logic":
        prompt = `حلل المذكرة القانونية التالية وقيّم:
1. الترابط المنطقي للحجج
2. قوة الاستدلال القانوني
3. دقة الاستشهادات (إن وجدت)
4. نقاط الضعف التي قد يستغلها الخصم
5. اقتراحات لتقوية المذكرة

المذكرة:
"""
${text}
"""`;
        break;
      case "compare":
        prompt = `قارن بين المستندين القانونيين التاليين وحدد:
1. أوجه التشابه والاختلاف الجوهرية
2. الحجج المتعارضة
3. أيهما أقوى قانونياً ولماذا
4. نقاط الضعف في كل منهما

المستند الأول:
"""
${text}
"""

المستند الثاني:
"""
${compareWith ?? ""}
"""`;
        break;
      case "summary":
        prompt = `لخّص المستند القانوني التالي في:
1. ملخص تنفيذي (3-5 أسطر)
2. النقاط الرئيسية
3. الالتزامات والحقوق الرئيسية للأطراف
4. المواعيد النهائية الهامة

المستند:
"""
${text}
"""`;
        break;
      case "citations":
        prompt = `تحقق من دقة الاستشهادات القانونية في النص التالي:
1. استخراج كل الاستشهادات القانونية المذكورة
2. التحقق من صياغتها القانونية
3. الإشارة لأي استشهادات تبدو غير دقيقة
4. اقتراح استشهادات إضافية ذات صلة

النص:
"""
${text}
"""`;
        break;
      case "sentiment":
        prompt = `حلل لغة ونبرة المستند القانوني التالي:
1. النبرة العامة (رسمية، عدوانية، دفاعية، إلخ)
2. درجة الإقناع
3. نقاط القوة في الأسلوب
4. اقتراحات لتحسين النبرة والأسلوب

المستند:
"""
${text}
"""`;
        break;
      default:
        prompt = `حلل المستند القانوني التالي وقدّم تقييماً شاملاً له مع التوصيات:\n\n${text}`;
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      thinking: { type: "enabled" },
    });

    const analysis = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      analysis,
      type: analysisType,
    });
  } catch (error) {
    console.error("AI analyze error:", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { success: false, error: `حدث خطأ: ${message}` },
      { status: 500 }
    );
  }
}
