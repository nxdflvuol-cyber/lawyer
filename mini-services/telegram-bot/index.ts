// ============================================================
// المحامي الشامل - Telegram Bot
// مساعد قانوني عبر تليجرام يستخدم AI Agent
// يقرأ الإعدادات من قاعدة البيانات (وليس من env فقط)
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const PORT = 3004;

// إعدادات افتراضية من env (كاحتياط)
const DEFAULT_AI_BASE_URL = process.env.AI_PROVIDER_BASE_URL ?? "https://api.freemodel.dev/v1";
const DEFAULT_AI_API_KEY = process.env.AI_PROVIDER_API_KEY ?? "";
const DEFAULT_AI_MODEL = process.env.AI_PROVIDER_MODEL ?? "gpt-5.5";

// ============================================================
// قراءة الإعدادات من قاعدة البيانات
// ============================================================

async function getBotToken(): Promise<string> {
  try {
    const setting = await db.setting.findUnique({ where: { id: "telegram_bot_token" } });
    return setting?.value || process.env.TELEGRAM_BOT_TOKEN || "";
  } catch {
    return process.env.TELEGRAM_BOT_TOKEN || "";
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
      baseUrl: baseUrl?.value || DEFAULT_AI_BASE_URL,
      apiKey: apiKey?.value || DEFAULT_AI_API_KEY,
      model: model?.value || DEFAULT_AI_MODEL,
    };
  } catch {
    return { baseUrl: DEFAULT_AI_BASE_URL, apiKey: DEFAULT_AI_API_KEY, model: DEFAULT_AI_MODEL };
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
// التعامل مع رسائل تليجرام
// ============================================================

async function handleTelegramUpdate(update: { message?: { chat: { id: number }; text?: string; from?: { first_name?: string } } }) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  console.log(`📩 [${chatId}] ${text}`);

  // أمر التفويض
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
  const token = await getBotToken();
  if (!token) {
    console.error("❌ لا يوجد توكن للبوت");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`✅ تم إرسال رسالة إلى ${chatId}`);
    } else {
      console.error(`❌ فشل الإرسال إلى ${chatId}:`, data.description);
    }
  } catch (error) {
    console.error("❌ Telegram send error:", error instanceof Error ? error.message : error);
  }
}

// ============================================================
// تشغيل الخادم
// ============================================================

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      const token = await getBotToken();
      const chatIds = await getAuthorizedChatIds();
      const aiConfig = await getAiConfig();
      return new Response(JSON.stringify({
        status: "ok",
        bot: token ? "configured" : "not configured",
        botTokenPreview: token ? token.slice(0, 10) + "..." : "",
        ai: aiConfig.apiKey ? "configured" : "not configured",
        authorizedChatIds: chatIds,
        port: PORT,
      }), { headers: { "Content-Type": "application/json" } });
    }

    // Webhook endpoint
    if (url.pathname === "/webhook" && req.method === "POST") {
      const update = await req.json();
      handleTelegramUpdate(update);
      return new Response("ok");
    }

    // Send test message
    if (url.pathname === "/send-test" && req.method === "POST") {
      try {
        const chatIds = await getAuthorizedChatIds();
        const token = await getBotToken();
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: "لم يتم تكوين رمز البوت" }), { headers: { "Content-Type": "application/json" } });
        }
        if (chatIds.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "لا توجد معرفات مصرح لها" }), { headers: { "Content-Type": "application/json" } });
        }

        let sent = 0;
        let errors = 0;
        for (const chatId of chatIds) {
          try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "✅ رسالة تجريبية من نظام المحامي الشامل\n\nالبوت يعمل بنجاح! ⚖️",
              }),
              signal: AbortSignal.timeout(15000),
            });
            if (res.ok) sent++;
            else errors++;
          } catch {
            errors++;
          }
        }

        return new Response(JSON.stringify({
          success: sent > 0,
          message: `تم إرسال ${sent} رسالة بنجاح${errors > 0 ? `، فشل ${errors}` : ""}`,
          sent,
          errors,
        }), { headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        }), { headers: { "Content-Type": "application/json" } });
      }
    }

    // Reload bot (عند تحديث الإعدادات)
    if (url.pathname === "/reload" && req.method === "POST") {
      // الـ polling سيقرأ الإعدادات الجديدة تلقائياً في الدورة القادمة
      return new Response(JSON.stringify({ success: true, message: "تم إعادة التحميل" }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("المحامي الشامل - Telegram Bot", { status: 200 });
  },
});

console.log(`🤖 Telegram Bot running on port ${PORT}`);
console.log(`📡 Health: http://localhost:${PORT}/health`);
console.log(`📤 Test: http://localhost:${PORT}/send-test`);

// ============================================================
// وضع الـ Polling التلقائي - يقرأ التوكن من DB في كل دورة
// ============================================================

let lastUpdateId = 0;
let currentToken = "";

async function pollUpdates() {
  const token = await getBotToken();
  if (!token) return;

  // إذا تغير التوكن، أعد التعيين
  if (token !== currentToken) {
    currentToken = token;
    lastUpdateId = 0; // إعادة تعيين للتوكن الجديد
    console.log(`🔄 Bot token updated: ${token.slice(0, 15)}...`);
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, {
      signal: AbortSignal.timeout(35000),
    });
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          console.log(`📩 Received message from chat ${update.message.chat.id}: ${update.message.text?.slice(0, 50)}`);
          handleTelegramUpdate(update);
        }
      }
    }
  } catch {
    // تجاهل أخطاء الـ polling
  }
}

// ابدأ الـ polling كل 3 ثوانٍ
console.log("🔄 Starting polling mode...");
setInterval(pollUpdates, 3000);
pollUpdates(); // تشغيل فوري
