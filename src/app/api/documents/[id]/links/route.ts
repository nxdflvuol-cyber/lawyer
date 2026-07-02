import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب روابط مستند
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const links = await db.documentLink.findMany({
      where: { documentId: id },
      include: {
        case: { select: { id: true, internalNumber: true } },
        client: { select: { id: true, fullName: true } },
        preCase: { select: { id: true, preCaseNumber: true } },
        powerOfAttorney: { select: { id: true, poaNumber: true } },
        linkedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error("Get links error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إضافة رابط جديد لمستند موجود
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { caseId, clientId, preCaseId, powerOfAttorneyId, linkType, linkedById } = body;

    // التحقق من عدم وجود الرابط مسبقاً
    const existing = await db.documentLink.findFirst({
      where: {
        documentId: id,
        caseId: caseId || null,
        clientId: clientId || null,
        preCaseId: preCaseId || null,
        powerOfAttorneyId: powerOfAttorneyId || null,
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "الرابط موجود مسبقاً" }, { status: 400 });
    }

    const link = await db.documentLink.create({
      data: {
        documentId: id,
        caseId: caseId || null,
        clientId: clientId || null,
        preCaseId: preCaseId || null,
        powerOfAttorneyId: powerOfAttorneyId || null,
        linkedById: linkedById || null,
        linkType: linkType || "reference",
      },
    });

    // Timeline
    await db.timelineEvent.create({
      data: {
        eventType: "linked",
        entityType: "document",
        entityId: id,
        title: "تم ربط المستند بكيان آخر",
        documentId: id,
        caseId: caseId || null,
        preCaseId: preCaseId || null,
        clientId: clientId || null,
        userId: linkedById || null,
      },
    });

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// حذف رابط (فك الربط)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const linkId = url.searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ success: false, error: "معرف الرابط مطلوب" }, { status: 400 });
    }

    await db.documentLink.delete({ where: { id: linkId } });

    await db.timelineEvent.create({
      data: {
        eventType: "unlinked",
        entityType: "document",
        entityId: id,
        title: "تم فك ربط المستند",
        documentId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
