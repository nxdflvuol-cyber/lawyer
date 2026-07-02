"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  timeAgo,
  getCaseTypeLabel,
  getCaseStatusLabel,
} from "@/lib/constants";
import {
  Briefcase,
  Search,
  Plus,
  Scale,
  Users,
  FileText,
  CheckSquare,
  Gavel,
  Activity,
  Brain,
  Network,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  FolderOpen,
  History,
  DollarSign,
  GitBranch,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Eye,
  Archive,
  Link2,
  Send,
  Loader2,
  Sparkles,
  FileSignature,
  Building2,
  MessageSquare,
  ShieldCheck,
  Zap,
  FileCheck,
  CheckCircle2,
  BellRing,
  Layers,
  Target,
  MapPin,
  MoreVertical,
  X,
  Crown,
  NotebookPen,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// الأنواع
// ============================================================

interface Client {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  clientType?: string | null;
}

interface Session {
  id: string;
  sessionDate: string;
  sessionNumber?: number | null;
  court?: string | null;
  circuit?: string | null;
  judgeName?: string | null;
  purpose?: string | null;
  facts?: string | null;
  decisions?: string | null;
  adjournReason?: string | null;
  nextSessionDate?: string | null;
  opponentRequests?: string | null;
  opponentDefenses?: string | null;
  lawyerPleading?: string | null;
  courtStance?: string | null;
  opponentStance?: string | null;
  strategy?: string | null;
  attendees?: string | null;
  documentsRequested?: string | null;
}

interface Procedure {
  id: string;
  date: string;
  type: string;
  description: string;
  performedBy?: string | null;
  result?: string | null;
  nextAction?: string | null;
  status: string;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  docType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags?: string | null;
  createdAt: string;
  documentLinks?: Array<{
    id: string;
    caseId?: string | null;
    clientId?: string | null;
    case?: { id: string; internalNumber: string } | null;
    client?: { id: string; fullName: string } | null;
  }>;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignedTo?: { id: string; name: string } | null;
}

interface FeeItem {
  id: string;
  caseId?: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  createdAt: string;
}

interface ExpenseItem {
  id: string;
  caseId?: string;
  category: string;
  amount: number;
  description?: string | null;
  expenseDate: string;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  title: string;
  description?: string | null;
  metadata?: string | null;
  userId?: string | null;
  user?: { id: string; name: string } | null;
  caseId?: string | null;
  clientId?: string | null;
  documentId?: string | null;
  createdAt: string;
}

interface CaseItem {
  id: string;
  internalNumber: string;
  officialNumber?: string | null;
  year: number;
  caseType: string;
  caseSubType?: string | null;
  court?: string | null;
  circuit?: string | null;
  degree: string;
  judgeName?: string | null;
  judgeNotes?: string | null;
  clientId: string;
  client: Client;
  opponentName?: string | null;
  opponentLawyer?: string | null;
  status: string;
  startDate: string;
  endDate?: string | null;
  result?: string | null;
  executionStatus?: string;
  facts?: string | null;
  strategy?: string | null;
  estimatedValue?: number | null;
  priority?: string;
  notes?: string | null;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  sessions?: Session[];
  procedures?: Procedure[];
  tasks?: TaskItem[];
  fees?: FeeItem[];
  expenses?: ExpenseItem[];
  _count?: {
    sessions?: number;
    documentLinks?: number;
    tasks?: number;
    procedures?: number;
  };
}

type TabId =
  | "overview"
  | "timeline"
  | "documents"
  | "hearings"
  | "tasks"
  | "ai"
  | "judgments"
  | "execution"
  | "accounting"
  | "relations"
  | "audit";

interface Alert {
  type: "warning" | "danger" | "info" | "success";
  text: string;
  icon: LucideIcon;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================================
// ثوابت مساعدة
// ============================================================

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "timeline", label: "الخط الزمني", icon: History },
  { id: "documents", label: "المستندات", icon: FileText },
  { id: "hearings", label: "الجلسات", icon: Gavel },
  { id: "tasks", label: "المهام", icon: CheckSquare },
  { id: "ai", label: "المساعد الذكي", icon: Brain },
  { id: "judgments", label: "الأحكام", icon: Award },
  { id: "execution", label: "التنفيذ", icon: Zap },
  { id: "accounting", label: "الحسابات", icon: DollarSign },
  { id: "relations", label: "العلاقات", icon: Network },
  { id: "audit", label: "سجل التدقيق", icon: ShieldCheck },
];

const CASE_STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-slate-200 text-slate-700 border-slate-300",
  won: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-rose-100 text-rose-700 border-rose-200",
  settled: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  medium: "bg-emerald-100 text-emerald-700 border-emerald-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const TASK_STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const DOC_TYPE_ICON: Record<string, LucideIcon> = {
  pdf: FileText,
  image: FileText,
  word: FileText,
  text: FileText,
  audio: FileText,
  video: FileText,
  archive: FileText,
  other: FileText,
};

const DOC_CATEGORY_LABEL: Record<string, string> = {
  contract: "عقد",
  pleading: "مذكرة",
  ruling: "حكم",
  evidence: "دليل",
  correspondence: "مراسلة",
  id_card: "بطاقة",
  power_of_attorney: "توكيل",
  other: "أخرى",
};

const PROCEDURE_TYPE_LABEL: Record<string, string> = {
  filing: "رفع الدعوى",
  notification: "إعلان",
  hearing: "جلسة",
  ruling: "حكم",
  appeal: "طعن",
  execution: "تنفيذ",
};

const TIMELINE_EVENT_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  case_created: { label: "إنشاء القضية", icon: Briefcase, color: "bg-emerald-500" },
  created: { label: "إنشاء", icon: Plus, color: "bg-emerald-500" },
  document_uploaded: { label: "رفع مستند", icon: Upload, color: "bg-amber-500" },
  session_added: { label: "إضافة جلسة", icon: Gavel, color: "bg-rose-500" },
  session_postponed: { label: "تأجيل جلسة", icon: Clock, color: "bg-amber-500" },
  procedure_added: { label: "إجراء جديد", icon: ClipboardList, color: "bg-cyan-500" },
  memo_created: { label: "إنشاء مذكرة", icon: NotebookPen, color: "bg-violet-500" },
  judgment_issued: { label: "إصدار حكم", icon: Award, color: "bg-rose-600" },
  execution_started: { label: "بدء التنفيذ", icon: Zap, color: "bg-orange-500" },
  note_added: { label: "إضافة ملاحظة", icon: FileText, color: "bg-slate-500" },
  task_created: { label: "إنشاء مهمة", icon: CheckSquare, color: "bg-emerald-500" },
  ai_analyzed: { label: "تحليل AI", icon: Brain, color: "bg-violet-500" },
  status_changed: { label: "تغيير الحالة", icon: Activity, color: "bg-cyan-500" },
  ocr_completed: { label: "إكمال OCR", icon: FileCheck, color: "bg-emerald-500" },
  linked: { label: "ربط", icon: Link2, color: "bg-slate-500" },
  unlinked: { label: "إلغاء ربط", icon: X, color: "bg-rose-500" },
  sent: { label: "إرسال", icon: Send, color: "bg-cyan-500" },
  archived: { label: "أرشفة", icon: Archive, color: "bg-slate-500" },
  updated: { label: "تحديث", icon: Activity, color: "bg-cyan-500" },
  custom: { label: "حدث", icon: Activity, color: "bg-slate-500" },
};

// ============================================================
// دوال مساعدة
// ============================================================

function calcCompletion(c: CaseItem): number {
  const checks = [
    !!c.clientId,
    !!c.opponentName,
    (c._count?.documentLinks ?? c.sessions?.length ?? 0) > 0 || (c as any).documentCount > 0,
    (c._count?.sessions ?? c.sessions?.length ?? 0) > 0 || (c as any).sessionCount > 0,
    !!c.facts,
    !!c.strategy,
    !!c.court,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getAlerts(
  c: CaseItem,
  sessions: Session[] | undefined,
  tasks: TaskItem[] | undefined,
  docs: DocumentItem[] | undefined
): Alert[] {
  const alerts: Alert[] = [];
  const upcoming = sessions
    ?.filter((s) => new Date(s.sessionDate) > new Date())
    .sort(
      (a, b) =>
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
    )[0];
  if (upcoming) {
    const days = Math.ceil(
      (new Date(upcoming.sessionDate).getTime() - Date.now()) / 86400000
    );
    if (days <= 7) {
      alerts.push({
        type: days <= 2 ? "danger" : "warning",
        text: `الجلسة القادمة بعد ${days} أيام`,
        icon: Clock,
      });
    }
  }
  const overdue = tasks?.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
  );
  if (overdue && overdue.length > 0) {
    alerts.push({
      type: "danger",
      text: `${overdue.length} مهام متأخرة`,
      icon: AlertTriangle,
    });
  }
  if (!docs || docs.length === 0) {
    alerts.push({
      type: "info",
      text: "لا توجد مستندات مربوطة",
      icon: FileText,
    });
  }
  if (!c.facts) {
    alerts.push({
      type: "warning",
      text: "الوقائع غير مدخلة",
      icon: AlertCircle,
    });
  }
  if (!c.strategy) {
    alerts.push({
      type: "info",
      text: "الاستراتيجية غير محددة",
      icon: Target,
    });
  }
  return alerts;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ============================================================
// المكوّن الرئيسي
// ============================================================

export function LegalWorkspaceSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseSearchOpen, setCaseSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // جلب قائمة القضايا
  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ["workspace-cases", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/cases?${params.toString()}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const cases: CaseItem[] = casesData?.cases ?? [];
  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

  // جلب تفاصيل القضية المختارة
  const { data: caseDetailData, isLoading: caseDetailLoading } = useQuery({
    queryKey: ["workspace-case", selectedCaseId],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${selectedCaseId}`);
      return res.json();
    },
    enabled: !!selectedCaseId,
    refetchInterval: 30000,
  });

  const caseDetail: CaseItem | null = caseDetailData?.case ?? null;
  const currentCase: CaseItem = caseDetail ?? selectedCase ?? ({} as CaseItem);

  // completion
  const completion = useMemo(
    () => (currentCase?.id ? calcCompletion(currentCase) : 0),
    [currentCase]
  );

  // When changing case, reset tab to overview
  const handleSelectCase = useCallback((id: string) => {
    setSelectedCaseId(id);
    setActiveTab("overview");
    setCaseSearchOpen(false);
    setSearch("");
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* رأس مساحة العمل - ثابت */}
      <WorkspaceHeader
        selectedCase={currentCase}
        cases={cases}
        casesLoading={casesLoading}
        search={search}
        setSearch={setSearch}
        open={caseSearchOpen}
        setOpen={setCaseSearchOpen}
        onSelect={handleSelectCase}
        hasSelection={!!selectedCaseId}
      />

      {/* محتوى التبويبات */}
      {!selectedCaseId ? (
        <EmptyWorkspaceState />
      ) : caseDetailLoading && !caseDetail ? (
        <TabSkeleton />
      ) : (
        <>
          {/* شريط التبويبات */}
          <div className="sticky top-0 z-20 -mx-1 px-1">
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/80 p-1.5 backdrop-blur">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* محتوى التبويب */}
          <TabContent
            tab={activeTab}
            caseId={selectedCaseId}
            caseData={currentCase}
            completion={completion}
            onInvalidate={() => {
              queryClient.invalidateQueries({
                queryKey: ["workspace-case", selectedCaseId],
              });
              queryClient.invalidateQueries({
                queryKey: ["workspace-cases"],
              });
            }}
            toast={toast}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// رأس مساحة العمل + منتقي القضية
// ============================================================

interface WorkspaceHeaderProps {
  selectedCase: CaseItem;
  cases: CaseItem[];
  casesLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
  onSelect: (id: string) => void;
  hasSelection: boolean;
}

function WorkspaceHeader({
  selectedCase,
  cases,
  casesLoading,
  search,
  setSearch,
  open,
  setOpen,
  onSelect,
  hasSelection,
}: WorkspaceHeaderProps) {
  return (
    <Card className="overflow-hidden border-emerald-200/60 bg-gradient-to-l from-emerald-50/50 via-card to-card">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* العنوان */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                مساحة العمل القانونية
              </h2>
              <p className="text-xs text-muted-foreground">
                Legal Workspace — عرض موحّد لكل بيانات القضية
              </p>
            </div>
          </div>

          {/* منتقي القضية */}
          <div className="relative flex-1 lg:max-w-xl">
            <Button
              variant="outline"
              onClick={() => setOpen(!open)}
              className="w-full justify-between border-2 border-emerald-200 bg-background hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <span className="flex items-center gap-2 truncate">
                {hasSelection && selectedCase?.id ? (
                  <>
                    <Briefcase className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="truncate font-mono text-sm">
                      {selectedCase.internalNumber}
                    </span>
                    {selectedCase.client?.fullName && (
                      <span className="hidden truncate text-muted-foreground sm:inline">
                        — {selectedCase.client.fullName}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-muted-foreground">اختر قضية للعرض...</span>
                  </>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </Button>

            {/* قائمة البحث */}
            {open && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-border bg-card shadow-xl">
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="ابحث برقم القضية أو اسم الموكل..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-0 bg-muted pr-9 focus-visible:ring-1"
                    />
                  </div>
                </div>
                <ScrollArea className="max-h-80">
                  <div className="p-1">
                    {casesLoading ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : cases.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        لا توجد قضايا مطابقة
                      </div>
                    ) : (
                      cases.slice(0, 30).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onSelect(c.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right hover:bg-emerald-50/60"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-mono text-sm font-semibold">
                                  {c.internalNumber}
                                </span>
                                {c.officialNumber && (
                                  <span className="text-xs text-muted-foreground">
                                    ({c.officialNumber})
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {c.client?.fullName ?? "—"} ·{" "}
                                {getCaseTypeLabel(c.caseType)}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 border",
                              CASE_STATUS_BADGE[c.status] ??
                                "bg-slate-100 text-slate-700"
                            )}
                          >
                            {getCaseStatusLabel(c.status)}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {/* بطاقة حالة القضية المختارة */}
        {hasSelection && selectedCase?.id && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-100 pt-3 md:grid-cols-4 lg:grid-cols-6">
            <HeaderStat
              icon={Briefcase}
              label="نوع القضية"
              value={getCaseTypeLabel(selectedCase.caseType)}
            />
            <HeaderStat
              icon={Building2}
              label="المحكمة"
              value={selectedCase.court ?? "—"}
            />
            <HeaderStat
              icon={Scale}
              label="الدائرة"
              value={selectedCase.circuit ?? "—"}
            />
            <HeaderStat
              icon={Layers}
              label="الدرجة"
              value={
                selectedCase.degree === "primary"
                  ? "ابتدائي"
                  : selectedCase.degree === "appeal"
                  ? "استئناف"
                  : selectedCase.degree === "cassation"
                  ? "نقض"
                  : selectedCase.degree
              }
            />
            <HeaderStat
              icon={Users}
              label="الموكل"
              value={selectedCase.client?.fullName ?? "—"}
            />
            <HeaderStat
              icon={AlertCircle}
              label="الخصم"
              value={selectedCase.opponentName ?? "—"}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HeaderStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
      <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="truncate text-xs font-semibold">{value}</div>
      </div>
    </div>
  );
}

// ============================================================
// الحالة الفارغة
// ============================================================

function EmptyWorkspaceState() {
  return (
    <Card className="border-dashed border-2 border-emerald-200">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Layers className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            ابدأ باختيار قضية
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            مساحة العمل القانونية تعرض كل ما يتعلق بالقضية في تبويبات ذكية:
            المستندات، الجلسات، المهام، الأحكام، التنفيذ، الحسابات، والعلاقات.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TABS.slice(0, 6).map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/40 p-3"
              >
                <Icon className="h-5 w-5 text-emerald-600" />
                <span className="text-xs">{t.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// هيكل التبويبات
// ============================================================

interface TabContentProps {
  tab: TabId;
  caseId: string;
  caseData: CaseItem;
  completion: number;
  onInvalidate: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}

function TabContent({
  tab,
  caseId,
  caseData,
  completion,
  onInvalidate,
  toast,
}: TabContentProps) {
  switch (tab) {
    case "overview":
      return (
        <OverviewTab
          caseData={caseData}
          completion={completion}
          caseId={caseId}
        />
      );
    case "timeline":
      return <TimelineTab caseId={caseId} />;
    case "documents":
      return <DocumentsTab caseId={caseId} caseData={caseData} onInvalidate={onInvalidate} toast={toast} />;
    case "hearings":
      return <HearingsTab caseId={caseId} caseData={caseData} onInvalidate={onInvalidate} toast={toast} />;
    case "tasks":
      return <TasksTab caseId={caseId} caseData={caseData} onInvalidate={onInvalidate} toast={toast} />;
    case "ai":
      return <AIAssistantTab caseId={caseId} caseData={caseData} />;
    case "judgments":
      return <JudgmentsTab caseData={caseData} />;
    case "execution":
      return <ExecutionTab caseData={caseData} />;
    case "accounting":
      return <AccountingTab caseId={caseId} caseData={caseData} />;
    case "relations":
      return <RelationsTab caseData={caseData} />;
    case "audit":
      return <AuditTab caseId={caseId} />;
    default:
      return null;
  }
}

// ============================================================
// تبويب: نظرة عامة ذكية
// ============================================================

function OverviewTab({
  caseData,
  completion,
  caseId,
}: {
  caseData: CaseItem;
  completion: number;
  caseId: string;
}) {
  // جلب المستندات والمهام والـ timeline للتنبيهات
  const { data: docsData } = useQuery({
    queryKey: ["workspace-docs", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?caseId=${caseId}`);
      return res.json();
    },
    enabled: !!caseId,
  });
  const { data: tasksData } = useQuery({
    queryKey: ["workspace-tasks", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?caseId=${caseId}`);
      return res.json();
    },
    enabled: !!caseId,
  });
  const { data: timelineData } = useQuery({
    queryKey: ["workspace-timeline", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?caseId=${caseId}&limit=1`);
      return res.json();
    },
    enabled: !!caseId,
  });

  const sessions = caseData.sessions ?? [];
  const tasks: TaskItem[] = tasksData?.tasks ?? caseData.tasks ?? [];
  const docs: DocumentItem[] = docsData?.documents ?? [];
  const procedures = caseData.procedures ?? [];
  const judgments = procedures.filter((p) => p.type === "ruling");
  const executions = procedures.filter((p) => p.type === "execution");
  const lastEvent: TimelineEvent | null = timelineData?.events?.[0] ?? null;

  const upcomingSession = sessions
    .filter((s) => new Date(s.sessionDate) > new Date())
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())[0];

  const stats: { label: string; value: string | number; icon: LucideIcon; color: string }[] = [
    { label: "عدد الجلسات", value: sessions.length, icon: Gavel, color: "text-rose-600 bg-rose-50" },
    { label: "عدد المستندات", value: docs.length, icon: FileText, color: "text-amber-600 bg-amber-50" },
    { label: "عدد المذكرات", value: docs.filter((d) => d.category === "pleading").length, icon: NotebookPen, color: "text-violet-600 bg-violet-50" },
    { label: "عدد الأحكام", value: judgments.length, icon: Award, color: "text-emerald-600 bg-emerald-50" },
    { label: "إجراءات التنفيذ", value: executions.length, icon: Zap, color: "text-orange-600 bg-orange-50" },
    { label: "عدد المهام", value: tasks.length, icon: CheckSquare, color: "text-cyan-600 bg-cyan-50" },
    { label: "آخر نشاط", value: lastEvent ? timeAgo(lastEvent.createdAt) : "—", icon: Activity, color: "text-slate-600 bg-slate-50" },
    { label: "الجلسة القادمة", value: upcomingSession ? formatDate(upcomingSession.sessionDate) : "—", icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
  ];

  const alerts = getAlerts(caseData, sessions, tasks, docs);

  const quickActions: { label: string; icon: LucideIcon; color: string; action: () => void }[] = [
    { label: "رفع مستند", icon: Upload, color: "bg-amber-500", action: () => {} },
    { label: "إضافة جلسة", icon: Gavel, color: "bg-rose-500", action: () => {} },
    { label: "إنشاء مذكرة", icon: NotebookPen, color: "bg-violet-500", action: () => {} },
    { label: "إنشاء مهمة", icon: CheckSquare, color: "bg-cyan-500", action: () => {} },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* العمود الأيمن: بطاقة الحالة + الإحصائيات */}
      <div className="space-y-4 lg:col-span-2">
        {/* بطاقة حالة القضية */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                حالة القضية
              </CardTitle>
              <Badge
                variant="outline"
                className={cn("border", CASE_STATUS_BADGE[caseData.status] ?? "bg-slate-100")}
              >
                {getCaseStatusLabel(caseData.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <InfoField label="النوع" value={getCaseTypeLabel(caseData.caseType)} />
            <InfoField label="المحكمة" value={caseData.court ?? "—"} />
            <InfoField label="الدائرة" value={caseData.circuit ?? "—"} />
            <InfoField
              label="الدرجة"
              value={
                caseData.degree === "primary"
                  ? "ابتدائي"
                  : caseData.degree === "appeal"
                  ? "استئناف"
                  : caseData.degree === "cassation"
                  ? "نقض"
                  : caseData.degree
              }
            />
            <InfoField label="الموكل" value={caseData.client?.fullName ?? "—"} />
            <InfoField label="الخصم" value={caseData.opponentName ?? "—"} />
            <InfoField label="محامي الخصم" value={caseData.opponentLawyer ?? "—"} />
            <InfoField label="قاضي الدائرة" value={caseData.judgeName ?? "—"} />
            <InfoField label="تاريخ الرفع" value={formatDate(caseData.startDate)} />
            {caseData.estimatedValue != null && (
              <InfoField
                label="القيمة التقديرية"
                value={formatCurrency(caseData.estimatedValue)}
              />
            )}
          </CardContent>
        </Card>

        {/* شبكة الإحصائيات */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">{s.label}</div>
                      <div className="truncate text-base font-bold">{s.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* الوقائع والاستراتيجية */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-amber-600" />
                الوقائع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {caseData.facts ?? "لم تُدخل الوقائع بعد."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-violet-600" />
                الاستراتيجية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {caseData.strategy ?? "لم تُحدد الاستراتيجية بعد."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* العمود الأيسر: نسبة الاكتمال + التنبيهات + الإجراءات السريعة */}
      <div className="space-y-4">
        {/* نسبة اكتمال الملف */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              نسبة اكتمال الملف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-emerald-600">{completion}%</span>
              <span className="text-xs text-muted-foreground">
                {completion === 100 ? "ملف مكتمل" : completion >= 60 ? "جيد" : "يحتاج إكمال"}
              </span>
            </div>
            {/* شريط تقدم مخصص RTL */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute right-0 top-0 h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              <CompletionCheck label="الموكل" done={!!caseData.clientId} />
              <CompletionCheck label="الخصم" done={!!caseData.opponentName} />
              <CompletionCheck label="المستندات" done={docs.length > 0} />
              <CompletionCheck label="الجلسات" done={sessions.length > 0} />
              <CompletionCheck label="الوقائع" done={!!caseData.facts} />
              <CompletionCheck label="الاستراتيجية" done={!!caseData.strategy} />
              <CompletionCheck label="المحكمة" done={!!caseData.court} />
            </div>
          </CardContent>
        </Card>

        {/* لوحة التنبيهات الاستباقية */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BellRing className="h-4 w-4 text-amber-600" />
              التنبيهات الذكية
            </CardTitle>
            <CardDescription className="text-[11px]">
              تنبيهات استباقية مولّدة آلياً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                لا توجد تنبيهات — الوضع جيد
              </div>
            ) : (
              alerts.map((a, i) => {
                const Icon = a.icon;
                const colors = {
                  warning: "border-amber-200 bg-amber-50 text-amber-800",
                  danger: "border-rose-200 bg-rose-50 text-rose-800",
                  info: "border-cyan-200 bg-cyan-50 text-cyan-800",
                  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
                }[a.type];
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                      colors
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{a.text}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* الإجراءات السريعة */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-emerald-600" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <button
                  key={i}
                  onClick={qa.action}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-center transition-colors hover:bg-muted"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", qa.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">{qa.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function CompletionCheck({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-1",
        done ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span className="truncate">{label}</span>
    </div>
  );
}

// ============================================================
// تبويب: الخط الزمني الذكي
// ============================================================

function TimelineTab({ caseId }: { caseId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-timeline-full", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?caseId=${caseId}&limit=100`);
      return res.json();
    },
    enabled: !!caseId,
  });

  if (isLoading) return <TabSkeleton lines={6} />;
  if (error) return <ErrorState />;
  const events: TimelineEvent[] = data?.events ?? [];
  if (events.length === 0) return <EmptyState icon={History} title="لا توجد أحداث" subtitle="لم تُسجل أي أحداث لهذه القضية بعد" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-emerald-600" />
          الخط الزمني للقضية
          <Badge variant="secondary" className="mr-auto">{events.length} حدث</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="relative space-y-1">
            {/* الخط العمودي */}
            <div className="absolute right-[18px] top-2 bottom-2 w-0.5 bg-border" />
            {events.map((ev) => {
              const meta = TIMELINE_EVENT_META[ev.eventType] ?? TIMELINE_EVENT_META.custom;
              const Icon = meta.icon;
              const isExpanded = expanded === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setExpanded(isExpanded ? null : ev.id)}
                  className="relative flex w-full gap-3 rounded-lg p-2 text-right transition-colors hover:bg-muted/60"
                >
                  {/* النقطة */}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-white", meta.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  {/* المحتوى */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{ev.title}</span>
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(ev.createdAt, true)}
                      {ev.user?.name && (
                        <>
                          <span>·</span>
                          <Users className="h-3 w-3" />
                          {ev.user.name}
                        </>
                      )}
                    </div>
                    {ev.description && (
                      <p
                        className={cn(
                          "mt-1 text-xs text-muted-foreground",
                          !isExpanded && "line-clamp-1"
                        )}
                      >
                        {ev.description}
                      </p>
                    )}
                    {isExpanded && (
                      <div className="mt-2 space-y-1 rounded-lg border border-border bg-muted/40 p-2 text-xs">
                        {(() => {
                          const meta2 = safeJsonParse<Record<string, unknown>>(ev.metadata);
                          if (!meta2) {
                            return <div className="text-muted-foreground">لا توجد تفاصيل إضافية</div>;
                          }
                          return Object.entries(meta2).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2">
                              <span className="text-muted-foreground">{k}:</span>
                              <span className="font-mono">{String(v)}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                  {ev.description && (
                    <ChevronLeft
                      className={cn(
                        "mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isExpanded && "-rotate-90"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================================
// تبويب: المستندات
// ============================================================

function DocumentsTab({
  caseId,
  caseData,
  onInvalidate,
  toast,
}: {
  caseId: string;
  caseData: CaseItem;
  onInvalidate: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-docs-full", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?caseId=${caseId}`);
      return res.json();
    },
    enabled: !!caseId,
  });

  const docs: DocumentItem[] = data?.documents ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">مستكشف المستندات</h3>
          <p className="text-xs text-muted-foreground">
            مستندات القضية + المستندات المرتبطة بالموكل والخصم
          </p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Upload className="ml-2 h-4 w-4" />
          رفع مستند
        </Button>
      </div>

      {/* بطاقات استكشاف المستندات حسب الكيان */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DocExplorerStat
          icon={Briefcase}
          label="مستندات القضية"
          value={docs.length}
          color="bg-emerald-50 text-emerald-700"
        />
        <DocExplorerStat
          icon={Users}
          label="مستندات الموكل"
          value={docs.filter((d) => d.documentLinks?.some((l) => l.clientId)).length}
          color="bg-amber-50 text-amber-700"
        />
        <DocExplorerStat
          icon={FileSignature}
          label="العقود المرتبطة"
          value={docs.filter((d) => d.category === "contract").length}
          color="bg-violet-50 text-violet-700"
        />
        <DocExplorerStat
          icon={Award}
          label="الأحكام والمذكرات"
          value={docs.filter((d) => d.category === "ruling" || d.category === "pleading").length}
          color="bg-rose-50 text-rose-700"
        />
      </div>

      {/* قائمة المستندات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">كل المستندات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TabSkeleton lines={4} />
          ) : error ? (
            <ErrorState />
          ) : docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد مستندات"
              subtitle="ارفع أول مستند لهذه القضية"
            />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {docs.map((doc) => {
                const Icon = DOC_TYPE_ICON[doc.docType ?? "other"] ?? FileText;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{doc.title}</span>
                        {doc.category && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {DOC_CATEGORY_LABEL[doc.category] ?? doc.category}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>·</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>
                          <Eye className="ml-2 h-4 w-4" /> معاينة
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="ml-2 h-4 w-4" /> تنزيل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link2 className="ml-2 h-4 w-4" /> ربط بكيان آخر
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600">
                          <Archive className="ml-2 h-4 w-4" /> أرشفة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار رفع مستند */}
      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        caseId={caseId}
        clientId={caseData.clientId}
        onUploaded={() => {
          onInvalidate();
          toast({ title: "تم رفع المستند بنجاح" });
          setUploadOpen(false);
        }}
        toast={toast}
      />
    </div>
  );
}

function DocExplorerStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  caseId,
  clientId,
  onUploaded,
  toast,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  caseId: string;
  clientId?: string;
  onUploaded: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || fileName || "مستند جديد",
          description,
          category,
          docType: "other",
          fileName,
          fileSize,
          caseId,
          clientId,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onUploaded();
        setTitle("");
        setDescription("");
        setFileName("");
        setFileSize(null);
      } else {
        toast({ title: "فشل الرفع", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "خطأ في الرفع", variant: "destructive" });
    },
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      setFileSize(f.size);
      if (!title) setTitle(f.name);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفع مستند جديد</DialogTitle>
          <DialogDescription>ارفع مستنداً واربطه بهذه القضية</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>العنوان</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان المستند"
            />
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف موجز"
              rows={2}
            />
          </div>
          <div>
            <Label>الفئة</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">عقد</SelectItem>
                <SelectItem value="pleading">مذكرة</SelectItem>
                <SelectItem value="ruling">حكم</SelectItem>
                <SelectItem value="evidence">دليل</SelectItem>
                <SelectItem value="correspondence">مراسلة</SelectItem>
                <SelectItem value="id_card">بطاقة</SelectItem>
                <SelectItem value="power_of_attorney">توكيل</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الملف</Label>
            <Input type="file" onChange={onFileChange} />
            {fileName && (
              <p className="mt-1 text-xs text-muted-foreground">
                {fileName} ({formatFileSize(fileSize)})
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="ml-2 h-4 w-4" />
            )}
            رفع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// تبويب: الجلسات
// ============================================================

function HearingsTab({
  caseId,
  caseData,
  onInvalidate,
  toast,
}: {
  caseId: string;
  caseData: CaseItem;
  onInvalidate: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const sessions = caseData.sessions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">جلسات القضية</h3>
          <p className="text-xs text-muted-foreground">
            عدد الجلسات: {sessions.length}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="ml-2 h-4 w-4" />
          إضافة جلسة
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={Gavel} title="لا توجد جلسات" subtitle="أضف أول جلسة لهذه القضية" />
      ) : (
        <div className="space-y-2">
          {sessions.map((s, idx) => {
            const isPast = new Date(s.sessionDate) < new Date();
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          isPast
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <Gavel className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            جلسة #{s.sessionNumber ?? sessions.length - idx}
                          </span>
                          {isPast ? (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600">
                              منعقدة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
                              قادمة
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(s.sessionDate, true)}
                          </span>
                          {s.court && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {s.court}
                            </span>
                          )}
                          {s.judgeName && (
                            <span className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              {s.judgeName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {(s.purpose || s.decisions || s.adjournReason) && (
                    <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                      {s.purpose && (
                        <div>
                          <span className="text-muted-foreground">الغرض: </span>
                          <span>{s.purpose}</span>
                        </div>
                      )}
                      {s.decisions && (
                        <div>
                          <span className="text-muted-foreground">القرارات: </span>
                          <span>{s.decisions}</span>
                        </div>
                      )}
                      {s.adjournReason && (
                        <div className="rounded bg-amber-50 px-2 py-1 text-amber-800">
                          <span className="font-medium">سبب التأجيل: </span>
                          <span>{s.adjournReason}</span>
                        </div>
                      )}
                      {s.nextSessionDate && (
                        <div className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                          <span className="font-medium">الجلسة القادمة: </span>
                          <span>{formatDate(s.nextSessionDate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddSessionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        caseId={caseId}
        onAdded={() => {
          onInvalidate();
          toast({ title: "تمت إضافة الجلسة" });
          setAddOpen(false);
        }}
        toast={toast}
      />
    </div>
  );
}

function AddSessionDialog({
  open,
  onOpenChange,
  caseId,
  onAdded,
  toast,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  caseId: string;
  onAdded: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [sessionDate, setSessionDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [court, setCourt] = useState("");
  const [judgeName, setJudgeName] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate,
          purpose,
          court,
          judgeName,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onAdded();
        setSessionDate("");
        setPurpose("");
        setCourt("");
        setJudgeName("");
      } else {
        toast({ title: data.error ?? "فشل الإضافة", variant: "destructive" });
      }
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة جلسة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>تاريخ الجلسة</Label>
            <Input
              type="datetime-local"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <div>
            <Label>الغرض</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="مثال: مرافعة" />
          </div>
          <div>
            <Label>المحكمة</Label>
            <Input value={court} onChange={(e) => setCourt(e.target.value)} />
          </div>
          <div>
            <Label>القاضي</Label>
            <Input value={judgeName} onChange={(e) => setJudgeName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !sessionDate}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {addMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// تبويب: المهام
// ============================================================

function TasksTab({
  caseId,
  caseData,
  onInvalidate,
  toast,
}: {
  caseId: string;
  caseData: CaseItem;
  onInvalidate: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-tasks-full", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?caseId=${caseId}`);
      return res.json();
    },
    enabled: !!caseId,
  });

  const tasks: TaskItem[] = data?.tasks ?? caseData.tasks ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">مهام القضية</h3>
          <p className="text-xs text-muted-foreground">إجمالي: {tasks.length}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="ml-2 h-4 w-4" />
          مهمة جديدة
        </Button>
      </div>

      {isLoading ? (
        <TabSkeleton lines={4} />
      ) : error ? (
        <ErrorState />
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="لا توجد مهام" subtitle="أنشئ أول مهمة لهذه القضية" />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const overdue =
              t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed";
            return (
              <Card key={t.id} className={cn(overdue && "border-rose-300 bg-rose-50/40")}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      t.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : overdue
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          t.status === "completed" && "text-muted-foreground line-through"
                        )}
                      >
                        {t.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px]", PRIORITY_BADGE[t.priority])}
                      >
                        {t.priority === "urgent"
                          ? "عاجل"
                          : t.priority === "high"
                          ? "مرتفع"
                          : t.priority === "medium"
                          ? "متوسط"
                          : "منخفض"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px]", TASK_STATUS_BADGE[t.status])}
                      >
                        {t.status === "todo"
                          ? "للتنفيذ"
                          : t.status === "in_progress"
                          ? "قيد التنفيذ"
                          : t.status === "completed"
                          ? "مكتملة"
                          : "ملغاة"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {t.dueDate && (
                        <span className={cn("flex items-center gap-1", overdue && "text-rose-600 font-medium")}>
                          <Clock className="h-3 w-3" />
                          {formatDate(t.dueDate)}
                        </span>
                      )}
                      {t.assignedTo?.name && (
                        <>
                          <span>·</span>
                          <Users className="h-3 w-3" />
                          {t.assignedTo.name}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        caseId={caseId}
        onAdded={() => {
          onInvalidate();
          toast({ title: "تمت إضافة المهمة" });
          setAddOpen(false);
        }}
        toast={toast}
      />
    </div>
  );
}

function AddTaskDialog({
  open,
  onOpenChange,
  caseId,
  onAdded,
  toast,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  caseId: string;
  onAdded: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority,
          dueDate: dueDate || null,
          caseId,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onAdded();
        setTitle("");
        setPriority("medium");
        setDueDate("");
      } else {
        toast({ title: "فشل", variant: "destructive" });
      }
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مهمة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">عاجل</SelectItem>
                <SelectItem value="high">مرتفع</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !title}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {addMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// تبويب: المساعد الذكي (Legal Brain)
// ============================================================

function AIAssistantTab({ caseId, caseData }: { caseId: string; caseData: CaseItem }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`workspace-brain-${caseId}-${Date.now()}`);

  useEffect(() => {
    setMessages([]);
    sessionIdRef.current = `workspace-brain-${caseId}-${Date.now()}`;
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/legal-brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: sessionIdRef.current,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          context: { caseId },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response.answer ?? "—" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `خطأ: ${data.error ?? "تعذر المعالجة"}` },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `خطأ في الاتصال: ${e instanceof Error ? e.message : "غير معروف"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, caseId]);

  const quickPrompts = [
    "لخّص وقائع هذه القضية",
    "ما الاستراتيجية المقترحة؟",
    "ما هي نقاط الضعف في موقفنا؟",
    "اقترح إجراءات عاجلة",
  ];

  return (
    <div className="space-y-3">
      {/* لافتة سياق القضية */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-800">
              المساعد القانوني يعرف سياق هذه القضية
            </div>
            <div className="text-xs text-emerald-700">
              القضية {caseData.internalNumber} — {caseData.client?.fullName ?? "—"}
            </div>
          </div>
          <Badge variant="outline" className="mr-auto border-emerald-300 bg-white text-emerald-700">
            <Sparkles className="ml-1 h-3 w-3" />
            سياق مفعّل
          </Badge>
        </CardContent>
      </Card>

      {/* نافذة المحادثة */}
      <Card>
        <CardContent className="flex h-[55vh] flex-col p-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
                    <Brain className="h-7 w-7 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold">المساعد القانوني الذكي</p>
                    <p className="text-xs text-muted-foreground">
                      اسأل أي سؤال عن هذه القضية — العقل القانوني يحلّل ويجيب مع السياق الكامل
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setInput(p)}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                      m.role === "user" ? "bg-emerald-600" : "bg-violet-600"
                    )}
                  >
                    {m.role === "user" ? <Users className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">يفكّر...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* صندوق الإدخال */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="اكتب سؤالك عن القضية..."
                className="bg-muted"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// تبويب: الأحكام
// ============================================================

function JudgmentsTab({ caseData }: { caseData: CaseItem }) {
  const procedures = caseData.procedures ?? [];
  const judgments = procedures.filter((p) => p.type === "ruling");
  const hasResult = !!caseData.result;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">الأحكام الصادرة</h3>
        <p className="text-xs text-muted-foreground">
          الأحكام المرتبطة بالقضية — مصدرها إجراءات نوع "حكم"
        </p>
      </div>

      {/* النتيجة النهائية */}
      {hasResult && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
              <Award className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">النتيجة النهائية للقضية</div>
              <div className="text-base font-bold text-rose-800">{caseData.result}</div>
            </div>
            <Badge variant="outline" className="border-rose-300 bg-white text-rose-700">
              {getCaseStatusLabel(caseData.status)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {judgments.length === 0 ? (
        <EmptyState
          icon={Award}
          title="لا توجد أحكام بعد"
          subtitle="سيظهر هنا أي حكم يُسجَّل في إجراءات القضية"
        />
      ) : (
        <div className="space-y-2">
          {judgments.map((j) => (
            <Card key={j.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{j.description}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatDate(j.date)}
                      </Badge>
                    </div>
                    {j.result && (
                      <p className="mt-1 text-sm text-muted-foreground">{j.result}</p>
                    )}
                    {j.performedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        الجهة: {j.performedBy}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب: التنفيذ
// ============================================================

function ExecutionTab({ caseData }: { caseData: CaseItem }) {
  const procedures = caseData.procedures ?? [];
  const executions = procedures.filter((p) => p.type === "execution");
  const status = caseData.executionStatus ?? "none";

  const statusMap: Record<string, { label: string; color: string }> = {
    none: { label: "لم يبدأ التنفيذ", color: "bg-slate-100 text-slate-700" },
    in_progress: { label: "جاري التنفيذ", color: "bg-amber-100 text-amber-700" },
    completed: { label: "تم التنفيذ", color: "bg-emerald-100 text-emerald-700" },
    suspended: { label: "موقوف", color: "bg-rose-100 text-rose-700" },
  };
  const statusInfo = statusMap[status] ?? statusMap.none;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">إجراءات التنفيذ</h3>
        <p className="text-xs text-muted-foreground">حالة ومآل إجراءات تنفيذ الحكم</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">حالة التنفيذ</div>
            <Badge variant="outline" className={cn("text-sm", statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {executions.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="لا توجد إجراءات تنفيذ"
          subtitle="ستظهر هنا إجراءات التنفيذ بمجرد تسجيلها"
        />
      ) : (
        <div className="space-y-2">
          {executions.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{e.description}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatDate(e.date)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          e.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : e.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-700"
                        )}
                      >
                        {e.status === "completed" ? "مكتمل" : e.status === "pending" ? "معلّق" : e.status}
                      </Badge>
                    </div>
                    {e.result && (
                      <p className="mt-1 text-sm text-muted-foreground">{e.result}</p>
                    )}
                    {e.nextAction && (
                      <p className="mt-1 text-xs text-emerald-700">
                        الإجراء التالي: {e.nextAction}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب: الحسابات
// ============================================================

function AccountingTab({ caseId, caseData }: { caseId: string; caseData: CaseItem }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-finance", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/finance?type=all`);
      return res.json();
    },
    enabled: !!caseId,
  });

  const fees: FeeItem[] = (data?.fees ?? caseData.fees ?? []).filter(
    (f: FeeItem) => f.caseId === caseId || (caseData.fees ?? []).some((cf) => cf.id === f.id)
  );
  const expenses: ExpenseItem[] = (data?.expenses ?? caseData.expenses ?? []).filter(
    (e: ExpenseItem) => ("caseId" in e && (e as any).caseId === caseId) || (caseData.expenses ?? []).some((ce) => ce.id === e.id)
  );

  const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalRemaining = totalFees - totalPaid;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const summaryCards = [
    { label: "إجمالي الأتعاب", value: formatCurrency(totalFees), icon: DollarSign, color: "bg-emerald-50 text-emerald-700" },
    { label: "المحصّل", value: formatCurrency(totalPaid), icon: CheckCircle2, color: "bg-cyan-50 text-cyan-700" },
    { label: "المتبقي", value: formatCurrency(totalRemaining), icon: AlertCircle, color: "bg-amber-50 text-amber-700" },
    { label: "المصروفات", value: formatCurrency(totalExpenses), icon: TrendingUp, color: "bg-rose-50 text-rose-700" },
  ];

  if (isLoading) return <TabSkeleton lines={5} />;
  if (error) return <ErrorState />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">حسابات القضية</h3>
        <p className="text-xs text-muted-foreground">الأتعاب والمدفوعات والمصروفات</p>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <CardContent className="p-3">
                <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", s.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
                <div className="text-base font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* جدول الأتعاب */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">جدول الأتعاب</CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <EmptyState icon={DollarSign} title="لا توجد أتعاب مسجّلة" subtitle="" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">
                        {f.feeType === "fixed" ? "ثابتة" : f.feeType === "hourly" ? "بالساعة" : f.feeType === "percentage" ? "بالنسبة" : f.feeType}
                      </TableCell>
                      <TableCell>{formatCurrency(f.amount)}</TableCell>
                      <TableCell className="text-emerald-700">{formatCurrency(f.paidAmount)}</TableCell>
                      <TableCell className="text-amber-700">{formatCurrency(f.amount - f.paidAmount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            f.status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : f.status === "partial"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          )}
                        >
                          {f.status === "paid" ? "مدفوعة" : f.status === "partial" ? "جزئية" : "غير مدفوعة"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* جدول المصروفات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">جدول المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyState icon={TrendingUp} title="لا توجد مصروفات" subtitle="" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.category === "court_fees" ? "رسوم قضايا" : e.category === "travel" ? "تنقل" : e.category === "documents" ? "مستندات" : e.category === "experts" ? "خبراء" : e.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(e.amount)}</TableCell>
                      <TableCell>{formatDate(e.expenseDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// تبويب: العلاقات (Graph)
// ============================================================

function RelationsTab({ caseData }: { caseData: CaseItem }) {
  // بناء علاقات بيانية بسيطة بالـ divs
  const nodes: { id: string; label: string; sub?: string; icon: LucideIcon; color: string; angle: number }[] = [];

  const ringItems: { id: string; label: string; sub?: string; icon: LucideIcon; color: string }[] = [
    {
      id: "client",
      label: "الموكل",
      sub: caseData.client?.fullName,
      icon: Users,
      color: "bg-emerald-500",
    },
    {
      id: "opponent",
      label: "الخصم",
      sub: caseData.opponentName ?? "—",
      icon: AlertCircle,
      color: "bg-rose-500",
    },
    {
      id: "documents",
      label: "المستندات",
      sub: `${caseData._count?.documentLinks ?? caseData.sessions?.length ?? 0}`,
      icon: FileText,
      color: "bg-amber-500",
    },
    {
      id: "sessions",
      label: "الجلسات",
      sub: `${caseData._count?.sessions ?? caseData.sessions?.length ?? 0}`,
      icon: Gavel,
      color: "bg-cyan-500",
    },
    {
      id: "judgments",
      label: "الأحكام",
      sub: `${(caseData.procedures ?? []).filter((p) => p.type === "ruling").length}`,
      icon: Award,
      color: "bg-violet-500",
    },
    {
      id: "execution",
      label: "التنفيذ",
      sub: caseData.executionStatus ?? "none",
      icon: Zap,
      color: "bg-orange-500",
    },
    {
      id: "tasks",
      label: "المهام",
      sub: `${caseData._count?.tasks ?? caseData.tasks?.length ?? 0}`,
      icon: CheckSquare,
      color: "bg-emerald-600",
    },
    {
      id: "court",
      label: "المحكمة",
      sub: caseData.court ?? "—",
      icon: Building2,
      color: "bg-slate-600",
    },
  ];

  // توزيع دائري
  const radius = 200; // px
  ringItems.forEach((item, i) => {
    const angle = (i / ringItems.length) * 2 * Math.PI - Math.PI / 2;
    nodes.push({ ...item, angle });
  });

  const centerX = 280;
  const centerY = 220;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">خريطة العلاقات</h3>
        <p className="text-xs text-muted-foreground">
          علاقة القضية بالكيانات المرتبطة بها
        </p>
      </div>

      <Card>
        <CardContent className="p-2">
          <div
            className="relative mx-auto"
            style={{ width: 560, height: 440, maxWidth: "100%" }}
          >
            {/* خطوط SVG من المركز لكل عقدة */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 560 440"
              preserveAspectRatio="xMidYMid meet"
            >
              {nodes.map((n) => {
                const x = centerX + radius * Math.cos(n.angle);
                const y = centerY + radius * Math.sin(n.angle);
                return (
                  <line
                    key={n.id}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    className="text-border"
                  />
                );
              })}
            </svg>

            {/* العقدة المركزية (القضية) */}
            <div
              className="absolute z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg"
              style={{ left: centerX, top: centerY }}
            >
              <Briefcase className="h-6 w-6" />
              <div className="mt-1 text-[10px] font-medium">القضية</div>
              <div className="max-w-[80px] truncate text-[9px] opacity-80">
                {caseData.internalNumber}
              </div>
            </div>

            {/* العقد الطرفية */}
            {nodes.map((n) => {
              const Icon = n.icon;
              const x = centerX + radius * Math.cos(n.angle);
              const y = centerY + radius * Math.sin(n.angle);
              return (
                <div
                  key={n.id}
                  className="absolute z-10 flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: x, top: y }}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md",
                      n.color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-1 text-center">
                    <div className="text-[11px] font-semibold">{n.label}</div>
                    {n.sub && (
                      <div className="max-w-[100px] truncate text-[10px] text-muted-foreground">
                        {n.sub}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* قائمة العلاقات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">قائمة الكيانات المرتبطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ringItems.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", r.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{r.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// تبويب: سجل التدقيق
// ============================================================

function AuditTab({ caseId }: { caseId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-audit", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?caseId=${caseId}&limit=200`);
      return res.json();
    },
    enabled: !!caseId,
  });

  if (isLoading) return <TabSkeleton lines={6} />;
  if (error) return <ErrorState />;

  const events: TimelineEvent[] = data?.events ?? [];
  const auditEvents = events.filter((e) =>
    ["created", "updated", "status_changed", "document_uploaded", "linked", "unlinked", "archived", "sent", "session_added", "procedure_added", "task_created", "memo_created"].includes(
      e.eventType
    )
  );

  if (auditEvents.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="لا توجد سجلات تدقيق"
        subtitle="ستظهر هنا كل العمليات المسجّلة على هذه القضية"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          سجل التدقيق
          <Badge variant="secondary" className="mr-auto">{auditEvents.length} عملية</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>العملية</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>التوقيت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.map((ev) => {
                const meta = TIMELINE_EVENT_META[ev.eventType] ?? TIMELINE_EVENT_META.custom;
                return (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        {ev.user?.name ?? "النظام"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground">
                      <div className="truncate">{ev.title}</div>
                      {ev.description && (
                        <div className="truncate text-[11px] opacity-70">
                          {ev.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(ev.createdAt, true)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// مكوّنات مساعدة مشتركة
// ============================================================

function TabSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState() {
  return (
    <Card className="border-rose-200 bg-rose-50/40">
      <CardContent className="flex items-center gap-3 p-4 text-rose-800">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          تعذّر تحميل البيانات. حاول مرة أخرى لاحقاً.
        </div>
      </CardContent>
    </Card>
  );
}
