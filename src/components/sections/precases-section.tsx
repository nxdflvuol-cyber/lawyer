"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Briefcase, Plus, Search, FileText, Users, Scale, Gavel,
  Building2, FileCheck, ListChecks, Clock, Bell, Brain,
  AlertTriangle, CheckCircle, Archive, ArrowRight, X,
  Edit3, Trash2, Eye, ChevronLeft, History, Shield,
} from "lucide-react";
import { CASE_TYPES, formatDate, getCaseTypeLabel } from "@/lib/constants";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  preparing: { label: "قيد التجهيز", color: "bg-amber-100 text-amber-700" },
  ready: { label: "جاهز للتحويل", color: "bg-emerald-100 text-emerald-700" },
  converted: { label: "تم التحويل", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700" },
  archived: { label: "مؤرشف", color: "bg-slate-100 text-slate-700" },
};

export function PreCaseSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["precases", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/precases?${params}`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/precases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["precases"] });
      toast({ title: "تم إنشاء ملف التجهيز بنجاح" });
      setShowCreate(false);
    },
  });

  const preCases: Array<Record<string, unknown>> = data?.preCases ?? [];

  const stats = useMemo(() => {
    return {
      total: preCases.length,
      preparing: preCases.filter((p) => p.status === "preparing").length,
      ready: preCases.filter((p) => p.status === "ready").length,
      converted: preCases.filter((p) => p.status === "converted").length,
    };
  }, [preCases]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-primary" />
            إجراءات ما قبل رفع الدعوى
          </h1>
          <p className="text-muted-foreground mt-1">
            ملفات قانونية قيد التجهيز قبل تحويلها إلى قضايا رسمية
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="lg">
          <Plus className="w-4 h-4 ml-2" />
          ملف تجهيز جديد
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي الملفات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.preparing}</p>
          <p className="text-xs text-muted-foreground mt-1">قيد التجهيز</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.ready}</p>
          <p className="text-xs text-muted-foreground mt-1">جاهزة للتحويل</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.converted}</p>
          <p className="text-xs text-muted-foreground mt-1">تم تحويلها</p>
        </CardContent></Card>
      </div>

      {/* بحث وفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم الملف أو العنوان أو اسم الموكل..."
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="preparing">قيد التجهيز</SelectItem>
                <SelectItem value="ready">جاهز للتحويل</SelectItem>
                <SelectItem value="converted">تم التحويل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الملفات */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : preCases.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">لا توجد ملفات تجهيز</p>
              <p className="text-sm text-muted-foreground mt-1">
                ابدأ بإنشاء ملف تجهيز جديد لإجراءات ما قبل رفع الدعوى
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {preCases.map((pc) => {
                const status = STATUS_LABELS[pc.status as string] ?? STATUS_LABELS.preparing;
                const completeness = pc.completenessPct as number ?? 0;
                return (
                  <div
                    key={pc.id as string}
                    className="group flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/30 cursor-pointer transition"
                    onClick={() => setDetailId(pc.id as string)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{pc.preCaseNumber as string}</p>
                        <Badge className={cn("text-xs", status.color)}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {pc.title as string}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {pc.client && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {(pc.client as { fullName: string }).fullName}
                          </span>
                        )}
                        <span>{formatDate(pc.createdAt as string)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">اكتمال</span>
                      <div className="flex items-center gap-2">
                        <Progress value={completeness} className="w-20 h-2" />
                        <span className="text-sm font-medium">{completeness}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء ملف جديد */}
      {showCreate && (
        <CreatePreCaseDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}

      {/* لوحة تفاصيل الملف */}
      {detailId && (
        <PreCaseDetailSheet
          preCaseId={detailId}
          open={!!detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// نافذة إنشاء ملف تجهيز
// ============================================================
function CreatePreCaseDialog({
  open, onOpenChange, onSubmit, loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [caseType, setCaseType] = useState("");
  const [facts, setFacts] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء ملف تجهيز جديد</DialogTitle>
          <DialogDescription>
            سيتم توليد رقم فريد تلقائياً (مثل: PRE-2026-000001)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>عنوان الملف *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: نزاع عقاري مع شركة كذا"
            />
          </div>
          <div className="space-y-1.5">
            <Label>نوع القضية المتوقع</Label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الوقائع الأولية</Label>
            <Textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              placeholder="اكتب ملخص الوقائع..."
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={() => onSubmit({ title, caseType, facts, notes })}
            disabled={loading || !title.trim()}
          >
            {loading ? "جارٍ الإنشاء..." : "إنشاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل ملف التجهيز - بتبويبات كاملة
// ============================================================
function PreCaseDetailSheet({
  preCaseId, open, onClose,
}: {
  preCaseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConvert, setShowConvert] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["precase", preCaseId],
    queryFn: async () => {
      const res = await fetch(`/api/precases/${preCaseId}`);
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/precases/${preCaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["precase", preCaseId] });
      queryClient.invalidateQueries({ queryKey: ["precases"] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/precases/${preCaseId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["precases"] });
      toast({ title: "تم التحويل بنجاح!", description: data.message });
      onClose();
    },
  });

  const pc = data?.preCase;
  if (isLoading || !pc) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-4xl">
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground">جارٍ التحميل...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const status = STATUS_LABELS[pc.status as string] ?? STATUS_LABELS.preparing;
  const checklist = pc.checklist ? (typeof pc.checklist === "string" ? JSON.parse(pc.checklist) : pc.checklist) : [];
  const completeness = pc.completenessPct as number ?? 0;
  const timeline = (pc.timelineEvents ?? []) as Array<Record<string, unknown>>;
  const documentLinks = (pc.documentLinks ?? []) as Array<Record<string, unknown>>;
  const opponents = (pc.opponents ?? []) as Array<Record<string, unknown>>;
  const tasks = (pc.tasks ?? []) as Array<Record<string, unknown>>;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                {pc.preCaseNumber}
              </SheetTitle>
              <SheetDescription>{pc.title}</SheetDescription>
            </div>
            <Badge className={cn("text-xs", status.color)}>{status.label}</Badge>
          </div>
        </SheetHeader>

        {/* شريط الاكتمال + زر التحويل */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">نسبة اكتمال الملف</span>
            <span className="text-lg font-bold text-primary">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2 mb-3" />
          {pc.status === "ready" || completeness === 100 ? (
            <Button onClick={() => setShowConvert(true)} className="w-full" size="lg">
              <ArrowRight className="w-4 h-4 ml-2" />
              تحويل إلى قضية
            </Button>
          ) : pc.status === "converted" ? (
            <Badge className="w-full justify-center py-2 bg-blue-100 text-blue-700">
              <CheckCircle className="w-4 h-4 ml-2" />
              تم التحويل إلى قضية
            </Badge>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              أكمل جميع العناصر المطلوبة لتمكين التحويل
            </p>
          )}
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="documents">المستندات</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="opponents">الخصوم</TabsTrigger>
            <TabsTrigger value="tasks">المهام</TabsTrigger>
            <TabsTrigger value="notes">ملاحظات</TabsTrigger>
            <TabsTrigger value="audit">سجل</TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">بيانات الملف</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">رقم الملف</Label><p className="font-medium">{pc.preCaseNumber}</p></div>
                  <div><Label className="text-xs text-muted-foreground">نوع القضية</Label><p className="font-medium">{pc.caseType ? getCaseTypeLabel(pc.caseType as string) : "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">الموكل</Label><p className="font-medium">{pc.client?.fullName ?? "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">تاريخ الإنشاء</Label><p className="font-medium">{formatDate(pc.createdAt as string)}</p></div>
                </div>
                {pc.facts && (
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground">الوقائع</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{pc.facts}</p>
                  </div>
                )}
                {pc.legalFraming && (
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground">التكييف القانوني</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{pc.legalFraming}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* أزرار سريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ facts: prompt("أدخل الوقائع:") })}>
                <Edit3 className="w-3.5 h-3.5 ml-1" /> تعديل الوقائع
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ legalFraming: prompt("أدخل التكييف القانوني:") })}>
                <Scale className="w-3.5 h-3.5 ml-1" /> التكييف
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ notes: prompt("أدخل الملاحظات:") })}>
                <FileText className="w-3.5 h-3.5 ml-1" /> ملاحظات
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "قريباً", description: "رفع المستندات" })}>
                <Plus className="w-3.5 h-3.5 ml-1" /> رفع مستند
              </Button>
            </div>
          </TabsContent>

          {/* Checklist */}
          <TabsContent value="checklist" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">قائمة المراجعة</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checklist.map((item: { item: string; checked: boolean; required: boolean }, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-md border border-border hover:bg-accent/30"
                    >
                      <button
                        onClick={() => {
                          const updated = [...checklist];
                          updated[i] = { ...item, checked: !item.checked };
                          updateMutation.mutate({ checklist: updated });
                        }}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition",
                          item.checked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"
                        )}
                      >
                        {item.checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>
                        {item.item}
                      </span>
                      {item.required && <Badge variant="outline" className="text-xs">مطلوب</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* المستندات */}
          <TabsContent value="documents" className="space-y-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">المستندات المرتبطة</CardTitle>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "قريباً", description: "رفع مستندات" })}>
                  <Plus className="w-4 h-4 ml-1" /> رفع
                </Button>
              </CardHeader>
              <CardContent>
                {documentLinks.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد مستندات</p>
                ) : (
                  <div className="space-y-2">
                    {documentLinks.map((link) => {
                      const doc = link.document as Record<string, unknown>;
                      return (
                        <div key={link.id as string} className="flex items-center gap-3 p-2 rounded-md border border-border">
                          <FileText className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title as string}</p>
                            <p className="text-xs text-muted-foreground">{doc.docType as string}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">السجل الزمني</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">لا توجد أحداث</p>
                    ) : (
                      timeline.map((event) => (
                        <div key={event.id as string} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div className="w-0.5 flex-1 bg-border" />
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm font-medium">{event.title as string}</p>
                            {event.description && <p className="text-xs text-muted-foreground">{event.description as string}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.createdAt as string, true)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الخصوم */}
          <TabsContent value="opponents" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">الخصوم</CardTitle></CardHeader>
              <CardContent>
                {opponents.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">لا يوجد خصوم مسجلين</p>
                ) : (
                  <div className="space-y-2">
                    {opponents.map((opp) => (
                      <div key={opp.id as string} className="flex items-center gap-3 p-2 rounded-md border border-border">
                        <Users className="w-4 h-4 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{opp.name as string}</p>
                          {opp.lawyerName && <p className="text-xs text-muted-foreground">المحامي: {opp.lawyerName as string}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* المهام */}
          <TabsContent value="tasks" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">المهام المرتبطة</CardTitle></CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد مهام</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id as string} className="flex items-center gap-3 p-2 rounded-md border border-border">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title as string}</p>
                          {task.dueDate && <p className="text-xs text-muted-foreground">موعد: {formatDate(task.dueDate as string)}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs">{task.priority as string}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ملاحظات */}
          <TabsContent value="notes" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">الملاحظات</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  defaultValue={pc.notes as string ?? ""}
                  placeholder="اكتب الملاحظات..."
                  className="min-h-[150px]"
                  onBlur={(e) => {
                    if (e.target.value !== (pc.notes ?? "")) {
                      updateMutation.mutate({ notes: e.target.value });
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* سجل النشاط */}
          <TabsContent value="audit" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">سجل النشاط (Audit Log)</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {timeline.map((event) => (
                      <div key={`audit-${event.id as string}`} className="flex items-start gap-2 p-2 rounded-md border border-border text-sm">
                        <History className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{event.title as string}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.createdAt as string, true)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* نافذة التحويل لقضية */}
        {showConvert && (
          <ConvertDialog
            open={showConvert}
            onOpenChange={setShowConvert}
            preCaseNumber={pc.preCaseNumber as string}
            onConfirm={(data) => convertMutation.mutate(data)}
            loading={convertMutation.isPending}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// نافذة التحويل لقضية
// ============================================================
function ConvertDialog({
  open, onOpenChange, preCaseNumber, onConfirm, loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preCaseNumber: string;
  onConfirm: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [internalNumber, setInternalNumber] = useState("");
  const [court, setCourt] = useState("");
  const [circuit, setCircuit] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            تحويل إلى قضية
          </DialogTitle>
          <DialogDescription>
            سيتم تحويل ملف {preCaseNumber} إلى قضية رسمية مع نقل جميع البيانات
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 inline ml-1" />
            سيتم نقل: الموكل، الخصوم، العقارات، العقود، المستندات، المهام، المواعيد، Timeline، Checklist
          </div>
          <div className="space-y-1.5">
            <Label>رقم القضية الداخلي</Label>
            <Input
              value={internalNumber}
              onChange={(e) => setInternalNumber(e.target.value)}
              placeholder="مثلاً: 2026/001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>المحكمة</Label>
              <Input value={court} onChange={(e) => setCourt(e.target.value)} placeholder="اسم المحكمة" />
            </div>
            <div className="space-y-1.5">
              <Label>الدائرة</Label>
              <Input value={circuit} onChange={(e) => setCircuit(e.target.value)} placeholder="رقم الدائرة" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => onConfirm({ internalNumber, court, circuit })} disabled={loading}>
            {loading ? "جارٍ التحويل..." : "تحويل الآن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
