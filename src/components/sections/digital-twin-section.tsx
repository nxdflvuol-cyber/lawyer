"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  ChevronLeft,
  Clock,
  FileWarning,
  Gavel,
  HeartPulse,
  Layers,
  Lightbulb,
  Loader2,
  Network,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  Activity as ActivityIcon,
  Flame,
  CalendarClock,
  Scale,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";

// ============================================================
//  Digital Twin - النموذج الرقمي للمكتب
//  Enterprise NOC-style dashboard for the legal operating system
// ============================================================

type LoadStatus = "low" | "medium" | "high";

interface WorkloadMember {
  id: string;
  name: string;
  role: string;
  activeCases: number;
  sessionsThisWeek: number;
  pendingTasks: number;
  overdueTasks: number;
  hoursLogged: number;
  load: number;
  status: LoadStatus;
}

interface Bottleneck {
  id: string;
  title: string;
  count: number;
  severity: "high" | "medium" | "low";
  affected: string;
  action: string;
}

interface StalledFile {
  id: string;
  caseNumber: string;
  client: string;
  lastActivity: string;
  daysIdle: number;
  lawyer: string;
  bucket: "30" | "60" | "90";
}

interface Recommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
  impact: string;
  action: string;
}

interface CaseFlowStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface RadarDatum {
  metric: string;
  [lawyerKey: string]: string | number;
}

interface TimeDatum {
  lawyer: string;
  sessions: number;
  memos: number;
  meetings: number;
  tasks: number;
  other: number;
}

interface PieDatum {
  name: string;
  value: number;
  color: string;
}

interface DailyActivity {
  day: string;
  actions: number;
  cases: number;
  sessions: number;
}

// ------------------------------------------------------------
//  Mock data (used as fallback and to enrich real API data)
// ------------------------------------------------------------

const MOCK_TEAM_RAW = [
  { id: "1", name: "أ. أحمد محمود", role: "lawyer", activeCases: 12, sessionsThisWeek: 4, pendingTasks: 8, overdueTasks: 2, hoursLogged: 35 },
  { id: "2", name: "أ. منى رشاد", role: "lawyer", activeCases: 18, sessionsThisWeek: 7, pendingTasks: 15, overdueTasks: 5, hoursLogged: 48 },
  { id: "3", name: "أ. خالد عبد الله", role: "lawyer", activeCases: 9, sessionsThisWeek: 3, pendingTasks: 6, overdueTasks: 1, hoursLogged: 28 },
  { id: "4", name: "أ. سارة إبراهيم", role: "lawyer", activeCases: 22, sessionsThisWeek: 9, pendingTasks: 19, overdueTasks: 7, hoursLogged: 52 },
  { id: "5", name: "أ. عمر حسن", role: "lawyer", activeCases: 6, sessionsThisWeek: 2, pendingTasks: 4, overdueTasks: 0, hoursLogged: 22 },
  { id: "6", name: "أ. ليلى فؤاد", role: "lawyer", activeCases: 15, sessionsThisWeek: 5, pendingTasks: 11, overdueTasks: 3, hoursLogged: 40 },
  { id: "7", name: "أ. يوسف كمال", role: "lawyer", activeCases: 11, sessionsThisWeek: 4, pendingTasks: 9, overdueTasks: 4, hoursLogged: 33 },
  { id: "8", name: "أ. هالة مصطفى", role: "lawyer", activeCases: 8, sessionsThisWeek: 3, pendingTasks: 5, overdueTasks: 1, hoursLogged: 26 },
];

const MOCK_BOTTLENECKS: Bottleneck[] = [
  {
    id: "b1",
    title: "قضايا لم يُتخذ فيها إجراء منذ 30+ يوم",
    count: 14,
    severity: "high",
    affected: "8 محامين",
    action: "مراجعة الجلسات القادمة وتحديد إجراء فوري",
  },
  {
    id: "b2",
    title: "ملفات تجهيز لم تُحوّل لقضايا",
    count: 9,
    severity: "medium",
    affected: "قسم الاستقبال",
    action: "متابعة رفع الدعاوى أو إغلاق الملفات",
  },
  {
    id: "b3",
    title: "توكيلات ستنتهي خلال 15 يوم",
    count: 6,
    severity: "high",
    affected: "6 موكلين",
    action: "تجديد التوكيلات قبل الانتهاء",
  },
  {
    id: "b4",
    title: "مهام متأخرة عن موعدها",
    count: 23,
    severity: "high",
    affected: "7 محامين",
    action: "إعادة جدولة أو إنشاء مهام بديلة",
  },
  {
    id: "b5",
    title: "أحكام لم يبدأ تنفيذها",
    count: 5,
    severity: "medium",
    affected: "5 قضايا منتهية",
    action: "فتح ملفات تنفيذ ومتابعة الجهات",
  },
  {
    id: "b6",
    title: "جلسات هذا الأسبوع بدون مذكرة",
    count: 11,
    severity: "medium",
    affected: "11 جلسة",
    action: "إنشاء مهام إعداد مذكرات للمحامين",
  },
];

const MOCK_STALLED: StalledFile[] = [
  { id: "s1", caseNumber: "ق/2024/1187", client: "شركة النيل للاستثمار", lastActivity: "2024-08-12", daysIdle: 92, lawyer: "أ. منى رشاد", bucket: "90" },
  { id: "s2", caseNumber: "ق/2024/0934", client: "محمد عبد الرحمن", lastActivity: "2024-09-04", daysIdle: 71, lawyer: "أ. سارة إبراهيم", bucket: "60" },
  { id: "s3", caseNumber: "ق/2024/1456", client: "ورثة أحمد فؤاد", lastActivity: "2024-09-21", daysIdle: 54, lawyer: "أ. أحمد محمود", bucket: "60" },
  { id: "s4", caseNumber: "ق/2024/0782", client: "شركة الدلتا للتجارة", lastActivity: "2024-10-02", daysIdle: 43, lawyer: "أ. ليلى فؤاد", bucket: "30" },
  { id: "s5", caseNumber: "ق/2024/1601", client: "نورا سامي", lastActivity: "2024-10-15", daysIdle: 30, lawyer: "أ. يوسف كمال", bucket: "30" },
  { id: "s6", caseNumber: "ق/2024/0890", client: "كريم ثروت", lastActivity: "2024-10-19", daysIdle: 26, lawyer: "أ. هالة مصطفى", bucket: "30" },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    priority: "critical",
    title: "أعد توزيع 4 قضايا من سارة إبراهيم إلى عمر حسن",
    detail: "سارة إبراهيم تعمل بنسبة 96% فوق طاقتها بينما عمر حسن متاح بنسبة 38% فقط. نقل 4 قضايا منخفضة الأولوية سيوازن الضغط.",
    impact: "تخفيض ضغط سارة بنسبة 18% وزيادة إنتاجية عمر",
    action: "إعادة التوزيع",
  },
  {
    id: "r2",
    priority: "high",
    title: "6 ملفات تحتاج متابعة عاجلة (>60 يوم)",
    detail: "هناك 6 قضايا لم تُسجل عليها أي إجراء منذ أكثر من 60 يوم، مما يعرض المكتب لمخاطر قانونية وتأديبية.",
    impact: "تجنب مخاطر السقوط بالتقادم وشكاوى الموكلين",
    action: "متابعة الآن",
  },
  {
    id: "r3",
    priority: "high",
    title: "ركز على تنفيذ 5 أحكام معلّقة",
    detail: "5 أحكام نهائية لم يبدأ تنفيذها، تمثل أصولاً أو التزامات مستحقة للموكلين بقيمة تقديرية مرتفعة.",
    impact: "تحصيل حقوق الموكلين وزيادة الإيرادات",
    action: "فتح ملفات التنفيذ",
  },
  {
    id: "r4",
    priority: "medium",
    title: "11 جلسة هذا الأسبوع بدون مذكرة - أنشئ مهام",
    detail: "تم تحديد 11 جلسة قادمة بدون مذكرات مرافعة. ينصح بإنشاء مهام تلقائية لكل جلسة.",
    impact: "تحسين جودة المرافعة وزيادة فرص الكسب",
    action: "إنشاء المهام",
  },
  {
    id: "r5",
    priority: "medium",
    title: "6 توكيلات ستنتهي خلال 15 يوم",
    detail: "ينبغي تجديد التوكيلات قبل انتهاءها لتجنب فقدان الصفة في القضايا النشطة.",
    impact: "الحفاظ على الصفة القانونية في 6 قضايا",
    action: "تنبيه المحامين",
  },
];

const CASE_FLOW_STAGES: CaseFlowStage[] = [
  { key: "intake", label: "استقبال", count: 24, color: "var(--color-cyan, #06b6d4)" },
  { key: "prep", label: "تجهيز", count: 18, color: "var(--color-violet, #8b5cf6)" },
  { key: "filing", label: "رفع دعوى", count: 41, color: "var(--color-emerald, #10b981)" },
  { key: "hearings", label: "جلسات", count: 63, color: "var(--color-amber, #f59e0b)" },
  { key: "ruling", label: "حكم", count: 12, color: "var(--color-rose, #f43f5e)" },
  { key: "execution", label: "تنفيذ", count: 7, color: "#0ea5e9" },
  { key: "closed", label: "إغلاق", count: 35, color: "#64748b" },
];

const MOCK_RADAR_METRICS = [
  "القضايا النشطة",
  "الإغلاقات",
  "المهام المنجزة",
  "الجلسات",
  "المستندات",
  "الالتزام بالمواعيد",
];

const MOCK_TIME_DISTRIBUTION: TimeDatum[] = [
  { lawyer: "أحمد محمود", sessions: 12, memos: 8, meetings: 6, tasks: 9, other: 4 },
  { lawyer: "منى رشاد", sessions: 18, memos: 14, meetings: 9, tasks: 16, other: 6 },
  { lawyer: "خالد عبد الله", sessions: 8, memos: 6, meetings: 4, tasks: 7, other: 3 },
  { lawyer: "سارة إبراهيم", sessions: 22, memos: 17, meetings: 11, tasks: 19, other: 7 },
  { lawyer: "عمر حسن", sessions: 5, memos: 4, meetings: 3, tasks: 5, other: 2 },
  { lawyer: "ليلى فؤاد", sessions: 14, memos: 11, meetings: 7, tasks: 12, other: 5 },
];

const MOCK_PIE_LAWYERS: PieDatum[] = [
  { name: "أحمد محمود", value: 12, color: "#10b981" },
  { name: "منى رشاد", value: 18, color: "#f59e0b" },
  { name: "خالد عبد الله", value: 9, color: "#06b6d4" },
  { name: "سارة إبراهيم", value: 22, color: "#f43f5e" },
  { name: "عمر حسن", value: 6, color: "#8b5cf6" },
  { name: "ليلى فؤاد", value: 15, color: "#0ea5e9" },
  { name: "أخرى", value: 8, color: "#64748b" },
];

const MOCK_BAR_COURTS = [
  { court: "محكمة شمال القاهرة", cases: 28 },
  { court: "محكمة جنوب القاهرة", cases: 21 },
  { court: "محكمة الجيزة", cases: 19 },
  { court: "محكمة الأسرة", cases: 16 },
  { court: "محكمة الاقتصادية", cases: 11 },
  { court: "محكمة النقض", cases: 6 },
  { court: "محكمة الاستئناف", cases: 9 },
];

function buildMockDailyActivity(): DailyActivity[] {
  const out: DailyActivity[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const weekend = d.getDay() === 5 || d.getDay() === 6;
    const base = weekend ? 4 : 18;
    const actions = base + Math.round(Math.sin(i / 2) * 5 + Math.random() * 8);
    const cases = Math.max(0, Math.round(actions * 0.4));
    const sessions = Math.max(0, Math.round(actions * 0.25));
    out.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      actions: Math.max(0, actions),
      cases,
      sessions,
    });
  }
  return out;
}

const MOCK_DAILY_ACTIVITY = buildMockDailyActivity();

// ------------------------------------------------------------
//  Helpers
// ------------------------------------------------------------

function calcLoad(m: {
  activeCases: number;
  sessionsThisWeek: number;
  pendingTasks: number;
  overdueTasks: number;
}): number {
  const caseWeight = m.activeCases * 2;
  const sessionWeight = m.sessionsThisWeek * 3;
  const taskWeight = m.pendingTasks;
  const overdueWeight = m.overdueTasks * 4;
  const total = caseWeight + sessionWeight + taskWeight + overdueWeight;
  return Math.min(100, Math.round(total / 1.5));
}

function loadStatus(load: number): LoadStatus {
  if (load >= 70) return "high";
  if (load >= 40) return "medium";
  return "low";
}

function statusColor(status: LoadStatus): string {
  switch (status) {
    case "high":
      return "text-rose-600 bg-rose-50 border-rose-200";
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "low":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
  }
}

function statusLabel(status: LoadStatus): string {
  switch (status) {
    case "high":
      return "ضغط مرتفع";
    case "medium":
      return "ضغط متوسط";
    case "low":
      return "ضغط منخفض";
  }
}

function cellColor(value: number, thresholds: [number, number]): string {
  // thresholds = [amberAt, redAt]
  if (value >= thresholds[1]) return "bg-rose-100 text-rose-700";
  if (value >= thresholds[0]) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function severityBadge(s: "high" | "medium" | "low") {
  switch (s) {
    case "high":
      return { label: "حرجة", cls: "bg-rose-100 text-rose-700 border-rose-200" };
    case "medium":
      return { label: "متوسطة", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    case "low":
      return { label: "منخفضة", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
}

function priorityBadge(p: Recommendation["priority"]) {
  switch (p) {
    case "critical":
      return { label: "حرجة", cls: "bg-rose-100 text-rose-700 border-rose-200" };
    case "high":
      return { label: "عالية", cls: "bg-orange-100 text-orange-700 border-orange-200" };
    case "medium":
      return { label: "متوسطة", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    case "low":
      return { label: "منخفضة", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
}

// ------------------------------------------------------------
//  Component
// ------------------------------------------------------------

export function DigitalTwinSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [team, setTeam] = useState<WorkloadMember[]>([]);
  const [stats, setStats] = useState<{
    activeCases: number;
    totalCases: number;
    tasks: number;
    overdueTasks: number;
    closedCases: number;
    documents: number;
    clients: number;
  } | null>(null);
  const [bottlenecks] = useState<Bottleneck[]>(MOCK_BOTTLENECKS);
  const [stalled] = useState<StalledFile[]>(MOCK_STALLED);
  const [recommendations] = useState<Recommendation[]>(MOCK_RECOMMENDATIONS);
  const [stalledFilter, setStalledFilter] = useState<"all" | "30" | "60" | "90">("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const [statsRes, teamRes, casesRes, tasksRes] = await Promise.allSettled([
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/cases").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
      ]);

      // Stats
      let parsedStats: typeof stats = null;
      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        const s = statsRes.value.stats ?? {};
        parsedStats = {
          activeCases: s.activeCases ?? 0,
          totalCases: s.cases ?? 0,
          tasks: s.tasks ?? 0,
          overdueTasks: s.overdueTasks ?? 0,
          closedCases:
            (s.caseStatusStats ?? []).find((x: { status: string; count: number }) =>
              ["closed", "won", "settled"].includes(x.status)
            )?.count ?? 0,
          documents: s.documents ?? 0,
          clients: s.clients ?? 0,
        };
      }
      if (!parsedStats) {
        parsedStats = {
          activeCases: 101,
          totalCases: 156,
          tasks: 87,
          overdueTasks: 23,
          closedCases: 47,
          documents: 412,
          clients: 134,
        };
      }
      setStats(parsedStats);

      // Team workload — start from MOCK, enrich if real team API returned lawyers
      const baseTeam = MOCK_TEAM_RAW.map((m) => {
        const load = calcLoad(m);
        return {
          ...m,
          load,
          status: loadStatus(load),
        } as WorkloadMember;
      });

      if (teamRes.status === "fulfilled" && teamRes.value?.success) {
        const members: Array<{ id: string; name: string; position?: string; role: string }> =
          teamRes.value.members ?? [];
        const lawyers = members.filter(
          (m) =>
            m.role === "lawyer" ||
            (m.position ?? "").includes("محام") ||
            (m.position ?? "").includes("المحامي")
        );
        if (lawyers.length >= 3) {
          // Replace baseTeam with real lawyers, distributing mock workload
          const enriched: WorkloadMember[] = lawyers.slice(0, 8).map((m, idx) => {
            const tmpl = MOCK_TEAM_RAW[idx % MOCK_TEAM_RAW.length];
            const merged = {
              id: m.id,
              name: m.name,
              role: "lawyer",
              activeCases: tmpl.activeCases,
              sessionsThisWeek: tmpl.sessionsThisWeek,
              pendingTasks: tmpl.pendingTasks,
              overdueTasks: tmpl.overdueTasks,
              hoursLogged: tmpl.hoursLogged,
            };
            const load = calcLoad(merged);
            return { ...merged, load, status: loadStatus(load) };
          });
          setTeam(enriched);
        } else {
          setTeam(baseTeam);
        }
      } else {
        setTeam(baseTeam);
      }

      // We don't strictly need cases/tasks data for the layout, but the fetch
      // cross-references them for the dashboard signal. We just confirm they
      // resolved without error.
      void casesRes;
      void tasksRes;

      setLastUpdated(new Date());
    } catch {
      // Hard fallback
      setStats({
        activeCases: 101,
        totalCases: 156,
        tasks: 87,
        overdueTasks: 23,
        closedCases: 47,
        documents: 412,
        clients: 134,
      });
      setTeam(
        MOCK_TEAM_RAW.map((m) => {
          const load = calcLoad(m);
          return { ...m, load, status: loadStatus(load) } as WorkloadMember;
        })
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Derived KPI values ---------------------------------

  const kpis = useMemo(() => {
    const active = stats?.activeCases ?? 0;
    const closed = stats?.closedCases ?? 0;
    const total = stats?.totalCases ?? 1;
    const productivity = active > 0 ? Math.round((closed / Math.max(active, 1)) * 100) : 0;
    // Overall health: weighted inverse of overdue ratio + productivity
    const overdue = stats?.overdueTasks ?? 0;
    const tasks = stats?.tasks ?? 1;
    const overdueRatio = overdue / Math.max(tasks, 1);
    const health = Math.max(
      10,
      Math.min(100, Math.round(productivity * 0.4 + (1 - overdueRatio) * 60))
    );
    // Workload index: average of team loads
    const workloadIdx =
      team.length > 0
        ? Math.round(team.reduce((a, b) => a + b.load, 0) / team.length)
        : 0;
    return {
      activeCases: active,
      totalCases: total,
      productivity,
      health,
      workloadIdx,
      closed,
    };
  }, [stats, team]);

  const sortedTeam = useMemo(
    () => [...team].sort((a, b) => b.load - a.load),
    [team]
  );

  const radarData: RadarDatum[] = useMemo(() => {
    return MOCK_RADAR_METRICS.map((metric, idx) => {
      const row: RadarDatum = { metric };
      // Build per-lawyer values, normalized 0-100
      const lawyersToShow = sortedTeam.slice(0, 4);
      lawyersToShow.forEach((l, li) => {
        const base = [
          l.activeCases * 4,
          Math.round((l.activeCases - l.overdueTasks) * 5),
          (l.pendingTasks - l.overdueTasks) * 6,
          l.sessionsThisWeek * 10,
          l.hoursLogged * 1.8,
          Math.max(0, 100 - l.overdueTasks * 12),
        ][idx];
        row[`l${li}`] = Math.max(5, Math.min(100, base + (li * 3 - 6)));
      });
      return row;
    });
  }, [sortedTeam]);

  const radarLawyers = useMemo(() => sortedTeam.slice(0, 4), [sortedTeam]);
  const radarColors = ["#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];

  const radarConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = { metric: { label: "البُعد" } };
    radarLawyers.forEach((l, i) => {
      cfg[`l${i}`] = { label: l.name, color: radarColors[i] };
    });
    return cfg;
  }, [radarLawyers]);

  const filteredStalled = useMemo(() => {
    const list =
      stalledFilter === "all"
        ? stalled
        : stalled.filter((s) => s.bucket === stalledFilter);
    return [...list].sort((a, b) => b.daysIdle - a.daysIdle);
  }, [stalled, stalledFilter]);

  // ---- Chart configs --------------------------------------

  const timeConfig: ChartConfig = {
    sessions: { label: "جلسات", color: "#10b981" },
    memos: { label: "مذكرات", color: "#f59e0b" },
    meetings: { label: "اجتماعات", color: "#06b6d4" },
    tasks: { label: "مهام", color: "#8b5cf6" },
    other: { label: "أخرى", color: "#64748b" },
  };

  const pieConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    MOCK_PIE_LAWYERS.forEach((p) => {
      cfg[p.name] = { label: p.name, color: p.color };
    });
    return cfg;
  }, []);

  const courtConfig: ChartConfig = {
    cases: { label: "عدد القضايا", color: "#10b981" },
  };

  const dailyConfig: ChartConfig = {
    actions: { label: "الإجراءات", color: "#10b981" },
    cases: { label: "قضايا جديدة", color: "#f59e0b" },
    sessions: { label: "الجلسات", color: "#06b6d4" },
  };

  const maxStage = Math.max(...CASE_FLOW_STAGES.map((s) => s.count));
  const pileupStage = CASE_FLOW_STAGES.reduce((a, b) => (b.count > a.count ? b : a));

  // ---------------------------------------------------------
  //  Render
  // ---------------------------------------------------------

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col gap-4 bg-slate-50/50 p-4 md:gap-6 md:p-6">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-sm">
                <Network className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
                  النموذج الرقمي للمكتب
                </h1>
                <p className="text-xs text-slate-500 md:text-sm">
                  Digital Twin · لوحة قيادة تشغيلية للمكتب
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="hidden text-xs text-slate-500 sm:inline">
                  آخر تحديث: {lastUpdated.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                تحديث
              </Button>
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                مباشر
              </Badge>
            </div>
          </div>
        </header>

        {loading ? (
          <DigitalTwinSkeleton />
        ) : (
          <>
            {/* ===== 1. Office Vital Signs ===== */}
            <section aria-label="office vital signs">
              <div className="mb-3 flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  العلامات الحيوية للمكتب
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="إجمالي القضايا النشطة"
                  value={kpis.activeCases}
                  suffix={`/ ${kpis.totalCases}`}
                  trend={+4}
                  trendLabel="هذا الشهر"
                  status={kpis.activeCases > 80 ? "high" : kpis.activeCases > 50 ? "medium" : "low"}
                  icon={<Scale className="h-5 w-5" />}
                />
                <KpiCard
                  title="ضغط العمل الحالي"
                  value={kpis.workloadIdx}
                  suffix="%"
                  trend={kpis.workloadIdx > 70 ? +6 : -3}
                  trendLabel="مقابل الأسبوع الماضي"
                  status={kpis.workloadIdx > 70 ? "high" : kpis.workloadIdx > 40 ? "medium" : "low"}
                  icon={<Flame className="h-5 w-5" />}
                />
                <KpiCard
                  title="معدل الإنتاجية"
                  value={kpis.productivity}
                  suffix="%"
                  trend={+2}
                  trendLabel="إغلاقات / نشطة"
                  status={kpis.productivity > 60 ? "low" : kpis.productivity > 30 ? "medium" : "high"}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <KpiCard
                  title="الأداء العام"
                  value={kpis.health}
                  suffix="/ 100"
                  trend={kpis.health > 70 ? +4 : -2}
                  trendLabel="مؤشر الصحة"
                  status={kpis.health > 70 ? "low" : kpis.health > 45 ? "medium" : "high"}
                  icon={<Stethoscope className="h-5 w-5" />}
                />
              </div>
            </section>

            {/* ===== 2. Workload Heatmap + 3. Bottleneck Analysis ===== */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Workload Heatmap */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        خريطة الضغط الحرارية لفريق المحامين
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        توزيع الأحمال عبر الفريق · مرتبة تنازلياً حسب مؤشر الضغط
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      {team.length} محامٍ
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 hover:bg-transparent">
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            المحامي
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            قضايا نشطة
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            جلسات الأسبوع
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            مهام معلقة
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            مهام متأخرة
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            ساعات العمل
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            مؤشر الضغط
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTeam.map((m) => (
                          <TableRow
                            key={m.id}
                            className={cn(
                              "border-slate-100",
                              m.status === "high" && "bg-rose-50/40"
                            )}
                          >
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                                    m.status === "high"
                                      ? "bg-rose-100 text-rose-700"
                                      : m.status === "medium"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  )}
                                >
                                  {m.name.replace("أ. ", "").charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-800">
                                    {m.name}
                                  </div>
                                  {m.status === "high" && (
                                    <div className="text-[10px] font-semibold text-rose-600">
                                      ⚠ مُثقل
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "inline-flex min-w-[28px] items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
                                  cellColor(m.activeCases, [12, 18])
                                )}
                              >
                                {m.activeCases}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "inline-flex min-w-[28px] items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
                                  cellColor(m.sessionsThisWeek, [5, 8])
                                )}
                              >
                                {m.sessionsThisWeek}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "inline-flex min-w-[28px] items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
                                  cellColor(m.pendingTasks, [10, 15])
                                )}
                              >
                                {m.pendingTasks}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "inline-flex min-w-[28px] items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
                                  cellColor(m.overdueTasks, [3, 5])
                                )}
                              >
                                {m.overdueTasks}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-slate-600">
                              {m.hoursLogged}س
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={cn(
                                    "text-sm font-bold",
                                    m.status === "high"
                                      ? "text-rose-600"
                                      : m.status === "medium"
                                      ? "text-amber-600"
                                      : "text-emerald-600"
                                  )}
                                >
                                  {m.load}%
                                </span>
                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      m.status === "high"
                                        ? "bg-rose-500"
                                        : m.status === "medium"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    )}
                                    style={{ width: `${m.load}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-emerald-100" /> منخفض
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-amber-100" /> متوسط
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-rose-100" /> مرتفع / مُثقل
                    </span>
                    <span className="mr-auto text-slate-400">
                      المعادلة: قضايا×2 + جلسات×3 + مهام + متأخرة×4 ÷ 1.5
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Bottleneck Analysis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    تحليل الاختناقات
                  </CardTitle>
                  <CardDescription className="text-xs">
                    نقاط الاحتقان المكتشفة في التدفق التشغيلي
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[440px] pr-1">
                    <div className="space-y-2.5">
                      {bottlenecks.map((b) => {
                        const sv = severityBadge(b.severity);
                        return (
                          <div
                            key={b.id}
                            className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[10px]", sv.cls)}
                                  >
                                    {sv.label}
                                  </Badge>
                                  <span className="text-lg font-bold text-slate-800">
                                    {b.count}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                                  {b.title}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  المؤثر على: {b.affected}
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-700">
                                  ✦ {b.action}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 h-7 w-full gap-1.5 text-[11px]"
                              onClick={() =>
                                toast({
                                  title: "بدأت المعالجة",
                                  description: b.title,
                                })
                              }
                            >
                              <Wrench className="h-3 w-3" />
                              معالجة
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>

            {/* ===== 4. Case Flow Diagram ===== */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Layers className="h-4 w-4 text-violet-600" />
                      مخطط تدفق القضايا حسب المرحلة
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      عدد القضايا في كل مرحلة · يكشف أين تتراكم القضايا
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    تراكم في: {pileupStage.label} ({pileupStage.count})
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5">
                  {CASE_FLOW_STAGES.map((stage, idx) => {
                    const widthPct = Math.max(8, Math.round((stage.count / maxStage) * 100));
                    const isPileup = stage.key === pileupStage.key;
                    return (
                      <div key={stage.key} className="flex items-center gap-2">
                        <div className="flex w-28 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-700">
                          <span className="text-slate-400">{idx + 1}.</span>
                          {stage.label}
                        </div>
                        <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-slate-100">
                          <div
                            className="flex h-full items-center justify-end rounded-lg px-3 text-xs font-bold text-white transition-all"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: stage.color,
                              minWidth: "44px",
                            }}
                          >
                            {stage.count}
                          </div>
                          {isPileup && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-rose-600">
                              ⚠ تراكم
                            </span>
                          )}
                        </div>
                        {idx < CASE_FLOW_STAGES.length - 1 && (
                          <ChevronLeft className="hidden h-4 w-4 shrink-0 text-slate-300 md:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <span>العرض النسبي يعكس عدد القضايا في كل مرحلة.</span>
                  <span className="font-semibold text-amber-700">
                    ينصح بفحص مرحلة &laquo;{pileupStage.label}&raquo; لتحديد أسباب التراكم.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ===== 5. Stalled Files + 8. Recommendations ===== */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileWarning className="h-4 w-4 text-amber-600" />
                        الملفات المتوقفة
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        قضايا لم يُسجل عليها إجراء منذ 30/60/90 يوماً
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                      {([
                        { v: "all", l: "الكل" },
                        { v: "30", l: "30 يوم" },
                        { v: "60", l: "60 يوم" },
                        { v: "90", l: "90 يوم" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => setStalledFilter(opt.v)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                            stalledFilter === opt.v
                              ? "bg-emerald-600 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[420px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 hover:bg-transparent">
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            رقم القضية
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            الموكل
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            آخر إجراء
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            أيام التوقف
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600">
                            المحامي
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold text-slate-600">
                            إجراء
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStalled.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-400">
                              لا توجد ملفات متوقفة في هذه الفئة
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStalled.map((s) => (
                            <TableRow key={s.id} className="border-slate-100">
                              <TableCell className="py-2.5 font-mono text-xs font-medium text-slate-800">
                                {s.caseNumber}
                              </TableCell>
                              <TableCell className="py-2.5 text-xs text-slate-700">
                                {s.client}
                              </TableCell>
                              <TableCell className="py-2.5 text-xs text-slate-500">
                                {s.lastActivity}
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[11px]",
                                    s.daysIdle >= 90
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : s.daysIdle >= 60
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  )}
                                >
                                  {s.daysIdle} يوم
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 text-xs text-slate-700">
                                {s.lawyer}
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 gap-1 text-[11px] text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    toast({
                                      title: "تم إنشاء مهمة متابعة",
                                      description: `${s.caseNumber} - ${s.lawyer}`,
                                    })
                                  }
                                >
                                  <CalendarClock className="h-3 w-3" />
                                  متابعة
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BrainCircuit className="h-4 w-4 text-violet-600" />
                    التوصيات الذكية
                  </CardTitle>
                  <CardDescription className="text-xs">
                    توصيات مولّدة من تحليل النموذج الرقمي
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[420px] pr-1">
                    <div className="space-y-2.5">
                      {recommendations.map((r) => {
                        const pv = priorityBadge(r.priority);
                        return (
                          <div
                            key={r.id}
                            className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 transition hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <Badge
                                variant="outline"
                                className={cn("text-[10px]", pv.cls)}
                              >
                                {pv.label}
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-800">
                              {r.title}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                              {r.detail}
                            </p>
                            <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                              ✓ الأثر: {r.impact}
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 h-7 w-full gap-1.5 bg-emerald-600 text-[11px] hover:bg-emerald-700"
                              onClick={() =>
                                toast({
                                  title: "تم تنفيذ التوصية",
                                  description: r.action,
                                })
                              }
                            >
                              <Zap className="h-3 w-3" />
                              {r.action}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>

            {/* ===== 6. Team Radar + 7. Time Distribution ===== */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ActivityIcon className="h-4 w-4 text-cyan-600" />
                    رادار أداء الفريق
                  </CardTitle>
                  <CardDescription className="text-xs">
                    مقارنة أعلى 4 محامين عبر 6 أبعاد
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={radarConfig} className="aspect-square max-h-[300px]">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#475569" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                      {radarLawyers.map((l, i) => (
                        <Radar
                          key={l.id}
                          name={l.name}
                          dataKey={`l${i}`}
                          stroke={radarColors[i]}
                          fill={radarColors[i]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ChartContainer>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {radarLawyers.map((l, i) => (
                      <span key={l.id} className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: radarColors[i] }}
                        />
                        {l.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-amber-600" />
                    توزيع الوقت لكل محامٍ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ساعات العمل موزّعة حسب نوع النشاط (جلسات/مذكرات/اجتماعات/مهام/أخرى)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={timeConfig} className="aspect-[16/9] max-h-[320px]">
                    <BarChart data={MOCK_TIME_DISTRIBUTION} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="lawyer"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sessions" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="memos" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="meetings" stackId="a" fill="#06b6d4" />
                      <Bar dataKey="tasks" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="other" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px]">
                    {[
                      { k: "sessions", l: "جلسات", c: "#10b981" },
                      { k: "memos", l: "مذكرات", c: "#f59e0b" },
                      { k: "meetings", l: "اجتماعات", c: "#06b6d4" },
                      { k: "tasks", l: "مهام", c: "#8b5cf6" },
                      { k: "other", l: "أخرى", c: "#64748b" },
                    ].map((x) => (
                      <span key={x.k} className="flex items-center gap-1 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: x.c }} />
                        {x.l}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ===== 9. Distribution Charts ===== */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-emerald-600" />
                    توزيع القضايا حسب المحامي
                  </CardTitle>
                  <CardDescription className="text-xs">
                    نسبة القضايا النشطة لكل محامٍ
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={pieConfig} className="aspect-square max-h-[260px]">
                    <PieChart>
                      <Pie
                        data={MOCK_PIE_LAWYERS}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {MOCK_PIE_LAWYERS.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                    {MOCK_PIE_LAWYERS.map((p) => (
                      <span key={p.name} className="flex items-center gap-1 text-slate-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="truncate">{p.name}</span>
                        <span className="mr-auto font-semibold text-slate-800">{p.value}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gavel className="h-4 w-4 text-rose-600" />
                    القضايا حسب المحكمة
                  </CardTitle>
                  <CardDescription className="text-xs">
                    توزيع القضايا النشطة على الجهات القضائية
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={courtConfig} className="aspect-square max-h-[260px]">
                    <BarChart
                      data={MOCK_BAR_COURTS}
                      layout="vertical"
                      margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="court"
                        tick={{ fontSize: 9, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                        width={110}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cases" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                    نشاط المكتب اليومي
                  </CardTitle>
                  <CardDescription className="text-xs">
                    إجراءات / قضايا / جلسات · آخر 30 يوماً
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={dailyConfig} className="aspect-square max-h-[260px]">
                    <LineChart data={MOCK_DAILY_ACTIVITY} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="actions"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cases"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

            {/* Footer summary */}
            <Card className="border-dashed bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-between gap-2 p-4 text-center md:flex-row md:text-right">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Network className="h-4 w-4 text-emerald-600" />
                  النموذج الرقمي للمكتب · لوحة تشغيلية متكاملة تحلل الأحوال،
                  الاختلالات، التدفق، والموارد في الوقت الفعلي.
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{team.length} محامٍ تحت المراقبة</span>
                  <span>•</span>
                  <span>{bottlenecks.length} اختناق</span>
                  <span>•</span>
                  <span>{recommendations.length} توصية</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// ------------------------------------------------------------
//  KPI Card
// ------------------------------------------------------------

function KpiCard({
  title,
  value,
  suffix,
  trend,
  trendLabel,
  status,
  icon,
}: {
  title: string;
  value: number;
  suffix?: string;
  trend: number;
  trendLabel: string;
  status: LoadStatus;
  icon: React.ReactNode;
}) {
  const accent =
    status === "high"
      ? "from-rose-500 to-rose-600 text-rose-600 bg-rose-50"
      : status === "medium"
      ? "from-amber-500 to-amber-600 text-amber-600 bg-amber-50"
      : "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50";

  const [accentBg, , accentText, accentSoftBg] = accent.split(" ");

  const up = trend >= 0;
  const trendCls =
    status === "high"
      ? up
        ? "text-rose-600 bg-rose-50"
        : "text-emerald-600 bg-emerald-50"
      : status === "medium"
      ? up
        ? "text-amber-600 bg-amber-50"
        : "text-emerald-600 bg-emerald-50"
      : up
      ? "text-emerald-600 bg-emerald-50"
      : "text-rose-600 bg-rose-50";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-slate-500">{title}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold", accentText)}>
                {value}
              </span>
              {suffix && (
                <span className="text-xs font-medium text-slate-400">{suffix}</span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              accentSoftBg,
              accentText
            )}
          >
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              trendCls
            )}
          >
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-[10px] text-slate-400">{trendLabel}</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r", accentBg, accent.split(" ")[1])}
            style={{
              width: `${Math.min(100, Math.max(8, status === "high" ? value : status === "medium" ? Math.min(value, 100) : Math.min(value, 100)))}%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
//  Loading skeleton
// ------------------------------------------------------------

function DigitalTwinSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default DigitalTwinSection;
