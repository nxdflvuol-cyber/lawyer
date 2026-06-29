import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    const caseId = searchParams.get("caseId");
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (caseId) where.caseId = caseId;
    if (clientId) where.clientId = clientId;

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        case: { select: { id: true, internalNumber: true } },
        client: { select: { id: true, fullName: true } },
      },
    });

    // لا نعيد fileData كاملاً في القائمة (للأداء)
    const light = documents.map((d) => ({
      ...d,
      fileData: d.fileData ? "[stored]" : null,
    }));

    return NextResponse.json({ success: true, documents: light });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const document = await db.document.create({
      data: {
        title: body.title,
        description: body.description,
        docType: body.docType ?? "other",
        category: body.category ?? "other",
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        fileData: body.fileData ?? null,
        textContent: body.textContent ?? null,
        tags: body.tags,
        folder: body.folder,
        caseId: body.caseId || null,
        clientId: body.clientId || null,
      },
    });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
