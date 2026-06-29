"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ScanText,
  AlertTriangle,
  GitCompare,
  FileSearch,
  Quote,
  Sparkles,
  Loader2,
  Copy,
  ShieldAlert,
  ListChecks,
  ScrollText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const ANALYSIS_TYPES = [
  {
    value: "contract_risk",
    label: "تحليل مخاطر العقود",
    icon: ShieldAlert,
    description: "كشف الثغرات والمخاطر في العقود",
    color: "text-red-600 bg-red-50",
  },
  {
    value: "memo_logic",
    label: "تحليل منطق المذكرات",
    icon: ListChecks,
    description: "تقييم الترابط المنطقي للحجج",
    color: "text-amber-600 bg-amber-50",
  },
  {
    value: "compare",
    label: "مقارنة مستندين",
    icon: GitCompare,
    description: "مقارنة مذكرتين أو عقدين",
    color: "text-blue-600 bg-blue-50",
  },
  {
    value: "summary",
    label: "تلخيص المستندات",
    icon: FileSearch,
    description: "ملخص تنفيذي للمستندات الطويلة",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    value: "citations",
    label: "تدقيق الاستشهادات",
    icon: Quote,
    description: "التحقق من دقة الاستشهادات القانونية",
    color: "text-purple-600 bg-purple-50",
  },
  {
    value: "sentiment",
    label: "تحليل الأسلوب",
    icon: Sparkles,
    description: "تحليل النبرة والأسلوب القانوني",
    color: "text-teal-600 bg-teal-50",
  },
] as const;

export function TextAnalyzerSection() {
  const { toast } = useToast();
  const [analysisType, setAnalysisType] = useState<string>("contract_risk");
  const [text, setText] = useState("");
  const [compareText, setCompareText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!text.trim()) {
      toast({ title: "أدخل النص لتحليله", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          analysisType,
          compareWith: analysisType === "compare" ? compareText : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.analysis);
      toast({ title: "اكتمل التحليل", description: "تم تحليل النص بنجاح" });
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
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

  const currentType = ANALYSIS_TYPES.find((t) => t.value === analysisType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ScanText className="w-8 h-8 text-primary" />
          محلل النصوص القانونية
        </h1>
        <p className="text-muted-foreground mt-2">
          تحليل ذكي للعقود والمذكرات والمراسلات القانونية باستخدام الذكاء الاصطناعي
        </p>
      </div>

      {/* اختيار نوع التحليل */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ANALYSIS_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = analysisType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setAnalysisType(type.value)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition text-right",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-accent/30"
              )}
            >
              <div className={cn("p-2 rounded-lg", type.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الإدخال */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              النص المراد تحليله
            </CardTitle>
            <CardDescription>
              {currentType?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {analysisType === "compare" ? "المستند الأول" : "النص"}
              </Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="الصق هنا النص القانوني المراد تحليله..."
                className="min-h-[200px] lg:min-h-[300px] resize-none"
              />
            </div>
            {analysisType === "compare" && (
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">المستند الثاني للمقارنة</Label>
                <Textarea
                  value={compareText}
                  onChange={(e) => setCompareText(e.target.value)}
                  placeholder="الصق هنا المستند الثاني للمقارنة..."
                  className="min-h-[200px] lg:min-h-[300px] resize-none"
                />
              </div>
            )}
            <Button onClick={analyze} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  تحليل بالذكاء الاصطناعي
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* النتيجة */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                نتيجة التحليل
              </CardTitle>
              <CardDescription>التحليل والتوصيات</CardDescription>
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
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">جارٍ تحليل النص...</p>
                <p className="text-xs text-muted-foreground mt-1">قد يستغرق ذلك بضع ثوانٍ</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-primary [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ScanText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">لا توجد نتائج بعد</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  أدخل النص واختر نوع التحليل، ثم اضغط على زر التحليل للحصول على النتائج
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نصائح */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">نصائح للحصول على أفضل النتائج</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc pr-4">
                <li>الصق النص القانوني كاملاً (العقد، المذكرة، إلخ)</li>
                <li>للمقارنة، الصق المستندين في الحقلين المخصصين</li>
                <li>كلما كان النص أوضح وأكثر تفصيلاً، كانت النتائج أدق</li>
                <li>راجع النتائج واستخدمها كأداة مساعدة، لا كبديل عن الحكم القانوني</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
