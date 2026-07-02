"use client";

/* -------------------------------------------------------------------------- */
/*                    Automation Builder Section (Task 28)                    */
/*         Visual automation rule builder for the legal system                */
/* -------------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  Bell,
  BellRing,
  Brain,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Clock,
  Code,
  Copy,
  Eye,
  FileCheck,
  FileSignature,
  FileText,
  FileUp,
  FileX,
  Filter,
  FolderCheck,
  FolderPlus,
  FolderX,
  Gavel,
  History,
  Link2,
  Loader2,
  LogIn,
  Mail,
  MessageCircle,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  ScanText,
  Send,
  Settings2,
  Sparkles,
  StickyNote,
  Trash2,
  UserCog,
  UserPlus,
  Workflow,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  value2?: string;
}

interface ActionItem {
  id: string;
  type: string;
  config: Record<string, string>;
  delayValue: number;
  delayUnit: "minute" | "hour" | "day";
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger: string;
  conditions: string;
  actions: string;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional client-side enrichment (mock fields for display)
  lastTriggered?: string;
  successRate?: number;
  runs?: number;
}

interface AutomationLog {
  id: string;
  ruleId?: string | null;
  ruleName?: string | null;
  trigger?: string | null;
  result: "success" | "failed" | "running";
  executionTime?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  user?: string;
  details?: string;
}

interface BuilderState {
  id?: string;
  name: string;
  description: string;
  trigger: string;
  triggerLabel: string;
  conditions: Condition[];
  conditionLogic: "and" | "or";
  actions: ActionItem[];
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                  */
/* -------------------------------------------------------------------------- */

interface TriggerDef {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const TRIGGERS: TriggerDef[] = [
  { value: "client.created", label: "إنشاء موكل", icon: UserPlus, group: "الموكلون" },
  { value: "client.updated", label: "تعديل موكل", icon: UserCog, group: "الموكلون" },
  { value: "case.created", label: "إنشاء قضية", icon: FolderPlus, group: "القضايا" },
  { value: "precase.converted", label: "تحويل ملف تجهيز لقضية", icon: FileCheck, group: "القضايا" },
  { value: "case.closed", label: "إغلاق القضية", icon: FolderCheck, group: "القضايا" },
  { value: "session.created", label: "إضافة جلسة", icon: Calendar, group: "الجلسات" },
  { value: "session.updated", label: "تعديل جلسة", icon: CalendarClock, group: "الجلسات" },
  { value: "judgment.issued", label: "صدور حكم", icon: Gavel, group: "الجلسات" },
  { value: "execution.started", label: "بدء تنفيذ", icon: PlayCircle, group: "التنفيذ" },
  { value: "document.uploaded", label: "رفع مستند", icon: FileUp, group: "المستندات" },
  { value: "document.ocr_completed", label: "تحليل OCR", icon: ScanText, group: "المستندات" },
  { value: "memo.created", label: "إنشاء مذكرة", icon: StickyNote, group: "المستندات" },
  { value: "poa.created", label: "إضافة توكيل", icon: FileSignature, group: "التوكيلات" },
  { value: "poa.expired", label: "انتهاء توكيل", icon: FileSignature, group: "التوكيلات" },
  { value: "task.created", label: "إنشاء مهمة", icon: CheckSquare, group: "المهام" },
  { value: "task.overdue", label: "انتهاء موعد", icon: AlertTriangle, group: "المهام" },
  { value: "user.login", label: "تسجيل دخول", icon: LogIn, group: "النظام" },
  { value: "telegram.sent", label: "إرسال Telegram", icon: Send, group: "النظام" },
  { value: "telegram.received", label: "تلقى Telegram", icon: MessageCircle, group: "النظام" },
];

interface FieldDef {
  value: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  options?: string[];
}

const CONDITION_FIELDS: FieldDef[] = [
  { value: "caseType", label: "نوع القضية", type: "select", options: ["مدني", "جنائي", "تجاري", "إداري", "أسرة", "عمل"] },
  { value: "court", label: "المحكمة", type: "select", options: ["الاستئناف", "ابتدائي", "نقض", "الأسرة", "الجنائي", "الاقتصادي"] },
  { value: "user", label: "المستخدم", type: "text" },
  { value: "role", label: "الدور", type: "select", options: ["محامي", "محاضر", "مدير مكتب", "مساعد", "محاسب"] },
  { value: "client", label: "الموكل", type: "text" },
  { value: "poaType", label: "نوع التوكيل", type: "select", options: ["خاص", "عام", "إداري"] },
  { value: "hasDocument", label: "وجود مستند", type: "select", options: ["نعم", "لا"] },
  { value: "noDocument", label: "عدم وجود مستند", type: "select", options: ["نعم", "لا"] },
  { value: "hasSession", label: "وجود جلسة", type: "select", options: ["نعم", "لا"] },
  { value: "date", label: "تاريخ", type: "date" },
  { value: "daysCount", label: "عدد الأيام", type: "number" },
  { value: "documentsCount", label: "عدد المستندات", type: "number" },
  { value: "executionStatus", label: "حالة التنفيذ", type: "select", options: ["جديد", "جارٍ", "متوقف", "منتهٍ"] },
];

const OPERATORS = [
  { value: "eq", label: "يساوي" },
  { value: "neq", label: "لا يساوي" },
  { value: "contains", label: "يحتوي" },
  { value: "gt", label: "أكبر من" },
  { value: "lt", label: "أصغر من" },
  { value: "between", label: "بين" },
  { value: "in", label: "في القائمة" },
];

interface ActionDef {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  configFields: { key: string; label: string; type: "text" | "textarea" | "number" | "select"; options?: string[] }[];
}

const ACTION_DEFS: ActionDef[] = [
  {
    value: "create_task",
    label: "إنشاء مهمة",
    icon: CheckSquare,
    configFields: [
      { key: "title", label: "عنوان المهمة", type: "text" },
      { key: "assignee", label: "المسؤول", type: "select", options: ["المحامي المسؤول", "مدير المكتب", "المستخدم الحالي", "فريق محدد"] },
      { key: "dueOffset", label: "موعد التنفيذ بعد (أيام)", type: "number" },
    ],
  },
  {
    value: "create_reminder",
    label: "إنشاء تذكير",
    icon: Bell,
    configFields: [
      { key: "title", label: "نص التذكير", type: "text" },
      { key: "reminderOffset", label: "بعد (أيام)", type: "number" },
      { key: "channel", label: "القناة", type: "select", options: ["نظامي", "Telegram", "بريد", "كلاهما"] },
    ],
  },
  {
    value: "create_notification",
    label: "إنشاء إشعار",
    icon: BellRing,
    configFields: [
      { key: "message", label: "نص الإشعار", type: "textarea" },
      { key: "target", label: "المستلمون", type: "select", options: ["المستخدم الحالي", "المحامي المسؤول", "كل الفريق", "المدير"] },
      { key: "priority", label: "الأولوية", type: "select", options: ["عادية", "هامة", "عاجلة"] },
    ],
  },
  {
    value: "run_ai",
    label: "تشغيل AI",
    icon: Brain,
    configFields: [
      { key: "prompt", label: "الموجّه (Prompt)", type: "textarea" },
      { key: "model", label: "النموذج", type: "select", options: ["default", "advanced", "fast"] },
      { key: "saveResult", label: "حفظ النتيجة", type: "select", options: ["في المذكرة", "في Timeline", "كإشعار"] },
    ],
  },
  {
    value: "run_ocr",
    label: "تشغيل OCR",
    icon: ScanText,
    configFields: [
      { key: "language", label: "اللغة", type: "select", options: ["العربية", "الإنجليزية", "كلاهما"] },
      { key: "autoLink", label: "ربط تلقائي بالقضية", type: "select", options: ["نعم", "لا"] },
    ],
  },
  {
    value: "create_document",
    label: "إنشاء مستند",
    icon: FileText,
    configFields: [
      { key: "template", label: "القالب", type: "select", options: ["مذكرة دفاع", "صحيفة دعوى", "عقد", "إخطار"] },
      { key: "title", label: "عنوان المستند", type: "text" },
    ],
  },
  {
    value: "update_status",
    label: "تحديث حالة",
    icon: RefreshCw,
    configFields: [
      { key: "entity", label: "الكيان", type: "select", options: ["القضية", "المهمة", "الموكل", "التنفيذ"] },
      { key: "status", label: "الحالة الجديدة", type: "text" },
    ],
  },
  {
    value: "send_telegram",
    label: "إرسال Telegram",
    icon: Send,
    configFields: [
      { key: "recipient", label: "المستلم", type: "select", options: ["المحامي المسؤول", "المدير", "قناة المكتب", "المستخدم الحالي"] },
      { key: "message", label: "نص الرسالة", type: "textarea" },
    ],
  },
  {
    value: "send_email",
    label: "إرسال بريد",
    icon: Mail,
    configFields: [
      { key: "to", label: "إلى", type: "text" },
      { key: "subject", label: "الموضوع", type: "text" },
      { key: "body", label: "المحتوى", type: "textarea" },
    ],
  },
  {
    value: "create_session",
    label: "إنشاء جلسة",
    icon: Calendar,
    configFields: [
      { key: "title", label: "عنوان الجلسة", type: "text" },
      { key: "dateOffset", label: "بعد (أيام)", type: "number" },
      { key: "court", label: "المحكمة", type: "text" },
    ],
  },
  {
    value: "create_execution",
    label: "إنشاء تنفيذ",
    icon: PlayCircle,
    configFields: [
      { key: "title", label: "عنوان التنفيذ", type: "text" },
      { key: "type", label: "النوع", type: "select", options: ["تنفيذ حكم", "تنفيذ أمر", "تنفيذ عقاري"] },
    ],
  },
  {
    value: "create_memo",
    label: "إنشاء مذكرة",
    icon: StickyNote,
    configFields: [
      { key: "title", label: "عنوان المذكرة", type: "text" },
      { key: "content", label: "المحتوى", type: "textarea" },
    ],
  },
  {
    value: "link_document",
    label: "ربط مستند",
    icon: Link2,
    configFields: [
      { key: "mode", label: "النوع", type: "select", options: ["تلقائي", "يدوي"] },
      { key: "caseRef", label: "مرجع القضية", type: "text" },
    ],
  },
  {
    value: "copy_data",
    label: "نسخ بيانات",
    icon: Copy,
    configFields: [
      { key: "from", label: "من", type: "select", options: ["الموكل", "القضية", "المستند"] },
      { key: "to", label: "إلى", type: "select", options: ["القضية", "المذكرة", "التذكير"] },
      { key: "fields", label: "الحقول", type: "text" },
    ],
  },
  {
    value: "archive",
    label: "أرشفة",
    icon: Archive,
    configFields: [
      { key: "entity", label: "الكيان", type: "select", options: ["القضية", "المستند", "الموكل"] },
      { key: "mode", label: "النوع", type: "select", options: ["أرشفة", "نسخ احتياطي"] },
    ],
  },
  {
    value: "close_file",
    label: "إغلاق ملف",
    icon: FolderX,
    configFields: [
      { key: "entity", label: "الكيان", type: "select", options: ["القضية", "التنفيذ"] },
      { key: "reason", label: "السبب", type: "text" },
    ],
  },
  {
    value: "run_script",
    label: "تشغيل سكريبت",
    icon: Code,
    configFields: [
      { key: "script", label: "اسم السكريبت", type: "select", options: ["إعداد بيانات", "تحديث KPIs", "تقرير يومي", "مخصص"] },
      { key: "args", label: "المعاملات (JSON)", type: "textarea" },
    ],
  },
];

interface TemplateDef {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trigger: string;
  conditions: Omit<Condition, "id">[];
  actions: Omit<ActionItem, "id">[];
  tags: string[];
  color: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "tpl-pre-session",
    title: "تذكير قبل الجلسة",
    description: "إرسال تذكيرات وإشعارات قبل الجلسة بثلاثة أيام مع تحديث AI",
    icon: CalendarClock,
    trigger: "session.created",
    conditions: [
      { field: "daysCount", operator: "lt", value: "3" },
    ],
    actions: [
      { type: "create_reminder", config: { title: "جلسة قضائية قادمة", reminderOffset: "1", channel: "كلاهما" }, delayValue: 0, delayUnit: "day" },
      { type: "create_notification", config: { message: "لديك جلسة خلال 3 أيام", target: "المحامي المسؤول", priority: "هامة" }, delayValue: 0, delayUnit: "day" },
      { type: "send_telegram", config: { recipient: "المحامي المسؤول", message: "تذكير: جلسة قضائية بعد 3 أيام" }, delayValue: 0, delayUnit: "day" },
      { type: "run_ai", config: { prompt: "حضّر ملخص القضية قبل الجلسة", model: "default", saveResult: "في Timeline" }, delayValue: 0, delayUnit: "day" },
    ],
    tags: ["الجلسات", "تذكيرات", "AI"],
    color: "amber",
  },
  {
    id: "tpl-poa-expired",
    title: "تنبيه انتهاء التوكيل",
    description: "إشعار فوري عند انتهاء التوكيل مع إنشاء مهمة تجديد",
    icon: FileSignature,
    trigger: "poa.expired",
    conditions: [],
    actions: [
      { type: "create_notification", config: { message: "انتهى توكيل الموكل، يلزم التجديد", target: "المحامي المسؤول", priority: "عاجلة" }, delayValue: 0, delayUnit: "minute" },
      { type: "create_task", config: { title: "تجديد توكيل الموكل", assignee: "المحامي المسؤول", dueOffset: "7" }, delayValue: 0, delayUnit: "minute" },
      { type: "send_telegram", config: { recipient: "المحامي المسؤول", message: "تنبيه: انتهاء توكيل - يلزم اتخاذ إجراء" }, delayValue: 0, delayUnit: "minute" },
    ],
    tags: ["التوكيلات", "تنبيهات"],
    color: "rose",
  },
  {
    id: "tpl-doc-dashboard",
    title: "تحديث Dashboard عند رفع مستند",
    description: "تحديث لوحة المعلومات عند رفع مستند جديد مع تصنيف AI",
    icon: FileUp,
    trigger: "document.uploaded",
    conditions: [],
    actions: [
      { type: "run_ai", config: { prompt: "صنّف المستند واقترح ربطه بقضية", model: "default", saveResult: "في Timeline" }, delayValue: 0, delayUnit: "minute" },
      { type: "run_script", config: { script: "تحديث KPIs", args: "{}" }, delayValue: 0, delayUnit: "minute" },
      { type: "create_notification", config: { message: "تم رفع مستند جديد وتم تصنيفه", target: "المستخدم الحالي", priority: "عادية" }, delayValue: 0, delayUnit: "minute" },
    ],
    tags: ["المستندات", "AI", "Dashboard"],
    color: "cyan",
  },
  {
    id: "tpl-task-overdue",
    title: "تنبيه المهام المتأخرة",
    description: "إشعار المدير وإنشاء مهمة متابعة عند تأخر المهمة",
    icon: AlertTriangle,
    trigger: "task.overdue",
    conditions: [],
    actions: [
      { type: "create_notification", config: { message: "تأخرت مهمة عن موعدها", target: "المحامي المسؤول", priority: "هامة" }, delayValue: 0, delayUnit: "minute" },
      { type: "send_telegram", config: { recipient: "المدير", message: "تنبيه: مهمة متأخرة، يلزم المتابعة" }, delayValue: 0, delayUnit: "minute" },
      { type: "create_task", config: { title: "متابعة مهمة متأخرة", assignee: "مدير المكتب", dueOffset: "2" }, delayValue: 0, delayUnit: "minute" },
    ],
    tags: ["المهام", "تنبيهات"],
    color: "amber",
  },
  {
    id: "tpl-archive-closed",
    title: "أرشفة القضايا المغلقة",
    description: "أرشفة تلقائية للقضايا المغلقة بعد 30 يوماً مع إشعار الإدارة",
    icon: Archive,
    trigger: "case.closed",
    conditions: [
      { field: "daysCount", operator: "gt", value: "30" },
    ],
    actions: [
      { type: "archive", config: { entity: "القضية", mode: "أرشفة" }, delayValue: 30, delayUnit: "day" },
      { type: "create_notification", config: { message: "تمت أرشفة القضية بعد الإغلاق", target: "المدير", priority: "عادية" }, delayValue: 30, delayUnit: "day" },
    ],
    tags: ["القضايا", "أرشفة"],
    color: "slate",
  },
  {
    id: "tpl-auto-ocr",
    title: "تحليل OCR تلقائي",
    description: "تشغيل OCR تلقائي على الصور وملفات PDF المقترحة بالربط",
    icon: ScanText,
    trigger: "document.uploaded",
    conditions: [],
    actions: [
      { type: "run_ocr", config: { language: "العربية", autoLink: "نعم" }, delayValue: 0, delayUnit: "minute" },
      { type: "link_document", config: { mode: "تلقائي", caseRef: "auto" }, delayValue: 0, delayUnit: "minute" },
      { type: "run_ai", config: { prompt: "اقترح تصنيفاً وربطاً للمستند", model: "fast", saveResult: "كإشعار" }, delayValue: 1, delayUnit: "minute" },
    ],
    tags: ["OCR", "المستندات", "AI"],
    color: "cyan",
  },
  {
    id: "tpl-new-case-alert",
    title: "إشعار القضية الجديدة",
    description: "إشعار فريق العمل وإضافة Timeline وقائمة تحقق عند فتح قضية",
    icon: FolderPlus,
    trigger: "case.created",
    conditions: [],
    actions: [
      { type: "send_telegram", config: { recipient: "قناة المكتب", message: "تم إنشاء قضية جديدة: {{case.title}}" }, delayValue: 0, delayUnit: "minute" },
      { type: "run_script", config: { script: "إعداد بيانات", args: "{\"type\":\"checklist\"}" }, delayValue: 0, delayUnit: "minute" },
      { type: "create_task", config: { title: "مراجعة ملف القضية الجديدة", assignee: "المحامي المسؤول", dueOffset: "3" }, delayValue: 0, delayUnit: "minute" },
      { type: "create_notification", config: { message: "قضية جديدة بحاجة لمراجعة", target: "كل الفريق", priority: "عادية" }, delayValue: 0, delayUnit: "minute" },
    ],
    tags: ["القضايا", "إشعارات", "Telegram"],
    color: "emerald",
  },
];

/* -------------------------------------------------------------------------- */
/*                              Helper functions                               */
/* -------------------------------------------------------------------------- */

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function triggerDef(value: string): TriggerDef {
  return TRIGGERS.find((t) => t.value === value) || TRIGGERS[0];
}

function actionDef(value: string): ActionDef {
  return ACTION_DEFS.find((a) => a.value === value) || ACTION_DEFS[0];
}

function fieldDef(value: string): FieldDef {
  return CONDITION_FIELDS.find((f) => f.value === value) || CONDITION_FIELDS[0];
}

function operatorLabel(value: string): string {
  return OPERATORS.find((o) => o.value === value)?.label || value;
}

function fieldLabel(value: string): string {
  return CONDITION_FIELDS.find((f) => f.value === value)?.label || value;
}

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `قبل ${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `قبل ${hr} ساعة`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `قبل ${day} يوم`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `قبل ${mo} شهر`;
  return `قبل ${Math.floor(mo / 12)} سنة`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function emptyBuilder(): BuilderState {
  return {
    name: "",
    description: "",
    trigger: TRIGGERS[0].value,
    triggerLabel: TRIGGERS[0].label,
    conditions: [],
    conditionLogic: "and",
    actions: [],
    isActive: true,
  };
}

/* -------------------------------------------------------------------------- */
/*                       Mock Logs (25 samples) — RTL                         */
/* -------------------------------------------------------------------------- */

const MOCK_LOGS: AutomationLog[] = Array.from({ length: 25 }, (_, i) => {
  const results: AutomationLog["result"][] = ["success", "success", "success", "success", "failed", "success", "running"];
  const rules = [
    "تذكير قبل الجلسة",
    "تنبيه انتهاء التوكيل",
    "تحديث Dashboard عند رفع مستند",
    "تنبيه المهام المتأخرة",
    "أرشفة القضايا المغلقة",
    "تحليل OCR تلقائي",
    "إشعار القضية الجديدة",
  ];
  const triggers = ["session.created", "poa.expired", "document.uploaded", "task.overdue", "case.closed", "document.uploaded", "case.created"];
  const users = ["أحمد علي", "محمد سامي", "سارة حسن", "خالد عبد الله", "نورا إبراهيم", "ماجد فؤاد", "ليلى كمال"];
  const details = [
    "تم تنفيذ جميع الإجراءات بنجاح",
    "فشل الاتصال بخدمة Telegram",
    "تم إنشاء المهمة المرتبطة",
    "تم إرسال الإشعار بنجاح",
    "قيد المعالجة - بانتظار نتيجة OCR",
    "تم تشغيل سكريبت تحديث KPIs",
    "لم يتم العثور على القضية المرتبطة",
    "تم إنشاء التذكير بنجاح",
    "AI انتهى من التحليل",
    "تأخر في تنفيذ الإجراء بسبب معدّل الطلبات",
  ];
  const result = results[i % results.length];
  const minutesAgo = (i + 1) * 13 + (i % 5) * 7;
  const createdAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  return {
    id: `log-${i + 1}`,
    ruleId: `rule-mock-${(i % 7) + 1}`,
    ruleName: rules[i % rules.length],
    trigger: triggers[i % triggers.length],
    result,
    executionTime: result === "running" ? null : 120 + ((i * 37) % 1800),
    errorMessage: result === "failed" ? details[(i + 2) % details.length] : null,
    createdAt,
    user: users[i % users.length],
    details: details[i % details.length],
  };
});

/* -------------------------------------------------------------------------- */
/*                            Small UI helpers                                */
/* -------------------------------------------------------------------------- */

function TriggerIcon({ value, className }: { value: string; className?: string }) {
  const Icon = triggerDef(value).icon;
  return <Icon className={className} />;
}

function ActionIcon({ value, className }: { value: string; className?: string }) {
  const Icon = actionDef(value).icon;
  return <Icon className={className} />;
}

function StatusBadge({ status }: { status: AutomationLog["result"] }) {
  if (status === "success")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
        <CheckCircle2 className="h-3 w-3 ml-1" /> نجح
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
        <X className="h-3 w-3 ml-1" /> فشل
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
      <Loader2 className="h-3 w-3 ml-1 animate-spin" /> قيد التنفيذ
    </Badge>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-1 select-none">
      <div className="flex items-center gap-2">
        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600" />
        <ChevronDown className="h-4 w-4 text-slate-400 -mr-[18px] -mt-3" />
      </div>
      <span className="text-[10px] text-slate-400 mt-0.5 tracking-wide">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export function AutomationBuilderSection() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>("rules");
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [builder, setBuilder] = useState<BuilderState>(emptyBuilder);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Filters for execution log
  const [logRuleFilter, setLogRuleFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");
  const [logDateFilter, setLogDateFilter] = useState<string>("all");

  // Test dialog
  const [testResult, setTestResult] = useState<null | { ok: boolean; message: string; steps: { label: string; status: "ok" | "fail" | "skip"; detail?: string }[] }>(null);
  const [testRunning, setTestRunning] = useState<boolean>(false);

  // Confirm delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewLogFor, setViewLogFor] = useState<AutomationRule | null>(null);

  /* ----- Load rules + logs ----- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automation", { cache: "no-store" });
      const data = await res.json();
      const incomingRules: AutomationRule[] = (data?.rules || []).map((r: AutomationRule) => ({
        ...r,
        lastTriggered: r.lastTriggered || null,
        successRate: typeof r.successRate === "number" ? r.successRate : Math.floor(80 + Math.random() * 19),
        runs: typeof r.runs === "number" ? r.runs : Math.floor(Math.random() * 200),
      }));
      const incomingLogs: AutomationLog[] = (data?.logs || []).map((l: AutomationLog) => ({
        ...l,
        result: l.result === "success" || l.result === "failed" || l.result === "running" ? l.result : "success",
        user: l.user || "النظام",
        details: l.details || l.errorMessage || "",
      }));
      setRules(incomingRules.length > 0 ? incomingRules : MOCK_RULES());
      setLogs(incomingLogs.length > 0 ? incomingLogs : MOCK_LOGS);
    } catch {
      setRules(MOCK_RULES());
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ----- Save rule ----- */
  const handleSave = useCallback(async () => {
    if (!builder.name.trim()) {
      toast({ title: "تنبيه", description: "الرجاء إدخال اسم للقاعدة", variant: "destructive" });
      return;
    }
    if (!builder.trigger) {
      toast({ title: "تنبيه", description: "الرجاء اختيار نوع المُحفّز", variant: "destructive" });
      return;
    }
    if (builder.actions.length === 0) {
      toast({ title: "تنبيه", description: "الرجاء إضافة إجراء واحد على الأقل", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: builder.name.trim(),
        description: builder.description.trim(),
        trigger: builder.trigger,
        conditions: builder.conditions,
        actions: builder.actions,
        isActive: builder.isActive,
      };
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ title: "تم الحفظ", description: "تم حفظ قاعدة الأتمتة بنجاح" });
        await loadData();
        setActiveTab("rules");
        setBuilder(emptyBuilder());
        setIsEditing(false);
      } else {
        toast({ title: "خطأ", description: data?.error || "تعذّر حفظ القاعدة", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ", description: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [builder, loadData, toast]);

  /* ----- Test run (simulate) ----- */
  const handleTest = useCallback(() => {
    setTestRunning(true);
    setTestResult(null);
    setTimeout(() => {
      const steps = [
        { label: `قراءة المُحفّز: ${triggerDef(builder.trigger).label}`, status: "ok" as const, detail: `نوع: ${builder.trigger}` },
        ...builder.conditions.map((c) => ({
          label: `تقييم الشرط: ${fieldLabel(c.field)} ${operatorLabel(c.operator)} ${c.value}`,
          status: (Math.random() > 0.2 ? "ok" : "skip") as "ok" | "skip",
          detail: c.value ? `القيمة: ${c.value}` : "بدون قيمة",
        })),
        ...builder.actions.map((a) => ({
          label: `تنفيذ: ${actionDef(a.type).label}`,
          status: (Math.random() > 0.15 ? "ok" : "fail") as "ok" | "fail",
          detail: a.delayValue > 0 ? `تأخير ${a.delayValue} ${a.delayUnit}` : "فوري",
        })),
      ];
      const hasFail = steps.some((s) => s.status === "fail");
      setTestResult({
        ok: !hasFail,
        message: hasFail ? "اكتمل الاختبار مع بعض الأخطاء" : "اكتمل الاختبار بنجاح",
        steps,
      });
      setTestRunning(false);
    }, 1100);
  }, [builder]);

  /* ----- Templates → load into builder ----- */
  const loadTemplate = useCallback((tpl: TemplateDef) => {
    setBuilder({
      name: tpl.title,
      description: tpl.description,
      trigger: tpl.trigger,
      triggerLabel: triggerDef(tpl.trigger).label,
      conditions: tpl.conditions.map((c) => ({ ...c, id: uid() })),
      conditionLogic: "and",
      actions: tpl.actions.map((a) => ({ ...a, id: uid() })),
      isActive: true,
    });
    setIsEditing(false);
    setActiveTab("builder");
    toast({ title: "تم تحميل القالب", description: `${tpl.title} — يمكنك تعديله وحفظه` });
  }, [toast]);

  /* ----- Rule card actions ----- */
  const editRule = useCallback((rule: AutomationRule) => {
    const conds = safeParse<Condition[]>(rule.conditions, []);
    const acts = safeParse<ActionItem[]>(rule.actions, []);
    setBuilder({
      id: rule.id,
      name: rule.name,
      description: rule.description || "",
      trigger: rule.trigger,
      triggerLabel: triggerDef(rule.trigger).label,
      conditions: conds.map((c) => ({ ...c, id: c.id || uid() })),
      conditionLogic: "and",
      actions: acts.map((a) => ({ ...a, id: a.id || uid() })),
      isActive: rule.isActive,
    });
    setIsEditing(true);
    setActiveTab("builder");
  }, []);

  const duplicateRule = useCallback((rule: AutomationRule) => {
    const conds = safeParse<Condition[]>(rule.conditions, []);
    const acts = safeParse<ActionItem[]>(rule.actions, []);
    setBuilder({
      name: `${rule.name} (نسخة)`,
      description: rule.description || "",
      trigger: rule.trigger,
      triggerLabel: triggerDef(rule.trigger).label,
      conditions: conds.map((c) => ({ ...c, id: uid() })),
      conditionLogic: "and",
      actions: acts.map((a) => ({ ...a, id: uid() })),
      isActive: true,
    });
    setIsEditing(false);
    setActiveTab("builder");
    toast({ title: "تم النسخ", description: "تم تحميل نسخة من القاعدة في المنشئ" });
  }, [toast]);

  const testRunRule = useCallback((rule: AutomationRule) => {
    const conds = safeParse<Condition[]>(rule.conditions, []);
    const acts = safeParse<ActionItem[]>(rule.actions, []);
    setBuilder({
      id: rule.id,
      name: rule.name,
      description: rule.description || "",
      trigger: rule.trigger,
      triggerLabel: triggerDef(rule.trigger).label,
      conditions: conds.map((c) => ({ ...c, id: c.id || uid() })),
      conditionLogic: "and",
      actions: acts.map((a) => ({ ...a, id: a.id || uid() })),
      isActive: rule.isActive,
    });
    setActiveTab("builder");
    setTimeout(() => handleTest(), 200);
  }, [handleTest]);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
    toast({ title: "تم الحذف", description: "تم حذف قاعدة الأتمتة" });
  }, [toast]);

  const toggleRuleActive = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  }, []);

  /* ----- Builder: condition operations ----- */
  const addCondition = useCallback(() => {
    setBuilder((b) => ({
      ...b,
      conditions: [...b.conditions, { id: uid(), field: CONDITION_FIELDS[0].value, operator: "eq", value: "" }],
    }));
  }, []);

  const updateCondition = useCallback((id: string, patch: Partial<Condition>) => {
    setBuilder((b) => ({
      ...b,
      conditions: b.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setBuilder((b) => ({ ...b, conditions: b.conditions.filter((c) => c.id !== id) }));
  }, []);

  /* ----- Builder: action operations ----- */
  const addAction = useCallback(() => {
    setBuilder((b) => ({
      ...b,
      actions: [
        ...b.actions,
        {
          id: uid(),
          type: ACTION_DEFS[0].value,
          config: {},
          delayValue: 0,
          delayUnit: "minute",
        },
      ],
    }));
  }, []);

  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    setBuilder((b) => ({
      ...b,
      actions: b.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const updateActionConfig = useCallback((id: string, key: string, value: string) => {
    setBuilder((b) => ({
      ...b,
      actions: b.actions.map((a) => (a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a)),
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setBuilder((b) => ({ ...b, actions: b.actions.filter((a) => a.id !== id) }));
  }, []);

  /* ----- Builder: trigger ----- */
  const setTrigger = useCallback((value: string) => {
    setBuilder((b) => ({ ...b, trigger: value, triggerLabel: triggerDef(value).label }));
  }, []);

  const cancelBuilder = useCallback(() => {
    setBuilder(emptyBuilder());
    setIsEditing(false);
    setActiveTab("rules");
  }, []);

  /* ----- Retry failed log ----- */
  const retryLog = useCallback((logId: string) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? { ...l, result: "running", errorMessage: null, details: "إعادة المحاولة قيد التنفيذ" }
          : l,
      ),
    );
    setTimeout(() => {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? { ...l, result: "success", details: "تمت إعادة المحاولة بنجاح", executionTime: 600 + Math.floor(Math.random() * 800) }
            : l,
        ),
      );
      toast({ title: "تمت إعادة المحاولة", description: "اكتمل التنفيذ بنجاح" });
    }, 1500);
  }, [toast]);

  /* ----- Filtered logs ----- */
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logRuleFilter !== "all" && l.ruleName !== logRuleFilter) return false;
      if (logStatusFilter !== "all" && l.result !== logStatusFilter) return false;
      if (logDateFilter !== "all") {
        const d = new Date(l.createdAt);
        const now = Date.now();
        const diff = now - d.getTime();
        if (logDateFilter === "1h" && diff > 3600_000) return false;
        if (logDateFilter === "24h" && diff > 86_400_000) return false;
        if (logDateFilter === "7d" && diff > 7 * 86_400_000) return false;
      }
      return true;
    });
  }, [logs, logRuleFilter, logStatusFilter, logDateFilter]);

  const ruleNames = useMemo(() => Array.from(new Set(logs.map((l) => l.ruleName).filter(Boolean) as string[])), [logs]);

  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.isActive).length;
    const success = logs.filter((l) => l.result === "success").length;
    const failed = logs.filter((l) => l.result === "failed").length;
    const running = logs.filter((l) => l.result === "running").length;
    const successRate = logs.length > 0 ? Math.round((success / logs.length) * 100) : 0;
    return { total, active, success, failed, running, successRate };
  }, [rules, logs]);

  /* ------------------------------------------------------------------------ */
  /*                                Render                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Workflow className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    منشئ الأتمتة
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-tight">
                    Automation Builder — صمّم قواعد أتمتة مرئية لنظام الإدارة القانونية
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatChip icon={Workflow} label="القواعد" value={stats.total} color="emerald" />
                <StatChip icon={Zap} label="نشطة" value={stats.active} color="amber" />
                <StatChip icon={CheckCircle2} label="نسبة النجاح" value={`${stats.successRate}%`} color="cyan" />
                <StatChip icon={History} label="السجلات" value={logs.length} color="slate" />
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-[88px] z-20">
            <div className="px-4 md:px-6 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-1">
                <TabsTrigger
                  value="rules"
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 rounded-lg px-4 py-2"
                >
                  <Workflow className="h-4 w-4 ml-2" />
                  القواعد
                </TabsTrigger>
                <TabsTrigger
                  value="builder"
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 rounded-lg px-4 py-2"
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  منشئ القاعدة
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 rounded-lg px-4 py-2"
                >
                  <History className="h-4 w-4 ml-2" />
                  سجل التنفيذ
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 rounded-lg px-4 py-2"
                >
                  <ClipboardList className="h-4 w-4 ml-2" />
                  القوالب الجاهزة
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            {/* ---------------- RULES TAB ---------------- */}
            <TabsContent value="rules" className="mt-0">
              {loading ? (
                <RulesSkeleton />
              ) : rules.length === 0 ? (
                <EmptyState
                  icon={Workflow}
                  title="لا توجد قواعد أتمتة بعد"
                  description="ابدأ بإنشاء قاعدتك الأولى أو استخدم أحد القوالب الجاهزة"
                  action={
                    <Button onClick={() => { setBuilder(emptyBuilder()); setIsEditing(false); setActiveTab("builder"); }} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 ml-2" /> قاعدة جديدة
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">قواعد الأتمتة</h2>
                      <p className="text-xs md:text-sm text-slate-500">إدارة وتفعيل قواعد الأتمتة الحالية</p>
                    </div>
                    <Button onClick={() => { setBuilder(emptyBuilder()); setIsEditing(false); setActiveTab("builder"); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4 ml-2" /> قاعدة جديدة
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {rules.map((rule) => {
                      const conds = safeParse<Condition[]>(rule.conditions, []);
                      const acts = safeParse<ActionItem[]>(rule.actions, []);
                      const tDef = triggerDef(rule.trigger);
                      const Icon = tDef.icon;
                      return (
                        <Card key={rule.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${rule.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm md:text-base leading-tight">{rule.name}</CardTitle>
                                  <CardDescription className="text-xs mt-0.5 line-clamp-1">{rule.description || tDef.label}</CardDescription>
                                </div>
                              </div>
                              <Switch checked={rule.isActive} onCheckedChange={() => toggleRuleActive(rule.id)} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                                <Icon className="h-3 w-3 ml-1" /> {tDef.label}
                              </Badge>
                              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300">
                                <Filter className="h-3 w-3 ml-1" /> {conds.length} شرط
                              </Badge>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Zap className="h-3 w-3 ml-1" /> {acts.length} إجراء
                              </Badge>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <div className="text-xs text-slate-400">آخر تشغيل</div>
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">{relativeTime(rule.lastTriggered)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">التشغيلات</div>
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">{rule.runs ?? 0}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">نسبة النجاح</div>
                                <div className={`text-xs font-bold mt-0.5 ${(rule.successRate ?? 0) >= 90 ? "text-emerald-600" : (rule.successRate ?? 0) >= 70 ? "text-amber-600" : "text-rose-600"}`}>
                                  {rule.successRate ?? 0}%
                                </div>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-emerald-600" onClick={() => editRule(rule)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>تعديل</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-cyan-600" onClick={() => duplicateRule(rule)}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>تكرار</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-amber-600" onClick={() => testRunRule(rule)}>
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>اختبار</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-violet-600" onClick={() => setViewLogFor(rule)}>
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>عرض السجل</TooltipContent>
                                </Tooltip>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-rose-600" onClick={() => setDeleteId(rule.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>حذف</TooltipContent>
                              </Tooltip>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---------------- BUILDER TAB ---------------- */}
            <TabsContent value="builder" className="mt-0">
              <BuilderView
                builder={builder}
                setBuilder={setBuilder}
                isEditing={isEditing}
                saving={saving}
                setTrigger={setTrigger}
                addCondition={addCondition}
                updateCondition={updateCondition}
                removeCondition={removeCondition}
                addAction={addAction}
                updateAction={updateAction}
                updateActionConfig={updateActionConfig}
                removeAction={removeAction}
                onCancel={cancelBuilder}
                onSave={handleSave}
                onTest={handleTest}
              />
            </TabsContent>

            {/* ---------------- LOGS TAB ---------------- */}
            <TabsContent value="logs" className="mt-0">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-emerald-600" /> سجل تنفيذ الأتمتة
                      </CardTitle>
                      <CardDescription>عرض آخر عمليات تنفيذ قواعد الأتمتة مع إمكانية إعادة المحاولة</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={logRuleFilter} onValueChange={setLogRuleFilter}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                          <SelectValue placeholder="كل القواعد" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل القواعد</SelectItem>
                          {ruleNames.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                        <SelectTrigger className="w-[120px] h-9 text-xs">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الحالات</SelectItem>
                          <SelectItem value="success">نجح</SelectItem>
                          <SelectItem value="failed">فشل</SelectItem>
                          <SelectItem value="running">قيد التنفيذ</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={logDateFilter} onValueChange={setLogDateFilter}>
                        <SelectTrigger className="w-[120px] h-9 text-xs">
                          <SelectValue placeholder="الفترة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الفترات</SelectItem>
                          <SelectItem value="1h">آخر ساعة</SelectItem>
                          <SelectItem value="24h">آخر 24 ساعة</SelectItem>
                          <SelectItem value="7d">آخر 7 أيام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">لا توجد سجلات مطابقة للفلتر</div>
                  ) : (
                    <ScrollArea className="max-h-[600px] rounded-md border border-slate-200 dark:border-slate-800">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                            <TableHead className="text-xs">الوقت</TableHead>
                            <TableHead className="text-xs">القاعدة</TableHead>
                            <TableHead className="text-xs">المُحفّز</TableHead>
                            <TableHead className="text-xs">الحالة</TableHead>
                            <TableHead className="text-xs">المدة</TableHead>
                            <TableHead className="text-xs">المستخدم</TableHead>
                            <TableHead className="text-xs">التفاصيل</TableHead>
                            <TableHead className="text-xs text-left">إجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log) => {
                            const tDef = triggerDef(log.trigger || "");
                            const Icon = tDef.icon;
                            return (
                              <TableRow key={log.id} className="text-xs">
                                <TableCell className="whitespace-nowrap text-slate-500">{formatTime(log.createdAt)}</TableCell>
                                <TableCell className="font-medium text-slate-700 dark:text-slate-200">{log.ruleName || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 gap-1">
                                    <Icon className="h-3 w-3" /> {tDef.label}
                                  </Badge>
                                </TableCell>
                                <TableCell><StatusBadge status={log.result} /></TableCell>
                                <TableCell className="text-slate-500">
                                  {log.executionTime ? `${log.executionTime} مللي` : "—"}
                                </TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300">{log.user || "—"}</TableCell>
                                <TableCell className="text-slate-500 max-w-[260px] truncate" title={log.details || log.errorMessage || ""}>
                                  {log.errorMessage ? (
                                    <span className="text-rose-600">{log.errorMessage}</span>
                                  ) : (
                                    log.details || "—"
                                  )}
                                </TableCell>
                                <TableCell className="text-left">
                                  {log.result === "failed" && (
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-600 hover:text-amber-700" onClick={() => retryLog(log.id)}>
                                      <RotateCw className="h-3.5 w-3.5 ml-1" /> إعادة
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------------- TEMPLATES TAB ---------------- */}
            <TabsContent value="templates" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">القوالب الجاهزة</h2>
                  <p className="text-xs md:text-sm text-slate-500">قوالب أتمتة جاهزة للاستخدام — اختر قالباً لتعديله في المنشئ</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    const tDef = triggerDef(tpl.trigger);
                    const TriggerIc = tDef.icon;
                    const colorMap: Record<string, string> = {
                      amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
                      rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
                      cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
                      slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                      emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
                      violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
                    };
                    return (
                      <Card key={tpl.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-all hover:-translate-y-0.5">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[tpl.color]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-sm md:text-base">{tpl.title}</CardTitle>
                              <CardDescription className="text-xs mt-1 line-clamp-2">{tpl.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 gap-1">
                              <TriggerIc className="h-3 w-3" /> {tDef.label}
                            </Badge>
                            {tpl.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                          <Separator />
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Filter className="h-3 w-3" />
                              <span>{tpl.conditions.length === 0 ? "بدون شروط" : `${tpl.conditions.length} شروط`}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Zap className="h-3 w-3" />
                              <span>{tpl.actions.length} إجراءات</span>
                            </div>
                          </div>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => loadTemplate(tpl)}>
                            <Sparkles className="h-4 w-4 ml-2" /> تحميل في المنشئ
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </main>
        </Tabs>

        {/* Test result dialog */}
        <Dialog open={!!testResult || testRunning} onOpenChange={(open) => { if (!open) { setTestResult(null); setTestRunning(false); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {testRunning ? (
                  <><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> جارٍ تشغيل الاختبار...</>
                ) : testResult?.ok ? (
                  <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> نجح الاختبار</>
                ) : (
                  <><AlertTriangle className="h-5 w-5 text-amber-600" /> اكتمل مع أخطاء</>
                )}
              </DialogTitle>
              <DialogDescription>{testResult?.message || "محاكاة تنفيذ القاعدة خطوة بخطوة"}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] pr-1">
              <div className="space-y-2">
                {(testResult?.steps || []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-md border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="mt-0.5">
                      {step.status === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {step.status === "fail" && <X className="h-4 w-4 text-rose-600" />}
                      {step.status === "skip" && <Clock className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{step.label}</div>
                      {step.detail && <div className="text-slate-400 mt-0.5">{step.detail}</div>}
                    </div>
                  </div>
                ))}
                {testRunning && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> جارٍ محاكاة التنفيذ...
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setTestResult(null); setTestRunning(false); }}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" /> تأكيد الحذف
              </DialogTitle>
              <DialogDescription>سيتم حذف هذه القاعدة نهائياً. هل أنت متأكد؟</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
              <Button variant="destructive" onClick={() => deleteId && deleteRule(deleteId)}>
                <Trash2 className="h-4 w-4 ml-2" /> حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View logs for a rule */}
        <Dialog open={!!viewLogFor} onOpenChange={(open) => { if (!open) setViewLogFor(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-violet-600" /> سجل تنفيذ: {viewLogFor?.name}
              </DialogTitle>
              <DialogDescription>آخر عمليات تنفيذ هذه القاعدة</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {logs.filter((l) => l.ruleName === viewLogFor?.name).slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 p-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs">
                    <StatusBadge status={log.result} />
                    <span className="text-slate-500">{formatTime(log.createdAt)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{log.details || log.errorMessage || "—"}</span>
                    {log.executionTime && <span className="text-slate-400">{log.executionTime} مللي</span>}
                  </div>
                ))}
                {logs.filter((l) => l.ruleName === viewLogFor?.name).length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">لا توجد سجلات تنفيذ لهذه القاعدة</div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewLogFor(null)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Sub-components                                   */
/* -------------------------------------------------------------------------- */

function StatChip({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${colorMap[color]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold">{value}</span>
      <span className="opacity-70 hidden sm:inline">{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function RulesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ----------------- Builder View ----------------- */

interface BuilderViewProps {
  builder: BuilderState;
  setBuilder: React.Dispatch<React.SetStateAction<BuilderState>>;
  isEditing: boolean;
  saving: boolean;
  setTrigger: (v: string) => void;
  addCondition: () => void;
  updateCondition: (id: string, patch: Partial<Condition>) => void;
  removeCondition: (id: string) => void;
  addAction: () => void;
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  updateActionConfig: (id: string, key: string, value: string) => void;
  removeAction: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onTest: () => void;
}

function BuilderView({
  builder,
  setBuilder,
  isEditing,
  saving,
  setTrigger,
  addCondition,
  updateCondition,
  removeCondition,
  addAction,
  updateAction,
  updateActionConfig,
  removeAction,
  onCancel,
  onSave,
  onTest,
}: BuilderViewProps) {
  const tDef = triggerDef(builder.trigger);
  const TriggerIconC = tDef.icon;

  return (
    <div className="space-y-4">
      {/* Metadata top bar */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[260px] space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-slate-500">{isEditing ? "تعديل قاعدة أتمتة" : "إنشاء قاعدة أتمتة جديدة"}</span>
              </div>
              <Input
                placeholder="اسم القاعدة (مثال: تذكير قبل الجلسة)"
                value={builder.name}
                onChange={(e) => setBuilder((b) => ({ ...b, name: e.target.value }))}
                className="text-base font-semibold h-10"
              />
              <Textarea
                placeholder="وصف مختصر للقاعدة وهدفها..."
                value={builder.description}
                onChange={(e) => setBuilder((b) => ({ ...b, description: e.target.value }))}
                className="min-h-[60px] text-sm resize-y"
              />
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2">
                <Label htmlFor="rule-active" className="text-xs text-slate-500">تفعيل القاعدة</Label>
                <Switch id="rule-active" checked={builder.isActive} onCheckedChange={(v) => setBuilder((b) => ({ ...b, isActive: v }))} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4 ml-1" /> إلغاء
                </Button>
                <Button variant="outline" size="sm" onClick={onTest} className="text-amber-700 border-amber-200 hover:bg-amber-50">
                  <Play className="h-4 w-4 ml-1" /> اختبار
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                  حفظ القاعدة
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trigger Card */}
      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base">عندما — Trigger</CardTitle>
              <CardDescription className="text-xs">اختر الحدث الذي يبدأ تشغيل هذه القاعدة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">نوع المُحفّز</Label>
              <Select value={builder.trigger} onValueChange={setTrigger}>
                <SelectTrigger className="bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => {
                    const Ic = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <Ic className="h-4 w-4 text-amber-600" />
                          {t.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">اسم المُحفّز (اختياري)</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <TriggerIconC className="h-5 w-5" />
                </div>
                <Input
                  placeholder={`${tDef.label} — ${builder.trigger}`}
                  value={builder.triggerLabel}
                  onChange={(e) => setBuilder((b) => ({ ...b, triggerLabel: e.target.value }))}
                  className="bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/20 rounded-md p-2">
            <Zap className="h-3.5 w-3.5" />
            عند حدوث <span className="font-semibold mx-1">{tDef.label}</span> في النظام، تبدأ هذه القاعدة بتنفيذ الشروط والإجراءات
          </div>
        </CardContent>
      </Card>

      <FlowArrow label="ثم" />

      {/* Conditions Card */}
      <Card className="border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base">إذا تحقّقت الشروط — Conditions</CardTitle>
                <CardDescription className="text-xs">حدد الشروط التي يجب أن تنطبق لتنفيذ الإجراءات</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">المنطق:</span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBuilder((b) => ({ ...b, conditionLogic: "and" }))}
                  className={`px-2.5 py-1 text-xs rounded ${builder.conditionLogic === "and" ? "bg-cyan-600 text-white" : "text-slate-500"}`}
                >
                  AND (الكل)
                </button>
                <button
                  type="button"
                  onClick={() => setBuilder((b) => ({ ...b, conditionLogic: "or" }))}
                  className={`px-2.5 py-1 text-xs rounded ${builder.conditionLogic === "or" ? "bg-cyan-600 text-white" : "text-slate-500"}`}
                >
                  OR (أي)
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {builder.conditions.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              لا توجد شروط — سيتم تنفيذ الإجراءات دائماً عند حدوث المُحفّز
            </div>
          ) : (
            <div className="space-y-2">
              {builder.conditions.map((cond, idx) => (
                <ConditionRow
                  key={cond.id}
                  cond={cond}
                  index={idx}
                  total={builder.conditions.length}
                  logic={builder.conditionLogic}
                  onUpdate={(patch) => updateCondition(cond.id, patch)}
                  onRemove={() => removeCondition(cond.id)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={addCondition} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300">
            <Plus className="h-4 w-4 ml-1" /> إضافة شرط
          </Button>
        </CardContent>
      </Card>

      <FlowArrow label="ثم" />

      {/* Actions Card */}
      <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base">نفّذ — Actions</CardTitle>
              <CardDescription className="text-xs">الإجراءات التي سيتم تنفيذها عند تحقق الشروط</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {builder.actions.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              لا توجد إجراءات — أضف إجراءً واحداً على الأقل لجعل القاعدة فعّالة
            </div>
          ) : (
            <div className="space-y-2">
              {builder.actions.map((action, idx) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  index={idx}
                  onUpdate={(patch) => updateAction(action.id, patch)}
                  onUpdateConfig={(key, value) => updateActionConfig(action.id, key, value)}
                  onRemove={() => removeAction(action.id)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={addAction} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300">
            <Plus className="h-4 w-4 ml-1" /> إضافة إجراء
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <TriggerIcon value={builder.trigger} className="h-3 w-3 ml-1" /> {tDef.label}
            </Badge>
            <span className="text-slate-400">←</span>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              <Filter className="h-3 w-3 ml-1" /> {builder.conditions.length} شرط ({builder.conditionLogic === "and" ? "الكل" : "أي"})
            </Badge>
            <span className="text-slate-400">←</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Zap className="h-3 w-3 ml-1" /> {builder.actions.length} إجراء
            </Badge>
            <span className="ml-auto text-slate-400">
              {isEditing ? "وضع التعديل" : "قاعدة جديدة"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------- Condition Row ----------------- */

function ConditionRow({
  cond,
  index,
  total,
  logic,
  onUpdate,
  onRemove,
}: {
  cond: Condition;
  index: number;
  total: number;
  logic: "and" | "or";
  onUpdate: (patch: Partial<Condition>) => void;
  onRemove: () => void;
}) {
  const fDef = fieldDef(cond.field);
  const needsValue2 = cond.operator === "between";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <span className="h-5 w-5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold">
            {index + 1}
          </span>
          {index > 0 && <span className="text-cyan-600 text-[10px] font-bold">{logic === "and" ? "AND" : "OR"}</span>}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-4">
          <Select value={cond.field} onValueChange={(v) => onUpdate({ field: v, value: "" })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select value={cond.operator} onValueChange={(v) => onUpdate({ operator: v })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5 flex gap-2">
          {fDef.type === "select" && fDef.options ? (
            <Select value={cond.value} onValueChange={(v) => onUpdate({ value: v })}>
              <SelectTrigger className="h-9 text-xs flex-1">
                <SelectValue placeholder="اختر..." />
              </SelectTrigger>
              <SelectContent>
                {fDef.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={fDef.type === "number" ? "number" : fDef.type === "date" ? "date" : "text"}
              placeholder={fDef.type === "number" ? "0" : "القيمة..."}
              value={cond.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="h-9 text-xs flex-1"
            />
          )}
          {needsValue2 && (
            <Input
              type={fDef.type === "number" ? "number" : fDef.type === "date" ? "date" : "text"}
              placeholder="إلى"
              value={cond.value2 || ""}
              onChange={(e) => onUpdate({ value2: e.target.value })}
              className="h-9 text-xs w-20"
            />
          )}
        </div>
      </div>
      {index < total - 1 && (
        <div className="text-center text-[10px] text-cyan-600 font-bold">{logic === "and" ? "و" : "أو"}</div>
      )}
    </div>
  );
}

/* ----------------- Action Row ----------------- */

function ActionRow({
  action,
  index,
  onUpdate,
  onUpdateConfig,
  onRemove,
}: {
  action: ActionItem;
  index: number;
  onUpdate: (patch: Partial<ActionItem>) => void;
  onUpdateConfig: (key: string, value: string) => void;
  onRemove: () => void;
}) {
  const aDef = actionDef(action.type);
  const Icon = aDef.icon;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold">
            {index + 1}
          </span>
          <Icon className="h-3.5 w-3.5 text-emerald-600" />
          {aDef.label}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        <div className="md:col-span-4">
          <Label className="text-[10px] text-slate-400 mb-0.5 block">نوع الإجراء</Label>
          <Select value={action.type} onValueChange={(v) => onUpdate({ type: v, config: {} })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_DEFS.map((a) => {
                const Ic = a.icon;
                return (
                  <SelectItem key={a.value} value={a.value}>
                    <span className="flex items-center gap-2">
                      <Ic className="h-3.5 w-3.5 text-emerald-600" />
                      {a.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {aDef.configFields.map((cf) => (
            <div key={cf.key} className="space-y-0.5">
              <Label className="text-[10px] text-slate-400 block">{cf.label}</Label>
              {cf.type === "select" && cf.options ? (
                <Select value={action.config[cf.key] || ""} onValueChange={(v) => onUpdateConfig(cf.key, v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cf.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : cf.type === "textarea" ? (
                <Textarea
                  placeholder={cf.label}
                  value={action.config[cf.key] || ""}
                  onChange={(e) => onUpdateConfig(cf.key, e.target.value)}
                  className="min-h-[60px] text-xs resize-y"
                />
              ) : (
                <Input
                  type={cf.type === "number" ? "number" : "text"}
                  placeholder={cf.label}
                  value={action.config[cf.key] || ""}
                  onChange={(e) => onUpdateConfig(cf.key, e.target.value)}
                  className="h-9 text-xs"
                />
              )}
            </div>
          ))}
          <div className="space-y-0.5 sm:col-span-2">
            <Label className="text-[10px] text-slate-400 block">التأخير — نفّذ بعد</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={action.delayValue}
                onChange={(e) => onUpdate({ delayValue: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-9 text-xs w-24"
              />
              <Select value={action.delayUnit} onValueChange={(v) => onUpdate({ delayUnit: v as ActionItem["delayUnit"] })}>
                <SelectTrigger className="h-9 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minute">دقيقة</SelectItem>
                  <SelectItem value="hour">ساعة</SelectItem>
                  <SelectItem value="day">يوم</SelectItem>
                </SelectContent>
              </Select>
              {action.delayValue === 0 && <span className="text-[10px] text-slate-400">(فوري)</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Mock rules (fallback)                           */
/* -------------------------------------------------------------------------- */

function MOCK_RULES(): AutomationRule[] {
  return TEMPLATES.slice(0, 4).map((tpl, i) => {
    const now = new Date();
    return {
      id: `rule-mock-${i + 1}`,
      name: tpl.title,
      description: tpl.description,
      trigger: tpl.trigger,
      conditions: JSON.stringify(tpl.conditions.map((c) => ({ ...c, id: uid() }))),
      actions: JSON.stringify(tpl.actions.map((a) => ({ ...a, id: uid() }))),
      isActive: i !== 2,
      createdBy: "النظام",
      createdAt: new Date(now.getTime() - (i + 1) * 86_400_000).toISOString(),
      updatedAt: new Date(now.getTime() - (i + 1) * 3600_000).toISOString(),
      lastTriggered: new Date(now.getTime() - (i + 1) * 7200_000).toISOString(),
      successRate: 88 + (i * 3) % 11,
      runs: 35 + i * 17,
    };
  });
}
