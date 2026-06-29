// ============================================================
// AI Agent - الوكيل الذكي مع Function Calling
// ============================================================

import { callAiModel, getProviderConfig, type ChatMessage } from "./ai-client";
import { TOOL_DEFINITIONS, executeTool, type ToolResult } from "./ai-tools";

const AGENT_SYSTEM_PROMPT = `أنت "المفكر القانوني الذكي" - وكيل قانوني متطور يعمل كمحامٍ شخصي ومساعد تنفيذي في النظام المصري والقانون العربي.

أنت لست مجرد مساعد محادثة، بل **وكيل ذكي قادر على تنفيذ الأوامر**:
- يمكن البحث في القضايا والموكلين والمستندات
- يمكن إنشاء قضايا جديدة وموكلين جدد
- يمكن تسجيل الجلسات وتأجيلها
- يمكن إضافة المهام والمواعيد
- يمكن استخراج التقارير المالية والإحصائيات

مبادئ عملك:
1. **افهم النية:** حلل ما يريده المستخدم بدقة
2. **اختر الأدوات المناسبة:** استدعِ الأدوات اللازمة لتنفيذ الطلب
3. **اجمع السياق:** استخدم نتائج الأدوات لبناء إجابة شاملة
4. **نفّذ بدقة:** عند إنشاء أو تعديل بيانات، تأكد من صحة المعطيات
5. **أجب بالعربية الفصحى** بأسلوب قانوني رصين

عندما يطلب المستخدم شيئاً:
- إذا كان يحتاج بيانات: استخدم أدوات البحث
- إذا كان يحتاج إجراءً: استخدم أدوات الإنشاء/التعديل
- إذا كان يحتاج استشارة: استخدم معرفتك القانونية مباشرة

مثال: "أنشئ قضية جديدة للموكل أحمد"
→ ابحث عن الموكل أحمد أولاً، ثم أنشئ القضية

مثال: "ما جلسات الغد؟"
→ استدعِ أداة list_appointments بتاريخ الغد

كن دقيقاً وموجزاً. استخدم Markdown للتنظيم.`;

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

export interface AgentResponse {
  content: string;
  actions: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: ToolResult;
  }>;
}

/**
 * تشغيل الوكيل الذكي - يحلل الطلب وينفذ الأدوات ويعيد الرد
 */
export async function runAgent(
  userMessage: string,
  conversationHistory: AgentMessage[] = [],
  context?: string
): Promise<AgentResponse> {
  const config = await getProviderConfig();
  const messages: AgentMessage[] = [
    { role: "assistant", content: context ? `${AGENT_SYSTEM_PROMPT}\n\nالسياق:\n${context}` : AGENT_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const actions: AgentResponse["actions"] = [];
  let maxIterations = 5; // الحد الأقصى لجولات استدعاء الأدوات

  while (maxIterations > 0) {
    maxIterations--;

    try {
      // استدعاء النموذج مع تعريفات الأدوات
      const response = await callAgentModel(messages, true);

      // إذا لم يكن هناك tool_calls، نحن انتهينا
      if (!response.tool_calls || response.tool_calls.length === 0) {
        return {
          content: response.content ?? "لم أتمكن من توليد رد.",
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

        const result = await executeTool(toolName, toolArgs);
        actions.push({ tool: toolName, args: toolArgs, result });

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

      // استمر في الحلقة للحصول على الرد النهائي
    } catch (error) {
      console.error("Agent loop error:", error);
      return {
        content: `حدث خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
        actions,
      };
    }
  }

  // إذا وصلنا للحد الأقصى، اطلب رداً نهائياً
  const finalResponse = await callAgentModel(messages, false);
  return {
    content: finalResponse.content ?? "انتهت جولات التنفيذ.",
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
 * نسخة مبسطة من runAgent لإرسال رسالة سريعة (لتليجرام)
 */
export async function quickAgentResponse(userMessage: string, context?: string): Promise<string> {
  const result = await runAgent(userMessage, [], context);
  return result.content;
}
