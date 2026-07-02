// ============================================================
// Legal Brain - الأنواع المشتركة
// العقل القانوني: 12 مرحلة + 30+ وكيل متخصص
// ============================================================

// ---- النية (Intent) ----
export type IntentType =
  | "query" // استعلام
  | "create" // إنشاء
  | "update" // تعديل
  | "delete" // حذف
  | "analyze" // تحليل
  | "draft" // صياغة
  | "search" // بحث
  | "decide" // قرار
  | "plan" // تخطيط
  | "explain" // شرح
  | "summarize" // تلخيص
  | "compare" // مقارنة
  | "general"; // عام

export interface IntentResult {
  type: IntentType;
  category: string; // cases | clients | documents | contracts | tasks | finance | legal_kb | general
  confidence: number;
  entities_mentioned: string[]; // كيانات ذُكرت في النص
  keywords: string[];
  language: "ar" | "en" | "mixed";
}

// ---- السياق (Context) ----
export interface ContextResult {
  caseId?: string;
  clientId?: string;
  documentId?: string;
  contractId?: string;
  preCaseId?: string;
  taskId?: string;
  workMode?: string;
  detected_from: "explicit" | "memory" | "inferred";
  confidence: number;
}

// ---- الذاكرة (Memory) ----
export interface MemoryItem {
  key: string;
  value: string;
  timestamp: number;
  type: "entity" | "preference" | "fact" | "decision";
}

export interface MemoryResult {
  session_items: MemoryItem[];
  recent_entities: {
    last_case?: { id: string; title: string };
    last_client?: { id: string; name: string };
    last_document?: { id: string; title: string };
  };
  conversation_summary?: string;
}

// ---- قاعدة المعرفة (Knowledge) ----
export interface KnowledgeResult {
  articles: Array<{
    id: string;
    title: string;
    content: string;
    source: string;
    relevance: number;
  }>;
  precedents: Array<{
    title: string;
    reference: string;
    summary: string;
  }>;
  statutes: Array<{
    title: string;
    article: string;
    text: string;
  }>;
}

// ---- تحليل القضايا ----
export interface CaseAnalysisResult {
  relevant_cases: Array<{
    id: string;
    title: string;
    status: string;
    relevance: number;
    key_facts: string[];
    risks: string[];
  }>;
  patterns: string[];
  recommendations: string[];
}

// ---- تحليل سير العمل ----
export interface WorkflowAnalysisResult {
  pending_tasks: Array<{ id: string; title: string; priority: string; due?: string }>;
  upcoming_deadlines: Array<{ title: string; date: string; type: string }>;
  bottlenecks: string[];
  suggestions: string[];
}

// ---- تحليل المستندات ----
export interface DocumentAnalysisResult {
  relevant_docs: Array<{
    id: string;
    title: string;
    category: string;
    relevance: number;
    summary?: string;
  }>;
  missing_docs: string[];
  conflicts: string[];
}

// ---- تحليل العلاقات ----
export interface RelationshipResult {
  graph: {
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ from: string; to: string; relation: string }>;
  };
  conflicts_of_interest: string[];
  connections: string[];
}

// ---- دعم القرار ----
export interface DecisionSupportResult {
  options: Array<{
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    risk_level: "low" | "medium" | "high";
    recommendation_score: number;
  }>;
  risk_assessment: {
    level: "low" | "medium" | "high";
    factors: string[];
    mitigations: string[];
  };
  recommended_action: string;
  confidence: number;
}

// ---- الخطة (Plan) ----
export interface PlanStep {
  id: string;
  agent_id: string;
  description: string;
  inputs: Record<string, unknown>;
  depends_on?: string[];
  priority: "critical" | "high" | "medium" | "low";
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
  requires_confirmation: boolean;
  estimated_time: string;
}

// ---- تنفيذ الخطة ----
export interface ExecutedStep {
  step_id: string;
  agent_id: string;
  status: "success" | "failed" | "skipped";
  output?: unknown;
  error?: string;
  duration_ms: number;
}

export interface ExecutionResult {
  steps: ExecutedStep[];
  total_duration_ms: number;
  success_count: number;
  failure_count: number;
}

// ---- الرد النهائي ----
export interface BrainResponse {
  answer: string;
  confidence: number;
  sources: Array<{ type: string; title: string; reference?: string }>;
  follow_up_suggestions: string[];
  pipeline_trace: PipelineTrace;
}

// ---- تتبع المراحل (Pipeline Trace) ----
export interface PipelineStageTrace {
  stage: string;
  status: "completed" | "skipped" | "error";
  duration_ms: number;
  summary: string;
  data?: unknown;
}

export interface PipelineTrace {
  stages: PipelineStageTrace[];
  total_duration_ms: number;
  agents_invoked: string[];
}

// ---- الوكلاء (Agents) ----
export type AgentDomain =
  | "case"
  | "document"
  | "search"
  | "memo"
  | "client"
  | "contract"
  | "compliance"
  | "analytics"
  | "workflow";

export interface AgentDefinition {
  id: string;
  name: string; // الاسم بالعربية
  name_en: string;
  domain: AgentDomain;
  description: string;
  capabilities: string[];
  tools: string[]; // الأدوات التي يستخدمها
  when_to_use: string;
}

export interface AgentInvokeResult {
  agent_id: string;
  success: boolean;
  output: unknown;
  reasoning?: string;
  duration_ms: number;
}

// ---- المدخلات للعقل القانوني ----
export interface BrainInput {
  message: string;
  userId?: string;
  sessionId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  explicit_context?: {
    caseId?: string;
    clientId?: string;
    documentId?: string;
  };
}

// ---- سياق المرور عبر المراحل ----
export interface BrainContext {
  input: BrainInput;
  intent?: IntentResult;
  context?: ContextResult;
  memory?: MemoryResult;
  knowledge?: KnowledgeResult;
  caseAnalysis?: CaseAnalysisResult;
  workflowAnalysis?: WorkflowAnalysisResult;
  documentAnalysis?: DocumentAnalysisResult;
  relationships?: RelationshipResult;
  decision?: DecisionSupportResult;
  plan?: Plan;
  execution?: ExecutionResult;
  trace: PipelineStageTrace[];
}
