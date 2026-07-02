import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callAiModel } from "@/lib/ai-client";

// RAG - Retrieval Augmented Generation
// 1. ابحث في قاعدة المعرفة عن نصوص ذات صلة
// 2. أرسلها للنموذج مع السؤال
// 3. أرجع الإجابة مع المصادر

export async function POST(req: NextRequest) {
  try {
    const { query, caseContext } = await req.json();

    if (!query) {
      return NextResponse.json({ success: false, error: "السؤال مطلوب" }, { status: 400 });
    }

    // 1. البحث في قاعدة المعرفة
    const knowledgeItems = await db.legalLibrary.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } },
          { reference: { contains: query } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // 2. بناء السياق من قاعدة المعرفة
    let knowledgeContext = "";
    if (knowledgeItems.length > 0) {
      knowledgeContext = "\n\n# المراجع القانونية المتاحة:\n";
      knowledgeItems.forEach((item, i) => {
        knowledgeContext += `\n## مرجع ${i + 1}: ${item.title}\n`;
        knowledgeContext += `المصدر: ${item.source || "غير محدد"}\n`;
        knowledgeContext += `المرجع: ${item.reference || "غير محدد"}\n`;
        knowledgeContext += `المحتوى: ${item.content.slice(0, 500)}...\n`;
      });
    }

    // 3. بناء البرومبت
    const prompt = `أنت مساعد قانوني ذكي. أجب على السؤال التالي بناءً على المراجع القانونية المتاحة.

${caseContext ? `# سياق القضية:\n${caseContext}\n` : ""}
${knowledgeContext}

# سؤال المستخدم: ${query}

أجب بالعربية الفصحى. استشهد بالمراجع المتاحة. إذا لم توجد مراجع كافية، أجب من معرفتك القانونية.`;

    // 4. استدعاء النموذج
    const result = await callAiModel(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 2000 }
    );

    return NextResponse.json({
      success: true,
      answer: result.content,
      sources: knowledgeItems.map(item => ({
        id: item.id,
        title: item.title,
        reference: item.reference,
        source: item.source,
      })),
      knowledgeCount: knowledgeItems.length,
    });
  } catch (error) {
    console.error("RAG search error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "خطأ غير معروف",
    }, { status: 500 });
  }
}
