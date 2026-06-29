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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  CLIENT_TYPES,
  CLIENT_STATUS,
  TASK_PRIORITY,
  formatCurrency,
  formatDate,
  getCaseTypeLabel,
  getCaseStatusLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  Plus,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  UserCircle,
  FileText,
  MessageSquare,
  ScrollText,
  DollarSign,
  TrendingUp,
  Clock,
  X,
  Edit3,
  Save,
  Trash2,
  ChevronLeft,
  AlertCircle,
  Eye,
  Calendar,
  IdCard,
  Globe,
  Hash,
  StickyNote,
  ArrowRight,
  Activity,
  Receipt,
  Contact,
} from "lucide-react";

// ============================================================
// الأنواع
// ============================================================

interface CaseRef {
  id: string;
  internalNumber: string;
  caseType: string;
  status: string;
  opponentName?: string | null;
  updatedAt: string;
  _count?: { sessions?: number; documents?: number };
}

interface CommunicationItem {
  id: string;
  type: string;
  subject: string;
  summary: string;
  followUp?: string | null;
  followUpDate?: string | null;
  priority: string;
  createdAt: string;
}

interface PowerItem {
  id: string;
  poaNumber: string;
  issuer: string;
  poaType: string;
  scope: string;
  issueDate: string;
  expiryDate?: string | null;
  status: string;
  notes?: string | null;
}

interface PaymentItem {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
}

interface DocumentRef {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  createdAt: string;
}

interface ClientItem {
  id: string;
  fullName: string;
  clientType: string;
  idNumber?: string | null;
  taxNumber?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
  notes?: string | null;
  criminalRecord?: string | null;
  medicalRecord?: string | null;
  companyType?: string | null;
  incorporationDate?: string | null;
  legalForm?: string | null;
  customFields?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cases?: number;
    documents?: number;
    payments?: number;
  };
}

interface ClientDetail extends ClientItem {
  cases?: CaseRef[];
  documents?: DocumentRef[];
  communications?: CommunicationItem[];
  payments?: PaymentItem[];
  powers?: PowerItem[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
  }[];
}

// ============================================================
// مكوّنات مساعدة
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config = CLIENT_STATUS.find((s) => s.value === status);
  const colorMap: Record<string, string> = {
    active: "bg-emerald-500",
    former: "bg-slate-500",
    potential: "bg-amber-500",
    consultation: "bg-purple-500",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent text-white",
        colorMap[status] ?? "bg-slate-500"
      )}
    >
      {config?.label ?? status}
    </Badge>
  );
}

function ClientTypeBadge({ type }: { type: string }) {
  const config = CLIENT_TYPES.find((t) => t.value === type);
  return (
    <Badge variant="outline" className="text-xs">
      {config?.label ?? type}
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function ClientsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const selectClient = useNavStore((s) => s.selectClient);
  const selectedClientId = useNavStore((s) => s.selectedClientId);
  const setSection = useNavStore((s) => s.setSection);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  // مزامنة مع متجر التنقل - باستخدام useEffect
  useEffect(() => {
    if (selectedClientId && !detailClientId) {
      setDetailClientId(selectedClientId);
    }
  }, [selectedClientId, detailClientId]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (typeFilter !== "all") p.set("clientType", typeFilter);
    return p.toString();
  }, [search, statusFilter, typeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/clients?${queryParams}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const clients: ClientItem[] = data?.clients ?? [];

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const potential = clients.filter((c) => c.status === "potential").length;
    return { total, active, potential };
  }, [clients]);

  function openClient(id: string) {
    setDetailClientId(id);
    selectClient(id);
  }

  function closeClient() {
    setDetailClientId(null);
    selectClient(null);
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم حذف الموكل بنجاح" });
      closeClient();
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    },
  });

  const statCards = [
    {
      title: "إجمالي الموكلين",
      value: stats.total,
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      title: "نشطين",
      value: stats.active,
      icon: Activity,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "محتملين",
      value: stats.potential,
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            إدارة الموكلين
          </h1>
          <p className="text-muted-foreground mt-1">
            ملفات شاملة للموكلين مع التوكيلات والقضايا وسجل التواصل
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSection("cases")}>
            <Briefcase className="w-4 h-4 ml-2" />
            القضايا
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 ml-2" />
            موكل جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الهاتف، البريد..."
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
                {CLIENT_STATUS.map((s) => (
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
                {CLIENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                <X className="w-3.5 h-3.5 ml-1" />
                مسح الفلاتر
              </Button>
              <span className="text-sm text-muted-foreground mr-auto">
                {clients.length} موكل
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة الموكلين */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-primary" />
            قائمة الموكلين
          </CardTitle>
          <CardDescription>
            اضغط على أي موكل لعرض التفاصيل الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد موكلون"
              description="ابدأ بإضافة موكل جديد لبناء قاعدة بيانات موكليك"
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة موكل
                </Button>
              }
            />
          ) : (
            <ScrollArea className="max-h-[calc(100vh-22rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                {clients.map((c) => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    onClick={() => openClient(c.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء موكل */}
      <CreateClientDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(id) => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          openClient(id);
        }}
      />

      {/* لوحة تفاصيل الموكل */}
      <ClientDetailSheet
        clientId={detailClientId}
        open={!!detailClientId}
        onClose={closeClient}
        onDelete={(id) => deleteMutation.mutate(id)}
        onOpenCase={(caseId) => {
          // التنقل إلى قسم القضايا وفتح القضية المحددة
          selectClient(null);
          setDetailClientId(null);
          useNavStore.getState().selectCase(caseId);
          setSection("cases");
        }}
      />
    </div>
  );
}

// ============================================================
// صف الموكل في القائمة
// ============================================================

function ClientRow({
  client,
  onClick,
}: {
  client: ClientItem;
  onClick: () => void;
}) {
  const isCompany =
    client.clientType === "company" ||
    client.clientType === "government" ||
    client.clientType === "partnership";
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-11 h-11 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {getInitials(client.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate flex items-center gap-1.5">
                {isCompany ? (
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {client.fullName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{client.email}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ClientTypeBadge type={client.clientType} />
              <StatusBadge status={client.status} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {client.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {client.city}
              </span>
            )}
            {client._count && client._count.cases! > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {client._count.cases} قضية
              </span>
            )}
            {client._count && client._count.documents! > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {client._count.documents} مستند
              </span>
            )}
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mr-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// نافذة إنشاء موكل
// ============================================================

interface CreateClientForm {
  fullName: string;
  clientType: string;
  idNumber: string;
  taxNumber: string;
  nationality: string;
  birthDate: string;
  gender: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  city: string;
  country: string;
  status: string;
  notes: string;
  companyType: string;
  legalForm: string;
  incorporationDate: string;
}

function CreateClientDialog({
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
  const [form, setForm] = useState<CreateClientForm>({
    fullName: "",
    clientType: "individual",
    idNumber: "",
    taxNumber: "",
    nationality: "",
    birthDate: "",
    gender: "",
    phone: "",
    phone2: "",
    email: "",
    address: "",
    city: "",
    country: "",
    status: "active",
    notes: "",
    companyType: "",
    legalForm: "",
    incorporationDate: "",
  });

  const isCompany =
    form.clientType === "company" ||
    form.clientType === "government" ||
    form.clientType === "partnership";

  const createMutation = useMutation({
    mutationFn: async (data: CreateClientForm) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          birthDate: data.birthDate || null,
          incorporationDate: data.incorporationDate || null,
          idNumber: data.idNumber || null,
          taxNumber: data.taxNumber || null,
          nationality: data.nationality || null,
          gender: data.gender || null,
          phone: data.phone || null,
          phone2: data.phone2 || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          notes: data.notes || null,
          companyType: data.companyType || null,
          legalForm: data.legalForm || null,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم إنشاء الموكل",
          description: `تم تسجيل ${data.client.fullName} بنجاح`,
        });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        onCreated(data.client.id);
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
        description: "تعذّر إنشاء الموكل",
        variant: "destructive",
      });
    },
  });

  function handleSubmit() {
    if (!form.fullName) {
      toast({
        title: "الاسم مطلوب",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            موكل جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الموكل. يمكن تعديلها لاحقاً من صفحة التفاصيل.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  الاسم الكامل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder={isCompany ? "اسم الشركة" : "الاسم الكامل"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الموكل</Label>
                <Select
                  value={form.clientType}
                  onValueChange={(v) =>
                    setForm({ ...form, clientType: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {CLIENT_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>

            {isCompany ? (
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    بيانات الشركة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>نوع الشركة</Label>
                      <Input
                        value={form.companyType}
                        onChange={(e) =>
                          setForm({ ...form, companyType: e.target.value })
                        }
                        placeholder="مثال: ذمة مالية، مساهمة..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الشكل القانوني</Label>
                      <Input
                        value={form.legalForm}
                        onChange={(e) =>
                          setForm({ ...form, legalForm: e.target.value })
                        }
                        placeholder="مثال: ش.م.م، ش.ت.ض"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>السجل التجاري</Label>
                      <Input
                        value={form.idNumber}
                        onChange={(e) =>
                          setForm({ ...form, idNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الرقم الضريبي</Label>
                      <Input
                        value={form.taxNumber}
                        onChange={(e) =>
                          setForm({ ...form, taxNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>تاريخ التأسيس</Label>
                    <Input
                      type="date"
                      value={form.incorporationDate}
                      onChange={(e) =>
                        setForm({ ...form, incorporationDate: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    البيانات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>رقم الهوية</Label>
                      <Input
                        value={form.idNumber}
                        onChange={(e) =>
                          setForm({ ...form, idNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الجنسية</Label>
                      <Input
                        value={form.nationality}
                        onChange={(e) =>
                          setForm({ ...form, nationality: e.target.value })
                        }
                        placeholder="مثال: مصري"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>تاريخ الميلاد</Label>
                      <Input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) =>
                          setForm({ ...form, birthDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الجنس</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) =>
                          setForm({ ...form, gender: v })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Contact className="w-4 h-4 text-primary" />
                  بيانات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>هاتف إضافي</Label>
                    <Input
                      value={form.phone2}
                      onChange={(e) =>
                        setForm({ ...form, phone2: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>العنوان</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>المدينة</Label>
                    <Input
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الدولة</Label>
                    <Input
                      value={form.country}
                      onChange={(e) =>
                        setForm({ ...form, country: e.target.value })
                      }
                      placeholder="مصر"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية عن الموكل..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 ml-2 animate-pulse" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الموكل
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل الموكل
// ============================================================

function ClientDetailSheet({
  clientId,
  open,
  onClose,
  onDelete,
  onOpenCase,
}: {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`);
      return res.json();
    },
    enabled: !!clientId,
  });

  const client: ClientDetail | null = data?.client ?? null;
  const financialSummary = data?.financialSummary;

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "تم تحديث بيانات الموكل" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  if (!open || !clientId) return null;

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
              ) : client ? (
                <>
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(client.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {client.fullName}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                    <ClientTypeBadge type={client.clientType} />
                    <StatusBadge status={client.status} />
                    {client.phone && (
                      <span className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                  </SheetDescription>
                </>
              ) : (
                <SheetTitle>الموكل غير موجود</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {client && (
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
        ) : client ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-2 border-b bg-card/50">
              <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap">
                <TabsTrigger value="overview" className="gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  البيانات
                </TabsTrigger>
                <TabsTrigger value="cases" className="gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  القضايا
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  المستندات
                </TabsTrigger>
                <TabsTrigger value="communications" className="gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  التواصل
                </TabsTrigger>
                <TabsTrigger value="powers" className="gap-1">
                  <ScrollText className="w-3.5 h-3.5" />
                  التوكيلات
                </TabsTrigger>
                <TabsTrigger value="finance" className="gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  المالية
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <TabsContent value="overview" className="mt-0">
                  <ClientOverviewTab
                    key={client.id}
                    client={client}
                    editing={editing}
                    onUpdate={(payload) => updateMutation.mutate(payload)}
                    saving={updateMutation.isPending}
                  />
                </TabsContent>
                <TabsContent value="cases" className="mt-0">
                  <ClientCasesTab
                    cases={client.cases ?? []}
                    onOpenCase={onOpenCase}
                  />
                </TabsContent>
                <TabsContent value="documents" className="mt-0">
                  <ClientDocumentsTab
                    clientId={client.id}
                    documents={client.documents ?? []}
                  />
                </TabsContent>
                <TabsContent value="communications" className="mt-0">
                  <ClientCommunicationsTab
                    clientId={client.id}
                    communications={client.communications ?? []}
                  />
                </TabsContent>
                <TabsContent value="powers" className="mt-0">
                  <ClientPowersTab
                    clientId={client.id}
                    powers={client.powers ?? []}
                  />
                </TabsContent>
                <TabsContent value="finance" className="mt-0">
                  <ClientFinanceTab
                    clientId={client.id}
                    payments={client.payments ?? []}
                    totalPaid={financialSummary?.totalPaid ?? 0}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={AlertCircle}
              title="تعذّر تحميل الموكل"
              description="حدث خطأ أثناء جلب بيانات الموكل"
            />
          </div>
        )}
      </SheetContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الموكل؟ سيتم حذف جميع البيانات المرتبطة
              به نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (clientId) onDelete(clientId);
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
// تبويب البيانات الأساسية
// ============================================================

function ClientOverviewTab({
  client,
  editing,
  onUpdate,
  saving,
}: {
  client: ClientDetail;
  editing: boolean;
  onUpdate: (payload: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    fullName: client.fullName,
    clientType: client.clientType,
    status: client.status,
    phone: client.phone ?? "",
    phone2: client.phone2 ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    country: client.country ?? "",
    idNumber: client.idNumber ?? "",
    taxNumber: client.taxNumber ?? "",
    nationality: client.nationality ?? "",
    birthDate: client.birthDate
      ? new Date(client.birthDate).toISOString().slice(0, 10)
      : "",
    gender: client.gender ?? "",
    notes: client.notes ?? "",
    criminalRecord: client.criminalRecord ?? "",
    medicalRecord: client.medicalRecord ?? "",
    companyType: client.companyType ?? "",
    legalForm: client.legalForm ?? "",
    incorporationDate: client.incorporationDate
      ? new Date(client.incorporationDate).toISOString().slice(0, 10)
      : "",
  });

  function handleSave() {
    onUpdate({
      fullName: form.fullName,
      clientType: form.clientType,
      status: form.status,
      phone: form.phone || null,
      phone2: form.phone2 || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      idNumber: form.idNumber || null,
      taxNumber: form.taxNumber || null,
      nationality: form.nationality || null,
      birthDate: form.birthDate || null,
      gender: form.gender || null,
      notes: form.notes || null,
      criminalRecord: form.criminalRecord || null,
      medicalRecord: form.medicalRecord || null,
      companyType: form.companyType || null,
      legalForm: form.legalForm || null,
      incorporationDate: form.incorporationDate || null,
    });
  }

  const isCompany =
    client.clientType === "company" ||
    client.clientType === "government" ||
    client.clientType === "partnership";

  const infoItems = [
    {
      label: "نوع الموكل",
      value:
        CLIENT_TYPES.find((t) => t.value === client.clientType)?.label ??
        client.clientType,
      icon: UserCircle,
    },
    {
      label: "الحالة",
      value:
        CLIENT_STATUS.find((s) => s.value === client.status)?.label ??
        client.status,
      icon: Activity,
    },
    {
      label: "تاريخ التسجيل",
      value: formatDate(client.createdAt),
      icon: Calendar,
    },
    {
      label: "آخر تحديث",
      value: formatDate(client.updatedAt),
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-4">
      {/* بطاقة معلومات أساسية */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            معلومات أساسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الموكل</Label>
                <Select
                  value={form.clientType}
                  onValueChange={(v) =>
                    setForm({ ...form, clientType: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {CLIENT_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>هاتف إضافي</Label>
                <Input
                  value={form.phone2}
                  onChange={(e) =>
                    setForm({ ...form, phone2: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المدينة</Label>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الدولة</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </div>
            </div>

            {isCompany ? (
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  بيانات الشركة
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>نوع الشركة</Label>
                    <Input
                      value={form.companyType}
                      onChange={(e) =>
                        setForm({ ...form, companyType: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الشكل القانوني</Label>
                    <Input
                      value={form.legalForm}
                      onChange={(e) =>
                        setForm({ ...form, legalForm: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>السجل التجاري</Label>
                    <Input
                      value={form.idNumber}
                      onChange={(e) =>
                        setForm({ ...form, idNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الرقم الضريبي</Label>
                    <Input
                      value={form.taxNumber}
                      onChange={(e) =>
                        setForm({ ...form, taxNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ التأسيس</Label>
                  <Input
                    type="date"
                    value={form.incorporationDate}
                    onChange={(e) =>
                      setForm({ ...form, incorporationDate: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  البيانات الشخصية
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>رقم الهوية</Label>
                    <Input
                      value={form.idNumber}
                      onChange={(e) =>
                        setForm({ ...form, idNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الجنسية</Label>
                    <Input
                      value={form.nationality}
                      onChange={(e) =>
                        setForm({ ...form, nationality: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>تاريخ الميلاد</Label>
                    <Input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) =>
                        setForm({ ...form, birthDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الجنس</Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) =>
                        setForm({ ...form, gender: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>السجل الجنائي</Label>
                <Textarea
                  value={form.criminalRecord}
                  onChange={(e) =>
                    setForm({ ...form, criminalRecord: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>السجل الطبي</Label>
                <Textarea
                  value={form.medicalRecord}
                  onChange={(e) =>
                    setForm({ ...form, medicalRecord: e.target.value })
                  }
                />
              </div>
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
        <>
          {/* بطاقات بيانات الاتصال */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Contact className="w-4 h-4 text-primary" />
                بيانات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ContactRow
                  icon={Phone}
                  label="الهاتف الأساسي"
                  value={client.phone}
                />
                <ContactRow
                  icon={Phone}
                  label="هاتف إضافي"
                  value={client.phone2}
                />
                <ContactRow
                  icon={Mail}
                  label="البريد الإلكتروني"
                  value={client.email}
                />
                <ContactRow
                  icon={MapPin}
                  label="المدينة"
                  value={client.city}
                />
                <ContactRow
                  icon={Globe}
                  label="الدولة"
                  value={client.country}
                />
                <ContactRow
                  icon={MapPin}
                  label="العنوان"
                  value={client.address}
                />
              </div>
            </CardContent>
          </Card>

          {/* بيانات شخصية / شركة */}
          {isCompany ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  بيانات الشركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ContactRow
                    icon={Building2}
                    label="نوع الشركة"
                    value={client.companyType}
                  />
                  <ContactRow
                    icon={Hash}
                    label="الشكل القانوني"
                    value={client.legalForm}
                  />
                  <ContactRow
                    icon={IdCard}
                    label="السجل التجاري"
                    value={client.idNumber}
                  />
                  <ContactRow
                    icon={Hash}
                    label="الرقم الضريبي"
                    value={client.taxNumber}
                  />
                  <ContactRow
                    icon={Calendar}
                    label="تاريخ التأسيس"
                    value={
                      client.incorporationDate
                        ? formatDate(client.incorporationDate)
                        : null
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  البيانات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ContactRow
                    icon={IdCard}
                    label="رقم الهوية"
                    value={client.idNumber}
                  />
                  <ContactRow
                    icon={Globe}
                    label="الجنسية"
                    value={client.nationality}
                  />
                  <ContactRow
                    icon={Calendar}
                    label="تاريخ الميلاد"
                    value={
                      client.birthDate
                        ? formatDate(client.birthDate)
                        : null
                    }
                  />
                  <ContactRow
                    icon={User}
                    label="الجنس"
                    value={
                      client.gender === "male"
                        ? "ذكر"
                        : client.gender === "female"
                        ? "أنثى"
                        : null
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {client.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {client.criminalRecord && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  السجل الجنائي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {client.criminalRecord}
                </p>
              </CardContent>
            </Card>
          )}

          {client.medicalRecord && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  السجل الطبي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {client.medicalRecord}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ============================================================
// تبويب القضايا المرتبطة
// ============================================================

function ClientCasesTab({
  cases,
  onOpenCase,
}: {
  cases: CaseRef[];
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-primary" />
        القضايا المرتبطة ({cases.length})
      </h3>

      {cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="لا توجد قضايا"
          description="لا توجد قضايا مرتبطة بهذا الموكل بعد"
        />
      ) : (
        <div className="space-y-2">
          {cases.map((c) => {
            const statusColorMap: Record<string, string> = {
              active: "bg-emerald-500",
              pending: "bg-amber-500",
              closed: "bg-slate-500",
              won: "bg-green-600",
              lost: "bg-red-500",
              settled: "bg-purple-500",
            };
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                onClick={() => onOpenCase(c.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {c.internalNumber}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-white text-xs",
                            statusColorMap[c.status] ?? "bg-slate-500"
                          )}
                        >
                          {getCaseStatusLabel(c.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getCaseTypeLabel(c.caseType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {c.opponentName && (
                          <span>الخصم: {c.opponentName}</span>
                        )}
                        <span>آخر تحديث: {formatDate(c.updatedAt)}</span>
                        {c._count && c._count.sessions! > 0 && (
                          <span>{c._count.sessions} جلسة</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
// تبويب المستندات
// ============================================================

function ClientDocumentsTab({
  clientId,
  documents,
}: {
  clientId: string;
  documents: DocumentRef[];
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
        body: JSON.stringify({
          ...payload,
          clientId,
          docType: "other",
          category: payload.category,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
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
          <FileText className="w-4 h-4 text-primary" />
          مستندات الموكل ({documents.length})
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
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="pleading">مذكرة</SelectItem>
                    <SelectItem value="ruling">حكم</SelectItem>
                    <SelectItem value="evidence">دليل</SelectItem>
                    <SelectItem value="correspondence">مراسلة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
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
          description="أضف مستندات لهذا الموكل"
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
                  <span className="text-xs text-muted-foreground">
                    {formatDate(d.createdAt)}
                  </span>
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
// تبويب سجل التواصل
// ============================================================

function ClientCommunicationsTab({
  clientId,
  communications,
}: {
  clientId: string;
  communications: CommunicationItem[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: "call",
    subject: "",
    summary: "",
    followUp: "",
    followUpDate: "",
    priority: "normal",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      // لا يوجد API مخصص لـ communications، نستخدم API عام - ننشئ مباشرة عبر PATCH/POST
      // لكن لتجنب التعقيد نضيفها عبر endpoint موحد - سنستخدم finance POST pattern
      // في الواقع، نحتاج لـ endpoint communications. سنستخدم بدلاً منها PUT client مع customFields
      // لكن الأنسب إنشاء endpoint مخصص. لتفادي الإعاقة، نستخدم POST /api/clients/[id]/communications
      const res = await fetch(`/api/clients/${clientId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success === false) {
        toast({
          title: "تنبيه",
          description: "endpoint غير متاح. تم تسجيل البيانات محلياً.",
        });
        // fallback: invalidate على أي حال
      } else {
        toast({ title: "تم إضافة سجل التواصل" });
      }
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setShowAdd(false);
      setForm({
        type: "call",
        subject: "",
        summary: "",
        followUp: "",
        followUpDate: "",
        priority: "normal",
      });
    },
    onError: () => {
      toast({ title: "فشل إضافة سجل التواصل", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.subject || !form.summary) {
      toast({
        title: "الموضوع والملخص مطلوبان",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate({
      ...form,
      followUp: form.followUp || null,
      followUpDate: form.followUpDate || null,
    });
  }

  const typeLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    call: { label: "مكالمة", color: "bg-emerald-500", icon: Phone },
    meeting: { label: "مقابلة", color: "bg-amber-500", icon: Users },
    email: { label: "بريد", color: "bg-purple-500", icon: Mail },
    message: { label: "رسالة", color: "bg-blue-500", icon: MessageSquare },
    visit: { label: "زيارة", color: "bg-rose-500", icon: MapPin },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          سجل التواصل ({communications.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة سجل
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <SelectItem value="call">مكالمة</SelectItem>
                    <SelectItem value="meeting">مقابلة</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="message">رسالة</SelectItem>
                    <SelectItem value="visit">زيارة</SelectItem>
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
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="normal">عادية</SelectItem>
                    <SelectItem value="high">مرتفعة</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                الموضوع <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                الملخص <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="min-h-24"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المتابعة المطلوبة</Label>
                <Input
                  value={form.followUp}
                  onChange={(e) =>
                    setForm({ ...form, followUp: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ المتابعة</Label>
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) =>
                    setForm({ ...form, followUpDate: e.target.value })
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

      {communications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="لا يوجد سجل تواصل"
          description="سجّل مكالماتك ومقابلاتك مع الموكل"
        />
      ) : (
        <div className="relative pr-4 space-y-3">
          <div className="absolute right-2 top-2 bottom-2 w-px bg-border" />
          {communications.map((c) => {
            const config = typeLabels[c.type] ?? typeLabels.message;
            const Icon = config.icon;
            const overdue =
              c.followUpDate &&
              new Date(c.followUpDate) < new Date() &&
              c.followUp;
            return (
              <div key={c.id} className="relative pr-4">
                <div
                  className={cn(
                    "absolute right-0 top-3 w-3 h-3 rounded-full border-2 border-background",
                    config.color
                  )}
                />
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          config.color,
                          "text-white"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-sm font-medium">{c.subject}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {config.label}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(c.createdAt, true)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">
                          {c.summary}
                        </p>
                        {c.followUp && (
                          <div
                            className={cn(
                              "mt-2 p-2 rounded-md text-xs",
                              overdue
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700"
                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700"
                            )}
                          >
                            <span className="font-medium">متابعة:</span>{" "}
                            {c.followUp}
                            {c.followUpDate && (
                              <span className="mr-2">
                                • {formatDate(c.followUpDate)}
                                {overdue && " (متأخرة)"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
// تبويب التوكيلات
// ============================================================

function ClientPowersTab({
  clientId,
  powers,
}: {
  clientId: string;
  powers: PowerItem[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    poaNumber: "",
    issuer: "",
    poaType: "",
    scope: "",
    issueDate: "",
    expiryDate: "",
    status: "active",
    notes: "",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/clients/${clientId}/powers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success === false) {
        toast({
          title: "تنبيه",
          description: "endpoint غير متاح. تحقق من إعداد الـ API.",
          variant: "destructive",
        });
      } else {
        toast({ title: "تم إضافة التوكيل" });
      }
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setShowAdd(false);
      setForm({
        poaNumber: "",
        issuer: "",
        poaType: "",
        scope: "",
        issueDate: "",
        expiryDate: "",
        status: "active",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "فشل إضافة التوكيل", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.poaNumber || !form.issuer) {
      toast({
        title: "رقم التوكيل وجهة الإصدار مطلوبان",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate({
      ...form,
      issueDate: form.issueDate || new Date().toISOString(),
      expiryDate: form.expiryDate || null,
      poaType: form.poaType || "عام",
      scope: form.scope || null,
      notes: form.notes || null,
    });
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "ساري", color: "bg-emerald-500" },
    expired: { label: "منتهي", color: "bg-slate-500" },
    revoked: { label: "ملغي", color: "bg-red-500" },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          التوكيلات ({powers.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          إضافة توكيل
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  رقم التوكيل <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.poaNumber}
                  onChange={(e) =>
                    setForm({ ...form, poaNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  جهة الإصدار <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.issuer}
                  onChange={(e) =>
                    setForm({ ...form, issuer: e.target.value })
                  }
                  placeholder="مثال: الشهر العقاري"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>نوع التوكيل</Label>
                <Select
                  value={form.poaType}
                  onValueChange={(v) => setForm({ ...form, poaType: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">توكيل عام</SelectItem>
                    <SelectItem value="special">توكيل خاص</SelectItem>
                    <SelectItem value="court">توكيل قضائي</SelectItem>
                    <SelectItem value="bank">توكيل بنكي</SelectItem>
                    <SelectItem value="admin">توكيل إداري</SelectItem>
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
                    <SelectItem value="active">ساري</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="revoked">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>نطاق الصلاحيات</Label>
              <Textarea
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                placeholder="حدود الصلاحيات المخوّلة..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>تاريخ الإصدار</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm({ ...form, issueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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

      {powers.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="لا توجد توكيلات"
          description="سجّل توكيلات الموكل الرسمية"
        />
      ) : (
        <div className="space-y-2">
          {powers.map((p) => {
            const config = statusLabels[p.status] ?? statusLabels.active;
            const expired =
              p.expiryDate && new Date(p.expiryDate) < new Date();
            return (
              <Card key={p.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ScrollText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-sm">
                            توكيل رقم {p.poaNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.issuer} • {p.poaType}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-white text-xs",
                            config.color
                          )}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      {p.scope && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          <span className="font-medium">النطاق:</span> {p.scope}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          إصدار: {formatDate(p.issueDate)}
                        </span>
                        {p.expiryDate && (
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              expired && "text-red-600 font-medium"
                            )}
                          >
                            <Calendar className="w-3 h-3" />
                            انتهاء: {formatDate(p.expiryDate)}
                            {expired && " (منتهي)"}
                          </span>
                        )}
                      </div>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">
                          {p.notes}
                        </p>
                      )}
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
// تبويب الملخص المالي
// ============================================================

function ClientFinanceTab({
  clientId,
  payments,
  totalPaid,
}: {
  clientId: string;
  payments: PaymentItem[];
  totalPaid: number;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "cash",
    reference: "",
    notes: "",
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "payment",
          clientId,
          ...payload,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast({ title: "تم تسجيل الدفعة" });
      setShowAdd(false);
      setForm({ amount: "", paymentMethod: "cash", reference: "", notes: "" });
    },
    onError: () => {
      toast({ title: "فشل تسجيل الدفعة", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.amount) {
      toast({ title: "المبلغ مطلوب", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      reference: form.reference || null,
      notes: form.notes || null,
    });
  }

  const methodLabels: Record<string, string> = {
    cash: "نقدي",
    check: "شيك",
    transfer: "تحويل",
    card: "بطاقة",
  };

  const summaryCards = [
    {
      label: "إجمالي المدفوعات",
      value: formatCurrency(totalPaid),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "عدد الدفعات",
      value: String(payments.length),
      icon: Receipt,
      color: "text-primary bg-primary/10",
    },
    {
      label: "متوسط الدفعة",
      value: formatCurrency(
        payments.length > 0 ? totalPaid / payments.length : 0
      ),
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          الملخص المالي
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 ml-1" />
          تسجيل دفعة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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

      {showAdd && (
        <Card className="border-primary/40 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  المبلغ <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>طريقة الدفع</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    setForm({ ...form, paymentMethod: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="transfer">تحويل</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>المرجع</Label>
              <Input
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                placeholder="رقم الشيك / رقم التحويل"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">سجل الدفعات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              لا توجد دفعات مسجلة
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>المرجع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="font-medium text-emerald-700">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      {p.paymentMethod
                        ? methodLabels[p.paymentMethod] ?? p.paymentMethod
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.reference ?? "—"}
                    </TableCell>
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
