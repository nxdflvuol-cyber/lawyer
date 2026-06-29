import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// حفظ نتيجة حاسبة قانونية في مذكرة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { calculatorType, title, content, caseId, clientId, inputs, result } = body;

    if (!calculatorType || !title) {
      return NextResponse.json(
        { success: false, error: "النوع والعنوان مطلوبان" },
        { status: 400 }
      );
    }

    // تنسيق المحتوى
    const fullContent = [
      `<h3>${title}</h3>`,
      `<p><strong>نوع الحاسبة:</strong> ${calculatorType}</p>`,
      inputs ? `<h4>المدخلات:</h4><pre>${JSON.stringify(inputs, null, 2)}</pre>` : "",
      result ? `<h4>النتيجة:</h4><pre>${typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>` : "",
      content ?? "",
    ].filter(Boolean).join("\n");

    const memo = await db.memo.create({
      data: {
        title,
        memoType: "consultation",
        caseId: caseId || null,
        clientId: clientId || null,
        content: fullContent,
        plainText: `${title}\n${typeof result === "string" ? result : JSON.stringify(result)}`,
        status: "final",
      },
    });

    return NextResponse.json({ success: true, memo });
  } catch (error) {
    console.error("Calculator save error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// جلب نتائج الحاسبات المحفوظة
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const where: Record<string, unknown> = { memoType: "consultation" };
    if (caseId) where.caseId = caseId;

    const memos = await db.memo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, memos });
  } catch (error) {
    console.error("Calculator GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
