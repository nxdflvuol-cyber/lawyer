"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Target,
  BookOpen,
  Award,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  Clock,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  category: string;
}

interface ReadingItem {
  id: string;
  title: string;
  author?: string;
  status: "todo" | "reading" | "done";
  notes?: string;
}

const INITIAL_GOALS: Goal[] = [
  { id: "1", title: "إتقان قانون التجارة الإلكترونية", description: "دراسة شاملة للقانون الجديد", progress: 45, target: 100, category: "تخصص" },
  { id: "2", title: "تطوير مهارات المرافعة الجنائية", description: "حضور 5 دورات تدريبية", progress: 60, target: 100, category: "مهارات" },
  { id: "3", title: "إتقان اللغة الإنجليزية القانونية", description: "للتعامل مع القضايا الدولية", progress: 30, target: 100, category: "لغات" },
];

const INITIAL_READINGS: ReadingItem[] = [
  { id: "1", title: "الوسيط في قانون العقوبات", author: "د. أحمد فتحي سرور", status: "reading" },
  { id: "2", title: "أحكام النقض المدني", status: "todo" },
  { id: "3", title: "مبادئ القانون الإداري", author: "د. سليمان الطماوي", status: "done" },
];

function loadInitial(): { goals: Goal[]; readings: ReadingItem[] } {
  if (typeof window === "undefined") return { goals: INITIAL_GOALS, readings: INITIAL_READINGS };
  const saved = localStorage.getItem("shamel-development");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      return { goals: data.goals ?? INITIAL_GOALS, readings: data.readings ?? INITIAL_READINGS };
    } catch {
      return { goals: INITIAL_GOALS, readings: INITIAL_READINGS };
    }
  }
  return { goals: INITIAL_GOALS, readings: INITIAL_READINGS };
}

export function DevelopmentSection() {
  const { toast } = useToast();
  const [init] = useState(loadInitial);
  const [goals, setGoals] = useState<Goal[]>(init.goals);
  const [readings, setReadings] = useState<ReadingItem[]>(init.readings);
  const [newGoal, setNewGoal] = useState("");
  const [newReading, setNewReading] = useState("");
  const [activeTab, setActiveTab] = useState<"goals" | "readings" | "achievements">("goals");

  useEffect(() => {
    localStorage.setItem("shamel-development", JSON.stringify({ goals, readings }));
  }, [goals, readings]);

  function addGoal() {
    if (!newGoal.trim()) return;
    setGoals((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        title: newGoal,
        description: "",
        progress: 0,
        target: 100,
        category: "تخصص",
      },
    ]);
    setNewGoal("");
    toast({ title: "تم إضافة الهدف" });
  }

  function updateGoalProgress(id: string, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, progress } : g)));
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function addReading() {
    if (!newReading.trim()) return;
    setReadings((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), title: newReading, status: "todo" },
    ]);
    setNewReading("");
    toast({ title: "تم إضافة الكتاب" });
  }

  function updateReadingStatus(id: string, status: ReadingItem["status"]) {
    setReadings((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const achievements = [
    { title: "أول قضية مكتسبة", date: "2024", icon: Trophy },
    { title: "إتمام 50 قضية", date: "2024", icon: Award },
    { title: "شهادة دورة المرافعة المتقدمة", date: "2024", icon: GraduationCap },
    { title: "عضوية نادي المحامين", date: "2023", icon: CheckCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          التطوير المهني
        </h1>
        <p className="text-muted-foreground mt-2">
          أدوات التطوير المهني والشخصي، متابعة الأهداف والإنجازات
        </p>
      </div>

      {/* تبويبات */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "goals", label: "الأهداف المهنية", icon: Target },
          { id: "readings", label: "قائمة القراءات", icon: BookOpen },
          { id: "achievements", label: "الإنجازات", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* الأهداف */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إضافة هدف جديد</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="مثلاً: إتقان قانون العمل الجديد"
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
              />
              <Button onClick={addGoal}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>التقدم</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                      className="flex-1 h-1"
                    />
                    <Badge variant={goal.progress === 100 ? "default" : "secondary"}>
                      {goal.progress === 100 ? "مكتمل" : "جارٍ"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* القراءات */}
      {activeTab === "readings" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إضافة كتاب للقراءة</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
                placeholder="عنوان الكتاب..."
                onKeyDown={(e) => e.key === "Enter" && addReading()}
              />
              <Button onClick={addReading}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">قائمة القراءات</CardTitle>
              <CardDescription>{readings.length} عنصر في القائمة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {readings.map((reading) => (
                <div
                  key={reading.id}
                  className="group flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/30"
                >
                  <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reading.title}</p>
                    {reading.author && (
                      <p className="text-xs text-muted-foreground">{reading.author}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(["todo", "reading", "done"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateReadingStatus(reading.id, status)}
                        className={`text-xs px-2 py-1 rounded ${
                          reading.status === status
                            ? status === "done"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "reading"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {status === "todo" ? "للقراءة" : status === "reading" ? "أقرأه" : "مكتمل"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setReadings((prev) => prev.filter((r) => r.id !== reading.id))}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* الإنجازات */}
      {activeTab === "achievements" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                سجل الإنجازات المهنية
              </CardTitle>
              <CardDescription>توثيق النجاحات والتقديرات المهنية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map((ach, i) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ach.title}</p>
                        <p className="text-xs text-muted-foreground">{ach.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                توصيات التطوير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "حضور مؤتمر المحامين العرب السنوي",
                "التخصص في قضايا التحكيم التجاري الدولي",
                "دراسة قانون حماية البيانات الشخصية",
                "تطوير مهارات التفاوض والإصلاح",
                "إتقان البرامج القانونية الحديثة",
              ].map((rec, i) => (
                <div key={i} className="flex items-center gap-2 p-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
