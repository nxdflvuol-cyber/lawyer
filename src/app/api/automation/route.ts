import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب قواعد الأتمتة
export async function GET() {
  try {
    const rules = await db.automationRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    const logs = await db.automationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, rules, logs });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إنشاء قاعدة أتمتة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, trigger, conditions, actions } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json({ success: false, error: "الاسم، المُحفّز، والإجراءات مطلوبة" }, { status: 400 });
    }

    const rule = await db.automationRule.create({
      data: {
        name,
        description: description || null,
        trigger,
        conditions: typeof conditions === "string" ? conditions : JSON.stringify(conditions || []),
        actions: typeof actions === "string" ? actions : JSON.stringify(actions),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
