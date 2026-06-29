"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import {
  CASE_TYPES,
  CASE_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  CLIENT_TYPES,
  CLIENT_STATUS,
  FEE_TYPES,
  EXPENSE_CATEGORIES,
  formatCurrency,
  formatDate,
  getCaseTypeLabel,
  getCaseStatusLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  DollarSign,
  Users,
  CheckSquare,
  TrendingUp,
  Calendar,
  Download,
  Printer,
  FileBarChart,
  FileText,
  Filter,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  PieChart as PieChartIcon,
  Receipt,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// ============================================================
// الأنواع
// ============================================================

type ReportType = "cases" | "finance" | "clients" | "tasks" | "productivity";

interface ReportSummary {
  // cases
  total?: number;
  totalValue?: number;
  byType?: Array<{ name: string; count: number }>;
  byStatus?: Array<{ name: string; count: number }>;
  byDegree?: Array<{ name: string; count: number }>;
  byCourt?: Array<{ name: string; count: number }>;
  // finance
  totalIncome?: number;
  totalExpenses?: number;
  netIncome?: number;
  totalFees?: number;
  collectedFees?: number;
  pendingFees?: number;
  paymentsCount?: number;
  expensesCount?: number;
  invoicesCount?: number;
  feesByType?: Array<{ name: string; value: number }>;
  expensesByCategory?: Array<{ name: string; value: number }>;
  monthly?: Array<{ month: string; income: number; expense: number; net: number }>;
  // clients
  byCity?: Array<{ name: string; count: number }>;
  topClients?: Array<{ name: string; total: number }>;
  // tasks
  completed?: number;
  overdue?: number;
  completionRate?: number;
  byPriority?: Array<{ name: string; count: number }>;
  // productivity
  totalSessions?: number;
  totalProcedures?: number;
  tasksCompleted?: number;
  documentsCreated?: number;
  newCases?: number;
  proceduresByType?: Array<{ name: string; value: number }>;
}

interface ReportData {
  items: unknown;
  summary: ReportSummary;
}

// ============================================================
// ثوابت مساعدة
// ============================================================

const REPORT_TYPES: Array<{
  value: ReportType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = [
  { value: "cases", label: "تقرير القضايا", icon: Briefcase, color: "text-emerald-600 bg-emerald-50", description: "تحليل شامل للقضايا وأنواعها وحالاتها" },
  { value: "finance", label: "تقرير المالية", icon: DollarSign, color: "text-amber-600 bg-amber-50", description: "الدخل والمصروفات والأتعاب والفواتير" },
  { value: "clients", label: "تقرير الموكلين", icon: Users, color: "text-purple-600 bg-purple-50", description: "إحصائيات الموكلين وأنواعهم وتوزيعهم" },
  { value: "tasks", label: "تقرير المهام", icon: CheckSquare, color: "text-rose-600 bg-rose-50", description: "تتبع الإنتاجية وحالات المهام" },
  { value: "productivity", label: "تقرير الإنتاجية", icon: TrendingUp, color: "text-teal-600 bg-teal-50", description: "الجلسات والإجراءات والإنجازات" },
];

const PIE_COLORS = ["#0d9488", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#16a34a", "#ea580c"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRangePreset(preset: string): { from: string; to: string } {
  const today = new Date();
  const to = toISODate(today);
  switch (preset) {
    case "today":
      return { from: to, to };
    case "week": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: toISODate(d), to };
    }
    case "month": {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISODate(d), to };
    }
    case "quarter": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 2);
      d.setDate(1);
      return { from: toISODate(d), to };
    }
    case "year": {
      const d = new Date(today.getFullYear(), 0, 1);
      return { from: toISODate(d), to };
    }
    case "all":
    default:
      return { from: "", to: "" };
  }
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" });
}

function downloadCSV(filename: string, rows: Array<Array<string | number>>): void {
  const csv = rows
    .map((row) => row.map((cell) => {
      const s = String(cell ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(","))
    .join("\n");
  // BOM لدعم العربية في Excel
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function ReportsSection() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("cases");
  const [rangePreset, setRangePreset] = useState<string>("year");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [caseType, setCaseType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [clientType, setClientType] = useState<string>("");

  // تطبيق preset عند تغييره
  const lastPreset = useMemo(() => {
    const r = getRangePreset(rangePreset);
    return r;
  }, [rangePreset]);
  const [storedPreset, setStoredPreset] = useState<string>("");
  if (storedPreset !== rangePreset) {
    setStoredPreset(rangePreset);
    setFromDate(lastPreset.from);
    setToDate(lastPreset.to);
  }

  // بناء query params
  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("type", reportType);
    if (fromDate) p.set("from", fromDate);
    if (toDate) p.set("to", toDate);
    if (caseType) p.set("caseType", caseType);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (clientType) p.set("clientType", clientType);
    return p.toString();
  }, [reportType, fromDate, toDate, caseType, status, priority, clientType]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["reports", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${queryParams}`);
      return res.json();
    },
    enabled: !!reportType,
  });

  const reportData: ReportData | null = data?.data ?? null;
  const activeReport = REPORT_TYPES.find((r) => r.value === reportType)!;

  function handleExportCSV() {
    if (!reportData) return;
    const rows: Array<Array<string | number>> = [];
    const items = reportData.items as Record<string, unknown>[];

    if (reportType === "cases") {
      rows.push(["الرقم الداخلي", "الموكل", "النوع", "الحالة", "الدرجة", "المحكمة", "تاريخ البدء", "القيمة المقدرة"]);
      items.forEach((c) => {
        rows.push([
          c.internalNumber as string,
          (c.client as { fullName?: string })?.fullName ?? "",
          getCaseTypeLabel(c.caseType as string),
          getCaseStatusLabel(c.status as string),
          c.degree as string,
          c.court as string ?? "",
          c.startDate ? formatDate(c.startDate as string) : "",
          c.estimatedValue as number ?? 0,
        ]);
      });
      downloadCSV("تقرير-القضايا.csv", rows);
    } else if (reportType === "finance") {
      const finItems = reportData.items as { payments: PaymentItem[]; expenses: ExpenseItem[]; fees: FeeItem[]; invoices: InvoiceItem[] };
      rows.push(["النوع", "الموكل", "القضية", "المبلغ", "التاريخ", "الحالة"]);
      finItems.payments.forEach((p) => {
        rows.push(["دفعة", p.client?.fullName ?? "", p.case?.internalNumber ?? "", p.amount, formatDate(p.paymentDate), "—"]);
      });
      finItems.expenses.forEach((e) => {
        rows.push(["مصروف", e.client?.fullName ?? "", e.case?.internalNumber ?? "", e.amount, formatDate(e.expenseDate), e.category]);
      });
      finItems.fees.forEach((f) => {
        rows.push(["أتعاب", f.case?.client?.fullName ?? "", f.case?.internalNumber ?? "", f.amount, formatDate(f.createdAt), f.status]);
      });
      finItems.invoices.forEach((i) => {
        rows.push(["فاتورة", i.client?.fullName ?? "", i.case?.internalNumber ?? "", i.total, formatDate(i.issueDate), i.status]);
      });
      downloadCSV("تقرير-المالية.csv", rows);
    } else if (reportType === "clients") {
      rows.push(["الاسم", "النوع", "الحالة", "المدينة", "الهاتف", "الإيميل", "عدد القضايا", "عدد المدفوعات"]);
      items.forEach((c) => {
        const cnt = c._count as { cases: number; payments: number };
        rows.push([
          c.fullName as string,
          c.clientType as string,
          c.status as string,
          c.city as string ?? "",
          c.phone as string ?? "",
          c.email as string ?? "",
          cnt?.cases ?? 0,
          cnt?.payments ?? 0,
        ]);
      });
      downloadCSV("تقرير-الموكلين.csv", rows);
    } else if (reportType === "tasks") {
      rows.push(["العنوان", "الحالة", "الأولوية", "الموعد", "القضية", "الموكل"]);
      items.forEach((t) => {
        rows.push([
          t.title as string,
          t.status as string,
          t.priority as string,
          t.dueDate ? formatDate(t.dueDate as string) : "",
          (t.case as { internalNumber?: string })?.internalNumber ?? "",
          (t.client as { fullName?: string })?.fullName ?? "",
        ]);
      });
      downloadCSV("تقرير-المهام.csv", rows);
    } else if (reportType === "productivity") {
      const prodItems = reportData.items as { sessions: SessionItem[]; procedures: ProcedureItem[] };
      rows.push(["النوع", "التاريخ", "القضية", "الوصف/الغرض"]);
      prodItems.sessions.forEach((s) => {
        rows.push(["جلسة", formatDate(s.sessionDate), (s.case as { internalNumber?: string })?.internalNumber ?? "", s.purpose ?? ""]);
      });
      prodItems.procedures.forEach((p) => {
        rows.push(["إجراء", formatDate(p.date), (p.case as { internalNumber?: string })?.internalNumber ?? "", p.description]);
      });
      downloadCSV("تقرير-الإنتاجية.csv", rows);
    }
    toast({ title: "تم تصدير التقرير" });
  }

  function handlePrint() {
    window.print();
  }

  function resetFilters() {
    setRangePreset("year");
    setCaseType("");
    setStatus("");
    setPriority("");
    setClientType("");
    const r = getRangePreset("year");
    setFromDate(r.from);
    setToDate(r.to);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الترويسة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            التقارير والإحصائيات
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليلات شاملة لأداء المكتب والقضايا والمالية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button onClick={handleExportCSV} disabled={!reportData}>
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* بطاقات اختيار نوع التقرير */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          const isActive = reportType === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setReportType(r.value)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-right",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-accent"
              )}
            >
              <div className={cn("p-2 rounded-lg", r.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* معايير التقرير */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            معايير التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">النطاق الزمني</Label>
              <Select value={rangePreset} onValueChange={setRangePreset}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                  <SelectItem value="all">كل الفترات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">من تاريخ</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">إلى تاريخ</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9" />
            </div>
            {reportType === "cases" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">نوع القضية</Label>
                  <Select value={caseType} onValueChange={setCaseType}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {CASE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {CASE_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {reportType === "tasks" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">الأولوية</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITY.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {reportType === "clients" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">نوع الموكل</Label>
                  <Select value={clientType} onValueChange={setClientType}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent>
                      {CLIENT_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                <X className="w-3.5 h-3.5 ml-1" />
                مسح
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* محتوى التقرير */}
      {isLoading || isFetching ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">جارٍ تحميل التقرير...</p>
            </div>
          </CardContent>
        </Card>
      ) : !reportData ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد بيانات لعرضها في هذا التقرير</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* لوحة المعلومات التكاملية */}
          <ReportOverview type={reportType} summary={reportData.summary} />

          {/* الرسوم البيانية */}
          <ReportCharts type={reportType} summary={reportData.summary} />

          {/* الجدول التفصيلي */}
          <ReportTable type={reportType} data={reportData} />
        </>
      )}
    </div>
  );
}

// ============================================================
// لوحة المعلومات التكاملية
// ============================================================

function ReportOverview({ type, summary }: { type: ReportType; summary: ReportSummary }) {
  if (type === "cases") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="إجمالي القضايا" value={String(summary.total ?? 0)} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={DollarSign} label="إجمالي القيمة" value={formatCurrency(summary.totalValue ?? 0)} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Activity} label="أنواع القضايا" value={String(summary.byType?.length ?? 0)} color="text-purple-600 bg-purple-50" />
        <StatCard icon={Award} label="المحاكم" value={String(summary.byCourt?.length ?? 0)} color="text-teal-600 bg-teal-50" />
      </div>
    );
  }
  if (type === "finance") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ArrowUpRight} label="إجمالي الدخل" value={formatCurrency(summary.totalIncome ?? 0)} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={ArrowDownRight} label="إجمالي المصروفات" value={formatCurrency(summary.totalExpenses ?? 0)} color="text-red-600 bg-red-50" />
        <StatCard icon={DollarSign} label="صافي الدخل" value={formatCurrency(summary.netIncome ?? 0)} color={summary.netIncome && summary.netIncome >= 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"} />
        <StatCard icon={AlertCircle} label="أتعاب معلقة" value={formatCurrency(summary.pendingFees ?? 0)} color="text-amber-600 bg-amber-50" />
      </div>
    );
  }
  if (type === "clients") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="إجمالي الموكلين" value={String(summary.total ?? 0)} color="text-purple-600 bg-purple-50" />
        <StatCard icon={Briefcase} label="أنواع الموكلين" value={String(summary.byType?.length ?? 0)} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={PieChartIcon} label="المدن" value={String(summary.byCity?.length ?? 0)} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Award} label="أعلى دافع" value={summary.topClients?.[0]?.name ?? "—"} color="text-teal-600 bg-teal-50" sub={summary.topClients?.[0] ? formatCurrency(summary.topClients[0].total) : ""} />
      </div>
    );
  }
  if (type === "tasks") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="إجمالي المهام" value={String(summary.total ?? 0)} color="text-rose-600 bg-rose-50" />
        <StatCard icon={Award} label="مكتملة" value={String(summary.completed ?? 0)} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={AlertCircle} label="متأخرة" value={String(summary.overdue ?? 0)} color="text-red-600 bg-red-50" />
        <StatCard icon={TrendingUp} label="معدل الإنجاز" value={`${summary.completionRate ?? 0}%`} color="text-amber-600 bg-amber-50" />
      </div>
    );
  }
  // productivity
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard icon={Calendar} label="الجلسات" value={String(summary.totalSessions ?? 0)} color="text-emerald-600 bg-emerald-50" />
      <StatCard icon={Activity} label="الإجراءات" value={String(summary.totalProcedures ?? 0)} color="text-amber-600 bg-amber-50" />
      <StatCard icon={CheckSquare} label="مهام مكتملة" value={String(summary.tasksCompleted ?? 0)} color="text-purple-600 bg-purple-50" />
      <StatCard icon={FileText} label="مستندات" value={String(summary.documentsCreated ?? 0)} color="text-teal-600 bg-teal-50" />
      <StatCard icon={Briefcase} label="قضايا جديدة" value={String(summary.newCases ?? 0)} color="text-rose-600 bg-rose-50" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="stat-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// الرسوم البيانية
// ============================================================

function ReportCharts({ type, summary }: { type: ReportType; summary: ReportSummary }) {
  if (type === "cases") {
    const byTypeData = (summary.byType ?? []).map((t) => ({ name: getCaseTypeLabel(t.name), value: t.count }));
    const byStatusData = (summary.byStatus ?? []).map((s) => ({ name: getCaseStatusLabel(s.name), value: s.count }));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="توزيع القضايا حسب النوع" icon={Briefcase}>
          {byTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
        <ChartCard title="حالات القضايا" icon={Activity}>
          {byStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name?: string; value?: number }) => `${e.name ?? ""}: ${e.value ?? 0}`}>
                  {byStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    );
  }
  if (type === "finance") {
    const monthly = (summary.monthly ?? []).map((m) => ({ ...m, month: formatMonthLabel(m.month) }));
    const feesByType = (summary.feesByType ?? []).map((f) => ({ name: FEE_TYPES.find((t) => t.value === f.name)?.label ?? f.name, value: f.value }));
    const expByCat = (summary.expensesByCategory ?? []).map((e) => ({ name: EXPENSE_CATEGORIES.find((c) => c.value === e.name)?.label ?? e.name, value: e.value }));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="التدفق النقدي الشهري" icon={TrendingUp}>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ar-EG", { notation: "compact" })} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [formatCurrency(v), n === "income" ? "دخل" : n === "expense" ? "مصروف" : "صافي"]} />
                <Legend formatter={(v) => (v === "income" ? "دخل" : v === "expense" ? "مصروف" : "صافي")} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#rIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#rExpense)" />
                <Line type="monotone" dataKey="net" stroke="#0d9488" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
        <div className="grid grid-cols-1 gap-4">
          <ChartCard title="الأتعاب حسب النوع" icon={DollarSign} small>
            {feesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={feesByType} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#ca8a04" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
          <ChartCard title="المصروفات حسب الفئة" icon={Receipt} small>
            {expByCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={expByCat} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>
      </div>
    );
  }
  if (type === "clients") {
    const byTypeData = (summary.byType ?? []).map((t) => ({ name: CLIENT_TYPES.find((c) => c.value === t.name)?.label ?? t.name, value: t.count }));
    const byCityData = (summary.byCity ?? []).slice(0, 8);
    const topClients = (summary.topClients ?? []).slice(0, 10);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="توزيع الموكلين حسب النوع" icon={Users}>
          {byTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name?: string; value?: number }) => `${e.name ?? ""}: ${e.value ?? 0}`}>
                  {byTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
        <ChartCard title="أعلى الموكلين دفعاً" icon={Award}>
          {topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClients} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toLocaleString("ar-EG", { notation: "compact" })} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    );
  }
  if (type === "tasks") {
    const byStatus = (summary.byStatus ?? []).map((s) => ({ name: TASK_STATUS.find((t) => t.value === s.name)?.label ?? s.name, value: s.count }));
    const byPriority = (summary.byPriority ?? []).map((p) => ({ name: TASK_PRIORITY.find((t) => t.value === p.name)?.label ?? p.name, value: p.count }));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="المهام حسب الحالة" icon={CheckSquare}>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name?: string; value?: number }) => `${e.name ?? ""}: ${e.value ?? 0}`}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
        <ChartCard title="المهام حسب الأولوية" icon={AlertCircle}>
          {byPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byPriority} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    );
  }
  // productivity
  const monthly = (summary.monthly ?? []).map((m) => ({ ...m, month: formatMonthLabel(m.month) }));
  const procByType = (summary.proceduresByType ?? []).map((p) => ({ name: p.name, value: p.value }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="النشاط الشهري" icon={TrendingUp}>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={(v) => (v === "sessions" ? "جلسات" : v === "procedures" ? "إجراءات" : "مستندات")} />
              <Line type="monotone" dataKey="sessions" stroke="#0d9488" strokeWidth={2} />
              <Line type="monotone" dataKey="procedures" stroke="#ca8a04" strokeWidth={2} />
              <Line type="monotone" dataKey="documents" stroke="#7c3aed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>
      <ChartCard title="الإجراءات حسب النوع" icon={Activity}>
        {procByType.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={procByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#0891b2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  direction: "rtl" as const,
  fontFamily: "var(--font-cairo)",
  borderRadius: "8px",
  border: "1px solid oklch(0.9 0 0)",
};

function ChartCard({
  title,
  icon: Icon,
  children,
  small,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Card>
      <CardHeader className={cn("pb-3", small && "pb-2")}>
        <CardTitle className={cn("flex items-center gap-2", small ? "text-sm" : "text-base")}>
          <Icon className={cn("text-primary", small ? "w-4 h-4" : "w-5 h-5")} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(small && "pb-3 pt-0")}>{children}</CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
      لا توجد بيانات كافية لعرض الرسم البياني
    </div>
  );
}

// ============================================================
// الجدول التفصيلي
// ============================================================

function ReportTable({ type, data }: { type: ReportType; data: ReportData }) {
  const items = data.items;

  if (type === "cases") {
    const cases = items as CaseRow[];
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            تفاصيل القضايا ({cases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {cases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>الموكل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المحكمة</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead className="text-left">القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.internalNumber}</TableCell>
                      <TableCell className="text-sm">{c.client?.fullName ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{getCaseTypeLabel(c.caseType)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{getCaseStatusLabel(c.status)}</Badge></TableCell>
                      <TableCell className="text-sm">{c.court ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.startDate)}</TableCell>
                      <TableCell className="text-left font-medium">{c.estimatedValue ? formatCurrency(c.estimatedValue) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyList text="لا توجد قضايا في هذا النطاق" />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (type === "finance") {
    const fin = items as { payments: PaymentItem[]; expenses: ExpenseItem[]; fees: FeeItem[]; invoices: InvoiceItem[] };
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            التفاصيل المالية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الوصف/الموكل</TableHead>
                  <TableHead>القضية</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fin.payments.map((p) => (
                  <TableRow key={`pay-${p.id}`}>
                    <TableCell><Badge className="bg-emerald-100 text-emerald-700">دفعة</Badge></TableCell>
                    <TableCell className="text-sm">{p.client?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.case?.internalNumber ?? "—"}</TableCell>
                    <TableCell className="text-left font-medium text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.paymentDate)}</TableCell>
                  </TableRow>
                ))}
                {fin.expenses.map((e) => (
                  <TableRow key={`exp-${e.id}`}>
                    <TableCell><Badge className="bg-red-100 text-red-700">مصروف</Badge></TableCell>
                    <TableCell className="text-sm">{EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}</TableCell>
                    <TableCell className="text-sm">{e.case?.internalNumber ?? "—"}</TableCell>
                    <TableCell className="text-left font-medium text-red-600">{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(e.expenseDate)}</TableCell>
                  </TableRow>
                ))}
                {fin.fees.map((f) => (
                  <TableRow key={`fee-${f.id}`}>
                    <TableCell><Badge className="bg-amber-100 text-amber-700">أتعاب</Badge></TableCell>
                    <TableCell className="text-sm">{f.case?.client?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{f.case?.internalNumber ?? "—"}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(f.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(f.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (type === "clients") {
    const clients = items as ClientRow[];
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            تفاصيل الموكلين ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {clients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead className="text-left">قضايا</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.fullName}</TableCell>
                      <TableCell><Badge variant="outline">{CLIENT_TYPES.find((t) => t.value === c.clientType)?.label ?? c.clientType}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{CLIENT_STATUS.find((s) => s.value === c.status)?.label ?? c.status}</Badge></TableCell>
                      <TableCell className="text-sm">{c.city ?? "—"}</TableCell>
                      <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-left">{c._count?.cases ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyList text="لا يوجد موكلون في هذا النطاق" />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (type === "tasks") {
    const tasks = items as TaskRow[];
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            تفاصيل المهام ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {tasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>الموعد</TableHead>
                    <TableHead>القضية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell><Badge variant="outline">{TASK_STATUS.find((s) => s.value === t.status)?.label ?? t.status}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TASK_PRIORITY.find((p) => p.value === t.priority)?.color ?? ""}>
                          {TASK_PRIORITY.find((p) => p.value === t.priority)?.label ?? t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.dueDate ? formatDate(t.dueDate) : "—"}</TableCell>
                      <TableCell className="text-sm">{t.case?.internalNumber ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyList text="لا توجد مهام في هذا النطاق" />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // productivity
  const prod = items as { sessions: SessionItem[]; procedures: ProcedureItem[] };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          النشاط التفصيلي ({prod.sessions.length + prod.procedures.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>القضية</TableHead>
                <TableHead>الوصف/الغرض</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prod.sessions.map((s) => (
                <TableRow key={`s-${s.id}`}>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-700">جلسة</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.sessionDate)}</TableCell>
                  <TableCell className="text-sm">{(s.case as { internalNumber?: string })?.internalNumber ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.purpose ?? "—"}</TableCell>
                </TableRow>
              ))}
              {prod.procedures.map((p) => (
                <TableRow key={`p-${p.id}`}>
                  <TableCell><Badge className="bg-amber-100 text-amber-700">إجراء</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.date)}</TableCell>
                  <TableCell className="text-sm">{(p.case as { internalNumber?: string })?.internalNumber ?? "—"}</TableCell>
                  <TableCell className="text-sm">{p.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================================
// أنواع البيانات للصفوف
// ============================================================

interface CaseRow {
  id: string;
  internalNumber: string;
  caseType: string;
  status: string;
  court?: string | null;
  startDate: string;
  estimatedValue?: number | null;
  client?: { fullName: string } | null;
}
interface ClientRow {
  id: string;
  fullName: string;
  clientType: string;
  status: string;
  city?: string | null;
  phone?: string | null;
  _count?: { cases: number; payments: number };
}
interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  case?: { internalNumber?: string } | null;
  client?: { fullName?: string } | null;
}
interface SessionItem {
  id: string;
  sessionDate: string;
  purpose?: string | null;
  case?: { internalNumber?: string } | null;
}
interface ProcedureItem {
  id: string;
  date: string;
  description: string;
  case?: { internalNumber?: string } | null;
}
interface PaymentItem {
  id: string;
  amount: number;
  paymentDate: string;
  client?: { fullName: string } | null;
  case?: { internalNumber: string } | null;
}
interface ExpenseItem {
  id: string;
  amount: number;
  expenseDate: string;
  category: string;
  client?: { fullName: string } | null;
  case?: { internalNumber: string } | null;
}
interface FeeItem {
  id: string;
  amount: number;
  createdAt: string;
  case?: { internalNumber: string; client?: { fullName: string } | null } | null;
}
interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  total: number;
  issueDate: string;
  status: string;
  client?: { fullName: string } | null;
  case?: { internalNumber: string } | null;
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
