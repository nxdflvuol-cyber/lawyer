"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  EVENT_TYPES,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Briefcase,
  User,
  Gavel,
  Users as UsersIcon,
  AlertCircle,
  Calculator,
  CalendarDays,
  CalendarRange,
  List as ListIcon,
  Bell,
  X,
  Eye,
  Timer,
  CheckCircle2,
  XCircle,
  PartyPopper,
  Info,
} from "lucide-react";

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

interface AppointmentItem {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  allDay: boolean;
  eventType: string;
  location?: string | null;
  court?: string | null;
  caseId?: string | null;
  clientId?: string | null;
  case?: CaseLite | null;
  client?: ClientLite | null;
  reminder?: number | null;
  status: string;
  createdAt: string;
}

// ============================================================
// ثوابت مساعدة
// ============================================================

const WEEKDAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WEEKDAYS_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function getEventTypeConfig(type: string) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
}

// مكوّن أيقونة نوع الموعد (يستخدم switch لتجنّب إنشاء مكوّنات أثناء العرض)
function EventTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "court_session":
    case "hearing":
      return <Gavel className={className} />;
    case "client_meeting":
      return <UsersIcon className={className} />;
    case "deadline":
      return <AlertCircle className={className} />;
    case "task":
      return <CheckCircle2 className={className} />;
    case "consultation":
      return <Info className={className} />;
    default:
      return <CalendarIcon className={className} />;
  }
}

// تنسيق التاريخ بصيغة YYYY-MM-DD للتخزين
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toISODateTime(d: Date): string {
  return d.toISOString().slice(0, 16);
}

// يطابق نفس اليوم
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// تنسيق الوقت
function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// مكوّن مساعد للحالة الفارغة
// ============================================================

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

export function AppointmentsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setSection = useNavStore((s) => s.setSection);

  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [detailAptId, setDetailAptId] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // جلب كل المواعيد في نطاق واسع (السنة الحالية)
  const selectedYear = selectedDate.getFullYear();
  const yearStart = useMemo(() => {
    const d = new Date(selectedYear, 0, 1);
    return toISODate(d);
  }, [selectedYear]);
  const yearEnd = useMemo(() => {
    const d = new Date(selectedYear, 11, 31);
    return toISODate(d);
  }, [selectedYear]);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", yearStart, yearEnd],
    queryFn: async () => {
      const res = await fetch(
        `/api/appointments?from=${yearStart}&to=${yearEnd}`
      );
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: casesData } = useQuery({
    queryKey: ["cases", "for-apt-select"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-apt-select"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const cases: CaseLite[] = casesData?.cases ?? [];
  const clients: ClientLite[] = clientsData?.clients ?? [];
  const allAppointments: AppointmentItem[] = data?.appointments ?? [];

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const today = new Date();
    const todayCount = allAppointments.filter((a) =>
      isSameDay(new Date(a.startDate), today)
    ).length;
    const upcoming = allAppointments.filter(
      (a) => new Date(a.startDate) > today
    ).length;
    const thisMonth = allAppointments.filter((a) => {
      const d = new Date(a.startDate);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }).length;
    return { todayCount, upcoming, thisMonth };
  }, [allAppointments]);

  // خريطة المواعيد حسب اليوم (للتقويم الشهري)
  const appointmentsByDay = useMemo(() => {
    const map: Record<string, AppointmentItem[]> = {};
    allAppointments.forEach((a) => {
      const key = toISODate(new Date(a.startDate));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [allAppointments]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم حذف الموعد" });
      setDetailAptId(null);
    },
    onError: () => {
      toast({ title: "فشل الحذف", variant: "destructive" });
    },
  });

  // مواعيد اليوم المختار
  const dayAppointments = useMemo(() => {
    const key = toISODate(selectedDate);
    return (appointmentsByDay[key] ?? []).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [appointmentsByDay, selectedDate]);

  // مواعيد الأسبوع المختار
  const weekAppointments = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // الأحد
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return allAppointments
      .filter((a) => {
        const d = new Date(a.startDate);
        return d >= start && d < end;
      })
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }, [allAppointments, selectedDate]);

  const statCards = [
    {
      title: "مواعيد اليوم",
      value: stats.todayCount,
      icon: CalendarIcon,
      color: "text-primary bg-primary/10",
    },
    {
      title: "هذا الشهر",
      value: stats.thisMonth,
      icon: CalendarDays,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "قادمة",
      value: stats.upcoming,
      icon: CalendarRange,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  function navigate(direction: -1 | 1) {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  }

  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTHS_AR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (viewMode === "week") {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    if (viewMode === "day") {
      return formatDate(selectedDate, true);
    }
    return "كل المواعيد";
  }, [viewMode, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary" />
            المواعيد والتقويم
          </h1>
          <p className="text-muted-foreground mt-1">
            تقويم شامل ومحرك حساب المواعيد القانونية
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowCalculator(true)}>
            <Calculator className="w-4 h-4 ml-2" />
            حاسبة المواعيد القانونية
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 ml-2" />
            موعد جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="stat-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", card.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* أدوات التنقل بين الفترات */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate(1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                اليوم
              </Button>
              <h3 className="font-semibold text-foreground mr-2">{headerLabel}</h3>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList>
                <TabsTrigger value="day" className="gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  يومي
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1">
                  <CalendarRange className="w-3.5 h-3.5" />
                  أسبوعي
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  شهري
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1">
                  <ListIcon className="w-3.5 h-3.5" />
                  قائمة
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* المحتوى */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* التقويم/العرض الرئيسي */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="h-96 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ) : viewMode === "month" ? (
            <MonthlyCalendar
              selectedDate={selectedDate}
              appointmentsByDay={appointmentsByDay}
              onDayClick={(d) => {
                setSelectedDate(d);
                setViewMode("day");
              }}
            />
          ) : viewMode === "week" ? (
            <WeekView
              appointments={weekAppointments}
              onAptClick={(id) => setDetailAptId(id)}
              selectedDate={selectedDate}
            />
          ) : viewMode === "day" ? (
            <DayView
              appointments={dayAppointments}
              onAptClick={(id) => setDetailAptId(id)}
              date={selectedDate}
            />
          ) : (
            <ListView
              appointments={allAppointments}
              onAptClick={(id) => setDetailAptId(id)}
            />
          )}
        </div>

        {/* قائمة المواعيد الجانبية لليوم المختار */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              مواعيد اليوم المختار
            </CardTitle>
            <CardDescription>{formatDate(selectedDate)}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[60vh]">
              {dayAppointments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  لا توجد مواعيد في هذا اليوم
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {dayAppointments.map((a) => (
                    <AppointmentListItem
                      key={a.id}
                      apt={a}
                      onClick={() => setDetailAptId(a.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* نافذة إنشاء موعد */}
      <CreateAppointmentDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        cases={cases}
        clients={clients}
        defaultDate={selectedDate}
        onCreated={(id) => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          setDetailAptId(id);
        }}
      />

      {/* لوحة تفاصيل الموعد */}
      <AppointmentDetailSheet
        aptId={detailAptId}
        open={!!detailAptId}
        onClose={() => setDetailAptId(null)}
        onDelete={(id) => deleteMutation.mutate(id)}
        cases={cases}
        clients={clients}
        appointments={allAppointments}
      />

      {/* حاسبة المواعيد القانونية */}
      <LegalDeadlineCalculator
        open={showCalculator}
        onOpenChange={setShowCalculator}
      />
    </div>
  );
}

// ============================================================
// التقويم الشهري
// ============================================================

function MonthlyCalendar({
  selectedDate,
  appointmentsByDay,
  onDayClick,
}: {
  selectedDate: Date;
  appointmentsByDay: Record<string, AppointmentItem[]>;
  onDayClick: (d: Date) => void;
}) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const today = new Date();

  // حساب أيام الشهر
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 = الأحد
    const totalDays = lastDay.getDate();

    const cells: { date: Date | null; isCurrentMonth: boolean }[] = [];
    // خلايا فارغة قبل بداية الشهر
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(year, month, -startWeekday + i + 1);
      cells.push({ date: d, isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // إكمال الشبكة (42 خلية)
    while (cells.length < 42) {
      const d = new Date(year, month, totalDays + (cells.length - startWeekday - totalDays) + 1);
      cells.push({ date: d, isCurrentMonth: false });
    }
    return cells;
  }, [year, month]);

  return (
    <Card>
      <CardContent className="p-4">
        {/* رؤوس الأيام */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS_SHORT.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-semibold py-2 rounded",
                i === 5 ? "text-amber-600" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        {/* خلايا الأيام */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            if (!cell.date) return <div key={i} />;
            const key = toISODate(cell.date);
            const appts = appointmentsByDay[key] ?? [];
            const isToday = isSameDay(cell.date, today);
            const isSelected = isSameDay(cell.date, selectedDate);
            return (
              <button
                key={i}
                onClick={() => onDayClick(cell.date!)}
                className={cn(
                  "aspect-square min-h-16 p-1.5 rounded-lg border text-right transition-all hover:shadow-md flex flex-col",
                  !cell.isCurrentMonth && "opacity-40",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                  isToday && "ring-2 ring-primary ring-offset-1"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {cell.date.getDate()}
                </span>
                {appts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5 overflow-hidden">
                    {appts.slice(0, 3).map((a) => {
                      const conf = getEventTypeConfig(a.eventType);
                      return (
                        <span
                          key={a.id}
                          className={cn("w-1.5 h-1.5 rounded-full", conf.color)}
                          title={a.title}
                        />
                      );
                    })}
                    {appts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{appts.length - 3}
                      </span>
                    )}
                  </div>
                )}
                {appts.length > 0 && (
                  <span className="mt-auto text-[10px] text-muted-foreground truncate">
                    {appts[0].title}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* مفتاح الألوان */}
        <div className="mt-4 flex items-center gap-3 flex-wrap text-xs">
          {EVENT_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", t.color)} />
              <span className="text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// العرض الأسبوعي
// ============================================================

function WeekView({
  appointments,
  onAptClick,
  selectedDate,
}: {
  appointments: AppointmentItem[];
  onAptClick: (id: string) => void;
  selectedDate: Date;
}) {
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState
            icon={CalendarRange}
            title="لا توجد مواعيد هذا الأسبوع"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {days.map((day) => {
            const dayApts = appointments
              .filter((a) => isSameDay(new Date(a.startDate), day))
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
              );
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-lg border p-3",
                  isToday ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0",
                      isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <span className="text-xs">{WEEKDAYS_SHORT[day.getDay()]}</span>
                    <span className="font-bold text-sm">{day.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{formatDate(day)}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayApts.length === 0
                        ? "لا مواعيد"
                        : `${dayApts.length} موعد`}
                    </p>
                  </div>
                </div>
                {dayApts.length > 0 && (
                  <div className="space-y-2 pr-12">
                    {dayApts.map((a) => (
                      <AppointmentListItem
                        key={a.id}
                        apt={a}
                        onClick={() => onAptClick(a.id)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// العرض اليومي
// ============================================================

function DayView({
  appointments,
  onAptClick,
  date,
}: {
  appointments: AppointmentItem[];
  onAptClick: (id: string) => void;
  date: Date;
}) {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState
            icon={CalendarIcon}
            title="لا توجد مواعيد في هذا اليوم"
            description={formatDate(date)}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {appointments.map((a) => (
            <AppointmentListItem
              key={a.id}
              apt={a}
              onClick={() => onAptClick(a.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// العرض كقائمة
// ============================================================

function ListView({
  appointments,
  onAptClick,
}: {
  appointments: AppointmentItem[];
  onAptClick: (id: string) => void;
}) {
  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [appointments]
  );
  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState icon={ListIcon} title="لا توجد مواعيد" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-2 p-4">
            {sorted.map((a) => (
              <AppointmentListItem
                key={a.id}
                apt={a}
                onClick={() => onAptClick(a.id)}
                showDate
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================================
// عنصر قائمة موعد
// ============================================================

function AppointmentListItem({
  apt,
  onClick,
  compact = false,
  showDate = false,
}: {
  apt: AppointmentItem;
  onClick: () => void;
  compact?: boolean;
  showDate?: boolean;
}) {
  const conf = getEventTypeConfig(apt.eventType);
  const startDate = new Date(apt.startDate);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in flex items-start gap-3"
    >
      <div className={cn("p-2 rounded-lg flex-shrink-0", conf.color)}>
        <EventTypeIcon type={apt.eventType} className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm">{apt.title}</p>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {conf.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {apt.allDay
              ? "طوال اليوم"
              : formatTime(startDate)}
          </span>
          {showDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(startDate)}
            </span>
          )}
          {apt.location && !compact && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {apt.location}
            </span>
          )}
          {apt.case && !compact && (
            <span className="flex items-center gap-1 text-primary truncate">
              <Briefcase className="w-3 h-3" />
              {apt.case.internalNumber}
            </span>
          )}
          {apt.client && !compact && (
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3" />
              {apt.client.fullName}
            </span>
          )}
        </div>
      </div>
      <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </div>
  );
}

// ============================================================
// نافذة إنشاء موعد
// ============================================================

interface CreateAptFormData {
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string;
  court: string;
  caseId: string;
  clientId: string;
  reminder: string;
}

function CreateAppointmentDialog({
  open,
  onOpenChange,
  cases,
  clients,
  defaultDate,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cases: CaseLite[];
  clients: ClientLite[];
  defaultDate: Date;
  onCreated: (id: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateAptFormData>({
    title: "",
    description: "",
    eventType: "client_meeting",
    startDate: toISODateTime(defaultDate),
    endDate: "",
    allDay: false,
    location: "",
    court: "",
    caseId: "",
    clientId: "",
    reminder: "30",
  });

  // إعادة تعيين التاريخ الافتراضي عند فتح النافذة
  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        startDate: toISODateTime(defaultDate),
      }));
    }
  }, [open, defaultDate]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateAptFormData) => {
      const conf = getEventTypeConfig(data.eventType);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          startDate: data.startDate,
          endDate: data.endDate || null,
          allDay: data.allDay,
          eventType: data.eventType,
          location: data.location || null,
          court: data.court || null,
          caseId: data.caseId || null,
          clientId: data.clientId || null,
          reminder: data.reminder ? Number(data.reminder) : null,
          color: conf.color,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "تم إنشاء الموعد", description: form.title });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        onCreated(data.appointment.id);
        setForm({
          title: "",
          description: "",
          eventType: "client_meeting",
          startDate: toISODateTime(defaultDate),
          endDate: "",
          allDay: false,
          location: "",
          court: "",
          caseId: "",
          clientId: "",
          reminder: "30",
        });
      } else {
        toast({
          title: "فشل الإنشاء",
          description: data.error ?? "خطأ غير معروف",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({ title: "خطأ", description: "تعذّر إنشاء الموعد", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.title) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    if (!form.startDate) {
      toast({ title: "التاريخ والوقت مطلوبان", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  }

  const eventConf = getEventTypeConfig(form.eventType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            موعد جديد
          </DialogTitle>
          <DialogDescription>
            أدخل تفاصيل الموعد. سيظهر في التقويم فور حفظه.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 pb-2">
            <div className="space-y-1.5">
              <Label>
                عنوان الموعد <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: جلسة محكمة - قضية أحمد"
              />
            </div>

            <div className="space-y-1.5">
              <Label>نوع الموعد</Label>
              <Select
                value={form.eventType}
                onValueChange={(v) => setForm({ ...form, eventType: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full inline-block", t.color)} />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                اللون:{" "}
                <span className={cn("inline-block w-2 h-2 rounded-full align-middle", eventConf.color)} />{" "}
                {eventConf.label}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="تفاصيل الموعد..."
                className="min-h-16"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Switch
                checked={form.allDay}
                onCheckedChange={(c) => setForm({ ...form, allDay: c })}
                id="all-day"
              />
              <Label htmlFor="all-day" className="cursor-pointer">
                طوال اليوم
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  {form.allDay ? "تاريخ البداية" : "تاريخ ووقت البداية"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.allDay ? form.startDate.slice(0, 10) : form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{form.allDay ? "تاريخ النهاية" : "تاريخ ووقت النهاية"}</Label>
                <Input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.allDay ? form.endDate.slice(0, 10) : form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الموقع</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="مثال: قاعة الجلسات - محكمة شمال"
                />
              </div>
              <div className="space-y-1.5">
                <Label>المحكمة</Label>
                <Input
                  value={form.court}
                  onChange={(e) => setForm({ ...form, court: e.target.value })}
                  placeholder="مثال: محكمة شمال القاهرة"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>القضية المرتبطة</Label>
                <Select
                  value={form.caseId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, caseId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.internalNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموكل المرتبط</Label>
                <Select
                  value={form.clientId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, clientId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>تذكير قبل</Label>
              <Select
                value={form.reminder}
                onValueChange={(v) => setForm({ ...form, reminder: v })}
              >
                <SelectTrigger className="w-full">
                  <Bell className="w-3.5 h-3.5 ml-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">بدون تذكير</SelectItem>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة</SelectItem>
                  <SelectItem value="120">ساعتين</SelectItem>
                  <SelectItem value="1440">يوم</SelectItem>
                  <SelectItem value="2880">يومين</SelectItem>
                  <SelectItem value="10080">أسبوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
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
                حفظ الموعد
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل الموعد
// ============================================================

function AppointmentDetailSheet({
  aptId,
  open,
  onClose,
  onDelete,
  cases,
  clients,
  appointments,
}: {
  aptId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  cases: CaseLite[];
  clients: ClientLite[];
  appointments: AppointmentItem[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    eventType: string;
    startDate: string;
    endDate: string;
    allDay: boolean;
    location: string;
    court: string;
    caseId: string;
    clientId: string;
    reminder: string;
    status: string;
  }>({
    title: "",
    description: "",
    eventType: "other",
    startDate: "",
    endDate: "",
    allDay: false,
    location: "",
    court: "",
    caseId: "",
    clientId: "",
    reminder: "0",
    status: "scheduled",
  });

  const apt: AppointmentItem | undefined = appointments.find(
    (a) => a.id === aptId
  );

  // مزامنة باستخدام useEffect
  useEffect(() => {
    if (apt && !editing) {
      setEditForm({
        title: apt.title,
        description: apt.description ?? "",
        eventType: apt.eventType,
        startDate: apt.allDay
          ? apt.startDate.slice(0, 10)
          : toISODateTime(new Date(apt.startDate)),
        endDate: apt.endDate
          ? apt.allDay
            ? apt.endDate.slice(0, 10)
            : toISODateTime(new Date(apt.endDate))
          : "",
        allDay: apt.allDay,
        location: apt.location ?? "",
        court: apt.court ?? "",
        caseId: apt.caseId ?? "",
        clientId: apt.clientId ?? "",
        reminder: apt.reminder ? String(apt.reminder) : "0",
        status: apt.status,
      });
    }
  }, [apt, editing]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم تحديث الموعد" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم تحديث الحالة" });
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  function handleSave() {
    const conf = getEventTypeConfig(editForm.eventType);
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      startDate: editForm.startDate,
      endDate: editForm.endDate || null,
      allDay: editForm.allDay,
      eventType: editForm.eventType,
      location: editForm.location || null,
      court: editForm.court || null,
      caseId: editForm.caseId || null,
      clientId: editForm.clientId || null,
      reminder: editForm.reminder ? Number(editForm.reminder) : null,
      color: conf.color,
      status: editForm.status,
    });
  }

  if (!open || !aptId || !apt) {
    if (open && !apt) {
      return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
          <SheetContent side="left" className="w-full sm:max-w-2xl p-0">
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      );
    }
    return null;
  }

  const conf = getEventTypeConfig(apt.eventType);
  const startDate = new Date(apt.startDate);
  const endDate = apt.endDate ? new Date(apt.endDate) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", conf.color)}>
                  <EventTypeIcon type={apt.eventType} className="w-5 h-5 text-white" />
                </div>
                {apt.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="outline" className="text-xs">
                  {conf.label}
                </Badge>
                <Badge
                  variant={apt.status === "completed" ? "default" : apt.status === "cancelled" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {apt.status === "completed"
                    ? "مكتمل"
                    : apt.status === "cancelled"
                    ? "ملغي"
                    : "مجدول"}
                </Badge>
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(!editing)}
                title={editing ? "إلغاء التعديل" : "تعديل"}
              >
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
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
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* أزرار الحالة السريعة */}
            {!editing && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">تغيير الحالة:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={apt.status === "scheduled" ? "default" : "outline"}
                      onClick={() => statusMutation.mutate("scheduled")}
                    >
                      مجدول
                    </Button>
                    <Button
                      size="sm"
                      variant={apt.status === "completed" ? "default" : "outline"}
                      onClick={() => statusMutation.mutate("completed")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                      مكتمل
                    </Button>
                    <Button
                      size="sm"
                      variant={apt.status === "cancelled" ? "destructive" : "outline"}
                      onClick={() => statusMutation.mutate("cancelled")}
                    >
                      <XCircle className="w-3.5 h-3.5 ml-1" />
                      ملغي
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* البيانات */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  تفاصيل الموعد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>العنوان</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>النوع</Label>
                      <Select
                        value={editForm.eventType}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, eventType: v })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>الوصف</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        className="min-h-16"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Switch
                        checked={editForm.allDay}
                        onCheckedChange={(c) =>
                          setEditForm({ ...editForm, allDay: c })
                        }
                        id="edit-all-day"
                      />
                      <Label htmlFor="edit-all-day">طوال اليوم</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>البداية</Label>
                        <Input
                          type={editForm.allDay ? "date" : "datetime-local"}
                          value={editForm.startDate}
                          onChange={(e) =>
                            setEditForm({ ...editForm, startDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>النهاية</Label>
                        <Input
                          type={editForm.allDay ? "date" : "datetime-local"}
                          value={editForm.endDate}
                          onChange={(e) =>
                            setEditForm({ ...editForm, endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>الموقع</Label>
                        <Input
                          value={editForm.location}
                          onChange={(e) =>
                            setEditForm({ ...editForm, location: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>المحكمة</Label>
                        <Input
                          value={editForm.court}
                          onChange={(e) =>
                            setEditForm({ ...editForm, court: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>القضية</Label>
                        <Select
                          value={editForm.caseId || "none"}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              caseId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون</SelectItem>
                            {cases.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.internalNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>الموكل</Label>
                        <Select
                          value={editForm.clientId || "none"}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              clientId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون</SelectItem>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>تذكير قبل</Label>
                      <Select
                        value={editForm.reminder}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, reminder: v })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">بدون تذكير</SelectItem>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة</SelectItem>
                          <SelectItem value="120">ساعتين</SelectItem>
                          <SelectItem value="1440">يوم</SelectItem>
                          <SelectItem value="2880">يومين</SelectItem>
                          <SelectItem value="10080">أسبوع</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {apt.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {apt.description}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow
                        icon={Clock}
                        label="البداية"
                        value={apt.allDay ? formatDate(startDate) : formatDate(startDate, true)}
                      />
                      {endDate && (
                        <DetailRow
                          icon={Timer}
                          label="النهاية"
                          value={apt.allDay ? formatDate(endDate) : formatDate(endDate, true)}
                        />
                      )}
                    </div>
                    {apt.location && (
                      <DetailRow
                        icon={MapPin}
                        label="الموقع"
                        value={apt.location}
                      />
                    )}
                    {apt.court && (
                      <DetailRow
                        icon={Gavel}
                        label="المحكمة"
                        value={apt.court}
                      />
                    )}
                    {apt.reminder && apt.reminder > 0 && (
                      <DetailRow
                        icon={Bell}
                        label="تذكير"
                        value={
                          apt.reminder >= 1440
                            ? `${apt.reminder / 1440} يوم`
                            : apt.reminder >= 60
                            ? `${apt.reminder / 60} ساعة`
                            : `${apt.reminder} دقيقة`
                        }
                      />
                    )}
                    {apt.case && (
                      <DetailRow
                        icon={Briefcase}
                        label="القضية"
                        value={apt.case.internalNumber}
                      />
                    )}
                    {apt.client && (
                      <DetailRow
                        icon={User}
                        label="الموكل"
                        value={apt.client.fullName}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* تأكيد الحذف */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف الموعد</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف &quot;{apt.title}&quot;؟ لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (aptId) onDelete(aptId);
                  setConfirmDelete(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

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
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-1 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// حاسبة المواعيد القانونية
// ============================================================

interface Holiday {
  date: string; // YYYY-MM-DD
  label: string;
}

// عطلات رسمية تقديرية (يمكن للمستخدم تعديلها)
const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: "2025-01-01", label: "رأس السنة الميلادية" },
  { date: "2025-01-07", label: "عيد الميلاد المجيد (تقويم شرقي)" },
  { date: "2025-01-25", label: "عيد الشرطة" },
  { date: "2025-04-25", label: "عيد تحرير سيناء" },
  { date: "2025-05-01", label: "عيد العمال" },
  { date: "2025-06-30", label: "عيد الثورة" },
  { date: "2025-07-23", label: "عيد الثورة (23 يوليو)" },
  { date: "2025-10-06", label: "عيد القوات المسلحة" },
];

function LegalDeadlineCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(
    toISODate(new Date())
  );
  const [days, setDays] = useState<string>("15");
  const [excludeFridays, setExcludeFridays] = useState(true);
  const [excludeSaturdays, setExcludeSaturdays] = useState(false);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayLabel, setNewHolidayLabel] = useState("");
  const [result, setResult] = useState<{
    endDate: Date;
    skippedFridays: number;
    skippedSaturdays: number;
    skippedHolidays: number;
    totalCalendarDays: number;
    businessDays: number;
    breakdown: { date: Date; type: "work" | "friday" | "saturday" | "holiday"; label: string }[];
  } | null>(null);

  const calculate = useCallback(() => {
    if (!startDate || !days) {
      toast({ title: "أدخل التاريخ وعدد الأيام", variant: "destructive" });
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const targetDays = parseInt(days, 10);
    if (isNaN(targetDays) || targetDays < 0) {
      toast({ title: "عدد الأيام غير صحيح", variant: "destructive" });
      return;
    }

    let count = 0;
    let skippedFridays = 0;
    let skippedSaturdays = 0;
    let skippedHolidays = 0;
    const breakdown: { date: Date; type: "work" | "friday" | "saturday" | "holiday"; label: string }[] = [];

    const isHoliday = (d: Date) => {
      const key = toISODate(d);
      return holidays.find((h) => h.date === key);
    };

    let cursor = new Date(start);
    // يوم البداية نفسه يُحتسب كأول يوم
    while (count < targetDays) {
      const dayOfWeek = cursor.getDay();
      const holiday = isHoliday(cursor);
      let skipped = false;
      let label = "";
      if (holiday && excludeHolidays) {
        skippedHolidays++;
        skipped = true;
        label = `عطلة: ${holiday.label}`;
        breakdown.push({ date: new Date(cursor), type: "holiday", label });
      } else if (dayOfWeek === 5 && excludeFridays) {
        skippedFridays++;
        skipped = true;
        label = "جمعة";
        breakdown.push({ date: new Date(cursor), type: "friday", label });
      } else if (dayOfWeek === 6 && excludeSaturdays) {
        skippedSaturdays++;
        skipped = true;
        label = "سبت";
        breakdown.push({ date: new Date(cursor), type: "saturday", label });
      }
      if (!skipped) {
        count++;
        breakdown.push({ date: new Date(cursor), type: "work", label: `يوم عمل ${count}` });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    // الموعد النهائي = آخر يوم عمل محسوب
    const endDate = new Date(cursor);
    endDate.setDate(endDate.getDate() - 1);

    setResult({
      endDate,
      skippedFridays,
      skippedSaturdays,
      skippedHolidays,
      totalCalendarDays: breakdown.length,
      businessDays: targetDays,
      breakdown,
    });
  }, [startDate, days, excludeFridays, excludeSaturdays, excludeHolidays, holidays, toast]);

  function addHoliday() {
    if (!newHolidayDate || !newHolidayLabel) {
      toast({ title: "أدخل تاريخ العطلة واسمها", variant: "destructive" });
      return;
    }
    if (holidays.find((h) => h.date === newHolidayDate)) {
      toast({ title: "تاريخ العطلة موجود مسبقاً", variant: "destructive" });
      return;
    }
    setHolidays([...holidays, { date: newHolidayDate, label: newHolidayLabel }]);
    setNewHolidayDate("");
    setNewHolidayLabel("");
    toast({ title: "تمت إضافة العطلة" });
  }

  function removeHoliday(date: string) {
    setHolidays(holidays.filter((h) => h.date !== date));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            حاسبة المواعيد القانونية
          </DialogTitle>
          <DialogDescription>
            احسب الموعد النهائي القانوني بناءً على تاريخ الواقعة وعدد الأيام، مع
            استثناء العطلات (الجمعة، السبت، الأعياد).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* المدخلات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>تاريخ الواقعة / البداية</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>عدد الأيام (أيام عمل)</Label>
                <Input
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
            </div>

            {/* الخيارات */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">استثناء العطلات:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={excludeFridays}
                      onCheckedChange={setExcludeFridays}
                      id="ex-fri"
                    />
                    <Label htmlFor="ex-fri">استثناء الجمعة</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={excludeSaturdays}
                      onCheckedChange={setExcludeSaturdays}
                      id="ex-sat"
                    />
                    <Label htmlFor="ex-sat">استثناء السبت</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={excludeHolidays}
                      onCheckedChange={setExcludeHolidays}
                      id="ex-hol"
                    />
                    <Label htmlFor="ex-hol">استثناء الأعياد الرسمية</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إدارة الأعياد */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-primary" />
                  الأعياد الرسمية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
                  <Input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    placeholder="التاريخ"
                  />
                  <Input
                    value={newHolidayLabel}
                    onChange={(e) => setNewHolidayLabel(e.target.value)}
                    placeholder="اسم العطلة"
                  />
                  <Button size="sm" onClick={addHoliday}>
                    <Plus className="w-3.5 h-3.5 ml-1" />
                    إضافة
                  </Button>
                </div>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {holidays.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        لا توجد أعياد مضافة
                      </p>
                    ) : (
                      holidays
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((h) => (
                          <div
                            key={h.date}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <PartyPopper className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(h.date)}
                              </span>
                              <span className="font-medium">{h.label}</span>
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => removeHoliday(h.date)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Button onClick={calculate} className="w-full" size="lg">
              <Calculator className="w-4 h-4 ml-2" />
              احسب الموعد النهائي
            </Button>

            {/* النتيجة */}
            {result && (
              <Card className="border-primary/40 bg-primary/5 animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    النتيجة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-4 bg-card rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">
                      الموعد النهائي القانوني
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatDate(result.endDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({WEEKDAYS_AR[result.endDate.getDay()]})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Stat
                      icon={CalendarDays}
                      label="أيام العمل"
                      value={result.businessDays}
                      color="text-primary"
                    />
                    <Stat
                      icon={CalendarRange}
                      label="أيام التقويم"
                      value={result.totalCalendarDays}
                      color="text-slate-600"
                    />
                    <Stat
                      icon={XCircle}
                      label="الجمعة"
                      value={result.skippedFridays}
                      color="text-amber-600"
                    />
                    <Stat
                      icon={XCircle}
                      label="السبت"
                      value={result.skippedSaturdays}
                      color="text-amber-600"
                    />
                  </div>
                  {result.skippedHolidays > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
                      <PartyPopper className="w-3.5 h-3.5" />
                      تم استثناء {result.skippedHolidays} عطلة رسمية
                    </div>
                  )}
                  {/* تفصيل الأيام */}
                  <div>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground mb-2">
                      تفصيل الأيام:
                    </p>
                    <ScrollArea className="max-h-48 rounded border">
                      <div className="p-2 space-y-1">
                        {result.breakdown.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded"
                          >
                            <span className="text-muted-foreground">
                              {formatDate(b.date)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                b.type === "work" && "text-emerald-600 bg-emerald-50 border-emerald-200",
                                b.type === "friday" && "text-amber-600 bg-amber-50 border-amber-200",
                                b.type === "saturday" && "text-amber-600 bg-amber-50 border-amber-200",
                                b.type === "holiday" && "text-rose-600 bg-rose-50 border-rose-200"
                              )}
                            >
                              {b.label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center p-2 rounded-md bg-card border">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
