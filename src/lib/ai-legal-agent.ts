// ============================================================
// AI Legal Agent - معمارية متعددة الطبقات
// Router → Planner → Executor → Verifier → Answer
// ============================================================

import { callAiModel, getProviderConfig, type ChatMessage } from "./ai-client";
import { executeTool, type ToolResult } from "./ai-tools";
import { db } from "./db";

// ============================================================
// الأنواع
// ============================================================

type TaskType = "database" | "legal_kb" | "hybrid" | "general" | "drafting";
type ActionType = "read" | "create" | "update" | "delete" | "analyze" | "draft";

interface RouterResult {
  task_type: TaskType;
  intent: string;
  action: ActionType;
  requires_database: boolean;
  requires_legal_kb: boolean;
  requires_reasoning: boolean;
  requires_confirmation: boolean;
  confidence: number;
  missing_info?: string[];
}

interface PlanStep {
  need: string;
  description: string;
  priority: "required" | "optional";
}

interface Plan {
  goal: string;
  steps: PlanStep[];
  needs_confirmation: boolean;
}

interface ExecutedStep {
  need: string;
  tool?: string;
  result?: ToolResult;
  data?: unknown;
  success: boolean;
}

interface VerificationResult {
  sufficient: boolean;
  confidence: number;
  missing: string[];
  has_data: boolean;
  has_legal_context: boolean;
}

export interface AgentResult {
  answer: string;
  confidence: number;
  task_type: TaskType;
  intent: string;
  steps_executed: number;
  tools_used: string[];
  missing_info: string[];
  actions: Array<{ tool: string; args: Record<string, unknown>; result: ToolResult }>;
}

// ============================================================
// الذاكرة - Session Memory
// ============================================================

interface SessionContext {
  lastCaseId?: string;
  lastClientId?: string;
  lastCaseData?: Record<string, unknown>;
  lastClientData?: Record<string, unknown>;
  conversationSummary: string[];
  pendingConfirmation?: { tool: string; args: Record<string, unknown>; description: string };
}

class SessionMemory {
  private sessions = new Map<string, SessionContext>();

  get(sessionId: string): SessionContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { conversationSummary: [] });
    }
    return this.sessions.get(sessionId)!;
  }

  setCase(sessionId: string, caseId: string, data?: Record<string, unknown>) {
    const ctx = this.get(sessionId);
    ctx.lastCaseId = caseId;
    if (data) ctx.lastCaseData = data;
  }

  setClient(sessionId: string, clientId: string, data?: Record<string, unknown>) {
    const ctx = this.get(sessionId);
    ctx.lastClientId = clientId;
    if (data) ctx.lastClientData = data;
  }

  addSummary(sessionId: string, summary: string) {
    const ctx = this.get(sessionId);
    ctx.conversationSummary.push(summary);
    if (ctx.conversationSummary.length > 10) {
      ctx.conversationSummary = ctx.conversationSummary.slice(-10);
    }
  }

  setPendingConfirmation(sessionId: string, conf: SessionContext["pendingConfirmation"]) {
    this.get(sessionId).pendingConfirmation = conf;
  }

  getPendingConfirmation(sessionId: string) {
    return this.get(sessionId).pendingConfirmation;
  }

  clearPending(sessionId: string) {
    this.get(sessionId).pendingConfirmation = undefined;
  }

  getSummary(sessionId: string): string {
    return this.get(sessionId).conversationSummary.join("\n");
  }
}

const memory = new SessionMemory();

// ============================================================
// 1. ROUTER AGENT
// يصنف نية المستخدم - لا ينفذ شيئاً
// ============================================================

async function routeQuery(userMessage: string, sessionId: string): Promise<RouterResult> {
  const ctx = memory.get(sessionId);
  const contextHint = ctx.lastCaseId || ctx.lastClientId
    ? `\nالسياق: آخر قضية=${ctx.lastCaseId ?? "لا"}, آخر موكل=${ctx.lastClientId ?? "لا"}`
    : "";

  const routerPrompt = `أنت Router Agent. وظيفتك الوحيدة هي تصنيف رسالة المستخدم.

حلل الرسالة التالية وأرجع JSON فقط بدون أي نص إضافي:

{
  "task_type": "database | legal_kb | hybrid | general | drafting",
  "intent": "وصف مختصر لنية المستخدم",
  "action": "read | create | update | delete | analyze | draft",
  "requires_database": boolean,
  "requires_legal_kb": boolean,
  "requires_reasoning": boolean,
  "requires_confirmation": boolean,
  "confidence": 0.0-1.0,
  "missing_info": ["قائمة بالمعلومات الناقصة إن وجدت"]
}

قواعد التصنيف:
- database: سؤال عن بيانات النظام (موكلين، قضايا، مهام، مواعيد، مالية)
- legal_kb: سؤال قانوني بحت (ما عقوبة...، اشرح المادة...، شروط...)
- hybrid: يحتاج بيانات النظام + معرفة قانونية (حلل موقف موكلي، ما نقاط الضعف)
- drafting: صياغة مستند (اكتب مذكرة، صُغ عقد، أنشئ صحيفة)
- general: محادثة عامة (مرحبا، من أنت)

قواعد التأكيد:
- delete: requires_confirmation = true دائماً
- update للبيانات المالية: requires_confirmation = true
- create/read: requires_confirmation = false

رسالة المستخدم: "${userMessage}"${contextHint}`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: routerPrompt }],
      { temperature: 0.1, maxTokens: 500 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        task_type: "general",
        intent: "غير محدد",
        action: "read",
        requires_database: false,
        requires_legal_kb: false,
        requires_reasoning: false,
        requires_confirmation: false,
        confidence: 0.3,
      };
    }

    return JSON.parse(jsonMatch[0]) as RouterResult;
  } catch (error) {
    console.error("Router error:", error);
    return {
      task_type: "general",
      intent: "خطأ في التصنيف",
      action: "read",
      requires_database: false,
      requires_legal_kb: false,
      requires_reasoning: false,
      requires_confirmation: false,
      confidence: 0.1,
    };
  }
}

// ============================================================
// 2. PLANNER
// يضع خطة تنفيذ مستقلة عن أسماء الأدوات
// ============================================================

async function createPlan(
  userMessage: string,
  routerResult: RouterResult,
  sessionId: string
): Promise<Plan> {
  const ctx = memory.get(sessionId);
  const contextInfo = ctx.lastCaseId ? `\nآخر قضية مذكورة: ${ctx.lastCaseId}` : "";
  const contextInfo2 = ctx.lastClientId ? `\nآخر موكل مذكور: ${ctx.lastClientId}` : "";

  const plannerPrompt = `أنت Planner. ضع خطة تنفيذ للطلب التالي.

نوع المهمة: ${routerResult.task_type}
النية: ${routerResult.intent}
الإجراء: ${routerResult.action}
يحتاج قاعدة بيانات: ${routerResult.requires_database}
يحتاج معرفة قانونية: ${routerResult.requires_legal_kb}
يحتاج تحليل: ${routerResult.requires_reasoning}${contextInfo}${contextInfo2}

أرجع JSON فقط:
{
  "goal": "الهدف النهائي",
  "steps": [
    {"need": "case_data", "description": "جلب بيانات القضية", "priority": "required"},
    {"need": "documents", "description": "قراءة المستندات", "priority": "optional"}
  ],
  "needs_confirmation": ${routerResult.requires_confirmation}
}

الاحتياجات الممكنة:
- case_data: بيانات قضية
- client_data: بيانات موكل
- cases_list: قائمة قضايا
- clients_list: قائمة موكلين
- tasks_list: قائمة مهام
- appointments_list: قائمة مواعيد
- documents: مستندات
- finance_summary: ملخص مالي
- overdue_payments: مستحقات متأخرة
- stats: إحصائيات
- legal_references: مراجع قانونية
- similar_cases: قضايا مشابهة
- session_data: بيانات الجلسات
- create_client: إنشاء موكل
- create_case: إنشاء قضية
- create_task: إنشاء مهمة
- create_appointment: إنشاء موعد
- add_session: إضافة جلسة
- create_payment: تسجيل دفعة
- legal_analysis: تحليل قانوني
- draft_document: صياغة مستند

⚠️ قاعدة ذهبية حرجة - اقرأ بعناية:
- ضع في الخطة فقط ما طلبه المستخدم صراحةً في رسالته.
- لا تتخيل خطوات لم يطلبها. لا تضف create_case أو add_session أو create_appointment إلا إذا ذكرها المستخدم نصاً.
- مثال: "ضيف موكل" → خطوة واحدة فقط: create_client. لا تضف قضية أو جلسة أو موعد.
- مثال: "ضيف قضية" → create_case فقط (مع جلب الموكل إن ذُكر).
- مثال: "اعرض قضايا أحمد" → search_clients ثم search_cases فقط.
- إذا لم تكن متأكداً أن المستخدم يريد إجراءً معيناً، لا تضعه في الخطة.
- لا تجعل أي خطوة "required" إلا إذا كان المستخدم طلبها فعلاً.
- الخطة المثالية = أصغر مجموعة خطوات لتنفيذ طلب المستخدم حرفياً.

رسالة المستخدم: "${userMessage}"`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: plannerPrompt }],
      { temperature: 0.2, maxTokens: 800 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { goal: routerResult.intent, steps: [], needs_confirmation: routerResult.requires_confirmation };
    }

    return JSON.parse(jsonMatch[0]) as Plan;
  } catch {
    return { goal: routerResult.intent, steps: [], needs_confirmation: routerResult.requires_confirmation };
  }
}

// ============================================================
// 3. TOOL MAPPING
// يربط الاحتياجات بالأدوات الفعلية
// ============================================================

function mapNeedToTool(need: string): { tool: string; getDefaultArgs: (sessionId: string) => Record<string, unknown> } | null {
  const ctx = (sessionId: string) => memory.get(sessionId);
  const needs: Record<string, { tool: string; getDefaultArgs: (sid: string) => Record<string, unknown> }> = {
    case_data: { tool: "get_case_details", getDefaultArgs: (sid) => ({ caseId: ctx(sid).lastCaseId ?? "" }) },
    client_data: { tool: "get_client_details", getDefaultArgs: (sid) => ({ clientId: ctx(sid).lastClientId ?? "" }) },
    cases_list: { tool: "search_cases", getDefaultArgs: () => ({}) },
    clients_list: { tool: "search_clients", getDefaultArgs: () => ({}) },
    tasks_list: { tool: "list_tasks", getDefaultArgs: () => ({}) },
    appointments_list: { tool: "list_appointments", getDefaultArgs: () => ({ upcoming: true }) },
    documents: { tool: "search_documents", getDefaultArgs: (sid) => ({ caseId: ctx(sid).lastCaseId }) },
    finance_summary: { tool: "get_finance_summary", getDefaultArgs: () => ({}) },
    overdue_payments: { tool: "get_overdue_payments", getDefaultArgs: () => ({}) },
    stats: { tool: "get_stats", getDefaultArgs: () => ({}) },
    create_client: { tool: "create_client", getDefaultArgs: () => ({}) },
    create_case: { tool: "create_case", getDefaultArgs: () => ({}) },
    create_task: { tool: "create_task", getDefaultArgs: () => ({}) },
    create_appointment: { tool: "create_appointment", getDefaultArgs: () => ({}) },
    add_session: { tool: "add_session", getDefaultArgs: () => ({}) },
    create_payment: { tool: "create_payment", getDefaultArgs: () => ({}) },
    postpone_session: { tool: "postpone_session", getDefaultArgs: () => ({}) },
    search_cases: { tool: "search_cases", getDefaultArgs: () => ({}) },
    search_clients: { tool: "search_clients", getDefaultArgs: () => ({}) },
  };

  return needs[need] ?? null;
}

// ============================================================
// 4. EXECUTOR
// ينفذ الأدوات حسب الخطة
// ============================================================

async function executePlan(
  plan: Plan,
  userMessage: string,
  sessionId: string,
  routerResult: RouterResult
): Promise<{ executed: ExecutedStep[]; actions: AgentResult["actions"] }> {
  const executed: ExecutedStep[] = [];
  const actions: AgentResult["actions"] = [];

  // إذا كانت المهمة قانونية بحتة أو عامة - لا ننفذ أدوات
  if (routerResult.task_type === "legal_kb" || routerResult.task_type === "general") {
    return { executed, actions };
  }

  // إذا كانت صياغة - نحتاج بيانات النظام كسياق
  if (routerResult.task_type === "drafting") {
    // اجلب بيانات ذات صلة إذا كانت مذكورة
    for (const step of plan.steps) {
      if (step.need === "case_data" || step.need === "client_data" || step.need === "documents") {
        const mapping = mapNeedToTool(step.need);
        if (mapping && mapping.getDefaultArgs(sessionId)[Object.keys(mapping.getDefaultArgs(sessionId))[0]]) {
          const args = mapping.getDefaultArgs(sessionId);
          const result = await executeTool(mapping.tool, args);
          if (result.success) {
            executed.push({ need: step.need, tool: mapping.tool, result, data: result.data, success: true });
            actions.push({ tool: mapping.tool, args, result });
            // حفظ في الذاكرة
            if (step.need === "case_data" && result.data) memory.setCase(sessionId, (result.data as { id: string }).id, result.data as Record<string, unknown>);
            if (step.need === "client_data" && result.data) memory.setClient(sessionId, (result.data as { id: string }).id, result.data as Record<string, unknown>);
          }
        }
      }
    }
    return { executed, actions };
  }

  // للمهام العادية والهجينة - نفذ كل خطوات الخطة

  // أولاً: إذا كان الإجراء إنشاء/تعديل/حذف، استخرج البيانات من رسالة المستخدم
  if (routerResult.action === "create" || routerResult.action === "update" || routerResult.action === "delete") {
    // اجمع كل خطوات الإنشاء/التعديل (وليس الأولى فقط)
    const createSteps = plan.steps.filter(s =>
      s.need.startsWith("create_") || s.need.startsWith("add_") || s.need.startsWith("postpone_")
    );

    if (createSteps.length === 0) {
      return { executed, actions };
    }

    // للعمليات الخطيرة (delete/update مالي) - اطلب تأكيد للخطوة الأولى فقط
    if (routerResult.requires_confirmation) {
      const pending = memory.getPendingConfirmation(sessionId);
      if (pending) {
        const confirmWords = ["نعم", "أكّد", "اكد", "yes", "أيوة", "اه"];
        if (confirmWords.some(w => userMessage.toLowerCase().includes(w.toLowerCase()))) {
          memory.clearPending(sessionId);
          const result = await executeTool(pending.tool, pending.args);
          actions.push({ tool: pending.tool, args: pending.args, result });
          executed.push({ need: createSteps[0].need, tool: pending.tool, result, success: result.success });
          return { executed, actions };
        } else {
          memory.clearPending(sessionId);
        }
      } else {
        // اطلب تأكيد للعملية الخطيرة
        const firstStep = createSteps[0];
        const firstMapping = mapNeedToTool(firstStep.need);
        if (firstMapping) {
          const extractedArgs = await extractDataFromMessage(userMessage, firstMapping.tool, sessionId);
          if (extractedArgs) {
            const itemDesc = extractedArgs.fullName || extractedArgs.internalNumber || extractedArgs.title || "هذا العنصر";
            memory.setPendingConfirmation(sessionId, {
              tool: firstMapping.tool,
              args: extractedArgs,
              description: itemDesc,
            });
            executed.push({ need: "confirmation", success: false });
            return { executed, actions };
          }
        }
        return { executed, actions };
      }
    }

    // استخرج كل البيانات المنظمة من رسالة المستخدم دفعة واحدة
    const allData = await extractAllCreateDataFromMessage(
      userMessage,
      createSteps.map(s => s.need),
      sessionId
    );

    // تتبع المعرفات المنشأة لربط الخطوات اللاحقة
    let lastClientId = memory.get(sessionId).lastClientId ?? "";
    let lastCaseId = memory.get(sessionId).lastCaseId ?? "";

    // نفّذ كل خطوات create بالتسلسل
    for (const step of createSteps) {
      const mapping = mapNeedToTool(step.need);
      if (!mapping) continue;

      // خذ البيانات المستخرجة لهذه الخطوة
      const args: Record<string, unknown> = { ...(allData[step.need] || {}) };

      // حقن المعرفات من الإجراءات السابقة في السلسلة
      if ((step.need === "create_case" || step.need === "create_appointment" ||
           step.need === "create_task" || step.need === "create_payment") && !args.clientId && lastClientId) {
        args.clientId = lastClientId;
      }
      if ((step.need === "add_session" || step.need === "create_task") && !args.caseId && lastCaseId) {
        args.caseId = lastCaseId;
      }

      // إذا كانت البيانات الأساسية مفقودة، تخطّى الخطوة
      if (step.need === "create_client" && !args.fullName) continue;
      if (step.need === "create_case" && (!args.internalNumber || !args.clientId)) {
        // لا يمكن إنشاء قضية بدون رقم داخلي أو موكل
        executed.push({ need: step.need, tool: mapping.tool, success: false, result: { success: false, error: "بيانات ناقصة لإنشاء القضية" } });
        continue;
      }
      if (step.need === "add_session" && (!args.caseId || !args.sessionDate)) {
        executed.push({ need: step.need, tool: mapping.tool, success: false, result: { success: false, error: "بيانات ناقصة لإضافة الجلسة" } });
        continue;
      }

      // نفّذ الأداة
      const result = await executeTool(mapping.tool, args);
      actions.push({ tool: mapping.tool, args, result });
      executed.push({
        need: step.need,
        tool: mapping.tool,
        result,
        data: result.data,
        success: result.success,
      });

      // تحديث المعرفات للخطوات اللاحقة (chaining)
      if (result.success && result.data) {
        const data = result.data as { id?: string };
        if (step.need === "create_client" && data.id) {
          lastClientId = data.id;
          memory.setClient(sessionId, data.id, result.data as Record<string, unknown>);
        }
        if (step.need === "create_case" && data.id) {
          lastCaseId = data.id;
          memory.setCase(sessionId, data.id, result.data as Record<string, unknown>);
        }
      }
    }

    return { executed, actions };
  }

  // للقراءة والتحليل: نفذ كل خطوات البحث
  for (const step of plan.steps) {
    // تخطى الخطوات غير المطلوبة لقاعدة البيانات
    if (step.need === "legal_references" || step.need === "similar_cases" || step.need === "legal_analysis" || step.need === "draft_document") {
      continue;
    }

    const mapping = mapNeedToTool(step.need);
    if (!mapping) continue;

    // استخرج معاملات البحث من رسالة المستخدم
    let args = mapping.getDefaultArgs(sessionId);

    // إذا كان بحث، استخرج كلمة البحث
    if (step.need === "search_cases" || step.need === "search_clients" || step.need === "cases_list" || step.need === "clients_list") {
      const searchQuery = await extractSearchQuery(userMessage, step.need, sessionId);
      if (searchQuery) args = { ...args, query: searchQuery };
    }

    // إذا كانت المعاملات الأساسية فارغة، تخطى
    const requiredArg = Object.values(args)[0];
    if (!requiredArg && (step.need === "case_data" || step.need === "client_data")) {
      // ابحث أولاً
      const searchNeed = step.need === "case_data" ? "search_cases" : "search_clients";
      const searchMapping = mapNeedToTool(searchNeed);
      if (searchMapping) {
        const searchQuery = await extractSearchQuery(userMessage, searchNeed, sessionId);
        const searchArgs = { ...(searchQuery ? { query: searchQuery } : {}) };
        const searchResult = await executeTool(searchMapping.tool, searchArgs);
        if (searchResult.success && Array.isArray(searchResult.data) && searchResult.data.length > 0) {
          const firstItem = searchResult.data[0] as { id: string };
          if (step.need === "case_data") memory.setCase(sessionId, firstItem.id);
          if (step.need === "client_data") memory.setClient(sessionId, firstItem.id);
          args = { caseId: firstItem.id } || { clientId: firstItem.id };
          actions.push({ tool: searchMapping.tool, args: searchArgs, result: searchResult });
        }
      }
    }

    const result = await executeTool(mapping.tool, args);
    if (result.success) {
      executed.push({ need: step.need, tool: mapping.tool, result, data: result.data, success: true });
      actions.push({ tool: mapping.tool, args, result });

      // حفظ في الذاكرة
      if (result.data) {
        const data = result.data as { id?: string };
        if (step.need === "case_data" && data.id) memory.setCase(sessionId, data.id, result.data as Record<string, unknown>);
        if (step.need === "client_data" && data.id) memory.setClient(sessionId, data.id, result.data as Record<string, unknown>);
      }
    } else {
      executed.push({ need: step.need, tool: mapping.tool, result, success: false });
    }
  }

  return { executed, actions };
}

// ============================================================
// استخراج البيانات من رسالة المستخدم
// ============================================================

// استخراج كل البيانات لعدة عمليات create دفعة واحدة
// مفيد عندما يطلب المستخدم عدة إنشاءات في رسالة واحدة
async function extractAllCreateDataFromMessage(
  message: string,
  createNeeds: string[],
  sessionId: string
): Promise<Record<string, Record<string, unknown>>> {
  const ctx = memory.get(sessionId);

  const needsList = createNeeds.map(n => {
    const labels: Record<string, string> = {
      create_client: "موكل جديد",
      create_case: "قضية جديدة",
      add_session: "جلسة لقضية",
      create_appointment: "موعد/تذكير",
      create_task: "مهمة",
      create_payment: "دفعة مالية",
      create_power_of_attorney: "توكيل",
    };
    return `- ${n}: ${labels[n] ?? n}`;
  }).join("\n");

  const extractPrompt = `استخرج كل البيانات من رسالة المستخدم لإنشاء عدة عناصر.

العناصر المطلوب إنشاؤها:
${needsList}

⚠️ قواعد صارمة:
- استخرج فقط البيانات المذكورة صراحةً في رسالة المستخدم.
- لا تخمن أي قيمة. لا تختلق أرقام قضايا أو تواريخ أو أسماء.
- إذا لم توجد بيانات لعنصر ما، اتركه كـ {} (كائن فارغ).

قواعد الاستخراج المهمة:
- أرقام القضايا: استخرج الرقم والسنة معاً كما وردت.
  مثال: "قضية رقمها 11 لسنة 2025" → {"internalNumber": "11 لسنة 2025"}
  مثال: "قضية رقم 2024/001" → {"internalNumber": "2024/001"}
  مثال: "12 لسنة 2026 جنح سمالوط شرق" → {"internalNumber": "12 لسنة 2026", "court": "سمالوط شرق"}
- نوع القضية (caseType) من النص:
  • "إداري" أو "اداري" → "administrative"
  • "جنح" أو "جنائية" → "criminal"
  • "مدني" → "civil"
  • "تجاري" → "commercial"
  • "أحوال شخصية" → "personal_status"
- المحكمة (court): استخرج اسم المحكمة كاملاً. مثال: "اداري غرب سمالوط" → "محكمة غرب سمالوط الإدارية"
- التواريخ: حوّل لصيغة ISO. "11/07/2026" → "2026-07-11T09:00:00". "اليوم" → تاريخ اليوم ${new Date().toISOString().slice(0,10)}T09:00:00.
- "إنذار" → create_appointment بعنوان "إنذار" و eventType "deadline".
- "قضية تانية" أو "الثانية" بدون تفاصيل → {"internalNumber": "TBD"}.

السياق: ${ctx.lastClientId ? `آخر موكل=${ctx.lastClientId}` : "لا يوجد موكل سابق"}
${ctx.lastCaseId ? `آخر قضية=${ctx.lastCaseId}` : ""}

رسالة المستخدم: "${message}"

أرجع JSON فقط بهذا الشكل (كل مفتاح هو نوع الإنشاء، والقيمة هي بياناته):
{
  "create_client": {"fullName": "...", "phone": "..."},
  "create_case": {"internalNumber": "...", "caseType": "civil", "court": "...", "officialNumber": "..."},
  "add_session": {"sessionDate": "2026-07-11T09:00:00"},
  "create_appointment": {"title": "...", "startDate": "2026-07-13T09:00:00", "eventType": "deadline"}
}`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: extractPrompt }],
      { temperature: 0.1, maxTokens: 1000 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as Record<string, Record<string, unknown>>;
  } catch {
    return {};
  }
}

async function extractDataFromMessage(
  message: string,
  toolName: string,
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const ctx = memory.get(sessionId);

  const extractPrompt = `استخرج البيانات من رسالة المستخدم لإنشاء ${toolName}.

⚠️ قاعدة حرجة:
- استخرج فقط البيانات المذكورة صراحةً في رسالة المستخدم.
- لا تخمن أي قيمة. لا تختلق أرقام قضايا أو تواريخ أو أسماء لم يذكرها المستخدم.
- إذا لم تجد قيمة لحقل ما، اتركه فارغاً أو احذفه. لا تضع قيماً افتراضية من خيالك.
- مثال: إذا قال المستخدم "ضيف موكل مصطفى بكري" → فقط {"fullName": "مصطفى بكري"}. لا تخمن هاتف أو بريد أو رقم قضية.

السياق: ${ctx.lastClientId ? `آخر موكل=${ctx.lastClientId}` : "لا يوجد"}
${ctx.lastCaseId ? `آخر قضية=${ctx.lastCaseId}` : ""}

رسالة المستخدم: "${message}"

أرجع JSON فقط بالبيانات المستخرجة الفعلية من الرسالة:
- create_client: {"fullName": "...", "phone": "...", "email": "..."} (فقط ما ذُكر)
- create_case: {"internalNumber": "...", "caseType": "...", "clientId": "..."} (فقط ما ذُكر)
- create_task: {"title": "...", "priority": "..."}
- create_appointment: {"title": "...", "startDate": "..."}
- add_session: {"caseId": "...", "sessionDate": "..."}
- create_payment: {"clientId": "...", "amount": ...}`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: extractPrompt }],
      { temperature: 0.1, maxTokens: 500 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // إذا كان create_case ولم يكن هناك clientId، استخدم آخر موكل
    if (toolName === "create_case" && !parsed.clientId && ctx.lastClientId) {
      parsed.clientId = ctx.lastClientId;
    }

    // إذا كان add_session ولم يكن هناك caseId، استخدم آخر قضية
    if (toolName === "add_session" && !parsed.caseId && ctx.lastCaseId) {
      parsed.caseId = ctx.lastCaseId;
    }

    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// استخراج كلمة البحث
// ============================================================

async function extractSearchQuery(
  message: string,
  need: string,
  sessionId: string
): Promise<string | null> {
  // محاولة استخراج اسم/رقم من الرسالة
  const extractPrompt = `استخرج كلمة البحث من رسالة المستخدم.

رسالة: "${message}"
نوع البحث: ${need}

أرجع كلمة البحث فقط بدون أي شرح. إذا لم تجد كلمة بحث، أرجع "NONE".`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: extractPrompt }],
      { temperature: 0.1, maxTokens: 100 }
    );

    const query = result.content.trim();
    if (query === "NONE" || query.length < 2) return null;
    return query;
  } catch {
    return null;
  }
}

// ============================================================
// 5. VERIFIER
// يتحقق من اكتمال المعلومات
// ============================================================

async function verifyResults(
  plan: Plan,
  executed: ExecutedStep[],
  routerResult: RouterResult,
  sessionId: string
): Promise<VerificationResult> {
  // إذا كانت المهمة عامة أو قانونية بحتة، لا نحتاج تحقق
  if (routerResult.task_type === "general" || routerResult.task_type === "legal_kb") {
    return { sufficient: true, confidence: 0.8, missing: [], has_data: false, has_legal_context: routerResult.task_type === "legal_kb" };
  }

  const requiredSteps = plan.steps.filter(s => s.priority === "required");
  const executedNeeds = executed.map(e => e.need);
  const executedSuccessful = executed.filter(e => e.success);

  // للعمليات create: حدد الفاشلة فعلاً (حُاولت ولم تنجح) وليس المتخيلة
  // الخطوات المتخيلة = المطلوبة لكنها لم تُحاول أصلاً (لأن البيانات ناقصة)
  // كلاهما نواقص، لكن نفرّق في الوصف
  const missing: string[] = [];
  for (const step of requiredSteps) {
    const executedStep = executed.find(e => e.need === step.need);
    if (!executedStep) {
      // لم تُحاول - إما تخطي لنقص بيانات أو لم تصل للتنفيذ
      missing.push(step.need);
    } else if (!executedStep.success) {
      // حُاولت وفشلت
      missing.push(step.need);
    }
  }

  // إذا نجح إجراء create واحد على الأقل وحاولنا كل الخطوات - نعتبرها مكتملة جزئياً
  const hasSuccessfulAction = executedSuccessful.some(e =>
    ["create_client", "create_case", "create_task", "create_appointment",
     "add_session", "create_payment", "create_expense", "create_power_of_attorney"].includes(e.need)
  );

  // ثقة عالية إذا نجحت كل الخطوات المطلوبة
  const allRequiredDone = missing.length === 0;
  const confidence = allRequiredDone
    ? 0.9
    : hasSuccessfulAction
      ? 0.6  // نجح بعضها - ثقة متوسطة
      : 0.3;

  const hasData = executed.some(e => e.success && e.data);
  const hasLegalContext = routerResult.requires_legal_kb;

  return {
    sufficient: allRequiredDone && (hasData || !routerResult.requires_database),
    confidence,
    missing,
    has_data: hasData,
    has_legal_context: hasLegalContext,
  };
}

// ============================================================
// 6. ANSWER GENERATOR
// يولد الإجابة النهائية مع التحليل
// ============================================================

async function generateAnswer(
  userMessage: string,
  routerResult: RouterResult,
  plan: Plan,
  executed: ExecutedStep[],
  verification: VerificationResult,
  sessionId: string
): Promise<string> {
  const ctx = memory.get(sessionId);
  const conversationContext = memory.getSummary(sessionId);

  // بناء سياق البيانات
  let dataContext = "";
  if (executed.length > 0) {
    dataContext = "\n\n# البيانات المسترجعة من النظام:\n";
    for (const step of executed) {
      if (step.success && step.data) {
        dataContext += `\n## ${step.need}:\n${JSON.stringify(step.data, null, 2).slice(0, 2000)}\n`;
      }
    }
  }

  // إذا كانت العملية تحتاج تأكيد
  const pending = memory.getPendingConfirmation(sessionId);
  if (pending) {
    return `⚠️ هل تريد تأكيد العملية التالية؟\n\n${pending.description}\n\nأرسل "نعم" للتأكيد أو "لا" للإلغاء.`;
  }

  // بناء البرومبت حسب نوع المهمة
  let systemRole = "أنت محامٍ محترف يعمل في مكتب محاماة.";

  // للعمليات create: ركّز على ما تم تنفيذه فعلاً
  const successfulActions = executed.filter(e =>
    e.success && [
      "create_client", "create_case", "create_task", "create_appointment",
      "add_session", "create_payment", "create_expense", "create_power_of_attorney",
    ].includes(e.need)
  );
  const failedActions = executed.filter(e =>
    !e.success && [
      "create_client", "create_case", "create_task", "create_appointment",
      "add_session", "create_payment", "create_expense", "create_power_of_attorney",
    ].includes(e.need)
  );

  if (successfulActions.length > 0 && routerResult.action === "create") {
    systemRole += `\nتم تنفيذ ${successfulActions.length} عملية بنجاح:
${successfulActions.map(a => `- ${a.need}: ${a.result?.message ?? "تم"}`).join("\n")}

أبلغ المستخدم بكل ما تم إنجازه. اذكر كل عملية ناجحة بشكل واضح.
${failedActions.length > 0 ? `فشل ${failedActions.length} عملية:\n${failedActions.map(a => `- ${a.need}: ${a.result?.error ?? "خطأ"}`).join("\n")}\nاذكر الأسباب بإيجاز.` : "كل العمليات المطلوبة نجحت."}
لا تخمن. لا تقترح إجراءات إضافية لم يطلبها المستخدم.`;
  } else if (routerResult.task_type === "hybrid") {
    systemRole += `\nالمهمة تحتاج تحليلاً هجيناً: ادمج بيانات النظام مع معرفتك القانونية.
حلل الموقف القانوني بناءً على البيانات المتاحة.
إذا كانت البيانات ناقصة، اذكر ما ينقص صراحة.
قدم تحليلاً مهنياً مع درجة الثقة.`;
  } else if (routerResult.task_type === "legal_kb") {
    systemRole += `\nالمهمة قانونية بحتة. أجب من معرفتك القانونية.
استشهد بالمواد القانونية والنصوص التشريعية المناسبة.`;
  } else if (routerResult.task_type === "drafting") {
    systemRole += `\nالمهمة صياغة مستند قانوني. استخدم البيانات المتاحة كسياق.
اصيغ المستند بالهيكل القانوني الصحيح.`;
  } else if (routerResult.task_type === "database") {
    systemRole += `\nالمهمة عن بيانات النظام. أجب بناءً على البيانات المسترجعة فقط.
لا تخمن. إذا لم توجد بيانات، قل "لا يوجد".اعرض الأرقام والأسماء الحقيقية.`;
  }

  if (conversationContext) {
    systemRole += `\n\n# سياق المحادثة السابقة:\n${conversationContext}`;
  }

  // اذكر النواقص فقط للخطوات المطلوبة التي لم تُحاول (وليس الفاشلة - الفاشلة ذُكرت أعلاه)
  if (verification.missing.length > 0 && successfulActions.length === 0 && failedActions.length === 0) {
    systemRole += `\n\n⚠️ معلومات ناقصة: ${verification.missing.join(", ")}\nاذكر هذه النواقص في إجابتك.`;
  }

  systemRole += `\n\n# درجة الثقة: ${Math.round(verification.confidence * 100)}%`;

  const answerPrompt = `${systemRole}${dataContext}

# سؤال المستخدم: ${userMessage}

أجب بالعربية بأسلوب موجز ومباشر. لا تخمن أبداً.`;

  try {
    const result = await callAiModel(
      [{ role: "user", content: answerPrompt }],
      { temperature: 0.7, maxTokens: 2000 }
    );
    // إذا الـ AI رجع empty، ابنِ رداً من النتائج الفعلية
    if (result.content && result.content.trim().length > 0) {
      return result.content;
    }
    return buildFallbackAnswer(executed, verification);
  } catch (error) {
    // في حالة فشل AI، ابنِ رداً من النتائج الفعلية
    return buildFallbackAnswer(executed, verification);
  }
}

// بناء رد احتياطي من النتائج الفعلية للإجراءات المنفذة
function buildFallbackAnswer(
  executed: ExecutedStep[],
  verification: VerificationResult
): string {
  const ACTION_LABELS: Record<string, string> = {
    create_client: "إنشاء موكل",
    create_case: "إنشاء قضية",
    create_task: "إنشاء مهمة",
    create_appointment: "إنشاء موعد",
    add_session: "إضافة جلسة",
    create_payment: "تسجيل دفعة",
    create_expense: "تسجيل مصروف",
    create_power_of_attorney: "إضافة توكيل",
  };

  const successful = executed.filter(e =>
    e.success && ACTION_LABELS[e.need]
  );
  const failed = executed.filter(e =>
    !e.success && ACTION_LABELS[e.need]
  );

  if (successful.length === 0 && failed.length === 0) {
    if (verification.missing.length > 0) {
      return `⚠️ تعذّر تنفيذ الطلب.\n\nنواقص: ${verification.missing.join("، ")}.\nيرجى تزويد بيانات أكثر.`;
    }
    return "لم أتمكن من تنفيذ الطلب. حاول إعادة الصياغة.";
  }

  const parts: string[] = [];
  if (successful.length > 0) {
    parts.push("✅ تم تنفيذ ما يلي بنجاح:");
    for (const a of successful) {
      const label = ACTION_LABELS[a.need];
      const msg = a.result?.message ?? "";
      const data = a.data as Record<string, unknown> | undefined;
      let detail = "";
      if (a.need === "create_client" && data) {
        detail = `${data.fullName ?? ""} (${data.id ?? ""})`;
      } else if (a.need === "create_case" && data) {
        detail = `${data.internalNumber ?? ""} (${data.id ?? ""})`;
      } else if (a.need === "create_appointment" && data) {
        detail = `${data.title ?? ""}`;
      } else if (a.need === "add_session") {
        detail = msg;
      } else {
        detail = msg;
      }
      parts.push(`• ${label}: ${detail}`.trim());
    }
  }

  if (failed.length > 0) {
    parts.push("\n❌ فشل في:");
    for (const a of failed) {
      const label = ACTION_LABELS[a.need];
      const err = a.result?.error ?? "خطأ غير معروف";
      parts.push(`• ${label}: ${err}`);
    }
  }

  if (verification.missing.length > 0 && successful.length === 0) {
    parts.push(`\n⚠️ نواقص: ${verification.missing.join("، ")}`);
  }

  return parts.join("\n");
}

// ============================================================
// PIPELINE الرئيسي
// ============================================================

export async function runLegalAgent(
  userMessage: string,
  sessionId: string = "default"
): Promise<AgentResult> {
  console.log(`\n========== Legal Agent Pipeline ==========`);
  console.log(`[1] User: ${userMessage.slice(0, 100)}`);

  // التحقق من تأكيد معلّق
  const pending = memory.getPendingConfirmation(sessionId);
  if (pending) {
    const confirmWords = ["نعم", "أكّد", "اكد", "yes", "أيوة", "اه"];
    const cancelWords = ["لا", "إلغاء", "الغاء", "cancel", "no"];

    if (confirmWords.some(w => userMessage.toLowerCase().includes(w.toLowerCase()))) {
      memory.clearPending(sessionId);
      const result = await executeTool(pending.tool, pending.args);
      const answer = result.success
        ? `✅ تم تنفيذ: ${pending.description}\n\n${result.message ?? ""}`
        : `❌ فشل: ${result.error ?? "خطأ"}`;
      memory.addSummary(sessionId, `تم تنفيذ ${pending.description}`);
      return {
        answer,
        confidence: result.success ? 0.9 : 0.3,
        task_type: "database",
        intent: "تأكيد عملية",
        steps_executed: 1,
        tools_used: [pending.tool],
        missing_info: [],
        actions: [{ tool: pending.tool, args: pending.args, result }],
      };
    } else if (cancelWords.some(w => userMessage.toLowerCase().includes(w.toLowerCase()))) {
      memory.clearPending(sessionId);
      return {
        answer: "✅ تم إلغاء العملية.",
        confidence: 1.0,
        task_type: "general",
        intent: "إلغاء",
        steps_executed: 0,
        tools_used: [],
        missing_info: [],
        actions: [],
      };
    }
    memory.clearPending(sessionId);
  }

  // 1. Router
  const routerResult = await routeQuery(userMessage, sessionId);
  console.log(`[2] Router: type=${routerResult.task_type}, action=${routerResult.action}, confidence=${routerResult.confidence}`);

  // 2. Planner
  const plan = await createPlan(userMessage, routerResult, sessionId);
  console.log(`[3] Planner: goal="${plan.goal}", steps=${plan.steps.length}`);

  // 3. Executor
  const { executed, actions } = await executePlan(plan, userMessage, sessionId, routerResult);
  console.log(`[4] Executor: ${executed.length} steps executed, ${actions.length} tools used`);

  // 4. Verifier
  const verification = await verifyResults(plan, executed, routerResult, sessionId);
  console.log(`[5] Verifier: sufficient=${verification.sufficient}, confidence=${verification.confidence}, missing=${verification.missing.length}`);

  // 5. Answer
  const answer = await generateAnswer(userMessage, routerResult, plan, executed, verification, sessionId);
  console.log(`[6] Answer: ${answer.slice(0, 100)}...`);

  // حفظ في الذاكرة
  memory.addSummary(sessionId, `سؤال: ${userMessage.slice(0, 80)} → ${answer.slice(0, 80)}`);

  return {
    answer,
    confidence: verification.confidence,
    task_type: routerResult.task_type,
    intent: routerResult.intent,
    steps_executed: executed.length,
    tools_used: actions.map(a => a.tool),
    missing_info: verification.missing,
    actions,
  };
}

// ============================================================
// تصدير
// ============================================================

export { memory as sessionMemory, routeQuery, createPlan, executePlan, verifyResults };
