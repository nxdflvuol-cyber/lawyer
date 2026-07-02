// ============================================================
// Completeness Engine - محرك فحص اكتمال الملفات
// يحدد لكل نوع قضية ما البيانات الأساسية المطلوبة
// ============================================================

import { db } from "@/lib/db";

// ============================================================
// قوالب الاكتمال لكل نوع قضية
// ============================================================

export interface CompletenessCheck {
  id: string;
  label: string;
  category: "client" | "case" | "documents" | "sessions" | "procedures" | "financial";
  required: boolean;
  check: (data: any) => boolean;
  hint?: string;
}

// القوالب حسب نوع القضية
export const COMPLETENESS_TEMPLATES: Record<string, CompletenessCheck[]> = {
  // ===== دعوى مدنية =====
  civil: [
    { id: "client", label: "بيانات الموكل مكتملة", category: "client", required: true, check: (c) => !!c.clientId, hint: "أضف الموكل المرتبط بالقضية" },
    { id: "client_phone", label: "هاتف الموكل", category: "client", required: true, check: (c) => !!c.client?.phone, hint: "أضف رقم هاتف الموكل" },
    { id: "opponent", label: "اسم الخصم", category: "case", required: true, check: (c) => !!c.opponentName, hint: "أضف اسم الخصم" },
    { id: "court", label: "المحكمة", category: "case", required: true, check: (c) => !!c.court, hint: "حدد المحكمة" },
    { id: "circuit", label: "الدائرة", category: "case", required: true, check: (c) => !!c.circuit, hint: "حدد الدائرة" },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50, hint: "اكتب وقائع القضية بالتفصيل" },
    { id: "strategy", label: "الاستراتيجية", category: "case", required: false, check: (c) => !!c.strategy },
    { id: "poa", label: "توكيل ساري", category: "documents", required: true, check: (c) => hasActivePoa(c), hint: "أضف توكيل ساري للموكل" },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card"), hint: "ارفع صورة بطاقة الموكل" },
    { id: "lawsuit_doc", label: "صحيفة الدعوى", category: "documents", required: true, check: (c) => hasDocCategory(c, "pleading"), hint: "ارفع صحيفة الدعوى" },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0, hint: "حدد موعد أول جلسة" },
    { id: "fee", label: "الاتفاق على الأتعاب", category: "financial", required: false, check: (c) => (c.fees?.length ?? 0) > 0 },
  ],

  // ===== دعوى تجارية =====
  commercial: [
    { id: "client", label: "بيانات الشركة الموكلة", category: "client", required: true, check: (c) => !!c.clientId },
    { id: "client_tax", label: "السجل الضريبي", category: "client", required: true, check: (c) => !!c.client?.taxNumber, hint: "أضف السجل الضريبي للشركة" },
    { id: "opponent", label: "الخصم", category: "case", required: true, check: (c) => !!c.opponentName },
    { id: "court", label: "المحكمة التجارية", category: "case", required: true, check: (c) => !!c.court },
    { id: "facts", label: "الوقائع التجارية", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50 },
    { id: "estimated_value", label: "قيمة النزاع", category: "case", required: true, check: (c) => !!c.estimatedValue && c.estimatedValue > 0, hint: "حدد قيمة النزاع المالية" },
    { id: "poa", label: "توكيل شركة", category: "documents", required: true, check: (c) => hasActivePoa(c) },
    { id: "contract", label: "العقد محل النزاع", category: "documents", required: true, check: (c) => hasDocCategory(c, "contract"), hint: "ارفع العقد محل النزاع" },
    { id: "commercial_reg", label: "السجل التجاري", category: "documents", required: true, check: (c) => hasDocCategory(c, "other"), hint: "ارفع السجل التجاري" },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0 },
  ],

  // ===== دعوى جنائية =====
  criminal: [
    { id: "client", label: "الموكل", category: "client", required: true, check: (c) => !!c.clientId },
    { id: "client_id", label: "بطاقة الموكل", category: "client", required: true, check: (c) => !!c.client?.idNumber, hint: "أضف رقم بطاقة الموكل" },
    { id: "opponent", label: "المجني عليه", category: "case", required: false, check: (c) => !!c.opponentName },
    { id: "court", label: "المحكمة الجزئية/الجنايات", category: "case", required: true, check: (c) => !!c.court },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50 },
    { id: "poa", label: "توكيل", category: "documents", required: true, check: (c) => hasActivePoa(c) },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card") },
    { id: "criminal_record", label: "صحيفة الحالة الجنائية", category: "documents", required: false, check: (c) => hasDocCategory(c, "other") },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0 },
  ],

  // ===== دعوى إدارية =====
  administrative: [
    { id: "client", label: "الموكل", category: "client", required: true, check: (c) => !!c.clientId },
    { id: "opponent", label: "الجهة الإدارية", category: "case", required: true, check: (c) => !!c.opponentName, hint: "حدد الجهة الإدارية المدعى عليها" },
    { id: "court", label: "محكمة القضاء الإداري", category: "case", required: true, check: (c) => !!c.court },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50 },
    { id: "challenged_decision", label: "القرار المطعون", category: "documents", required: true, check: (c) => hasDocCategory(c, "other"), hint: "ارفع نسخة القرار الإداري المطعون" },
    { id: "poa", label: "توكيل", category: "documents", required: true, check: (c) => hasActivePoa(c) },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card") },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0 },
  ],

  // ===== أحوال شخصية =====
  personal_status: [
    { id: "client", label: "الموكل", category: "client", required: true, check: (c) => !!c.clientId },
    { id: "opponent", label: "الخصم", category: "case", required: true, check: (c) => !!c.opponentName },
    { id: "court", label: "محكمة الأسرة", category: "case", required: true, check: (c) => !!c.court },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50 },
    { id: "poa", label: "توكيل", category: "documents", required: true, check: (c) => hasActivePoa(c) },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card") },
    { id: "marriage_cert", label: "وثيقة الزواج (إن وجدت)", category: "documents", required: false, check: (c) => hasDocCategory(c, "other") },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0 },
  ],

  // ===== افتراضي (أي نوع قضية) =====
  default: [
    { id: "client", label: "الموكل", category: "client", required: true, check: (c) => !!c.clientId },
    { id: "opponent", label: "الخصم", category: "case", required: true, check: (c) => !!c.opponentName },
    { id: "court", label: "المحكمة", category: "case", required: true, check: (c) => !!c.court },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50 },
    { id: "poa", label: "توكيل ساري", category: "documents", required: true, check: (c) => hasActivePoa(c) },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card") },
    { id: "first_session", label: "أول جلسة", category: "sessions", required: true, check: (c) => (c.sessions?.length ?? 0) > 0 },
  ],
};

// ============================================================
// دوال فحص مساعدة
// ============================================================

function hasActivePoa(c: any): boolean {
  if (!c.client?.powers) return false;
  const now = new Date();
  return c.client.powers.some(
    (p: any) => p.status === "active" && (!p.expiryDate || new Date(p.expiryDate) > now)
  );
}

function hasDocCategory(c: any, category: string): boolean {
  if (!c.documentLinks) return false;
  return c.documentLinks.some((dl: any) => dl.document?.category === category);
}

// ============================================================
// نتيجة فحص الاكتمال
// ============================================================

export interface CompletenessResult {
  percentage: number;
  totalChecks: number;
  passedChecks: number;
  requiredTotal: number;
  requiredPassed: number;
  missing: Array<{
    id: string;
    label: string;
    category: string;
    required: boolean;
    hint?: string;
  }>;
  byCategory: Record<string, { total: number; passed: number; percentage: number }>;
  readyToProceed: boolean; // هل الملف جاهز للتحويل/الرفع؟
  recommendations: string[];
}

// ============================================================
// فحص اكتمال قضية
// ============================================================

export async function checkCaseCompleteness(caseId: string): Promise<CompletenessResult> {
  let caseData: any = null;
  try {
    caseData = await db.case.findUnique({
      where: { id: caseId },
      include: {
        client: { include: { powers: true } },
        sessions: true,
        documentLinks: { include: { document: true } },
        fees: true,
        opponents: true,
      },
    });
  } catch (error) {
    return emptyResult();
  }

  if (!caseData) return emptyResult();

  // اختيار القالب المناسب
  const template = COMPLETENESS_TEMPLATES[caseData.caseType] ?? COMPLETENESS_TEMPLATES.default;

  return evaluateChecks(template, caseData);
}

// فحص اكتمال ملف تجهيز (PreCase)
export async function checkPreCaseCompleteness(preCaseId: string): Promise<CompletenessResult> {
  let preCase: any = null;
  try {
    preCase = await db.preCase.findUnique({
      where: { id: preCaseId },
      include: {
        client: { include: { powers: true } },
        opponents: true,
        documentLinks: { include: { document: true } },
        checklistItems: true,
      },
    });
  } catch {
    return emptyResult();
  }

  if (!preCase) return emptyResult();

  // قالب ملف التجهيز
  const template: CompletenessCheck[] = [
    { id: "client", label: "بيانات الموكل", category: "client", required: true, check: (c) => !!c.clientId, hint: "أضف الموكل" },
    { id: "client_phone", label: "هاتف الموكل", category: "client", required: true, check: (c) => !!c.client?.phone },
    { id: "opponent", label: "الخصم", category: "case", required: true, check: (c) => (c.opponents?.length ?? 0) > 0, hint: "أضف خصماً واحداً على الأقل" },
    { id: "facts", label: "الوقائع", category: "case", required: true, check: (c) => !!c.facts && c.facts.length > 50, hint: "اكتب وقائع القضية" },
    { id: "legal_classification", label: "التكييف القانوني", category: "case", required: false, check: (c) => !!c.legalClassification },
    { id: "requests", label: "الطلبات", category: "case", required: true, check: (c) => !!c.requests, hint: "حدد الطلبات" },
    { id: "poa", label: "توكيل ساري", category: "documents", required: true, check: (c) => hasActivePoa(c), hint: "أضف توكيل" },
    { id: "id_card", label: "بطاقة الموكل", category: "documents", required: true, check: (c) => hasDocCategory(c, "id_card"), hint: "ارفع بطاقة الموكل" },
    { id: "lawsuit_doc", label: "صحيفة الدعوى", category: "documents", required: false, check: (c) => hasDocCategory(c, "pleading") },
    { id: "warnings", label: "تسجيل الإنذارات (إن وجدت)", category: "procedures", required: false, check: (c) => !!c.warnings },
    { id: "settlements", label: "تسجيل التسويات (إن وجدت)", category: "procedures", required: false, check: (c) => !!c.settlements },
    { id: "minutes", label: "تسجيل المحاضر (إن وجدت)", category: "procedures", required: false, check: (c) => !!c.minutes },
  ];

  return evaluateChecks(template, preCase);
}

// ============================================================
// تقييم الفحوصات
// ============================================================

function evaluateChecks(template: CompletenessCheck[], data: any): CompletenessResult {
  const results = template.map((check) => ({
    check,
    passed: safeCheck(check.check, data),
  }));

  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.passed).length;
  const requiredResults = results.filter((r) => r.check.required);
  const requiredTotal = requiredResults.length;
  const requiredPassed = requiredResults.filter((r) => r.passed).length;

  const percentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  // تجميع حسب الفئة
  const byCategory: Record<string, { total: number; passed: number; percentage: number }> = {};
  for (const r of results) {
    const cat = r.check.category;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, passed: 0, percentage: 0 };
    byCategory[cat].total++;
    if (r.passed) byCategory[cat].passed++;
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].percentage =
      byCategory[cat].total > 0
        ? Math.round((byCategory[cat].passed / byCategory[cat].total) * 100)
        : 0;
  }

  // النواقص
  const missing = results
    .filter((r) => !r.passed)
    .map((r) => ({
      id: r.check.id,
      label: r.check.label,
      category: r.check.category,
      required: r.check.required,
      hint: r.check.hint,
    }));

  // جاهز للتحويل؟ (كل المتطلبات مكتملة)
  const readyToProceed = requiredTotal > 0 && requiredPassed === requiredTotal;

  // توصيات
  const recommendations: string[] = [];
  const missingRequired = missing.filter((m) => m.required);
  if (missingRequired.length > 0) {
    recommendations.push(
      `يوجد ${missingRequired.length} عنصر مطلوب ناقص. أكملها قبل المتابعة.`
    );
  }
  const missingOptional = missing.filter((m) => !m.required);
  if (missingOptional.length > 0) {
    recommendations.push(
      `يوجد ${missingOptional.length} عنصر اختياري ناقص. يُنصح بإكماله لتعزيز الملف.`
    );
  }
  if (readyToProceed) {
    recommendations.push("✓ الملف جاهز للتحويل إلى قضية أو المتابعة.");
  }
  if (percentage === 100) {
    recommendations.push("✓ الملف مكتمل 100%. ممتاز!");
  }

  return {
    percentage,
    totalChecks,
    passedChecks,
    requiredTotal,
    requiredPassed,
    missing,
    byCategory,
    readyToProceed,
    recommendations,
  };
}

function safeCheck(fn: (data: any) => boolean, data: any): boolean {
  try {
    return !!fn(data);
  } catch {
    return false;
  }
}

function emptyResult(): CompletenessResult {
  return {
    percentage: 0,
    totalChecks: 0,
    passedChecks: 0,
    requiredTotal: 0,
    requiredPassed: 0,
    missing: [],
    byCategory: {},
    readyToProceed: false,
    recommendations: ["تعذّر تحميل بيانات الملف."],
  };
}
