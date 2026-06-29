// ============================================================
// المحامي الشامل - Telegram Bot
// مساعد قانوني عبر تليجرام يستخدم AI Agent
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const PORT = 3004;

// إعدادات من متغيرات البيئة
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const AI_BASE_URL = process.env.AI_PROVIDER_BASE_URL ?? "https://api.freemodel.dev/v1";
const AI_API_KEY = process.env.AI_PROVIDER_API_KEY ?? "";
const AI_MODEL = process.env.AI_PROVIDER_MODEL ?? "gpt-5.5";

// ============================================================
// تخزين معرفات تليجرام المصرح بها (في قاعدة البيانات)
// ============================================================

async function getAuthorizedChatIds(): Promise<string[]> {
  try {
    const setting = await db.setting.findUnique({ where: { id: "telegram_chat_ids" } });
    if (!setting) return [];
    return JSON.parse(setting.value);
  } catch {
    return [];
  }
}

async function addAuthorizedChatId(chatId: string): Promise<void> {
  const ids = await getAuthorizedChatIds();
  if (!ids.includes(chatId)) {
    ids.push(chatId);
    await db.setting.upsert({
      where: { id: "telegram_chat_ids" },
      update: { value: JSON.stringify(ids) },
      create: { id: "telegram_chat_ids", value: JSON.stringify(ids) },
    });
  }
}

async function isAuthorized(chatId: string): Promise<boolean> {
  const ids = await getAuthorizedChatIds();
  return ids.includes(chatId);
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
  create_appointment: async (args) => {
    const a = await db.appointment.create({
      data: {
        title: args.title as string,
        startDate: new Date(args.startDate as string),
        eventType: (args.eventType as string) ?? "other",
        location: (args.location as string) ?? null,
        caseId: (args.caseId as string) ?? null,
      },
    });
    return { success: true, data: a, message: `تم إنشاء الموعد: ${a.title}` };
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
  { type: "function", function: { name: "create_appointment", description: "إنشاء موعد", parameters: { type: "object", properties: { title: { type: "string" }, startDate: { type: "string" } }, required: ["title", "startDate"] } } },
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
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 4; i++) {
    const response = await fetch(`${AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages, tools: TOOL_DEFINITIONS, tool_choice: "auto", temperature: 0.7 }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      const errText = await response.text();
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
  const finalRes = await fetch(`${AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
    body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.7 }),
    signal: AbortSignal.timeout(60000),
  });
  const finalData = await finalRes.json();
  return finalData.choices?.[0]?.message?.content ?? "انتهت المعالجة";
}

// ============================================================
// التعامل مع رسائل تليجرام
// ============================================================

async function handleTelegramUpdate(update: { message?: { chat: { id: number }; text?: string; from?: { first_name?: string } } }) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  // أمر التفويض
  if (text.startsWith("/start")) {
    const reply = `مرحباً بك في المساعد القانوني الذكي ⚖️

أنا متصل بنظام "المحامي الشامل" الخاص بك.
يمكنك سؤالي عن:
• القضايا والموكلين
• الجلسات والمواعيد
• المهام والمستحقات
• إحصائيات وملخصات

أمثلة:
- "اعرض قضاياي النشطة"
- "ما جلسات الغد؟"
- "فيه مستحقات متأخرة؟"
- "لخص قضية رقم 2024/123"

${chatId}
لتفعيل الوصول، أضف هذا المعرف من إعدادات النظام.`;
    await sendTelegramMessage(chatId, reply);
    return;
  }

  // أمر المساعدة
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
  const authorized = await isAuthorized(chatId);
  if (!authorized) {
    await sendTelegramMessage(chatId, `🔒 غير مصرح

معرف التليجرام الخاص بك: ${chatId}

للتفعيل:
1. افتح نظام "المحامي الشامل"
2. اذهب للإعدادات → تليجرام
3. أضف هذا المعرف: ${chatId}`);
    return;
  }

  // معالجة الرسالة بالـ AI
  await sendTelegramMessage(chatId, "⏳ جارٍ المعالجة...");
  try {
    const reply = await runAgent(text);
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Telegram send error:", error);
  }
}

// ============================================================
// تشغيل الخادم (Polling mode)
// ============================================================

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/webhook" && req.method === "POST") {
      const update = await req.json();
      handleTelegramUpdate(update);
      return new Response("ok");
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        bot: TELEGRAM_BOT_TOKEN ? "configured" : "not configured",
        ai: AI_API_KEY ? "configured" : "not configured",
        port: PORT,
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/poll" && req.method === "POST") {
      // بدء الـ polling يدوياً
      return new Response(JSON.stringify({ status: "polling started" }));
    }

    return new Response("المحامي الشامل - Telegram Bot", { status: 200 });
  },
});

console.log(`🤖 Telegram Bot running on port ${PORT}`);
console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
console.log(`❤️ Health: http://localhost:${PORT}/health`);

// ============================================================
// وضع الـ Polling التلقائي
// ============================================================

let lastUpdateId = 0;

async function pollUpdates() {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, {
      signal: AbortSignal.timeout(35000),
    });
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          handleTelegramUpdate(update);
        }
      }
    }
  } catch {
    // تجاهل أخطاء الـ polling
  }
}

// ابدأ الـ polling كل 5 ثوانٍ
if (TELEGRAM_BOT_TOKEN) {
  console.log("🔄 Starting polling mode...");
  setInterval(pollUpdates, 5000);
} else {
  console.log("⚠️ TELEGRAM_BOT_TOKEN not set - polling disabled");
  console.log("   Set it in .env: TELEGRAM_BOT_TOKEN=your_bot_token");
}
