// ============================================================
// بوت تليجرام المدمج - يعمل داخل خادم Next.js
// يحتوي على جميع الأدوات اللازمة للتنفيذ الكامل
// ============================================================

import { db } from "./db";

// ============================================================
// قراءة الإعدادات من قاعدة البيانات
// ============================================================

async function getBotToken(): Promise<string> {
  try {
    const setting = await db.setting.findUnique({ where: { id: "telegram_bot_token" } });
    return setting?.value || "";
  } catch {
    return "";
  }
}

async function getAuthorizedChatIds(): Promise<string[]> {
  try {
    const setting = await db.setting.findUnique({ where: { id: "telegram_chat_ids" } });
    if (!setting) return [];
    return JSON.parse(setting.value);
  } catch {
    return [];
  }
}

async function getAiConfig() {
  try {
    const [baseUrl, apiKey, model] = await Promise.all([
      db.setting.findUnique({ where: { id: "ai_base_url" } }),
      db.setting.findUnique({ where: { id: "ai_api_key" } }),
      db.setting.findUnique({ where: { id: "ai_model" } }),
    ]);
    return {
      baseUrl: baseUrl?.value || process.env.AI_PROVIDER_BASE_URL || "https://api.freemodel.dev/v1",
      apiKey: apiKey?.value || process.env.AI_PROVIDER_API_KEY || "",
      model: model?.value || process.env.AI_PROVIDER_MODEL || "gpt-5.5",
    };
  } catch {
    return {
      baseUrl: process.env.AI_PROVIDER_BASE_URL || "https://api.freemodel.dev/v1",
      apiKey: process.env.AI_PROVIDER_API_KEY || "",
      model: process.env.AI_PROVIDER_MODEL || "gpt-5.5",
    };
  }
}

// ============================================================
// جميع الأدوات - تنفيذ كامل (CRUD + بحث + تحليل)
// ============================================================

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; message?: string; error?: string }>> = {

  // ============ الموكلون ============

  search_clients: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.status) where.status = args.status;
    if (args.clientType) where.clientType = args.clientType;
    if (args.query) {
      where.OR = [
        { fullName: { contains: args.query } },
        { phone: { contains: args.query } },
        { idNumber: { contains: args.query } },
        { email: { contains: args.query } },
      ];
    }
    const clients = await db.client.findMany({
      where, take: 10, orderBy: { updatedAt: "desc" },
      include: { _count: { select: { cases: true } } },
    });
    return { success: true, data: clients, message: `تم العثور على ${clients.length} موكل` };
  },

  get_client_details: async (args) => {
    const client = await db.client.findUnique({
      where: { id: args.clientId as string },
      include: {
        cases: { orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, internalNumber: true, caseType: true, status: true } },
        _count: { select: { cases: true, documents: true, payments: true } },
      },
    });
    if (!client) return { success: false, error: "الموكل غير موجود" };
    return { success: true, data: client, message: `تفاصيل الموكل ${client.fullName}` };
  },

  create_client: async (args) => {
    if (!args.fullName) return { success: false, error: "الاسم مطلوب" };
    const client = await db.client.create({
      data: {
        fullName: args.fullName as string,
        phone: (args.phone as string) ?? null,
        email: (args.email as string) ?? null,
        idNumber: (args.idNumber as string) ?? null,
        address: (args.address as string) ?? null,
        city: (args.city as string) ?? null,
        nationality: (args.nationality as string) ?? null,
        clientType: (args.clientType as string) ?? "individual",
        status: "active",
        notes: (args.notes as string) ?? null,
      },
    });
    return { success: true, data: client, message: `تم إنشاء الموكل ${client.fullName} بنجاح (ID: ${client.id})` };
  },

  update_client: async (args) => {
    const updates: Record<string, unknown> = {};
    if (args.fullName) updates.fullName = args.fullName;
    if (args.phone !== undefined) updates.phone = args.phone || null;
    if (args.email !== undefined) updates.email = args.email || null;
    if (args.address !== undefined) updates.address = args.address || null;
    if (args.city !== undefined) updates.city = args.city || null;
    if (args.status) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes || null;

    const client = await db.client.update({
      where: { id: args.clientId as string },
      data: updates,
    });
    return { success: true, data: client, message: `تم تحديث بيانات الموكل ${client.fullName}` };
  },

  delete_client: async (args) => {
    const client = await db.client.findUnique({ where: { id: args.clientId as string } });
    if (!client) return { success: false, error: "الموكل غير موجود" };
    await db.client.delete({ where: { id: args.clientId as string } });
    return { success: true, message: `تم حذف الموكل ${client.fullName}` };
  },

  // ============ القضايا ============

  search_cases: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.status) where.status = args.status;
    if (args.caseType) where.caseType = args.caseType;
    if (args.degree) where.degree = args.degree;
    if (args.query) {
      where.OR = [
        { internalNumber: { contains: args.query } },
        { officialNumber: { contains: args.query } },
        { opponentName: { contains: args.query } },
        { client: { fullName: { contains: args.query } } },
      ];
    }
    const cases = await db.case.findMany({
      where, take: 10, orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        sessions: { orderBy: { sessionDate: "desc" }, take: 1 },
        _count: { select: { sessions: true, documents: true, tasks: true } },
      },
    });
    return { success: true, data: cases, message: `تم العثور على ${cases.length} قضية` };
  },

  get_case_details: async (args) => {
    const caseData = await db.case.findUnique({
      where: { id: args.caseId as string },
      include: {
        client: true,
        sessions: { orderBy: { sessionDate: "desc" }, take: 5 },
        procedures: { orderBy: { date: "desc" }, take: 5 },
        tasks: { where: { status: { not: "completed" } }, take: 5 },
        fees: { orderBy: { createdAt: "desc" }, take: 3 },
        evidences: true,
      },
    });
    if (!caseData) return { success: false, error: "القضية غير موجودة" };
    return { success: true, data: caseData, message: `تفاصيل القضية ${caseData.internalNumber}` };
  },

  create_case: async (args) => {
    if (!args.internalNumber || !args.caseType || !args.clientId) {
      return { success: false, error: "الرقم الداخلي، النوع، والموكل مطلوبون" };
    }
    const client = await db.client.findUnique({ where: { id: args.clientId as string } });
    if (!client) return { success: false, error: "الموكل غير موجود" };

    const newCase = await db.case.create({
      data: {
        internalNumber: args.internalNumber as string,
        officialNumber: (args.officialNumber as string) ?? null,
        year: (args.year as number) ?? new Date().getFullYear(),
        caseType: args.caseType as string,
        caseSubType: (args.caseSubType as string) ?? null,
        court: (args.court as string) ?? null,
        circuit: (args.circuit as string) ?? null,
        degree: (args.degree as string) ?? "primary",
        judgeName: (args.judgeName as string) ?? null,
        clientId: args.clientId as string,
        opponentName: (args.opponentName as string) ?? null,
        opponentLawyer: (args.opponentLawyer as string) ?? null,
        facts: (args.facts as string) ?? null,
        strategy: (args.strategy as string) ?? null,
        estimatedValue: (args.estimatedValue as number) ?? null,
        priority: (args.priority as string) ?? "medium",
        startDate: new Date(),
      },
      include: { client: true },
    });

    // إنشاء إجراء مبدئي
    await db.caseProcedure.create({
      data: {
        caseId: newCase.id,
        date: new Date(),
        type: "filing",
        description: "فتح القضية وتسجيلها في النظام",
        performedBy: "المساعد الذكي (تليجرام)",
        status: "completed",
      },
    });

    return { success: true, data: newCase, message: `تم إنشاء القضية ${newCase.internalNumber} بنجاح للموكل ${client.fullName}` };
  },

  update_case: async (args) => {
    const updates: Record<string, unknown> = {};
    if (args.status) updates.status = args.status;
    if (args.court) updates.court = args.court;
    if (args.circuit) updates.circuit = args.circuit;
    if (args.facts !== undefined) updates.facts = args.facts;
    if (args.strategy !== undefined) updates.strategy = args.strategy;
    if (args.result !== undefined) updates.result = args.result;
    if (args.opponentName !== undefined) updates.opponentName = args.opponentName;
    if (args.priority) updates.priority = args.priority;

    const updated = await db.case.update({
      where: { id: args.caseId as string },
      data: updates,
      include: { client: { select: { fullName: true } } },
    });
    return { success: true, data: updated, message: `تم تحديث القضية ${updated.internalNumber}` };
  },

  delete_case: async (args) => {
    const caseData = await db.case.findUnique({ where: { id: args.caseId as string } });
    if (!caseData) return { success: false, error: "القضية غير موجودة" };
    await db.case.delete({ where: { id: args.caseId as string } });
    return { success: true, message: `تم حذف القضية ${caseData.internalNumber}` };
  },

  // ============ الجلسات ============

  get_sessions: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.caseId) where.caseId = args.caseId;
    if (args.upcoming) {
      where.sessionDate = { gte: new Date() };
    }
    const sessions = await db.caseSession.findMany({
      where, take: 10, orderBy: { sessionDate: args.upcoming ? "asc" : "desc" },
      include: { case: { select: { id: true, internalNumber: true, client: { select: { fullName: true } } } } },
    });
    return { success: true, data: sessions, message: `${sessions.length} جلسة` };
  },

  add_session: async (args) => {
    if (!args.caseId || !args.sessionDate) {
      return { success: false, error: "معرف القضية وتاريخ الجلسة مطلوبان" };
    }
    const session = await db.caseSession.create({
      data: {
        caseId: args.caseId as string,
        sessionDate: new Date(args.sessionDate as string),
        purpose: (args.purpose as string) ?? null,
        court: (args.court as string) ?? null,
        judgeName: (args.judgeName as string) ?? null,
        facts: (args.facts as string) ?? null,
        decisions: (args.decisions as string) ?? null,
        nextSessionDate: args.nextSessionDate ? new Date(args.nextSessionDate as string) : null,
      },
    });

    // إضافة موعد للجلسة القادمة
    if (args.nextSessionDate) {
      const caseData = await db.case.findUnique({ where: { id: args.caseId as string } });
      await db.appointment.create({
        data: {
          title: `جلسة قضية ${caseData?.internalNumber ?? ""}`,
          startDate: new Date(args.nextSessionDate as string),
          eventType: "court_session",
          caseId: args.caseId as string,
          location: (args.court as string) ?? null,
        },
      });
    }

    return { success: true, data: session, message: "تم تسجيل الجلسة بنجاح" };
  },

  postpone_session: async (args) => {
    if (!args.caseId || !args.newDate) {
      return { success: false, error: "معرف القضية والتاريخ الجديد مطلوبان" };
    }
    const lastSession = await db.caseSession.findFirst({
      where: { caseId: args.caseId as string },
      orderBy: { sessionDate: "desc" },
    });
    if (!lastSession) return { success: false, error: "لا توجد جلسات في هذه القضية" };

    const updated = await db.caseSession.update({
      where: { id: lastSession.id },
      data: {
        nextSessionDate: new Date(args.newDate as string),
        adjournReason: (args.reason as string) ?? "تأجيل بناءً على طلب",
      },
    });

    // إنشاء موعد جديد
    const caseData = await db.case.findUnique({ where: { id: args.caseId as string } });
    await db.appointment.create({
      data: {
        title: `جلسة مؤجلة - قضية ${caseData?.internalNumber ?? ""}`,
        startDate: new Date(args.newDate as string),
        eventType: "court_session",
        caseId: args.caseId as string,
      },
    });

    return { success: true, data: updated, message: `تم تأجيل الجلسة إلى ${new Date(args.newDate as string).toLocaleDateString("ar-EG")}` };
  },

  // ============ الإجراءات ============

  add_procedure: async (args) => {
    if (!args.caseId || !args.type || !args.description) {
      return { success: false, error: "معرف القضية، النوع، والوصف مطلوبة" };
    }
    const procedure = await db.caseProcedure.create({
      data: {
        caseId: args.caseId as string,
        date: args.date ? new Date(args.date as string) : new Date(),
        type: args.type as string,
        description: args.description as string,
        performedBy: (args.performedBy as string) ?? "المساعد الذكي (تليجرام)",
        result: (args.result as string) ?? null,
        status: (args.status as string) ?? "completed",
      },
    });
    return { success: true, data: procedure, message: "تم إضافة الإجراء بنجاح" };
  },

  // ============ المستندات ============

  search_documents: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.category) where.category = args.category;
    if (args.caseId) where.caseId = args.caseId;
    if (args.clientId) where.clientId = args.clientId;
    if (args.query) {
      where.OR = [
        { title: { contains: args.query } },
        { description: { contains: args.query } },
        { tags: { contains: args.query } },
        { textContent: { contains: args.query } },
      ];
    }
    const docs = await db.document.findMany({
      where, take: 10, orderBy: { createdAt: "desc" },
      include: {
        case: { select: { id: true, internalNumber: true } },
        client: { select: { id: true, fullName: true } },
      },
    });
    const light = docs.map((d) => ({ ...d, fileData: undefined }));
    return { success: true, data: light, message: `تم العثور على ${docs.length} مستند` };
  },

  // ============ المهام ============

  create_task: async (args) => {
    if (!args.title) return { success: false, error: "عنوان المهمة مطلوب" };
    const task = await db.task.create({
      data: {
        title: args.title as string,
        description: (args.description as string) ?? null,
        priority: (args.priority as string) ?? "medium",
        dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
        caseId: (args.caseId as string) ?? null,
        clientId: (args.clientId as string) ?? null,
        status: "todo",
      },
      include: {
        case: { select: { internalNumber: true } },
        client: { select: { fullName: true } },
      },
    });
    return { success: true, data: task, message: `تم إنشاء المهمة "${task.title}" بنجاح` };
  },

  list_tasks: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.status) where.status = args.status;
    else where.status = { not: "completed" };
    if (args.overdue) {
      where.dueDate = { lt: new Date() };
    }
    const tasks = await db.task.findMany({
      where, take: 15, orderBy: { dueDate: "asc" },
      include: {
        case: { select: { internalNumber: true } },
        client: { select: { fullName: true } },
      },
    });
    return { success: true, data: tasks, message: `تم العثور على ${tasks.length} مهمة` };
  },

  update_task: async (args) => {
    const updates: Record<string, unknown> = {};
    if (args.status) updates.status = args.status;
    if (args.priority) updates.priority = args.priority;
    if (args.title) updates.title = args.title;
    if (args.dueDate) updates.dueDate = new Date(args.dueDate as string);

    const task = await db.task.update({
      where: { id: args.taskId as string },
      data: updates,
    });
    return { success: true, data: task, message: `تم تحديث المهمة "${task.title}"` };
  },

  delete_task: async (args) => {
    const task = await db.task.findUnique({ where: { id: args.taskId as string } });
    if (!task) return { success: false, error: "المهمة غير موجودة" };
    await db.task.delete({ where: { id: args.taskId as string } });
    return { success: true, message: `تم حذف المهمة "${task.title}"` };
  },

  // ============ المواعيد ============

  list_appointments: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.date) {
      const d = new Date(args.date as string);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.startDate = { gte: d, lt: next };
    } else if (args.upcoming) {
      where.startDate = { gte: new Date() };
    }
    const apts = await db.appointment.findMany({
      where, take: 15, orderBy: { startDate: "asc" },
      include: {
        case: { select: { internalNumber: true } },
        client: { select: { fullName: true } },
      },
    });
    return { success: true, data: apts, message: `تم العثور على ${apts.length} موعد` };
  },

  create_appointment: async (args) => {
    if (!args.title || !args.startDate) {
      return { success: false, error: "العنوان وتاريخ البداية مطلوبان" };
    }
    const apt = await db.appointment.create({
      data: {
        title: args.title as string,
        startDate: new Date(args.startDate as string),
        endDate: args.endDate ? new Date(args.endDate as string) : null,
        eventType: (args.eventType as string) ?? "other",
        location: (args.location as string) ?? null,
        court: (args.court as string) ?? null,
        caseId: (args.caseId as string) ?? null,
        clientId: (args.clientId as string) ?? null,
        reminder: (args.reminder as number) ?? 60,
      },
    });
    return { success: true, data: apt, message: `تم إنشاء الموعد "${apt.title}" بنجاح` };
  },

  delete_appointment: async (args) => {
    const apt = await db.appointment.findUnique({ where: { id: args.appointmentId as string } });
    if (!apt) return { success: false, error: "الموعد غير موجود" };
    await db.appointment.delete({ where: { id: args.appointmentId as string } });
    return { success: true, message: `تم حذف الموعد "${apt.title}"` };
  },

  // ============ المالية ============

  get_finance_summary: async () => {
    const [income, expense, pendingFees] = await Promise.all([
      db.payment.aggregate({ _sum: { amount: true } }),
      db.expense.aggregate({ _sum: { amount: true } }),
      db.fee.aggregate({
        _sum: { amount: true, paidAmount: true },
        where: { status: { not: "paid" } },
      }),
    ]);
    return {
      success: true,
      data: {
        totalIncome: income._sum.amount ?? 0,
        totalExpenses: expense._sum.amount ?? 0,
        netIncome: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0),
        pendingFees: (pendingFees._sum.amount ?? 0) - (pendingFees._sum.paidAmount ?? 0),
      },
      message: "ملخص مالي",
    };
  },

  get_overdue_payments: async () => {
    const overdue = await db.fee.findMany({
      where: { status: { not: "paid" }, dueDate: { lt: new Date() } },
      take: 10,
      include: { case: { include: { client: true } } },
    });
    return { success: true, data: overdue, message: `يوجد ${overdue.length} أتعاب متأخرة` };
  },

  create_fee: async (args) => {
    if (!args.caseId || !args.amount) {
      return { success: false, error: "معرف القضية والمبلغ مطلوبان" };
    }
    const fee = await db.fee.create({
      data: {
        caseId: args.caseId as string,
        feeType: (args.feeType as string) ?? "fixed",
        amount: args.amount as number,
        paidAmount: (args.paidAmount as number) ?? 0,
        description: (args.description as string) ?? null,
        dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
        status: (args.status as string) ?? "unpaid",
      },
    });
    return { success: true, data: fee, message: `تم إنشاء أتعاب بقيمة ${args.amount}` };
  },

  create_payment: async (args) => {
    if (!args.clientId || !args.amount) {
      return { success: false, error: "معرف الموكل والمبلغ مطلوبان" };
    }
    const payment = await db.payment.create({
      data: {
        clientId: args.clientId as string,
        caseId: (args.caseId as string) ?? null,
        amount: args.amount as number,
        paymentMethod: (args.paymentMethod as string) ?? "cash",
        reference: (args.reference as string) ?? null,
        notes: (args.notes as string) ?? null,
      },
    });

    // تحديث حالة الأتعاب إذا تم تحديد feeId
    if (args.feeId) {
      const fee = await db.fee.findUnique({ where: { id: args.feeId as string } });
      if (fee) {
        const newPaid = fee.paidAmount + (args.amount as number);
        await db.fee.update({
          where: { id: args.feeId as string },
          data: {
            paidAmount: newPaid,
            status: newPaid >= fee.amount ? "paid" : "partial",
          },
        });
      }
    }

    return { success: true, data: payment, message: `تم تسجيل دفعة بقيمة ${args.amount}` };
  },

  create_expense: async (args) => {
    if (!args.amount || !args.category) {
      return { success: false, error: "المبلغ والفئة مطلوبة" };
    }
    const expense = await db.expense.create({
      data: {
        caseId: (args.caseId as string) ?? null,
        clientId: (args.clientId as string) ?? null,
        category: args.category as string,
        amount: args.amount as number,
        description: (args.description as string) ?? null,
      },
    });
    return { success: true, data: expense, message: `تم تسجيل مصروف بقيمة ${args.amount}` };
  },

  // ============ الإحصائيات ============

  get_stats: async () => {
    const [cases, activeCases, clients, tasks, overdueTasks, appointmentsToday, documents, pendingFees] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: "active" } }),
      db.client.count(),
      db.task.count({ where: { status: { not: "completed" } } }),
      db.task.count({ where: { status: { not: "completed" }, dueDate: { lt: new Date() } } }),
      db.appointment.count({
        where: {
          startDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      db.document.count(),
      db.fee.aggregate({ _sum: { amount: true }, where: { status: { not: "paid" } } }),
    ]);
    return {
      success: true,
      data: { cases, activeCases, clients, tasks, overdueTasks, appointmentsToday, documents, pendingFees: pendingFees._sum.amount ?? 0 },
      message: "إحصائيات النظام",
    };
  },

  // ============ إدارة التوكيلات ============

  create_power_of_attorney: async (args) => {
    if (!args.clientId || !args.poaNumber || !args.issueDate) {
      return { success: false, error: "معرف الموكل، رقم التوكيل، وتاريخ الإصدار مطلوبة" };
    }
    const poa = await db.powerOfAttorney.create({
      data: {
        clientId: args.clientId as string,
        poaNumber: args.poaNumber as string,
        issuer: (args.issuer as string) ?? null,
        poaType: (args.poaType as string) ?? "توكيل خاص",
        scope: (args.scope as string) ?? null,
        issueDate: new Date(args.issueDate as string),
        expiryDate: args.expiryDate ? new Date(args.expiryDate as string) : null,
        status: "active",
      },
    });
    return { success: true, data: poa, message: `تم إنشاء التوكيل رقم ${poa.poaNumber}` };
  },

  // ============ سجل التواصل ============

  add_communication: async (args) => {
    if (!args.clientId || !args.type || !args.subject) {
      return { success: false, error: "معرف الموكل، النوع، والموضوع مطلوبة" };
    }
    const comm = await db.communication.create({
      data: {
        clientId: args.clientId as string,
        type: args.type as string,
        subject: args.subject as string,
        summary: (args.summary as string) ?? null,
        followUp: (args.followUp as string) ?? null,
        followUpDate: args.followUpDate ? new Date(args.followUpDate as string) : null,
        priority: (args.priority as string) ?? "normal",
      },
    });
    return { success: true, data: comm, message: `تم تسجيل التواصل: ${comm.subject}` };
  },

  // ============ سجل التدقيق ============

  add_audit_log: async (args) => {
    const log = await db.auditLog.create({
      data: {
        action: (args.action as string) ?? "telegram_action",
        entity: (args.entity as string) ?? "telegram",
        entityId: (args.entityId as string) ?? null,
        details: (args.details as string) ?? "إجراء عبر تليجرام",
      },
    });
    return { success: true, data: log, message: "تم تسجيل الإجراء في سجل التدقيق" };
  },
};

// ============================================================
// تعريفات الأدوات (لإرسالها للنموذج)
// ============================================================

const TOOL_DEFINITIONS = [
  // --- الموكلون ---
  { type: "function", function: { name: "search_clients", description: "البحث في الموكلين بالاسم أو الهاتف أو رقم الهوية. استخدمها عند البحث عن موكل موجود.", parameters: { type: "object", properties: { query: { type: "string", description: "كلمة البحث (الاسم، الهاتف، رقم الهوية)" }, status: { type: "string", enum: ["active", "former", "potential", "consultation"] }, clientType: { type: "string", enum: ["individual", "company"] } } } } },
  { type: "function", function: { name: "get_client_details", description: "الحصول على تفاصيل موكل كاملة مع قضاياه", parameters: { type: "object", properties: { clientId: { type: "string", description: "معرف الموكل" } }, required: ["clientId"] } } },
  { type: "function", function: { name: "create_client", description: "إنشاء موكل جديد. استخدمها عند طلب إضافة موكل جديد.", parameters: { type: "object", properties: { fullName: { type: "string", description: "الاسم الكامل" }, phone: { type: "string", description: "رقم الهاتف" }, email: { type: "string", description: "البريد الإلكتروني" }, idNumber: { type: "string", description: "رقم الهوية" }, address: { type: "string", description: "العنوان" }, city: { type: "string", description: "المدينة" }, nationality: { type: "string", description: "الجنسية" }, clientType: { type: "string", enum: ["individual", "company"], description: "نوع الموكل" }, notes: { type: "string", description: "ملاحظات" } }, required: ["fullName"] } } },
  { type: "function", function: { name: "update_client", description: "تحديث بيانات موكل موجود", parameters: { type: "object", properties: { clientId: { type: "string", description: "معرف الموكل" }, fullName: { type: "string" }, phone: { type: "string" }, email: { type: "string" }, address: { type: "string" }, city: { type: "string" }, status: { type: "string", enum: ["active", "former", "potential", "consultation"] }, notes: { type: "string" } }, required: ["clientId"] } } },
  { type: "function", function: { name: "delete_client", description: "حذف موكل من النظام", parameters: { type: "object", properties: { clientId: { type: "string", description: "معرف الموكل" } }, required: ["clientId"] } } },

  // --- القضايا ---
  { type: "function", function: { name: "search_cases", description: "البحث في القضايا. استخدمها عند البحث عن قضية أو عرض القضايا.", parameters: { type: "object", properties: { query: { type: "string", description: "كلمة البحث (رقم القضية، اسم الموكل، اسم الخصم)" }, status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"] }, caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"] }, degree: { type: "string", enum: ["primary", "appeal", "cassation"] } } } } },
  { type: "function", function: { name: "get_case_details", description: "الحصول على تفاصيل قضية كاملة (الجلسات، الإجراءات، المهام، الأتعاب)", parameters: { type: "object", properties: { caseId: { type: "string", description: "معرف القضية" } }, required: ["caseId"] } } },
  { type: "function", function: { name: "create_case", description: "إنشاء قضية جديدة. استخدمها عند طلب إنشاء قضية. يجب البحث عن الموكل أولاً للحصول على clientId.", parameters: { type: "object", properties: { internalNumber: { type: "string", description: "الرقم الداخلي للقضية" }, caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"] }, clientId: { type: "string", description: "معرف الموكل (UUID) - استخدم search_clients للحصول عليه" }, opponentName: { type: "string", description: "اسم الخصم" }, court: { type: "string", description: "اسم المحكمة" }, facts: { type: "string", description: "وقائع القضية" }, priority: { type: "string", enum: ["urgent", "high", "medium", "low"] } }, required: ["internalNumber", "caseType", "clientId"] } } },
  { type: "function", function: { name: "update_case", description: "تحديث بيانات قضية (الحالة، الوقائع، الاستراتيجية، النتيجة)", parameters: { type: "object", properties: { caseId: { type: "string" }, status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"] }, court: { type: "string" }, facts: { type: "string" }, strategy: { type: "string" }, result: { type: "string" }, priority: { type: "string", enum: ["urgent", "high", "medium", "low"] } }, required: ["caseId"] } } },
  { type: "function", function: { name: "delete_case", description: "حذف قضية من النظام", parameters: { type: "object", properties: { caseId: { type: "string" } }, required: ["caseId"] } } },

  // --- الجلسات ---
  { type: "function", function: { name: "get_sessions", description: "عرض الجلسات (القادمة أو لقضية معينة)", parameters: { type: "object", properties: { caseId: { type: "string" }, upcoming: { type: "boolean", description: "الجلسات القادمة فقط" } } } } },
  { type: "function", function: { name: "add_session", description: "تسجيل جلسة جديدة لقضية", parameters: { type: "object", properties: { caseId: { type: "string" }, sessionDate: { type: "string", description: "تاريخ الجلسة (ISO)" }, purpose: { type: "string" }, court: { type: "string" }, facts: { type: "string" }, decisions: { type: "string" }, nextSessionDate: { type: "string", description: "تاريخ الجلسة القادمة (ISO)" } }, required: ["caseId", "sessionDate"] } } },
  { type: "function", function: { name: "postpone_session", description: "تأجيل جلسة إلى تاريخ لاحق", parameters: { type: "object", properties: { caseId: { type: "string" }, newDate: { type: "string", description: "التاريخ الجديد (ISO)" }, reason: { type: "string" } }, required: ["caseId", "newDate"] } } },

  // --- الإجراءات ---
  { type: "function", function: { name: "add_procedure", description: "إضافة إجراء لقضية (رفع دعوى، إعلان، حكم، طعن، تنفيذ)", parameters: { type: "object", properties: { caseId: { type: "string" }, type: { type: "string", enum: ["filing", "notification", "hearing", "ruling", "appeal", "execution"] }, description: { type: "string" }, result: { type: "string" } }, required: ["caseId", "type", "description"] } } },

  // --- المستندات ---
  { type: "function", function: { name: "search_documents", description: "البحث في المستندات", parameters: { type: "object", properties: { query: { type: "string" }, category: { type: "string", enum: ["contract", "pleading", "ruling", "evidence", "correspondence", "other"] }, caseId: { type: "string" }, clientId: { type: "string" } } } } },

  // --- المهام ---
  { type: "function", function: { name: "create_task", description: "إنشاء مهمة جديدة", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["urgent", "high", "medium", "low"] }, dueDate: { type: "string", description: "تاريخ الاستحقاق (ISO)" }, caseId: { type: "string" }, clientId: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "list_tasks", description: "عرض قائمة المهام", parameters: { type: "object", properties: { status: { type: "string", enum: ["todo", "in_progress", "completed", "cancelled"] }, overdue: { type: "boolean" } } } } },
  { type: "function", function: { name: "update_task", description: "تحديث مهمة (الحالة، الأولوية)", parameters: { type: "object", properties: { taskId: { type: "string" }, status: { type: "string", enum: ["todo", "in_progress", "completed", "cancelled"] }, priority: { type: "string", enum: ["urgent", "high", "medium", "low"] } }, required: ["taskId"] } } },
  { type: "function", function: { name: "delete_task", description: "حذف مهمة", parameters: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] } } },

  // --- المواعيد ---
  { type: "function", function: { name: "list_appointments", description: "عرض قائمة المواعيد", parameters: { type: "object", properties: { date: { type: "string", description: "تاريخ محدد (ISO)" }, upcoming: { type: "boolean" } } } } },
  { type: "function", function: { name: "create_appointment", description: "إنشاء موعد جديد", parameters: { type: "object", properties: { title: { type: "string" }, startDate: { type: "string", description: "تاريخ ووقت البداية (ISO)" }, eventType: { type: "string", enum: ["court_session", "client_meeting", "deadline", "task", "consultation", "hearing", "other"] }, location: { type: "string" }, caseId: { type: "string" }, clientId: { type: "string" } }, required: ["title", "startDate"] } } },
  { type: "function", function: { name: "delete_appointment", description: "حذف موعد", parameters: { type: "object", properties: { appointmentId: { type: "string" } }, required: ["appointmentId"] } } },

  // --- المالية ---
  { type: "function", function: { name: "get_finance_summary", description: "ملخص مالي شامل (الدخل، المصروفات، الأتعاب المعلقة)", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_overdue_payments", description: "عرض الأتعاب المتأخرة", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "create_fee", description: "إنشاء أتعاب جديدة لقضية", parameters: { type: "object", properties: { caseId: { type: "string" }, amount: { type: "number" }, feeType: { type: "string", enum: ["fixed", "hourly", "percentage", "mixed", "staged"] }, description: { type: "string" }, dueDate: { type: "string" } }, required: ["caseId", "amount"] } } },
  { type: "function", function: { name: "create_payment", description: "تسجيل دفعة من موكل", parameters: { type: "object", properties: { clientId: { type: "string" }, caseId: { type: "string" }, amount: { type: "number" }, paymentMethod: { type: "string", enum: ["cash", "check", "transfer", "card"] }, reference: { type: "string" }, notes: { type: "string" } }, required: ["clientId", "amount"] } } },
  { type: "function", function: { name: "create_expense", description: "تسجيل مصروف", parameters: { type: "object", properties: { amount: { type: "number" }, category: { type: "string", enum: ["court_fees", "travel", "documents", "experts", "other"] }, description: { type: "string" }, caseId: { type: "string" } }, required: ["amount", "category"] } } },

  // --- إحصائيات ---
  { type: "function", function: { name: "get_stats", description: "إحصائيات عامة عن النظام", parameters: { type: "object", properties: {} } } },

  // --- توكيلات ---
  { type: "function", function: { name: "create_power_of_attorney", description: "إنشاء توكيل لموكل", parameters: { type: "object", properties: { clientId: { type: "string" }, poaNumber: { type: "string" }, issuer: { type: "string" }, poaType: { type: "string" }, scope: { type: "string" }, issueDate: { type: "string" }, expiryDate: { type: "string" } }, required: ["clientId", "poaNumber", "issueDate"] } } },

  // --- سجل التواصل ---
  { type: "function", function: { name: "add_communication", description: "تسجيل تواصل مع موكل (مكالمة، اجتماع، زيارة)", parameters: { type: "object", properties: { clientId: { type: "string" }, type: { type: "string", enum: ["call", "meeting", "email", "message", "visit"] }, subject: { type: "string" }, summary: { type: "string" }, priority: { type: "string", enum: ["low", "normal", "high", "urgent"] } }, required: ["clientId", "type", "subject"] } } },
];

// ============================================================
// تشغيل الوكيل الذكي
// ============================================================

const SYSTEM_PROMPT = `أنت مساعد قانوني ذكي عبر تليجرام لنظام "المحامي الشامل".
أنت وكيل ذكي قادر على تنفيذ الأوامر - ليس مجرد شات بوت.

يمكنك:
- إنشاء، تعديل، حذف الموكلين والقضايا
- إضافة جلسات وإجراءات وتأجيل جلسات
- إنشاء مهام ومواعيد
- تسجيل مدفوعات ومصروفات وأتعاب
- البحث في كل بيانات النظام
- تقديم استشارات قانونية

مبادئ عملك:
1. افهم نية المستخدم بدقة
2. اختر الأداة المناسبة تلقائياً
3. إذا كان الطلب يحتاج بيانات، ابحث عنها أولاً
4. نفّذ الإجراء وأكد نجاحه
5. أجب بالعربية بشكل موجز ومباشر

أمثلة:
- "أضف موكل جديد اسمه حسين شعبان" → استخدم create_client
- "كم عدد القضايا؟" → استخدم get_stats
- "اعرض قضايا الموكل أحمد" → استخدم search_clients ثم search_cases
- "أجل جلسة القضية 2024/001 للأسبوع القادم" → استخدم search_cases ثم postpone_session

كن دقيقاً وموجزاً. استخدم Markdown الخفيف للتنظيم.`;

// استيراد نظام الذاكرة من ai-agent
import { quickAgentResponse } from "./ai-agent";

/**
 * تشغيل الوكيل الذكي مع الذاكرة
 * يستخدم chatId كـ sessionId للحفاظ على سياق المحادثة
 */
async function runAgent(userMessage: string, chatId?: string): Promise<string> {
  const sessionId = chatId ? `telegram-${chatId}` : "telegram-default";
  return await quickAgentResponse(userMessage, undefined, sessionId);
}

// ============================================================
// إرسال رسالة تليجرام
// ============================================================

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = await getBotToken();
  if (!token) return false;
  try {
    // تقسيم الرسائل الطويلة (تليجرام حد 4096 حرف)
    const maxLength = 4000;
    if (text.length > maxLength) {
      const parts = [];
      for (let i = 0; i < text.length; i += maxLength) {
        parts.push(text.slice(i, i + maxLength));
      }
      for (const part of parts) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: part }),
          signal: AbortSignal.timeout(15000),
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      return true;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ============================================================
// معالجة رسالة تليجرام
// ============================================================

async function handleTelegramMessage(chatId: string, text: string) {
  // === معالجة تأكيد إضافة موكل من صورة ===
  const pendingExtraction = pendingImageExtractions.get(chatId);
  if (pendingExtraction) {
    const confirmWords = ["نعم أضف", "نعم", "أضف", "أكّد", "اكد", "ايوة", "اه", "yes", "confirm"];
    const cancelWords = ["لا", "إلغاء", "الغاء", "cancel", "no", "stop"];

    if (confirmWords.some((w) => text.toLowerCase().includes(w.toLowerCase()))) {
      // المستخدم أكّد - أنشئ الموكل
      pendingImageExtractions.delete(chatId);
      try {
        const client = await db.client.create({
          data: {
            fullName: pendingExtraction.fullName || "اسم غير محدد",
            phone: pendingExtraction.phone || null,
            email: pendingExtraction.email || null,
            idNumber: pendingExtraction.idNumber || null,
            address: pendingExtraction.address || null,
            city: pendingExtraction.city || null,
            nationality: pendingExtraction.nationality || null,
            clientType: "individual",
            status: "active",
          },
        });

        let msg = `✅ تم إنشاء الموكل بنجاح!\n\n`;
        msg += `👤 الاسم: ${client.fullName}\n`;
        msg += `🆔 المعرف: ${client.id}\n`;
        if (client.phone) msg += `📞 الهاتف: ${client.phone}\n`;
        if (client.idNumber) msg += `🆔 رقم الهوية: ${client.idNumber}\n`;

        // إذا كان توكيل، أضفه
        if (pendingExtraction.type === "power_of_attorney" && pendingExtraction.poaNumber) {
          try {
            const poa = await db.powerOfAttorney.create({
              data: {
                clientId: client.id,
                poaNumber: pendingExtraction.poaNumber,
                issuer: pendingExtraction.issuer || null,
                poaType: pendingExtraction.poaType || "توكيل خاص",
                scope: pendingExtraction.scope || null,
                issueDate: pendingExtraction.issueDate ? new Date(pendingExtraction.issueDate) : new Date(),
                expiryDate: pendingExtraction.expiryDate ? new Date(pendingExtraction.expiryDate) : null,
                status: "active",
              },
            });
            msg += `\n📝 تم تسجيل التوكيل رقم: ${poa.poaNumber}\n`;
            if (poa.issuer) msg += `🏛️ جهة التوثيق: ${poa.issuer}\n`;
          } catch {
            msg += `\n⚠️ تعذر تسجيل التوكيل (قد يكون الرقم مكرراً)\n`;
          }
        }

        msg += `\n✅ يمكنك الآن إنشاء قضايا لهذا الموكل.`;
        await sendTelegramMessage(chatId, msg);
      } catch (error) {
        await sendTelegramMessage(chatId, `❌ خطأ في إنشاء الموكل: ${error instanceof Error ? error.message : "خطأ"}`);
      }
      return;
    } else if (cancelWords.some((w) => text.toLowerCase().includes(w.toLowerCase()))) {
      pendingImageExtractions.delete(chatId);
      await sendTelegramMessage(chatId, "✅ تم إلغاء الإضافة.");
      return;
    }
    // إذا كتب شيئاً آخر، اعتبره رسالة جديدة واحذف البيانات المعلقة
    pendingImageExtractions.delete(chatId);
  }

  // أمر /start
  if (text.startsWith("/start")) {
    const reply = `مرحباً بك في المساعد القانوني الذكي ⚖️

━━━━━━━━━━━━━━━━━━━━
📋 معرف الشات الخاص بك:
━━━━━━━━━━━━━━━━━━━━
  ${chatId}
━━━━━━━━━━━━━━━━━━━━

📌 لتفعيل الوصول:
1. افتح نظام "المحامي الشامل"
2. اذهب للإعدادات ← تليجرام
3. أضف هذا الرقم في "المعرفات المصرح لها":
   ${chatId}

✅ بعد الإضافة، يمكنني:
• إنشاء وتعديل وحذف الموكلين والقضايا
• تسجيل الجلسات وتأجيلها
• إضافة المهام والمواعيد
• تسجيل المدفوعات والمصروفات
• البحث في كل البيانات
• تقديم استشارات قانونية

📸 رفع الصور:
• ارفع صورة توكيل ← أستخرج البيانات وأضيف الموكل تلقائياً
• ارفع صورة بطاقة هوية ← أستخرج البيانات
• ارفع أي مستند ← أحفظه في النظام

📎 رفع المستندات:
• ارفع PDF أو Word ← أحفظه في أرشيف المستندات

💡 أمثلة:
• "أضف موكل جديد اسمه حسين شعبان"
• "كم عدد القضايا؟"
• "اعرض قضاياي النشطة"
• "ما جلسات الغد؟"
• "فيه مستحقات متأخرة؟"
• [ارفع صورة توكيل وسأضيف الموكل تلقائياً]`;
    await sendTelegramMessage(chatId, reply);
    return;
  }

  // أمر /help
  if (text === "/help") {
    await sendTelegramMessage(chatId, `📚 الأوامر المتاحة:

🔧 أوامر سريعة:
/start - بدء الاستخدام
/help - المساعدة
/stats - إحصائيات سريعة
/appointments - مواعيد اليوم
/tasks - مهام معلقة

📝 إدارة الموكلين:
• "أضف موكل: [الاسم]"
• "ابحث عن موكل: [الاسم]"
• "عدّل بيانات موكل: [الاسم]"

⚖️ إدارة القضايا:
• "أنشئ قضية جديدة لـ [الموكل]"
• "اعرض القضايا النشطة"
• "لخص قضية رقم [الرقم]"

📅 الجلسات والمواعيد:
• "ما جلسات الغد؟"
• "أجل جلسة القضية [الرقم]"
• "أضف موعد: [التفاصيل]"

✅ المهام:
• "أضف مهمة: [العنوان]"
• "اعرض المهام المتأخرة"

💰 المالية:
• "أعطني ملخص مالي"
• "فيه مستحقات متأخرة؟"

📸 رفع الصور والمستندات:
• ارفع صورة توكيل ← أضيف الموكل تلقائياً
• ارفع صورة بطاقة هوية ← أستخرج البيانات
• ارفع PDF أو Word ← أحفظه في الأرشيف

أو اكتب أي طلب بالعربية 🇪🇬`);
    return;
  }

  // أوامر سريعة
  if (text === "/stats") {
    const reply = await runAgent("أعطني إحصائيات عامة موجزة بالأرقام", chatId);
    await sendTelegramMessage(chatId, reply);
    return;
  }
  if (text === "/appointments") {
    const reply = await runAgent("ما مواعيد اليوم؟", chatId);
    await sendTelegramMessage(chatId, reply);
    return;
  }
  if (text === "/tasks") {
    const reply = await runAgent("اعرض المهام المعلقة", chatId);
    await sendTelegramMessage(chatId, reply);
    return;
  }

  // التحقق من التفويض
  const chatIds = await getAuthorizedChatIds();
  if (!chatIds.includes(chatId)) {
    await sendTelegramMessage(chatId, `🔒 غير مصرح

معرف التليجرام الخاص بك: ${chatId}

للتفعيل:
1. افتح نظام "المحامي الشامل"
2. اذهب للإعدادات → تليجرام
3. أضف هذا المعرف: ${chatId}`);
    return;
  }

  // معالجة بالـ AI
  await sendTelegramMessage(chatId, "⏳ جارٍ المعالجة...");
  try {
    const reply = await runAgent(text, chatId);
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
  }
}

// ============================================================
// معالجة الصور - استخراج بيانات من صور التوكيلات
// ============================================================

async function handleTelegramPhoto(
  chatId: string,
  photo: Array<{ file_id: string; file_size: number; width: number; height: number }>,
  botToken: string,
  caption?: string
) {
  // التحقق من التفويض
  const chatIds = await getAuthorizedChatIds();
  if (!chatIds.includes(chatId)) {
    await sendTelegramMessage(chatId, `🔒 غير مصرح\n\nمعرفك: ${chatId}\nأضفه من الإعدادات ← تليجرام`);
    return;
  }

  await sendTelegramMessage(chatId, "📸 جارٍ معالجة الصورة واستخراج البيانات...");

  try {
    // اختيار أعلى جودة من الصور
    const bestPhoto = photo[photo.length - 1];

    // تحميل الصورة من تليجرام
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${bestPhoto.file_id}`);
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok) {
      await sendTelegramMessage(chatId, "❌ تعذر تحميل الصورة من تليجرام");
      return;
    }

    const filePath = fileInfo.result.file_path;
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    // تنزيل الصورة كـ base64
    const photoRes = await fetch(photoUrl);
    const photoBuffer = await photoRes.arrayBuffer();
    const photoBase64 = Buffer.from(photoBuffer).toString("base64");
    const mimeType = "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${photoBase64}`;

    // استخراج البيانات باستخدام VLM
    const extractedData = await extractDataFromImage(dataUrl, caption);

    if (!extractedData) {
      await sendTelegramMessage(chatId, "❌ تعذر استخراج البيانات من الصورة. تأكد من وضوح الصورة وأنها تحتوي على بيانات واضحة.");
      return;
    }

    // بناء رسالة النتائج
    let resultMsg = "✅ تم استخراج البيانات من الصورة:\n\n";

    // إذا كانت بيانات توكيل
    if (extractedData.type === "power_of_attorney" || extractedData.type === "id_card") {
      resultMsg += "📋 نوع المستند: " + (extractedData.type === "power_of_attorney" ? "توكيل" : "بطاقة هوية") + "\n\n";

      // بيانات الموكل
      if (extractedData.fullName) resultMsg += `👤 الاسم: ${extractedData.fullName}\n`;
      if (extractedData.idNumber) resultMsg += `🆔 رقم الهوية: ${extractedData.idNumber}\n`;
      if (extractedData.phone) resultMsg += `📞 الهاتف: ${extractedData.phone}\n`;
      if (extractedData.address) resultMsg += `📍 العنوان: ${extractedData.address}\n`;
      if (extractedData.nationality) resultMsg += `🌐 الجنسية: ${extractedData.nationality}\n`;

      // بيانات التوكيل
      if (extractedData.poaNumber) resultMsg += `\n📝 رقم التوكيل: ${extractedData.poaNumber}\n`;
      if (extractedData.issuer) resultMsg += `🏛️ جهة التوثيق: ${extractedData.issuer}\n`;
      if (extractedData.poaType) resultMsg += `📋 نوع التوكيل: ${extractedData.poaType}\n`;
      if (extractedData.issueDate) resultMsg += `📅 تاريخ الإصدار: ${extractedData.issueDate}\n`;
      if (extractedData.expiryDate) resultMsg += `⏰ تاريخ الانتهاء: ${extractedData.expiryDate}\n`;
      if (extractedData.scope) resultMsg += `📌 النطاق: ${extractedData.scope}\n`;

      // هل تريد الإضافة؟
      resultMsg += "\n\nهل تريد إضافة هذا الموكل للنظام؟\n";
      resultMsg += "أرسل: \"نعم أضف\" للتأكيد\n";
      resultMsg += "أو: \"لا\" للإلغاء";

      // حفظ البيانات المستخرجة مؤقتاً بانتظار التأكيد
      pendingImageExtractions.set(chatId, extractedData);

      await sendTelegramMessage(chatId, resultMsg);
    } else {
      // مستند آخر - اعرض النص المستخرج
      resultMsg += "📄 النص المستخرج:\n\n";
      resultMsg += extractedData.rawText?.slice(0, 3000) ?? "لا يوجد نص واضح";

      await sendTelegramMessage(chatId, resultMsg);
    }
  } catch (error) {
    console.error("Photo processing error:", error);
    await sendTelegramMessage(chatId, `❌ خطأ في معالجة الصورة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
  }
}

// تخزين مؤقت للبيانات المستخرجة من الصور بانتظار تأكيد المستخدم
const pendingImageExtractions = new Map<string, ExtractedDocumentData>();

interface ExtractedDocumentData {
  type: "power_of_attorney" | "id_card" | "contract" | "other";
  fullName?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  nationality?: string;
  poaNumber?: string;
  issuer?: string;
  poaType?: string;
  issueDate?: string;
  expiryDate?: string;
  scope?: string;
  rawText?: string;
}

/**
 * استخراج البيانات من صورة باستخدام VLM
 */
async function extractDataFromImage(imageDataUrl: string, caption?: string): Promise<ExtractedDocumentData | null> {
  const aiConfig = await getAiConfig();
  if (!aiConfig.apiKey) return null;

  const prompt = `حلل هذه الصورة بدقة واستخرج جميع البيانات القانونية منها.

${caption ? `ملاحظة المستخدم: ${caption}` : ""}

استخرج البيانات التالية (إذا وجدت) وأرجعها بصيغة JSON صحيحة فقط بدون أي نص إضافي:

{
  "type": "power_of_attorney أو id_card أو contract أو other",
  "fullName": "الاسم الكامل",
  "idNumber": "رقم الهوية أو الرقم القومي",
  "phone": "رقم الهاتف إن وجد",
  "email": "البريد الإلكتروني إن وجد",
  "address": "العنوان",
  "city": "المدينة",
  "nationality": "الجنسية",
  "poaNumber": "رقم التوكيل",
  "issuer": "جهة التوثيق",
  "poaType": "نوع التوكيل (خاص/عام)",
  "issueDate": "تاريخ الإصدار بصيغة YYYY-MM-DD",
  "expiryDate": "تاريخ الانتهاء بصيغة YYYY-MM-DD",
  "scope": "نطاق الصلاحيات",
  "rawText": "كل النص المرئي في الصورة"
}

إذا لم تجد قيمة معينة، اتركها فارغة ("").
أرجع JSON فقط بدون أي شرح.`;

  try {
    const response = await fetch(`${aiConfig.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      console.error("VLM API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // استخراج JSON من الرد
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { type: "other", rawText: content };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as ExtractedDocumentData;
  } catch (error) {
    console.error("VLM extraction error:", error);
    return null;
  }
}

/**
 * معالجة المستندات (PDF / Word)
 */
async function handleTelegramDocument(
  chatId: string,
  document: { file_id: string; file_name: string; file_size?: number; mime_type?: string },
  botToken: string,
  caption?: string
) {
  // التحقق من التفويض
  const chatIds = await getAuthorizedChatIds();
  if (!chatIds.includes(chatId)) {
    await sendTelegramMessage(chatId, `🔒 غير مصرح\n\nمعرفك: ${chatId}`);
    return;
  }

  await sendTelegramMessage(chatId, `📎 جارٍ معالجة المستند: ${document.file_name}...`);

  try {
    // تحميل الملف
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${document.file_id}`);
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok) {
      await sendTelegramMessage(chatId, "❌ تعذر تحميل الملف");
      return;
    }

    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const fileRes = await fetch(fileUrl);
    const fileBuffer = await fileRes.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString("base64");

    // تخزين المستند في قاعدة البيانات
    const doc = await db.document.create({
      data: {
        title: caption || document.file_name,
        description: `مستند مرفوع عبر تليجرام`,
        docType: document.mime_type?.includes("pdf") ? "pdf" : document.mime_type?.includes("word") ? "word" : "other",
        category: "other",
        fileName: document.file_name,
        fileSize: document.file_size ?? fileBuffer.byteLength,
        mimeType: document.mime_type ?? "application/octet-stream",
        fileData: `data:${document.mime_type ?? "application/octet-stream"};base64,${fileBase64}`,
        tags: "تليجرام",
      },
    });

    await sendTelegramMessage(chatId, `✅ تم حفظ المستند "${document.file_name}" في النظام\n\n📊 يمكنك ربطه بقضية أو موكل من داخل النظام.`);
  } catch (error) {
    console.error("Document processing error:", error);
    await sendTelegramMessage(chatId, `❌ خطأ في معالجة المستند: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
  }
}

// ============================================================
// Polling - يعمل في الخلفية داخل خادم Next.js
// ============================================================

let pollingActive = false;
let lastUpdateId = 0;

async function startTelegramPolling() {
  if (pollingActive) return;
  pollingActive = true;
  console.log("🔄 Starting Telegram polling...");
  async function poll() {
    if (!pollingActive) return;

    try {
      const token = await getBotToken();
      if (!token) {
        setTimeout(poll, 10000);
        return;
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, {
        signal: AbortSignal.timeout(35000),
      });
      const data = await res.json();

      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;

          if (!update.message?.chat?.id) continue;
          const chatId = String(update.message.chat.id);
          const msg = update.message;

          // === معالجة الرسائل النصية ===
          if (msg.text) {
            console.log(`📩 [${chatId}] ${msg.text}`);
            handleTelegramMessage(chatId, msg.text).catch(console.error);
          }

          // === معالجة الصور (التوكيلات / المستندات) ===
          else if (msg.photo && msg.photo.length > 0) {
            console.log(`📸 [${chatId}] صورة مستلمة`);
            handleTelegramPhoto(chatId, msg.photo, token, msg.caption).catch(console.error);
          }

          // === معالجة المستندات (PDF / Word) ===
          else if (msg.document) {
            console.log(`📎 [${chatId}] مستند مستلم: ${msg.document.file_name}`);
            handleTelegramDocument(chatId, msg.document, token, msg.caption).catch(console.error);
          }
        }
      }
    } catch {
      // تجاهل الأخطاء
    }

    // مواصلة الـ polling
    setTimeout(poll, 1000);
  }

  poll();
}

// ============================================================
// تصدير الدوال
// ============================================================

export {
  startTelegramPolling,
  sendTelegramMessage,
  handleTelegramMessage,
  getBotToken,
  getAuthorizedChatIds,
  runAgent as runTelegramAgent,
};
