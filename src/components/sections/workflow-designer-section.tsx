"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Workflow as WorkflowIcon,
  Plus,
  Save,
  Trash2,
  Pencil,
  Play,
  Search,
  Loader2,
  GripVertical,
  ChevronDown,
  FileText,
  AlertTriangle,
  Clock,
  ClipboardList,
  Gavel,
  Scale,
  Hammer,
  Handshake,
  Megaphone,
  Lock,
  Tag,
  Split,
  FileUp,
  ScrollText,
  CheckSquare,
  Bell,
  Send,
  RefreshCw,
  FilePlus2,
  Bot,
  History,
  Layers,
  Sparkles,
  X,
  Filter,
  Eye,
  Settings2,
  Wand2,
  CircuitBoard,
  ArrowLeft,
  CircleDot,
  CalendarClock,
  Users,
  FolderTree,
  Zap,
} from "lucide-react";

// ============================================================
// الأنواع
// ============================================================

type StageTypeValue =
  | "warning"
  | "waiting"
  | "filing"
  | "registration"
  | "sessions"
  | "judgment"
  | "execution"
  | "settlement"
  | "minutes"
  | "investigation"
  | "announcement"
  | "seizure"
  | "sale"
  | "distribution"
  | "first_degree"
  | "appeal_filing"
  | "bond";

interface StageCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  type: StageTypeValue;
  requiredDocuments: string[];
  requiredFields: string[];
  conditions: StageCondition[];
  actions: string[];
  assignedRole: string;
  autoNotify: boolean;
  estimatedDays: number;
}

interface Workflow {
  id: string;
  name: string;
  caseType: string;
  steps: WorkflowStage[];
  isActive: boolean;
  description?: string;
  updatedAt?: string;
  createdAt?: string;
  isLocal?: boolean;
}

// ============================================================
// الثوابت
// ============================================================

const CASE_TYPES: { value: string; label: string; color: ColorKey }[] = [
  { value: "civil", label: "دعوى مدنية", color: "emerald" },
  { value: "commercial", label: "دعوى تجارية", color: "amber" },
  { value: "criminal", label: "دعوى جنائية", color: "rose" },
  { value: "administrative", label: "دعوى إدارية", color: "cyan" },
  { value: "personal_status", label: "أحوال شخصية", color: "violet" },
  { value: "execution", label: "تنفيذ", color: "rose" },
  { value: "appeal", label: "استئناف", color: "amber" },
  { value: "cassation", label: "نقض", color: "slate" },
  { value: "writ", label: "سند تنفيذي", color: "emerald" },
];

type ColorKey = "emerald" | "amber" | "rose" | "slate" | "cyan" | "violet";

const STAGE_TYPES: {
  value: StageTypeValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorKey;
}[] = [
  { value: "warning", label: "إنذار", icon: AlertTriangle, color: "amber" },
  { value: "waiting", label: "انتظار", icon: Clock, color: "slate" },
  { value: "filing", label: "رفع دعوى", icon: FileText, color: "emerald" },
  { value: "registration", label: "قيد", icon: ClipboardList, color: "cyan" },
  { value: "sessions", label: "جلسات", icon: Gavel, color: "violet" },
  { value: "judgment", label: "حكم", icon: Scale, color: "emerald" },
  { value: "execution", label: "تنفيذ", icon: Hammer, color: "rose" },
  { value: "settlement", label: "تسوية", icon: Handshake, color: "amber" },
  { value: "minutes", label: "محضر", icon: FileText, color: "slate" },
  { value: "investigation", label: "تحقيق", icon: Search, color: "violet" },
  { value: "announcement", label: "إعلان", icon: Megaphone, color: "cyan" },
  { value: "seizure", label: "حجز", icon: Lock, color: "rose" },
  { value: "sale", label: "بيع", icon: Tag, color: "amber" },
  { value: "distribution", label: "توزيع", icon: Split, color: "emerald" },
  { value: "first_degree", label: "حكم أول درجة", icon: Scale, color: "violet" },
  { value: "appeal_filing", label: "صحيفة استئناف", icon: FileUp, color: "cyan" },
  { value: "bond", label: "سند", icon: ScrollText, color: "amber" },
];

const DOCUMENTS_LIST: { value: string; label: string }[] = [
  { value: "statement", label: "صحيفة" },
  { value: "power_of_attorney", label: "توكيل" },
  { value: "id_card", label: "بطاقة" },
  { value: "contract", label: "عقد" },
  { value: "warning", label: "إنذار" },
  { value: "minutes", label: "محضر" },
  { value: "judgment", label: "حكم" },
];

const FIELDS_LIST: { value: string; label: string }[] = [
  { value: "case_number", label: "رقم القضية" },
  { value: "court", label: "المحكمة" },
  { value: "circuit", label: "الدائرة" },
  { value: "judge", label: "القاضي" },
  { value: "opponent", label: "الخصم" },
  { value: "facts", label: "الوقائع" },
  { value: "strategy", label: "الاستراتيجية" },
];

const OPERATORS: { value: string; label: string }[] = [
  { value: "eq", label: "يساوي" },
  { value: "neq", label: "لا يساوي" },
  { value: "contains", label: "يحتوي" },
  { value: "gt", label: "أكبر من" },
  { value: "lt", label: "أصغر من" },
  { value: "empty", label: "فارغ" },
  { value: "not_empty", label: "غير فارغ" },
];

const ACTIONS_LIST: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorKey;
}[] = [
  { value: "create_task", label: "إنشاء مهمة", icon: CheckSquare, color: "emerald" },
  { value: "send_notification", label: "إرسال إشعار", icon: Bell, color: "amber" },
  { value: "send_telegram", label: "إرسال تليجرام", icon: Send, color: "cyan" },
  { value: "update_status", label: "تحديث الحالة", icon: RefreshCw, color: "slate" },
  { value: "create_document", label: "إنشاء مستند", icon: FilePlus2, color: "violet" },
  { value: "alert_ai", label: "تنبيه الذكاء الاصطناعي", icon: Bot, color: "rose" },
  { value: "add_timeline", label: "إضافة للخط الزمني", icon: History, color: "emerald" },
];

const ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "مدير النظام" },
  { value: "lawyer", label: "محامي" },
  { value: "assistant", label: "مساعد" },
  { value: "member", label: "عضو" },
  { value: "intern", label: "متدرب" },
];

const COLOR_CLASSES: Record<ColorKey, string> = {
  emerald:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  amber:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  slate:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  violet:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

const COLOR_DOT: Record<ColorKey, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
};

const COLOR_RING: Record<ColorKey, string> = {
  emerald: "ring-emerald-500/20",
  amber: "ring-amber-500/20",
  rose: "ring-rose-500/20",
  slate: "ring-slate-500/20",
  cyan: "ring-cyan-500/20",
  violet: "ring-violet-500/20",
};

// ============================================================
// القوالب الجاهزة
// ============================================================

function makeStage(
  name: string,
  type: StageTypeValue,
  opts: Partial<WorkflowStage> = {}
): WorkflowStage {
  return {
    id: `s_${Math.random().toString(36).slice(2, 10)}`,
    name,
    type,
    requiredDocuments: opts.requiredDocuments || [],
    requiredFields: opts.requiredFields || [],
    conditions: opts.conditions || [],
    actions: opts.actions || ["add_timeline"],
    assignedRole: opts.assignedRole || "lawyer",
    autoNotify: opts.autoNotify ?? true,
    estimatedDays: opts.estimatedDays ?? 7,
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  caseType: string;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorKey;
  stages: WorkflowStage[];
}

const TEMPLATES: Template[] = [
  {
    id: "tpl_civil_full",
    name: "دعوى مدنية كاملة",
    description: "مسار كامل لدعوى مدنية من الإنذار حتى التنفيذ",
    caseType: "civil",
    icon: Scale,
    color: "emerald",
    stages: [
      makeStage("إنذار الخصم", "warning", {
        requiredDocuments: ["warning", "power_of_attorney"],
        requiredFields: ["opponent", "facts"],
        actions: ["send_notification", "send_telegram", "add_timeline"],
        estimatedDays: 3,
      }),
      makeStage("فترة الانتظار", "waiting", {
        requiredFields: ["opponent"],
        actions: ["add_timeline"],
        estimatedDays: 15,
      }),
      makeStage("رفع الدعوى", "filing", {
        requiredDocuments: ["statement", "power_of_attorney", "id_card"],
        requiredFields: ["case_number", "court", "circuit", "opponent", "facts"],
        actions: ["create_document", "send_notification", "add_timeline"],
        estimatedDays: 2,
      }),
      makeStage("قيد الدعوى", "registration", {
        requiredFields: ["case_number", "court", "circuit", "judge"],
        actions: ["update_status", "add_timeline"],
        estimatedDays: 1,
      }),
      makeStage("جلسات النظر", "sessions", {
        requiredDocuments: ["statement"],
        requiredFields: ["case_number", "judge", "opponent", "strategy"],
        actions: ["create_task", "send_notification", "add_timeline"],
        estimatedDays: 90,
      }),
      makeStage("إصدار الحكم", "judgment", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number", "judge"],
        actions: ["create_document", "alert_ai", "add_timeline"],
        estimatedDays: 14,
      }),
      makeStage("التنفيذ", "execution", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number"],
        actions: ["create_task", "send_telegram", "add_timeline"],
        estimatedDays: 60,
      }),
    ],
  },
  {
    id: "tpl_personal_status",
    name: "أحوال شخصية",
    description: "مسار دعوى أحوال شخصية تبدأ بمحاولة تسوية",
    caseType: "personal_status",
    icon: Users,
    color: "violet",
    stages: [
      makeStage("محاولة التسوية", "settlement", {
        requiredDocuments: ["power_of_attorney", "id_card"],
        requiredFields: ["opponent", "facts"],
        actions: ["send_notification", "add_timeline"],
        estimatedDays: 30,
      }),
      makeStage("رفع الدعوى", "filing", {
        requiredDocuments: ["statement", "power_of_attorney", "id_card"],
        requiredFields: ["case_number", "court", "circuit", "opponent", "facts"],
        actions: ["create_document", "send_notification", "add_timeline"],
        estimatedDays: 2,
      }),
      makeStage("جلسات النظر", "sessions", {
        requiredDocuments: ["statement"],
        requiredFields: ["case_number", "judge", "strategy"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 60,
      }),
      makeStage("إصدار الحكم", "judgment", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number"],
        actions: ["create_document", "add_timeline"],
        estimatedDays: 14,
      }),
      makeStage("التنفيذ", "execution", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 30,
      }),
    ],
  },
  {
    id: "tpl_misdemeanor",
    name: "جنحة",
    description: "مسار جنحة من المحضر حتى الحكم",
    caseType: "criminal",
    icon: Gavel,
    color: "rose",
    stages: [
      makeStage("تحرير المحضر", "minutes", {
        requiredDocuments: ["minutes", "id_card"],
        requiredFields: ["opponent", "facts"],
        actions: ["create_document", "add_timeline"],
        estimatedDays: 1,
      }),
      makeStage("التحقيق", "investigation", {
        requiredDocuments: ["minutes"],
        requiredFields: ["case_number", "facts"],
        actions: ["create_task", "send_notification", "add_timeline"],
        estimatedDays: 30,
      }),
      makeStage("جلسات المحاكمة", "sessions", {
        requiredDocuments: ["statement"],
        requiredFields: ["case_number", "court", "judge", "strategy"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 45,
      }),
      makeStage("إصدار الحكم", "judgment", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number"],
        actions: ["create_document", "alert_ai", "add_timeline"],
        estimatedDays: 7,
      }),
    ],
  },
  {
    id: "tpl_appeal",
    name: "استئناف",
    description: "مسار استئناف حكم ابتدائي",
    caseType: "appeal",
    icon: FileUp,
    color: "amber",
    stages: [
      makeStage("حكم أول درجة", "first_degree", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number", "court", "judge"],
        actions: ["alert_ai", "add_timeline"],
        estimatedDays: 1,
      }),
      makeStage("تقديم صحيفة الاستئناف", "appeal_filing", {
        requiredDocuments: ["statement", "power_of_attorney", "judgment"],
        requiredFields: ["case_number", "court", "circuit", "opponent", "facts"],
        actions: ["create_document", "send_notification", "add_timeline"],
        estimatedDays: 5,
      }),
      makeStage("جلسات الاستئناف", "sessions", {
        requiredDocuments: ["statement", "judgment"],
        requiredFields: ["case_number", "judge", "strategy"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 90,
      }),
      makeStage("الحكم الاستئنافي", "judgment", {
        requiredDocuments: ["judgment"],
        requiredFields: ["case_number"],
        actions: ["create_document", "add_timeline"],
        estimatedDays: 14,
      }),
    ],
  },
  {
    id: "tpl_writ_execution",
    name: "سند تنفيذي",
    description: "مسار تنفيذ سند رسمي عبر الإعلان والحجز والبيع",
    caseType: "writ",
    icon: ScrollText,
    color: "emerald",
    stages: [
      makeStage("إثبات السند", "bond", {
        requiredDocuments: ["contract", "id_card"],
        requiredFields: ["opponent", "facts"],
        actions: ["create_document", "add_timeline"],
        estimatedDays: 1,
      }),
      makeStage("إعلان التنفيذ", "announcement", {
        requiredDocuments: ["contract"],
        requiredFields: ["case_number", "opponent"],
        actions: ["send_telegram", "send_notification", "add_timeline"],
        estimatedDays: 7,
      }),
      makeStage("حجز الأموال", "seizure", {
        requiredDocuments: ["minutes"],
        requiredFields: ["case_number", "judge"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 21,
      }),
      makeStage("بيع المحجوزات", "sale", {
        requiredDocuments: ["minutes"],
        requiredFields: ["case_number"],
        actions: ["create_task", "add_timeline"],
        estimatedDays: 45,
      }),
      makeStage("توزيع الحصيلة", "distribution", {
        requiredDocuments: ["minutes"],
        requiredFields: ["case_number"],
        actions: ["create_document", "send_notification", "add_timeline"],
        estimatedDays: 14,
      }),
    ],
  },
];

// ============================================================
// دوال مساعدة
// ============================================================

function genId(prefix: string = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseSteps(raw: unknown): WorkflowStage[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as WorkflowStage[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as WorkflowStage[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return "غير معروف";
  try {
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = now - d.getTime();
    const day = 86400000;
    if (diff < 0) return "قريباً";
    if (diff < 3600000) return `منذ ${Math.max(1, Math.floor(diff / 60000))} دقيقة`;
    if (diff < day) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    if (diff < 30 * day) return `منذ ${Math.floor(diff / day)} يوم`;
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "غير معروف";
  }
}

function getStageTypeMeta(type: StageTypeValue) {
  return STAGE_TYPES.find((t) => t.value === type) || STAGE_TYPES[0];
}

function getCaseTypeMeta(value: string) {
  return CASE_TYPES.find((c) => c.value === value) || { value, label: value, color: "slate" as ColorKey };
}

function getActionMeta(value: string) {
  return ACTIONS_LIST.find((a) => a.value === value);
}

function getDocLabel(value: string): string {
  return DOCUMENTS_LIST.find((d) => d.value === value)?.label || value;
}

function getFieldLabel(value: string): string {
  return FIELDS_LIST.find((f) => f.value === value)?.label || value;
}

function getRoleLabel(value: string): string {
  return ROLES.find((r) => r.value === value)?.label || value;
}

function getOperatorLabel(value: string): string {
  return OPERATORS.find((o) => o.value === value)?.label || value;
}

function createBlankWorkflow(): Workflow {
  return {
    id: genId("wf"),
    name: "سير عمل جديد",
    caseType: "civil",
    steps: [],
    isActive: true,
    description: "",
    isLocal: true,
  };
}

function createBlankStage(): WorkflowStage {
  return {
    id: genId("s"),
    name: "مرحلة جديدة",
    type: "filing",
    requiredDocuments: [],
    requiredFields: [],
    conditions: [],
    actions: ["add_timeline"],
    assignedRole: "lawyer",
    autoNotify: true,
    estimatedDays: 7,
  };
}

// بيانات تجريبية للمحاكاة
const SIM_SAMPLE_DATA: Record<string, string> = {
  case_number: "٢٠٢٥/١٢٣٤",
  court: "محكمة شمال القاهرة الابتدائية",
  circuit: "الدائرة المدنية الخامسة",
  judge: "الأستاذ/ أحمد محمد",
  opponent: "السيد/ محمد عبد الله",
  facts: "نزاع على ملكية عقار رقم ١٢ بمنطقة مدينة نصر",
  strategy: "إثبات الملكية بعقد مسجل + طلب خبرة هندسية",
};

// ============================================================
// بطاقة مرحلة قابلة للسحب
// ============================================================

interface SortableStageCardProps {
  stage: WorkflowStage;
  index: number;
  total: number;
  onEdit: (stage: WorkflowStage, index: number) => void;
  onDelete: (stage: WorkflowStage, index: number) => void;
}

function SortableStageCard({ stage, index, total, onEdit, onDelete }: SortableStageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = getStageTypeMeta(stage.type);
  const StageIcon = meta.icon;
  const colorClass = COLOR_CLASSES[meta.color];

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={cn(
          "border-r-4 shadow-sm transition-shadow hover:shadow-md",
          `border-r-${meta.color === "emerald" ? "emerald" : meta.color}-500`,
          isDragging && "shadow-lg ring-2 " + COLOR_RING[meta.color]
        )}
        style={{
          borderRightColor: `var(--color-${meta.color}-500, currentColor)`,
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 h-8 w-8 shrink-0 cursor-grab text-muted-foreground hover:bg-muted active:cursor-grabbing"
              {...attributes}
              {...listeners}
              aria-label="اسحب لإعادة الترتيب"
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            {/* Stage number + icon */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold border",
                  colorClass
                )}
              >
                {index + 1}
              </div>
            </div>

            {/* Stage content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground truncate">{stage.name}</h4>
                <Badge variant="outline" className={cn("gap-1", colorClass)}>
                  <StageIcon className="h-3 w-3" />
                  {meta.label}
                </Badge>
                {stage.autoNotify && (
                  <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/40">
                    <Bell className="h-3 w-3" />
                    إشعار تلقائي
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-slate-700 border-slate-200 bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-900/60">
                  <Users className="h-3 w-3" />
                  {getRoleLabel(stage.assignedRole)}
                </Badge>
                <Badge variant="outline" className="gap-1 text-cyan-700 border-cyan-200 bg-cyan-50 dark:text-cyan-300 dark:border-cyan-800 dark:bg-cyan-950/40">
                  <CalendarClock className="h-3 w-3" />
                  {stage.estimatedDays} يوم
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {/* Required documents */}
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    المستندات المطلوبة
                  </div>
                  {stage.requiredDocuments.length === 0 ? (
                    <span className="text-xs text-muted-foreground/70">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {stage.requiredDocuments.map((d) => (
                        <Badge key={d} variant="secondary" className="text-[10px] py-0 px-1.5">
                          {getDocLabel(d)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Required fields */}
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                    <ClipboardList className="h-3 w-3" />
                    الحقول المطلوبة
                  </div>
                  {stage.requiredFields.length === 0 ? (
                    <span className="text-xs text-muted-foreground/70">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {stage.requiredFields.map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px] py-0 px-1.5">
                          {getFieldLabel(f)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    الإجراءات
                  </div>
                  {stage.actions.length === 0 ? (
                    <span className="text-xs text-muted-foreground/70">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {stage.actions.map((a) => {
                        const am = getActionMeta(a);
                        if (!am) return null;
                        const AIcon = am.icon;
                        return (
                          <Badge
                            key={a}
                            variant="secondary"
                            className={cn("text-[10px] py-0 px-1.5 gap-0.5", COLOR_CLASSES[am.color])}
                          >
                            <AIcon className="h-2.5 w-2.5" />
                            {am.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {stage.conditions.length > 0 && (
                <div className="mt-2 rounded-md border border-dashed border-amber-200 bg-amber-50/50 p-2 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Filter className="h-3 w-3" />
                    الشروط ({stage.conditions.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stage.conditions.map((c) => (
                      <Badge
                        key={c.id}
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 text-amber-800 border-amber-300 dark:text-amber-200 dark:border-amber-700"
                      >
                        {getFieldLabel(c.field)} {getOperatorLabel(c.operator)}{" "}
                        {c.operator === "empty" || c.operator === "not_empty" ? "" : `"${c.value}"`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(stage, index)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>تعديل المرحلة</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => onDelete(stage, index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>حذف المرحلة</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connector arrow */}
      {index < total - 1 && (
        <div className="flex justify-center py-1">
          <div className="flex flex-col items-center text-muted-foreground/60">
            <div className="h-3 w-px bg-gradient-to-b from-transparent to-slate-300 dark:to-slate-600" />
            <ChevronDown className="h-4 w-4" />
            <div className="h-3 w-px bg-gradient-to-t from-transparent to-slate-300 dark:to-slate-600" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// محرر المرحلة (Dialog)
// ============================================================

interface StageEditorDialogProps {
  open: boolean;
  stage: WorkflowStage | null;
  onClose: () => void;
  onSave: (stage: WorkflowStage) => void;
}

function StageEditorDialog({ open, stage, onClose, onSave }: StageEditorDialogProps) {
  const [draft, setDraft] = useState<WorkflowStage | null>(null);

  useEffect(() => {
    if (open && stage) {
      setDraft(JSON.parse(JSON.stringify(stage)));
    } else {
      setDraft(null);
    }
  }, [open, stage]);

  if (!draft) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>محرر المرحلة</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // لقطة غير قابلة لـ null تُستخدم داخل الإغلاقات (closures) — كل render يلتقط أحدث حالة
  const d: WorkflowStage = draft;

  function update<K extends keyof WorkflowStage>(key: K, value: WorkflowStage[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleInArray(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function addCondition() {
    const newCond: StageCondition = {
      id: genId("c"),
      field: "case_number",
      operator: "eq",
      value: "",
    };
    update("conditions", [...d.conditions, newCond]);
  }

  function updateCondition(id: string, patch: Partial<StageCondition>) {
    update(
      "conditions",
      d.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeCondition(id: string) {
    update("conditions", d.conditions.filter((c) => c.id !== id));
  }

  function handleSave() {
    const toSave: WorkflowStage = d.name.trim()
      ? d
      : { ...d, name: "مرحلة بدون اسم" };
    onSave(toSave);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            {stage?.name === "مرحلة جديدة" ? "إضافة مرحلة جديدة" : "تعديل المرحلة"}
          </DialogTitle>
          <DialogDescription>
            خصّص تفاصيل المرحلة: النوع، المستندات، الحقول، الشروط والإجراءات.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name + Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stage-name">اسم المرحلة</Label>
              <Input
                id="stage-name"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="مثال: رفع الدعوى"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع المرحلة</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => update("type", v as StageTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {STAGE_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", COLOR_CLASSES[t.color].split(" ").slice(0, 2).join(" "))} />
                          {t.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role + Days + Notify */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>الدور المسؤول</Label>
              <Select
                value={draft.assignedRole}
                onValueChange={(v) => update("assignedRole", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-days">المدة المقدّرة (أيام)</Label>
              <Input
                id="stage-days"
                type="number"
                min={0}
                value={draft.estimatedDays}
                onChange={(e) => update("estimatedDays", Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label>الإشعار التلقائي</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3">
                <Switch
                  checked={draft.autoNotify}
                  onCheckedChange={(v) => update("autoNotify", v)}
                />
                <span className="text-sm text-muted-foreground">
                  {draft.autoNotify ? "مفعّل" : "معطّل"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Required Documents */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              المستندات المطلوبة
            </Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-4">
              {DOCUMENTS_LIST.map((d) => (
                <label
                  key={d.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={draft.requiredDocuments.includes(d.value)}
                    onCheckedChange={() => update("requiredDocuments", toggleInArray(draft.requiredDocuments, d.value))}
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Required Fields */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-cyan-600" />
              الحقول المطلوبة
            </Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-4">
              {FIELDS_LIST.map((f) => (
                <label
                  key={f.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={draft.requiredFields.includes(f.value)}
                    onCheckedChange={() => update("requiredFields", toggleInArray(draft.requiredFields, f.value))}
                  />
                  <span className="text-sm">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-600" />
                الشروط
              </Label>
              <Button variant="outline" size="sm" onClick={addCondition} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                إضافة شرط
              </Button>
            </div>
            {draft.conditions.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/30">
                لا توجد شروط. أضف شرطاً لتفعيل منطق شرطي في هذه المرحلة.
              </div>
            ) : (
              <div className="space-y-2">
                {draft.conditions.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 gap-2 rounded-md border border-amber-200 bg-amber-50/40 p-2 dark:border-amber-800 dark:bg-amber-950/20 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                  >
                    <Select
                      value={c.field}
                      onValueChange={(v) => updateCondition(c.id, { field: v })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS_LIST.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={c.operator}
                      onValueChange={(v) => updateCondition(c.id, { operator: v })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {c.operator === "empty" || c.operator === "not_empty" ? (
                      <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                        — لا يحتاج قيمة —
                      </div>
                    ) : (
                      <Input
                        value={c.value}
                        onChange={(e) => updateCondition(c.id, { value: e.target.value })}
                        placeholder="القيمة"
                        className="bg-background"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                      onClick={() => removeCondition(c.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-600" />
              الإجراءات المتخذة
            </Label>
            <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
              {ACTIONS_LIST.map((a) => {
                const checked = draft.actions.includes(a.value);
                const AIcon = a.icon;
                return (
                  <label
                    key={a.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                      checked
                        ? cn(COLOR_CLASSES[a.color], "border-current/30")
                        : "hover:bg-muted/50 border-transparent"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => update("actions", toggleInArray(draft.actions, a.value))}
                    />
                    <AIcon className="h-4 w-4" />
                    <span className="text-sm">{a.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4" />
            حفظ المرحلة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// محاكاة سير العمل (Dialog)
// ============================================================

interface SimulateDialogProps {
  open: boolean;
  workflow: Workflow | null;
  onClose: () => void;
}

function SimulateDialog({ open, workflow, onClose }: SimulateDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setAutoPlay(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !autoPlay || !workflow) return;
    if (currentStep >= workflow.steps.length) {
      setAutoPlay(false);
      return;
    }
    const t = setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, workflow.steps.length));
    }, 1800);
    return () => clearTimeout(t);
  }, [open, autoPlay, currentStep, workflow]);

  if (!workflow) return null;

  const total = workflow.steps.length;
  const progress = total === 0 ? 0 : Math.round((Math.min(currentStep, total) / total) * 100);
  const isDone = currentStep >= total && total > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-600" />
            محاكاة سير العمل: {workflow.name}
          </DialogTitle>
          <DialogDescription>
            معاينة خطوة بخطوة لتدفّق سير العمل باستخدام بيانات تجريبية.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isDone ? "اكتملت المحاكاة" : `الخطوة ${Math.min(currentStep + 1, total)} من ${total}`}
              </span>
              <Badge variant="outline" className="gap-1">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Sample data */}
          <div className="rounded-md border border-cyan-200 bg-cyan-50/50 p-3 dark:border-cyan-800 dark:bg-cyan-950/20">
            <div className="flex items-center gap-1 mb-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
              <Eye className="h-3 w-3" />
              بيانات القضية التجريبية
            </div>
            <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              {Object.entries(SIM_SAMPLE_DATA).map(([k, v]) => (
                <div key={k} className="flex gap-1">
                  <span className="font-medium text-cyan-800 dark:text-cyan-200">{getFieldLabel(k)}:</span>
                  <span className="text-foreground/80">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps list */}
          <ScrollArea className="max-h-[50vh] pr-2">
            <div className="space-y-2">
              {workflow.steps.map((stage, idx) => {
                const meta = getStageTypeMeta(stage.type);
                const StageIcon = meta.icon;
                const isCurrent = idx === currentStep && !isDone;
                const isPast = idx < currentStep || isDone;
                const isFuture = idx > currentStep && !isDone;

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "rounded-md border p-3 transition-all",
                      isCurrent && cn("border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30 ring-2", COLOR_RING.emerald),
                      isPast && "border-emerald-200 bg-emerald-50/30 opacity-70 dark:border-emerald-800 dark:bg-emerald-950/10",
                      isFuture && "border-slate-200 bg-slate-50/40 opacity-60 dark:border-slate-700 dark:bg-slate-900/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          isPast && "bg-emerald-600 text-white",
                          isCurrent && cn("border-2", COLOR_CLASSES[meta.color]),
                          isFuture && "bg-slate-200 text-slate-500 dark:bg-slate-700"
                        )}
                      >
                        {isPast ? <CheckSquare className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{stage.name}</span>
                          <Badge variant="outline" className={cn("gap-1", COLOR_CLASSES[meta.color])}>
                            <StageIcon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                          {isCurrent && (
                            <Badge className="gap-1 bg-emerald-600 text-white">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              قيد التنفيذ
                            </Badge>
                          )}
                        </div>
                        {(isCurrent || isPast) && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {/* Show what happens */}
                            {stage.actions.map((a) => {
                              const am = getActionMeta(a);
                              if (!am) return null;
                              const AIcon = am.icon;
                              return (
                                <div key={a} className="flex items-center gap-1.5">
                                  <AIcon className={cn("h-3 w-3", COLOR_CLASSES[am.color].split(" ").slice(1, 2).join(" "))} />
                                  <span>{am.label}</span>
                                  {a === "send_telegram" && <span className="text-cyan-600">→ تم الإرسال للموكل</span>}
                                  {a === "create_task" && <span className="text-emerald-600">→ مهمة جديدة للمحامي</span>}
                                  {a === "create_document" && <span className="text-violet-600">→ مستند مُولّد</span>}
                                </div>
                              );
                            })}
                            {stage.requiredDocuments.length > 0 && (
                              <div className="text-xs text-amber-700 dark:text-amber-300">
                                ⚠ مطلوب: {stage.requiredDocuments.map(getDocLabel).join("، ")}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              ⏱ المدة المقدّرة: {stage.estimatedDays} يوم · المسؤول: {getRoleLabel(stage.assignedRole)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentStep(0);
                setAutoPlay(false);
              }}
              className="gap-1"
              disabled={currentStep === 0 && !autoPlay}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              إعادة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoPlay((p) => !p)}
              className="gap-1"
              disabled={isDone}
            >
              {autoPlay ? <Pause /> : <Play />}
              {autoPlay ? "إيقاف" : "تشغيل تلقائي"}
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentStep((s) => Math.min(s + 1, total))}
              disabled={isDone}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              الخطوة التالية
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            {isDone && (
              <Badge className="gap-1 bg-emerald-600 text-white">
                <CheckSquare className="h-3.5 w-3.5" />
                اكتملت المحاكاة بنجاح
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder Pause icon (lucide doesn't export Pause in our import list; reuse existing)
function Pause({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function WorkflowDesignerSection() {
  const { toast } = useToast();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Workflow | null>(null);
  const [dirty, setDirty] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCaseType, setFilterCaseType] = useState("all");

  const [stageDialog, setStageDialog] = useState<{
    open: boolean;
    stage: WorkflowStage | null;
    index: number;
  }>({ open: false, stage: null, index: -1 });

  const [simulateOpen, setSimulateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Workflow | null>(null);
  const [deleteStageConfirm, setDeleteStageConfirm] = useState<{
    stage: WorkflowStage;
    index: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ============================================================
  // جلب سير العمل
  // ============================================================

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.success && Array.isArray(data.workflows)) {
        const parsed: Workflow[] = data.workflows.map((w: Record<string, unknown>) => ({
          id: String(w.id ?? genId("wf")),
          name: String(w.name ?? "بدون اسم"),
          caseType: String(w.caseType ?? "civil"),
          steps: parseSteps(w.steps),
          isActive: Boolean(w.isActive ?? true),
          description: w.description ? String(w.description) : "",
          updatedAt: w.updatedAt ? String(w.updatedAt) : undefined,
          createdAt: w.createdAt ? String(w.createdAt) : undefined,
        }));
        setWorkflows(parsed);
        if (parsed.length > 0 && selectedId === null) {
          setSelectedId(parsed[0].id);
          setDraft(parsed[0]);
        }
      } else {
        toast({
          title: "تنبيه",
          description: data.error || "تعذّر جلب سير العمل. سيعمل المصمم في وضع محلي.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذّر الاتصال بالخادم. سيعمل المصمم في وضع محلي.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  // ============================================================
  // القوائم المفلترة
  // ============================================================

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchesType = filterCaseType === "all" || w.caseType === filterCaseType;
      return matchesSearch && matchesType;
    });
  }, [workflows, search, filterCaseType]);

  // ============================================================
  // المعالجات
  // ============================================================

  function selectWorkflow(id: string) {
    if (dirty) {
      const confirmSwitch = window.confirm(
        "لديك تغييرات غير محفوظة في سير العمل الحالي. هل تريد المتابعة بدون حفظ؟"
      );
      if (!confirmSwitch) return;
    }
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    setSelectedId(id);
    setDraft(JSON.parse(JSON.stringify(wf)));
    setDirty(false);
  }

  function handleNewWorkflow() {
    const wf = createBlankWorkflow();
    setWorkflows((prev) => [wf, ...prev]);
    setSelectedId(wf.id);
    setDraft(wf);
    setDirty(true);
    toast({ title: "تم إنشاء سير عمل جديد", description: "أضف المراحل واضبط الإعدادات ثم احفظ." });
  }

  function updateDraftField<K extends keyof Workflow>(key: K, value: Workflow[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  function handleAddStage() {
    if (!draft) return;
    const blank = createBlankStage();
    setStageDialog({ open: true, stage: blank, index: -1 });
  }

  function handleEditStage(stage: WorkflowStage, index: number) {
    setStageDialog({ open: true, stage, index });
  }

  function handleDeleteStage(stage: WorkflowStage, index: number) {
    setDeleteStageConfirm({ stage, index });
  }

  function confirmDeleteStage() {
    if (!draft || !deleteStageConfirm) return;
    const newSteps = draft.steps.filter((_, i) => i !== deleteStageConfirm.index);
    updateDraftField("steps", newSteps);
    setDeleteStageConfirm(null);
    toast({ title: "تم حذف المرحلة", description: deleteStageConfirm.stage.name });
  }

  function handleSaveStage(stage: WorkflowStage) {
    if (!draft) return;
    let newSteps: WorkflowStage[];
    if (stageDialog.index >= 0) {
      newSteps = draft.steps.map((s, i) => (i === stageDialog.index ? stage : s));
    } else {
      newSteps = [...draft.steps, stage];
    }
    updateDraftField("steps", newSteps);
    setStageDialog({ open: false, stage: null, index: -1 });
    toast({
      title: stageDialog.index >= 0 ? "تم تحديث المرحلة" : "تمت إضافة المرحلة",
      description: stage.name,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!draft) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draft.steps.findIndex((s) => s.id === active.id);
    const newIndex = draft.steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newSteps = arrayMove(draft.steps, oldIndex, newIndex);
    updateDraftField("steps", newSteps);
  }

  async function handleSaveWorkflow() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast({ title: "اسم مطلوب", description: "أدخل اسماً لسير العمل.", variant: "destructive" });
      return;
    }
    if (draft.steps.length === 0) {
      toast({ title: "لا توجد مراحل", description: "أضف مرحلة واحدة على الأقل قبل الحفظ.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description || "",
          caseType: draft.caseType,
          steps: draft.steps,
          isActive: draft.isActive,
        }),
      });
      const data = await res.json();
      if (data.success && data.workflow) {
        const savedWf: Workflow = {
          id: String(data.workflow.id),
          name: String(data.workflow.name),
          caseType: String(data.workflow.caseType ?? draft.caseType),
          steps: parseSteps(data.workflow.steps),
          isActive: Boolean(data.workflow.isActive ?? true),
          description: data.workflow.description ? String(data.workflow.description) : "",
          updatedAt: data.workflow.updatedAt ? String(data.workflow.updatedAt) : new Date().toISOString(),
          createdAt: data.workflow.createdAt ? String(data.workflow.createdAt) : undefined,
        };
        // استبدال النسخة المحلية بالنسخة المحفوظة
        setWorkflows((prev) => {
          const exists = prev.some((w) => w.id === draft.id);
          if (exists) {
            return prev.map((w) => (w.id === draft.id ? savedWf : w));
          }
          return [savedWf, ...prev.filter((w) => w.id !== draft.id)];
        });
        setSelectedId(savedWf.id);
        setDraft(savedWf);
        setDirty(false);
        toast({
          title: "تم حفظ سير العمل",
          description: `${draft.name} · ${draft.steps.length} مرحلة`,
        });
      } else {
        toast({
          title: "فشل الحفظ",
          description: data.error || "حدث خطأ غير متوقع.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذّر حفظ سير العمل. تحقق من الاتصال وحاول مجدداً.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteWorkflow() {
    if (!draft) return;
    setDeleteConfirm(draft);
  }

  function confirmDeleteWorkflow() {
    if (!deleteConfirm) return;
    const target = deleteConfirm;
    setWorkflows((prev) => prev.filter((w) => w.id !== target.id));
    const remaining = workflows.filter((w) => w.id !== target.id);
    if (selectedId === target.id) {
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setDraft(JSON.parse(JSON.stringify(remaining[0])));
      } else {
        setSelectedId(null);
        setDraft(null);
      }
    }
    setDirty(false);
    setDeleteConfirm(null);
    toast({
      title: "تم حذف سير العمل",
      description: target.name,
      variant: "destructive",
    });
  }

  function handleApplyTemplate(tpl: Template) {
    const wf: Workflow = {
      id: genId("wf"),
      name: tpl.name,
      caseType: tpl.caseType,
      steps: tpl.stages.map((s) => ({ ...s, id: genId("s") })),
      isActive: true,
      description: tpl.description,
      isLocal: true,
    };
    setWorkflows((prev) => [wf, ...prev]);
    setSelectedId(wf.id);
    setDraft(wf);
    setDirty(true);
    toast({
      title: "تم تحميل القالب",
      description: `${tpl.name} · ${tpl.stages.length} مرحلة. اضغط "حفظ" للحفظ في قاعدة البيانات.`,
    });
  }

  // ============================================================
  // العرض
  // ============================================================

  const selectedWorkflow = workflows.find((w) => w.id === selectedId) || null;
  const caseTypeMeta = draft ? getCaseTypeMeta(draft.caseType) : null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-slate-50/50 dark:bg-slate-950/30">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                  <CircuitBoard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground sm:text-xl">مصمم سير العمل</h1>
                  <p className="text-xs text-muted-foreground">
                    Workflow Designer · أتمتة الإجراءات القانونية حسب نوع القضية
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <FolderTree className="h-3 w-3" />
                  {workflows.length} سير عمل
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Layers className="h-3 w-3" />
                  {workflows.reduce((acc, w) => acc + w.steps.length, 0)} مرحلة
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadWorkflows()}
                  className="gap-1"
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  تحديث
                </Button>
                <Button
                  size="sm"
                  onClick={handleNewWorkflow}
                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  سير عمل جديد
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 px-4 py-4 sm:px-6">
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="designer" className="gap-1">
                <CircuitBoard className="h-4 w-4" />
                المصمم
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1">
                <Wand2 className="h-4 w-4" />
                القوالب الجاهزة
              </TabsTrigger>
            </TabsList>

            {/* Designer Tab */}
            <TabsContent value="designer" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
                {/* Workflow List Panel */}
                <Card className="h-fit lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-120px)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderTree className="h-4 w-4 text-emerald-600" />
                      قائمة سير العمل
                    </CardTitle>
                    <CardDescription className="text-xs">
                      اختر سير عمل للتعديل أو أنشئ جديداً.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالاسم..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-8"
                      />
                    </div>
                    {/* Filter */}
                    <Select value={filterCaseType} onValueChange={setFilterCaseType}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="كل الأنواع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الأنواع</SelectItem>
                        {CASE_TYPES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Separator />

                    {/* List */}
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-20 animate-pulse rounded-md bg-muted/50"
                          />
                        ))}
                      </div>
                    ) : filteredWorkflows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8 text-center">
                        <WorkflowIcon className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          {search || filterCaseType !== "all"
                            ? "لا نتائج مطابقة."
                            : "لا يوجد سير عمل بعد."}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleNewWorkflow}
                          className="gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          إنشاء الأول
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[60vh] lg:max-h-[calc(100vh-340px)] -mx-2 px-2">
                        <div className="space-y-2">
                          {filteredWorkflows.map((w) => {
                            const cmeta = getCaseTypeMeta(w.caseType);
                            const isActive = w.id === selectedId;
                            return (
                              <button
                                key={w.id}
                                onClick={() => selectWorkflow(w.id)}
                                className={cn(
                                  "w-full rounded-md border p-3 text-right transition-all hover:shadow-sm",
                                  isActive
                                    ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-950/20"
                                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "h-2 w-2 shrink-0 rounded-full",
                                          w.isActive ? "bg-emerald-500" : "bg-slate-400"
                                        )}
                                      />
                                      <h4 className="truncate text-sm font-semibold text-foreground">
                                        {w.name}
                                      </h4>
                                      {w.isLocal && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300">
                                          محلي
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className={cn("text-[10px] gap-0.5", COLOR_CLASSES[cmeta.color])}
                                      >
                                        <span className={cn("h-1.5 w-1.5 rounded-full", COLOR_DOT[cmeta.color])} />
                                        {cmeta.label}
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px] gap-0.5">
                                        <Layers className="h-2.5 w-2.5" />
                                        {w.steps.length} مرحلة
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      آخر تعديل: {formatRelative(w.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Designer Canvas */}
                <div className="min-w-0">
                  {!draft ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                          <CircuitBoard className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">مصمم سير العمل</h3>
                          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            اختر سير عمل من القائمة، أو أنشئ جديداً لتبدأ بتصميم مراحل العملية القانونية.
                          </p>
                        </div>
                        <Button onClick={handleNewWorkflow} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="h-4 w-4" />
                          سير عمل جديد
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {/* Settings Bar */}
                      <Card className="border-emerald-200/50 dark:border-emerald-800/50">
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Settings2 className="h-5 w-5 text-emerald-600" />
                              <Input
                                value={draft.name}
                                onChange={(e) => updateDraftField("name", e.target.value)}
                                className="h-8 w-56 text-base font-semibold"
                                placeholder="اسم سير العمل"
                              />
                              {caseTypeMeta && (
                                <Badge
                                  variant="outline"
                                  className={cn("gap-1", COLOR_CLASSES[caseTypeMeta.color])}
                                >
                                  <span className={cn("h-1.5 w-1.5 rounded-full", COLOR_DOT[caseTypeMeta.color])} />
                                  {caseTypeMeta.label}
                                </Badge>
                              )}
                              {dirty && (
                                <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/40">
                                  <CircleDot className="h-3 w-3" />
                                  غير محفوظ
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
                                    <span className="text-xs text-muted-foreground">نشط</span>
                                    <Switch
                                      checked={draft.isActive}
                                      onCheckedChange={(v) => updateDraftField("isActive", v)}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>تفعيل/تعطيل سير العمل</TooltipContent>
                              </Tooltip>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSimulateOpen(true)}
                                className="gap-1"
                                disabled={draft.steps.length === 0}
                              >
                                <Play className="h-3.5 w-3.5" />
                                محاكاة
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteWorkflow}
                                className="gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                حذف
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void handleSaveWorkflow()}
                                disabled={saving || !dirty}
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                {saving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                {saving ? "جارٍ الحفظ..." : "حفظ"}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">نوع القضية</Label>
                              <Select
                                value={draft.caseType}
                                onValueChange={(v) => updateDraftField("caseType", v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CASE_TYPES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      <div className="flex items-center gap-2">
                                        <span className={cn("h-1.5 w-1.5 rounded-full", COLOR_DOT[c.color])} />
                                        {c.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">الوصف</Label>
                              <Input
                                value={draft.description || ""}
                                onChange={(e) => updateDraftField("description", e.target.value)}
                                placeholder="وصف مختصر لسير العمل..."
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 text-center dark:border-slate-700 dark:bg-slate-900/30">
                              <div className="text-lg font-bold text-foreground">{draft.steps.length}</div>
                              <div className="text-[10px] text-muted-foreground">إجمالي المراحل</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 text-center dark:border-slate-700 dark:bg-slate-900/30">
                              <div className="text-lg font-bold text-foreground">
                                {draft.steps.reduce((a, s) => a + s.estimatedDays, 0)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">إجمالي الأيام</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 text-center dark:border-slate-700 dark:bg-slate-900/30">
                              <div className="text-lg font-bold text-foreground">
                                {Array.from(new Set(draft.steps.flatMap((s) => s.actions))).length}
                              </div>
                              <div className="text-[10px] text-muted-foreground">إجراءات فريدة</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 text-center dark:border-slate-700 dark:bg-slate-900/30">
                              <div className="text-lg font-bold text-foreground">
                                {Array.from(new Set(draft.steps.map((s) => s.assignedRole))).length}
                              </div>
                              <div className="text-[10px] text-muted-foreground">أدوار مساهمة</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Canvas with dotted background */}
                      <div
                        className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle, hsl(var(--border, 215 28% 90%)) 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <WorkflowIcon className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-foreground">مراحل سير العمل</h3>
                            <Badge variant="secondary" className="text-[10px]">
                              {draft.steps.length} مرحلة
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddStage}
                            className="gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            إضافة مرحلة
                          </Button>
                        </div>

                        {draft.steps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-white/60 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">لا توجد مراحل بعد</h4>
                              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                ابدأ بإضافة المراحل (إنذار، رفع دعوى، جلسات، حكم...) ثم اسحبها لإعادة ترتيبها.
                              </p>
                            </div>
                            <Button
                              onClick={handleAddStage}
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Plus className="h-4 w-4" />
                              إضافة أول مرحلة
                            </Button>
                          </div>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={draft.steps.map((s) => s.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-0">
                                {draft.steps.map((stage, idx) => (
                                  <SortableStageCard
                                    key={stage.id}
                                    stage={stage}
                                    index={idx}
                                    total={draft.steps.length}
                                    onEdit={handleEditStage}
                                    onDelete={handleDeleteStage}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}

                        {draft.steps.length > 0 && (
                          <div className="mt-4 flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAddStage}
                              className="gap-1 text-muted-foreground"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              إضافة مرحلة في النهاية
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-emerald-600" />
                    القوالب الجاهزة
                  </CardTitle>
                  <CardDescription>
                    قوالب معدّة سابقاً لأنواع القضايا الشائعة. اختر قالباً لتحميله في المصمم.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {TEMPLATES.map((tpl) => {
                      const TplIcon = tpl.icon;
                      const cmeta = getCaseTypeMeta(tpl.caseType);
                      return (
                        <Card
                          key={tpl.id}
                          className={cn(
                            "group relative overflow-hidden transition-all hover:shadow-md",
                            "border-r-4"
                          )}
                          style={{
                            borderRightColor: `var(--color-${tpl.color}-500, currentColor)`,
                          }}
                        >
                          <div
                            className={cn(
                              "absolute left-0 top-0 h-24 w-24 -translate-x-8 -translate-y-8 rounded-full opacity-10 blur-2xl",
                              COLOR_DOT[tpl.color]
                            )}
                          />
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg border",
                                  COLOR_CLASSES[tpl.color]
                                )}
                              >
                                <TplIcon className="h-5 w-5" />
                              </div>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] gap-0.5", COLOR_CLASSES[cmeta.color])}
                              >
                                {cmeta.label}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{tpl.name}</CardTitle>
                            <CardDescription className="text-xs">{tpl.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Mini preview */}
                            <div className="space-y-1">
                              {tpl.stages.slice(0, 5).map((s, i) => {
                                const meta = getStageTypeMeta(s.type);
                                const SIcon = meta.icon;
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-2 py-1 dark:border-slate-800 dark:bg-slate-900/30"
                                  >
                                    <div
                                      className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                        COLOR_CLASSES[meta.color]
                                      )}
                                    >
                                      {i + 1}
                                    </div>
                                    <SIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate text-xs text-foreground">{s.name}</span>
                                  </div>
                                );
                              })}
                              {tpl.stages.length > 5 && (
                                <div className="text-center text-[10px] text-muted-foreground">
                                  +{tpl.stages.length - 5} مراحل أخرى
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="text-[10px] gap-0.5">
                                <Layers className="h-2.5 w-2.5" />
                                {tpl.stages.length} مرحلة
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] gap-0.5">
                                <CalendarClock className="h-2.5 w-2.5" />
                                {tpl.stages.reduce((a, s) => a + s.estimatedDays, 0)} يوم
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApplyTemplate(tpl)}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              تحميل القالب في المصمم
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Stage Editor Dialog */}
        <StageEditorDialog
          open={stageDialog.open}
          stage={stageDialog.stage}
          onClose={() => setStageDialog({ open: false, stage: null, index: -1 })}
          onSave={handleSaveStage}
        />

        {/* Simulate Dialog */}
        <SimulateDialog
          open={simulateOpen}
          workflow={draft}
          onClose={() => setSimulateOpen(false)}
        />

        {/* Delete Workflow Confirmation */}
        <AlertDialog
          open={!!deleteConfirm}
          onOpenChange={(o) => !o && setDeleteConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف سير العمل{" "}
                <span className="font-semibold text-foreground">{deleteConfirm?.name}</span>؟
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteWorkflow}
                className="bg-rose-600 hover:bg-rose-700"
              >
                نعم، احذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Stage Confirmation */}
        <AlertDialog
          open={!!deleteStageConfirm}
          onOpenChange={(o) => !o && setDeleteStageConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المرحلة</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد حذف المرحلة{" "}
                <span className="font-semibold text-foreground">
                  {deleteStageConfirm?.stage.name}
                </span>
                ؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteStage}
                className="bg-rose-600 hover:bg-rose-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
