// ============================================================
// Legal Brain - سجل الوكلاء (Agent Registry)
// 33 وكيل متخصص يعملون تحت Core AI
// ============================================================

import type { AgentDefinition, AgentDomain } from "./types";

// ============================================================
// الوكلاء المتخصصون - 33 وكيل في 9 مجالات
// ============================================================

export const AGENTS: AgentDefinition[] = [
  // ---- مجال القضايا (5 وكلاء) ----
  {
    id: "case-intake",
    name: "وكيل استلام القضايا",
    name_en: "Case Intake Agent",
    domain: "case",
    description: "يستقبل القضايا الجديدة ويستخرج بياناتها الأساسية ويفحص اكتمالها",
    capabilities: ["استخراج بيانات القضية", "فحص الاكتمال", "تصنيف نوع القضية", "ربط بالموكل"],
    tools: ["create_case", "get_client", "search_clients"],
    when_to_use: "عند رفع دعوى جديدة أو استلام قضية جديدة",
  },
  {
    id: "case-strategy",
    name: "وكيل استراتيجية القضية",
    name_en: "Case Strategy Agent",
    domain: "case",
    description: "يحلل القضية ويقترح الاستراتيجية القانونية المثلى",
    capabilities: ["تحليل نقاط القوة والضعف", "اقتراح استراتيجية", "تحديد الأدلة المطلوبة"],
    tools: ["get_case", "search_cases", "search_knowledge"],
    when_to_use: "عند طلب استراتيجية قانونية أو تحليل قضية",
  },
  {
    id: "case-risk",
    name: "وكيل تحليل مخاطر القضية",
    name_en: "Case Risk Agent",
    domain: "case",
    description: "يقيّم المخاطر القانونية والإجرائية في القضية",
    capabilities: ["تقييم المخاطر", "تحديد التهديدات", "اقتراح احتياطات"],
    tools: ["get_case", "search_knowledge"],
    when_to_use: "عند تقييم مخاطر قضية أو اتخاذ قرار قانوني",
  },
  {
    id: "case-timeline",
    name: "وكيل الجدول الزمني",
    name_en: "Case Timeline Agent",
    domain: "case",
    description: "يحلل الجدول الزمني للقضية والجلسات والإجراءات",
    capabilities: ["تحليل الجلسات", "حساب المواعيد", "كشف التأخيرات", "اقتراح الأولويات"],
    tools: ["get_case", "get_sessions", "get_timeline"],
    when_to_use: "عند تحليل مواعيد القضية أو الجلسات القادمة",
  },
  {
    id: "case-outcome",
    name: "وكيل توقع النتائج",
    name_en: "Case Outcome Predictor",
    domain: "case",
    description: "يتوقع النتائج المحتملة للقضية بناءً على السوابق والمعطيات",
    capabilities: ["توقع النتيجة", "تحليل الاحتمالات", "مقارنة بالسوابق"],
    tools: ["get_case", "search_knowledge", "search_cases"],
    when_to_use: "عند طلب توقع نتيجة قضية أو تقييم فرص النجاح",
  },

  // ---- مجال المستندات (5 وكلاء) ----
  {
    id: "doc-classifier",
    name: "وكيل تصنيف المستندات",
    name_en: "Document Classifier",
    domain: "document",
    description: "يصنّف المستندات حسب النوع القانوني والفئة",
    capabilities: ["تصنيف تلقائي", "كشف النوع القانوني", "اقتراح الفئة"],
    tools: ["get_document", "list_documents"],
    when_to_use: "عند رفع مستند جديد أو طلب تصنيف مستندات",
  },
  {
    id: "doc-extractor",
    name: "وكيل استخراج البيانات",
    name_en: "Document Extractor",
    domain: "document",
    description: "يستخرج البيانات المنظمة من المستندات (أسماء، تواريخ، مبالغ)",
    capabilities: ["استخراج البيانات", "OCR", "تحليل البنية", "استخراج الكيانات"],
    tools: ["get_document", "analyze_document"],
    when_to_use: "عند استخراج بيانات من توكيل أو عقد أو صحيفة",
  },
  {
    id: "doc-validator",
    name: "وكيل التحقق من المستندات",
    name_en: "Document Validator",
    domain: "document",
    description: "يتحقق من صحة المستندات واكتمالها قانونياً",
    capabilities: ["فحص الاكتمال", "كشف التناقضات", "التحقق من الصحة"],
    tools: ["get_document", "search_knowledge"],
    when_to_use: "عند التحقق من مستند أو فحص صحته القانونية",
  },
  {
    id: "doc-summarizer",
    name: "وكيل تلخيص المستندات",
    name_en: "Document Summarizer",
    domain: "document",
    description: "يلخّص المستندات الطويلة في نقاط واضحة",
    capabilities: ["تلخيص ذكي", "استخراج النقاط الرئيسية", "تبسيط اللغة"],
    tools: ["get_document"],
    when_to_use: "عند طلب تلخيص مستند أو عقد أو حكم",
  },
  {
    id: "doc-drafter",
    name: "وكيل صياغة المستندات",
    name_en: "Document Drafting Agent",
    domain: "document",
    description: "يصيغ المستندات القانونية (عقود، مذكرات، إنذارات)",
    capabilities: ["صياغة قانونية", "قوالب جاهزة", "مراجعة الصياغة"],
    tools: ["get_template", "create_document"],
    when_to_use: "عند صياغة مستند قانوني جديد",
  },

  // ---- مجال البحث (4 وكلاء) ----
  {
    id: "search-legal",
    name: "وكيل البحث القانوني",
    name_en: "Legal Search Agent",
    domain: "search",
    description: "يبحث في قاعدة المعرفة القانونية والنصوص التشريعية",
    capabilities: ["بحث تشريعي", "بحث في المذكرات", "بحث في الأحكام"],
    tools: ["search_knowledge", "search_web"],
    when_to_use: "عند البحث عن نص قانوني أو حكم أو مبدأ",
  },
  {
    id: "search-precedent",
    name: "وكيل البحث عن السوابق",
    name_en: "Precedent Search Agent",
    domain: "search",
    description: "يبحث عن السوابق القضائية والأحكام المشابهة",
    capabilities: ["بحث في السوابق", "مقارنة الأحكام", "تحليل الاتجاهات"],
    tools: ["search_knowledge", "search_cases"],
    when_to_use: "عند البحث عن سوابق قضائية أو أحكام مشابهة",
  },
  {
    id: "search-knowledge",
    name: "وكيل البحث في المعرفة",
    name_en: "Knowledge Search Agent",
    domain: "search",
    description: "يبحث في قاعدة المعرفة الداخلية للمكتب",
    capabilities: ["بحث داخلي", "استرجاع المعرفة", "ربط المعلومات"],
    tools: ["search_knowledge"],
    when_to_use: "عند البحث في قاعدة معرفة المكتب",
  },
  {
    id: "search-web",
    name: "وكيل البحث على الويب",
    name_en: "Web Search Agent",
    domain: "search",
    description: "يبحث على الإنترنت عن معلومات قانونية محدثة",
    capabilities: ["بحث ويب", "تحديث المعلومات", "مصادر خارجية"],
    tools: ["search_web"],
    when_to_use: "عند الحاجة لمعلومات محدثة من الإنترنت",
  },

  // ---- مجال المذكرات (4 وكلاء) ----
  {
    id: "memo-writer",
    name: "وكيل كتابة المذكرات",
    name_en: "Memo Writer",
    domain: "memo",
    description: "يكتب المذكرات القانونية (مذكرات دفاع، طلبات، ردود)",
    capabilities: ["صياغة المذكرات", "بنية قانونية", "حجج قانونية"],
    tools: ["get_case", "search_knowledge", "create_document"],
    when_to_use: "عند كتابة مذكرة دفاع أو مذكرة قانونية",
  },
  {
    id: "memo-opinion",
    name: "وكيل الفتاوى القانونية",
    name_en: "Legal Opinion Agent",
    domain: "memo",
    description: "يصيغ الفتاوى والاستشارات القانونية المكتوبة",
    capabilities: ["فتاوى قانونية", "استشارات", "تحليل قانوني مكتوب"],
    tools: ["search_knowledge", "search_cases"],
    when_to_use: "عند طلب فتوى قانونية أو استشارة مكتوبة",
  },
  {
    id: "memo-argument",
    name: "وكيل بناء الحجج",
    name_en: "Argument Builder",
    domain: "memo",
    description: "يبني الحجج القانونية ويفنّد حجج الخصم",
    capabilities: ["بناء الحجج", "التفنيد", "المنطق القانوني"],
    tools: ["get_case", "search_knowledge"],
    when_to_use: "عند بناء حجة قانونية أو التفنيد",
  },
  {
    id: "memo-reviewer",
    name: "وكيل مراجعة المذكرات",
    name_en: "Memo Reviewer",
    domain: "memo",
    description: "يراجع المذكرات ويحسّنها ويكشف نقاط الضعف",
    capabilities: ["مراجعة", "تحسين", "كشف الثغرات", "تقوية الحجج"],
    tools: ["get_document", "search_knowledge"],
    when_to_use: "عند مراجعة مذكرة أو تحسين صياغتها",
  },

  // ---- مجال الموكلين (3 وكلاء) ----
  {
    id: "client-profiler",
    name: "وكيل ملف الموكل",
    name_en: "Client Profiler",
    domain: "client",
    description: "يبني ملف شامل للموكل ويحلل سجله",
    capabilities: ["بناء الملف", "تحليل السجل", "تقييم العلاقة"],
    tools: ["get_client", "list_cases", "get_timeline"],
    when_to_use: "عند تحليل ملف موكل أو بناء صورة شاملة",
  },
  {
    id: "client-comm",
    name: "وكيل تواصل الموكل",
    name_en: "Client Communication Agent",
    domain: "client",
    description: "يصيغ رسائل ومراسلات للموكل ويدير التواصل",
    capabilities: ["صياغة رسائل", "إشعارات", "متابعات", "تقارير دورية"],
    tools: ["get_client", "get_case"],
    when_to_use: "عند صياغة رسالة للموكل أو متابعته",
  },
  {
    id: "client-conflict",
    name: "وكيل فحص تضارب المصالح",
    name_en: "Conflict Check Agent",
    domain: "client",
    description: "يفحص تضارب المصالح قبل قبول القضية",
    capabilities: ["فحص التضارب", "تحليل العلاقات", "تنبيهات"],
    tools: ["get_client", "search_clients", "list_cases"],
    when_to_use: "عند قبول موكل جديد أو فحص تضارب مصالح",
  },

  // ---- مجال العقود (3 وكلاء) ----
  {
    id: "contract-analyzer",
    name: "وكيل تحليل العقود",
    name_en: "Contract Analyzer",
    domain: "contract",
    description: "يحلل العقود ويستخرج البنود والالتزامات",
    capabilities: ["تحليل البنود", "استخراج الالتزامات", "كشف المخاطر"],
    tools: ["get_document", "search_knowledge"],
    when_to_use: "عند تحليل عقد أو مراجعة بنوده",
  },
  {
    id: "contract-risk",
    name: "وكيل مخاطر العقود",
    name_en: "Contract Risk Agent",
    domain: "contract",
    description: "يقيّم المخاطر في العقود ويقترح تعديلات",
    capabilities: ["تقييم المخاطر", "اقتراح تعديلات", "حماية الموكل"],
    tools: ["get_document", "search_knowledge"],
    when_to_use: "عند تقييم مخاطر عقد أو اقتراح تعديلات",
  },
  {
    id: "contract-clause",
    name: "وكيل بنود العقود",
    name_en: "Contract Clause Agent",
    domain: "contract",
    description: "يصيغ بنود العقود ويقترح بنوداً حماية",
    capabilities: ["صياغة البنود", "بنود حماية", "بنود جزائية", "شروط فسخ"],
    tools: ["get_template", "search_knowledge"],
    when_to_use: "عند صياغة بند عقد أو اقتراح بند حماية",
  },

  // ---- مجال الامتثال (3 وكلاء) ----
  {
    id: "compliance-deadline",
    name: "وكيل تتبع المواعيد",
    name_en: "Deadline Tracker",
    domain: "compliance",
    description: "يتتبع المواعيد القانونية والمهل وينبه قبل انتهائها",
    capabilities: ["تتبع المواعيد", "تنبيهات", "حساب المهل", "أولويات"],
    tools: ["list_tasks", "get_case", "get_sessions"],
    when_to_use: "عند تتبع المواعيد أو حساب المهل القانونية",
  },
  {
    id: "compliance-checker",
    name: "وكيل فحص الامتثال",
    name_en: "Compliance Checker",
    domain: "compliance",
    description: "يفحص امتثال الإجراءات للقوانين واللوائح",
    capabilities: ["فحص الامتثال", "كشف المخالفات", "اقتراح التصحيح"],
    tools: ["get_case", "search_knowledge"],
    when_to_use: "عند فحص امتثال إجراء للقانون",
  },
  {
    id: "compliance-ethics",
    name: "وكيل الأخلاقيات",
    name_en: "Ethics Agent",
    domain: "compliance",
    description: "يراقب الالتزام بأخلاقيات المهنة القانونية",
    capabilities: ["فحص الأخلاقيات", "تنبيهات", "إرشادات"],
    tools: ["search_knowledge"],
    when_to_use: "عند فحص أخلاقيات إجراء أو قرار",
  },

  // ---- مجال التحليلات (3 وكلاء) ----
  {
    id: "analytics-performance",
    name: "وكيل تحليل الأداء",
    name_en: "Performance Analyst",
    domain: "analytics",
    description: "يحلل أداء المكتب والمحامين والإحصائيات",
    capabilities: ["تحليل الأداء", "إحصائيات", "مؤشرات KPI", "مقارنات"],
    tools: ["list_cases", "list_tasks", "get_statistics"],
    when_to_use: "عند تحليل أداء المكتب أو الإحصائيات",
  },
  {
    id: "analytics-financial",
    name: "وكيل التحليل المالي",
    name_en: "Financial Analyst",
    domain: "analytics",
    description: "يحلل الأتعاب والمصروفات والتدفقات المالية",
    capabilities: ["تحليل مالي", "أتعاب", "مصروفات", "تدفقات", "توقعات"],
    tools: ["list_payments", "list_expenses", "list_invoices"],
    when_to_use: "عند تحليل مالي أو تقرير الأتعاب",
  },
  {
    id: "analytics-trend",
    name: "وكيل تحليل الاتجاهات",
    name_en: "Trend Analyst",
    domain: "analytics",
    description: "يحلل اتجاهات القضايا والنتائج وأنماط العمل",
    capabilities: ["تحليل اتجاهات", "أنماط", "توقعات", "استراتيجية"],
    tools: ["list_cases", "search_knowledge"],
    when_to_use: "عند تحليل اتجاهات أو أنماط في القضايا",
  },

  // ---- مجال سير العمل (3 وكلاء) ----
  {
    id: "workflow-planner",
    name: "وكيل تخطيط المهام",
    name_en: "Task Planner",
    domain: "workflow",
    description: "يخطط المهام ويوزعها ويحدد الأولويات",
    capabilities: ["تخطيط", "توزيع", "أولويات", "جدولة"],
    tools: ["list_tasks", "create_task", "get_case"],
    when_to_use: "عند تخطيط مهام أو توزيع عمل",
  },
  {
    id: "workflow-optimizer",
    name: "وكيل تحسين سير العمل",
    name_en: "Workflow Optimizer",
    domain: "workflow",
    description: "يحلل سير العمل ويقترح تحسينات وكفاءات",
    capabilities: ["تحليل العمل", "كشف الاختناقات", "اقتراح تحسينات"],
    tools: ["list_tasks", "get_statistics"],
    when_to_use: "عند تحسين سير العمل أو كفاءة المكتب",
  },
  {
    id: "workflow-automation",
    name: "وكيل الأتمتة",
    name_en: "Automation Agent",
    domain: "workflow",
    description: "ينشئ قواعد أتمتة ويشغّل سير العمل الآلي",
    capabilities: ["إنشاء قواعد", "تشغيل آلي", "تكامل", "إشعارات"],
    tools: ["list_automation", "create_automation", "trigger_workflow"],
    when_to_use: "عند أتمتة عملية أو إنشاء قاعدة أتمتة",
  },
];

// ============================================================
// دوال مساعدة
// ============================================================

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getAgentsByDomain(domain: AgentDomain): AgentDefinition[] {
  return AGENTS.filter((a) => a.domain === domain);
}

export function getDomains(): AgentDomain[] {
  const domains = new Set<AgentDomain>();
  AGENTS.forEach((a) => domains.add(a.domain));
  return Array.from(domains);
}

export const DOMAIN_LABELS: Record<AgentDomain, string> = {
  case: "القضايا",
  document: "المستندات",
  search: "البحث",
  memo: "المذكرات",
  client: "الموكلين",
  contract: "العقود",
  compliance: "الامتثال",
  analytics: "التحليلات",
  workflow: "سير العمل",
};

export const DOMAIN_ICONS: Record<AgentDomain, string> = {
  case: "Briefcase",
  document: "FileText",
  search: "Search",
  memo: "PenLine",
  client: "Users",
  contract: "FileSignature",
  compliance: "ShieldCheck",
  analytics: "TrendingUp",
  workflow: "Workflow",
};

export const AGENT_COUNT = AGENTS.length; // 33
