"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Brain,
  Send,
  Loader2,
  Cpu,
  Network,
  Workflow,
  Activity,
  ChevronDown,
  ChevronRight,
  Zap,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Users,
  FileText,
  Scale,
  ShieldCheck,
  TrendingUp,
  PenLine,
  FileSignature,
  GitBranch,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// أيقونات المجالات
const DOMAIN_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  case: Scale,
  document: FileText,
  search: Search,
  memo: PenLine,
  client: Users,
  contract: FileSignature,
  compliance: ShieldCheck,
  analytics: TrendingUp,
  workflow: GitBranch,
};

const DOMAIN_LABELS: Record<string, string> = {
  case: "القضايا",
  document: "المستندات",
  search: "البحث",
  memo: "المذكرات",
  client: "الموكلين",
  contract: "العقود",
  compliance: "الامتثال",
  analytics: "التحليلات",
  workflow: "سير العمل",
};

const DOMAIN_COLORS: Record<string, string> = {
  case: "from-rose-500 to-pink-600",
  document: "from-amber-500 to-orange-600",
  search: "from-cyan-500 to-blue-600",
  memo: "from-violet-500 to-purple-600",
  client: "from-emerald-500 to-teal-600",
  contract: "from-fuchsia-500 to-pink-600",
  compliance: "from-red-500 to-rose-600",
  analytics: "from-indigo-500 to-violet-600",
  workflow: "from-slate-500 to-gray-600",
};

// مراحل الـ Pipeline
const PIPELINE_STAGES = [
  { id: 1, name: "كشف النية", name_en: "Intent Detection", icon: Sparkles },
  { id: 2, name: "كشف السياق", name_en: "Context Detection", icon: Network },
  { id: 3, name: "الذاكرة", name_en: "Memory", icon: Brain },
  { id: 4, name: "قاعدة المعرفة", name_en: "Knowledge Base", icon: FileText },
  { id: 5, name: "محلل القضايا", name_en: "Case Analyzer", icon: Scale },
  { id: 6, name: "محلل سير العمل", name_en: "Workflow Analyzer", icon: Workflow },
  { id: 7, name: "محلل المستندات", name_en: "Document Analyzer", icon: FileText },
  { id: 8, name: "محلل العلاقات", name_en: "Relationship Analyzer", icon: GitBranch },
  { id: 9, name: "دعم القرار", name_en: "Decision Support", icon: ShieldCheck },
  { id: 10, name: "المخطط", name_en: "Planner", icon: Cpu },
  { id: 11, name: "المنفذ", name_en: "Executor", icon: Zap },
  { id: 12, name: "مولد الرد", name_en: "Response Generator", icon: Send },
];

// أنواع
interface AgentDef {
  id: string;
  name: string;
  name_en: string;
  domain: string;
  description: string;
  capabilities: string[];
  tools: string[];
  when_to_use: string;
}

interface StageTrace {
  stage: string;
  status: "completed" | "skipped" | "error";
  duration_ms: number;
  summary: string;
  data?: unknown;
}

interface BrainResponse {
  answer: string;
  confidence: number;
  sources: Array<{ type: string; title: string; reference?: string }>;
  follow_up_suggestions: string[];
  pipeline_trace: {
    stages: StageTrace[];
    total_duration_ms: number;
    agents_invoked: string[];
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  response?: BrainResponse;
}

export function LegalBrainSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [stats, setStats] = useState({ total_agents: 33, domains: 9, pipeline_stages: 12 });
  const [agentsByDomain, setAgentsByDomain] = useState<Record<string, AgentDef[]>>({});
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "agents" | "pipeline">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`brain-${Date.now()}`);

  // تحميل الوكلاء والإحصائيات
  useEffect(() => {
    loadAgents();
    loadStats();
  }, []);

  // التمرير لأسفل عند رسالة جديدة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function loadAgents() {
    try {
      const res = await fetch("/api/legal-brain/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents_by_domain?.flatMap((d: any) => d.agents) ?? []);
        const byDomain: Record<string, AgentDef[]> = {};
        data.agents_by_domain?.forEach((d: any) => {
          byDomain[d.domain] = d.agents;
        });
        setAgentsByDomain(byDomain);
      }
    } catch {}
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/legal-brain/stats");
      const data = await res.json();
      if (data.success) setStats(data);
    } catch {}
  }

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/legal-brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: sessionIdRef.current,
          history: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const aiMsg: ChatMessage = {
          role: "assistant",
          content: data.response.answer,
          response: data.response,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `خطأ: ${data.error ?? "تعذر المعالجة"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `خطأ في الاتصال: ${
            error instanceof Error ? error.message : "غير معروف"
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // الردود المقترحة السريعة
  const quickPrompts = [
    "ما هي القضايا الجارية حالياً؟",
    "حلل آخر قضية وأعطني استراتيجية",
    "ما هي المهام العاجلة؟",
    "ابحث عن سوابق قضائية في النصب",
  ];

  return (
    <div className="space-y-4">
      {/* رأس العقل القانوني */}
      <BrainHeader stats={stats} />

      {/* التبويبات */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <TabButton
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          icon={Brain}
          label="المحادثة"
        />
        <TabButton
          active={activeTab === "agents"}
          onClick={() => setActiveTab("agents")}
          icon={Cpu}
          label={`الوكلاء (${agents.length || stats.total_agents})`}
        />
        <TabButton
          active={activeTab === "pipeline"}
          onClick={() => setActiveTab("pipeline")}
          icon={Workflow}
          label="المراحل الـ12"
        />
      </div>

      {/* محتوى التبويب */}
      {activeTab === "chat" && (
        <ChatTab
          messages={messages}
          loading={loading}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          scrollRef={scrollRef}
          quickPrompts={quickPrompts}
          onSuggestionClick={(p) => setInput(p)}
        />
      )}

      {activeTab === "agents" && (
        <AgentsTab
          agentsByDomain={agentsByDomain}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          expandedAgent={expandedAgent}
          setExpandedAgent={setExpandedAgent}
        />
      )}

      {activeTab === "pipeline" && (
        <PipelineTab messages={messages} />
      )}
    </div>
  );
}

// ============================================================
// رأس العقل القانوني
// ============================================================
function BrainHeader({ stats }: { stats: { total_agents: number; domains: number; pipeline_stages: number } }) {
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-l from-primary/5 via-card to-card">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      <CardContent className="relative p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Brain className="w-9 h-9 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">العقل القانوني</h1>
              <p className="text-sm text-muted-foreground">
                Legal Brain - نظام ذكاء اصطناعي مؤسسي متكامل
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatChip icon={Cpu} value={stats.total_agents} label="وكيل" color="text-violet-600" />
            <StatChip icon={Workflow} value={stats.pipeline_stages} label="مرحلة" color="text-cyan-600" />
            <StatChip icon={Network} value={stats.domains} label="مجال" color="text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({ icon: Icon, value, label, color }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-sm">
      <Icon className={cn("w-5 h-5", color)} />
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// ============================================================
// زر التبويب
// ============================================================
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ============================================================
// تبويب المحادثة
// ============================================================
function ChatTab({
  messages,
  loading,
  input,
  setInput,
  sendMessage,
  scrollRef,
  quickPrompts,
  onSuggestionClick,
}: {
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  quickPrompts: string[];
  onSuggestionClick: (p: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* منطقة المحادثة */}
      <Card className="lg:col-span-2 flex flex-col h-[70vh]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-primary" />
            محادثة مع العقل القانوني
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* الرسائل */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">العقل القانوني جاهز</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-1">
                    33 وكيل متخصص و12 مرحلة تحليل تحت تصرفك. اطرح سؤالك القانوني.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => onSuggestionClick(p)}
                      className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>العقل القانوني يفكر... يجري 12 مرحلة تحليل</span>
              </div>
            )}
          </div>

          {/* الإدخال */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="اكتب سؤالك القانوني..."
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* لوحة تتبع الـ Pipeline */}
      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            تتبع المراحل
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <PipelineTracePanel messages={messages} loading={loading} />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// فقاعة الرسالة
// ============================================================
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-bl-sm"
            : "bg-muted rounded-br-sm"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
      </div>

      {/* بيانات الرد للـ AI */}
      {!isUser && msg.response && (
        <div className="w-full max-w-[85%] space-y-2">
          {/* شريط الثقة + المراحل */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                msg.response.confidence > 0.7
                  ? "text-emerald-600 border-emerald-300"
                  : msg.response.confidence > 0.4
                    ? "text-amber-600 border-amber-300"
                    : "text-red-600 border-red-300"
              )}
            >
              <Sparkles className="w-2.5 h-2.5 ml-1" />
              ثقة {Math.round(msg.response.confidence * 100)}%
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <Clock className="w-2.5 h-2.5 ml-1" />
              {msg.response.pipeline_trace.total_duration_ms}ms
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <Cpu className="w-2.5 h-2.5 ml-1" />
              {msg.response.pipeline_trace.agents_invoked.length} وكيل
            </Badge>
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
            >
              {showTrace ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              التفاصيل
            </button>
          </div>

          {/* المصادر */}
          {msg.response.sources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {msg.response.sources.slice(0, 5).map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                  {s.type === "case" ? <Scale className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                  {s.title.slice(0, 30)}
                </Badge>
              ))}
            </div>
          )}

          {/* اقتراحات المتابعة */}
          {msg.response.follow_up_suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {msg.response.follow_up_suggestions.map((s, i) => (
                <button
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-md bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* تتبع المراحل */}
          {showTrace && (
            <div className="rounded-lg border border-border bg-card/50 p-3 space-y-1.5">
              <div className="text-[10px] font-bold text-muted-foreground mb-1">
                المراحل الـ12:
              </div>
              {msg.response.pipeline_trace.stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {stage.status === "completed" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  ) : stage.status === "error" ? (
                    <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground flex-shrink-0" />
                  )}
                  <span className="font-medium flex-1 truncate">{stage.stage}</span>
                  <span className="text-muted-foreground">{stage.duration_ms}ms</span>
                  <span className="text-muted-foreground truncate max-w-[120px]">{stage.summary}</span>
                </div>
              ))}
              {msg.response.pipeline_trace.agents_invoked.length > 0 && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="text-[10px] font-bold text-muted-foreground mb-1">
                    الوكلاء المنفذون:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {msg.response.pipeline_trace.agents_invoked.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        <Cpu className="w-2.5 h-2.5 ml-1" />
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// لوحة تتبع المراحل (جانبية)
// ============================================================
function PipelineTracePanel({ messages, loading }: { messages: ChatMessage[]; loading: boolean }) {
  const lastResponse = [...messages].reverse().find((m) => m.response)?.response;

  if (loading && !lastResponse) {
    return (
      <div className="space-y-2">
        {PIPELINE_STAGES.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span className="text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    );
  }

  if (!lastResponse) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        <Workflow className="w-10 h-10 mx-auto mb-2 opacity-30" />
        ستظهر هنا مراحل التحليل الـ12 بعد أول سؤال
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold mb-2 text-muted-foreground">
        آخر تحليل ({lastResponse.pipeline_trace.total_duration_ms}ms)
      </div>
      {PIPELINE_STAGES.map((stage, i) => {
        const trace = lastResponse.pipeline_trace.stages[i];
        const Icon = stage.icon;
        return (
          <div
            key={stage.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs border",
              trace?.status === "completed"
                ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900"
                : trace?.status === "error"
                  ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                  : "border-border"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              trace?.status === "completed"
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{stage.name}</div>
              {trace?.summary && (
                <div className="text-[10px] text-muted-foreground truncate">{trace.summary}</div>
              )}
            </div>
            {trace && (
              <span className="text-[10px] text-muted-foreground">{trace.duration_ms}ms</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// تبويب الوكلاء
// ============================================================
function AgentsTab({
  agentsByDomain,
  selectedDomain,
  setSelectedDomain,
  expandedAgent,
  setExpandedAgent,
}: {
  agentsByDomain: Record<string, AgentDef[]>;
  selectedDomain: string | null;
  setSelectedDomain: (d: string | null) => void;
  expandedAgent: string | null;
  setExpandedAgent: (id: string | null) => void;
}) {
  const domains = Object.keys(agentsByDomain);

  return (
    <div className="space-y-4">
      {/* فلاتر المجال */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDomain(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            !selectedDomain
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted border-border"
          )}
        >
          الكل
        </button>
        {domains.map((d) => {
          const Icon = DOMAIN_ICON[d] ?? Cpu;
          return (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedDomain === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted border-border"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {DOMAIN_LABELS[d] ?? d}
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                {agentsByDomain[d]?.length ?? 0}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* شبكة الوكلاء */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(selectedDomain
          ? agentsByDomain[selectedDomain] ?? []
          : domains.flatMap((d) => agentsByDomain[d] ?? [])
        ).map((agent) => {
          const Icon = DOMAIN_ICON[agent.domain] ?? Cpu;
          const isExpanded = expandedAgent === agent.id;
          return (
            <Card
              key={agent.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isExpanded && "ring-2 ring-primary/40"
              )}
              onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    DOMAIN_COLORS[agent.domain] ?? "from-slate-400 to-slate-600"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{agent.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{agent.name_en}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{agent.description}</p>

                {isExpanded && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-border">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground mb-1">القدرات:</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground mb-1">الأدوات:</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] font-mono">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
                      <Zap className="w-3 h-3 inline ml-1 text-amber-500" />
                      {agent.when_to_use}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {DOMAIN_LABELS[agent.domain]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {isExpanded ? "إغلاق" : "تفاصيل"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// تبويب المراحل
// ============================================================
function PipelineTab({ messages }: { messages: ChatMessage[] }) {
  const lastResponse = [...messages].reverse().find((m) => m.response)?.response;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Workflow className="w-4 h-4 text-primary" />
            خط أنابيب العقل القانوني - 12 مرحلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const trace = lastResponse?.pipeline_trace.stages[i];
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "relative rounded-xl border p-3 transition-all",
                    trace?.status === "completed"
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      trace?.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-primary/10 text-primary"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {String(stage.id).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs">{stage.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-1">{stage.name_en}</p>
                  {trace ? (
                    <div className="mt-1 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1 text-[10px]">
                        {trace.status === "completed" ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-2.5 h-2.5 text-red-500" />
                        )}
                        <span className="text-muted-foreground">{trace.duration_ms}ms</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate mt-0.5">{trace.summary}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/60 mt-1">بانتظار الاستخدام</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* مخطط التدفق */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            مسار التدفق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-1">
                <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium whitespace-nowrap">
                  {stage.name}
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground rotate-180" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-bold text-foreground mb-1">كيف يعمل العقل القانوني؟</p>
            <p>
              يمر كل طلب بـ 12 مرحلة تحليل متسلسلة: من كشف نية المستخدم، إلى استرجاع الذاكرة والمعرفة،
              ثم تحليل القضايا والمستندات والعلاقات، وصولاً إلى دعم القرار والتخطيط والتنفيذ عبر الوكلاء المتخصصين،
              وأخيراً توليد رد متماسك مع تتبع كامل لكل مرحلة.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
