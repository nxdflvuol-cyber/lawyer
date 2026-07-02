// ============================================================
// Legal Brain - العقل القانوني
// 12 مرحلة: Intent → Context → Memory → Knowledge → Case → Workflow
//           → Document → Relationship → Decision → Planner → Executor → Response
// ============================================================

import { callAiModel, getProviderConfig, type ChatMessage } from "@/lib/ai-client";
import { db } from "@/lib/db";
import type {
  BrainContext,
  BrainInput,
  BrainResponse,
  CaseAnalysisResult,
  ContextResult,
  DecisionSupportResult,
  DocumentAnalysisResult,
  ExecutionResult,
  IntentResult,
  KnowledgeResult,
  MemoryResult,
  Plan,
  PlanStep,
  PipelineStageTrace,
  RelationshipResult,
  WorkflowAnalysisResult,
} from "./types";
import { retrieveMemory, saveToMemory, extractMemoryFromMessage } from "./memory";
import { AGENTS, getAgentById } from "./registry";
import { invokeAgent } from "./agents/base-agent";

// ============================================================
// المرحلة 1: كشف النية (Intent Detection)
// ============================================================
async function detectIntent(
  input: BrainInput,
  ctx: BrainContext
): Promise<IntentResult> {
  const start = Date.now();
  try {
    const config = await getProviderConfig();
    if (!config) {
      return fallbackIntent(input.message);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `أنت محلل نية قانوني. حلل رسالة المستخدم وأعد JSON بصيغة:
{"type":"query|create|update|delete|analyze|draft|search|decide|plan|explain|summarize|compare|general","category":"cases|clients|documents|contracts|tasks|finance|legal_kb|general","confidence":0-1,"entities_mentioned":[],"keywords":[]}
أجب بـ JSON فقط بدون شرح.`,
      },
      { role: "user", content: input.message },
    ];

    const response = await callAiModel({
      ...config,
      messages,
      temperature: 0,
      max_tokens: 200,
    });

    const parsed = safeParseJSON(response.content);
    if (parsed) {
      ctx.trace.push({
        stage: "Intent Detection",
        status: "completed",
        duration_ms: Date.now() - start,
        summary: `نية: ${parsed.type} | فئة: ${parsed.category}`,
        data: parsed,
      });
      return {
        type: parsed.type ?? "general",
        category: parsed.category ?? "general",
        confidence: parsed.confidence ?? 0.5,
        entities_mentioned: parsed.entities_mentioned ?? [],
        keywords: parsed.keywords ?? [],
        language: "ar",
      };
    }
    return fallbackIntent(input.message);
  } catch {
    return fallbackIntent(input.message);
  }

  function fallbackIntent(msg: string): IntentResult {
    const keywords = msg.split(/\s+/).filter((w) => w.length > 3).slice(0, 8);
    let type: IntentResult["type"] = "general";
    let category = "general";

    if (/اضف|أنشئ|رفع|جديد|تسجيل/i.test(msg)) {
      type = "create";
    } else if (/عدّل|تعديل|تحديث|غيّر/i.test(msg)) {
      type = "update";
    } else if (/احذف|حذف|إزالة/i.test(msg)) {
      type = "delete";
    } else if (/حلل|تحليل|قيّم|تقييم/i.test(msg)) {
      type = "analyze";
    } else if (/اكتب|صياغة|مذكرة|صحيفة|عقد/i.test(msg)) {
      type = "draft";
    } else if (/بحث|ابحث|دور|found/i.test(msg)) {
      type = "search";
    } else if (/قرار|نصح|نصيحة|أفضل/i.test(msg)) {
      type = "decide";
    } else if (/خطط|خطة|جدول/i.test(msg)) {
      type = "plan";
    } else if (/اشرح|شرح|يعني ايه|ما/i.test(msg)) {
      type = "explain";
    } else if (/لخّص|ملخص|خلاصة/i.test(msg)) {
      type = "summarize";
    } else if (/قضية|دعوى|محكمة|جلسة/i.test(msg)) {
      category = "cases";
      type = "query";
    } else if (/موكل|عميل/i.test(msg)) {
      category = "clients";
      type = "query";
    } else if (/مستند|ملف|وثيقة/i.test(msg)) {
      category = "documents";
      type = "query";
    } else if (/عقد|اتفاقية/i.test(msg)) {
      category = "contracts";
      type = "query";
    } else if (/قانون|مادة|تشريع|حكم/i.test(msg)) {
      category = "legal_kb";
      type = "query";
    }

    const result: IntentResult = {
      type,
      category,
      confidence: 0.6,
      entities_mentioned: [],
      keywords,
      language: "ar",
    };
    ctx.trace.push({
      stage: "Intent Detection",
      status: "completed",
      duration_ms: Date.now() - start,
      summary: `نية: ${type} | فئة: ${category} (fallback)`,
      data: result,
    });
    return result;
  }
}

// ============================================================
// المرحلة 2: كشف السياق (Context Detection)
// ============================================================
async function detectContext(
  input: BrainInput,
  ctx: BrainContext
): Promise<ContextResult> {
  const start = Date.now();

  // السياق الصريح له الأولوية
  if (input.explicit_context?.caseId || input.explicit_context?.clientId) {
    const result: ContextResult = {
      caseId: input.explicit_context?.caseId,
      clientId: input.explicit_context?.clientId,
      documentId: input.explicit_context?.documentId,
      detected_from: "explicit",
      confidence: 1.0,
    };
    ctx.trace.push({
      stage: "Context Detection",
      status: "completed",
      duration_ms: Date.now() - start,
      summary: "سياق صريح من المستخدم",
      data: result,
    });
    return result;
  }

  // البحث في الذاكرة
  if (ctx.memory?.recent_entities?.last_case) {
    const result: ContextResult = {
      caseId: ctx.memory.recent_entities.last_case.id,
      detected_from: "memory",
      confidence: 0.7,
    };
    ctx.trace.push({
      stage: "Context Detection",
      status: "completed",
      duration_ms: Date.now() - start,
      summary: "سياق من الذاكرة",
      data: result,
    });
    return result;
  }

  // استنتاج من النص
  const msg = input.message;
  let result: ContextResult = { detected_from: "inferred", confidence: 0.3 };

  // البحث عن معرفات في النص
  const cuidMatch = msg.match(/cl[a-z0-9]{20,}/);
  if (cuidMatch) {
    // نتحقق إن كان قضية أو موكل
    try {
      const caseFound = await db.case.findUnique({ where: { id: cuidMatch[0] } });
      if (caseFound) {
        result = { caseId: caseFound.id, detected_from: "inferred", confidence: 0.85 };
      } else {
        const clientFound = await db.client.findUnique({
          where: { id: cuidMatch[0] },
        });
        if (clientFound) {
          result = {
            clientId: clientFound.id,
            detected_from: "inferred",
            confidence: 0.85,
          };
        }
      }
    } catch {}
  }

  ctx.trace.push({
    stage: "Context Detection",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: result.caseId || result.clientId ? "سياق مستنتج" : "لا سياق محدد",
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 3: الذاكرة (Memory)
// ============================================================
async function retrieveMemoryStage(
  input: BrainInput,
  ctx: BrainContext
): Promise<MemoryResult> {
  const start = Date.now();
  const memory = await retrieveMemory(input);

  // استخراج ذاكرة جديدة من الرسالة الحالية
  const newItems = extractMemoryFromMessage(input.message);
  if (newItems.length) {
    memory.session_items.push(...newItems);
  }

  ctx.trace.push({
    stage: "Memory Retrieval",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${memory.session_items.length} عنصر في الذاكرة`,
    data: memory,
  });
  return memory;
}

// ============================================================
// المرحلة 4: قاعدة المعرفة (Knowledge Base)
// ============================================================
async function retrieveKnowledge(
  input: BrainInput,
  ctx: BrainContext
): Promise<KnowledgeResult> {
  const start = Date.now();
  const result: KnowledgeResult = { articles: [], precedents: [], statutes: [] };

  try {
    // البحث في قاعدة المعرفة (LegalLibrary)
    const searchTerms = ctx.intent?.keywords ?? [];
    if (searchTerms.length === 0 && input.message.length > 3) {
      searchTerms.push(input.message.slice(0, 50));
    }

    for (const term of searchTerms.slice(0, 3)) {
      try {
        const libs = await db.legalLibrary.findMany({
          where: {
            OR: [
              { title: { contains: term } },
              { description: { contains: term } },
            ],
          },
          take: 5,
        });
        for (const lib of libs) {
          result.articles.push({
            id: lib.id,
            title: lib.title,
            content: lib.description ?? "",
            source: lib.category ?? "قاعدة المعرفة",
            relevance: 0.7,
          });
        }
      } catch {}
    }
  } catch {}

  ctx.trace.push({
    stage: "Knowledge Retrieval",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${result.articles.length} مقال، ${result.precedents.length} سابقة`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 5: محلل القضايا (Case Analyzer)
// ============================================================
async function analyzeCases(
  input: BrainInput,
  ctx: BrainContext
): Promise<CaseAnalysisResult> {
  const start = Date.now();
  const result: CaseAnalysisResult = {
    relevant_cases: [],
    patterns: [],
    recommendations: [],
  };

  try {
    // إذا كان هناك قضية في السياق
    if (ctx.context?.caseId) {
      const caseData = await db.case.findUnique({
        where: { id: ctx.context.caseId },
        include: {
          client: true,
          sessions: { take: 5, orderBy: { sessionDate: "desc" } },
          procedures: { take: 5, orderBy: { date: "desc" } },
        },
      });
      if (caseData) {
        result.relevant_cases.push({
          id: caseData.id,
          title: caseData.internalNumber ?? caseData.subject ?? "قضية",
          status: caseData.status,
          relevance: 1.0,
          key_facts: [
            caseData.caseType ?? "",
            caseData.subject ?? "",
            caseData.court ?? "",
          ].filter(Boolean),
          risks: caseData.status === "pending" ? ["القضية معلقة"] : [],
        });
      }
    }

    // البحث عن قضايا مشابهة بالكلمات المفتاحية
    const keywords = ctx.intent?.keywords ?? [];
    for (const kw of keywords.slice(0, 2)) {
      try {
        const similar = await db.case.findMany({
          where: {
            OR: [
              { subject: { contains: kw } },
              { internalNumber: { contains: kw } },
            ],
          },
          take: 3,
        });
        for (const c of similar) {
          if (!result.relevant_cases.find((r) => r.id === c.id)) {
            result.relevant_cases.push({
              id: c.id,
              title: c.internalNumber ?? c.subject ?? "قضية",
              status: c.status,
              relevance: 0.5,
              key_facts: [c.caseType ?? "", c.subject ?? ""].filter(Boolean),
              risks: [],
            });
          }
        }
      } catch {}
    }
  } catch {}

  ctx.trace.push({
    stage: "Case Analyzer",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${result.relevant_cases.length} قضية ذات صلة`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 6: محلل سير العمل (Workflow Analyzer)
// ============================================================
async function analyzeWorkflow(
  input: BrainInput,
  ctx: BrainContext
): Promise<WorkflowAnalysisResult> {
  const start = Date.now();
  const result: WorkflowAnalysisResult = {
    pending_tasks: [],
    upcoming_deadlines: [],
    bottlenecks: [],
    suggestions: [],
  };

  try {
    const caseFilter = ctx.context?.caseId
      ? { caseId: ctx.context.caseId }
      : {};

    const tasks = await db.task.findMany({
      where: { ...caseFilter, status: { in: ["todo", "in_progress"] } },
      take: 10,
      orderBy: { priority: "desc" },
    });

    result.pending_tasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority ?? "medium",
      due: t.dueDate?.toISOString(),
    }));

    // المواعيد القادمة
    if (ctx.context?.caseId) {
      const sessions = await db.caseSession.findMany({
        where: {
          caseId: ctx.context.caseId,
          sessionDate: { gte: new Date() },
        },
        take: 5,
        orderBy: { sessionDate: "asc" },
      });
      result.upcoming_deadlines = sessions.map((s) => ({
        title: `جلسة ${s.sessionType ?? "محكمة"}`,
        date: s.sessionDate.toISOString(),
        type: "hearing",
      }));
    }

    if (tasks.length > 5) {
      result.bottlenecks.push("عدد مهام معلقة مرتفع");
      result.suggestions.push("رتب المهام حسب الأولوية والمدة");
    }
  } catch {}

  ctx.trace.push({
    stage: "Workflow Analyzer",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${result.pending_tasks.length} مهمة، ${result.upcoming_deadlines.length} موعد`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 7: محلل المستندات (Document Analyzer)
// ============================================================
async function analyzeDocuments(
  input: BrainInput,
  ctx: BrainContext
): Promise<DocumentAnalysisResult> {
  const start = Date.now();
  const result: DocumentAnalysisResult = {
    relevant_docs: [],
    missing_docs: [],
    conflicts: [],
  };

  try {
    if (ctx.context?.caseId) {
      const links = await db.documentLink.findMany({
        where: { caseId: ctx.context.caseId },
        include: { document: true },
        take: 10,
      });
      result.relevant_docs = links.map((l) => ({
        id: l.document.id,
        title: l.document.title,
        category: l.document.category ?? "other",
        relevance: 0.8,
        summary: l.document.aiSummary ?? undefined,
      }));
    } else if (ctx.context?.clientId) {
      const links = await db.documentLink.findMany({
        where: { clientId: ctx.context.clientId },
        include: { document: true },
        take: 10,
      });
      result.relevant_docs = links.map((l) => ({
        id: l.document.id,
        title: l.document.title,
        category: l.document.category ?? "other",
        relevance: 0.8,
        summary: l.document.aiSummary ?? undefined,
      }));
    }

    // اقتراح مستندات ناقصة
    if (ctx.context?.caseId && result.relevant_docs.length === 0) {
      result.missing_docs.push("لا توجد مستندات مربوطة بهذه القضية");
    }
  } catch {}

  ctx.trace.push({
    stage: "Document Analyzer",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${result.relevant_docs.length} مستند، ${result.missing_docs.length} نقص`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 8: محلل العلاقات (Relationship Analyzer)
// ============================================================
async function analyzeRelationships(
  input: BrainInput,
  ctx: BrainContext
): Promise<RelationshipResult> {
  const start = Date.now();
  const result: RelationshipResult = {
    graph: { nodes: [], edges: [] },
    conflicts_of_interest: [],
    connections: [],
  };

  try {
    if (ctx.context?.caseId) {
      const caseData = await db.case.findUnique({
        where: { id: ctx.context.caseId },
        include: {
          client: true,
          opponents: true,
        },
      });
      if (caseData) {
        result.graph.nodes.push({
          id: caseData.id,
          type: "case",
          label: caseData.internalNumber ?? "قضية",
        });
        if (caseData.client) {
          result.graph.nodes.push({
            id: caseData.client.id,
            type: "client",
            label: caseData.client.fullName,
          });
          result.graph.edges.push({
            from: caseData.client.id,
            to: caseData.id,
            relation: "موكل في",
          });
        }
        for (const opp of caseData.opponents ?? []) {
          result.graph.nodes.push({
            id: opp.id,
            type: "opponent",
            label: opp.name,
          });
          result.graph.edges.push({
            from: opp.id,
            to: caseData.id,
            relation: "خصم في",
          });
        }
        result.connections.push(
          `${caseData.client?.fullName ?? "موكل"} ↔ قضية ↔ ${caseData.opponents?.length ?? 0} خصم`
        );
      }
    }
  } catch {}

  ctx.trace.push({
    stage: "Relationship Analyzer",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${result.graph.nodes.length} عقدة، ${result.graph.edges.length} علاقة`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 9: دعم القرار (Decision Support)
// ============================================================
async function decisionSupport(
  input: BrainInput,
  ctx: BrainContext
): Promise<DecisionSupportResult> {
  const start = Date.now();

  // بناء سياق للقرار
  const caseCount = ctx.caseAnalysis?.relevant_cases.length ?? 0;
  const taskCount = ctx.workflowAnalysis?.pending_tasks.length ?? 0;
  const docCount = ctx.documentAnalysis?.relevant_docs.length ?? 0;

  let riskLevel: DecisionSupportResult["risk_assessment"]["level"] = "low";
  const factors: string[] = [];
  if (taskCount > 5) {
    riskLevel = "medium";
    factors.push("عدد مهام مرتفع");
  }
  if (ctx.caseAnalysis?.relevant_cases.some((c) => c.risks.length)) {
    riskLevel = "high";
    factors.push("مخاطر في القضايا");
  }

  const result: DecisionSupportResult = {
    options: [],
    risk_assessment: {
      level: riskLevel,
      factors,
      mitigations: factors.length ? ["راجع المهام العاجلة", "قيّم المخاطر"] : [],
    },
    recommended_action: ctx.intent
      ? `تنفيذ: ${ctx.intent.type} في مجال ${ctx.intent.category}`
      : "تحليل الطلب",
    confidence: 0.7,
  };

  ctx.trace.push({
    stage: "Decision Support",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `مستوى المخاطر: ${riskLevel} | توصية: ${result.recommended_action}`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 10: المخطط (Planner)
// ============================================================
async function planExecution(
  input: BrainInput,
  ctx: BrainContext
): Promise<Plan> {
  const start = Date.now();

  // اختيار الوكلاء المناسبين بناءً على النية والفئة
  const steps: PlanStep[] = [];
  const intent = ctx.intent;
  const category = intent?.category ?? "general";
  const type = intent?.type ?? "general";

  // خريطة: فئة + نية → وكلاء
  const agentMap: Record<string, string[]> = {
    "cases_query": ["case-strategy", "case-timeline"],
    "cases_analyze": ["case-strategy", "case-risk", "case-outcome"],
    "cases_create": ["case-intake"],
    "documents_query": ["doc-summarizer"],
    "documents_analyze": ["doc-classifier", "doc-extractor", "doc-validator"],
    "documents_draft": ["doc-drafter"],
    "clients_query": ["client-profiler"],
    "clients_create": ["client-conflict"],
    "contracts_analyze": ["contract-analyzer", "contract-risk"],
    "contracts_draft": ["contract-clause", "doc-drafter"],
    "legal_kb_search": ["search-legal", "search-precedent"],
    "memo_draft": ["memo-writer", "memo-argument"],
    "general_query": ["search-knowledge"],
  };

  const key = `${category}_${type}`;
  let agentIds = agentMap[key] ?? agentMap[`${category}_query`] ?? ["search-knowledge"];

  // إضافة وكيل البحث دائماً إذا كانت النية search
  if (type === "search" && !agentIds.includes("search-legal")) {
    agentIds = ["search-legal", ...agentIds];
  }

  // إنشاء خطوات الخطة
  for (let i = 0; i < agentIds.length; i++) {
    const agent = getAgentById(agentIds[i]);
    if (!agent) continue;
    steps.push({
      id: `step-${i + 1}`,
      agent_id: agentIds[i],
      description: `${agent.name}: ${agent.when_to_use}`,
      inputs: { message: input.message },
      depends_on: i > 0 ? [`step-${i}`] : undefined,
      priority: i === 0 ? "critical" : i === 1 ? "high" : "medium",
    });
  }

  const needsConfirmation = ["create", "update", "delete"].includes(type);

  const plan: Plan = {
    goal: intent ? `${intent.type} في ${intent.category}` : "معالجة الطلب",
    steps,
    requires_confirmation: needsConfirmation,
    estimated_time: `${steps.length * 2} ثانية`,
  };

  ctx.trace.push({
    stage: "Planner",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `${steps.length} خططة، ${needsConfirmation ? "يحتاج تأكيد" : "تنفيذ مباشر"}`,
    data: plan,
  });
  return plan;
}

// ============================================================
// المرحلة 11: المنفذ (Executor)
// ============================================================
async function executePlan(
  input: BrainInput,
  ctx: BrainContext
): Promise<ExecutionResult> {
  const start = Date.now();
  const plan = ctx.plan!;
  const steps = [];

  for (const step of plan.steps) {
    const stepStart = Date.now();
    // للعمليات الخطيرة نطلب تأكيداً - هنا ننفذ مباشرة (الواجهة تتولى التأكيد)
    const result = await invokeAgent(
      step.agent_id,
      `${step.description}\nطلب المستخدم: ${input.message}`,
      ctx,
      step.inputs
    );
    steps.push({
      step_id: step.id,
      agent_id: step.agent_id,
      status: result.success ? ("success" as const) : ("failed" as const),
      output: result.output,
      error: result.error,
      duration_ms: Date.now() - stepStart,
    });
  }

  const result: ExecutionResult = {
    steps,
    total_duration_ms: Date.now() - start,
    success_count: steps.filter((s) => s.status === "success").length,
    failure_count: steps.filter((s) => s.status === "failed").length,
  };

  ctx.trace.push({
    stage: "Executor",
    status: "completed",
    duration_ms: result.total_duration_ms,
    summary: `${result.success_count} نجح، ${result.failure_count} فشل`,
    data: result,
  });
  return result;
}

// ============================================================
// المرحلة 12: مولد الرد (Response Generator)
// ============================================================
async function generateResponse(
  input: BrainInput,
  ctx: BrainContext
): Promise<BrainResponse> {
  const start = Date.now();

  // تجميع كل البيانات في سياق واحد
  const contextSummary = buildContextSummary(ctx);
  const executionOutputs = ctx.execution?.steps
    .filter((s) => s.status === "success" && s.output)
    .map((s) => {
      const agent = getAgentById(s.agent_id);
      const output =
        typeof s.output === "string"
          ? s.output
          : JSON.stringify(s.output, null, 2)?.slice(0, 1000);
      return `### ${agent?.name ?? s.agent_id}\n${output}`;
    })
    .join("\n\n");

  let answer = "";
  let confidence = ctx.decision?.confidence ?? 0.6;

  try {
    const config = await getProviderConfig();
    if (config) {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `أنت العقل القانوني (Legal Brain) - مساعد قانوني مؤسسي متكامل.
لديك معلومات من 12 مرحلة تحليل. استخدمها للإجابة بدقة.

سياق التحليل:
${contextSummary}

نتائج الوكلاء المتخصصين:
${executionOutputs ?? "لا توجد نتائج من الوكلاء"}

أجب بالعربية بشكل واضح ومنظم. استخدم النقاط والترقيم. لا تخمن - إذا لم تعرف، قل ذلك.
إذا كانت البيانات غير كافية، اطلب التوضيح من المستخدم.`,
        },
        ...((input.history ?? []).slice(-4).map((h) => ({
          role: h.role,
          content: h.content,
        })) as ChatMessage[]),
        { role: "user", content: input.message },
      ];

      const response = await callAiModel({
        ...config,
        messages,
        temperature: 0.4,
        max_tokens: 1200,
      });
      answer = response.content;
      confidence = Math.min(confidence + 0.1, 0.95);
    }
  } catch (error) {
    answer = generateFallbackResponse(ctx);
    confidence = 0.4;
  }

  if (!answer) {
    answer = generateFallbackResponse(ctx);
  }

  // تجميع المصادر
  const sources: BrainResponse["sources"] = [];
  ctx.knowledge?.articles.forEach((a) =>
    sources.push({ type: "knowledge", title: a.title, reference: a.source })
  );
  ctx.caseAnalysis?.relevant_cases.forEach((c) =>
    sources.push({ type: "case", title: c.title })
  );
  ctx.documentAnalysis?.relevant_docs.forEach((d) =>
    sources.push({ type: "document", title: d.title })
  );

  // اقتراحات المتابعة
  const follow_ups = generateFollowUps(ctx);

  ctx.trace.push({
    stage: "Response Generator",
    status: "completed",
    duration_ms: Date.now() - start,
    summary: `رد ${answer.length} حرف، ثقة ${Math.round(confidence * 100)}%`,
  });

  return {
    answer,
    confidence,
    sources: sources.slice(0, 8),
    follow_up_suggestions: follow_ups,
    pipeline_trace: {
      stages: ctx.trace,
      total_duration_ms: ctx.trace.reduce((s, t) => s + t.duration_ms, 0),
      agents_invoked: ctx.execution?.steps.map((s) => s.agent_id) ?? [],
    },
  };
}

// ============================================================
// دوال مساعدة
// ============================================================

function safeParseJSON(text: string): any | null {
  try {
    // استخراج JSON من النص
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildContextSummary(ctx: BrainContext): string {
  const parts: string[] = [];
  if (ctx.intent) parts.push(`النية: ${ctx.intent.type} (${ctx.intent.category})`);
  if (ctx.context?.caseId) parts.push(`القضية: ${ctx.context.caseId}`);
  if (ctx.context?.clientId) parts.push(`الموكل: ${ctx.context.clientId}`);
  if (ctx.memory?.recent_entities?.last_case)
    parts.push(`آخر قضية: ${ctx.memory.recent_entities.last_case.title}`);
  if (ctx.memory?.recent_entities?.last_client)
    parts.push(`آخر موكل: ${ctx.memory.recent_entities.last_client.name}`);
  if (ctx.caseAnalysis?.relevant_cases.length)
    parts.push(`قضايا ذات صلة: ${ctx.caseAnalysis.relevant_cases.length}`);
  if (ctx.documentAnalysis?.relevant_docs.length)
    parts.push(`مستندات ذات صلة: ${ctx.documentAnalysis.relevant_docs.length}`);
  if (ctx.workflowAnalysis?.pending_tasks.length)
    parts.push(`مهام معلقة: ${ctx.workflowAnalysis.pending_tasks.length}`);
  if (ctx.knowledge?.articles.length)
    parts.push(`مقالات معرفة: ${ctx.knowledge.articles.length}`);
  if (ctx.relationships?.graph.nodes.length)
    parts.push(`علاقات: ${ctx.relationships.graph.nodes.length} عقدة`);
  if (ctx.decision) parts.push(`مخاطر: ${ctx.decision.risk_assessment.level}`);
  return parts.join("\n") || "لا سياق إضافي";
}

function generateFallbackResponse(ctx: BrainContext): string {
  const parts: string[] = ["## نتيجة التحليل القانوني\n"];
  if (ctx.caseAnalysis?.relevant_cases.length) {
    parts.push("### القضايا ذات الصلة:");
    ctx.caseAnalysis.relevant_cases.forEach((c) => {
      parts.push(`- **${c.title}** (${c.status}) - ${c.key_facts.join(" | ")}`);
    });
  }
  if (ctx.workflowAnalysis?.pending_tasks.length) {
    parts.push("\n### المهام المعلقة:");
    ctx.workflowAnalysis.pending_tasks.forEach((t) => {
      parts.push(`- ${t.title} [${t.priority}]`);
    });
  }
  if (ctx.documentAnalysis?.relevant_docs.length) {
    parts.push("\n### المستندات:");
    ctx.documentAnalysis.relevant_docs.forEach((d) => {
      parts.push(`- ${d.title} (${d.category})`);
    });
  }
  if (ctx.decision) {
    parts.push(`\n### التوصية: ${ctx.decision.recommended_action}`);
    parts.push(`مستوى المخاطر: ${ctx.decision.risk_assessment.level}`);
  }
  parts.push(
    "\n---\n*هذا رد احتياطي. لتفعيل الذكاء الاصطناعي الكامل، اضبط مزود AI في الإعدادات.*"
  );
  return parts.join("\n");
}

function generateFollowUps(ctx: BrainContext): string[] {
  const suggestions: string[] = [];
  if (ctx.caseAnalysis?.relevant_cases.length) {
    suggestions.push("ما هي استراتيجية الدفاع في هذه القضية؟");
    suggestions.push("ما هي المخاطر المحتملة؟");
  }
  if (ctx.documentAnalysis?.relevant_docs.length) {
    suggestions.push("لخّص المستندات المرفقة");
    suggestions.push("حلّل المستندات لاكتشاف التناقضات");
  }
  if (ctx.knowledge?.articles.length) {
    suggestions.push("ابحث عن سوابق قضائية مشابهة");
  }
  if (suggestions.length === 0) {
    suggestions.push("ما هي القضايا الجارية حالياً؟");
    suggestions.push("ما هي المهام العاجلة؟");
    suggestions.push("ساعدني في صياغة مذكرة قانونية");
  }
  return suggestions.slice(0, 4);
}

// ============================================================
// نقطة الدخول الرئيسية - تشغيل العقل القانوني
// ============================================================
export async function runLegalBrain(input: BrainInput): Promise<BrainResponse> {
  const ctx: BrainContext = {
    input,
    trace: [],
  };

  try {
    // المرحلة 1: كشف النية
    ctx.intent = await detectIntent(input, ctx);

    // المرحلة 3: الذاكرة (قبل السياق لنستفيد منها)
    ctx.memory = await retrieveMemoryStage(input, ctx);

    // المرحلة 2: كشف السياق
    ctx.context = await detectContext(input, ctx);

    // المرحلة 4: قاعدة المعرفة
    ctx.knowledge = await retrieveKnowledge(input, ctx);

    // المرحلة 5: محلل القضايا
    ctx.caseAnalysis = await analyzeCases(input, ctx);

    // المرحلة 6: محلل سير العمل
    ctx.workflowAnalysis = await analyzeWorkflow(input, ctx);

    // المرحلة 7: محلل المستندات
    ctx.documentAnalysis = await analyzeDocuments(input, ctx);

    // المرحلة 8: محلل العلاقات
    ctx.relationships = await analyzeRelationships(input, ctx);

    // المرحلة 9: دعم القرار
    ctx.decision = await decisionSupport(input, ctx);

    // المرحلة 10: التخطيط
    ctx.plan = await planExecution(input, ctx);

    // المرحلة 11: التنفيذ
    ctx.execution = await executePlan(input, ctx);

    // المرحلة 12: توليد الرد
    const response = await generateResponse(input, ctx);

    // حفظ في الذاكرة
    saveToMemory(input.sessionId ?? "default", input, response.answer);

    return response;
  } catch (error) {
    // في حالة الخطأ، نعيد رداً آمناً
    ctx.trace.push({
      stage: "Error Handler",
      status: "error",
      duration_ms: 0,
      summary: error instanceof Error ? error.message : "خطأ غير معروف",
    });

    return {
      answer: `عذراً، حدث خطأ أثناء المعالجة.\n\n${
        error instanceof Error ? error.message : "خطأ غير معروف"
      }\n\nحاول مرة أخرى أو أعد صياغة الطلب.`,
      confidence: 0.2,
      sources: [],
      follow_up_suggestions: ["أعد المحاولة", "بسّط السؤال"],
      pipeline_trace: {
        stages: ctx.trace,
        total_duration_ms: ctx.trace.reduce((s, t) => s + t.duration_ms, 0),
        agents_invoked: [],
      },
    };
  }
}

// ============================================================
// إحصائيات العقل القانوني
// ============================================================
export function getBrainStats() {
  return {
    total_agents: AGENTS.length,
    domains: 9,
    pipeline_stages: 12,
    agents_by_domain: {
      case: 5,
      document: 5,
      search: 4,
      memo: 4,
      client: 3,
      contract: 3,
      compliance: 3,
      analytics: 3,
      workflow: 3,
    },
  };
}
