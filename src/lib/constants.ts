// ============================================================
// ثوابت النظام - المحامي الشامل
// ============================================================

import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  BarChart3,
  PenLine,
  Calculator,
  Gavel,
  MapPin,
  Brain,
  ScanText,
  TrendingUp,
  GraduationCap,
  Settings,
  DatabaseBackup,
  ShieldCheck,
  RefreshCw,
  UserCog,
  BookOpen,
  LogOut,
  FileCheck,
  type LucideIcon,
} from "lucide-react";
import type { SectionId } from "./stores";

export interface SectionDef {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  group: "main" | "operations" | "ai" | "analytics" | "system";
  description: string;
}

export const SECTIONS: SectionDef[] = [
  {
    id: "dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    group: "main",
    description: "لوحة معلومات شاملة وإحصائيات فورية",
  },
  {
    id: "cases",
    label: "القضايا",
    icon: Briefcase,
    group: "main",
    description: "إدارة شاملة لكافة أنواع القضايا",
  },
  {
    id: "precases",
    label: "إجراءات ما قبل الدعوى",
    icon: FileCheck,
    group: "main",
    description: "ملفات قانونية قيد التجهيز قبل رفع الدعوى",
  },
  {
    id: "clients",
    label: "الموكلين",
    icon: Users,
    group: "main",
    description: "ملف موكل شامل وإدارة التوكيلات",
  },
  {
    id: "documents",
    label: "المستندات",
    icon: FileText,
    group: "main",
    description: "إدارة وأرشفة المستندات المتقدمة",
  },
  {
    id: "legal-brain",
    label: "العقل القانوني",
    icon: Brain,
    group: "ai",
    description: "عقل قانوني بـ 12 مرحلة و33 وكيل متخصص",
  },
  {
    id: "tasks",
    label: "المهام",
    icon: CheckSquare,
    group: "operations",
    description: "نظام مهام متكامل وتتبع الوقت",
  },
  {
    id: "appointments",
    label: "المواعيد",
    icon: Calendar,
    group: "operations",
    description: "تقويم شامل ومحرك حساب المواعيد القانونية",
  },
  {
    id: "finance",
    label: "المالية",
    icon: DollarSign,
    group: "operations",
    description: "إدارة الأتعاب والمصروفات والفواتير",
  },
  {
    id: "reports",
    label: "التقارير",
    icon: BarChart3,
    group: "operations",
    description: "نظام تقارير متكامل قابل للتخصيص",
  },
  {
    id: "memo-editor",
    label: "محرر المذكرات",
    icon: PenLine,
    group: "ai",
    description: "محرر نصوص قانوني متخصص مع AI",
  },
  {
    id: "calculators",
    label: "الحاسبات القانونية",
    icon: Calculator,
    group: "operations",
    description: "حاسبات متخصصة للمواعيد والتعويضات",
  },
  {
    id: "pleading",
    label: "مساعد المرافعة",
    icon: Gavel,
    group: "ai",
    description: "مولد المرافعات الذكي والردود السريعة",
  },
  {
    id: "maps",
    label: "الخرائط المهنية",
    icon: MapPin,
    group: "operations",
    description: "قاعدة بيانات المحاكم والمؤسسات",
  },
  {
    id: "ai-thinker",
    label: "المفكر القانوني الذكي",
    icon: Brain,
    group: "ai",
    description: "عقل قانوني افتراضي متطور بالذكاء الاصطناعي",
  },
  {
    id: "text-analyzer",
    label: "محلل النصوص",
    icon: ScanText,
    group: "ai",
    description: "تحليل العقود والمذكرات وكشف الثغرات",
  },
  {
    id: "performance",
    label: "لوحة تحليل الأداء",
    icon: TrendingUp,
    group: "analytics",
    description: "مؤشرات الأداء والتحليلات المتقدمة",
  },
  {
    id: "development",
    label: "التطوير المهني",
    icon: GraduationCap,
    group: "analytics",
    description: "أدوات التطوير المهني والشخصي",
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: Settings,
    group: "system",
    description: "مركز التحكم الشامل للنظام",
  },
  {
    id: "backup",
    label: "النسخ الاحتياطي",
    icon: DatabaseBackup,
    group: "system",
    description: "أنظمة النسخ الاحتياطي والاستعادة",
  },
  {
    id: "security",
    label: "الأمان والخصوصية",
    icon: ShieldCheck,
    group: "system",
    description: "منظومة الأمان متعددة الطبقات",
  },
  {
    id: "updates",
    label: "التحديثات",
    icon: RefreshCw,
    group: "system",
    description: "إدارة تحديثات النظام والمحتوى القانوني",
  },
  {
    id: "team",
    label: "أعضاء المكتب",
    icon: UserCog,
    group: "system",
    description: "إدارة الفريق والتعاون المحلي",
  },
  {
    id: "research",
    label: "البحث العلمي",
    icon: BookOpen,
    group: "analytics",
    description: "المكتبة القانونية والبحث الأكاديمي",
  },
  {
    id: "logout",
    label: "تسجيل الخروج",
    icon: LogOut,
    group: "system",
    description: "تسجيل خروج آمن من النظام",
  },
];

export const SECTION_GROUPS: Record<string, string> = {
  main: "الرئيسية",
  operations: "العمليات",
  ai: "الذكاء الاصطناعي",
  analytics: "التحليلات",
  system: "النظام",
};

// ============================================================
// ثوابت قانونية
// ============================================================

export const CASE_TYPES = [
  { value: "civil", label: "مدنية", subTypes: ["مدني جزئي", "مدني كلي", "مدني مستعجل", "مدني تجاري", "مدني عمالي", "نزاع تنفيذ", "إشكالات تنفيذ", "تظلمات", "طعون"] },
  { value: "commercial", label: "تجارية", subTypes: ["منازعات تجارية عامة", "إفلاس وتصفية شركات", "منازعات بنكية"] },
  { value: "administrative", label: "إدارية", subTypes: ["قضاء إداري", "قضايا تأديبية", "منازعات إدارية", "عقود إدارية", "قرارات سلبية", "تعويضات إدارية", "إلغاء قرارات"] },
  { value: "criminal", label: "جنائية", subTypes: ["جنح", "جنح مستأنفة", "جنايات", "أحداث", "اقتصادية", "أمن دولة", "تهرب ضريبي", "مخدرات", "عسكرية"] },
  { value: "state_council", label: "مجلس الدولة", subTypes: ["طعون في القرارات الإدارية العليا", "منازعات عقود إدارية أمام مجلس الدولة"] },
  { value: "personal_status", label: "أحوال شخصية", subTypes: ["طلاق", "نفقة", "حضانة", "رؤية", "إثبات نسب", "إثبات زواج", "ميراث", "وصاية", "قيمومة"] },
];

export const CASE_STATUS = [
  { value: "active", label: "جارية", color: "bg-emerald-500" },
  { value: "pending", label: "معلقة", color: "bg-amber-500" },
  { value: "closed", label: "منتهية", color: "bg-slate-500" },
  { value: "won", label: "كسب", color: "bg-green-600" },
  { value: "lost", label: "خسارة", color: "bg-red-500" },
  { value: "settled", label: "تسوية", color: "bg-blue-500" },
];

export const CASE_DEGREE = [
  { value: "primary", label: "ابتدائي" },
  { value: "appeal", label: "استئناف" },
  { value: "cassation", label: "نقض / تمييز" },
];

export const CLIENT_TYPES = [
  { value: "individual", label: "شخص طبيعي" },
  { value: "company", label: "شركة خاصة" },
  { value: "government", label: "حكومية" },
  { value: "nonprofit", label: "غير ربحية" },
  { value: "partnership", label: "شراكة" },
];

export const CLIENT_STATUS = [
  { value: "active", label: "حالي" },
  { value: "former", label: "سابق" },
  { value: "potential", label: "محتمل" },
  { value: "consultation", label: "استشارة" },
];

export const TASK_PRIORITY = [
  { value: "urgent", label: "عاجل", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "high", label: "مرتفع", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "medium", label: "متوسط", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "low", label: "منخفض", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

export const TASK_STATUS = [
  { value: "todo", label: "للتنفيذ", color: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "قيد التنفيذ", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "مكتملة", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "ملغاة", color: "bg-red-100 text-red-700" },
];

export const EVENT_TYPES = [
  { value: "court_session", label: "جلسة محكمة", color: "bg-red-500" },
  { value: "client_meeting", label: "موعد عميل", color: "bg-emerald-500" },
  { value: "deadline", label: "موعد نهائي", color: "bg-orange-500" },
  { value: "task", label: "مهمة", color: "bg-blue-500" },
  { value: "consultation", label: "استشارة", color: "bg-purple-500" },
  { value: "hearing", label: "جلسة تجديد حبس", color: "bg-amber-500" },
  { value: "other", label: "أخرى", color: "bg-slate-500" },
];

export const FEE_TYPES = [
  { value: "fixed", label: "ثابتة" },
  { value: "hourly", label: "بالساعة" },
  { value: "percentage", label: "بالنسبة" },
  { value: "mixed", label: "مختلطة" },
  { value: "staged", label: "على مراحل" },
];

export const EXPENSE_CATEGORIES = [
  { value: "court_fees", label: "رسوم القضايا" },
  { value: "travel", label: "تنقل" },
  { value: "documents", label: "مستندات" },
  { value: "experts", label: "خبراء" },
  { value: "other", label: "أخرى" },
];

export const DOCUMENT_CATEGORIES = [
  { value: "contract", label: "عقد" },
  { value: "pleading", label: "مذكرة" },
  { value: "ruling", label: "حكم" },
  { value: "evidence", label: "دليل" },
  { value: "correspondence", label: "مراسلة" },
  { value: "other", label: "أخرى" },
];

export const PROCEDURE_TYPES = [
  { value: "filing", label: "رفع الدعوى" },
  { value: "notification", label: "إعلان" },
  { value: "hearing", label: "جلسة" },
  { value: "ruling", label: "حكم" },
  { value: "appeal", label: "طعن" },
  { value: "execution", label: "تنفيذ" },
];

// ============================================================
// دوال مساعدة
// ============================================================

export function formatCurrency(amount: number, currency = "ج.م"): string {
  return `${amount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(date: Date | string | null, withTime = false): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  };
  return d.toLocaleDateString("ar-EG", opts);
}

export function timeAgo(date: Date | string | number): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 30) return `منذ ${days} يوم`;
  return formatDate(d);
}

export function getCaseStatusLabel(status: string): string {
  return CASE_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function getCaseTypeLabel(type: string): string {
  return CASE_TYPES.find((t) => t.value === type)?.label ?? type;
}
