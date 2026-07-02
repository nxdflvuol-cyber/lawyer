import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب Timeline لأي كيان
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const caseId = searchParams.get("caseId");
    const preCaseId = searchParams.get("preCaseId");
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (caseId) where.caseId = caseId;
    if (preCaseId) where.preCaseId = preCaseId;
    if (clientId) where.clientId = clientId;

    const events = await db.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, fileName: true } },
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Timeline GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إضافة حدث للـ Timeline
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await db.timelineEvent.create({
      data: {
        eventType: body.eventType || "custom",
        entityType: body.entityType || "general",
        entityId: body.entityId || null,
        title: body.title,
        description: body.description || null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        userId: body.userId || null,
        caseId: body.caseId || null,
        preCaseId: body.preCaseId || null,
        clientId: body.clientId || null,
        documentId: body.documentId || null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Timeline POST error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
