"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Gavel,
  Sparkles,
  Loader2,
  Copy,
  Clock,
  Zap,
  AlertCircle,
  Brain,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ListChecks,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const REQUEST_TYPES = [
  {
    value: "pleading_points",
    label: "توليد نقاط المرافعة",
    icon: ListChecks,
    description: "إنشاء هيكل مرافعة متكامل بناءً على بيانات القضية",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    value: "quick_responses",
    label: "ردود سريعة",
    icon: Zap,
    description: "ردود جاهزة على دفوع الخصم للاستخدام الفوري",
    color: "text-amber-600 bg-amber-50",
  },
  {
    value: "judge_simulation",
    label: "محاكاة أسئلة القاضي",
    icon: Brain,
    description: "أسئلة محتملة من القاضي وإجابات نموذجية",
    color: "text-purple-600 bg-purple-50",
  },
  {
    value: "weakness_analysis",
    label: "تحليل نقاط الضعف",
    icon: AlertCircle,
    description: "كشف نقاط الضعف في المرافعة وتقويتها",
    color: "text-red-600 bg-red-50",
  },
] as const;

const QUICK_RESPONSES_LIBRARY = [
  "أرفض ما جاء بمذكرات الخصم لمخالفته للواقع والقانون",
  "التمس رفض الطلب لعدم الاستناد إلى سند قانوني",
  "التمس وقف الدعوى لسبق الفصل فيها",
  "أدفع بعدم قبول الدعوى لانتفاء الصفة",
  "أدفع بعدم الاختصاص الولائي",
  "التمس أجل لإعداد مذكرة دفاع",
  "أرفض الطلب لسقوط الحق بالتقادم",
  "التمس الحكم بطلباتي لثبوتها بالأدلة المقدمة",
];

export function PleadingSection() {
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<string>("pleading_points");
  const [caseFacts, setCaseFacts] = useState("");
  const [opponentDefenses, setOpponentDefenses] = useState("");
  const [judgeTendencies, setJudgeTendencies] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // مؤقت المرافعة
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  function formatTimer(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  async function generate() {
    if (!caseFacts.trim() && !opponentDefenses.trim()) {
      toast({ title: "أدخل بيانات القضية", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/pleading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseFacts,
          opponentDefenses,
          judgeTendencies,
          requestType,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.result);
      toast({ title: "تم التوليد", description: "راجع المرافعة المُولّدة" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (result) {
      navigator.clipboard.writeText(result);
      toast({ title: "تم النسخ" });
    }
  }

  const currentType = REQUEST_TYPES.find((t) => t.value === requestType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" />
            مساعد المرافعة الذكي
          </h1>
          <p className="text-muted-foreground mt-2">
            إعداد المرافعات، الردود السريعة، ومحاكاة الجلسات بالذكاء الاصطناعي
          </p>
        </div>
        {/* مؤقت المرافعة */}
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-primary" />
            <div className="text-2xl font-mono font-bold tabular-nums">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={timerRunning ? "default" : "outline"}
                onClick={() => setTimerRunning((r) => !r)}
              >
                {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(0);
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الإدخال */}
        <div className="space-y-4">
          {/* اختيار نوع الطلب */}
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = requestType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setRequestType(type.value)}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-lg border-2 transition text-right",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn("p-1.5 rounded", type.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{type.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات القضية</CardTitle>
              <CardDescription>{currentType?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">وقائع القضية / المرافعة المقترحة</Label>
                <Textarea
                  value={caseFacts}
                  onChange={(e) => setCaseFacts(e.target.value)}
                  placeholder="اكتب وقائع القضية، الطلبات، النوع، أو الصق المرافعة المقترحة..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">دفوع الخصم (إن وجدت)</Label>
                <Textarea
                  value={opponentDefenses}
                  onChange={(e) => setOpponentDefenses(e.target.value)}
                  placeholder="اكتب دفوع الخصم أو نقاطه التي تريد الرد عليها..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">توجهات القاضي (إن وجدت)</Label>
                <Textarea
                  value={judgeTendencies}
                  onChange={(e) => setJudgeTendencies(e.target.value)}
                  placeholder="ملاحظات عن توجهات القاضي، أسئلته المعتادة، تفضيلاته..."
                  className="min-h-[60px]"
                />
              </div>
              <Button onClick={generate} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    توليد بالذكاء الاصطناعي
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* مكتبة الردود السريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                مكتبة الردود السريعة
              </CardTitle>
              <CardDescription>ردود قانونية جاهزة للاستخدام في الجلسة</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-1.5">
                  {QUICK_RESPONSES_LIBRARY.map((response, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigator.clipboard.writeText(response);
                        toast({ title: "تم نسخ الرد" });
                      }}
                      className="w-full text-right p-2 rounded-md hover:bg-accent text-xs border border-border"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* النتيجة */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                المرافعة المُولّدة
              </CardTitle>
              <CardDescription>{currentType?.label}</CardDescription>
            </div>
            {result && (
              <Button variant="outline" size="sm" onClick={copyResult}>
                <Copy className="w-4 h-4 ml-2" />
                نسخ
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">جارٍ إعداد المرافعة...</p>
              </div>
            ) : result ? (
              <ScrollArea className="h-[600px]">
                <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-primary [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-primary/80 [&_h3]:text-sm [&_ol]:my-2 [&_ul]:my-2 [&_li]:my-1">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Gavel className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">لا توجد مرافعة بعد</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  أدخل بيانات القضية واختر نوع المهمة، ثم اضغط على زر التوليد
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
