import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب تفاصيل ملف تجهيز
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const preCase = await db.preCase.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        opponents: true,
        properties: true,
        contracts: true,
        tasks: { where: { status: { not: "completed" } }, orderBy: { dueDate: "asc" } },
        appointments: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: "asc" } },
        documentLinks: { include: { document: true }, orderBy: { createdAt: "desc" } },
        timelineEvents: { orderBy: { createdAt: "desc" }, take: 50 },
        checklistItems: { orderBy: { order: "asc" } },
      },
    });

    if (!preCase) {
      return NextResponse.json({ success: false, error: "الملف غير موجود" }, { status: 404 });
    }

    // حساب نسبة الاكتمال
    const checklist = preCase.checklist ? JSON.parse(preCase.checklist) : [];
    const checkedCount = checklist.filter((item: { checked: boolean }) => item.checked).length;
    const totalCount = checklist.length;
    const completenessPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    // تحديث نسبة الاكتمال
    if (preCase.completenessPct !== completenessPct) {
      await db.preCase.update({ where: { id }, data: { completenessPct } });
    }

    return NextResponse.json({
      success: true,
      preCase: { ...preCase, completenessPct },
    });
  } catch (error) {
    console.error("Get preCase error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// تحديث ملف تجهيز
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { updatedById, ...updates } = body;

    // تحديث الـ checklist إذا تم تمريره
    if (updates.checklist) {
      const checklist = typeof updates.checklist === "string" ? updates.checklist : JSON.stringify(updates.checklist);
      updates.checklist = checklist;
      // حساب نسبة الاكتمال
      const parsed = JSON.parse(checklist);
      const checked = parsed.filter((item: { checked: boolean }) => item.checked).length;
      updates.completenessPct = parsed.length > 0 ? Math.round((checked / parsed.length) * 100) : 0;
      // تحديث الحالة إذا اكتمل
      if (updates.completenessPct === 100 && updates.status === undefined) {
        updates.status = "ready";
      }
    }

    const updated = await db.preCase.update({
      where: { id },
      data: { ...updates, updatedById: updatedById || null },
      include: { client: true },
    });

    // Timeline event
    await db.timelineEvent.create({
      data: {
        eventType: "updated",
        entityType: "precase",
        entityId: id,
        title: "تم تحديث ملف التجهيز",
        preCaseId: id,
        userId: updatedById || null,
      },
    });

    return NextResponse.json({ success: true, preCase: updated });
  } catch (error) {
    console.error("Update preCase error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ في التحديث" }, { status: 500 });
  }
}

// حذف (أرشفة) ملف تجهيز
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const preCase = await db.preCase.findUnique({ where: { id } });
    if (!preCase) {
      return NextResponse.json({ success: false, error: "الملف غير موجود" }, { status: 404 });
    }

    // حذف منطقي (أرشفة)
    await db.preCase.update({
      where: { id },
      data: { isArchived: true, archiveReason: reason || "أرشفة يدوية", status: "cancelled" },
    });

    await db.timelineEvent.create({
      data: {
        eventType: "archived",
        entityType: "precase",
        entityId: id,
        title: `تمت أرشفة ملف التجهيز ${preCase.preCaseNumber}`,
        preCaseId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete preCase error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
