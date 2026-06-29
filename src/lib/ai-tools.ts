// ============================================================
// AI Tools - الأدوات التي يمكن للـ AI استدعاؤها لتنفيذ أوامر
// ============================================================

import { db } from "./db";

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
      sessionDate: new Date(args.sessionDate),
      purpose: args.purpose ?? null,
      court: args.court ?? null,
      judgeName: args.judgeName ?? null,
      facts: args.facts ?? null,
      decisions: args.decisions ?? null,
      nextSessionDate: args.nextSessionDate ? new Date(args.nextSessionDate) : null,
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
      startDate: new Date(args.startDate),
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
  const [cases, activeCases, clients, tasks, overdueTasks, appointmentsToday, documents] = await Promise.all([
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
  ]);
  return {
    success: true,
    data: { cases, activeCases, clients, tasks, overdueTasks, appointmentsToday, documents },
    message: "إحصائيات النظام",
  };
}

// ============================================================
// تعريفات الأدوات (لإرسالها للنموذج)
// ============================================================

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // --- القضايا ---
  {
    type: "function",
    function: {
      name: "search_cases",
      description: "البحث في القضايا. استخدمها عند السؤال عن قضايا معينة، أو عدد القضايا، أو البحث برقم القضية أو اسم الموكل أو الخصم.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث (رقم القضية، اسم الموكل، اسم الخصم)" },
          status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"], description: "حالة القضية" },
          caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"], description: "نوع القضية" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_case_details",
      description: "الحصول على تفاصيل قضية كاملة (الجلسات، الإجراءات، المهام، الأتعاب). استخدمها عند السؤال عن تفاصيل قضية معينة برقمها.",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية (UUID)" },
        },
        required: ["caseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_case",
      description: "إنشاء قضية جديدة. استخدمها عندما يطلب المستخدم إنشاء قضية جديدة لموكل.",
      parameters: {
        type: "object",
        properties: {
          internalNumber: { type: "string", description: "الرقم الداخلي للقضية" },
          caseType: { type: "string", enum: ["civil", "commercial", "administrative", "criminal", "state_council", "personal_status"], description: "نوع القضية" },
          clientId: { type: "string", description: "معرف الموكل (UUID) - استخدم search_clients للحصول عليه" },
          opponentName: { type: "string", description: "اسم الخصم" },
          court: { type: "string", description: "اسم المحكمة" },
          facts: { type: "string", description: "وقائع القضية" },
          degree: { type: "string", enum: ["primary", "appeal", "cassation"], description: "درجة التقاضي" },
        },
        required: ["internalNumber", "caseType", "clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_case",
      description: "تحديث بيانات قضية (الحالة، المحكمة، الوقائع، الاستراتيجية، النتيجة).",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          status: { type: "string", enum: ["active", "pending", "closed", "won", "lost", "settled"], description: "الحالة الجديدة" },
          court: { type: "string", description: "المحكمة" },
          facts: { type: "string", description: "الوقائع" },
          strategy: { type: "string", description: "الاستراتيجية" },
          result: { type: "string", description: "النتيجة" },
        },
        required: ["caseId"],
      },
    },
  },
  // --- الجلسات ---
  {
    type: "function",
    function: {
      name: "add_session",
      description: "تسجيل جلسة جديدة لقضية. استخدمها عند تسجيل جلسة أو إضافة جلسة سابقة.",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          sessionDate: { type: "string", description: "تاريخ الجلسة (ISO format)" },
          purpose: { type: "string", description: "الغرض من الجلسة" },
          court: { type: "string", description: "المحكمة" },
          judgeName: { type: "string", description: "اسم القاضي" },
          facts: { type: "string", description: "ملخص وقائع الجلسة" },
          decisions: { type: "string", description: "القرارات المتخذة" },
          nextSessionDate: { type: "string", description: "تاريخ الجلسة القادمة (ISO format)" },
        },
        required: ["caseId", "sessionDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "postpone_session",
      description: "تأجيل جلسة إلى تاريخ لاحق. استخدمها عندما يطلب المستخدم تأجيل جلسة.",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "string", description: "معرف القضية" },
          newDate: { type: "string", description: "التاريخ الجديد للجلسة (ISO format)" },
          reason: { type: "string", description: "سبب التأجيل" },
        },
        required: ["caseId", "newDate"],
      },
    },
  },
  // --- الموكلين ---
  {
    type: "function",
    function: {
      name: "search_clients",
      description: "البحث في الموكلين بالاسم أو الهاتف أو رقم الهوية أو البريد.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث" },
          status: { type: "string", enum: ["active", "former", "potential", "consultation"], description: "حالة الموكل" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_details",
      description: "الحصول على تفاصيل موكل كاملة مع قضاياه.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "معرف الموكل" },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "إنشاء موكل جديد. استخدمها عندما يطلب المستخدم إضافة موكل جديد.",
      parameters: {
        type: "object",
        properties: {
          fullName: { type: "string", description: "الاسم الكامل" },
          phone: { type: "string", description: "رقم الهاتف" },
          email: { type: "string", description: "البريد الإلكتروني" },
          idNumber: { type: "string", description: "رقم الهوية" },
          address: { type: "string", description: "العنوان" },
          clientType: { type: "string", enum: ["individual", "company", "government", "nonprofit"], description: "نوع الموكل" },
        },
        required: ["fullName"],
      },
    },
  },
  // --- المستندات ---
  {
    type: "function",
    function: {
      name: "search_documents",
      description: "البحث في المستندات بالعنوان أو الوصف أو الوسوم.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "كلمة البحث" },
          category: { type: "string", enum: ["contract", "pleading", "ruling", "evidence", "correspondence", "other"], description: "فئة المستند" },
          caseId: { type: "string", description: "معرف القضية للبحث في مستنداتها" },
        },
      },
    },
  },
  // --- المهام ---
  {
    type: "function",
    function: {
      name: "create_task",
      description: "إنشاء مهمة جديدة. استخدمها عندما يطلب المستخدم إضافة مهمة.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان المهمة" },
          description: { type: "string", description: "وصف المهمة" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "الأولوية" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق (ISO format)" },
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
      description: "عرض قائمة المهام. استخدمها عند السؤال عن المهام المعلقة أو المتأخرة.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["todo", "in_progress", "completed", "cancelled"], description: "حالة المهمة" },
          overdue: { type: "boolean", description: "المهام المتأخرة فقط" },
        },
      },
    },
  },
  // --- المواعيد ---
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: "عرض قائمة المواعيد. استخدمها عند السؤال عن مواعيد اليوم أو القادمة أو الجلسات.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "تاريخ محدد (ISO format)" },
          upcoming: { type: "boolean", description: "المواعيد القادمة فقط" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "إنشاء موعد جديد. استخدمها عندما يطلب المستخدم إضافة موعد أو جدولة جلسة.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "عنوان الموعد" },
          startDate: { type: "string", description: "تاريخ ووقت البداية (ISO format)" },
          eventType: { type: "string", enum: ["court_session", "client_meeting", "deadline", "task", "consultation", "hearing", "other"], description: "نوع الحدث" },
          location: { type: "string", description: "المكان" },
          caseId: { type: "string", description: "معرف القضية المرتبطة" },
          clientId: { type: "string", description: "معرف الموكل المرتبط" },
        },
        required: ["title", "startDate"],
      },
    },
  },
  // --- المالية ---
  {
    type: "function",
    function: {
      name: "get_finance_summary",
      description: "الحصول على ملخص مالي شامل (الدخل، المصروفات، الأتعاب المعلقة). استخدمها عند السؤال عن الوضع المالي.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overdue_payments",
      description: "الحصول على قائمة الأتعاب المتأخرة. استخدمها عند السؤال عن المستحقات المتأخرة.",
      parameters: { type: "object", properties: {} },
    },
  },
  // --- إحصائيات ---
  {
    type: "function",
    function: {
      name: "get_stats",
      description: "الحصول على إحصائيات عامة عن النظام (عدد القضايا، الموكلين، المهام، إلخ). استخدمها عند السؤال عن إحصائيات أو أرقام عامة.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ============================================================
// منفذ الأدوات - يحدد الأداة المناسبة وينفذها
// ============================================================

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case "search_cases":
        return await searchCases(args as Parameters<typeof searchCases>[0]);
      case "get_case_details":
        return await getCaseDetails(args as Parameters<typeof getCaseDetails>[0]);
      case "create_case":
        return await createCase(args as Parameters<typeof createCase>[0]);
      case "update_case":
        return await updateCase(args as Parameters<typeof updateCase>[0]);
      case "add_session":
        return await addSession(args as Parameters<typeof addSession>[0]);
      case "postpone_session":
        return await postponeSession(args as Parameters<typeof postponeSession>[0]);
      case "search_clients":
        return await searchClients(args as Parameters<typeof searchClients>[0]);
      case "get_client_details":
        return await getClientDetails(args as Parameters<typeof getClientDetails>[0]);
      case "create_client":
        return await createClient(args as Parameters<typeof createClient>[0]);
      case "search_documents":
        return await searchDocuments(args as Parameters<typeof searchDocuments>[0]);
      case "create_task":
        return await createTask(args as Parameters<typeof createTask>[0]);
      case "list_tasks":
        return await listTasks(args as Parameters<typeof listTasks>[0]);
      case "list_appointments":
        return await listAppointments(args as Parameters<typeof listAppointments>[0]);
      case "create_appointment":
        return await createAppointment(args as Parameters<typeof createAppointment>[0]);
      case "get_finance_summary":
        return await getFinanceSummary();
      case "get_overdue_payments":
        return await getOverduePayments();
      case "get_stats":
        return await getStats();
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
