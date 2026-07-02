import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب جميع ملفات التجهيز
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { preCaseNumber: { contains: search } },
        { title: { contains: search } },
        { client: { fullName: { contains: search } } },
      ];
    }

    const preCases = await db.preCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        _count: {
          select: {
            documentLinks: true,
            tasks: true,
            opponents: true,
            properties: true,
            contracts: true,
            timelineEvents: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, preCases });
  } catch (error) {
    console.error("Get preCases error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إنشاء ملف تجهيز جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, caseType, clientId, facts, legalFraming, requests, notes, createdById } = body;

    // توليد رقم فريد: PRE-2026-000001
    const year = new Date().getFullYear();
    const count = await db.preCase.count({ where: { preCaseNumber: { contains: `PRE-${year}-` } } });
    const preCaseNumber = `PRE-${year}-${String(count + 1).padStart(6, "0")}`;

    const preCase = await db.preCase.create({
      data: {
        preCaseNumber,
        title: title || `ملف تجهيز ${preCaseNumber}`,
        caseType: caseType || null,
        clientId: clientId || null,
        facts: facts || null,
        legalFraming: legalFraming || null,
        requests: requests || null,
        notes: notes || null,
        createdById: createdById || null,
        checklist: JSON.stringify([
          { item: "إدخال بيانات الموكل", checked: !!clientId, required: true },
          { item: "إدخال الخصوم", checked: false, required: true },
          { item: "رفع المستندات", checked: false, required: true },
          { item: "كتابة الوقائع", checked: !!facts, required: true },
          { item: "التكييف القانوني", checked: !!legalFraming, required: false },
          { item: "تسجيل الإنذارات", checked: false, required: false },
          { item: "تسجيل التسويات", checked: false, required: false },
          { item: "تسجيل المحاضر", checked: false, required: false },
          { item: "إضافة الطلبات", checked: !!requests, required: true },
          { item: "إضافة الملاحظات", checked: !!notes, required: false },
        ]),
      },
      include: { client: true },
    });

    // إضافة Timeline event
    await db.timelineEvent.create({
      data: {
        eventType: "created",
        entityType: "precase",
        entityId: preCase.id,
        title: `تم إنشاء ملف التجهيز ${preCaseNumber}`,
        preCaseId: preCase.id,
        userId: createdById || null,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: createdById || null,
        action: "create",
        entity: "precase",
        entityId: preCase.id,
        entityName: preCase.preCaseNumber,
        details: `إنشاء ملف تجهيز جديد: ${preCase.title}`,
      },
    });

    return NextResponse.json({ success: true, preCase });
  } catch (error) {
    console.error("Create preCase error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ في الإنشاء" }, { status: 500 });
  }
}
