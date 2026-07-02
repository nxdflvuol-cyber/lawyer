"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import {
  formatCurrency,
  formatDate,
  getCaseTypeLabel,
  getCaseStatusLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  Activity,
  Award,
  Hammer,
  FileText,
  ScrollText,
  AlertTriangle,
  DollarSign,
  Users,
  Swords,
  Gavel,
  CheckSquare,
  ShieldCheck,
  Clock,
  Plus,
  Save,
  Download,
  FileSpreadsheet,
  FileType,
  FileJson,
  FileBarChart,
  Filter as FilterIcon,
  X,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calendar,
  RefreshCw,
  Play,
  Edit,
  Trash2,
  Eye,
  LayoutDashboard,
  Table2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  BarChart3 as BarChartIcon,
  Gauge,
  SquareStack,
  Search,
  Sparkles,
  Layers,
  ChevronLeft,
  Database,
  Settings2,
  Mail,
  Repeat,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
} from "recharts";

// ============================================================
// الأنواع
// ============================================================

type TrendDir = "up" | "down" | "flat";

interface KpiCardData {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  color: "emerald" | "amber" | "rose" | "cyan" | "violet" | "slate";
  trend?: number;
  trendDir?: TrendDir;
}

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
  value2?: string;
}

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  source: string;
  fields: string[];
  filters: FilterRow[];
  chartType: string;
  groupBy?: string;
  createdAt: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  reportRef: string;
  frequency: string;
  lastRun: string | null;
  nextRun: string;
  status: "active" | "paused";
  recipients: string[];
  owner: string;
}

// ============================================================
// لوحة الألوان (بدون indigo/blue)
// ============================================================

const PALETTE = {
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  slate: "#64748b",
};

const COLOR_TONES: Record<
  KpiCardData["color"],
  { text: string; bg: string; ring: string; hex: string }
> = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    hex: PALETTE.emerald,
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-800",
    hex: PALETTE.amber,
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    ring: "ring-rose-200 dark:ring-rose-800",
    hex: PALETTE.rose,
  },
  cyan: {
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    ring: "ring-cyan-200 dark:ring-cyan-800",
    hex: PALETTE.cyan,
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ring: "ring-violet-200 dark:ring-violet-800",
    hex: PALETTE.violet,
  },
  slate: {
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    ring: "ring-slate-200 dark:ring-slate-800",
    hex: PALETTE.slate,
  },
};

const PIE_COLORS = [
  PALETTE.emerald,
  PALETTE.amber,
  PALETTE.rose,
  PALETTE.violet,
  PALETTE.cyan,
  PALETTE.slate,
];

// ============================================================
// مصادر البيانات
// ============================================================

interface DataSourceDef {
  value: string;
  label: string;
  icon: React.ElementType;
  color: KpiCardData["color"];
  description: string;
  fields: string[];
}

const DATA_SOURCES: DataSourceDef[] = [
  {
    value: "cases",
    label: "القضايا",
    icon: Briefcase,
    color: "emerald",
    description: "القضايا وأنواعها وحالاتها وقيمها",
    fields: [
      "رقم القضية",
      "العنوان",
      "النوع",
      "الحالة",
      "الدرجة",
      "المحكمة",
      "تاريخ البدء",
      "القيمة التقديرية",
      "الموكل",
      "المحامي المسؤول",
    ],
  },
  {
    value: "clients",
    label: "الموكلين",
    icon: Users,
    color: "amber",
    description: "بيانات الموكلين وأنواعهم وتوزيعهم",
    fields: [
      "الاسم",
      "النوع",
      "الحالة",
      "المدينة",
      "الهاتف",
      "البريد الإلكتروني",
      "عدد القضايا",
      "إجمالي المدفوعات",
    ],
  },
  {
    value: "opponents",
    label: "الخصوم",
    icon: Swords,
    color: "rose",
    description: "بيانات الخصوم في القضايا",
    fields: ["الاسم", "النوع", "القضية المرتبطة", "الهاتف", "العنوان"],
  },
  {
    value: "documents",
    label: "المستندات",
    icon: FileText,
    color: "cyan",
    description: "مكتبة المستندات والتصنيفات",
    fields: [
      "العنوان",
      "النوع",
      "التصنيف",
      "القضية",
      "الموكل",
      "تاريخ الإنشاء",
      "الحجم",
    ],
  },
  {
    value: "sessions",
    label: "الجلسات",
    icon: Gavel,
    color: "violet",
    description: "جلسات المحاكم والقرارات",
    fields: ["القضية", "التاريخ", "القرار", "المحكمة", "الحالة"],
  },
  {
    value: "judgments",
    label: "الأحكام",
    icon: Award,
    color: "emerald",
    description: "الأحكام الصادرة ونتائجها",
    fields: ["القضية", "نص الحكم", "التاريخ", "النتيجة", "المحكمة"],
  },
  {
    value: "execution",
    label: "التنفيذ",
    icon: Hammer,
    color: "amber",
    description: "إجراءات التنفيذ والحجوزات",
    fields: ["القضية", "الحالة", "تاريخ التنفيذ", "المبلغ المحجوز"],
  },
  {
    value: "contracts",
    label: "العقود",
    icon: ScrollText,
    color: "cyan",
    description: "العقود والاتفاقيات",
    fields: [
      "العنوان",
      "النوع",
      "الطرف الأول",
      "الطرف الثاني",
      "القيمة",
      "تاريخ البدء",
      "تاريخ الانتهاء",
    ],
  },
  {
    value: "accounting",
    label: "المحاسبة",
    icon: DollarSign,
    color: "emerald",
    description: "الدخل والمصروفات والفواتير",
    fields: [
      "النوع",
      "المبلغ",
      "التاريخ",
      "التصنيف",
      "الموكل",
      "القضية",
      "الحالة",
    ],
  },
  {
    value: "tasks",
    label: "المهام",
    icon: CheckSquare,
    color: "rose",
    description: "المهام والمتابعات وحالاتها",
    fields: [
      "العنوان",
      "الحالة",
      "الأولوية",
      "الموعد النهائي",
      "المسؤول",
      "القضية",
    ],
  },
  {
    value: "audit",
    label: "سجل التدقيق",
    icon: ShieldCheck,
    color: "slate",
    description: "Audit Log للنظام والأحداث",
    fields: ["المستخدم", "الإجراء", "الكيان", "التاريخ", "عنوان IP"],
  },
  {
    value: "timeline",
    label: "الخط الزمني",
    icon: Clock,
    color: "violet",
    description: "الأحداث والأنشطة عبر الزمن",
    fields: ["النوع", "الوصف", "التاريخ", "الكيان", "المستخدم"],
  },
];

// ============================================================
// المشغلات وأنواع المخططات
// ============================================================

const OPERATORS = [
  { value: "eq", label: "يساوي", needsValue: 1 },
  { value: "neq", label: "لا يساوي", needsValue: 1 },
  { value: "contains", label: "يحتوي", needsValue: 1 },
  { value: "gt", label: "أكبر من", needsValue: 1 },
  { value: "lt", label: "أصغر من", needsValue: 1 },
  { value: "between", label: "بين", needsValue: 2 },
  { value: "date", label: "تاريخ", needsValue: 1, isDate: true },
  { value: "in", label: "ضمن قائمة", needsValue: 1 },
];

const CHART_TYPES = [
  {
    value: "table",
    label: "جدول",
    icon: Table2,
    color: "text-slate-600 bg-slate-50 dark:bg-slate-900/40",
  },
  {
    value: "bar",
    label: "مخطط أعمدة",
    icon: BarChartIcon,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    value: "line",
    label: "مخطط خطي",
    icon: LineChartIcon,
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40",
  },
  {
    value: "pie",
    label: "مخطط دائري",
    icon: PieChartIcon,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
  },
  {
    value: "kpi",
    label: "مؤشر KPI",
    icon: Gauge,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
  {
    value: "stat",
    label: "بطاقة إحصائية",
    icon: SquareStack,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
  },
];

const FREQUENCIES = [
  { value: "daily", label: "يومي" },
  { value: "weekly", label: "أسبوعي" },
  { value: "monthly", label: "شهري" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "yearly", label: "سنوي" },
];

// ============================================================
// بيانات افتراضية (Mock) عند فشل API
// ============================================================

const MOCK_CASES_BY_TYPE = [
  { name: "مدنية", value: 45 },
  { name: "تجارية", value: 28 },
  { name: "جنائية", value: 15 },
  { name: "إدارية", value: 22 },
  { name: "أحوال شخصية", value: 18 },
];

const MOCK_CASE_STATUS = [
  { name: "جارية", value: 38 },
  { name: "معلقة", value: 12 },
  { name: "منتهية", value: 28 },
  { name: "كسب", value: 19 },
  { name: "خسارة", value: 6 },
];

const MOCK_CASES_OVER_TIME = [
  { name: "ينا", value: 12 },
  { name: "فبر", value: 18 },
  { name: "مار", value: 22 },
  { name: "أبر", value: 16 },
  { name: "ماي", value: 25 },
  { name: "يون", value: 30 },
  { name: "يول", value: 28 },
  { name: "أغس", value: 32 },
  { name: "سبت", value: 26 },
  { name: "أكت", value: 35 },
  { name: "نوف", value: 31 },
  { name: "ديس", value: 27 },
];

const MOCK_LAWYER_PERFORMANCE = [
  { name: "أ. سالم", value: 24 },
  { name: "أ. منى", value: 18 },
  { name: "أ. خالد", value: 31 },
  { name: "أ. ريم", value: 15 },
  { name: "أ. طارق", value: 22 },
  { name: "أ. هالة", value: 19 },
];

const MOCK_MONTHLY_REVENUE = [
  { name: "ينا", revenue: 42000, expense: 18000 },
  { name: "فبر", revenue: 51000, expense: 22000 },
  { name: "مار", revenue: 48000, expense: 19500 },
  { name: "أبر", revenue: 63000, expense: 25000 },
  { name: "ماي", revenue: 57000, expense: 23000 },
  { name: "يون", revenue: 72000, expense: 31000 },
  { name: "يول", revenue: 68000, expense: 28000 },
  { name: "أغس", revenue: 74000, expense: 30000 },
];

const MOCK_KPI = {
  totalCases: 128,
  activeCases: 64,
  judgments: 42,
  executions: 18,
  documents: 856,
  powers: 96,
  overdueTasks: 11,
  netIncome: 286500,
};

const MOCK_SCHEDULED: ScheduledReport[] = [
  {
    id: "sch-1",
    name: "تقرير القضايا الشهري",
    reportRef: "cases",
    frequency: "monthly",
    lastRun: "2025-01-01T08:00:00Z",
    nextRun: "2025-02-01T08:00:00Z",
    status: "active",
    recipients: ["إدارة المكتب", "الشريك الإداري"],
    owner: "أ. سالم",
  },
  {
    id: "sch-2",
    name: "تقرير المالية الأسبوعي",
    reportRef: "accounting",
    frequency: "weekly",
    lastRun: "2025-01-13T08:00:00Z",
    nextRun: "2025-01-20T08:00:00Z",
    status: "active",
    recipients: ["المحاسبة", "الشريك الإداري"],
    owner: "أ. منى",
  },
  {
    id: "sch-3",
    name: "ملخص الإنتاجية اليومي",
    reportRef: "tasks",
    frequency: "daily",
    lastRun: "2025-01-18T18:00:00Z",
    nextRun: "2025-01-19T18:00:00Z",
    status: "paused",
    recipients: ["إدارة المكتب"],
    owner: "أ. خالد",
  },
  {
    id: "sch-4",
    name: "تقرير الموكلين ربع السنوي",
    reportRef: "clients",
    frequency: "quarterly",
    lastRun: "2024-12-31T08:00:00Z",
    nextRun: "2025-03-31T08:00:00Z",
    status: "active",
    recipients: ["إدارة المكتب", "التسويق", "الشريك الإداري"],
    owner: "أ. ريم",
  },
  {
    id: "sch-5",
    name: "تقرير الأداء السنوي",
    reportRef: "cases",
    frequency: "yearly",
    lastRun: "2024-12-31T23:00:00Z",
    nextRun: "2025-12-31T23:00:00Z",
    status: "active",
    recipients: ["مجلس الإدارة"],
    owner: "أ. طارق",
  },
];

// بيانات معاينة وهمية لكل مصدر
const MOCK_PREVIEW_ROWS: Record<string, Record<string, string | number>[]> = {
  cases: [
    { "رقم القضية": "2025/12", العنوان: "نزاع عقاري", النوع: "مدنية", الحالة: "جارية", الدرجة: "ابتدائي", المحكمة: "شمال القاهرة", "تاريخ البدء": "2025-01-04", "القيمة التقديرية": 250000, الموكل: "أحمد سمير", "المحامي المسؤول": "أ. سالم" },
    { "رقم القضية": "2025/13", العنوان: "تخلف عن سداد", النوع: "تجارية", الحالة: "معلقة", الدرجة: "استئناف", المحكمة: "القاهرة الاقتصادية", "تاريخ البدء": "2025-01-08", "القيمة التقديرية": 480000, الموكل: "شركة الفجر", "المحامي المسؤول": "أ. منى" },
    { "رقم القضية": "2025/14", العنوان: "نفقة زوجية", النوع: "أحوال شخصية", الحالة: "جارية", الدرجة: "ابتدائي", المحكمة: "أسرة المعادي", "تاريخ البدء": "2025-01-10", "القيمة التقديرية": 36000, الموكل: "س. ع.", "المحامي المسؤول": "أ. ريم" },
    { "رقم القضية": "2025/15", العنوان: "طعن إداري", النوع: "إدارية", الحالة: "كسب", الدرجة: "مجلس الدولة", المحكمة: "مجلس الدولة", "تاريخ البدء": "2024-11-22", "القيمة التقديرية": 0, الموكل: "ورشة النيل", "المحامي المسؤول": "أ. خالد" },
    { "رقم القضية": "2025/16", العنوان: "تزوير مستندي", النوع: "جنائية", الحالة: "جارية", الدرجة: "جنايات", المحكمة: "جنائي القاهرة", "تاريخ البدء": "2025-01-12", "القيمة التقديرية": 0, الموكل: "محمود علي", "المحامي المسؤول": "أ. طارق" },
  ],
  clients: [
    { الاسم: "أحمد سمير", النوع: "شخص طبيعي", الحالة: "حالي", المدينة: "القاهرة", الهاتف: "0100xxxxxx", "البريد الإلكتروني": "a@x.com", "عدد القضايا": 3, "إجمالي المدفوعات": 125000 },
    { الاسم: "شركة الفجر", النوع: "شركة خاصة", الحالة: "حالي", المدينة: "الجيزة", الهاتف: "0111xxxxxx", "البريد الإلكتروني": "f@x.com", "عدد القضايا": 7, "إجمالي المدفوعات": 480000 },
    { الاسم: "ورشة النيل", النوع: "شراكة", الحالة: "سابق", المدينة: "القاهرة", الهاتف: "0122xxxxxx", "البريد الإلكتروني": "n@x.com", "عدد القضايا": 2, "إجمالي المدفوعات": 90000 },
    { الاسم: "س. ع.", النوع: "شخص طبيعي", الحالة: "حالي", المدينة: "المعادي", الهاتف: "0100xxxxxx", "البريد الإلكتروني": "s@x.com", "عدد القضايا": 1, "إجمالي المدفوعات": 36000 },
  ],
  accounting: [
    { النوع: "تحصيل أتعاب", المبلغ: 42000, التاريخ: "2025-01-04", التصنيف: "أتعاب", الموكل: "أحمد سمير", القضية: "2025/12", الحالة: "مكتملة" },
    { النوع: "مصروف محكمة", المبلغ: 3500, التاريخ: "2025-01-05", التصنيف: "رسوم القضايا", الموكل: "شركة الفجر", القضية: "2025/13", الحالة: "مكتملة" },
    { النوع: "تحصيل أتعاب", المبلغ: 120000, التاريخ: "2025-01-09", التصنيف: "أتعاب", الموكل: "شركة الفجر", القضية: "2025/13", الحالة: "مكتملة" },
    { النوع: "مصروف خبير", المبلغ: 8000, التاريخ: "2025-01-11", التصنيف: "خبراء", الموكل: "ورشة النيل", القضية: "2025/15", الحالة: "مكتملة" },
  ],
  tasks: [
    { العنوان: "إعداد مذكرة دفاع", الحالة: "قيد التنفيذ", الأولوية: "عاجل", "الموعد النهائي": "2025-01-22", المسؤول: "أ. سالم", القضية: "2025/12" },
    { العنوان: "متابعة إعلان", الحالة: "للتنفيذ", الأولوية: "مرتفع", "الموعد النهائي": "2025-01-20", المسؤول: "أ. منى", القضية: "2025/13" },
    { العنوان: "تجميع مستندات", الحالة: "مكتملة", الأولوية: "متوسط", "الموعد النهائي": "2025-01-15", المسؤول: "أ. ريم", القضية: "2025/14" },
  ],
  documents: [
    { العنوان: "عقد وكالة", النوع: "عقد", التصنيف: "عقد", القضية: "2025/12", الموكل: "أحمد سمير", "تاريخ الإنشاء": "2025-01-04", الحجم: "240KB" },
    { العنوان: "مذكرة دفاع اولية", النوع: "مذكرة", التصنيف: "مذكرة", القضية: "2025/13", الموكل: "شركة الفجر", "تاريخ الإنشاء": "2025-01-08", الحجم: "1.2MB" },
  ],
  sessions: [
    { القضية: "2025/12", التاريخ: "2025-01-20", القرار: "تأجيل", المحكمة: "شمال القاهرة", الحالة: "منعقدة" },
    { القضية: "2025/13", التاريخ: "2025-01-21", القرار: "حجز للحكم", المحكمة: "الاقتصادية", الحالة: "منعقدة" },
  ],
  judgments: [
    { القضية: "2025/15", "نص الحكم": "قبول الطعن", التاريخ: "2024-12-30", النتيجة: "كسب", المحكمة: "مجلس الدولة" },
    { القضية: "2024/88", "نص الحكم": "رفض", التاريخ: "2024-11-15", النتيجة: "خسارة", المحكمة: "استئناف" },
  ],
  execution: [
    { القضية: "2024/55", الحالة: "منفذ", "تاريخ التنفيذ": "2025-01-10", "المبلغ المحجوز": 75000 },
    { القضية: "2024/60", الحالة: "قيد التنفيذ", "تاريخ التنفيذ": "—", "المبلغ المحجوز": 0 },
  ],
  contracts: [
    { العنوان: "عقد استشارة", النوع: "استشارة", "الطرف الأول": "المكتب", "الطرف الثاني": "شركة الفجر", القيمة: 50000, "تاريخ البدء": "2025-01-01", "تاريخ الانتهاء": "2025-12-31" },
  ],
  opponents: [
    { الاسم: "محمد ك.", النوع: "شخص طبيعي", "القضية المرتبطة": "2025/12", الهاتف: "—", العنوان: "القاهرة" },
  ],
  audit: [
    { المستخدم: "أ. سالم", الإجراء: "تعديل قضية", الكيان: "Case#2025/12", التاريخ: "2025-01-18", "عنوان IP": "10.0.0.4" },
    { المستخدم: "أ. منى", الإجراء: "إنشاء موكل", الكيان: "Client#94", التاريخ: "2025-01-17", "عنوان IP": "10.0.0.5" },
  ],
  timeline: [
    { النوع: "قضية", الوصف: "إضافة قضية جديدة", التاريخ: "2025-01-18", الكيان: "Case#2025/12", المستخدم: "أ. سالم" },
    { النوع: "مستند", الوصف: "رفع مذكرة دفاع", التاريخ: "2025-01-17", الكيان: "Doc#88", المستخدم: "أ. منى" },
  ],
};

// ============================================================
// Helpers
// ============================================================

const STORAGE_KEY = "bi-saved-reports-v1";

function loadSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedReport[];
  } catch {
    return [];
  }
}

function persistSavedReports(reports: SavedReport[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

function uid(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatMonthShort(monthStr: string): string {
  // monthStr مثل "2025-01"
  const [y, m] = monthStr.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("ar-EG", { month: "short" });
}

function getDataSource(value: string): DataSourceDef {
  return DATA_SOURCES.find((s) => s.value === value) ?? DATA_SOURCES[0];
}

function getChartType(value: string) {
  return CHART_TYPES.find((c) => c.value === value) ?? CHART_TYPES[0];
}

function getOperator(value: string) {
  return OPERATORS.find((o) => o.value === value) ?? OPERATORS[0];
}

function getFrequencyLabel(value: string): string {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? value;
}

// ============================================================
// بطاقة KPI
// ============================================================

function KPICard({ data }: { data: KpiCardData }) {
  const tones = COLOR_TONES[data.color];
  const Icon = data.icon;
  const trendUp = data.trendDir === "up";
  const trendDown = data.trendDir === "down";
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {data.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {typeof data.value === "number"
                  ? data.value.toLocaleString("ar-EG")
                  : data.value}
              </span>
              {data.hint && (
                <span className="text-[11px] text-muted-foreground">
                  {data.hint}
                </span>
              )}
            </div>
            {typeof data.trend === "number" && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                    trendUp && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                    trendDown && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
                    !trendUp && !trendDown && "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
                  )}
                >
                  {trendUp && <ArrowUpRight className="h-3 w-3" />}
                  {trendDown && <ArrowDownRight className="h-3 w-3" />}
                  {data.trend}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  عن الفترة السابقة
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
              tones.bg,
              tones.text,
              tones.ring
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      <div
        className="absolute bottom-0 left-0 h-1 w-full opacity-80"
        style={{ background: `linear-gradient(90deg, ${tones.hex}, transparent)` }}
      />
    </Card>
  );
}

// ============================================================
// غلاف المخطط
// ============================================================

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function ChartCard({
  title,
  description,
  icon: Icon,
  action,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {Icon && (
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs truncate">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

// ============================================================
// Skeletons
// ============================================================

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-24" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1 h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[220px] w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================================
// تبويب لوحات المعلومات
// ============================================================

interface DashboardData {
  kpis: KpiCardData[];
  casesByType: { name: string; value: number }[];
  caseStatus: { name: string; value: number }[];
  casesOverTime: { name: string; value: number }[];
  lawyerPerformance: { name: string; value: number }[];
  monthlyRevenue: { name: string; revenue: number; expense: number }[];
}

function buildMockDashboard(): DashboardData {
  return {
    kpis: [
      { id: "k1", label: "عدد القضايا", value: MOCK_KPI.totalCases, icon: Briefcase, color: "emerald", trend: 8, trendDir: "up" },
      { id: "k2", label: "القضايا الجارية", value: MOCK_KPI.activeCases, icon: Activity, color: "cyan", trend: 5, trendDir: "up" },
      { id: "k3", label: "الأحكام", value: MOCK_KPI.judgments, icon: Award, color: "violet", trend: 12, trendDir: "up" },
      { id: "k4", label: "التنفيذات", value: MOCK_KPI.executions, icon: Hammer, color: "amber", trend: 3, trendDir: "down" },
      { id: "k5", label: "المستندات", value: MOCK_KPI.documents, icon: FileText, color: "cyan", trend: 22, trendDir: "up" },
      { id: "k6", label: "التوكيلات", value: MOCK_KPI.powers, icon: ScrollText, color: "slate", trend: 4, trendDir: "up" },
      { id: "k7", label: "المهام المتأخرة", value: MOCK_KPI.overdueTasks, icon: AlertTriangle, color: "rose", trend: 2, trendDir: "down" },
      { id: "k8", label: "صافي الدخل", value: formatCurrency(MOCK_KPI.netIncome), icon: DollarSign, color: "emerald", trend: 15, trendDir: "up" },
    ],
    casesByType: MOCK_CASES_BY_TYPE,
    caseStatus: MOCK_CASE_STATUS,
    casesOverTime: MOCK_CASES_OVER_TIME,
    lawyerPerformance: MOCK_LAWYER_PERFORMANCE,
    monthlyRevenue: MOCK_MONTHLY_REVENUE,
  };
}

function DashboardsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<DashboardData>(buildMockDashboard());
  const [newDashOpen, setNewDashOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch("/api/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/reports?type=cases").then((r) => r.json()).catch(() => null),
      ]);

      const stats = statsRes?.success ? statsRes.stats : null;
      const reports = reportsRes?.success ? reportsRes.data : null;

      if (!stats && !reports) {
        // لا بيانات حقيقية -> استخدم الـ mock
        setDashData(buildMockDashboard());
        return;
      }

      const casesByType =
        stats?.caseTypeStats?.map((s: { type: string; count: number }) => ({
          name: getCaseTypeLabel(s.type),
          value: s.count,
        })) ?? MOCK_CASES_BY_TYPE;

      const caseStatus =
        stats?.caseStatusStats?.map((s: { status: string; count: number }) => ({
          name: getCaseStatusLabel(s.status),
          value: s.count,
        })) ?? MOCK_CASE_STATUS;

      const casesOverTime =
        reports?.summary?.monthly?.map(
          (m: { month: string; income: number; expense: number }) => ({
            name: formatMonthShort(m.month),
            value: m.income,
          })
        ) ?? MOCK_CASES_OVER_TIME;

      // أداء المحامين: لا يوجد API مباشر -> ندمج mock مع عدد القضايا
      const lawyerPerf = MOCK_LAWYER_PERFORMANCE.map((l, i) => ({
        name: l.name,
        value: stats?.cases
          ? Math.max(l.value, Math.round((stats.cases / 6)) + i)
          : l.value,
      }));

      const monthlyRevenue =
        reports?.summary?.monthly?.map(
          (m: { month: string; income: number; expense: number }) => ({
            name: formatMonthShort(m.month),
            revenue: m.income,
            expense: m.expense,
          })
        ) ?? MOCK_MONTHLY_REVENUE;

      const kpis: KpiCardData[] = [
        { id: "k1", label: "عدد القضايا", value: stats?.cases ?? MOCK_KPI.totalCases, icon: Briefcase, color: "emerald", trend: 8, trendDir: "up" },
        { id: "k2", label: "القضايا الجارية", value: stats?.activeCases ?? MOCK_KPI.activeCases, icon: Activity, color: "cyan", trend: 5, trendDir: "up" },
        { id: "k3", label: "الأحكام", value: stats?.wonCases ?? MOCK_KPI.judgments, icon: Award, color: "violet", trend: 12, trendDir: "up" },
        { id: "k4", label: "التنفيذات", value: MOCK_KPI.executions, icon: Hammer, color: "amber", trend: 3, trendDir: "down" },
        { id: "k5", label: "المستندات", value: stats?.documents ?? MOCK_KPI.documents, icon: FileText, color: "cyan", trend: 22, trendDir: "up" },
        { id: "k6", label: "التوكيلات", value: MOCK_KPI.powers, icon: ScrollText, color: "slate", trend: 4, trendDir: "up" },
        { id: "k7", label: "المهام المتأخرة", value: stats?.overdueTasks ?? MOCK_KPI.overdueTasks, icon: AlertTriangle, color: "rose", trend: 2, trendDir: "down" },
        { id: "k8", label: "صافي الدخل", value: formatCurrency(stats?.netIncome ?? MOCK_KPI.netIncome), icon: DollarSign, color: "emerald", trend: 15, trendDir: "up" },
      ];

      setDashData({
        kpis,
        casesByType,
        caseStatus,
        casesOverTime,
        lawyerPerformance: lawyerPerf,
        monthlyRevenue,
      });
    } catch {
      setDashData(buildMockDashboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const barConfig = {
    value: { label: "العدد", color: PALETTE.emerald },
  } satisfies ChartConfig;
  const lineConfig = {
    value: { label: "القضايا", color: PALETTE.cyan },
  } satisfies ChartConfig;
  const pieConfig = {
    value: { label: "الحالات", color: PALETTE.violet },
  } satisfies ChartConfig;
  const lawyerConfig = {
    value: { label: "قضايا", color: PALETTE.amber },
  } satisfies ChartConfig;
  const revenueConfig = {
    revenue: { label: "الإيرادات", color: PALETTE.emerald },
    expense: { label: "المصروفات", color: PALETTE.rose },
  } satisfies ChartConfig;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">لوحة المعلومات التنفيذية</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            نظرة شاملة على أداء المكتب والقضايا والمالية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
          <Button size="sm" onClick={() => setNewDashOpen(true)}>
            <Plus className="h-4 w-4 ml-1" />
            لوحة جديدة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
          : dashData.kpis.map((k) => <KPICard key={k.id} data={k} />)}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              title="القضايا حسب النوع"
              description="توزيع القضايا على التصنيفات"
              icon={BarChart3}
            >
              <ChartContainer config={barConfig} className="h-[240px] w-full">
                <BarChart data={dashData.casesByType} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="توزيع حالات القضايا"
              description="نسب الحالات الحالية"
              icon={PieChartIcon}
            >
              <ChartContainer config={pieConfig} className="h-[240px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                  <Pie
                    data={dashData.caseStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {dashData.caseStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {dashData.caseStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="القضايا عبر الزمن"
              description="عدد القضايا شهرياً"
              icon={LineChartIcon}
            >
              <ChartContainer config={lineConfig} className="h-[240px] w-full">
                <LineChart data={dashData.casesOverTime} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--color-value)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="أداء المحامين"
              description="عدد القضايا لكل محامٍ"
              icon={BarChart3}
            >
              <ChartContainer config={lawyerConfig} className="h-[240px] w-full">
                <BarChart data={dashData.lawyerPerformance} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </>
        )}
      </div>

      {/* Area Chart Full Width */}
      <ChartCard
        title="الإيرادات الشهرية"
        description="مقارنة الإيرادات بالمصروفات"
        icon={TrendingUp}
      >
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ChartContainer config={revenueConfig} className="h-[260px] w-full">
            <AreaChart data={dashData.monthlyRevenue} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.emerald} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PALETTE.emerald} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.rose} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PALETTE.rose} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="revenue"
                stroke={PALETTE.emerald}
                strokeWidth={2}
                fill="url(#fillRev)"
              />
              <Area
                dataKey="expense"
                stroke={PALETTE.rose}
                strokeWidth={2}
                fill="url(#fillExp)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </ChartCard>

      {/* New Dashboard Dialog (mock) */}
      <Dialog open={newDashOpen} onOpenChange={setNewDashOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء لوحة معلومات جديدة</DialogTitle>
            <DialogDescription>
              خصص لوحتك الخاصة من KPIs والمخططات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم اللوحة</Label>
              <Input placeholder="مثال: لوحة القضايا التجارية" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الفئة</Label>
                <Select defaultValue="executive">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">تنفيذية</SelectItem>
                    <SelectItem value="operational">تشغيلية</SelectItem>
                    <SelectItem value="financial">مالية</SelectItem>
                    <SelectItem value="case">قضائية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الوصول</Label>
                <Select defaultValue="private">
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">خاص</SelectItem>
                    <SelectItem value="team">الفريق</SelectItem>
                    <SelectItem value="public">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Sparkles className="inline h-3.5 w-3.5 ml-1" />
              ستتم إضافة عناصر اللوحة لاحقاً عبر منشئ اللوحات المرئي.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDashOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                setNewDashOpen(false);
                toast({
                  title: "تم إنشاء اللوحة (تجريبي)",
                  description: "تم حفظ مسودة اللوحة بنجاح",
                });
              }}
            >
              <Save className="h-4 w-4 ml-1" />
              حفظ اللوحة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// تبويب منشئ التقارير
// ============================================================

function FilterEditor({
  filters,
  fields,
  onChange,
}: {
  filters: FilterRow[];
  fields: string[];
  onChange: (f: FilterRow[]) => void;
}) {
  const addFilter = () => {
    const next: FilterRow = {
      id: uid("flt"),
      field: fields[0] ?? "",
      operator: "eq",
      value: "",
    };
    onChange([...filters, next]);
  };

  const updateFilter = (id: string, patch: Partial<FilterRow>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      {filters.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          لا توجد فلاتر. اضغط &quot;إضافة فلتر&quot; لتضييق النتائج.
        </div>
      )}
      {filters.map((f, idx) => {
        const op = getOperator(f.operator);
        return (
          <div
            key={f.id}
            className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-2.5"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                {idx + 1}
              </span>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-[11px] text-muted-foreground">الحقل</Label>
              <Select
                value={f.field}
                onValueChange={(v) => updateFilter(f.id, { field: v })}
              >
                <SelectTrigger className="h-9 mt-1 text-xs">
                  <SelectValue placeholder="اختر حقلاً" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((fld) => (
                    <SelectItem key={fld} value={fld} className="text-xs">
                      {fld}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-[11px] text-muted-foreground">
                المعامل
              </Label>
              <Select
                value={f.operator}
                onValueChange={(v) => updateFilter(f.id, { operator: v })}
              >
                <SelectTrigger className="h-9 mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-[11px] text-muted-foreground">القيمة</Label>
              <Input
                type={op.isDate ? "date" : "text"}
                value={f.value}
                onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                className="h-9 mt-1 text-xs"
                placeholder="قيمة..."
              />
            </div>
            {op.needsValue === 2 && (
              <div className="flex-1 min-w-[100px]">
                <Label className="text-[11px] text-muted-foreground">القيمة 2</Label>
                <Input
                  value={f.value2 ?? ""}
                  onChange={(e) =>
                    updateFilter(f.id, { value2: e.target.value })
                  }
                  className="h-9 mt-1 text-xs"
                  placeholder="قيمة 2..."
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => removeFilter(f.id)}
              aria-label="حذف الفلتر"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addFilter} className="w-full border-dashed">
        <Plus className="h-4 w-4 ml-1" />
        إضافة فلتر
      </Button>
    </div>
  );
}

function PreviewArea({
  source,
  fields,
  filters,
  chartType,
  groupBy,
}: {
  source: string;
  fields: string[];
  filters: FilterRow[];
  chartType: string;
  groupBy?: string;
}) {
  const rows = useMemo(() => {
    const all = MOCK_PREVIEW_ROWS[source] ?? [];
    // تطبيق فلاتر بسيطة (وهمية) — للعرض فقط
    let out = all;
    filters.forEach((f) => {
      if (!f.value) return;
      out = out.filter((r) => {
        const v = r[f.field];
        if (v === undefined) return true;
        switch (f.operator) {
          case "eq":
            return String(v) === f.value;
          case "neq":
            return String(v) !== f.value;
          case "contains":
            return String(v).includes(f.value);
          case "gt":
            return Number(v) > Number(f.value);
          case "lt":
            return Number(v) < Number(f.value);
          default:
            return true;
        }
      });
    });
    return out;
  }, [source, filters]);

  const selectedFields = fields.length > 0 ? fields : Object.keys(rows[0] ?? {});

  const groupedData = useMemo(() => {
    if (!groupBy || rows.length === 0) return null;
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const key = String(r[groupBy] ?? "—");
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [groupBy, rows]);

  const totalRows = rows.length;
  const totalSum = useMemo(() => {
    // اجمع أول عمود رقمي بقيمة موجبة
    const candidates = selectedFields.map((f) => ({
      field: f,
      value: rows.reduce(
        (acc, r) =>
          typeof r[f] === "number" ? acc + (r[f] as number) : acc,
        0
      ),
    }));
    return candidates.find((c) => c.value > 0) ?? null;
  }, [rows, selectedFields]);

  // Empty state
  if (totalRows === 0 && chartType !== "table") {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            لا توجد بيانات للمعاينة بالفلاتر الحالية
          </p>
        </div>
      </div>
    );
  }

  // Table
  if (chartType === "table") {
    return (
      <div className="rounded-lg border">
        <ScrollArea className="max-h-[420px]">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur">
              <TableRow>
                {selectedFields.map((f) => (
                  <TableHead key={f} className="text-xs font-semibold">
                    {f}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={selectedFields.length}
                    className="text-center text-xs text-muted-foreground py-8"
                  >
                    لا توجد بيانات مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    {selectedFields.map((f) => (
                      <TableCell key={f} className="text-xs py-2">
                        {typeof r[f] === "number"
                          ? r[f].toLocaleString("ar-EG")
                          : String(r[f] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span>إجمالي الصفوف: {totalRows.toLocaleString("ar-EG")}</span>
          <span>عرض أول 50 صف</span>
        </div>
      </div>
    );
  }

  // KPI / Stat
  if (chartType === "kpi" || chartType === "stat") {
    const numValue = totalSum?.value ?? totalRows;
    const label =
      chartType === "kpi"
        ? `إجمالي ${totalSum?.field ?? "السجلات"}`
        : `عدد ${getDataSource(source).label}`;
    const tones =
      chartType === "kpi"
        ? COLOR_TONES.amber
        : COLOR_TONES.rose;
    const Icon = chartType === "kpi" ? Gauge : SquareStack;
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div
              className={cn(
                "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
                tones.bg,
                tones.text,
                tones.ring
              )}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-4xl font-bold text-foreground">
              {typeof numValue === "number"
                ? numValue.toLocaleString("ar-EG")
                : numValue}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              المصدر: {getDataSource(source).label}
              {filters.length > 0 && ` • ${filters.length} فلتر`}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Charts: bar / line / pie
  const chartData = groupedData ?? selectedFields.map((f) => ({
    name: f,
    value: rows.reduce(
      (acc, r) => (typeof r[f] === "number" ? acc + (r[f] as number) : acc),
      0
    ),
  }));

  if (chartData.length === 0 || chartData.every((d) => d.value === 0)) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            اختر حقولاً رقمية لعرض المخطط
          </p>
        </div>
      </div>
    );
  }

  const config = {
    value: {
      label: getDataSource(source).label,
      color: PALETTE.emerald,
    },
  } satisfies ChartConfig;

  if (chartType === "bar") {
    return (
      <ChartContainer config={config} className="h-[340px] w-full">
        <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ChartContainer config={config} className="h-[340px] w-full">
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  // pie
  return (
    <div>
      <ChartContainer config={config} className="h-[300px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {chartData.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportBuilderTab() {
  const { toast } = useToast();
  const [source, setSource] = useState<string>("cases");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "رقم القضية",
    "العنوان",
    "النوع",
    "الحالة",
  ]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [chartType, setChartType] = useState<string>("table");
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [reportName, setReportName] = useState<string>("");
  const [reportDesc, setReportDesc] = useState<string>("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() =>
    loadSavedReports()
  );

  const ds = getDataSource(source);

  // عند تغيير المصدر: إعادة ضبط الإعدادات عبر معالج التغيير
  const handleSourceChange = (newSource: string) => {
    const newDs = getDataSource(newSource);
    setSource(newSource);
    setSelectedFields(newDs.fields.slice(0, 4));
    setFilters([]);
    setGroupBy(undefined);
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      toast({
        title: "أدخل اسم التقرير",
        description: "يرجى تسمية التقرير قبل الحفظ",
        variant: "destructive",
      });
      return;
    }
    const newReport: SavedReport = {
      id: uid("rep"),
      name: reportName.trim(),
      description: reportDesc.trim() || undefined,
      source,
      fields: selectedFields,
      filters,
      chartType,
      groupBy,
      createdAt: new Date().toISOString(),
    };
    const next = [newReport, ...savedReports];
    setSavedReports(next);
    persistSavedReports(next);
    toast({
      title: "تم حفظ التقرير",
      description: `تم حفظ "${newReport.name}" في المكتبة`,
    });
    setReportName("");
    setReportDesc("");
  };

  const handleExport = (format: string) => {
    toast({
      title: `تصدير ${format.toUpperCase()}`,
      description: `جارٍ تجهيز ملف ${format} للتقرير الحالي (تجريبي)`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Sidebar - Builder Config */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        {/* Data Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              مصدر البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-3.5 w-3.5" />
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              <ds.icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{ds.description}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-600" />
                الحقول
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {selectedFields.length} / {ds.fields.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1.5 pr-1">
                {ds.fields.map((f) => (
                  <label
                    key={f}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors",
                      selectedFields.includes(f)
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={selectedFields.includes(f)}
                      onCheckedChange={() => toggleField(f)}
                    />
                    <span className="font-medium">{f}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-2 flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setSelectedFields(ds.fields)}
              >
                تحديد الكل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setSelectedFields([])}
              >
                مسح
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-rose-600" />
              الفلاتر
            </CardTitle>
            <CardDescription className="text-[11px]">
              شروط منطقية بـ AND على الحقول
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FilterEditor
              filters={filters}
              fields={ds.fields}
              onChange={setFilters}
            />
          </CardContent>
        </Card>

        {/* Chart type + Group by */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-violet-600" />
              طريقة العرض
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">نوع العرض</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {CHART_TYPES.map((c) => {
                  const active = chartType === c.value;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChartType(c.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] font-medium transition-all",
                        active
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                تجميع حسب (اختياري)
              </Label>
              <Select
                value={groupBy ?? "__none__"}
                onValueChange={(v) =>
                  setGroupBy(v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger className="mt-1.5 text-xs">
                  <SelectValue placeholder="بدون تجميع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs">
                    بدون تجميع
                  </SelectItem>
                  {ds.fields.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main - Preview + Save */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-600" />
                  المعاينة الحية
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  المصدر: {ds.label} • النوع: {getChartType(chartType).label}
                  {groupBy ? ` • تجميع حسب: ${groupBy}` : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handleExport("pdf")}
                      >
                        <FileBarChart className="h-3.5 w-3.5 ml-1" />
                        PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">تصدير PDF</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleExport("excel")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 ml-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleExport("word")}
                >
                  <FileType className="h-3.5 w-3.5 ml-1" />
                  Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="h-3.5 w-3.5 ml-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleExport("json")}
                >
                  <FileJson className="h-3.5 w-3.5 ml-1" />
                  JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PreviewArea
              source={source}
              fields={selectedFields}
              filters={filters}
              chartType={chartType}
              groupBy={groupBy}
            />
          </CardContent>
        </Card>

        {/* Save report */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="h-4 w-4 text-emerald-600" />
              حفظ التقرير
            </CardTitle>
            <CardDescription className="text-[11px]">
              احفظ إعدادات التقرير في مكتبتك للوصول السريع لاحقاً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">
                  اسم التقرير
                </Label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="مثال: القضايا التجارية المعلقة"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">
                  وصف مختصر (اختياري)
                </Label>
                <Input
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="وصف التقرير..."
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">
                الحقول: {selectedFields.length} • الفلاتر: {filters.length} •
                النوع: {getChartType(chartType).label}
              </div>
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 ml-1" />
                حفظ في المكتبة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// تبويب التقارير المجدولة
// ============================================================

function ScheduledReportsTab() {
  const { toast } = useToast();
  const [scheduled, setScheduled] = useState<ScheduledReport[]>(MOCK_SCHEDULED);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    reportRef: "cases",
    frequency: "monthly",
    recipients: "",
  });

  const toggleStatus = (id: string) => {
    setScheduled((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
    toast({
      title: "تم تحديث الحالة",
      description: "تم تبديل حالة التقرير المجدول",
    });
  };

  const handleDelete = (id: string) => {
    setScheduled((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "تم حذف الجدولة", variant: "destructive" });
  };

  const handleRun = (s: ScheduledReport) => {
    toast({
      title: "تم تشغيل التقرير",
      description: `جارٍ تنفيذ "${s.name}" وإرساله إلى ${s.recipients.length} مستلم`,
    });
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast({
        title: "أدخل اسم التقرير",
        variant: "destructive",
      });
      return;
    }
    const recipients = form.recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const newSch: ScheduledReport = {
      id: uid("sch"),
      name: form.name.trim(),
      reportRef: form.reportRef,
      frequency: form.frequency,
      lastRun: null,
      nextRun: new Date(Date.now() + 86400000).toISOString(),
      status: "active",
      recipients: recipients.length > 0 ? recipients : ["إدارة المكتب"],
      owner: "أنا",
    };
    setScheduled((prev) => [newSch, ...prev]);
    setOpen(false);
    setForm({ name: "", reportRef: "cases", frequency: "monthly", recipients: "" });
    toast({ title: "تمت إضافة الجدولة", description: newSch.name });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">التقارير المجدولة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            تشغيل وإرسال تلقائي للتقارير وفق جدول زمني
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 ml-1" />
          جدولة تقرير
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">إجمالي الجدولات</p>
                <p className="text-lg font-bold">{scheduled.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">نشطة</p>
                <p className="text-lg font-bold">
                  {scheduled.filter((s) => s.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">متوقفة</p>
                <p className="text-lg font-bold">
                  {scheduled.filter((s) => s.status === "paused").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">المستلمون</p>
                <p className="text-lg font-bold">
                  {scheduled.reduce((acc, s) => acc + s.recipients.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur">
                <TableRow>
                  <TableHead className="text-xs">اسم التقرير</TableHead>
                  <TableHead className="text-xs">المصدر</TableHead>
                  <TableHead className="text-xs">التكرار</TableHead>
                  <TableHead className="text-xs">آخر تشغيل</TableHead>
                  <TableHead className="text-xs">التشغيل القادم</TableHead>
                  <TableHead className="text-xs">المستلمون</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduled.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-sm text-muted-foreground py-12"
                    >
                      <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
                      <p className="mt-2">لا توجد تقارير مجدولة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  scheduled.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">
                        {s.name}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          بواسطة {s.owner}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {getDataSource(s.reportRef).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {getFrequencyLabel(s.frequency)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastRun ? formatDate(s.lastRun, true) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(s.nextRun, true)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {s.recipients.slice(0, 2).map((r, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {r}
                            </Badge>
                          ))}
                          {s.recipients.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              +{s.recipients.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "active" ? "default" : "secondary"
                          }
                          className={cn(
                            "text-[10px]",
                            s.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : ""
                          )}
                        >
                          {s.status === "active" ? "نشط" : "متوقف"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleRun(s)}
                                >
                                  <Play className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>تشغيل الآن</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleStatus(s.id)}
                                >
                                  <Switch
                                    checked={s.status === "active"}
                                    className="scale-75 pointer-events-none"
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {s.status === "active" ? "إيقاف" : "تفعيل"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => handleDelete(s.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>حذف</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Schedule Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>جدولة تقرير جديد</DialogTitle>
            <DialogDescription>
              سيتم تشغيل التقرير تلقائياً وإرساله للمستلمين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم الجدولة</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: تقرير القضايا الشهري"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التقرير</Label>
                <Select
                  value={form.reportRef}
                  onValueChange={(v) => setForm({ ...form, reportRef: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>التكرار</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>المستلمون (افصل بينهم بفاصلة)</Label>
              <Input
                value={form.recipients}
                onChange={(e) =>
                  setForm({ ...form, recipients: e.target.value })
                }
                placeholder="إدارة المكتب، المحاسبة"
                className="mt-1.5"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                سيتم إرسال التقرير عبر البريد الإلكتروني في الموعد المحدد
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة الجدولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// تبويب مكتبة التقارير
// ============================================================

function ReportLibraryTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState<SavedReport[]>(() =>
    loadSavedReports()
  );
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<SavedReport | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        getDataSource(r.source).label.includes(search)
    );
  }, [reports, search]);

  const handleDelete = (id: string) => {
    const next = reports.filter((r) => r.id !== id);
    setReports(next);
    persistSavedReports(next);
    toast({ title: "تم حذف التقرير", variant: "destructive" });
  };

  const handleExport = (report: SavedReport, format: string) => {
    toast({
      title: `تصدير ${format.toUpperCase()}`,
      description: `جارٍ تصدير "${report.name}" (${format}) - تجريبي`,
    });
  };

  const handleRun = (report: SavedReport) => {
    setPreview(report);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">مكتبة التقارير المحفوظة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            التقارير التي أنشأتها وحفظتها للوصول السريع
          </p>
        </div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المكتبة..."
            className="w-64 pr-8 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">لا توجد تقارير محفوظة</p>
            <p className="mt-1 text-xs text-muted-foreground">
              انتقل إلى &quot;منشئ التقارير&quot; لإنشاء وحفظ أول تقرير لك
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const ds = getDataSource(r.source);
            const ct = getChartType(r.chartType);
            const Icon = ds.icon;
            return (
              <Card key={r.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                          COLOR_TONES[ds.color].bg,
                          COLOR_TONES[ds.color].text,
                          COLOR_TONES[ds.color].ring
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">
                          {r.name}
                        </CardTitle>
                        <CardDescription className="text-[11px] truncate">
                          {r.description ?? ds.label}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {ds.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {ct.label}
                    </Badge>
                    {r.filters.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-rose-600"
                      >
                        {r.filters.length} فلتر
                      </Badge>
                    )}
                    {r.groupBy && (
                      <Badge variant="outline" className="text-[10px]">
                        مجموعة: {r.groupBy}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.fields.length} حقل • أُنشئ {formatDate(r.createdAt)}
                  </div>
                  <Separator />
                  <div className="mt-auto grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs"
                      onClick={() => handleRun(r)}
                    >
                      <Play className="h-3.5 w-3.5 ml-1" />
                      تشغيل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleExport(r, "pdf")}
                    >
                      <Download className="h-3.5 w-3.5 ml-1" />
                      تصدير
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => handleExport(r, "excel")}
                      className="text-muted-foreground hover:text-emerald-600"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport(r, "csv")}
                      className="text-muted-foreground hover:text-emerald-600"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport(r, "json")}
                      className="text-muted-foreground hover:text-emerald-600"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Sheet */}
      <Sheet
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
      >
        <SheetContent
          side="left"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {(() => {
                    const ds = getDataSource(preview.source);
                    const Icon = ds.icon;
                    return (
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                          COLOR_TONES[ds.color].bg,
                          COLOR_TONES[ds.color].text,
                          COLOR_TONES[ds.color].ring
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  {preview.name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {preview.description ?? getDataSource(preview.source).label}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {getDataSource(preview.source).label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {getChartType(preview.chartType).label}
                  </Badge>
                  {preview.filters.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-rose-600">
                      {preview.filters.length} فلتر
                    </Badge>
                  )}
                  {preview.groupBy && (
                    <Badge variant="outline" className="text-[10px]">
                      مجموعة: {preview.groupBy}
                    </Badge>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    الحقول المختارة
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preview.fields.map((f) => (
                      <Badge
                        key={f}
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                {preview.filters.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      الفلاتر
                    </p>
                    <div className="space-y-1">
                      {preview.filters.map((flt, i) => (
                        <div
                          key={flt.id}
                          className="text-[11px] flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-muted-foreground">
                            {i + 1}.
                          </span>
                          <span className="font-medium">{flt.field}</span>
                          <span className="text-muted-foreground">
                            {getOperator(flt.operator).label}
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {flt.value}
                          </span>
                          {flt.value2 && (
                            <>
                              <span className="text-muted-foreground">إلى</span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {flt.value2}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    المعاينة
                  </p>
                  <PreviewArea
                    source={preview.source}
                    fields={preview.fields}
                    filters={preview.filters}
                    chartType={preview.chartType}
                    groupBy={preview.groupBy}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(preview, "pdf")}
                  >
                    <FileBarChart className="h-3.5 w-3.5 ml-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(preview, "excel")}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 ml-1" />
                    Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(preview, "csv")}
                  >
                    <Download className="h-3.5 w-3.5 ml-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(preview, "json")}
                  >
                    <FileJson className="h-3.5 w-3.5 ml-1" />
                    JSON
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================================
// المكوّن الرئيسي
// ============================================================

export function ReportingBISection() {
  const [tab, setTab] = useState<string>("dashboards");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 flex-col"
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    التقارير والتحليلات المؤسسية
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Enterprise Reporting &amp; BI Builder
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  متصل بمصدر البيانات
                </Badge>
                <Button variant="ghost" size="sm" className="text-xs">
                  <ChevronLeft className="h-3.5 w-3.5 ml-1" />
                  رجوع
                </Button>
              </div>
            </div>
          </div>
          {/* Tabs Bar */}
          <div className="px-4 sm:px-6 pb-2">
            <TabsList className="bg-transparent h-auto p-0 gap-1 overflow-x-auto">
              <TabsTrigger
                value="dashboards"
                className="rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300"
              >
                <LayoutDashboard className="h-4 w-4 ml-1.5" />
                لوحات المعلومات
              </TabsTrigger>
              <TabsTrigger
                value="builder"
                className="rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300"
              >
                <Settings2 className="h-4 w-4 ml-1.5" />
                منشئ التقارير
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300"
              >
                <Calendar className="h-4 w-4 ml-1.5" />
                التقارير المجدولة
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300"
              >
                <FileBarChart className="h-4 w-4 ml-1.5" />
                مكتبة التقارير
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 px-4 sm:px-6 py-4">
          <TabsContent
            value="dashboards"
            className="mt-0 focus-visible:outline-none"
          >
            <DashboardsTab />
          </TabsContent>
          <TabsContent
            value="builder"
            className="mt-0 focus-visible:outline-none"
          >
            <ReportBuilderTab />
          </TabsContent>
          <TabsContent
            value="scheduled"
            className="mt-0 focus-visible:outline-none"
          >
            <ScheduledReportsTab />
          </TabsContent>
          <TabsContent
            value="library"
            className="mt-0 focus-visible:outline-none"
          >
            <ReportLibraryTab />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}

export default ReportingBISection;
