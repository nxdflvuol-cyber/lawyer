"use client";

import { useState, useMemo } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  FEE_TYPES,
  EXPENSE_CATEGORIES,
  formatCurrency,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Eye,
  Receipt,
  FileText,
  Wallet,
  Printer,
  Calendar,
  User,
  Briefcase,
  CreditCard,
  Image as ImageIcon,
  Search,
  ChevronLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// ============================================================
// الأنواع
// ============================================================

interface CaseLite {
  id: string;
  internalNumber: string;
}

interface ClientLite {
  id: string;
  fullName: string;
}

interface FeeItem {
  id: string;
  caseId: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  createdAt: string;
  case?: { id: string; internalNumber: string; client?: { fullName: string } | null } | null;
}

interface PaymentItem {
  id: string;
  clientId: string;
  caseId?: string | null;
  feeId?: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  invoiceNumber?: string | null;
  client?: ClientLite | null;
  case?: CaseLite | null;
}

interface ExpenseItem {
  id: string;
  caseId?: string | null;
  clientId?: string | null;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string | null;
  receiptData?: string | null;
  case?: CaseLite | null;
  client?: ClientLite | null;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientId?: string | null;
  caseId?: string | null;
  issueDate: string;
  dueDate?: string | null;
  items: string; // JSON
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: string;
  notes?: string | null;
  client?: ClientLite | null;
  case?: CaseLite | null;
}

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingFees: number;
}

// ============================================================
// ثوابت مساعدة
// ============================================================

const PAYMENT_METHODS = [
  { value: "cash", label: "نقدي" },
  { value: "transfer", label: "تحويل بنكي" },
  { value: "check", label: "شيك" },
  { value: "card", label: "بطاقة" },
];

const FEE_STATUS = [
  { value: "unpaid", label: "غير مدفوعة", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "partial", label: "جزئي", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "paid", label: "مدفوعة", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

const INVOICE_STATUS = [
  { value: "draft", label: "مسودة", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "sent", label: "مُرسلة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "paid", label: "مدفوعة", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "overdue", label: "متأخرة", color: "bg-red-100 text-red-700 border-red-200" },
];

function getFeeStatusLabel(status: string): string {
  return FEE_STATUS.find((s) => s.value === status)?.label ?? status;
}
function getFeeStatusColor(status: string): string {
  return FEE_STATUS.find((s) => s.value === status)?.color ?? "bg-slate-100 text-slate-700";
}
function getInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS.find((s) => s.value === status)?.label ?? status;
}
function getInvoiceStatusColor(status: string): string {
  return INVOICE_STATUS.find((s) => s.value === status)?.color ?? "bg-slate-100 text-slate-700";
}
function getFeeTypeLabel(type: string): string {
  return FEE_TYPES.find((t) => t.value === type)?.label ?? type;
}
function getExpenseCategoryLabel(cat: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}
function getPaymentMethodLabel(m: string): string {
  return PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function FinanceSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setSection = useNavStore((s) => s.setSection);
  const selectedCaseId = useNavStore((s) => s.selectedCaseId);

  const [activeTab, setActiveTab] = useState<string>("fees");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailKind, setDetailKind] = useState<"fee" | "payment" | "expense" | "invoice">("fee");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; kind: "fee" | "payment" | "expense" | "invoice" } | null>(null);
  const [invoiceView, setInvoiceView] = useState<InvoiceItem | null>(null);

  // جلب البيانات
  const { data, isLoading } = useQuery({
    queryKey: ["finance", "all"],
    queryFn: async () => {
      const res = await fetch("/api/finance?type=all");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: casesData } = useQuery({
    queryKey: ["cases", "for-finance"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-finance"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const cases: CaseLite[] = casesData?.cases ?? [];
  const clients: ClientLite[] = clientsData?.clients ?? [];

  const summary: FinanceSummary = data?.summary ?? {
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingFees: 0,
  };

  const fees: FeeItem[] = data?.fees ?? [];
  const payments: PaymentItem[] = data?.payments ?? [];
  const expenses: ExpenseItem[] = data?.expenses ?? [];
  const invoices: InvoiceItem[] = data?.invoices ?? [];

  // رسم بياني للتدفق النقدي الشهري
  const cashFlowData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number; net: number }> = {};
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { month: label, income: 0, expense: 0, net: 0 };
      map[key].income += p.amount;
    });
    expenses.forEach((e) => {
      const d = new Date(e.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { month: label, income: 0, expense: 0, net: 0 };
      map[key].expense += e.amount;
    });
    Object.values(map).forEach((v) => (v.net = v.income - v.expense));
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v);
  }, [payments, expenses]);

  // حذف
  const deleteMutation = useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "fee" | "payment" | "expense" | "invoice" }) => {
      const res = await fetch(`/api/finance/${id}?kind=${kind}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحذف بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  function openDetail(id: string, kind: "fee" | "payment" | "expense" | "invoice") {
    setDetailId(id);
    setDetailKind(kind);
  }

  function openCreate() {
    setShowCreate(true);
  }

  // فلترة بالبحث
  const filteredFees = useMemo(() => {
    if (!search) return fees;
    const q = search.toLowerCase();
    return fees.filter((f) =>
      f.case?.internalNumber?.toLowerCase().includes(q) ||
      f.case?.client?.fullName?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      getFeeTypeLabel(f.feeType).includes(search)
    );
  }, [fees, search]);

  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter((p) =>
      p.client?.fullName?.toLowerCase().includes(q) ||
      p.case?.internalNumber?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.invoiceNumber?.toLowerCase().includes(q) ||
      getPaymentMethodLabel(p.paymentMethod ?? "").includes(search)
    );
  }, [payments, search]);

  const filteredExpenses = useMemo(() => {
    if (!search) return expenses;
    const q = search.toLowerCase();
    return expenses.filter((e) =>
      e.description?.toLowerCase().includes(q) ||
      e.case?.internalNumber?.toLowerCase().includes(q) ||
      e.client?.fullName?.toLowerCase().includes(q) ||
      getExpenseCategoryLabel(e.category).includes(search)
    );
  }, [expenses, search]);

  const filteredInvoices = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((i) =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.client?.fullName?.toLowerCase().includes(q) ||
      i.case?.internalNumber?.toLowerCase().includes(q) ||
      getInvoiceStatusLabel(i.status).includes(search)
    );
  }, [invoices, search]);

  const statCards = [
    {
      title: "إجمالي الدخل",
      value: formatCurrency(summary.totalIncome),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50",
      desc: "إجمالي المدفوعات المستلمة",
    },
    {
      title: "المصروفات",
      value: formatCurrency(summary.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600 bg-red-50",
      desc: "إجمالي المصروفات",
    },
    {
      title: "صافي الدخل",
      value: formatCurrency(summary.netIncome),
      icon: DollarSign,
      color: summary.netIncome >= 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100",
      desc: "الدخل ناقص المصروفات",
    },
    {
      title: "أتعاب معلقة",
      value: formatCurrency(summary.pendingFees),
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
      desc: "أتعاب غير محصلة",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الترويسة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            الإدارة المالية
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة الأتعاب والمدفوعات والمصروفات والفواتير
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة جديد
        </Button>
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
                  <p className="text-xl font-bold text-foreground truncate">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* رسم بياني للتدفق النقدي */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            التدفق النقدي الشهري
          </CardTitle>
          <CardDescription>آخر 12 شهراً</CardDescription>
        </CardHeader>
        <CardContent>
          {cashFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ar-EG", { notation: "compact" })} />
                <Tooltip
                  contentStyle={{
                    direction: "rtl",
                    fontFamily: "var(--font-cairo)",
                    borderRadius: "8px",
                    border: "1px solid oklch(0.9 0 0)",
                  }}
                  formatter={(v: number, name: string) => [formatCurrency(v), name === "income" ? "دخل" : name === "expense" ? "مصروف" : "صافي"]}
                />
                <Legend formatter={(v) => (v === "income" ? "دخل" : v === "expense" ? "مصروف" : "صافي")} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                <Line type="monotone" dataKey="net" stroke="#0d9488" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="fees" className="gap-1.5">
              <DollarSign className="w-4 h-4" />
              الأتعاب
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{fees.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <CreditCard className="w-4 h-4" />
              المدفوعات
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{payments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="w-4 h-4" />
              المصروفات
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{expenses.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <FileText className="w-4 h-4" />
              الفواتير
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{invoices.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8"
            />
          </div>
        </div>

        {/* الأتعاب */}
        <TabsContent value="fees" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">قائمة الأتعاب</CardTitle>
              <Button size="sm" onClick={() => { setActiveTab("fees"); setShowCreate(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                أتعاب جديدة
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredFees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>القضية</TableHead>
                        <TableHead>الموكل</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                        <TableHead className="text-left">المدفوع</TableHead>
                        <TableHead className="text-left">المتبقي</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الاستحقاق</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFees.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">
                            <button
                              className="text-primary hover:underline"
                              onClick={() => { useNavStore.getState().selectCase(f.caseId); setSection("cases"); }}
                            >
                              {f.case?.internalNumber ?? "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm">{f.case?.client?.fullName ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getFeeTypeLabel(f.feeType)}</Badge>
                          </TableCell>
                          <TableCell className="text-left font-semibold">{formatCurrency(f.amount)}</TableCell>
                          <TableCell className="text-left text-emerald-600">{formatCurrency(f.paidAmount)}</TableCell>
                          <TableCell className="text-left text-red-600">{formatCurrency(f.amount - f.paidAmount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getFeeStatusColor(f.status)}>
                              {getFeeStatusLabel(f.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {f.dueDate ? formatDate(f.dueDate) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(f.id, "fee")} title="عرض/تعديل">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: f.id, kind: "fee" })} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyList text="لا توجد أتعاب مسجلة" />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* المدفوعات */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">قائمة المدفوعات</CardTitle>
              <Button size="sm" onClick={() => { setActiveTab("payments"); setShowCreate(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                تسجيل دفعة
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموكل</TableHead>
                        <TableHead>القضية</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead>المرجع</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <button
                              className="text-primary hover:underline"
                              onClick={() => { useNavStore.getState().selectClient(p.clientId); setSection("clients"); }}
                            >
                              {p.client?.fullName ?? "—"}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.case ? p.case.internalNumber : "—"}
                          </TableCell>
                          <TableCell className="text-left font-semibold text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getPaymentMethodLabel(p.paymentMethod ?? "—")}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.reference ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(p.id, "payment")} title="عرض/تعديل">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: p.id, kind: "payment" })} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyList text="لا توجد مدفوعات مسجلة" />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* المصروفات */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">قائمة المصروفات</CardTitle>
              <Button size="sm" onClick={() => { setActiveTab("expenses"); setShowCreate(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                مصروف جديد
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفئة</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>القضية</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إيصال</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <Badge variant="outline">{getExpenseCategoryLabel(e.category)}</Badge>
                          </TableCell>
                          <TableCell className="text-left font-semibold text-red-600">{formatCurrency(e.amount)}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={e.description ?? ""}>{e.description ?? "—"}</TableCell>
                          <TableCell className="text-sm">{e.case?.internalNumber ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(e.expenseDate)}</TableCell>
                          <TableCell>
                            {e.receiptData ? (
                              <Badge variant="secondary" className="gap-1">
                                <ImageIcon className="w-3 h-3" />
                                متوفر
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(e.id, "expense")} title="عرض/تعديل">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: e.id, kind: "expense" })} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyList text="لا توجد مصروفات مسجلة" />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الفواتير */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">قائمة الفواتير</CardTitle>
              <Button size="sm" onClick={() => { setActiveTab("invoices"); setShowCreate(true); }}>
                <Plus className="w-4 h-4 ml-1" />
                فاتورة جديدة
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>الموكل</TableHead>
                        <TableHead>القضية</TableHead>
                        <TableHead className="text-left">الإجمالي</TableHead>
                        <TableHead>الضريبة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الاستحقاق</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-sm">{inv.client?.fullName ?? "—"}</TableCell>
                          <TableCell className="text-sm">{inv.case?.internalNumber ?? "—"}</TableCell>
                          <TableCell className="text-left font-semibold">{formatCurrency(inv.total)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatCurrency(inv.taxAmount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getInvoiceStatusColor(inv.status)}>
                              {getInvoiceStatusLabel(inv.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setInvoiceView(inv)} title="عرض/طباعة">
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(inv.id, "invoice")} title="تعديل">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: inv.id, kind: "invoice" })} title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyList text="لا توجد فواتير مسجلة" />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة الإنشاء */}
      <CreateFinanceDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultKind={activeTab === "fees" ? "fee" : activeTab === "payments" ? "payment" : activeTab === "expenses" ? "expense" : "invoice"}
        cases={cases}
        clients={clients}
        fees={fees}
        preselectedCaseId={selectedCaseId}
      />

      {/* نافذة التفاصيل/التعديل */}
      <FinanceDetailSheet
        id={detailId}
        kind={detailKind}
        onClose={() => setDetailId(null)}
        cases={cases}
        clients={clients}
        fees={fees}
      />

      {/* معاينة/طباعة الفاتورة */}
      <InvoicePrintDialog invoice={invoiceView} onClose={() => setInvoiceView(null)} />

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// نافذة الإنشاء
// ============================================================

function CreateFinanceDialog({
  open,
  onOpenChange,
  defaultKind,
  cases,
  clients,
  fees,
  preselectedCaseId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultKind: "fee" | "payment" | "expense" | "invoice";
  cases: CaseLite[];
  clients: ClientLite[];
  fees: FeeItem[];
  preselectedCaseId?: string | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<"fee" | "payment" | "expense" | "invoice">(defaultKind);

  // مزامنة kind مع defaultKind عند فتح النافذة
  const prevDefault = useMemo(() => defaultKind, [defaultKind, open]);
  const [lastDefault, setLastDefault] = useState(defaultKind);
  if (open && lastDefault !== prevDefault) {
    setLastDefault(prevDefault);
    setKind(prevDefault);
  }

  // Fee state
  const [feeCaseId, setFeeCaseId] = useState<string>(preselectedCaseId ?? "");
  const [feeType, setFeeType] = useState<string>("fixed");
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [feePaid, setFeePaid] = useState<string>("0");
  const [feeDesc, setFeeDesc] = useState<string>("");
  const [feeDueDate, setFeeDueDate] = useState<string>("");
  const [feeStatus, setFeeStatus] = useState<string>("unpaid");

  // Payment state
  const [payClientId, setPayClientId] = useState<string>("");
  const [payCaseId, setPayCaseId] = useState<string>("");
  const [payFeeId, setPayFeeId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [payRef, setPayRef] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("");

  // Expense state
  const [expCategory, setExpCategory] = useState<string>("court_fees");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDesc, setExpDesc] = useState<string>("");
  const [expCaseId, setExpCaseId] = useState<string>("");
  const [expClientId, setExpClientId] = useState<string>("");
  const [expReceipt, setExpReceipt] = useState<string>("");

  // Invoice state
  const [invClientId, setInvClientId] = useState<string>("");
  const [invCaseId, setInvCaseId] = useState<string>("");
  const [invItems, setInvItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [invTaxRate, setInvTaxRate] = useState<string>("14");
  const [invDueDate, setInvDueDate] = useState<string>("");
  const [invNotes, setInvNotes] = useState<string>("");
  const [invStatus, setInvStatus] = useState<string>("draft");

  const invSubtotal = useMemo(
    () => invItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
    [invItems]
  );
  const invTaxAmount = useMemo(() => (invSubtotal * (Number(invTaxRate) || 0)) / 100, [invSubtotal, invTaxRate]);
  const invTotal = invSubtotal + invTaxAmount;

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("فشل الإنشاء");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  function resetForm() {
    setFeeAmount(""); setFeePaid("0"); setFeeDesc(""); setFeeDueDate(""); setFeeStatus("unpaid");
    setPayAmount(""); setPayRef(""); setPayNotes(""); setPayCaseId(""); setPayFeeId("");
    setExpAmount(""); setExpDesc(""); setExpCaseId(""); setExpClientId(""); setExpReceipt("");
    setInvItems([{ description: "", quantity: 1, unitPrice: 0 }]); setInvDueDate(""); setInvNotes("");
  }

  function handleSubmit() {
    if (kind === "fee") {
      if (!feeCaseId) { toast({ title: "اختر القضية", variant: "destructive" }); return; }
      const amount = Number(feeAmount);
      if (!amount || amount <= 0) { toast({ title: "أدخل مبلغاً صحيحاً", variant: "destructive" }); return; }
      const paid = Number(feePaid) || 0;
      createMutation.mutate({
        kind: "fee",
        caseId: feeCaseId,
        feeType,
        amount,
        paidAmount: paid,
        description: feeDesc,
        dueDate: feeDueDate || null,
        status: paid >= amount ? "paid" : paid > 0 ? "partial" : feeStatus,
      });
    } else if (kind === "payment") {
      if (!payClientId) { toast({ title: "اختر الموكل", variant: "destructive" }); return; }
      const amount = Number(payAmount);
      if (!amount || amount <= 0) { toast({ title: "أدخل مبلغاً صحيحاً", variant: "destructive" }); return; }
      createMutation.mutate({
        kind: "payment",
        clientId: payClientId,
        caseId: payCaseId || null,
        feeId: payFeeId || null,
        amount,
        paymentMethod: payMethod,
        reference: payRef,
        notes: payNotes,
      });
    } else if (kind === "expense") {
      const amount = Number(expAmount);
      if (!amount || amount <= 0) { toast({ title: "أدخل مبلغاً صحيحاً", variant: "destructive" }); return; }
      createMutation.mutate({
        kind: "expense",
        category: expCategory,
        amount,
        description: expDesc,
        caseId: expCaseId || null,
        clientId: expClientId || null,
        receiptData: expReceipt || null,
      });
    } else if (kind === "invoice") {
      if (invSubtotal <= 0) { toast({ title: "أضف بنداً واحداً على الأقل", variant: "destructive" }); return; }
      createMutation.mutate({
        kind: "invoice",
        clientId: invClientId || null,
        caseId: invCaseId || null,
        items: invItems.filter((it) => it.description),
        subtotal: invSubtotal,
        taxRate: Number(invTaxRate) || 0,
        taxAmount: invTaxAmount,
        total: invTotal,
        dueDate: invDueDate || null,
        notes: invNotes,
        status: invStatus,
      });
    }
  }

  function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة كبير (الحد 5 ميجا)", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setExpReceipt(reader.result as string);
      toast({ title: "تم رفع الإيصال" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة عنصر مالي
          </DialogTitle>
          <DialogDescription>اختر نوع العنصر وأدخل البيانات</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 px-1">
          {([
            { value: "fee", label: "أتعاب", icon: DollarSign },
            { value: "payment", label: "دفعة", icon: CreditCard },
            { value: "expense", label: "مصروف", icon: Receipt },
            { value: "invoice", label: "فاتورة", icon: FileText },
          ] as const).map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setKind(opt.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors",
                  kind === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4 py-2">
            {kind === "fee" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>القضية *</Label>
                    <Select value={feeCaseId} onValueChange={setFeeCaseId}>
                      <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                      <SelectContent>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.internalNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>نوع الأتعاب</Label>
                    <Select value={feeType} onValueChange={setFeeType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FEE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>المبلغ *</Label>
                    <Input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>المدفوع</Label>
                    <Input type="number" value={feePaid} onChange={(e) => setFeePaid(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input type="date" value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الحالة</Label>
                    <Select value={feeStatus} onValueChange={setFeeStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FEE_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Textarea value={feeDesc} onChange={(e) => setFeeDesc(e.target.value)} rows={2} placeholder="تفاصيل الأتعاب..." />
                </div>
              </>
            )}

            {kind === "payment" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الموكل *</Label>
                    <Select value={payClientId} onValueChange={setPayClientId}>
                      <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>القضية</Label>
                    <Select value={payCaseId} onValueChange={setPayCaseId}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.internalNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ربط بأتعاب</Label>
                  <Select value={payFeeId} onValueChange={setPayFeeId}>
                    <SelectTrigger><SelectValue placeholder="اختياري - لتحديث حالة الأتعاب تلقائياً" /></SelectTrigger>
                    <SelectContent>
                      {fees.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.case?.internalNumber ?? "—"} - {formatCurrency(f.amount)} (متبقي {formatCurrency(f.amount - f.paidAmount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>المبلغ *</Label>
                    <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>طريقة الدفع</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>المرجع</Label>
                  <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="رقم الشيك / مرجع التحويل" />
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} />
                </div>
              </>
            )}

            {kind === "expense" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الفئة *</Label>
                    <Select value={expCategory} onValueChange={setExpCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ *</Label>
                    <Input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>القضية</Label>
                    <Select value={expCaseId} onValueChange={setExpCaseId}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.internalNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الموكل</Label>
                    <Select value={expClientId} onValueChange={setExpClientId}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Textarea value={expDesc} onChange={(e) => setExpDesc(e.target.value)} rows={2} placeholder="تفاصيل المصروف..." />
                </div>
                <div className="space-y-1.5">
                  <Label>إيصال (صورة)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={handleReceiptUpload} className="flex-1" />
                    {expReceipt && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        { }
                        <img src={expReceipt} alt="إيصال" className="w-full h-full object-cover" />
                        <button
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          onClick={() => setExpReceipt("")}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {kind === "invoice" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الموكل</Label>
                    <Select value={invClientId} onValueChange={setInvClientId}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>القضية</Label>
                    <Select value={invCaseId} onValueChange={setInvCaseId}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.internalNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>بنود الفاتورة</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => setInvItems([...invItems, { description: "", quantity: 1, unitPrice: 0 }])}>
                      <Plus className="w-3.5 h-3.5 ml-1" />
                      بند
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {invItems.map((it, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">الوصف</Label>
                          <Input
                            value={it.description}
                            onChange={(e) => {
                              const arr = [...invItems];
                              arr[idx] = { ...arr[idx], description: e.target.value };
                              setInvItems(arr);
                            }}
                            placeholder="بند الفاتورة"
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">الكمية</Label>
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) => {
                              const arr = [...invItems];
                              arr[idx] = { ...arr[idx], quantity: Number(e.target.value) };
                              setInvItems(arr);
                            }}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">سعر الوحدة</Label>
                          <Input
                            type="number"
                            value={it.unitPrice}
                            onChange={(e) => {
                              const arr = [...invItems];
                              arr[idx] = { ...arr[idx], unitPrice: Number(e.target.value) };
                              setInvItems(arr);
                            }}
                          />
                        </div>
                        <div className="w-24 text-left text-sm font-medium pb-2">
                          {formatCurrency(it.quantity * it.unitPrice)}
                        </div>
                        {invItems.length > 1 && (
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setInvItems(invItems.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>نسبة الضريبة %</Label>
                    <Input type="number" value={invTaxRate} onChange={(e) => setInvTaxRate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الإجمالي الفرعي</Label>
                    <Input value={formatCurrency(invSubtotal)} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الضريبة</Label>
                    <Input value={formatCurrency(invTaxAmount)} disabled className="bg-muted" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="font-medium">الإجمالي الكلي</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(invTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الحالة</Label>
                    <Select value={invStatus} onValueChange={setInvStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVOICE_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Textarea value={invNotes} onChange={(e) => setInvNotes(e.target.value)} rows={2} />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل/تعديل
// ============================================================

function FinanceDetailSheet({
  id,
  kind,
  onClose,
  cases,
  clients,
  fees,
}: {
  id: string | null;
  kind: "fee" | "payment" | "expense" | "invoice";
  onClose: () => void;
  cases: CaseLite[];
  clients: ClientLite[];
  fees: FeeItem[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // Fee
  const [feeType, setFeeType] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feePaid, setFeePaid] = useState("");
  const [feeDesc, setFeeDesc] = useState("");
  const [feeDueDate, setFeeDueDate] = useState("");
  const [feeStatus, setFeeStatus] = useState("");

  // Payment
  const [payMethod, setPayMethod] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Expense
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");

  // Invoice
  const [invStatus, setInvStatus] = useState("");
  const [invNotes, setInvNotes] = useState("");

  // إيجاد العنصر الحالي
  const currentFee = id && kind === "fee" ? fees.find((f) => f.id === id) : null;

  // تحميل البيانات للعنصر (نقرأ من بيانات القائمة المحفوظة محلياً)
  // لأن العنصر موجود في الكاش، نقرأه مباشرة من useQuery هنا
  const { data } = useQuery({
    queryKey: ["finance", "all"],
    queryFn: async () => {
      const res = await fetch("/api/finance?type=all");
      return res.json();
    },
  });

  const item = useMemo(() => {
    if (!id || !data) return null;
    if (kind === "fee") return (data.fees as FeeItem[]).find((f) => f.id === id) ?? null;
    if (kind === "payment") return (data.payments as PaymentItem[]).find((p) => p.id === id) ?? null;
    if (kind === "expense") return (data.expenses as ExpenseItem[]).find((e) => e.id === id) ?? null;
    if (kind === "invoice") return (data.invoices as InvoiceItem[]).find((i) => i.id === id) ?? null;
    return null;
  }, [id, data, kind]);

  // تحميل بيانات العنصر عند التغيير
  const lastLoadedId = useMemo(() => {
    if (!item) return null;
    return item.id;
  }, [item]);
  const [storedId, setStoredId] = useState<string | null>(null);
  if (lastLoadedId && storedId !== lastLoadedId) {
    setStoredId(lastLoadedId);
    if (kind === "fee" && item) {
      const f = item as FeeItem;
      setFeeType(f.feeType); setFeeAmount(String(f.amount)); setFeePaid(String(f.paidAmount));
      setFeeDesc(f.description ?? ""); setFeeDueDate(f.dueDate ? toISODate(new Date(f.dueDate)) : "");
      setFeeStatus(f.status);
    } else if (kind === "payment" && item) {
      const p = item as PaymentItem;
      setPayMethod(p.paymentMethod ?? "cash"); setPayAmount(String(p.amount));
      setPayRef(p.reference ?? ""); setPayNotes(p.notes ?? "");
    } else if (kind === "expense" && item) {
      const e = item as ExpenseItem;
      setExpCategory(e.category); setExpAmount(String(e.amount)); setExpDesc(e.description ?? "");
    } else if (kind === "invoice" && item) {
      const i = item as InvoiceItem;
      setInvStatus(i.status); setInvNotes(i.notes ?? "");
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...payload }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم التحديث بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setEditing(false);
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  function handleSave() {
    if (kind === "fee") {
      updateMutation.mutate({
        feeType, amount: Number(feeAmount), paidAmount: Number(feePaid),
        description: feeDesc, dueDate: feeDueDate || null,
        status: Number(feePaid) >= Number(feeAmount) ? "paid" : Number(feePaid) > 0 ? "partial" : feeStatus,
      });
    } else if (kind === "payment") {
      updateMutation.mutate({
        amount: Number(payAmount), paymentMethod: payMethod,
        reference: payRef, notes: payNotes,
      });
    } else if (kind === "expense") {
      updateMutation.mutate({
        category: expCategory, amount: Number(expAmount), description: expDesc,
      });
    } else if (kind === "invoice") {
      updateMutation.mutate({ status: invStatus, notes: invNotes });
    }
  }

  if (!item) {
    return (
      <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>لا توجد بيانات</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {kind === "fee" && <DollarSign className="w-5 h-5 text-primary" />}
            {kind === "payment" && <CreditCard className="w-5 h-5 text-primary" />}
            {kind === "expense" && <Receipt className="w-5 h-5 text-primary" />}
            {kind === "invoice" && <FileText className="w-5 h-5 text-primary" />}
            تفاصيل {kind === "fee" ? "الأتعاب" : kind === "payment" ? "الدفعة" : kind === "expense" ? "المصروف" : "الفاتورة"}
          </SheetTitle>
          <SheetDescription>
            {editing ? "وضع التحرير" : "عرض البيانات"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {kind === "fee" && item && (() => {
            const f = item as FeeItem;
            return (
              <>
                <DetailRow icon={Briefcase} label="القضية" value={f.case?.internalNumber ?? "—"} />
                <DetailRow icon={User} label="الموكل" value={f.case?.client?.fullName ?? "—"} />
                <DetailRow icon={DollarSign} label="النوع" value={getFeeTypeLabel(f.feeType)} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>المبلغ</Label>
                    {editing ? (
                      <Input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
                    ) : (
                      <div className="p-2 rounded-md bg-muted font-semibold">{formatCurrency(f.amount)}</div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>المدفوع</Label>
                    {editing ? (
                      <Input type="number" value={feePaid} onChange={(e) => setFeePaid(e.target.value)} />
                    ) : (
                      <div className="p-2 rounded-md bg-muted text-emerald-600 font-semibold">{formatCurrency(f.paidAmount)}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>المتبقي</Label>
                    <div className="p-2 rounded-md bg-muted text-red-600 font-semibold">{formatCurrency(f.amount - f.paidAmount)}</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الحالة</Label>
                    {editing ? (
                      <Select value={feeStatus} onValueChange={setFeeStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FEE_STATUS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={getFeeStatusColor(f.status)}>{getFeeStatusLabel(f.status)}</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ الاستحقاق</Label>
                  {editing ? (
                    <Input type="date" value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm">{f.dueDate ? formatDate(f.dueDate) : "—"}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  {editing ? (
                    <Textarea value={feeDesc} onChange={(e) => setFeeDesc(e.target.value)} rows={3} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm min-h-[60px]">{f.description ?? "—"}</div>
                  )}
                </div>
              </>
            );
          })()}

          {kind === "payment" && item && (() => {
            const p = item as PaymentItem;
            return (
              <>
                <DetailRow icon={User} label="الموكل" value={p.client?.fullName ?? "—"} />
                <DetailRow icon={Briefcase} label="القضية" value={p.case?.internalNumber ?? "—"} />
                <div className="space-y-1.5">
                  <Label>المبلغ</Label>
                  {editing ? (
                    <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-emerald-600 font-bold text-lg">{formatCurrency(p.amount)}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  {editing ? (
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{getPaymentMethodLabel(p.paymentMethod ?? "—")}</Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>المرجع</Label>
                  {editing ? (
                    <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm">{p.reference ?? "—"}</div>
                  )}
                </div>
                <DetailRow icon={Calendar} label="التاريخ" value={formatDate(p.paymentDate)} />
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  {editing ? (
                    <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={3} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm min-h-[60px]">{p.notes ?? "—"}</div>
                  )}
                </div>
              </>
            );
          })()}

          {kind === "expense" && item && (() => {
            const e = item as ExpenseItem;
            return (
              <>
                <DetailRow icon={Briefcase} label="القضية" value={e.case?.internalNumber ?? "—"} />
                <DetailRow icon={User} label="الموكل" value={e.client?.fullName ?? "—"} />
                <div className="space-y-1.5">
                  <Label>الفئة</Label>
                  {editing ? (
                    <Select value={expCategory} onValueChange={setExpCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{getExpenseCategoryLabel(e.category)}</Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ</Label>
                  {editing ? (
                    <Input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-red-600 font-bold text-lg">{formatCurrency(e.amount)}</div>
                  )}
                </div>
                <DetailRow icon={Calendar} label="التاريخ" value={formatDate(e.expenseDate)} />
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  {editing ? (
                    <Textarea value={expDesc} onChange={(e) => setExpDesc(e.target.value)} rows={3} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm min-h-[60px]">{e.description ?? "—"}</div>
                  )}
                </div>
                {e.receiptData && (
                  <div className="space-y-1.5">
                    <Label>إيصال</Label>
                    { }
                    <img src={e.receiptData} alt="إيصال" className="w-full rounded-md border" />
                  </div>
                )}
              </>
            );
          })()}

          {kind === "invoice" && item && (() => {
            const inv = item as InvoiceItem;
            const items: Array<{ description: string; quantity: number; unitPrice: number }> = (() => {
              try { return JSON.parse(inv.items) as Array<{ description: string; quantity: number; unitPrice: number }>; } catch { return []; }
            })();
            return (
              <>
                <DetailRow icon={FileText} label="رقم الفاتورة" value={inv.invoiceNumber} />
                <DetailRow icon={User} label="الموكل" value={inv.client?.fullName ?? "—"} />
                <DetailRow icon={Briefcase} label="القضية" value={inv.case?.internalNumber ?? "—"} />
                <div className="space-y-1.5">
                  <Label>الحالة</Label>
                  {editing ? (
                    <Select value={invStatus} onValueChange={setInvStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVOICE_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={getInvoiceStatusColor(inv.status)}>{getInvoiceStatusLabel(inv.status)}</Badge>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>البنود</Label>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الوصف</TableHead>
                          <TableHead className="text-left">كمية</TableHead>
                          <TableHead className="text-left">سعر</TableHead>
                          <TableHead className="text-left">إجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{it.description}</TableCell>
                            <TableCell className="text-left text-sm">{it.quantity}</TableCell>
                            <TableCell className="text-left text-sm">{formatCurrency(it.unitPrice)}</TableCell>
                            <TableCell className="text-left text-sm font-medium">{formatCurrency(it.quantity * it.unitPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">الإجمالي الفرعي:</span>
                    <div className="font-medium">{formatCurrency(inv.subtotal)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">الضريبة ({inv.taxRate}%):</span>
                    <div className="font-medium">{formatCurrency(inv.taxAmount)}</div>
                  </div>
                  <div className="space-y-1 col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <span className="font-medium">الإجمالي الكلي</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(inv.total)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">المدفوع:</span>
                    <div className="font-medium text-emerald-600">{formatCurrency(inv.paidAmount)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">المتبقي:</span>
                    <div className="font-medium text-red-600">{formatCurrency(inv.total - inv.paidAmount)}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  {editing ? (
                    <Textarea value={invNotes} onChange={(e) => setInvNotes(e.target.value)} rows={3} />
                  ) : (
                    <div className="p-2 rounded-md bg-muted text-sm min-h-[60px]">{inv.notes ?? "—"}</div>
                  )}
                </div>
              </>
            );
          })()}

          <div className="flex gap-2 pt-4">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1">
                  <Save className="w-4 h-4 ml-1" />
                  {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)} className="flex-1">
                <Edit3 className="w-4 h-4 ml-1" />
                تحرير
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// نافذة طباعة الفاتورة
// ============================================================

function InvoicePrintDialog({
  invoice,
  onClose,
}: {
  invoice: InvoiceItem | null;
  onClose: () => void;
}) {
  const items: Array<{ description: string; quantity: number; unitPrice: number }> = useMemo(() => {
    if (!invoice) return [];
    try { return JSON.parse(invoice.items) as Array<{ description: string; quantity: number; unitPrice: number }>; } catch { return []; }
  }, [invoice]);

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            معاينة الفاتورة
          </DialogTitle>
        </DialogHeader>
        {invoice && (
          <div id="invoice-print-area" className="bg-white p-6 rounded-lg border">
            {/* ترويسة الفاتورة */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-foreground">فاتورة</h2>
                <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                {invoice.dueDate && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2">تاريخ الاستحقاق</p>
                    <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                  </>
                )}
              </div>
            </div>

            {/* بيانات الموكل */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">فاتورة إلى:</p>
              <p className="font-bold text-foreground">{invoice.client?.fullName ?? "—"}</p>
              {invoice.case && (
                <p className="text-sm text-muted-foreground">القضية: {invoice.case.internalNumber}</p>
              )}
            </div>

            {/* البنود */}
            <Table className="mb-4">
              <TableHeader>
                <TableRow>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="text-left">الكمية</TableHead>
                  <TableHead className="text-left">سعر الوحدة</TableHead>
                  <TableHead className="text-left">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell className="text-left">{it.quantity}</TableCell>
                    <TableCell className="text-left">{formatCurrency(it.unitPrice)}</TableCell>
                    <TableCell className="text-left font-medium">{formatCurrency(it.quantity * it.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* الإجماليات */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الإجمالي الفرعي</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الضريبة ({invoice.taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-primary/5 border border-primary/20">
                  <span className="font-bold">الإجمالي الكلي</span>
                  <span className="font-bold text-primary text-lg">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المدفوع</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المتبقي</span>
                  <span className="font-medium text-red-600">{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">ملاحظات:</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة / تصدير PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// مكوّنات مساعدة
// ============================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
      لا توجد بيانات مالية لعرضها
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
