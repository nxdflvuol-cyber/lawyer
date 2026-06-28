import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// النسخ الاحتياطي - تصدير كامل للبيانات
export async function GET() {
  try {
    const [
      users,
      clients,
      cases,
      sessions,
      procedures,
      documents,
      tasks,
      appointments,
      fees,
      payments,
      expenses,
      invoices,
      memos,
      templates,
      aiConversations,
      courts,
      judges,
      library,
      teamMembers,
      backups,
      auditLogs,
      settings,
      evidences,
      communications,
      powers,
      timeEntries,
    ] = await Promise.all([
      db.user.findMany(),
      db.client.findMany(),
      db.case.findMany(),
      db.caseSession.findMany(),
      db.caseProcedure.findMany(),
      db.document.findMany(),
      db.task.findMany(),
      db.appointment.findMany(),
      db.fee.findMany(),
      db.payment.findMany(),
      db.expense.findMany(),
      db.invoice.findMany(),
      db.memo.findMany(),
      db.template.findMany(),
      db.aiConversation.findMany(),
      db.court.findMany(),
      db.judge.findMany(),
      db.legalLibrary.findMany(),
      db.teamMember.findMany(),
      db.backup.findMany(),
      db.auditLog.findMany(),
      db.setting.findMany(),
      db.evidence.findMany(),
      db.communication.findMany(),
      db.powerOfAttorney.findMany(),
      db.timeEntry.findMany(),
    ]);

    const backup = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      data: {
        users,
        clients,
        cases,
        sessions,
        procedures,
        documents,
        tasks,
        appointments,
        fees,
        payments,
        expenses,
        invoices,
        memos,
        templates,
        aiConversations,
        courts,
        judges,
        library,
        teamMembers,
        backups,
        auditLogs,
        settings,
        evidences,
        communications,
        powers,
        timeEntries,
      },
    };

    // تسجيل النسخة
    await db.backup.create({
      data: {
        fileName: `backup-${Date.now()}.json`,
        backupType: "full",
        status: "completed",
        itemCount: Object.values(backup.data).reduce(
          (sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
          0
        ),
      },
    });

    return NextResponse.json({ success: true, backup });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// استعادة البيانات
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { backup, mode = "replace" } = body;

    if (!backup?.data) {
      return NextResponse.json({ success: false, error: "ملف النسخة الاحتياطية غير صالح" }, { status: 400 });
    }

    const data = backup.data;

    // إذا كان الوضع replace، نمسح البيانات الحالية أولاً
    if (mode === "replace") {
      // الترتيب مهم بسبب العلاقات
      await db.auditLog.deleteMany();
      await db.timeEntry.deleteMany();
      await db.communication.deleteMany();
      await db.powerOfAttorney.deleteMany();
      await db.evidence.deleteMany();
      await db.caseProcedure.deleteMany();
      await db.caseSession.deleteMany();
      await db.invoice.deleteMany();
      await db.expense.deleteMany();
      await db.payment.deleteMany();
      await db.fee.deleteMany();
      await db.appointment.deleteMany();
      await db.task.deleteMany();
      await db.document.deleteMany();
      await db.memo.deleteMany();
      await db.case.deleteMany();
      await db.client.deleteMany();
      await db.teamMember.deleteMany();
      await db.judge.deleteMany();
      await db.court.deleteMany();
      await db.legalLibrary.deleteMany();
      await db.template.deleteMany();
      await db.aiConversation.deleteMany();
      await db.setting.deleteMany();
      await db.user.deleteMany();
    }

    // إعادة الإنشاء
    if (data.users?.length) await db.user.createMany({ data: data.users });
    if (data.settings?.length) await db.setting.createMany({ data: data.settings });
    if (data.clients?.length) await db.client.createMany({ data: data.clients });
    if (data.courts?.length) await db.court.createMany({ data: data.courts });
    if (data.judges?.length) await db.judge.createMany({ data: data.judges });
    if (data.teamMembers?.length) await db.teamMember.createMany({ data: data.teamMembers });
    if (data.cases?.length) await db.case.createMany({ data: data.cases });
    if (data.powers?.length) await db.powerOfAttorney.createMany({ data: data.powers });
    if (data.communications?.length) await db.communication.createMany({ data: data.communications });
    if (data.evidences?.length) await db.evidence.createMany({ data: data.evidences });
    if (data.documents?.length) await db.document.createMany({ data: data.documents });
    if (data.tasks?.length) await db.task.createMany({ data: data.tasks });
    if (data.appointments?.length) await db.appointment.createMany({ data: data.appointments });
    if (data.fees?.length) await db.fee.createMany({ data: data.fees });
    if (data.payments?.length) await db.payment.createMany({ data: data.payments });
    if (data.expenses?.length) await db.expense.createMany({ data: data.expenses });
    if (data.invoices?.length) await db.invoice.createMany({ data: data.invoices });
    if (data.memos?.length) await db.memo.createMany({ data: data.memos });
    if (data.templates?.length) await db.template.createMany({ data: data.templates });
    if (data.library?.length) await db.legalLibrary.createMany({ data: data.library });
    if (data.aiConversations?.length) await db.aiConversation.createMany({ data: data.aiConversations });
    if (data.sessions?.length) await db.caseSession.createMany({ data: data.sessions });
    if (data.procedures?.length) await db.caseProcedure.createMany({ data: data.procedures });
    if (data.timeEntries?.length) await db.timeEntry.createMany({ data: data.timeEntries });
    if (data.auditLogs?.length) await db.auditLog.createMany({ data: data.auditLogs });

    return NextResponse.json({
      success: true,
      message: "تمت الاستعادة بنجاح",
      itemCount: Object.values(data).reduce(
        (sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      ),
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء الاستعادة" }, { status: 500 });
  }
}
