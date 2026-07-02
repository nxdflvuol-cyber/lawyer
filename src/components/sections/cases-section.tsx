"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useMemo, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  CASE_TYPES,
  CASE_STATUS,
  CASE_DEGREE,
  TASK_PRIORITY,
  TASK_STATUS,
  FEE_TYPES,
  EXPENSE_CATEGORIES,
  DOCUMENT_CATEGORIES,
  PROCEDURE_TYPES,
  formatCurrency,
  formatDate,
  getCaseTypeLabel,
  getCaseStatusLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  Users,
  Scale,
  Gavel,
  Calendar,
  FileText,
  CheckSquare,
  DollarSign,
  Clock,
  TrendingUp,
  Award,
  AlertCircle,
  X,
  Edit3,
  Save,
  Trash2,
  ChevronLeft,
  Building2,
  User,
  Phone,
  Mail,
  StickyNote,
  History,
  ChevronDown,
  Activity,
  ListChecks,
  Receipt,
  FolderOpen,
  CalendarClock,
  ClipboardList,
  Eye,
  Target,
  Info,
  FileCheck,
  Loader2,
  CheckCircle2,
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
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
}

interface FeeItem {
  id: string;
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
  category: string;
  amount: number;
  description?: string | null;
  expenseDate: string;
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
  facts?: string | null;
  strategy?: string | null;
  estimatedValue?: number | null;
  priority: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  sessions?: Session[];
  procedures?: Procedure[];
  documents?: DocumentItem[];
  tasks?: TaskItem[];
  fees?: FeeItem[];
  expenses?: ExpenseItem[];
  _count?: {
    sessions?: number;
    documents?: number;
    tasks?: number;
    procedures?: number;
  };
}

// ============================================================
// مكوّن مساعد لحالة القضية
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config = CASE_STATUS.find((s) => s.value === status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent text-white",
        config?.color ?? "bg-slate-500"
      )}
    >
      {getCaseStatusLabel(status)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = TASK_PRIORITY.find((p) => p.value === priority);
  if (!config) return <Badge variant="outline">{priority}</Badge>;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function CasesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const selectCase = useNavStore((s) => s.selectCase);
  const selectedCaseId = useNavStore((s) => s.selectedCaseId);
  const setSection = useNavStore((s) => s.setSection);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [degreeFilter, setDegreeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);

  // مزامنة مع متجر التنقل - باستخدام useEffect
  useEffect(() => {
    if (selectedCaseId && !detailCaseId) {
      setDetailCaseId(selectedCaseId);
    }
  }, [selectedCaseId, detailCaseId]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (typeFilter !== "all") p.set("caseType", typeFilter);
    return p.toString();
  }, [search, statusFilter, typeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["cases", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/cases?${queryParams}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const cases: CaseItem[] = data?.cases ?? [];

  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => c.status === "active").length;
    const closed = cases.filter((c) => c.status === "closed").length;
    const won = cases.filter((c) => c.status === "won").length;
    return { total, active, closed, won };
  }, [cases]);

  function openCase(id: string) {
    setDetailCaseId(id);
    selectCase(id);
  }

  function closeCase() {
    setDetailCaseId(null);
    selectCase(null);
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم حذف القضية بنجاح" });
      closeCase();
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    },
  });

  const statCards = [
    {
      title: "إجمالي القضايا",
      value: stats.total,
      icon: Briefcase,
      color: "text-primary bg-primary/10",
    },
    {
      title: "قضايا نشطة",
      value: stats.active,
      icon: Activity,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "منتهية",
      value: stats.closed,
      icon: CheckSquare,
      color: "text-slate-600 bg-slate-100",
    },
    {
      title: "كسب",
      value: stats.won,
      icon: Award,
      color: "text-emerald-700 bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary" />
            إدارة القضايا
          </h1>
          <p className="text-muted-foreground mt-1">
            متابعة شاملة لجميع قضايا المكتب مع التفاصيل والإجراءات
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setSection("clients")}>
            <Users className="w-4 h-4 ml-2" />
            الموكلون
          </Button>
          <Button
            variant="outline"
            onClick={() => setSection("precases")}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <FileCheck className="w-4 h-4 ml-2" />
            إجراءات ما قبل رفع الدعوى
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 ml-2" />
            قضية جديدة
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", card.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث برقم القضية، الخصم، أو اسم الموكل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {CASE_STATUS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {CASE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-3.5 h-3.5 ml-1" />
                <SelectValue placeholder="درجة التقاضي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدرجات</SelectItem>
                {CASE_DEGREE.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search ||
              statusFilter !== "all" ||
              typeFilter !== "all" ||
              degreeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setDegreeFilter("all");
                }}
              >
                <X className="w-3.5 h-3.5 ml-1" />
                مسح الفلاتر
              </Button>
            )}
            <span className="text-sm text-muted-foreground mr-auto">
              {cases.length} قضية
            </span>
          </div>
        </CardContent>
      </Card>

      {/* قائمة القضايا */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            قائمة القضايا
          </CardTitle>
          <CardDescription>
            اضغط على أي قضية لعرض التفاصيل الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="لا توجد قضايا"
              description="ابدأ بإضافة قضية جديدة لإدارة قضايا مكتبك القانونية"
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة قضية
                </Button>
              }
            />
          ) : (
            <ScrollArea className="max-h-[calc(100vh-22rem)]">
              <div className="space-y-2 p-4">
                {cases.map((c) => {
                  const filtered = degreeFilter === "all" || c.degree === degreeFilter;
                  if (!filtered) return null;
                  return (
                    <CaseRow
                      key={c.id}
                      caseItem={c}
                      onClick={() => openCase(c.id)}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء قضية */}
      <CreateCaseDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(id) => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["cases"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          openCase(id);
        }}
      />

      {/* لوحة تفاصيل القضية */}
      <CaseDetailSheet
        caseId={detailCaseId}
        open={!!detailCaseId}
        onClose={closeCase}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}

// ============================================================
// صف القضية في القائمة
// ============================================================

function CaseRow({
  caseItem,
  onClick,
}: {
  caseItem: CaseItem;
  onClick: () => void;
}) {
  const lastSession = caseItem.sessions?.[0];
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">
                {caseItem.internalNumber}
                {caseItem.officialNumber && (
                  <span className="text-muted-foreground font-normal mr-2">
                    ({caseItem.officialNumber})
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                <User className="w-3.5 h-3.5 inline ml-1" />
                {caseItem.client?.fullName ?? "—"}
                {caseItem.opponentName && (
                  <>
                    <span className="mx-2 text-muted-foreground/50">|</span>
                    <Target className="w-3.5 h-3.5 inline ml-1" />
                    {caseItem.opponentName}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {getCaseTypeLabel(caseItem.caseType)}
              </Badge>
              <StatusBadge status={caseItem.status} />
              <PriorityBadge priority={caseItem.priority} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {caseItem.court ?? "—"}
            </span>
            {caseItem.caseSubType && (
              <span className="flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {caseItem.caseSubType}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {formatDate(caseItem.startDate)}
            </span>
            {lastSession && (
              <span className="flex items-center gap-1 text-amber-600">
                <Gavel className="w-3 h-3" />
                آخر جلسة: {formatDate(lastSession.sessionDate)}
              </span>
            )}
            {caseItem._count && (
              <div className="flex items-center gap-2 mr-auto">
                {caseItem._count.sessions! > 0 && (
                  <span className="flex items-center gap-1">
                    <Gavel className="w-3 h-3" />
                    {caseItem._count.sessions}
                  </span>
                )}
                {caseItem._count.documents! > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {caseItem._count.documents}
                  </span>
                )}
                {caseItem._count.tasks! > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    {caseItem._count.tasks}
                  </span>
                )}
              </div>
            )}
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// نافذة إنشاء قضية
// ============================================================

interface CreateCaseFormData {
  internalNumber: string;
  officialNumber: string;
  year: string;
  caseType: string;
  caseSubType: string;
  court: string;
  circuit: string;
  degree: string;
  judgeName: string;
  clientId: string;
  opponentName: string;
  opponentLawyer: string;
  startDate: string;
  facts: string;
  strategy: string;
  estimatedValue: string;
  priority: string;
  notes: string;
}

function CreateCaseDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateCaseFormData>({
    internalNumber: `${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    officialNumber: "",
    year: String(new Date().getFullYear()),
    caseType: "civil",
    caseSubType: "",
    court: "",
    circuit: "",
    degree: "primary",
    judgeName: "",
    clientId: "",
    opponentName: "",
    opponentLawyer: "",
    startDate: new Date().toISOString().slice(0, 10),
    facts: "",
    strategy: "",
    estimatedValue: "",
    priority: "medium",
    notes: "",
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-select"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const clients: Client[] = clientsData?.clients ?? [];

  const subTypes = useMemo(() => {
    return CASE_TYPES.find((t) => t.value === formData.caseType)?.subTypes ?? [];
  }, [formData.caseType]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateCaseFormData) => {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          year: Number(data.year),
          estimatedValue: data.estimatedValue
            ? Number(data.estimatedValue)
            : null,
          caseSubType: data.caseSubType || null,
          officialNumber: data.officialNumber || null,
          court: data.court || null,
          circuit: data.circuit || null,
          judgeName: data.judgeName || null,
          opponentName: data.opponentName || null,
          opponentLawyer: data.opponentLawyer || null,
          facts: data.facts || null,
          strategy: data.strategy || null,
          notes: data.notes || null,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم إنشاء القضية",
          description: `قضية ${data.case.internalNumber} بنجاح`,
        });
        queryClient.invalidateQueries({ queryKey: ["cases"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        onCreated(data.case.id);
      } else {
        toast({
          title: "فشل الإنشاء",
          description: data.error ?? "خطأ غير معروف",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "تعذّر إنشاء القضية",
        variant: "destructive",
      });
    },
  });

  function handleSubmit() {
    if (!formData.internalNumber || !formData.clientId || !formData.caseType) {
      toast({
        title: "بيانات ناقصة",
        description: "الرقم الداخلي والموكل ونوع القضية مطلوبون",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            قضية جديدة
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات القضية الأساسية. يمكن تعديلها لاحقاً من صفحة التفاصيل.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="internalNumber">
                  الرقم الداخلي <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="internalNumber"
                  value={formData.internalNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, internalNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="officialNumber">الرقم الرسمي</Label>
                <Input
                  id="officialNumber"
                  value={formData.officialNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, officialNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="year">السنة</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  الموكل <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, clientId: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الموكل" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        لا يوجد موكلون. أضف موكلاً أولاً.
                      </div>
                    ) : (
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName}
                          {c.phone ? ` - ${c.phone}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  نوع القضية <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, caseType: v, caseSubType: "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>التصنيف الدقيق</Label>
                <Select
                  value={formData.caseSubType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, caseSubType: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {subTypes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>درجة التقاضي</Label>
                <Select
                  value={formData.degree}
                  onValueChange={(v) =>
                    setFormData({ ...formData, degree: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_DEGREE.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="court">المحكمة</Label>
                <Input
                  id="court"
                  value={formData.court}
                  onChange={(e) =>
                    setFormData({ ...formData, court: e.target.value })
                  }
                  placeholder="مثال: محكمة شمال القاهرة"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="circuit">الدائرة</Label>
                <Input
                  id="circuit"
                  value={formData.circuit}
                  onChange={(e) =>
                    setFormData({ ...formData, circuit: e.target.value })
                  }
                  placeholder="مثال: الدائرة 5 مدني كلي"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="judgeName">اسم القاضي</Label>
                <Input
                  id="judgeName"
                  value={formData.judgeName}
                  onChange={(e) =>
                    setFormData({ ...formData, judgeName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opponentName">اسم الخصم</Label>
                <Input
                  id="opponentName"
                  value={formData.opponentName}
                  onChange={(e) =>
                    setFormData({ ...formData, opponentName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opponentLawyer">محامي الخصم</Label>
                <Input
                  id="opponentLawyer"
                  value={formData.opponentLawyer}
                  onChange={(e) =>
                    setFormData({ ...formData, opponentLawyer: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">تاريخ البدء</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedValue">القيمة المقدرة</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedValue: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facts">وقائع القضية</Label>
              <Textarea
                id="facts"
                value={formData.facts}
                onChange={(e) =>
                  setFormData({ ...formData, facts: e.target.value })
                }
                placeholder="وصف تفصيلي لوقائع القضية..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="strategy">الاستراتيجية</Label>
              <Textarea
                id="strategy"
                value={formData.strategy}
                onChange={(e) =>
                  setFormData({ ...formData, strategy: e.target.value })
                }
                placeholder="خطة الدفاع / الهجوم القانوني..."
                className="min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 ml-2 animate-pulse" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ القضية
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل القضية
// ============================================================

function CaseDetailSheet({
  caseId,
  open,
  onClose,
  onDelete,
}: {
  caseId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}`);
      return res.json();
    },
    enabled: !!caseId,
  });

  const caseData: CaseItem | null = data?.case ?? null;

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: "تم تحديث القضية بنجاح" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  if (!open || !caseId) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              ) : caseData ? (
                <>
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    {caseData.internalNumber}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                    <span>{caseData.client?.fullName}</span>
                    <Badge variant="outline" className="text-xs">
                      {getCaseTypeLabel(caseData.caseType)}
                    </Badge>
                    <StatusBadge status={caseData.status} />
                  </SheetDescription>
                </>
              ) : (
                <SheetTitle>القضية غير موجودة</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {caseData && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(!editing)}
                    title={editing ? "إلغاء التعديل" : "تعديل"}
                  >
                    {editing ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDelete(true)}
                    title="حذف"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : caseData ? (
          <>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-2 border-b bg-card/50">
                <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap">
                  <TabsTrigger value="overview" className="gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    نظرة عامة
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="gap-1">
                    <Gavel className="w-3.5 h-3.5" />
                    الجلسات
                  </TabsTrigger>
                  <TabsTrigger value="procedures" className="gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    الإجراءات
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    المستندات
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    المهام
                  </TabsTrigger>
                  <TabsTrigger value="finance" className="gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    المالية
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-1">
                    <History className="w-3.5 h-3.5" />
                    التسلسل الزمني
                  </TabsTrigger>
                  <TabsTrigger value="precase" className="gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    إجراءات ما قبل رفع الدعوى
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab
                      key={caseData.id}
                      caseData={caseData}
                      editing={editing}
                      onUpdate={(payload) => updateMutation.mutate(payload)}
                      saving={updateMutation.isPending}
                    />
                  </TabsContent>
                  <TabsContent value="sessions" className="mt-0">
                    <SessionsTab caseId={caseData.id} sessions={caseData.sessions ?? []} internalNumber={caseData.internalNumber} />
                  </TabsContent>
                  <TabsContent value="procedures" className="mt-0">
                    <ProceduresTab caseId={caseData.id} procedures={caseData.procedures ?? []} />
                  </TabsContent>
                  <TabsContent value="documents" className="mt-0">
                    <DocumentsTab caseId={caseData.id} documents={caseData.documents ?? []} />
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-0">
                    <TasksTab caseId={caseData.id} tasks={caseData.tasks ?? []} />
                  </TabsContent>
                  <TabsContent value="finance" className="mt-0">
                    <FinanceTab caseId={caseData.id} fees={caseData.fees ?? []} expenses={caseData.expenses ?? []} clientId={caseData.clientId} />
                  </TabsContent>
                  <TabsContent value="timeline" className="mt-0">
                    <TimelineTab caseData={caseData} />
                  </TabsContent>
                  <TabsContent value="precase" className="mt-0">
                    <PreCaseProceduresTab caseData={caseData} />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={AlertCircle}
              title="تعذّر تحميل القضية"
              description="حدث خطأ أثناء جلب بيانات القضية"
            />
          </div>
        )}
      </SheetContent>

      {/* تأكيد الحذف */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه القضية؟ سيتم حذف جميع الجلسات والإجراءات
              والمستندات المرتبطة بها نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (caseId) onDelete(caseId);
                setConfirmDelete(false);
              }}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

// ============================================================
// تبويب النظرة العامة
// ============================================================

function OverviewTab({
  caseData,
  editing,
  onUpdate,
  saving,
}: {
  caseData: CaseItem;
  editing: boolean;
  onUpdate: (payload: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    status: caseData.status,
    priority: caseData.priority,
    degree: caseData.degree,
    court: caseData.court ?? "",
    circuit: caseData.circuit ?? "",
    judgeName: caseData.judgeName ?? "",
    opponentName: caseData.opponentName ?? "",
    opponentLawyer: caseData.opponentLawyer ?? "",
    estimatedValue: caseData.estimatedValue ?? 0,
    facts: caseData.facts ?? "",
    strategy: caseData.strategy ?? "",
    notes: caseData.notes ?? "",
    judgeNotes: caseData.judgeNotes ?? "",
    result: caseData.result ?? "",
  });

  function handleSave() {
    onUpdate({
      status: form.status,
      priority: form.priority,
      degree: form.degree,
      court: form.court || null,
      circuit: form.circuit || null,
      judgeName: form.judgeName || null,
      opponentName: form.opponentName || null,
      opponentLawyer: form.opponentLawyer || null,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      facts: form.facts || null,
      strategy: form.strategy || null,
      notes: form.notes || null,
      judgeNotes: form.judgeNotes || null,
      result: form.result || null,
    });
  }

  const infoItems = [
    {
      label: "الرقم الرسمي",
      value: caseData.officialNumber ?? "—",
      icon: FileText,
    },
    {
      label: "السنة",
      value: String(caseData.year),
      icon: Calendar,
    },
    {
      label: "نوع القضية",
      value: `${getCaseTypeLabel(caseData.caseType)}${caseData.caseSubType ? ` - ${caseData.caseSubType}` : ""}`,
      icon: Scale,
    },
    {
      label: "درجة التقاضي",
      value:
        CASE_DEGREE.find((d) => d.value === caseData.degree)?.label ??
        caseData.degree,
      icon: Gavel,
    },
    {
      label: "تاريخ البدء",
      value: formatDate(caseData.startDate),
      icon: CalendarClock,
    },
    {
      label: "آخر تحديث",
      value: formatDate(caseData.updatedAt),
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-4">
      {/* بطاقة الموكل */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            بيانات الموكل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{caseData.client?.fullName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {caseData.client?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {caseData.client.phone}
                  </span>
                )}
                {caseData.client?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {caseData.client.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المعلومات الأساسية */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            المعلومات الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {infoItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-md bg-muted/40 border border-border/50"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <Card className="border-primary/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              تعديل البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>درجة التقاضي</Label>
                <Select
                  value={form.degree}
                  onValueChange={(v) => setForm({ ...form, degree: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_DEGREE.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المحكمة</Label>
                <Input
                  value={form.court}
                  onChange={(e) => setForm({ ...form, court: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الدائرة</Label>
                <Input
                  value={form.circuit}
                  onChange={(e) =>
                    setForm({ ...form, circuit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>اسم القاضي</Label>
                <Input
                  value={form.judgeName}
                  onChange={(e) =>
                    setForm({ ...form, judgeName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>القيمة المقدرة</Label>
                <Input
                  type="number"
                  value={form.estimatedValue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedValue: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الخصم</Label>
                <Input
                  value={form.opponentName}
                  onChange={(e) =>
                    setForm({ ...form, opponentName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>محامي الخصم</Label>
                <Input
                  value={form.opponentLawyer}
                  onChange={(e) =>
                    setForm({ ...form, opponentLawyer: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>وقائع القضية</Label>
              <Textarea
                value={form.facts}
                onChange={(e) => setForm({ ...form, facts: e.target.value })}
                className="min-h-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الاستراتيجية</Label>
              <Textarea
                value={form.strategy}
                onChange={(e) =>
                  setForm({ ...form, strategy: e.target.value })
                }
                className="min-h-20"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات القاضي</Label>
              <Textarea
                value={form.judgeNotes}
                onChange={(e) =>
                  setForm({ ...form, judgeNotes: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>النتيجة (إن وجدت)</Label>
              <Textarea
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات عامة</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Clock className="w-4 h-4 ml-2 animate-pulse" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ التعديلات
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseData.facts && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  وقائع القضية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {caseData.facts}
                </p>
              </CardContent>
            </Card>
          )}
          {caseData.strategy && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  الاستراتيجية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {caseData.strategy}
                </p>
              </CardContent>
            </Card>
          )}
          {caseData.judgeNotes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-primary" />
                  ملاحظات القاضي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {caseData.judgeNotes}
                </p>
              </CardContent>
            </Card>
          )}
          {caseData.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  ملاحظات عامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {caseData.notes}
                </p>
              </CardContent>
            </Card>
          )}
          {caseData.result && (
            <Card className="md:col-span-2 bg-emerald-50/50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <Award className="w-4 h-4" />
                  نتيجة القضية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {caseData.result}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب الجلسات
// ============================================================

function SessionsTab({
  caseId,
  sessions,
  internalNumber,
}: {
  caseId: string;
  sessions: Session[];
  internalNumber: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    sessionDate: "",
    sessionNumber: "",
    court: "",
    circuit: "",
    judgeName: "",
    purpose: "",
    facts: "",
    opponentRequests: "",
    opponentDefenses: "",
    lawyerPleading: "",
    decisions: "",
    adjournReason: "",
    nextSessionDate: "",
    courtStance: "",
    opponentStance: "",
    strategy: "",
    attendees: "",
    documentsRequested: "",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/cases/${caseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم إضافة الجلسة بنجاح" });
      setShowAdd(false);
      setForm({
        sessionDate: "",
        sessionNumber: "",
        court: "",
        circuit: "",
        judgeName: "",
        purpose: "",
        facts: "",
        opponentRequests: "",
        opponentDefenses: "",
        lawyerPleading: "",
        decisions: "",
        adjournReason: "",
        nextSessionDate: "",
        courtStance: "",
        opponentStance: "",
        strategy: "",
        attendees: "",
        documentsRequested: "",
      });
    },
    onError: () => {
      toast({ title: "فشل إضافة الجلسة", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.sessionDate) {
      toast({
        title: "تاريخ الجلسة مطلوب",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate({
      ...form,
      internalNumber,
      sessionNumber: form.sessionNumber ? Number(form.sessionNumber) : null,
      nextSessionDate: form.nextSessionDate || null,
      court: form.court || null,
      circuit: form.circuit || null,
      judgeName: form.judgeName || null,
      purpose: form.purpose || null,
      facts: form.facts || null,
      opponentRequests: form.opponentRequests || null,
      opponentDefenses: form.opponentDefenses || null,
      lawyerPleading: form.lawyerPleading || null,
      decisions: form.decisions || null,
      adjournReason: form.adjournReason || null,
      courtStance: form.courtStance || null,
      opponentStance: form.opponentStance || null,
      strategy: form.strategy || null,
      attendees: form.attendees || null,
      documentsRequested: form.documentsRequested || null,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Gavel className="w-4 h-4 text-primary" />
            جلسات القضية ({sessions.length})
          </h3>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة جلسة
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>
                  تاريخ الجلسة <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) =>
                    setForm({ ...form, sessionDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الجلسة</Label>
                <Input
                  type="number"
                  value={form.sessionNumber}
                  onChange={(e) =>
                    setForm({ ...form, sessionNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الغرض من الجلسة</Label>
                <Input
                  value={form.purpose}
                  onChange={(e) =>
                    setForm({ ...form, purpose: e.target.value })
                  }
                  placeholder="مثال: مرافعة، جلسة تأجيل..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>المحكمة</Label>
                <Input
                  value={form.court}
                  onChange={(e) => setForm({ ...form, court: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الدائرة</Label>
                <Input
                  value={form.circuit}
                  onChange={(e) =>
                    setForm({ ...form, circuit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>اسم القاضي</Label>
                <Input
                  value={form.judgeName}
                  onChange={(e) =>
                    setForm({ ...form, judgeName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>وقائع الجلسة</Label>
              <Textarea
                value={form.facts}
                onChange={(e) => setForm({ ...form, facts: e.target.value })}
                className="min-h-20"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>طلبات الخصم</Label>
                <Textarea
                  value={form.opponentRequests}
                  onChange={(e) =>
                    setForm({ ...form, opponentRequests: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>دفوع الخصم</Label>
                <Textarea
                  value={form.opponentDefenses}
                  onChange={(e) =>
                    setForm({ ...form, opponentDefenses: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>مرافعة المحامي</Label>
              <Textarea
                value={form.lawyerPleading}
                onChange={(e) =>
                  setForm({ ...form, lawyerPleading: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>قرارات المحكمة</Label>
                <Textarea
                  value={form.decisions}
                  onChange={(e) =>
                    setForm({ ...form, decisions: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>سبب التأجيل</Label>
                <Input
                  value={form.adjournReason}
                  onChange={(e) =>
                    setForm({ ...form, adjournReason: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>موقف المحكمة</Label>
                <Textarea
                  value={form.courtStance}
                  onChange={(e) =>
                    setForm({ ...form, courtStance: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>موقف الخصم</Label>
                <Textarea
                  value={form.opponentStance}
                  onChange={(e) =>
                    setForm({ ...form, opponentStance: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الاستراتيجية المتبعة</Label>
                <Textarea
                  value={form.strategy}
                  onChange={(e) =>
                    setForm({ ...form, strategy: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الحاضرون</Label>
                <Input
                  value={form.attendees}
                  onChange={(e) =>
                    setForm({ ...form, attendees: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>المستندات المطلوبة</Label>
                <Input
                  value={form.documentsRequested}
                  onChange={(e) =>
                    setForm({ ...form, documentsRequested: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الجلسة القادمة</Label>
              <Input
                type="datetime-local"
                value={form.nextSessionDate}
                onChange={(e) =>
                  setForm({ ...form, nextSessionDate: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ الجلسة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="لا توجد جلسات مسجلة"
          description="أضف أول جلسة لهذه القضية"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s, idx) => (
            <SessionCard key={s.id} session={s} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  return (
    <Card>
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-3 text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">
                {session.sessionNumber
                  ? `جلسة رقم ${session.sessionNumber}`
                  : `جلسة ${index + 1}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(session.sessionDate, true)}
                {session.court ? ` • ${session.court}` : ""}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 animate-fade-in">
            {session.purpose && (
              <DetailRow label="الغرض" value={session.purpose} />
            )}
            {session.judgeName && (
              <DetailRow label="القاضي" value={session.judgeName} />
            )}
            {session.attendees && (
              <DetailRow label="الحاضرون" value={session.attendees} />
            )}
            {session.facts && (
              <DetailRow label="الوقائع" value={session.facts} multiline />
            )}
            {session.opponentRequests && (
              <DetailRow
                label="طلبات الخصم"
                value={session.opponentRequests}
                multiline
              />
            )}
            {session.opponentDefenses && (
              <DetailRow
                label="دفوع الخصم"
                value={session.opponentDefenses}
                multiline
              />
            )}
            {session.lawyerPleading && (
              <DetailRow
                label="مرافعة المحامي"
                value={session.lawyerPleading}
                multiline
              />
            )}
            {session.courtStance && (
              <DetailRow
                label="موقف المحكمة"
                value={session.courtStance}
                multiline
              />
            )}
            {session.opponentStance && (
              <DetailRow
                label="موقف الخصم"
                value={session.opponentStance}
                multiline
              />
            )}
            {session.decisions && (
              <DetailRow
                label="القرارات"
                value={session.decisions}
                multiline
              />
            )}
            {session.adjournReason && (
              <DetailRow label="سبب التأجيل" value={session.adjournReason} />
            )}
            {session.documentsRequested && (
              <DetailRow
                label="المستندات المطلوبة"
                value={session.documentsRequested}
              />
            )}
            {session.strategy && (
              <DetailRow
                label="الاستراتيجية"
                value={session.strategy}
                multiline
              />
            )}
            {session.nextSessionDate && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                <CalendarClock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  الجلسة القادمة: {formatDate(session.nextSessionDate, true)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground font-medium">{label}:</span>
      <span
        className={cn(
          "col-span-2 text-foreground",
          multiline && "whitespace-pre-wrap"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// تبويب الإجراءات
// ============================================================

function ProceduresTab({
  caseId,
  procedures,
}: {
  caseId: string;
  procedures: Procedure[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "filing",
    description: "",
    performedBy: "",
    result: "",
    nextAction: "",
    status: "completed",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/cases/${caseId}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: "تم إضافة الإجراء" });
      setShowAdd(false);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        type: "filing",
        description: "",
        performedBy: "",
        result: "",
        nextAction: "",
        status: "completed",
      });
    },
    onError: () => {
      toast({ title: "فشل إضافة الإجراء", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.description) {
      toast({ title: "الوصف مطلوب", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      ...form,
      performedBy: form.performedBy || null,
      result: form.result || null,
      nextAction: form.nextAction || null,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          الإجراءات ({procedures.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة إجراء
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                الوصف <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>نفّذه</Label>
                <Input
                  value={form.performedBy}
                  onChange={(e) =>
                    setForm({ ...form, performedBy: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>النتيجة</Label>
                <Input
                  value={form.result}
                  onChange={(e) =>
                    setForm({ ...form, result: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الإجراء التالي</Label>
                <Input
                  value={form.nextAction}
                  onChange={(e) =>
                    setForm({ ...form, nextAction: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {procedures.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد إجراءات"
          description="أضف أول إجراء لهذه القضية"
        />
      ) : (
        <div className="relative pr-4 space-y-3">
          <div className="absolute right-2 top-2 bottom-2 w-px bg-border" />
          {procedures.map((p) => {
            const typeConfig = PROCEDURE_TYPES.find((t) => t.value === p.type);
            return (
              <div key={p.id} className="relative pr-4">
                <div className="absolute right-0 top-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {typeConfig?.label ?? p.type}
                          </Badge>
                          <Badge
                            variant={
                              p.status === "completed" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {p.status === "completed"
                              ? "مكتمل"
                              : p.status === "in_progress"
                              ? "قيد التنفيذ"
                              : p.status === "cancelled"
                              ? "ملغي"
                              : "معلق"}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1.5">{p.description}</p>
                        {p.performedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            بواسطة: {p.performedBy}
                          </p>
                        )}
                        {p.result && (
                          <p className="text-xs text-emerald-700 mt-1">
                            النتيجة: {p.result}
                          </p>
                        )}
                        {p.nextAction && (
                          <p className="text-xs text-amber-700 mt-1">
                            الإجراء التالي: {p.nextAction}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(p.date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب المستندات
// ============================================================

function DocumentsTab({
  caseId,
  documents,
}: {
  caseId: string;
  documents: DocumentItem[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    fileName: "",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, caseId, docType: "other" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "تم إضافة المستند" });
      setShowAdd(false);
      setForm({ title: "", description: "", category: "other", fileName: "" });
    },
    onError: () => {
      toast({ title: "فشل إضافة المستند", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.title) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      title: form.title,
      description: form.description || null,
      category: form.category,
      fileName: form.fileName || form.title,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          المستندات ({documents.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة مستند
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>
                عنوان المستند <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>اسم الملف</Label>
                <Input
                  value={form.fileName}
                  onChange={(e) =>
                    setForm({ ...form, fileName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد مستندات"
          description="أضف مستندات لهذه القضية"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {documents.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  {d.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {d.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {DOCUMENT_CATEGORIES.find((c) => c.value === d.category)
                        ?.label ?? d.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </span>
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
// تبويب المهام المرتبطة
// ============================================================

function TasksTab({ caseId, tasks }: { caseId: string; tasks: TaskItem[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, caseId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "تم إضافة المهمة" });
      setShowAdd(false);
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
    },
    onError: () => {
      toast({ title: "فشل إضافة المهمة", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.title) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          المهام المرتبطة ({tasks.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة مهمة
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>
                عنوان المهمة <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="لا توجد مهام"
          description="أضف مهام مرتبطة بهذه القضية"
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const statusConfig = TASK_STATUS.find((s) => s.value === t.status);
            const priorityConfig = TASK_PRIORITY.find(
              (p) => p.value === t.priority
            );
            const overdue =
              t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed";
            return (
              <Card key={t.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <CheckSquare
                      className={cn(
                        "w-4 h-4 mt-0.5 flex-shrink-0",
                        t.status === "completed"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          t.status === "completed" && "line-through text-muted-foreground"
                        )}
                      >
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusConfig?.color)}
                        >
                          {statusConfig?.label ?? t.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", priorityConfig?.color)}
                        >
                          {priorityConfig?.label ?? t.priority}
                        </Badge>
                        {t.dueDate && (
                          <span
                            className={cn(
                              "text-xs flex items-center gap-1",
                              overdue ? "text-destructive" : "text-muted-foreground"
                            )}
                          >
                            <CalendarClock className="w-3 h-3" />
                            {formatDate(t.dueDate)}
                            {overdue && " (متأخرة)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب المالية
// ============================================================

function FinanceTab({
  caseId,
  fees,
  expenses,
  clientId,
}: {
  caseId: string;
  fees: FeeItem[];
  expenses: ExpenseItem[];
  clientId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addType, setAddType] = useState<"fee" | "expense" | "payment" | null>(null);
  const [feeForm, setFeeForm] = useState({
    feeType: "fixed",
    amount: "",
    paidAmount: "",
    description: "",
    dueDate: "",
    status: "unpaid",
  });
  const [expenseForm, setExpenseForm] = useState({
    category: "court_fees",
    amount: "",
    description: "",
  });

  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = totalFees - totalPaid;

  const addFeeMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "fee",
          caseId,
          ...payload,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast({ title: "تم إضافة الأتعاب" });
      setAddType(null);
      setFeeForm({
        feeType: "fixed",
        amount: "",
        paidAmount: "",
        description: "",
        dueDate: "",
        status: "unpaid",
      });
    },
    onError: () => {
      toast({ title: "فشل الإضافة", variant: "destructive" });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "expense",
          caseId,
          clientId,
          ...payload,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast({ title: "تم إضافة المصروف" });
      setAddType(null);
      setExpenseForm({ category: "court_fees", amount: "", description: "" });
    },
    onError: () => {
      toast({ title: "فشل الإضافة", variant: "destructive" });
    },
  });

  function handleAddFee() {
    if (!feeForm.amount) {
      toast({ title: "المبلغ مطلوب", variant: "destructive" });
      return;
    }
    addFeeMutation.mutate({
      feeType: feeForm.feeType,
      amount: Number(feeForm.amount),
      paidAmount: feeForm.paidAmount ? Number(feeForm.paidAmount) : 0,
      description: feeForm.description || null,
      dueDate: feeForm.dueDate || null,
      status: feeForm.status,
    });
  }

  function handleAddExpense() {
    if (!expenseForm.amount) {
      toast({ title: "المبلغ مطلوب", variant: "destructive" });
      return;
    }
    addExpenseMutation.mutate({
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description || null,
    });
  }

  const summaryCards = [
    {
      label: "إجمالي الأتعاب",
      value: formatCurrency(totalFees),
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },
    {
      label: "المحصّل",
      value: formatCurrency(totalPaid),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "المتبقي",
      value: formatCurrency(remaining),
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "المصروفات",
      value: formatCurrency(totalExpenses),
      icon: Receipt,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          الملخص المالي
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={addType === "fee" ? "default" : "outline"}
            onClick={() => setAddType(addType === "fee" ? null : "fee")}
          >
            <Plus className="w-3.5 h-3.5 ml-1" />
            أتعاب
          </Button>
          <Button
            size="sm"
            variant={addType === "expense" ? "default" : "outline"}
            onClick={() => setAddType(addType === "expense" ? null : "expense")}
          >
            <Plus className="w-3.5 h-3.5 ml-1" />
            مصروف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i}>
              <CardContent className="p-3">
                <div className={cn("p-1.5 rounded-md w-fit mb-2", c.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {addType === "fee" && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>نوع الأتعاب</Label>
                <Select
                  value={feeForm.feeType}
                  onValueChange={(v) => setFeeForm({ ...feeForm, feeType: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select
                  value={feeForm.status}
                  onValueChange={(v) => setFeeForm({ ...feeForm, status: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">غير مدفوع</SelectItem>
                    <SelectItem value="partial">جزئي</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>المبلغ الإجمالي</Label>
                <Input
                  type="number"
                  value={feeForm.amount}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>المبلغ المدفوع</Label>
                <Input
                  type="number"
                  value={feeForm.paidAmount}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, paidAmount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={feeForm.dueDate}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                value={feeForm.description}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setAddType(null)}>
                إلغاء
              </Button>
              <Button onClick={handleAddFee} disabled={addFeeMutation.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {addType === "expense" && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v) =>
                    setExpenseForm({ ...expenseForm, category: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setAddType(null)}>
                إلغاء
              </Button>
              <Button
                onClick={handleAddExpense}
                disabled={addExpenseMutation.isPending}
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول الأتعاب */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">جدول الأتعاب</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fees.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              لا توجد أتعاب مسجلة
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      {FEE_TYPES.find((t) => t.value === f.feeType)?.label ??
                        f.feeType}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {f.description ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(f.amount)}
                    </TableCell>
                    <TableCell className="text-emerald-700">
                      {formatCurrency(f.paidAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          f.status === "paid"
                            ? "default"
                            : f.status === "partial"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {f.status === "paid"
                          ? "مدفوع"
                          : f.status === "partial"
                          ? "جزئي"
                          : "غير مدفوع"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* جدول المصروفات */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">جدول المصروفات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              لا توجد مصروفات مسجلة
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {EXPENSE_CATEGORIES.find((c) => c.value === e.category)
                        ?.label ?? e.category}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {e.description ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell>{formatDate(e.expenseDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// تبويب التسلسل الزمني
// ============================================================

function TimelineTab({ caseData }: { caseData: CaseItem }) {
  type TimelineEvent = {
    date: string;
    title: string;
    description?: string | null;
    icon: React.ElementType;
    color: string;
  };

  const events: TimelineEvent[] = useMemo(() => {
    const evs: TimelineEvent[] = [];
    evs.push({
      date: caseData.createdAt,
      title: "إنشاء القضية",
      description: `تم تسجيل القضية برقم ${caseData.internalNumber}`,
      icon: Plus,
      color: "bg-primary text-primary-foreground",
    });
    (caseData.procedures ?? []).forEach((p) => {
      const typeConfig = PROCEDURE_TYPES.find((t) => t.value === p.type);
      evs.push({
        date: p.date,
        title: `إجراء: ${typeConfig?.label ?? p.type}`,
        description: p.description,
        icon: ClipboardList,
        color: "bg-amber-500 text-white",
      });
    });
    (caseData.sessions ?? []).forEach((s) => {
      evs.push({
        date: s.sessionDate,
        title: s.purpose
          ? `جلسة: ${s.purpose}`
          : `جلسة${s.sessionNumber ? ` رقم ${s.sessionNumber}` : ""}`,
        description: s.facts ?? s.decisions,
        icon: Gavel,
        color: "bg-red-500 text-white",
      });
    });
    (caseData.documents ?? []).forEach((d) => {
      evs.push({
        date: d.createdAt,
        title: `مستند: ${d.title}`,
        description: d.description,
        icon: FileText,
        color: "bg-slate-500 text-white",
      });
    });
    (caseData.fees ?? []).forEach((f) => {
      evs.push({
        date: f.createdAt,
        title: `أتعاب: ${formatCurrency(f.amount)}`,
        description: f.description,
        icon: DollarSign,
        color: "bg-emerald-600 text-white",
      });
    });
    return evs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [caseData]);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        التسلسل الزمني ({events.length})
      </h3>

      {events.length === 0 ? (
        <EmptyState icon={History} title="لا توجد أحداث" />
      ) : (
        <div className="relative pr-4 space-y-3">
          <div className="absolute right-2 top-2 bottom-2 w-px bg-border" />
          {events.map((ev, idx) => {
            const Icon = ev.icon;
            return (
              <div key={idx} className="relative pr-6">
                <div
                  className={cn(
                    "absolute right-0 top-2 w-4 h-4 rounded-full flex items-center justify-center",
                    ev.color
                  )}
                >
                  <Icon className="w-2 h-2" />
                </div>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ev.title}</p>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(ev.date, true)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب إجراءات ما قبل رفع الدعوى - داخل القضية
// يعرض جميع الإجراءات السابقة لرفع الدعوى من ملف التجهيز المرتبط
// ============================================================
function PreCaseProceduresTab({ caseData }: { caseData: any }) {
  const [preCaseData, setPreCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreCase() {
      if (!caseData?.preCaseId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/precases/${caseData.preCaseId}`);
        const data = await res.json();
        if (data.success) setPreCaseData(data.preCase);
      } catch {}
      setLoading(false);
    }
    loadPreCase();
  }, [caseData?.preCaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseData?.preCaseId || !preCaseData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
          <FileCheck className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="font-bold text-lg mb-1">لا يوجد ملف تجهيز مرتبط</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          هذه القضية لم تُنشأ من ملف تجهيز، أو لم يتم ربط ملف التجهيز بها.
          يمكنك إنشاء ملف تجهيز جديد من قسم القضايا.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => useNavStore.getState().setSection("precases")}
        >
          <FileCheck className="w-4 h-4 ml-2" />
          فتح قسم ملفات التجهيز
        </Button>
      </div>
    );
  }

  // عرض بيانات ملف التجهيز
  const sections = [
    { label: "رقم ملف التجهيز", value: preCaseData.preCaseNumber },
    { label: "الحالة", value: preCaseData.status },
    { label: "تاريخ الإنشاء", value: preCaseData.createdAt ? new Date(preCaseData.createdAt).toLocaleDateString("ar-EG") : "—" },
    { label: "الفئة القانونية", value: preCaseData.legalCategory ?? "—" },
    { label: "الوقائع", value: preCaseData.facts ?? "—" },
    { label: "التكييف القانوني", value: preCaseData.legalClassification ?? "—" },
    { label: "الطلبات", value: preCaseData.requests ?? "—" },
    { label: "الإنذارات", value: preCaseData.warnings ?? "—" },
    { label: "التسويات", value: preCaseData.settlements ?? "—" },
    { label: "المحاضر", value: preCaseData.minutes ?? "—" },
    { label: "البلاغات", value: preCaseData.reports ?? "—" },
    { label: "الملاحظات", value: preCaseData.notes ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-5 h-5 text-primary" />
          <h3 className="font-bold">ملف التجهيز المرتبط</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          جميع الإجراءات التي تمت قبل رفع الدعوى، مرتبطة بهذه القضية ومحفوظة بالكامل.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="text-[10px] font-bold text-muted-foreground mb-1">
                {s.label}
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {s.value || "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {preCaseData.checklistItems && preCaseData.checklistItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              قائمة المراجعة (Checklist)
            </h4>
            <div className="space-y-1">
              {preCaseData.checklistItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", item.checked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground")}>
                    {item.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
