import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب جميع سير العمل
export async function GET() {
  try {
    const workflows = await db.workflow.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { instances: true } } },
    });
    return NextResponse.json({ success: true, workflows });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إنشاء سير عمل جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, caseType, steps } = body;

    if (!name || !steps) {
      return NextResponse.json({ success: false, error: "الاسم والخطوات مطلوبة" }, { status: 400 });
    }

    const workflow = await db.workflow.create({
      data: {
        name,
        description: description || null,
        caseType: caseType || null,
        steps: typeof steps === "string" ? steps : JSON.stringify(steps),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, workflow });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
