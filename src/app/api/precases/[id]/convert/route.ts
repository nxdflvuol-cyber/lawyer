import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// تحويل ملف التجهيز إلى قضية
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { internalNumber, court, circuit, judgeName, userId } = body;

    const preCase = await db.preCase.findUnique({
      where: { id },
      include: {
        client: true,
        opponents: true,
        properties: true,
        contracts: true,
        documentLinks: { include: { document: true } },
        tasks: true,
        timelineEvents: true,
        checklistItems: true,
      },
    });

    if (!preCase) {
      return NextResponse.json({ success: false, error: "ملف التجهيز غير موجود" }, { status: 404 });
    }

    if (preCase.status === "converted") {
      return NextResponse.json({ success: false, error: "تم تحويل هذا الملف مسبقاً" }, { status: 400 });
    }

    if (!preCase.clientId) {
      return NextResponse.json({ success: false, error: "يجب إدخال بيانات الموكل أولاً" }, { status: 400 });
    }

    // إنشاء القضية الجديدة
    const caseNumber = internalNumber || `${preCase.preCaseNumber.replace("PRE-", "")}`;
    const newCase = await db.case.create({
      data: {
        internalNumber: caseNumber,
        year: new Date().getFullYear(),
        caseType: preCase.caseType || "civil",
        court: court || null,
        circuit: circuit || null,
        judgeName: judgeName || null,
        clientId: preCase.clientId,
        opponentName: preCase.opponents[0]?.name ?? null,
        opponentLawyer: preCase.opponents[0]?.lawyerName ?? null,
        facts: preCase.facts,
        strategy: preCase.legalFraming,
        status: "active",
        startDate: new Date(),
        priority: "medium",
        preCaseId: preCase.id,
      },
      include: { client: true },
    });

    // نقل الخصوم للقضية
    await db.opponent.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل العقارات للقضية
    await db.property.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل العقود للقضية
    await db.contract.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل روابط المستندات للقضية
    await db.documentLink.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل المهام للقضية
    await db.task.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل المواعيد للقضية
    await db.appointment.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // نقل Timeline events
    await db.timelineEvent.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id },
    });

    // نقل Checklist
    await db.checklistItem.updateMany({
      where: { preCaseId: preCase.id },
      data: { caseId: newCase.id, preCaseId: null },
    });

    // إنشاء إجراء مبدئي للقضية
    await db.caseProcedure.create({
      data: {
        caseId: newCase.id,
        date: new Date(),
        type: "filing",
        description: `رفع الدعوى - تم التحويل من ملف التجهيز ${preCase.preCaseNumber}`,
        performedBy: "النظام",
        status: "completed",
      },
    });

    // تحديث ملف التجهيز
    await db.preCase.update({
      where: { id: preCase.id },
      data: {
        status: "converted",
        convertedCaseId: newCase.id,
        convertedAt: new Date(),
      },
    });

    // Timeline event للتحويل
    await db.timelineEvent.create({
      data: {
        eventType: "converted",
        entityType: "precase",
        entityId: preCase.id,
        title: `تم تحويل ملف التجهيز ${preCase.preCaseNumber} إلى قضية ${newCase.internalNumber}`,
        preCaseId: preCase.id,
        caseId: newCase.id,
        userId: userId || null,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action: "convert",
        entity: "precase",
        entityId: preCase.id,
        entityName: preCase.preCaseNumber,
        details: `تحويل ملف التجهيز إلى قضية ${newCase.internalNumber}`,
      },
    });

    return NextResponse.json({
      success: true,
      case: newCase,
      message: `تم تحويل الملف إلى قضية ${newCase.internalNumber} بنجاح`,
    });
  } catch (error) {
    console.error("Convert preCase error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ في التحويل" }, { status: 500 });
  }
}
