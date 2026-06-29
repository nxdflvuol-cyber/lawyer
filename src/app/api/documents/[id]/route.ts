import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, error: "المستند غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const document = await db.document.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        folder: body.folder,
        tags: body.tags,
        caseId: body.caseId || null,
        clientId: body.clientId || null,
        textContent: body.textContent,
      },
    });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
