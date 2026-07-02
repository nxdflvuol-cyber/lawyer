// ============================================================
// Legal Brain - Base Agent Executor
// ينفذ الوكلاء المتخصصين باستخدام AI + الأدوات
// ============================================================

import { callAiModel, getProviderConfig, type ChatMessage } from "@/lib/ai-client";
import { executeTool } from "@/lib/ai-tools";
import { getAgentById } from "../registry";
import type { AgentInvokeResult, BrainContext } from "../types";

// استدعاء وكيل متخصص
export async function invokeAgent(
  agentId: string,
  task: string,
  context: BrainContext,
  inputs: Record<string, unknown> = {}
): Promise<AgentInvokeResult> {
  const start = Date.now();
  const agent = getAgentById(agentId);

  if (!agent) {
    return {
      agent_id: agentId,
      success: false,
      output: null,
      error: `Agent not found: ${agentId}`,
      duration_ms: 0,
    };
  }

  try {
    // بناء سياق الوكيل
    const agentContext = buildAgentContext(agentId, context, inputs);

    // استدعاء النموذج
    const config = await getProviderConfig();
    if (!config) {
      // بدون مزود AI - ننفذ الأدوات مباشرة
      return await executeAgentToolsOnly(agentId, task, context, inputs, start);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `أنت ${agent.name} - ${agent.description}.
تختص بـ: ${agent.capabilities.join("، ")}.
استخدم الأدوات المتاحة لك بدقة. أجب بالعربية بشكل واضح ومباشر.
سياق العمل:
${agentContext}`,
      },
      { role: "user", content: task },
    ];

    const response = await callAiModel({
      ...config,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    });

    return {
      agent_id: agentId,
      success: true,
      output: response.content,
      reasoning: `استخدم ${agent.capabilities.length} قدرات`,
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    // في حالة فشل AI، ننفذ الأدوات فقط
    return await executeAgentToolsOnly(agentId, task, context, inputs, start, error);
  }
}

// بناء سياق مخصص لكل وكيل
function buildAgentContext(
  agentId: string,
  context: BrainContext,
  inputs: Record<string, unknown>
): string {
  const parts: string[] = [];

  if (context.context?.caseId) {
    parts.push(`القضية الحالية: ${context.context.caseId}`);
  }
  if (context.context?.clientId) {
    parts.push(`الموكل الحالي: ${context.context.clientId}`);
  }
  if (context.memory?.recent_entities?.last_case) {
    parts.push(`آخر قضية: ${context.memory.recent_entities.last_case.title}`);
  }
  if (context.memory?.recent_entities?.last_client) {
    parts.push(`آخر موكل: ${context.memory.recent_entities.last_client.name}`);
  }
  if (context.intent?.keywords.length) {
    parts.push(`كلمات مفتاحية: ${context.intent.keywords.join("، ")}`);
  }
  if (Object.keys(inputs).length) {
    parts.push(`مدخلات إضافية: ${JSON.stringify(inputs)}`);
  }

  return parts.join("\n") || "لا يوجد سياق محدد";
}

// تنفيذ الأدوات فقط (بدون AI) - احتياطي
async function executeAgentToolsOnly(
  agentId: string,
  task: string,
  context: BrainContext,
  inputs: Record<string, unknown>,
  startTime: number,
  _error?: unknown
): Promise<AgentInvokeResult> {
  const agent = getAgentById(agentId);
  if (!agent) {
    return {
      agent_id: agentId,
      success: false,
      output: null,
      error: "Agent not found",
      duration_ms: Date.now() - startTime,
    };
  }

  // تنفيذ أول أداة مناسبة
  for (const toolName of agent.tools) {
    try {
      const args = mapToolInputs(toolName, context, inputs);
      const result = await executeTool(toolName, args);
      return {
        agent_id: agentId,
        success: result.success,
        output: result.data,
        reasoning: `نفّذ أداة ${toolName} (بدون AI)`,
        duration_ms: Date.now() - startTime,
      };
    } catch {
      continue;
    }
  }

  return {
    agent_id: agentId,
    success: false,
    output: null,
    error: "لا يوجد مزود AI ولا أدوات متاحة",
    duration_ms: Date.now() - startTime,
  };
}

// تحويل المدخلات إلى معاملات الأداة
function mapToolInputs(
  toolName: string,
  context: BrainContext,
  inputs: Record<string, unknown>
): Record<string, unknown> {
  const args: Record<string, unknown> = { ...inputs };

  // حقن السياق تلقائياً
  if (context.context?.caseId && !args.caseId) args.caseId = context.context.caseId;
  if (context.context?.clientId && !args.clientId) args.clientId = context.context.clientId;
  if (context.context?.documentId && !args.documentId)
    args.documentId = context.context.documentId;

  // قيم افتراضية شائعة
  if (!args.search && context.intent?.keywords.length) {
    args.search = context.intent.keywords.join(" ");
  }

  return args;
}
