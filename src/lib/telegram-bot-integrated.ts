// ============================================================
// بوت تليجرام المدمج - يعمل داخل خادم Next.js
// هذا يضمن استمرار عمله طالما الخادم يعمل
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
// أدوات تنفيذ الأوامر
// ============================================================

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; message?: string; error?: string }>> = {
  search_cases: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.status) where.status = args.status;
    if (args.caseType) where.caseType = args.caseType;
    if (args.query) {
      where.OR = [
        { internalNumber: { contains: args.query } },
        { opponentName: { contains: args.query } },
        { client: { fullName: { contains: args.query } } },
      ];
    }
    const cases = await db.case.findMany({
      where, take: 5, orderBy: { updatedAt: "desc" },
      include: { client: { select: { fullName: true } }, sessions: { orderBy: { sessionDate: "desc" }, take: 1 } },
    });
    return { success: true, data: cases, message: `${cases.length} قضية` };
  },
  get_case_details: async (args) => {
    const c = await db.case.findUnique({
      where: { id: args.caseId as string },
      include: { client: true, sessions: { orderBy: { sessionDate: "desc" }, take: 3 }, procedures: { orderBy: { date: "desc" }, take: 3 } },
    });
    if (!c) return { success: false, error: "غير موجودة" };
    return { success: true, data: c };
  },
  search_clients: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.query) {
      where.OR = [{ fullName: { contains: args.query } }, { phone: { contains: args.query } }];
    }
    const clients = await db.client.findMany({ where, take: 5, orderBy: { updatedAt: "desc" } });
    return { success: true, data: clients, message: `${clients.length} موكل` };
  },
  list_tasks: async (args) => {
    const where: Record<string, unknown> = { status: { not: "completed" } };
    if (args.overdue) where.dueDate = { lt: new Date() };
    const tasks = await db.task.findMany({ where, take: 10, orderBy: { dueDate: "asc" }, include: { case: { select: { internalNumber: true } } } });
    return { success: true, data: tasks, message: `${tasks.length} مهمة` };
  },
  list_appointments: async (args) => {
    const where: Record<string, unknown> = {};
    if (args.date) {
      const d = new Date(args.date as string);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.startDate = { gte: d, lt: next };
    } else if (args.upcoming) {
      where.startDate = { gte: new Date() };
    }
    const apts = await db.appointment.findMany({ where, take: 10, orderBy: { startDate: "asc" }, include: { case: { select: { internalNumber: true } }, client: { select: { fullName: true } } } });
    return { success: true, data: apts, message: `${apts.length} موعد` };
  },
  create_task: async (args) => {
    const t = await db.task.create({
      data: {
        title: args.title as string,
        description: (args.description as string) ?? null,
        priority: (args.priority as string) ?? "medium",
        dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
        caseId: (args.caseId as string) ?? null,
        status: "todo",
      },
    });
    return { success: true, data: t, message: `تم إنشاء المهمة: ${t.title}` };
  },
  get_finance_summary: async () => {
    const [income, expense] = await Promise.all([
      db.payment.aggregate({ _sum: { amount: true } }),
      db.expense.aggregate({ _sum: { amount: true } }),
    ]);
    return { success: true, data: { income: income._sum.amount ?? 0, expense: expense._sum.amount ?? 0 }, message: "ملخص مالي" };
  },
  get_overdue_payments: async () => {
    const overdue = await db.fee.findMany({ where: { status: { not: "paid" }, dueDate: { lt: new Date() } }, take: 10, include: { case: { include: { client: true } } } });
    return { success: true, data: overdue, message: `${overdue.length} متأخرة` };
  },
  get_stats: async () => {
    const [cases, activeCases, clients, tasks] = await Promise.all([
      db.case.count(), db.case.count({ where: { status: "active" } }), db.client.count(), db.task.count({ where: { status: { not: "completed" } } }),
    ]);
    return { success: true, data: { cases, activeCases, clients, tasks }, message: "إحصائيات" };
  },
};

const TOOL_DEFINITIONS = [
  { type: "function", function: { name: "search_cases", description: "البحث في القضايا", parameters: { type: "object", properties: { query: { type: "string" }, status: { type: "string" } } } } },
  { type: "function", function: { name: "get_case_details", description: "تفاصيل قضية", parameters: { type: "object", properties: { caseId: { type: "string" } }, required: ["caseId"] } } },
  { type: "function", function: { name: "search_clients", description: "البحث في الموكلين", parameters: { type: "object", properties: { query: { type: "string" } } } } },
  { type: "function", function: { name: "list_tasks", description: "عرض المهام", parameters: { type: "object", properties: { overdue: { type: "boolean" } } } } },
  { type: "function", function: { name: "list_appointments", description: "عرض المواعيد", parameters: { type: "object", properties: { date: { type: "string" }, upcoming: { type: "boolean" } } } } },
  { type: "function", function: { name: "create_task", description: "إنشاء مهمة", parameters: { type: "object", properties: { title: { type: "string" }, dueDate: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "get_finance_summary", description: "ملخص مالي", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_overdue_payments", description: "مستحقات متأخرة", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_stats", description: "إحصائيات عامة", parameters: { type: "object", properties: {} } } },
];

// ============================================================
// تشغيل الوكيل الذكي
// ============================================================

const SYSTEM_PROMPT = `أنت مساعد قانوني ذكي عبر تليجرام لنظام "المحامي الشامل".
أجب بالعربية بشكل موجز ومباشر (مناسب لتليجرام).
استخدم الأدوات المتاحة للبحث والتنفيذ.
عند عرض القضايا، اذكر: الرقم، النوع، الموكل، الحالة.
عند عرض المواعيد، اذكر: التاريخ، الوقت، العنوان، المكان.`;

async function runAgent(userMessage: string): Promise<string> {
  const aiConfig = await getAiConfig();
  if (!aiConfig.apiKey) return "⚠️ لم يتم تكوين الذكاء الاصطناعي";

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 4; i++) {
    const response = await fetch(`${aiConfig.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiConfig.apiKey}` },
      body: JSON.stringify({ model: aiConfig.model, messages, tools: TOOL_DEFINITIONS, tool_choice: "auto", temperature: 0.7 }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      return `⚠️ خطأ في الذكاء الاصطناعي: ${response.status}`;
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message;

    if (!msg?.tool_calls || msg.tool_calls.length === 0) {
      return msg?.content ?? "لم أتمكن من الرد";
    }

    messages.push(msg);

    for (const tc of msg.tool_calls) {
      const toolName = tc.function.name;
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
      const handler = TOOL_HANDLERS[toolName];
      const result = handler ? await handler(args) : { success: false, error: "أداة غير معروفة" };
      messages.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id, name: toolName });
    }
  }

  // رد نهائي
  const finalRes = await fetch(`${aiConfig.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiConfig.apiKey}` },
    body: JSON.stringify({ model: aiConfig.model, messages, temperature: 0.7 }),
    signal: AbortSignal.timeout(60000),
  });
  const finalData = await finalRes.json();
  return finalData.choices?.[0]?.message?.content ?? "انتهت المعالجة";
}

// ============================================================
// إرسال رسالة تليجرام
// ============================================================

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = await getBotToken();
  if (!token) return false;
  try {
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

✅ بعد الإضافة، اكتب أي سؤال وسأجيبك!

💡 أمثلة:
• "اعرض قضاياي النشطة"
• "ما جلسات الغد؟"
• "فيه مستحقات متأخرة؟"
• "كم عدد الموكلين؟"`;
    await sendTelegramMessage(chatId, reply);
    return;
  }

  // أمر /help
  if (text === "/help") {
    await sendTelegramMessage(chatId, `📚 الأوامر المتاحة:

/start - بدء الاستخدام
/help - المساعدة
/stats - إحصائيات سريعة
/appointments - مواعيد اليوم
/tasks - مهام معلقة

أو اكتب سؤالك مباشرة بالعربية 🇪🇬`);
    return;
  }

  // أوامر سريعة
  if (text === "/stats") {
    const reply = await runAgent("أعطني إحصائيات عامة موجزة");
    await sendTelegramMessage(chatId, reply);
    return;
  }
  if (text === "/appointments") {
    const reply = await runAgent("ما مواعيد اليوم؟");
    await sendTelegramMessage(chatId, reply);
    return;
  }
  if (text === "/tasks") {
    const reply = await runAgent("اعرض المهام المعلقة");
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
    const reply = await runAgent(text);
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
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
          if (update.message?.text && update.message.chat?.id) {
            const chatId = String(update.message.chat.id);
            const text = update.message.text;
            console.log(`📩 [${chatId}] ${text}`);
            // معالجة الرسالة (لا ننتظرها)
            handleTelegramMessage(chatId, text).catch(console.error);
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
// تصدير الدوال للاستخدام في API routes
// ============================================================

export {
  startTelegramPolling,
  sendTelegramMessage,
  handleTelegramMessage,
  getBotToken,
  getAuthorizedChatIds,
  runAgent as runTelegramAgent,
};
