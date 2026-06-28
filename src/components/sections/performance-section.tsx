"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  Target,
  Calendar,
  Activity,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency, getCaseTypeLabel } from "@/lib/constants";

export function PerformanceSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["performance-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
  });

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // بيانات أداء تجريبية مبنية على الإحصائيات
  const monthlyData = [
    { month: "يناير", cases: 4, income: 25000 },
    { month: "فبراير", cases: 6, income: 38000 },
    { month: "مارس", cases: 5, income: 32000 },
    { month: "أبريل", cases: 8, income: 52000 },
    { month: "مايو", cases: 7, income: 45000 },
    { month: "يونيو", cases: 9, income: 61000 },
  ];

  const radarData = [
    { metric: "نجاح القضايا", value: stats?.successRate ?? 0 },
    { metric: "رضا الموكلين", value: 85 },
    { metric: "كفاءة الوقت", value: 72 },
    { metric: "الإيرادات", value: 78 },
    { metric: "الإنتاجية", value: 88 },
    { metric: "التطوير المهني", value: 65 },
  ];

  const performanceMetrics = [
    {
      title: "معدل النجاح",
      value: `${stats?.successRate ?? 0}%`,
      icon: Award,
      color: "text-emerald-600 bg-emerald-50",
      progress: stats?.successRate ?? 0,
      description: `${stats?.wonCases ?? 0} كسب من ${(stats?.wonCases ?? 0) + (stats?.lostCases ?? 0)} قضية`,
    },
    {
      title: "إجمالي القضايا",
      value: stats?.cases ?? 0,
      icon: Briefcase,
      color: "text-amber-600 bg-amber-50",
      progress: 100,
      description: `${stats?.activeCases ?? 0} نشطة حالياً`
    },
    {
      title: "متوسط الدخل/قضية",
      value: formatCurrency((stats?.cases ?? 0) > 0 ? Math.round((stats?.totalIncome ?? 0) / (stats?.cases ?? 1)) : 0),
      icon: TrendingUp,
      color: "text-emerald-700 bg-emerald-100",
      progress: 75,
      description: "متوسط الإيراد للقضية"
    },
    {
      title: "كفاءة الإنجاز",
      value: "82%",
      icon: Activity,
      color: "text-purple-600 bg-purple-50",
      progress: 82,
      description: "نسبة المهام المكتملة في الوقت"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          لوحة تحليل الأداء
        </h1>
        <p className="text-muted-foreground mt-2">
          مؤشرات الأداء الرئيسية والتحليلات المتقدمة
        </p>
      </div>

      {/* المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm font-medium text-foreground mt-1">{metric.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                <Progress value={metric.progress} className="mt-2 h-1" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الأداء الشهري</CardTitle>
            <CardDescription>عدد القضايا والدخل عبر الأشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    direction: "rtl",
                    fontFamily: "var(--font-cairo)",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: "var(--font-cairo)", fontSize: 12 }} />
                <Line type="monotone" dataKey="cases" stroke="oklch(0.55 0.13 165)" strokeWidth={2} name="القضايا" />
                <Line type="monotone" dataKey="income" stroke="oklch(0.7 0.15 85)" strokeWidth={2} name="الدخل" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">مؤشرات الكفاءة المتعددة</CardTitle>
            <CardDescription>تحليل شامل للأداء عبر المجالات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.9 0 0)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: "var(--font-cairo)" }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar
                  name="الأداء"
                  dataKey="value"
                  stroke="oklch(0.55 0.13 165)"
                  fill="oklch(0.55 0.13 165)"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    direction: "rtl",
                    fontFamily: "var(--font-cairo)",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* توزيع القضايا */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">توزيع القضايا حسب النوع</CardTitle>
          <CardDescription>تحليل عبء العمل حسب تصنيف القضايا</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.caseTypeStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.caseTypeStats.map((s: { type: string; count: number }) => ({ name: getCaseTypeLabel(s.type), count: s.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    direction: "rtl",
                    fontFamily: "var(--font-cairo)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.7 0.15 85)" radius={[8, 8, 0, 0]} name="عدد القضايا" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              لا توجد بيانات
            </div>
          )}
        </CardContent>
      </Card>

      {/* أهداف مهنية */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            الأهداف المهنية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">هدف القضايا السنوي</span>
                <span className="font-medium">75 / 100</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">هدف الدخل السنوي</span>
                <span className="font-medium">62%</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ساعات التطوير المهني</span>
                <span className="font-medium">48 / 80 ساعة</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
