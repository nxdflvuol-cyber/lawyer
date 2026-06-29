import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const itemType = searchParams.get("itemType");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (itemType) where.itemType = itemType;
    if (category) where.category = category;

    const items = await db.legalLibrary.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Get library error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await db.legalLibrary.create({
      data: {
        title: body.title,
        itemType: body.itemType,
        category: body.category,
        content: body.content,
        reference: body.reference,
        source: body.source,
        tags: body.tags,
        publishedDate: body.publishedDate ? new Date(body.publishedDate) : null,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Create library item error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
