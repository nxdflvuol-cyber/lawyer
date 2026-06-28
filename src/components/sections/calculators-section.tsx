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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import { formatCurrency, formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Calculator,
  Calendar,
  HeartPulse,
  Percent,
  Scale,
  Baby,
  HardHat,
  Save,
  X,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ============================================================
// ثوابت مساعدة
// ============================================================

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// أعياد افتراضية (مصر 2025)
const DEFAULT_HOLIDAYS = [
  { date: "2025-01-07", label: "عيد الميلاد المجيد" },
  { date: "2025-01-25", label: "عيد الشرطة" },
  { date: "2025-04-25", label: "عيد تحرير سيناء" },
  { date: "2025-05-01", label: "عيد العمال" },
  { date: "2025-06-30", label: "عيد الثورة" },
  { date: "2025-07-23", label: "عيد الثورة (23 يوليو)" },
  { date: "2025-10-06", label: "عيد القوات المسلحة" },
];

// أنواع الحاسبات
type CalculatorType =
  | "deadline"
  | "compensation"
  | "interest"
  | "court_fees"
  | "alimony"
  | "workers_comp";

interface CalculatorDef {
  id: CalculatorType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

const CALCULATORS: CalculatorDef[] = [
  {
    id: "deadline",
    title: "حاسبة المواعيد القانونية",
    description: "حساب المواعيد القانونية مع استثناء العطلات والأعياد وأيام العطلة الأسبوعية",
    icon: Calendar,
    color: "from-emerald-500 to-emerald-600",
    category: "مواعيد",
  },
  {
    id: "compensation",
    title: "حاسبة التعويضات",
    description: "حساب مبلغ التعويض عن الإصابات الشخصية بناءً على درجة العجز والأجر",
    icon: HeartPulse,
    color: "from-rose-500 to-rose-600",
    category: "تعويضات",
  },
  {
    id: "interest",
    title: "حاسبة الفوائد القانونية",
    description: "حساب الفوائد القانونية على المبالغ المستحقة بنسبة ومدة محددة",
    icon: Percent,
    color: "from-amber-500 to-amber-600",
    category: "مالية",
  },
  {
    id: "court_fees",
    title: "حاسبة رسوم القضايا",
    description: "تقدير رسوم رفع الدعاوى القضائية بناءً على قيمة المطالبة",
    icon: Scale,
    color: "from-teal-500 to-teal-600",
    category: "رسوم",
  },
  {
    id: "alimony",
    title: "حاسبة النفقة",
    description: "تقدير قيمة النفقة بناءً على الدخل وعدد الأطفال والظروف",
    icon: Baby,
    color: "from-purple-500 to-purple-600",
    category: "أحوال شخصية",
  },
  {
    id: "workers_comp",
    title: "حاسبة التعويضات العمالية",
    description: "حساب تعويض إصابات العمل وفقاً لقانون العمل",
    icon: HardHat,
    color: "from-orange-500 to-orange-600",
    category: "عمالية",
  },
];

// رسم أيقونة مستقرة لتجنب إنشاء مكونات أثناء العرض
function CalcIcon({ id, className }: { id: CalculatorType; className?: string }) {
  switch (id) {
    case "deadline": return <Calendar className={className} />;
    case "compensation": return <HeartPulse className={className} />;
    case "interest": return <Percent className={className} />;
    case "court_fees": return <Scale className={className} />;
    case "alimony": return <Baby className={className} />;
    case "workers_comp": return <HardHat className={className} />;
    default: return <Calculator className={className} />;
  }
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function CalculatorsSection() {
  const [activeCalc, setActiveCalc] = useState<CalculatorType | null>(null);
  const activeDef = activeCalc ? CALCULATORS.find((c) => c.id === activeCalc) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-7 h-7 text-primary" />
          الحاسبات القانونية
        </h1>
        <p className="text-muted-foreground mt-1">
          مجموعة متكاملة من الحاسبات القانونية المتخصصة للمحامين
        </p>
      </div>

      {/* الفئات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CALCULATORS.map((calc) => {
          const Icon = calc.icon;
          return (
            <Card
              key={calc.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group overflow-hidden"
              onClick={() => setActiveCalc(calc.id)}
            >
              <CardContent className="p-0">
                <div className={cn("bg-gradient-to-br p-5 text-white", calc.color)}>
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                      {calc.category}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mt-3">{calc.title}</h3>
                  <p className="text-sm text-white/80 mt-1 line-clamp-2">{calc.description}</p>
                </div>
                <div className="p-3 flex items-center justify-between bg-card">
                  <span className="text-xs text-muted-foreground">اضغط للبدء</span>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* النافذة المنبثقة للحاسبة */}
      {activeDef && (
        <CalcDialog calc={activeDef} onClose={() => setActiveCalc(null)} />
      )}
    </div>
  );
}

// ============================================================
// نافذة الحاسبة
// ============================================================

function CalcDialog({ calc, onClose }: { calc: CalculatorDef; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", calc.color)}>
              <CalcIcon id={calc.id} className="w-5 h-5" />
            </div>
            {calc.title}
          </DialogTitle>
          <DialogDescription>{calc.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {calc.id === "deadline" && <DeadlineCalculator />}
            {calc.id === "compensation" && <CompensationCalculator />}
            {calc.id === "interest" && <InterestCalculator />}
            {calc.id === "court_fees" && <CourtFeesCalculator />}
            {calc.id === "alimony" && <AlimonyCalculator />}
            {calc.id === "workers_comp" && <WorkersCompCalculator />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// حاسبة المواعيد القانونية
// ============================================================

function DeadlineCalculator() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(toISODate(new Date()));
  const [days, setDays] = useState<string>("15");
  const [excludeFridays, setExcludeFridays] = useState(true);
  const [excludeSaturdays, setExcludeSaturdays] = useState(false);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [result, setResult] = useState<{
    endDate: Date;
    skippedFridays: number;
    skippedSaturdays: number;
    skippedHolidays: number;
    businessDays: number;
    calendarDays: number;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    if (!startDate || !days) {
      toast({ title: "أدخل التاريخ وعدد الأيام", variant: "destructive" });
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const target = parseInt(days, 10);
    if (isNaN(target) || target < 0) {
      toast({ title: "عدد الأيام غير صحيح", variant: "destructive" });
      return;
    }
    let count = 0;
    let skippedFridays = 0;
    let skippedSaturdays = 0;
    let skippedHolidays = 0;
    const cursor = new Date(start);
    while (count < target) {
      const dow = cursor.getDay();
      const holiday = holidays.find((h) => h.date === toISODate(cursor));
      if (holiday && excludeHolidays) {
        skippedHolidays++;
      } else if (dow === 5 && excludeFridays) {
        skippedFridays++;
      } else if (dow === 6 && excludeSaturdays) {
        skippedSaturdays++;
      } else {
        count++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    cursor.setDate(cursor.getDate() - 1);
    setResult({
      endDate: cursor,
      skippedFridays,
      skippedSaturdays,
      skippedHolidays,
      businessDays: target,
      calendarDays: Math.round((cursor.getTime() - start.getTime()) / 86400000) + 1,
    });
  }

  const resultText = useMemo(() => {
    if (!result) return "";
    return `الموعد النهائي: ${formatDate(result.endDate)} (${WEEKDAYS_AR[result.endDate.getDay()]})\n` +
      `عدد أيام العمل: ${result.businessDays}\n` +
      `عدد أيام التقويم: ${result.calendarDays}\n` +
      `الجمعة المستثناة: ${result.skippedFridays}\n` +
      `السبت المستثناة: ${result.skippedSaturdays}\n` +
      `الأعياد المستثناة: ${result.skippedHolidays}`;
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>تاريخ البداية</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>عدد أيام العمل</Label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={1} />
        </div>
      </div>

      <div className="space-y-2 p-3 rounded-lg bg-muted/50">
        <Label className="text-xs">خيارات الاستثناء</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm cursor-pointer" htmlFor="ex-fri">استثناء الجمعة</Label>
            <Switch id="ex-fri" checked={excludeFridays} onCheckedChange={setExcludeFridays} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm cursor-pointer" htmlFor="ex-sat">استثناء السبت</Label>
            <Switch id="ex-sat" checked={excludeSaturdays} onCheckedChange={setExcludeSaturdays} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm cursor-pointer" htmlFor="ex-hol">استثناء الأعياد</Label>
            <Switch id="ex-hol" checked={excludeHolidays} onCheckedChange={setExcludeHolidays} />
          </div>
        </div>
      </div>

      {excludeHolidays && (
        <div className="space-y-1.5">
          <Label className="text-xs">الأعياد المُضافة ({holidays.length})</Label>
          <ScrollArea className="h-20 rounded-md border p-2">
            <div className="space-y-1">
              {holidays.map((h) => (
                <div key={h.date} className="flex items-center justify-between text-xs">
                  <span>{h.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">{formatDate(h.date)}</span>
                    <button
                      className="text-destructive hover:bg-destructive/10 rounded p-0.5"
                      onClick={() => setHolidays(holidays.filter((x) => x.date !== h.date))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ النتيجة
          </Button>
        )}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">الموعد النهائي القانوني</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatDate(result.endDate)}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
              يوم {WEEKDAYS_AR[result.endDate.getDay()]}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ResultStat label="أيام عمل" value={result.businessDays} color="text-emerald-600" />
            <ResultStat label="أيام تقويم" value={result.calendarDays} color="text-slate-600" />
            <ResultStat label="جمعة مستثناة" value={result.skippedFridays} color="text-amber-600" />
            <ResultStat label="أعياد مستثناة" value={result.skippedHolidays} color="text-rose-600" />
          </div>
        </div>
      )}

      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة المواعيد القانونية"
        inputs={{ startDate, days, excludeFridays, excludeSaturdays, excludeHolidays }}
        result={resultText}
      />
    </div>
  );
}

// ============================================================
// حاسبة التعويضات
// ============================================================

const INJURY_TYPES = [
  { value: "minor", label: "إصابة بسيطة", multiplier: 0.5 },
  { value: "moderate", label: "إصابة متوسطة", multiplier: 1 },
  { value: "severe", label: "إصابة شديدة", multiplier: 2 },
  { value: "permanent_partial", label: "عجز جزئي مستديم", multiplier: 3 },
  { value: "permanent_total", label: "عجز كلي مستديم", multiplier: 5 },
  { value: "death", label: "وفاة", multiplier: 10 },
];

function CompensationCalculator() {
  const { toast } = useToast();
  const [injuryType, setInjuryType] = useState<string>("moderate");
  const [disability, setDisability] = useState<string>("30");
  const [monthlyWage, setMonthlyWage] = useState<string>("5000");
  const [age, setAge] = useState<string>("35");
  const [result, setResult] = useState<{
    baseCompensation: number;
    disabilityCompensation: number;
    totalCompensation: number;
    details: string;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    const wage = Number(monthlyWage);
    const dis = Number(disability);
    const a = Number(age);
    if (!wage || wage <= 0) { toast({ title: "أدخل أجراً صحيحاً", variant: "destructive" }); return; }
    if (isNaN(dis) || dis < 0 || dis > 100) { toast({ title: "نسبة العجز بين 0 و 100", variant: "destructive" }); return; }

    const injury = INJURY_TYPES.find((i) => i.value === injuryType)!;
    // التعويض الأساسي = الأجر السنوي × معامل نوع الإصابة
    const annualWage = wage * 12;
    const baseCompensation = annualWage * injury.multiplier;
    // تعويض العجز = الأجر الشهري × (نسبة العجز/100) × عدد سنوات العمل المتوقعة
    const workingYears = Math.max(0, 60 - a);
    const disabilityCompensation = wage * (dis / 100) * workingYears * 12;
    const totalCompensation = baseCompensation + disabilityCompensation;

    setResult({
      baseCompensation,
      disabilityCompensation,
      totalCompensation,
      details: `نوع الإصابة: ${injury.label}\n` +
        `الأجر الشهري: ${formatCurrency(wage)}\n` +
        `نسبة العجز: ${dis}%\n` +
        `العمر: ${a} سنة\n` +
        `سنوات العمل المتبقية: ${workingYears} سنة\n` +
        `التعويض الأساسي (سنوي × ${injury.multiplier}): ${formatCurrency(baseCompensation)}\n` +
        `تعويض العجز: ${formatCurrency(disabilityCompensation)}\n` +
        `الإجمالي: ${formatCurrency(totalCompensation)}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>نوع الإصابة</Label>
        <Select value={injuryType} onValueChange={setInjuryType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {INJURY_TYPES.map((i) => (
              <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>نسبة العجز (%)</Label>
          <Input type="number" value={disability} onChange={(e) => setDisability(e.target.value)} min={0} max={100} />
        </div>
        <div className="space-y-1.5">
          <Label>الأجر الشهري</Label>
          <Input type="number" value={monthlyWage} onChange={(e) => setMonthlyWage(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>العمر</Label>
        <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={100} />
      </div>
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب التعويض
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="w-5 h-5 text-rose-600" />
              <span className="font-medium">إجمالي التعويض المُقدّر</span>
            </div>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {formatCurrency(result.totalCompensation)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ResultStat label="التعويض الأساسي" value={formatCurrency(result.baseCompensation)} color="text-amber-600" />
            <ResultStat label="تعويض العجز" value={formatCurrency(result.disabilityCompensation)} color="text-rose-600" />
          </div>
          <AlertCard>
            <p className="text-xs">
              <strong>ملاحظة:</strong> هذه محاكاة تقريبية. التعويض الفعلي يخضع لتقدير المحكمة والخبرة الطبية والظروف الخاصة بكل حالة. راجع القانون المدني وقانون التأمينات الاجتماعية.
            </p>
          </AlertCard>
        </div>
      )}
      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة التعويضات"
        inputs={{ injuryType, disability, monthlyWage, age }}
        result={result?.details ?? ""}
      />
    </div>
  );
}

// ============================================================
// حاسبة الفوائد القانونية
// ============================================================

function InterestCalculator() {
  const { toast } = useToast();
  const [principal, setPrincipal] = useState<string>("100000");
  const [rate, setRate] = useState<string>("5");
  const [period, setPeriod] = useState<string>("12");
  const [periodType, setPeriodType] = useState<"months" | "years">("months");
  const [method, setMethod] = useState<"simple" | "compound">("simple");
  const [result, setResult] = useState<{
    interest: number;
    total: number;
    details: string;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    const p = Number(principal);
    const r = Number(rate);
    const t = Number(period);
    if (!p || p <= 0) { toast({ title: "أدخل مبلغاً صحيحاً", variant: "destructive" }); return; }
    if (isNaN(r) || r < 0) { toast({ title: "نسبة غير صحيحة", variant: "destructive" }); return; }
    if (isNaN(t) || t <= 0) { toast({ title: "مدة غير صحيحة", variant: "destructive" }); return; }

    const years = periodType === "months" ? t / 12 : t;
    let interest: number;
    if (method === "simple") {
      interest = p * (r / 100) * years;
    } else {
      interest = p * (Math.pow(1 + r / 100, years) - 1);
    }
    const total = p + interest;
    setResult({
      interest,
      total,
      details: `المبلغ الأصلي: ${formatCurrency(p)}\n` +
        `نسبة الفائدة: ${r}% سنوياً\n` +
        `المدة: ${t} ${periodType === "months" ? "شهر" : "سنة"} (${years.toFixed(2)} سنة)\n` +
        `نوع الفائدة: ${method === "simple" ? "بسيطة" : "مركبة"}\n` +
        `الفائدة: ${formatCurrency(interest)}\n` +
        `الإجمالي: ${formatCurrency(total)}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المبلغ (الأصل)</Label>
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>نسبة الفائدة (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} step="0.1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المدة</Label>
          <Input type="number" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>نوع المدة</Label>
          <Select value={periodType} onValueChange={(v: "months" | "years") => setPeriodType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="months">شهور</SelectItem>
              <SelectItem value="years">سنوات</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>طريقة الحساب</Label>
        <Select value={method} onValueChange={(v: "simple" | "compound") => setMethod(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">فائدة بسيطة</SelectItem>
            <SelectItem value="compound">فائدة مركبة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب الفوائد
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-amber-600" />
              <span className="font-medium">قيمة الفائدة</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(result.interest)}
            </p>
            <Separator className="my-2 bg-amber-200 dark:bg-amber-800" />
            <div className="flex items-center justify-between">
              <span className="text-sm">الإجمالي المستحق</span>
              <span className="text-xl font-bold">{formatCurrency(result.total)}</span>
            </div>
          </div>
          <AlertCard>
            <p className="text-xs">
              <strong>ملاحظة:</strong> الفائدة القانونية في مصر 5% على القضايا المدنية والتجارية، و4% على القضايا الإدارية. تأكد من النسبة المطبقة على نوع قضيتك.
            </p>
          </AlertCard>
        </div>
      )}
      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة الفوائد القانونية"
        inputs={{ principal, rate, period, periodType, method }}
        result={result?.details ?? ""}
      />
    </div>
  );
}

// ============================================================
// حاسبة رسوم القضايا
// ============================================================

function CourtFeesCalculator() {
  const { toast } = useToast();
  const [claimValue, setClaimValue] = useState<string>("50000");
  const [caseCategory, setCaseCategory] = useState<"civil" | "commercial" | "administrative" | "personal_status" | "labor">("civil");
  const [result, setResult] = useState<{
    baseFee: number;
    percentageFee: number;
    totalFee: number;
    details: string;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    const value = Number(claimValue);
    if (!value || value <= 0) { toast({ title: "أدخل قيمة المطالبة", variant: "destructive" }); return; }

    let baseFee = 0;
    let percentageFee = 0;
    let details = `قيمة المطالبة: ${formatCurrency(value)}\nنوع القضية: ${CASE_CATEGORY_LABELS[caseCategory]}\n`;

    // رسوم ثابتة حسب الفئة
    switch (caseCategory) {
      case "civil":
        baseFee = value <= 5000 ? 50 : value <= 10000 ? 100 : 200;
        percentageFee = value > 10000 ? (value - 10000) * 0.025 : 0;
        details += `رسم أساسي: ${formatCurrency(baseFee)}\nرسم نسبي 2.5%: ${formatCurrency(percentageFee)}\n`;
        break;
      case "commercial":
        baseFee = value <= 50000 ? 200 : 500;
        percentageFee = value > 50000 ? (value - 50000) * 0.01 : 0;
        details += `رسم أساسي: ${formatCurrency(baseFee)}\nرسم نسبي 1%: ${formatCurrency(percentageFee)}\n`;
        break;
      case "administrative":
        baseFee = 100;
        percentageFee = value * 0.005;
        details += `رسم ثابت: ${formatCurrency(baseFee)}\nرسم نسبي 0.5%: ${formatCurrency(percentageFee)}\n`;
        break;
      case "labor":
        baseFee = value <= 10000 ? 0 : 50;
        percentageFee = 0;
        details += `الرسوم مخفضة أو معفاة في القضايا العمالية\nرسم: ${formatCurrency(baseFee)}\n`;
        break;
      case "personal_status":
        baseFee = value <= 5000 ? 20 : 50;
        percentageFee = 0;
        details += `رسم ثابت: ${formatCurrency(baseFee)}\n`;
        break;
    }

    const totalFee = baseFee + percentageFee;
    details += `إجمالي الرسوم: ${formatCurrency(totalFee)}`;

    setResult({ baseFee, percentageFee, totalFee, details });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>نوع القضية</Label>
        <Select value={caseCategory} onValueChange={(v: typeof caseCategory) => setCaseCategory(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="civil">مدنية</SelectItem>
            <SelectItem value="commercial">تجارية</SelectItem>
            <SelectItem value="administrative">إدارية</SelectItem>
            <SelectItem value="labor">عمالية</SelectItem>
            <SelectItem value="personal_status">أحوال شخصية</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>قيمة المطالبة</Label>
        <Input type="number" value={claimValue} onChange={(e) => setClaimValue(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب الرسوم
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-teal-600" />
              <span className="font-medium">إجمالي رسوم القضية</span>
            </div>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              {formatCurrency(result.totalFee)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ResultStat label="الرسم الأساسي" value={formatCurrency(result.baseFee)} color="text-slate-600" />
            <ResultStat label="الرسم النسبي" value={formatCurrency(result.percentageFee)} color="text-amber-600" />
          </div>
          <AlertCard>
            <p className="text-xs">
              <strong>ملاحظة:</strong> هذه الرسوم تقريبية وفق قانون الرسوم القضائية المصري. قد تختلف الرسوم الفعلية حسب درجة التقاضي (ابتدائي/استئناف/نقض) وإجراءات معينة. تحقق من القانون 90 لسنة 1944 وتعديلاته.
            </p>
          </AlertCard>
        </div>
      )}
      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة رسوم القضايا"
        inputs={{ claimValue, caseCategory }}
        result={result?.details ?? ""}
      />
    </div>
  );
}

const CASE_CATEGORY_LABELS: Record<string, string> = {
  civil: "مدنية",
  commercial: "تجارية",
  administrative: "إدارية",
  labor: "عمالية",
  personal_status: "أحوال شخصية",
};

// ============================================================
// حاسبة النفقة
// ============================================================

function AlimonyCalculator() {
  const { toast } = useToast();
  const [income, setIncome] = useState<string>("10000");
  const [childrenCount, setChildrenCount] = useState<string>("2");
  const [spouse, setSpouse] = useState<boolean>(true);
  const [housingCost, setHousingCost] = useState<string>("1500");
  const [result, setResult] = useState<{
    childrenAlimony: number;
    spouseAlimony: number;
    housing: number;
    total: number;
    details: string;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    const inc = Number(income);
    const kids = Number(childrenCount);
    const housing = Number(housingCost) || 0;
    if (!inc || inc <= 0) { toast({ title: "أدخل دخلاً صحيحاً", variant: "destructive" }); return; }
    if (isNaN(kids) || kids < 0) { toast({ title: "عدد أطفال غير صحيح", variant: "destructive" }); return; }

    // نسب النفقة من الدخل:
    // - الزوجة: 25% من الدخل (إن وُجدت)
    // - كل طفل: 15% من الدخل (بحد أقصى 4 أطفال)
    const spouseAlimony = spouse ? inc * 0.25 : 0;
    const cappedKids = Math.min(kids, 4);
    const childrenAlimony = inc * 0.15 * cappedKids;
    const total = spouseAlimony + childrenAlimony + housing;

    setResult({
      childrenAlimony,
      spouseAlimony,
      housing,
      total,
      details: `الدخل الشهري: ${formatCurrency(inc)}\n` +
        `عدد الأطفال: ${kids} (محسوب: ${cappedKids})\n` +
        `نفقة الزوجة (25%): ${formatCurrency(spouseAlimony)}\n` +
        `نفقة الأطفال (${cappedKids} × 15%): ${formatCurrency(childrenAlimony)}\n` +
        `المسكن: ${formatCurrency(housing)}\n` +
        `إجمالي النفقة الشهرية: ${formatCurrency(total)}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>الدخل الشهري</Label>
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>عدد الأطفال</Label>
          <Input type="number" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} min={0} max={10} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>تكلفة المسكن الشهرية</Label>
          <Input type="number" value={housingCost} onChange={(e) => setHousingCost(e.target.value)} />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center justify-between w-full p-2 rounded-md border">
            <Label htmlFor="spouse" className="text-sm cursor-pointer">يشمل نفقة الزوجة</Label>
            <Switch id="spouse" checked={spouse} onCheckedChange={setSpouse} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب النفقة
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-5 h-5 text-purple-600" />
              <span className="font-medium">إجمالي النفقة الشهرية</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(result.total)}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
              ({Math.round((result.total / Number(income)) * 100)}% من الدخل)
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ResultStat label="نفقة الزوجة" value={formatCurrency(result.spouseAlimony)} color="text-rose-600" />
            <ResultStat label="نفقة الأطفال" value={formatCurrency(result.childrenAlimony)} color="text-purple-600" />
            <ResultStat label="المسكن" value={formatCurrency(result.housing)} color="text-amber-600" />
          </div>
          <AlertCard>
            <p className="text-xs">
              <strong>ملاحظة:</strong> تحديد النفقة يخضع لتقدير القاضي وفقاً لحالة الزوجين المالية والاجتماعية. القانون يحدد أن النفقة تشمل: المأكل، الملبس، المسكن، التعليم، العلاج. راجع قانون الأحوال الشخصية.
            </p>
          </AlertCard>
        </div>
      )}
      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة النفقة"
        inputs={{ income, childrenCount, spouse, housingCost }}
        result={result?.details ?? ""}
      />
    </div>
  );
}

// ============================================================
// حاسبة التعويضات العمالية
// ============================================================

function WorkersCompCalculator() {
  const { toast } = useToast();
  const [dailyWage, setDailyWage] = useState<string>("200");
  const [disability, setDisability] = useState<string>("35");
  const [age, setAge] = useState<string>("35");
  const [injuryType, setInjuryType] = useState<"work" | "commute" | "occupational_disease">("work");
  const [result, setResult] = useState<{
    dailyCompensation: number;
    totalCompensation: number;
    pension: number;
    details: string;
  } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  function calculate() {
    const wage = Number(dailyWage);
    const dis = Number(disability);
    const a = Number(age);
    if (!wage || wage <= 0) { toast({ title: "أدخل أجراً يومياً صحيحاً", variant: "destructive" }); return; }
    if (isNaN(dis) || dis < 0 || dis > 100) { toast({ title: "نسبة العجز بين 0 و 100", variant: "destructive" }); return; }

    // تعويض إصابات العمل (قانون التأمينات الاجتماعية):
    // - إذا كان العجز أقل من 35%: تعويض مقطوع = الأجر اليومي × 1000 × نسبة العجز
    // - إذا كان 35% أو أكثر: معاش شهري = الأجر اليومي × 30 × نسبة العجز
    let totalCompensation = 0;
    let pension = 0;
    let dailyCompensation = 0;
    let details = `الأجر اليومي: ${formatCurrency(wage)}\nنسبة العجز: ${dis}%\nنوع الإصابة: ${INJURY_TYPE_LABELS[injuryType]}\n`;

    if (dis < 35) {
      dailyCompensation = wage * 1000 * (dis / 100);
      totalCompensation = dailyCompensation;
      details += `\nالتعويض المقطوع (لعجز < 35%):\n` +
        `${wage} × 1000 × ${dis / 100} = ${formatCurrency(totalCompensation)}`;
    } else {
      // معاش شهري
      pension = wage * 30 * (dis / 100);
      // تعويض نهاية الخدمة المقدّر = المعاش × سنوات متوقعة
      const yearsLeft = Math.max(0, 60 - a);
      totalCompensation = pension * yearsLeft * 12;
      details += `\nالمعاش الشهري (لعجز ≥ 35%):\n` +
        `${wage} × 30 × ${dis / 100} = ${formatCurrency(pension)}/شهر\n` +
        `سنوات العمل متبقية: ${yearsLeft}\n` +
        `التعويض الإجمالي المقدر: ${formatCurrency(totalCompensation)}`;
    }

    setResult({ dailyCompensation, totalCompensation, pension, details });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>الأجر اليومي</Label>
          <Input type="number" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>نسبة العجز (%)</Label>
          <Input type="number" value={disability} onChange={(e) => setDisability(e.target.value)} min={0} max={100} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>العمر</Label>
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={16} max={80} />
        </div>
        <div className="space-y-1.5">
          <Label>نوع الإصابة</Label>
          <Select value={injuryType} onValueChange={(v: typeof injuryType) => setInjuryType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="work">إصابة عمل</SelectItem>
              <SelectItem value="commute">إصابة أثناء الذهاب/العودة</SelectItem>
              <SelectItem value="occupational_disease">مرض مهني</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1">
          <Calculator className="w-4 h-4 ml-2" />
          احسب التعويض
        </Button>
        {result && (
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <Save className="w-4 h-4 ml-1" />
            حفظ
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gradient-to-l from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <HardHat className="w-5 h-5 text-orange-600" />
              <span className="font-medium">التعويض الإجمالي</span>
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {formatCurrency(result.totalCompensation)}
            </p>
            {result.pension > 0 && (
              <>
                <Separator className="my-2 bg-orange-200 dark:bg-orange-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">المعاش الشهري</span>
                  <span className="text-lg font-bold">{formatCurrency(result.pension)}</span>
                </div>
              </>
            )}
          </div>
          <AlertCard>
            <p className="text-xs">
              <strong>ملاحظة:</strong> التعويضات العمالية محسوبة وفق قانون التأمينات الاجتماعية المصري (قانون 79 لسنة 1975). قد تختلف القيم الفعلية حسب تاريخ الإصابة ونظام التأمين. استشر خبير قانوني عمالي.
            </p>
          </AlertCard>
        </div>
      )}
      <SaveResultDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        calcType="حاسبة التعويضات العمالية"
        inputs={{ dailyWage, disability, age, injuryType }}
        result={result?.details ?? ""}
      />
    </div>
  );
}

const INJURY_TYPE_LABELS: Record<string, string> = {
  work: "إصابة عمل",
  commute: "إصابة أثناء التنقل",
  occupational_disease: "مرض مهني",
};

// ============================================================
// نافذة حفظ النتيجة
// ============================================================

function SaveResultDialog({
  open,
  onOpenChange,
  calcType,
  inputs,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  calcType: string;
  inputs: Record<string, unknown>;
  result: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(`نتيجة ${calcType} - ${formatDate(new Date())}`);
  const [caseId, setCaseId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  const { data: casesData } = useQuery({
    queryKey: ["cases", "for-calc"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-calc"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const cases = casesData?.cases ?? [];
  const clients = clientsData?.clients ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/calculators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorType: calcType,
          title,
          inputs,
          result,
          caseId: caseId || null,
          clientId: clientId || null,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم حفظ النتيجة بنجاح", description: "يمكنك مراجعتها لاحقاً في قسم المذكرات" });
      queryClient.invalidateQueries({ queryKey: ["calculators"] });
      onOpenChange(false);
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            حفظ نتيجة الحاسبة
          </DialogTitle>
          <DialogDescription>سيتم حفظ النتيجة في المذكرات لمراجعتها لاحقاً</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ربط بقضية (اختياري)</Label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger><SelectValue placeholder="بدون ربط" /></SelectTrigger>
              <SelectContent>
                {cases.map((c: { id: string; internalNumber: string }) => (
                  <SelectItem key={c.id} value={c.id}>{c.internalNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ربط بموكل (اختياري)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="بدون ربط" /></SelectTrigger>
              <SelectContent>
                {clients.map((c: { id: string; fullName: string }) => (
                  <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>النتيجة</Label>
            <ScrollArea className="h-32 rounded-md border p-2">
              <pre className="text-xs whitespace-pre-wrap font-mono">{result}</pre>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// مكوّنات مساعدة
// ============================================================

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function AlertCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-amber-800 dark:text-amber-300">{children}</div>
    </div>
  );
}
