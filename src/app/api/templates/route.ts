import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب القوالب
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateType = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (templateType) where.templateType = templateType;

    const templates = await db.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, templates });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إنشاء قالب
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = await db.template.create({
      data: {
        name: body.name,
        templateType: body.templateType || "memo",
        category: body.category || null,
        content: body.content,
        variables: body.variables ? (typeof body.variables === "string" ? body.variables : JSON.stringify(body.variables)) : null,
        isBuiltIn: false,
      },
    });
    return NextResponse.json({ success: true, template });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
