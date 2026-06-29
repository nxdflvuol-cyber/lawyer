"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  CheckSquare,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
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
} from "recharts";
import { useNavStore } from "@/lib/stores";
import { formatCurrency, formatDate, getCaseTypeLabel, getCaseStatusLabel } from "@/lib/constants";
import { useMemo } from "react";

export function DashboardSection() {
  const setSection = useNavStore((s) => s.setSection);
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const stats = data?.stats;

  const caseTypeChartData = useMemo(() => {
    if (!stats?.caseTypeStats) return [];
    return stats.caseTypeStats.map((s: { type: string; count: number }) => ({
      name: getCaseTypeLabel(s.type),
      value: s.count,
    }));
  }, [stats]);

  const caseStatusChartData = useMemo(() => {
    if (!stats?.caseStatusStats) return [];
    return stats.caseStatusStats.map((s: { status: string; count: number }) => ({
      name: getCaseStatusLabel(s.status),
      value: s.count,
    }));
  }, [stats]);

  const PIE_COLORS = ["#0d9488", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];

  const statCards = [
    {
      title: "القضايا النشطة",
      value: stats?.activeCases ?? 0,
      total: stats?.cases ?? 0,
      icon: Briefcase,
      color: "text-emerald-600 bg-emerald-50",
      onClick: () => setSection("cases"),
    },
    {
      title: "الموكلون",
      value: stats?.clients ?? 0,
      icon: Users,
      color: "text-amber-600 bg-amber-50",
      onClick: () => setSection("clients"),
    },
    {
      title: "المهام المعلقة",
      value: stats?.tasks ?? 0,
      sub: `${stats?.overdueTasks ?? 0} متأخرة`,
      icon: CheckSquare,
      color: "text-blue-600 bg-blue-50",
      onClick: () => setSection("tasks"),
    },
    {
      title: "مواعيد اليوم",
      value: stats?.appointmentsToday ?? 0,
      icon: Calendar,
      color: "text-purple-600 bg-purple-50",
      onClick: () => setSection("appointments"),
    },
    {
      title: "صافي الدخل",
      value: formatCurrency(stats?.netIncome ?? 0),
      icon: DollarSign,
      color: "text-emerald-700 bg-emerald-100",
      onClick: () => setSection("finance"),
    },
    {
      title: "المستندات",
      value: stats?.documents ?? 0,
      icon: FileText,
      color: "text-slate-600 bg-slate-50",
      onClick: () => setSection("documents"),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            مرحباً بك في لوحة التحكم
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على نشاط مكتبك القانوني
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setSection("ai-thinker")} variant="default">
            <Activity className="w-4 h-4 ml-2" />
            المفكر القانوني
          </Button>
          <Button onClick={() => setSection("cases")} variant="outline">
            <Briefcase className="w-4 h-4 ml-2" />
            قضية جديدة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              className="stat-card cursor-pointer hover:shadow-md transition-shadow"
              onClick={card.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                  {card.sub && (
                    <p className="text-xs text-destructive mt-1">{card.sub}</p>
                  )}
                  {card.total !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      من {card.total} إجمالاً
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">معدل النجاح</span>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats?.successRate ?? 0}%</div>
            <Progress value={stats?.successRate ?? 0} className="mt-2 h-1.5" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{stats?.wonCases ?? 0} كسب</span>
              <span>{stats?.settledCases ?? 0} تسوية</span>
              <span>{stats?.lostCases ?? 0} خسارة</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">إجمالي الدخل</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats?.totalIncome ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">إجمالي المدفوعات المستلمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">إجمالي المصروفات</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats?.totalExpenses ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">مصروفات تشغيل المكتب</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">أتعاب معلقة</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats?.pendingFees ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">أتعاب غير محصلة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع القضايا حسب النوع</CardTitle>
            <CardDescription>إحصائيات القضايا حسب التصنيف</CardDescription>
          </CardHeader>
          <CardContent>
            {caseTypeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={caseTypeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "var(--font-cairo)",
                      borderRadius: "8px",
                      border: "1px solid oklch(0.9 0 0)",
                    }}
                  />
                  <Bar dataKey="value" fill="oklch(0.55 0.13 165)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حالات القضايا</CardTitle>
            <CardDescription>توزيع القضايا حسب الحالة</CardDescription>
          </CardHeader>
          <CardContent>
            {caseStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={caseStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: { name?: string; value?: number }) => `${entry.name ?? ""}: ${entry.value ?? 0}`}
                  >
                    {caseStatusChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      direction: "rtl",
                      fontFamily: "var(--font-cairo)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-cairo)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">المواعيد القادمة</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSection("appointments")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {stats?.upcomingAppointments?.length > 0 ? (
                <div className="space-y-2 p-3">
                  {stats.upcomingAppointments.map((apt: Record<string, unknown>) => (
                    <div
                      key={apt.id as string}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => setSection("appointments")}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {new Date(apt.startDate as string).getDate()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(apt.startDate as string).toLocaleDateString("ar-EG", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{apt.title as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.startDate as string).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          {apt.location ? ` • ${apt.location}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyList text="لا توجد مواعيد قادمة" />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">المهام العاجلة</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSection("tasks")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {stats?.recentTasks?.length > 0 ? (
                <div className="space-y-2 p-3">
                  {stats.recentTasks.map((task: Record<string, unknown>) => {
                    const due = task.dueDate ? new Date(task.dueDate as string) : null;
                    const overdue = due && due < new Date();
                    return (
                      <div
                        key={task.id as string}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => setSection("tasks")}
                      >
                        <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${overdue ? "text-destructive" : "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title as string}</p>
                          {due && (
                            <p className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                              {overdue ? "متأخرة: " : "موعد: "}
                              {formatDate(due)}
                            </p>
                          )}
                        </div>
                        <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"} className="text-xs">
                          {task.priority === "urgent" ? "عاجل" : task.priority === "high" ? "مرتفع" : "متوسط"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyList text="لا توجد مهام عاجلة" />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">أحدث القضايا</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSection("cases")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {stats?.recentCases?.length > 0 ? (
                <div className="space-y-2 p-3">
                  {stats.recentCases.map((c: Record<string, unknown>) => (
                    <div
                      key={c.id as string}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => setSection("cases")}
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.internalNumber as string}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(c.client as { fullName?: string })?.fullName ?? "—"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getCaseTypeLabel(c.caseType as string)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyList text="لا توجد قضايا بعد" />
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">اختصارات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "قضية جديدة", icon: Briefcase, section: "cases" as const },
              { label: "موكل جديد", icon: Users, section: "clients" as const },
              { label: "مهمة جديدة", icon: CheckSquare, section: "tasks" as const },
              { label: "استشارة AI", icon: Activity, section: "ai-thinker" as const },
            ].map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Button
                  key={shortcut.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => setSection(shortcut.section)}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{shortcut.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
      لا توجد بيانات لعرضها
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
