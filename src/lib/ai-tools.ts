// ============================================================
// AI Tools - الأدوات التي يمكن للـ AI استدعاؤها لتنفيذ أوامر
// ============================================================

import { db } from "./db";

// ============================================================
// parser مرن للتواريخ - يدعم صيغ متعددة
// ============================================================

/**
 * يحوّل تاريخ من صيغ متعددة إلى كائن Date صالح
 * يدعم: ISO (2026-07-11), DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD,
 * تواريخ نسبية (اليوم، غداً), تواريخ عربية
 */
export function parseFlexibleDate(input: string): Date {
  if (!input) return new Date();
  const str = String(input).trim();

  // 1. ISO format already (2026-07-11T09:00:00 or 2026-07-11)
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime()) && str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return isoDate;
  }

  // 2. DD/MM/YYYY or MM/DD/YYYY (نفترض DD/MM/YYYY للعالم العربي)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch;
    let day = parseInt(d, 10);
    let month = parseInt(m, 10);
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    // إذا كان الأول > 12، فهو اليوم؛ وإلا نفترض DD/MM
    if (day > 12 && month <= 12) {
      // swap not needed - day is correct
    } else if (month > 12 && day <= 12) {
      // MM/DD format - swap
      [day, month] = [month, day];
    }
    // افتراضي: DD/MM/YYYY
    const date = new Date(year, month - 1, day, 9, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }

  // 3. YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 9, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }

  // 4. تواريخ نسبية عربية
  const lower = str.toLowerCase();
  if (lower.includes("اليوم") || lower.includes("today")) {
    return new Date();
  }
  if (lower.includes("غدا") || lower.includes("غدًا") || lower.includes("tomorrow")) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t;
  }
  if (lower.includes("بعد غد")) {
    const t = new Date();
    t.setDate(t.getDate() + 2);
    return t;
  }
  if (lower.includes("أمس") || lower.includes("البارحة") || lower.includes("yesterday")) {
    const t = new Date();
    t.setDate(t.getDate() - 1);
    return t;
  }

  // 5. محاولة أخيرة
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  // 6. إذا فشل كل شيء، استخدم اليوم
  console.warn(`parseFlexibleDate: failed to parse "${str}", using now`);
  return new Date();
}

// ============================================================
// تعريف أنواع الأدوات
// ============================================================

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// ============================================================
// تنفيذ الأدوات
// ============================================================

// --- أدوار القضايا ---

async function searchCases(args: { query?: string; status?: string; caseType?: string }): Promise<ToolResult> {
  const where: Record<string, unknown> = {};
  if (args.status) where.status = args.status;
  if (args.caseType) where.caseType = args.caseType;
  if (args.query) {
    where.OR = [
      { internalNumber: { contains: args.query } },
      { officialNumber: { contains: args.query } },
      { opponentName: { contains: args.query } },
      { client: { fullName: { contains: args.query } } },
    ];
  }
  const cases = await db.case.findMany({
    where,
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      sessions: { orderBy: { sessionDate: "desc" }, take: 1 },
      _count: { select: { sessions: true, documents: true, tasks: true } },
    },
  });
  return {
    success: true,
    data: cases,
    message: `تم العثور على ${cases.length} قضية`,
  };
}

async function getCaseDetails(args: { caseId: string }): Promise<ToolResult> {
  const caseData = await db.case.findUnique({
    where: { id: args.caseId },
    include: {
      client: true,
      sessions: { orderBy: { sessionDate: "desc" }, take: 5 },
      procedures: { orderBy: { date: "desc" }, take: 5 },
      tasks: { where: { status: { not: "completed" } }, take: 5 },
      fees: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!caseData) return { success: false, error: "القضية غير موجودة" };
  return { success: true, data: caseData, message: `تفاصيل القضية ${caseData.internalNumber}` };
}

async function createCase(args: {
  internalNumber: string;
  caseType: string;
  clientId: string;
  opponentName?: string;
  court?: string;
  facts?: string;
  degree?: string;
  year?: number;
}): Promise<ToolResult> {
  // التحقق من وجود الموكل
  const client = await db.client.findUnique({ where: { id: args.clientId } });
  if (!client) return { success: false, error: "الموكل غير موجود" };

  const newCase = await db.case.create({
    data: {
      internalNumber: args.internalNumber,
      caseType: args.caseType,
      clientId: args.clientId,
      opponentName: args.opponentName ?? null,
      court: args.court ?? null,
      facts: args.facts ?? null,
      degree: args.degree ?? "primary",
      year: args.year ?? new Date().getFullYear(),
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
      performedBy: "المساعد الذكي",
      status: "completed",
    },
  });

  return {
    success: true,
    data: newCase,
    message: `تم إنشاء القضية ${newCase.internalNumber} بنجاح للموكل ${client.fullName}`,
  };
}

async function updateCase(args: { caseId: string; status?: string; court?: string; facts?: string; strategy?: string; result?: string }): Promise<ToolResult> {
  const updates: Record<string, unknown> = {};
  if (args.status) updates.status = args.status;
  if (args.court) updates.court = args.court;
  if (args.facts) updates.facts = args.facts;
  if (args.strategy) updates.strategy = args.strategy;
  if (args.result) updates.result = args.result;

  const updated = await db.case.update({
    where: { id: args.caseId },
    data: updates,
    include: { client: { select: { fullName: true } } },
  });
  return { success: true, data: updated, message: `تم تحديث القضية ${updated.internalNumber}` };
}

// --- أدوار الجلسات ---

async function addSession(args: {
  caseId: string;
  sessionDate: string;
  purpose?: string;
  court?: string;
  judgeName?: string;
  facts?: string;
  decisions?: string;
  nextSessionDate?: string;
}): Promise<ToolResult> {
  const session = await db.caseSession.create({
    data: {
      caseId: args.caseId,
      sessionDate: parseFlexibleDate(args.sessionDate),
      purpose: args.purpose ?? null,
      court: args.court ?? null,
      judgeName: args.judgeName ?? null,
      facts: args.facts ?? null,
      decisions: args.decisions ?? null,
      nextSessionDate: args.nextSessionDate ? parseFlexibleDate(args.nextSessionDate) : null,
    },
  });

  // إذا كانت هناك جلسة قادمة، أضفها كموعد
  if (args.nextSessionDate) {
    const caseData = await db.case.findUnique({ where: { id: args.caseId } });
    await db.appointment.create({
      data: {
        title: `جلسة قضية ${caseData?.internalNumber ?? ""}`,
        startDate: new Date(args.nextSessionDate),
        eventType: "court_session",
        caseId: args.caseId,
        location: args.court ?? null,
      },
    });
  }

  return { success: true, data: session, message: "تم تسجيل الجلسة بنجاح" };
}

async function postponeSession(args: { caseId: string; newDate: string; reason?: string }): Promise<ToolResult> {
  // أوجد آخر جلسة وحدّث تاريخها
  const lastSession = await db.caseSession.findFirst({
    where: { caseId: args.caseId },
    orderBy: { sessionDate: "desc" },
  });

  if (!lastSession) return { success: false, error: "لا توجد جلسات في هذه القضية" };

  const updated = await db.caseSession.update({
    where: { id: lastSession.id },
    data: {
      nextSessionDate: new Date(args.newDate),
      adjournReason: args.reason ?? "تأجيل بناءً على طلب",
    },
  });

  // أنشئ موعداً جديداً للتاريخ الجديد
  const caseData = await db.case.findUnique({ where: { id: args.caseId } });
  await db.appointment.create({
    data: {
      title: `جلسة مؤجلة - قضية ${caseData?.internalNumber ?? ""}`,
      startDate: new Date(args.newDate),
      eventType: "court_session",
      caseId: args.caseId,
    },
  });

  return { success: true, data: updated, message: `تم تأجيل الجلسة إلى ${new Date(args.newDate).toLocaleDateString("ar-EG")}` };
}

// --- أدوار الموكلين ---

async function searchClients(args: { query?: string; status?: string }): Promise<ToolResult> {
  const where: Record<string, unknown> = {};
  if (args.status) where.status = args.status;
  if (args.query) {
    where.OR = [
      { fullName: { contains: args.query } },
      { phone: { contains: args.query } },
      { idNumber: { contains: args.query } },
      { email: { contains: args.query } },
    ];
  }
  const clients = await db.client.findMany({
    where,
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { cases: true } } },
  });
  return { success: true, data: clients, message: `تم العثور على ${clients.length} موكل` };
}

async function getClientDetails(args: { clientId: string }): Promise<ToolResult> {
  const client = await db.client.findUnique({
    where: { id: args.clientId },
    include: {
      cases: { orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, internalNumber: true, caseType: true, status: true } },
      _count: { select: { cases: true, documents: true, payments: true } },
    },
  });
  if (!client) return { success: false, error: "الموكل غير موجود" };
  return { success: true, data: client, message: `تفاصيل الموكل ${client.fullName}` };
}

async function createClient(args: {
  fullName: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
  clientType?: string;
}): Promise<ToolResult> {
  const client = await db.client.create({
    data: {
      fullName: args.fullName,
      phone: args.phone ?? null,
      email: args.email ?? null,
      idNumber: args.idNumber ?? null,
      address: args.address ?? null,
      clientType: args.clientType ?? "individual",
    },
  });
  return { success: true, data: client, message: `تم إنشاء الموكل ${client.fullName} بنجاح` };
}

// --- أدوار المستندات ---

async function searchDocuments(args: { query?: string; category?: string; caseId?: string }): Promise<ToolResult> {
  const where: Record<string, unknown> = {};
  if (args.category) where.category = args.category;
  if (args.caseId) where.caseId = args.caseId;
  if (args.query) {
    where.OR = [
      { title: { contains: args.query } },
      { description: { contains: args.query } },
      { tags: { contains: args.query } },
      { textContent: { contains: args.query } },
    ];
  }
  const docs = await db.document.findMany({
    where,
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      case: { select: { id: true, internalNumber: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
  // لا نعيد fileData في البحث
  const light = docs.map((d) => ({ ...d, fileData: undefined }));
  return { success: true, data: light, message: `تم العثور على ${docs.length} مستند` };
}

// --- أدوار المهام ---

async function createTask(args: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  caseId?: string;
  clientId?: string;
}): Promise<ToolResult> {
  const task = await db.task.create({
    data: {
      title: args.title,
      description: args.description ?? null,
      priority: args.priority ?? "medium",
      dueDate: args.dueDate ? new Date(args.dueDate) : null,
      caseId: args.caseId ?? null,
      clientId: args.clientId ?? null,
      status: "todo",
    },
    include: {
      case: { select: { internalNumber: true } },
      client: { select: { fullName: true } },
    },
  });
  return { success: true, data: task, message: `تم إنشاء المهمة "${task.title}" بنجاح` };
}

async function listTasks(args: { status?: string; overdue?: boolean }): Promise<ToolResult> {
  const where: Record<string, unknown> = {};
  if (args.status) where.status = args.status;
  else where.status = { not: "completed" };
  if (args.overdue) {
    where.dueDate = { lt: new Date() };
  }
  const tasks = await db.task.findMany({
    where,
    take: 15,
    orderBy: { dueDate: "asc" },
    include: {
      case: { select: { internalNumber: true } },
      client: { select: { fullName: true } },
    },
  });
  return { success: true, data: tasks, message: `تم العثور على ${tasks.length} مهمة` };
}

// --- أدوار المواعيد ---

async function listAppointments(args: { date?: string; upcoming?: boolean }): Promise<ToolResult> {
  const where: Record<string, unknown> = {};
  if (args.date) {
    const day = new Date(args.date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    where.startDate = { gte: day, lt: nextDay };
  } else if (args.upcoming) {
    where.startDate = { gte: new Date() };
  }
  const appointments = await db.appointment.findMany({
    where,
    take: 15,
    orderBy: { startDate: "asc" },
    include: {
      case: { select: { internalNumber: true } },
      client: { select: { fullName: true } },
    },
  });
  return { success: true, data: appointments, message: `تم العثور على ${appointments.length} موعد` };
}

async function createAppointment(args: {
  title: string;
  startDate: string;
  eventType?: string;
  location?: string;
  caseId?: string;
  clientId?: string;
}): Promise<ToolResult> {
  const apt = await db.appointment.create({
    data: {
      title: args.title,
      startDate: parseFlexibleDate(args.startDate),
      eventType: args.eventType ?? "other",
      location: args.location ?? null,
      caseId: args.caseId ?? null,
      clientId: args.clientId ?? null,
    },
  });
  return { success: true, data: apt, message: `تم إنشاء الموعد "${apt.title}" بنجاح` };
}

// --- أدوار المالية ---

async function getFinanceSummary(): Promise<ToolResult> {
  const [income, expense, pendingFees, overduePayments] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true } }),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.fee.aggregate({
      _sum: { amount: true, paidAmount: true },
      where: { status: { not: "paid" } },
    }),
    db.payment.count({
      where: {
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
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
}

async function getOverduePayments(): Promise<ToolResult> {
  const overdueFees = await db.fee.findMany({
    where: {
      status: { not: "paid" },
      dueDate: { lt: new Date() },
    },
    take: 10,
    include: { case: { include: { client: true } } },
  });
  return {
    success: true,
    data: overdueFees,
    message: `يوجد ${overdueFees.length} أتعاب متأخرة`,
  };
}

// --- إحصائيات عامة ---

async function getStats(): Promise<ToolResult> {
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
}

// --- أدوات إضافية ---

async function updateClient(args: { clientId: string; fullName?: string; phone?: string; email?: string; address?: string; city?: string; status?: string; notes?: string }): Promise<ToolResult> {
  const updates: Record<string, unknown> = {};
  if (args.fullName) updates.fullName = args.fullName;
  if (args.phone !== undefined) updates.phone = args.phone || null;
  if (args.email !== undefined) updates.email = args.email || null;
  if (args.address !== undefined) updates.address = args.address || null;
  if (args.city !== undefined) updates.city = args.city || null;
  if (args.status) updates.status = args.status;
  if (args.notes !== undefined) updates.notes = args.notes || null;

  const client = await db.client.update({ where: { id: args.clientId }, data: updates });
  return { success: true, data: client, message: `تم تحديث بيانات الموكل ${client.fullName}` };
}

async function deleteClient(args: { clientId: string }): Promise<ToolResult> {
  const client = await db.client.findUnique({ where: { id: args.clientId } });
  if (!client) return { success: false, error: "الموكل غير موجود" };
  await db.client.delete({ where: { id: args.clientId } });
  return { success: true, message: `تم حذف الموكل ${client.fullName}` };
}

async function deleteCase(args: { caseId: string }): Promise<ToolResult> {
  const caseData = await db.case.findUnique({ where: { id: args.caseId } });
  if (!caseData) return { success: false, error: "القضية غير موجودة" };
  await db.case.delete({ where: { id: args.caseId } });
  return { success: true, message: `تم حذف القضية ${caseData.internalNumber}` };
}

async function deleteTask(args: { taskId: string }): Promise<ToolResult> {
  const task = await db.task.findUnique({ where: { id: args.taskId } });
  if (!task) return { success: false, error: "المهمة غير موجودة" };
  await db.task.delete({ where: { id: args.taskId } });
  return { success: true, message: `تم حذف المهمة "${task.title}"` };
}

async function deleteAppointment(args: { appointmentId: string }): Promise<ToolResult> {
  const apt = await db.appointment.findUnique({ where: { id: args.appointmentId } });
  if (!apt) return { success: false, error: "الموعد غير موجود" };
  await db.appointment.delete({ where: { id: args.appointmentId } });
  return { success: true, message: `تم حذف الموعد "${apt.title}"` };
}

async function updateTask(args: { taskId: string; status?: string; priority?: string; title?: string; dueDate?: string }): Promise<ToolResult> {
  const updates: Record<string, unknown> = {};
  if (args.status) updates.status = args.status;
  if (args.priority) updates.priority = args.priority;
  if (args.title) updates.title = args.title;
  if (args.dueDate) updates.dueDate = new Date(args.dueDate);

  const task = await db.task.update({ where: { id: args.taskId }, data: updates });
  return { success: true, data: task, message: `تم تحديث المهمة "${task.title}"` };
}

async function createFee(args: { caseId: string; amount: number; feeType?: string; paidAmount?: number; description?: string; dueDate?: string; status?: string }): Promise<ToolResult> {
  const fee = await db.fee.create({
    data: {
      caseId: args.caseId,
      feeType: args.feeType ?? "fixed",
      amount: args.amount,
      paidAmount: args.paidAmount ?? 0,
      description: args.description ?? null,
      dueDate: args.dueDate ? new Date(args.dueDate) : null,
      status: args.status ?? "unpaid",
    },
  });
  return { success: true, data: fee, message: `تم إنشاء أتعاب بقيمة ${args.amount}` };
}

async function createPayment(args: { clientId: string; caseId?: string; feeId?: string; amount: number; paymentMethod?: string; reference?: string; notes?: string }): Promise<ToolResult> {
  const payment = await db.payment.create({
    data: {
      clientId: args.clientId,
      caseId: args.caseId ?? null,
      feeId: args.feeId ?? null,
      amount: args.amount,
      paymentMethod: args.paymentMethod ?? "cash",
      reference: args.reference ?? null,
      notes: args.notes ?? null,
    },
  });

  // تحديث حالة الأتعاب
  if (args.feeId) {
    const fee = await db.fee.findUnique({ where: { id: args.feeId } });
    if (fee) {
      const newPaid = fee.paidAmount + args.amount;
      await db.fee.update({
        where: { id: args.feeId },
        data: {
          paidAmount: newPaid,
          status: newPaid >= fee.amount ? "paid" : "partial",
        },
      });
    }
  }

  return { success: true, data: payment, message: `تم تسجيل دفعة بقيمة ${args.amount}` };
}

async function createExpense(args: { amount: number; category: string; caseId?: string; clientId?: string; description?: string }): Promise<ToolResult> {
  const expense = await db.expense.create({
    data: {
      caseId: args.caseId ?? null,
      clientId: args.clientId ?? null,
      category: args.category,
      amount: args.amount,
      description: args.description ?? null,
    },
  });
  return { success: true, data: expense, message: `تم تسجيل مصروف بقيمة ${args.amount}` };
}

async function createPowerOfAttorney(args: { clientId: string; poaNumber: string; issuer?: string; poaType?: string; scope?: string; issueDate: string; expiryDate?: string }): Promise<ToolResult> {
  const poa = await db.powerOfAttorney.create({
    data: {
      clientId: args.clientId,
      poaNumber: args.poaNumber,
      issuer: args.issuer ?? null,
      poaType: args.poaType ?? "توكيل خاص",
      scope: args.scope ?? null,
      issueDate: new Date(args.issueDate),
      expiryDate: args.expiryDate ? new Date(args.expiryDate) : null,
      status: "active",
    },
  });
  return { success: true, data: poa, message: `تم إنشاء التوكيل رقم ${poa.poaNumber}` };
}

async function addCommunication(args: { clientId: string; type: string; subject: string; summary?: string; priority?: string; followUpDate?: string }): Promise<ToolResult> {
  const comm = await db.communication.create({
    data: {
      clientId: args.clientId,
      type: args.type,
      subject: args.subject,
      summary: args.summary ?? null,
      priority: args.priority ?? "normal",
      followUpDate: args.followUpDate ? new Date(args.followUpDate) : null,
    },
  });
  return { success: true, data: comm, message: `تم تسجيل التواصل: ${comm.subject}` };
}

// ============================================================
// تعريفات الأدوات (لإرسالها للنموذج)
// ============================================================

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ============ الموكلون ============
  {
    type: "function",
    function: {
      name: "search_clients",
      description: `البحث في بيانات الموكلين والعملاء.
متى تستخدمها: عندما يسأل المستخدم عن موكلين، أو يريد البحث عن موكل بالاسم أو الهاتف أو رقم الهوية، أو يقول "وريني الموكلين" أو "عدهم" أو "كم موكل" أو "فيه موكلين؟".
المعاملات: query (كلمة البحث - الاسم أو الهاتف أو رقم الهوية)، status (حالة الموكل: active/former/potential/consultation)، clientType (individual/company).
ترجع: قائمة الموكلين المطابقين مع بياناتهم الأساسية وعدد قضاياهم.
ملاحظة: إذا لم تحدد query، ترجع كل الموكلين.`,
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث - يمكن أن تكون الاسم أو الهاتف أو رقم الهوية أو البريد. اتركها فارغة لعرض الكل." },
          status: { type: "string", enum: ["active", "former", "potential", "consultation"], description: "تصفية حسب الحالة: active=نشط، former=سابق، potential=محتمل، consultation=استشارة" },
          clientType: { type: "string", enum: ["individual", "company", "government", "nonprofit"], description: "نوع الموكل" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_details",
      description: `الحصول على تفاصيل موكل واحدة كاملة مع قضاياه وعدد مستنداته ومدفوعاته.
متى تستخدمها: عندما يريد المستخدم تفاصيل موكلاً معيناً، أو يقول "وريني بيانات الموكل أحمد" أو "لخص بيانات العميل"، أو قبل إنشاء قضية لموكل للتأكد من وجوده.
المعاملات: clientId (معرف الموكل - UUID).
ترجع: بيانات الموكل الكاملة + آخر 5 قضايا له + إحصائيات.
ملاحظة: استخدم search_clients أولاً للحصول على clientId.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل (UUID) - احصل عليه من search_clients" },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: `إنشاء موكل جديد في النظام.
متى تستخدمها: عندما يقول المستخدم "أضف موكل" أو "ضيف عميل" أو "سجل موكل جديد" أو "اعمل حساب لموكل" بأي صيغة.
المعاملات المطلوبة: fullName (الاسم الكامل).
المعاملات الاختيارية: phone, email, idNumber, address, city, nationality, clientType, notes.
ترجع: بيانات الموكل الجديد مع معرفه.
ملاحظة: إذا لم يذكر المستخدم بعض البيانات، اسأله عنها أو اتركها فارغة.`,
      parameters: {
        type: "object",
        properties: {
          fullName: { type: "string", description: "الاسم الكامل للموكل أو اسم الشركة" },
          phone: { type: "string", description: "رقم الهاتف" },
          email: { type: "string", description: "البريد الإلكتروني" },
          idNumber: { type: "string", description: "رقم الهوية أو السجل التجاري" },
          address: { type: "string", description: "العنوان" },
          city: { type: "string", description: "المدينة" },
          nationality: { type: "string", description: "الجنسية" },
          clientType: { type: "string", enum: ["individual", "company", "government", "nonprofit"], description: "نوع الموكل: individual=فرد، company=شركة، government=حكومي، nonprofit=غير ربحي" },
          notes: { type: "string", description: "ملاحظات إضافية" },
        },
        required: ["fullName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: `تعديل بيانات موكل موجود.
متى تستخدمها: عندما يقول المستخدم "عدّل بيانات الموكل" أو "غيّر رقم تليفون الموكل" أو "حدث بيانات العميل".
المعاملات: clientId (مطلوب) + أي حقل تريد تعديله.
ترجع: بيانات الموكل بعد التعديل.
ملاحظة: ابحث عن الموكل أولاً للحصول على clientId.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل" },
          fullName: { type: "string", description: "الاسم الجديد" },
          phone: { type: "string", description: "رقم الهاتف الجديد" },
          email: { type: "string", description: "البريد الجديد" },
          address: { type: "string", description: "العنوان الجديد" },
          city: { type: "string", description: "المدينة" },
          status: { type: "string", enum: ["active", "former", "potential", "consultation"], description: "الحالة" },
          notes: { type: "string", description: "ملاحظات" },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: `⚠️ عملية خطيرة: حذف موكل من النظام نهائياً.
متى تستخدمها: عندما يقول المستخدم "احذف الموكل" أو "امسح العميل" بشكل صريح.
المعاملات: clientId.
ترجع: تأكيد الحذف.
⚠️ هذه العملية تحتاج تأكيد من المستخدم قبل التنفيذ.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل المراد حذفه" },
        },
        required: ["clientId"],
      },
    },
  },

  // ============ القضايا ============
  {
    type: "function",
    function: {
      name: "search_cases",
      description: `البحث في القضايا بمعايير متعددة.
متى تستخدمها: عندما يسأل المستخدم عن قضايا، أو يقول "وريني القضايا" أو "اعرض القضايا النشطة" أو "كم قضية" أو "القضايا المدنية" أو "قضايا الموكل أحمد".
المعاملات: query (بحث بالرقم أو الاسم)، status (حالة)، caseType (نوع)، degree (درجة).
ترجع: قائمة القضايا مع بيانات الموكل وآخر جلسة وعدد الجلسات والمستندات.
ملاحظة: إذا لم تحدد أي معامل، ترجع كل القضايا.`,
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث - رقم القضية أو اسم الموكل أو اسم الخصم. اتركها فارغة لعرض الكل." },
          status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"], description: "active=جارية، pending=معلقة، closed=منتهية، won=كسب، lost=خسارة، settled=تسوية" },
          caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"], description: "civil=مدنية، commercial=تجارية، administrative=إدارية، criminal=جنائية، state_council=مجلس الدولة، personal_status=أحوال شخصية" },
          degree: { type: "string", enum: ["primary", "appeal", "cassation"], description: "primary=ابتدائي، appeal=استئناف، cassation=نقض" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_case_details",
      description: `الحصول على تفاصيل قضية كاملة شاملة.
متى تستخدمها: عندما يقول المستخدم "لخص قضية" أو "وريني تفاصيل القضية" أو "ما حالة قضية رقم كذا" أو "ايه آخر إجراء في القضية".
المعاملات: caseId.
ترجع: بيانات القضية الكاملة + الموكل + آخر 5 جلسات + آخر 5 إجراءات + المهام المعلقة + آخر 3 أتعاب + الأدلة.
ملاحظة: استخدم search_cases أولاً للحصول على caseId.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية (UUID) - احصل عليه من search_cases" },
        },
        required: ["caseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_case",
      description: `إنشاء قضية جديدة في النظام.
متى تستخدمها: عندما يقول المستخدم "أنشئ قضية" أو "افتح قضية" أو "سجل قضية" أو "ضيف قضية جديدة" للموكل.
المعاملات المطلوبة: internalNumber, caseType, clientId.
المعاملات الاختيارية: officialNumber, court, opponentName, facts, strategy, priority, degree.
ترجع: بيانات القضية الجديدة.
⚠️ مهم: يجب البحث عن الموكل أولاً (search_clients) للحصول على clientId. إذا لم يوجد، أنشئه أولاً (create_client).`,
      parameters: {
        type: "object",
        properties: {
          internalNumber: { type: "string", description: "الرقم الداخلي للقضية (مثل: 2024/001)" },
          caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"], description: "نوع القضية" },
          clientId: { type: "string", description: "معرف الموكل (UUID) - احصل عليه من search_clients أو create_client" },
          officialNumber: { type: "string", description: "الرقم الرسمي في المحكمة" },
          opponentName: { type: "string", description: "اسم الخصم" },
          opponentLawyer: { type: "string", description: "اسم محامي الخصم" },
          court: { type: "string", description: "اسم المحكمة" },
          circuit: { type: "string", description: "رقم الدائرة" },
          degree: { type: "string", enum: ["primary", "appeal", "cassation"], description: "درجة التقاضي" },
          judgeName: { type: "string", description: "اسم القاضي" },
          facts: { type: "string", description: "وقائع القضية" },
          strategy: { type: "string", description: "الاستراتيجية القانونية" },
          estimatedValue: { type: "number", description: "القيمة التقديرية للقضية" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "الأولوية" },
        },
        required: ["internalNumber", "caseType", "clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_case",
      description: `تعديل بيانات قضية موجودة.
متى تستخدمها: عندما يقول المستخدم "غيّر حالة القضية" أو "حدّث وقائع القضية" أو "القضية دي كسبناها".
المعاملات: caseId (مطلوب) + أي حقل تريد تعديله.
ترجع: بيانات القضية بعد التعديل.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"], description: "الحالة الجديدة" },
          court: { type: "string", description: "المحكمة" },
          circuit: { type: "string", description: "الدائرة" },
          facts: { type: "string", description: "الوقائع" },
          strategy: { type: "string", description: "الاستراتيجية" },
          result: { type: "string", description: "النتيجة النهائية" },
          opponentName: { type: "string", description: "اسم الخصم" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "الأولوية" },
        },
        required: ["caseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_case",
      description: `⚠️ عملية خطيرة: حذف قضية من النظام نهائياً.
متى تستخدمها: عندما يقول المستخدم "احذف القضية" أو "امسح القضية" بشكل صريح.
المعاملات: caseId.
⚠️ هذه العملية تحتاج تأكيد من المستخدم قبل التنفيذ.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية المراد حذفها" },
        },
        required: ["caseId"],
      },
    },
  },

  // ============ الجلسات ============
  {
    type: "function",
    function: {
      name: "add_session",
      description: `تسجيل جلسة جديدة لقضية.
متى تستخدمها: عندما يقول المستخدم "أضف جلسة" أو "سجل جلسة" أو "كانت فيه جلسة بكرة" أو "حدد جلسة للأسبوع الجاي".
المعاملات المطلوبة: caseId, sessionDate.
المعاملات الاختيارية: purpose, court, judgeName, facts, decisions, nextSessionDate.
ترجع: بيانات الجلسة. ويتم إنشاء موعد تلقائياً إذا حددت nextSessionDate.
ملاحظة: ابحث عن القضية أولاً للحصول على caseId.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          sessionDate: { type: "string", description: "تاريخ ووقت الجلسة بصيغة ISO (مثل: 2024-07-15T10:00:00)" },
          purpose: { type: "string", description: "الغرض من الجلسة (مرافعة، مستندات، حكم، إلخ)" },
          court: { type: "string", description: "المحكمة" },
          judgeName: { type: "string", description: "اسم القاضي" },
          facts: { type: "string", description: "ملخص ما حدث في الجلسة" },
          decisions: { type: "string", description: "القرارات المتخذة في الجلسة" },
          nextSessionDate: { type: "string", description: "تاريخ الجلسة القادمة بصيغة ISO" },
        },
        required: ["caseId", "sessionDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "postpone_session",
      description: `تأجيل جلسة محكمة إلى تاريخ لاحق.
متى تستخدمها: عندما يقول المستخدم "أجل الجلسة" أو "أجّل جلسة القضية" أو "غير موعد الجلسة".
المعاملات المطلوبة: caseId, newDate.
المعاملات الاختيارية: reason.
ترجع: تأكيد التأجيل + يتم إنشاء موعد جديد تلقائياً.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          newDate: { type: "string", description: "التاريخ الجديد للجلسة بصيغة ISO" },
          reason: { type: "string", description: "سبب التأجيل" },
        },
        required: ["caseId", "newDate"],
      },
    },
  },

  // ============ المستندات ============
  {
    type: "function",
    function: {
      name: "search_documents",
      description: `البحث في المستندات والأرشيف.
متى تستخدمها: عندما يقول المستخدم "وريني المستندات" أو "ابحث عن عقد" أو "فيه مذكرات للقضية دي؟" أو "المستندات بتاعة الموكل أحمد".
المعاملات: query (بحث في العنوان والوصف والوسوم), category, caseId, clientId.
ترجع: قائمة المستندات مع بياناتها.`,
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث في العنوان والوصف والوسوم" },
          category: { type: "string", enum: ["contract", "pleading", "ruling", "evidence", "correspondence", "other"], description: "contract=عقد، pleading=مذكرة، ruling=حكم، evidence=دليل، correspondence=مراسلة" },
          caseId: { type: "string", description: "معرف القضية للبحث في مستنداتها" },
          clientId: { type: "string", description: "معرف الموكل للبحث في مستنداته" },
        },
      },
    },
  },

  // ============ المهام ============
  {
    type: "function",
    function: {
      name: "create_task",
      description: `إنشاء مهمة جديدة.
متى تستخدمها: عندما يقول المستخدم "أضف مهمة" أو "ضيف تذكير" أو "اعمل مهمة" أو "مطلوب مني كذا".
المعاملات المطلوبة: title.
المعاملات الاختيارية: description, priority, dueDate, caseId, clientId.
ترجع: بيانات المهمة الجديدة.`,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان المهمة" },
          description: { type: "string", description: "وصف المهمة" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "urgent=عاجل، high=مرتفع، medium=متوسط، low=منخفض" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق بصيغة ISO" },
          caseId: { type: "string", description: "معرف القضية المرتبطة" },
          clientId: { type: "string", description: "معرف الموكل المرتبط" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: `عرض قائمة المهام.
متى تستخدمها: عندما يقول المستخدم "وريني المهام" أو "ايه المهام المعلقة؟" أو "المهام المتأخرة" أو "اعرض التذكيرات".
المعاملات: status (حالة المهمة), overdue (المتأخرة فقط).
ترجع: قائمة المهام مع بياناتها والقضايا المرتبطة.`,
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["todo", "in_progress", "completed", "cancelled"], description: "todo=للتنفيذ، in_progress=قيد التنفيذ، completed=مكتملة" },
          overdue: { type: "boolean", description: "true لعرض المهام المتأخرة فقط" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: `⚠️ عملية خطيرة: حذف مهمة.
متى تستخدمها: عندما يقول المستخدم "احذف المهمة" أو "امسح التذكير" بشكل صريح.
⚠️ تحتاج تأكيد من المستخدم.`,
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "معرف المهمة" },
        },
        required: ["taskId"],
      },
    },
  },

  // ============ المواعيد ============
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: `عرض قائمة المواعيد والجلسات القادمة.
متى تستخدمها: عندما يقول المستخدم "مواعيد اليوم" أو "جلسات بكرة" أو "ايه الجلسات الجاية؟" أو "مواعيد الأسبوع".
المعاملات: date (تاريخ محدد), upcoming (القادمة فقط).
ترجع: قائمة المواعيد مع الوقت والمكان والقضية المرتبطة.`,
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "تاريخ محدد بصيغة ISO (مثل: 2024-07-15) لعرض مواعيد ذلك اليوم" },
          upcoming: { type: "boolean", description: "true لعرض المواعيد القادمة فقط من الآن" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: `إنشاء موعد جديد في التقويم.
متى تستخدمها: عندما يقول المستخدم "ضيف موعد" أو "حدد موعد" أو "اجتمع مع الموكل بكرة" أو "فيه جلسة يوم كذا".
المعاملات المطلوبة: title, startDate.
المعاملات الاختيارية: eventType, location, caseId, clientId.
ترجع: بيانات الموعد الجديد.`,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان الموعد" },
          startDate: { type: "string", description: "تاريخ ووقت بداية الموعد بصيغة ISO" },
          endDate: { type: "string", description: "تاريخ ووقت نهاية الموعد بصيغة ISO" },
          eventType: { type: "string", enum: ["court_session", "client_meeting", "deadline", "task", "consultation", "hearing", "other"], description: "court_session=جلسة محكمة، client_meeting=مقابلة موكل، deadline=موعد نهائي، consultation=استشارة" },
          location: { type: "string", description: "المكان" },
          caseId: { type: "string", description: "معرف القضية المرتبطة" },
          clientId: { type: "string", description: "معرف الموكل المرتبط" },
        },
        required: ["title", "startDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_appointment",
      description: `⚠️ عملية خطيرة: حذف موعد.
متى تستخدمها: عندما يقول المستخدم "احذف الموعد" أو "الغ الجلسة من التقويم" بشكل صريح.
⚠️ تحتاج تأكيد من المستخدم.`,
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string", description: "معرف الموعد" },
        },
        required: ["appointmentId"],
      },
    },
  },

  // ============ المالية ============
  {
    type: "function",
    function: {
      name: "get_finance_summary",
      description: `الحصول على ملخص مالي شامل للمكتب.
متى تستخدمها: عندما يقول المستخدم "الوضع المالي" أو "ملخص مالي" أو "كام دخلنا؟" أو "المصروفات كام؟" أو "صافي الربح".
ترجع: إجمالي الدخل، إجمالي المصروفات، صافي الدخل، الأتعاب المعلقة (غير محصلة).`,
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overdue_payments",
      description: `عرض الأتعاب والمستحقات المتأخرة عن موعد استحقاقها.
متى تستخدمها: عندما يقول المستخدم "فيه مستحقات متأخرة؟" أو "ايه الأتعاب اللي اتأخرت؟" أو "مين مادفعش؟".
ترجع: قائمة بالأتعاب المتأخرة مع بيانات القضية والموكل.`,
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_fee",
      description: `تسجيل أتعاب جديدة لقضية.
متى تستخدمها: عندما يقول المستخدم "سجل أتعاب" أو "حدد أتعاب القضية" أو "الموكل اتفق على مبلغ".
المعاملات المطلوبة: caseId, amount.
المعاملات الاختيارية: feeType, description, dueDate, paidAmount.
ترجع: بيانات الأتعاب الجديدة.`,
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          amount: { type: "number", description: "المبلغ الإجمالي للأتعاب" },
          feeType: { type: "string", enum: ["fixed", "hourly", "percentage", "mixed", "staged"], description: "fixed=ثابتة، hourly=بالساعة، percentage=بالنسبة، staged=على مراحل" },
          paidAmount: { type: "number", description: "المبلغ المدفوع مقدماً (افتراضي: 0)" },
          description: { type: "string", description: "وصف الأتعاب" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق بصيغة ISO" },
        },
        required: ["caseId", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_payment",
      description: `تسجيل دفعة مالية من موكل.
متى تستخدمها: عندما يقول المستخدم "الموكل دفع 5000" أو "سجل دفعة" أو "استلمنا مبلغ من العميل".
المعاملات المطلوبة: clientId, amount.
المعاملات الاختيارية: caseId, feeId, paymentMethod, reference, notes.
ترجع: بيانات الدفعة. ويتم تحديث حالة الأتعاب تلقائياً إذا حددت feeId.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل" },
          caseId: { type: "string", description: "معرف القضية المرتبطة" },
          feeId: { type: "string", description: "معرف الأتعاب المرتبطة (لتحديث حالة السداد)" },
          amount: { type: "number", description: "المبلغ المدفوع" },
          paymentMethod: { type: "string", enum: ["cash", "check", "transfer", "card"], description: "cash=نقداً، check=شيك، transfer=تحويل، card=بطاقة" },
          reference: { type: "string", description: "رقم مرجعي (رقم الشيك أو التحويل)" },
          notes: { type: "string", description: "ملاحظات" },
        },
        required: ["clientId", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_expense",
      description: `تسجيل مصروف للمكتب أو لقضية.
متى تستخدمها: عندما يقول المستخدم "صرفت 500 على المحكمة" أو "سجل مصروف" أو "أتعاب خبير".
المعاملات المطلوبة: amount, category.
المعاملات الاختيارية: caseId, clientId, description.
ترجع: بيانات المصروف.`,
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "المبلغ" },
          category: { type: "string", enum: ["court_fees", "travel", "documents", "experts", "other"], description: "court_fees=رسوم محكمة، travel=تنقلات، documents=مستندات، experts=خبراء، other=أخرى" },
          description: { type: "string", description: "وصف المصروف" },
          caseId: { type: "string", description: "معرف القضية المرتبطة" },
          clientId: { type: "string", description: "معرف الموكل المرتبط" },
        },
        required: ["amount", "category"],
      },
    },
  },

  // ============ إحصائيات ============
  {
    type: "function",
    function: {
      name: "get_stats",
      description: `الحصول على إحصائيات عامة وسريعة عن النظام.
متى تستخدمها: عندما يقول المستخدم "إحصائيات" أو "كم قضية عندنا؟" أو "عدد الموكلين" أو "حالة النظام" أو "ملخص سريع".
ترجع: عدد القضايا (الإجمالي + النشطة)، الموكلين، المهام (المعلقة + المتأخرة)، مواعيد اليوم، المستندات، الأتعاب المعلقة.`,
      parameters: { type: "object", properties: {} },
    },
  },

  // ============ التوكيلات ============
  {
    type: "function",
    function: {
      name: "create_power_of_attorney",
      description: `تسجيل توكيل لموكل.
متى تستخدمها: عندما يقول المستخدم "أضف توكيل" أو "سجل توكيل للموكل" أو "التوكيل رقمه كذا".
المعاملات المطلوبة: clientId, poaNumber, issueDate.
المعاملات الاختيارية: issuer, poaType, scope, expiryDate.
ترجع: بيانات التوكيل.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل" },
          poaNumber: { type: "string", description: "رقم التوكيل" },
          issuer: { type: "string", description: "جهة التوثيق (مثل: شهر عقاري)" },
          poaType: { type: "string", description: "نوع التوكيل (خاص/عام)" },
          scope: { type: "string", description: "نطاق الصلاحيات" },
          issueDate: { type: "string", description: "تاريخ الإصدار بصيغة ISO" },
          expiryDate: { type: "string", description: "تاريخ الانتهاء بصيغة ISO" },
        },
        required: ["clientId", "poaNumber", "issueDate"],
      },
    },
  },

  // ============ سجل التواصل ============
  {
    type: "function",
    function: {
      name: "add_communication",
      description: `تسجيل تواصل مع موكل (مكالمة، اجتماع، زيارة، رسالة).
متى تستخدمها: عندما يقول المستخدم "اتصلت بالموكلة" أو "سجل مكالمة" أو "كان فيه اجتماع مع العميل".
المعاملات المطلوبة: clientId, type, subject.
ترجع: بيانات سجل التواصل.`,
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل" },
          type: { type: "string", enum: ["call", "meeting", "email", "message", "visit"], description: "call=مكالمة، meeting=اجتماع، email=بريد، message=رسالة، visit=زيارة" },
          subject: { type: "string", description: "موضوع التواصل" },
          summary: { type: "string", description: "ملخص ما تم" },
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "الأولوية" },
        },
        required: ["clientId", "type", "subject"],
      },
    },
  },
];

// ============================================================
// منفذ الأدوات - يحدد الأداة المناسبة وينفذها
// ============================================================

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      // الموكلون
      case "search_clients":
        return await searchClients(args as Parameters<typeof searchClients>[0]);
      case "get_client_details":
        return await getClientDetails(args as Parameters<typeof getClientDetails>[0]);
      case "create_client":
        return await createClient(args as Parameters<typeof createClient>[0]);
      case "update_client":
        return await updateClient(args as Parameters<typeof updateClient>[0]);
      case "delete_client":
        return await deleteClient(args as Parameters<typeof deleteClient>[0]);
      // القضايا
      case "search_cases":
        return await searchCases(args as Parameters<typeof searchCases>[0]);
      case "get_case_details":
        return await getCaseDetails(args as Parameters<typeof getCaseDetails>[0]);
      case "create_case":
        return await createCase(args as Parameters<typeof createCase>[0]);
      case "update_case":
        return await updateCase(args as Parameters<typeof updateCase>[0]);
      case "delete_case":
        return await deleteCase(args as Parameters<typeof deleteCase>[0]);
      // الجلسات
      case "add_session":
        return await addSession(args as Parameters<typeof addSession>[0]);
      case "postpone_session":
        return await postponeSession(args as Parameters<typeof postponeSession>[0]);
      // المستندات
      case "search_documents":
        return await searchDocuments(args as Parameters<typeof searchDocuments>[0]);
      // المهام
      case "create_task":
        return await createTask(args as Parameters<typeof createTask>[0]);
      case "list_tasks":
        return await listTasks(args as Parameters<typeof listTasks>[0]);
      case "update_task":
        return await updateTask(args as Parameters<typeof updateTask>[0]);
      case "delete_task":
        return await deleteTask(args as Parameters<typeof deleteTask>[0]);
      // المواعيد
      case "list_appointments":
        return await listAppointments(args as Parameters<typeof listAppointments>[0]);
      case "create_appointment":
        return await createAppointment(args as Parameters<typeof createAppointment>[0]);
      case "delete_appointment":
        return await deleteAppointment(args as Parameters<typeof deleteAppointment>[0]);
      // المالية
      case "get_finance_summary":
        return await getFinanceSummary();
      case "get_overdue_payments":
        return await getOverduePayments();
      case "create_fee":
        return await createFee(args as Parameters<typeof createFee>[0]);
      case "create_payment":
        return await createPayment(args as Parameters<typeof createPayment>[0]);
      case "create_expense":
        return await createExpense(args as Parameters<typeof createExpense>[0]);
      // إحصائيات
      case "get_stats":
        return await getStats();
      // توكيلات
      case "create_power_of_attorney":
        return await createPowerOfAttorney(args as Parameters<typeof createPowerOfAttorney>[0]);
      // تواصل
      case "add_communication":
        return await addCommunication(args as Parameters<typeof addCommunication>[0]);
      default:
        return { success: false, error: `أداة غير معروفة: ${name}` };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "خطأ في تنفيذ الأداة",
    };
  }
}
