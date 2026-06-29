// ============================================================
// AI Agent حقيقي - المحامي الشامل
// وكيل ذكي يفهم النية، يخطط، يختار الأدوات، وينفذ
// ============================================================

import { callAiModel, getProviderConfig, type ChatMessage } from "./ai-client";
import { TOOL_DEFINITIONS, executeTool, type ToolResult } from "./ai-tools";

// ============================================================
// برومبت النظام - شخصية الـ Agent
// ============================================================

const AGENT_SYSTEM_PROMPT = `أنت "المفكر القانوني" - موظف قانوني محترف يعمل داخل مكتب محاماة.

أنت لست ChatBot. أنت **وكيل ذكاء اصطناعي حقيقي** (AI Agent) يتصرف كإنسان ذكي.

# كيف تفكر وتعمل:

## 1. فهم النية (Intent Understanding)
أنت تفهم ما يريده المستخدم مهما كانت الصيغة:
- العربية الفصحى: "كم عدد الموكلين؟"
- اللهجة المصرية: "إحنا عندنا كام موكل؟"
- مختصرة: "عدهم" أو "وريني الموكلين"
- ناقصة: "الموكلين؟"
- مختلطة: "ضيف client جديد"
كلها تعني نفس الشيء - أنت تفهم النية وليس الكلمات.

## 2. التخطيط (Planning)
قبل أي إجابة، اسأل نفسك:
- هل أستطيع الإجابة من معرفتي القانونية وحدها؟ → أجب مباشرة
- هل أحتاج بيانات من النظام؟ → استخدم الأدوات
- هل أحتاج أكثر من أداة؟ → خطط الترتيب
- هل البيانات كاملة؟ → إن لم تكن، اسأل المستخدم

## 3. اختيار الأدوات (Tool Selection)
- اختر الأداة بناءً على الوصف وليس الاسم
- إذا كان الطلب يحتاج بحثاً أولاً، ابحث ثم نفّذ
- مثال: "أنشئ قضية للموكل حسين" → ابحث عن حسين أولاً، ثم أنشئ القضية

## 4. سلسلة الأدوات (Tool Chaining)
يمكنك استخدام عدة أدوات في نفس الطلب:
مثال: "أنشئ قضية للموكل حسين وحدد جلسة الأسبوع القادم وأضف مهمة"
→ search_clients("حسين") → create_case → add_session → create_task

## 5. العمليات الخطيرة (Dangerous Operations)
عمليات الحذف والتعديل المالي تحتاج تأكيد:
- إذا طلب المستخدم حذف شيء، قل: "هل تريد تأكيد حذف [الاسم]؟"
- لا تنفذ الحذف حتى يؤكد المستخدم بكلمة "نعم" أو "أكّد"
- عمليات المالية (دفعات، مصروفات) لا تحتاج تأكيد ولكن اعرض التفاصيل

## 6. الذاكرة (Context Memory)
- تتذكر سياق المحادثة الحالية
- إذا قال "القضية الخاصة بحسين" ثم قال "أضف جلسة لها"
- تفهم أن "ها" تعود على قضية حسين
- لا تطلب إعادة الشرح

## 7. عدم التخمين
- لا تخمن أبداً - إذا لم تعرف، استخدم الأداة
- إذا لم تجد بيانات، قل ذلك بصراحة
- إذا كانت البيانات ناقصة، اسأل المستخدم

## 8. الرد بلغة طبيعية
- أجب كأنك تتحدث مع شخص، ليس كآلة
- استخدم العربية الفصحى المبسطة أو اللهجة المصرية حسب سياق الحديث
- كن موجزاً ولكن وافياً
- استخدم التنسيق (قوائم، جداول) عند الحاجة

## 9. التحليل الذكي
- "لخص القضية" → اجلب كل البيانات واصنع ملخصاً
- "ما نقاط ضعف موقفنا؟" → حلل المستندات والوقائع
- "القضايا المتأخرة" → حلل التواريخ والمدد
- لا تكتفي بالعرض - حلل وقدم رؤى

## 10. شخصيتك
- محامٍ محترف واثق
- تعرف القانون المصري والعربي
- تعطي نصائح قانونية عند الطلب
- تصيغ العقود والمذكرات
- تحلل القضايا وتقترح استراتيجيات
- صبور ومفهّم
- صادق - إذا لم تعرف، تقول ذلك

تذكر: أنت موظف حقيقي في مكتب محاماة. تصرف كذلك.`;

// ============================================================
// أنواع البيانات
// ============================================================

export interface AgentMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

export interface AgentAction {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
  step: number;
}

export interface AgentResponse {
  content: string;
  actions: AgentAction[];
  needsConfirmation?: boolean;
  pendingAction?: string;
}

// ============================================================
// ذاكرة المحادثة - تخزن سياق كل جلسة
// ============================================================

interface ConversationContext {
  messages: AgentMessage[];
  lastReferencedCaseId?: string;
  lastReferencedClientId?: string;
  pendingConfirmation?: {
    action: string;
    tool: string;
    args: Record<string, unknown>;
    description: string;
  };
  createdAt: number;
  lastActivity: number;
}

class ConversationMemory {
  private conversations = new Map<string, ConversationContext>();
  private maxAge = 30 * 60 * 1000; // 30 دقيقة

  get(sessionId: string): ConversationContext {
    let ctx = this.conversations.get(sessionId);
    if (!ctx) {
      ctx = {
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      this.conversations.set(sessionId, ctx);
    }
    ctx.lastActivity = Date.now();
    return ctx;
  }

  addMessage(sessionId: string, message: AgentMessage) {
    const ctx = this.get(sessionId);
    ctx.messages.push(message);
    // احتفظ بآخر 20 رسالة لتجنب تجاوز الحجم
    if (ctx.messages.length > 20) {
      ctx.messages = ctx.messages.slice(-20);
    }
  }

  setPendingConfirmation(sessionId: string, confirmation: ConversationContext["pendingConfirmation"]) {
    const ctx = this.get(sessionId);
    ctx.pendingConfirmation = confirmation;
  }

  clearPendingConfirmation(sessionId: string) {
    const ctx = this.get(sessionId);
    ctx.pendingConfirmation = undefined;
  }

  getPendingConfirmation(sessionId: string) {
    const ctx = this.get(sessionId);
    return ctx.pendingConfirmation;
  }

  setLastCase(sessionId: string, caseId: string) {
    this.get(sessionId).lastReferencedCaseId = caseId;
  }

  setLastClient(sessionId: string, clientId: string) {
    this.get(sessionId).lastReferencedClientId = clientId;
  }

  getLastCase(sessionId: string) {
    return this.get(sessionId).lastReferencedCaseId;
  }

  getLastClient(sessionId: string) {
    return this.get(sessionId).lastReferencedClientId;
  }

  getHistory(sessionId: string): AgentMessage[] {
    return this.get(sessionId).messages;
  }

  clear(sessionId: string) {
    this.conversations.delete(sessionId);
  }

  // تنظيف المحادثات القديمة
  cleanup() {
    const now = Date.now();
    for (const [id, ctx] of this.conversations) {
      if (now - ctx.lastActivity > this.maxAge) {
        this.conversations.delete(id);
      }
    }
  }
}

const memory = new ConversationMemory();

// تنظيف كل 5 دقائق
if (typeof setInterval !== "undefined") {
  setInterval(() => memory.cleanup(), 5 * 60 * 1000);
}

// ============================================================
// الأدوات الخطيرة التي تحتاج تأكيد
// ============================================================

const DANGEROUS_TOOLS = new Set([
  "delete_client",
  "delete_case",
  "delete_task",
  "delete_appointment",
]);

// ============================================================
// تشغيل الـ Agent
// ============================================================

export async function runAgent(
  userMessage: string,
  conversationHistory: AgentMessage[] = [],
  context?: string,
  sessionId: string = "default"
): Promise<AgentResponse> {
  const config = await getProviderConfig();

  if (!config.apiKey) {
    return {
      content: "⚠️ لم يتم تكوين مفتاح الذكاء الاصطناعي. يرجى إضافته من الإعدادات ← الذكاء AI.",
      actions: [],
    };
  }

  // التحقق من وجود تأكيد معلّق
  const pending = memory.getPendingConfirmation(sessionId);
  if (pending) {
    const confirmWords = ["نعم", "أكّد", "اكد", "نعم أكّد", "confirm", "yes", "أيوة", "اه", "نعمم"];
    const cancelWords = ["لا", "إلغاء", "الغاء", "cancel", "no", "stop", "إلغاء"];

    const lowerMsg = userMessage.toLowerCase().trim();

    if (confirmWords.some((w) => lowerMsg.includes(w.toLowerCase()))) {
      // المستخدم أكّد - نفّذ العملية
      memory.clearPendingConfirmation(sessionId);
      const result = await executeTool(pending.tool, pending.args);
      return {
        content: result.success
          ? `✅ تم تنفيذ: ${pending.description}\n\n${result.message ?? ""}`
          : `❌ فشل: ${result.error ?? "خطأ غير معروف"}`,
        actions: [{ tool: pending.tool, args: pending.args, result, step: 1 }],
      };
    } else if (cancelWords.some((w) => lowerMsg.includes(w.toLowerCase()))) {
      memory.clearPendingConfirmation(sessionId);
      return {
        content: "✅ تم إلغاء العملية.",
        actions: [],
      };
    } else {
      // المستخدم لم يؤكد ولم يلغِ - اعتبرها رسالة جديدة
      memory.clearPendingConfirmation(sessionId);
    }
  }

  // بناء رسائل النظام
  const systemContent = context
    ? `${AGENT_SYSTEM_PROMPT}\n\n# السياق الحالي:\n${context}`
    : AGENT_SYSTEM_PROMPT;

  // إضافة معلومات الذاكرة
  const lastCase = memory.getLastCase(sessionId);
  const lastClient = memory.getLastClient(sessionId);
  let memoryHint = "";
  if (lastCase || lastClient) {
    memoryHint = "\n\n# مرجعية سابقة في المحادثة:";
    if (lastCase) memoryHint += `\n- آخر قضية مذكورة: ${lastCase}`;
    if (lastClient) memoryHint += `\n- آخر موكل مذكور: ${lastClient}`;
    memoryHint += "\nإذا قال المستخدم 'لها' أو 'له' أو 'لهم'، قد يشير إلى هذه المرجعيات.";
  }

  // بناء الرسائل
  const history = memory.getHistory(sessionId);
  const messages: AgentMessage[] = [
    { role: "assistant", content: systemContent + memoryHint },
    ...history.slice(-10), // آخر 10 رسائل للسياق
    { role: "user", content: userMessage },
  ];

  // حفظ رسالة المستخدم
  memory.addMessage(sessionId, { role: "user", content: userMessage });

  const actions: AgentAction[] = [];
  let maxIterations = 10; // حد أقصى 10 جولات من استدعاء الأدوات
  let step = 0;

  while (maxIterations > 0) {
    maxIterations--;
    step++;

    try {
      const response = await callAgentModel(messages, true);

      // إذا لم يكن هناك tool_calls، نحن انتهينا
      if (!response.tool_calls || response.tool_calls.length === 0) {
        const finalContent = response.content ?? "لم أتمكن من توليد رد.";

        // حفظ رد المساعد
        memory.addMessage(sessionId, { role: "assistant", content: finalContent });

        return {
          content: finalContent,
          actions,
        };
      }

      // أضف رد المساعد مع tool_calls
      messages.push({
        role: "assistant",
        content: response.content ?? "",
        tool_calls: response.tool_calls,
      });

      // نفّذ كل أداة
      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: Record<string, unknown> = {};

        try {
          toolArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          toolArgs = {};
        }

        // التحقق من الأدوات الخطيرة
        if (DANGEROUS_TOOLS.has(toolName)) {
          // ابحث عن اسم/وصف العنصر المراد حذفه
          let itemDescription = "هذا العنصر";
          if (toolName === "delete_client" && toolArgs.clientId) {
            try {
              const searchResult = await executeTool("get_client_details", { clientId: toolArgs.clientId });
              if (searchResult.success && searchResult.data) {
                const client = searchResult.data as { fullName?: string };
                itemDescription = `الموكل "${client.fullName ?? ""}"`;
              }
            } catch {
              // ignore
            }
          } else if (toolName === "delete_case" && toolArgs.caseId) {
            try {
              const searchResult = await executeTool("get_case_details", { caseId: toolArgs.caseId });
              if (searchResult.success && searchResult.data) {
                const caseData = searchResult.data as { internalNumber?: string };
                itemDescription = `القضية "${caseData.internalNumber ?? ""}"`;
              }
            } catch {
              // ignore
            }
          }

          // احفظ التأكيد المعلّق
          memory.setPendingConfirmation(sessionId, {
            action: "delete",
            tool: toolName,
            args: toolArgs,
            description: `حذف ${itemDescription}`,
          });

          // أضف نتيجة وهمية للأداة
          const cancelResult: ToolResult = {
            success: false,
            error: "بانتظار تأكيد المستخدم",
          };
          messages.push({
            role: "tool",
            content: JSON.stringify(cancelResult),
            tool_call_id: toolCall.id,
            name: toolName,
          });
          actions.push({ tool: toolName, args: toolArgs, result: cancelResult, step });

          // اطلب من النموذج توليد رسالة طلب التأكيد
          const confirmResponse = await callAgentModel(
            [
              ...messages,
              {
                role: "user",
                content: `SYSTEM: الأداة ${toolName} تحتاج تأكيد. اطلب من المستخدم تأكيد حذف ${itemDescription}.`,
              },
            ],
            false
          );

          const confirmContent = confirmResponse.content ?? `⚠️ هل تريد تأكيد ${itemDescription}؟ أرسل "نعم" للتأكيد أو "لا" للإلغاء.`;
          memory.addMessage(sessionId, { role: "assistant", content: confirmContent });

          return {
            content: confirmContent,
            actions,
            needsConfirmation: true,
            pendingAction: `حذف ${itemDescription}`,
          };
        }

        // تنفيذ الأداة العادية
        const result = await executeTool(toolName, toolArgs);
        actions.push({ tool: toolName, args: toolArgs, result, step });

        // حفظ المرجعيات
        if (toolName === "get_case_details" || toolName === "create_case" || toolName === "update_case") {
          if (result.success && result.data) {
            const data = result.data as { id?: string };
            if (data.id) memory.setLastCase(sessionId, data.id);
          }
        }
        if (toolName === "get_client_details" || toolName === "create_client" || toolName === "update_client") {
          if (result.success && result.data) {
            const data = result.data as { id?: string };
            if (data.id) memory.setLastClient(sessionId, data.id);
          }
        }
        if (toolName === "search_cases" && result.success && result.data) {
          const data = result.data as Array<{ id?: string }>;
          if (Array.isArray(data) && data.length === 1 && data[0].id) {
            memory.setLastCase(sessionId, data[0].id);
          }
        }
        if (toolName === "search_clients" && result.success && result.data) {
          const data = result.data as Array<{ id?: string }>;
          if (Array.isArray(data) && data.length === 1 && data[0].id) {
            memory.setLastClient(sessionId, data[0].id);
          }
        }

        // أضف نتيجة الأداة للرسائل
        messages.push({
          role: "tool",
          content: JSON.stringify({
            success: result.success,
            data: result.data,
            message: result.message,
            error: result.error,
          }),
          tool_call_id: toolCall.id,
          name: toolName,
        });
      }

      // استمر في الحلقة للحصول على الرد النهائي أو المزيد من الأدوات
    } catch (error) {
      console.error("Agent loop error:", error);
      const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
      return {
        content: `حدث خطأ أثناء المعالجة: ${errorMsg}`,
        actions,
      };
    }
  }

  // إذا وصلنا للحد الأقصى، اطلب رداً نهائياً
  const finalResponse = await callAgentModel(messages, false);
  const finalContent = finalResponse.content ?? "انتهت جولات المعالجة.";
  memory.addMessage(sessionId, { role: "assistant", content: finalContent });

  return {
    content: finalContent,
    actions,
  };
}

/**
 * استدعاء النموذج مع/بدون أدوات
 */
async function callAgentModel(
  messages: AgentMessage[],
  withTools: boolean
): Promise<{
  content: string | null;
  tool_calls?: AgentMessage["tool_calls"];
}> {
  const config = await getProviderConfig();

  if (!config.apiKey) {
    throw new Error("لم يتم تكوين مفتاح API للذكاء الاصطناعي");
  }

  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body: Record<string, unknown> = {
    model: config.model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.name ? { name: m.name } : {}),
    })),
    temperature: 0.7,
  };

  if (withTools) {
    body.tools = TOOL_DEFINITIONS;
    body.tool_choice = "auto";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorMessage = `فشل الطلب (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage += `: ${errorText.slice(0, 200)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    return {
      content: message?.content ?? null,
      tool_calls: message?.tool_calls?.map((tc: { id: string; type: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        type: tc.type as "function",
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("انتهت مهلة الطلب");
    }
    throw error;
  }
}

/**
 * مسح محادثة
 */
export function clearConversation(sessionId: string = "default") {
  memory.clear(sessionId);
}

/**
 * نسخة مبسطة لإرسال رسالة سريعة (لتليجرام)
 */
export async function quickAgentResponse(
  userMessage: string,
  context?: string,
  sessionId: string = "telegram"
): Promise<string> {
  const result = await runAgent(userMessage, [], context, sessionId);
  return result.content;
}
