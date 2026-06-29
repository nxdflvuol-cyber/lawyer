"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Copy,
  Trash2,
  FileText,
  Scale,
  RefreshCw,
  User,
  Bot,
  CheckCircle,
  Zap,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  actions?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: { success: boolean; message?: string; error?: string };
  }>;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: string;
  createdAt: number;
}

const QUICK_PROMPTS = [
  { icon: Zap, label: "جلسات الغد", prompt: "ما هي الجلسات والمواعيد الموجودة غداً؟" },
  { icon: Zap, label: "المهام المتأخرة", prompt: "اعرض لي المهام المتأخرة" },
  { icon: Zap, label: "مستحقات متأخرة", prompt: "هل توجد مستحقات أو أتعاب متأخرة؟ اعرض تقرير" },
  { icon: Zap, label: "إحصائيات النظام", prompt: "أعطني إحصائيات عامة عن النظام" },
  { icon: Zap, label: "قضايا نشطة", prompt: "اعرض لي القضايا النشطة حالياً" },
  { icon: Zap, label: "ملخص مالي", prompt: "أعطني ملخص مالي شامل للنظام" },
  { icon: FileText, label: "صحيفة دعوى", prompt: "اكتب لي صحيفة دعوى مدنية كاملة مع الهيكل القانوني الصحيح" },
  { icon: Scale, label: "تحليل قضية", prompt: "أريد تحليل قضية واقتراح استراتيجية قانونية. سأعطيك تفاصيل القضية" },
  { icon: Sparkles, label: "صياغة عقد", prompt: "صُغ لي عقد بيع قانوني محكم. اسألني عن التفاصيل" },
  { icon: Brain, label: "استشارة قانونية", prompt: "أحتاج استشارة قانونية. سأشرح لك الموقف" },
];

export function AiThinkerSection() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseContext, setCaseContext] = useState<string | null>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // تحميل المحادثات من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shamel-ai-conversations");
      if (saved) {
        const parsed = JSON.parse(saved) as Conversation[];
        setConversations(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      } else {
        // إنشاء محادثة أولى
        const initial: Conversation = {
          id: Math.random().toString(36).slice(2),
          title: "محادثة جديدة",
          messages: [],
          createdAt: Date.now(),
        };
        setConversations([initial]);
        setActiveId(initial.id);
      }
    } catch {
      // ignore
    }
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("shamel-ai-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  // التمرير لأسفل عند الرسائل الجديدة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, conversations, loading]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // جلب القضايا لاختيار السياق
  const { data: casesData } = useQuery({
    queryKey: ["cases-for-context"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });

  function newConversation() {
    const conv: Conversation = {
      id: Math.random().toString(36).slice(2),
      title: "محادثة جديدة",
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setCaseContext(null);
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        setActiveId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  }

  async function sendMessage(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    // تحديث المحادثة الحالية برسالة المستخدم
    let updatedMessages: ChatMessage[] = [];
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          updatedMessages = [...c.messages, userMessage];
          return {
            ...c,
            messages: updatedMessages,
            title: c.messages.length === 0 ? messageText.slice(0, 40) : c.title,
          };
        }
        return c;
      })
    );

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context: caseContext,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error ?? "فشل الطلب");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
        actions: data.actions ?? [],
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "خطأ غير معروف";
      toast({
        title: "خطأ في المفكر القانوني",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function loadCaseContext(caseId: string) {
    const caseItem = casesData?.cases?.find((c: { id: string }) => c.id === caseId);
    if (caseItem) {
      const context = `القضية رقم: ${caseItem.internalNumber}
النوع: ${caseItem.caseType}
الموكل: ${(caseItem.client as { fullName?: string })?.fullName ?? "غير محدد"}
الخصم: ${caseItem.opponentName ?? "غير محدد"}
المحكمة: ${caseItem.court ?? "غير محدد"}
درجة التقاضي: ${caseItem.degree}
الوقائع: ${caseItem.facts ?? "غير محددة"}
الاستراتيجية الحالية: ${caseItem.strategy ?? "غير محددة"}`;
      setCaseContext(context);
      setCaseDialogOpen(false);
      toast({
        title: "تم تحميل سياق القضية",
        description: `سيتم توجيه المفكر ببيانات القضية ${caseItem.internalNumber}`,
      });
    }
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "تم النسخ", description: "تم نسخ النص إلى الحافظة" });
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* الشريط الجانبي - المحادثات */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2 hidden md:flex">
        <Button onClick={newConversation} className="w-full">
          <Plus className="w-4 h-4 ml-2" />
          محادثة جديدة
        </Button>
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              المحادثات السابقة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {conversations.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  لا توجد محادثات
                </p>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition",
                        conv.id === activeId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setActiveId(conv.id)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* منطقة المحادثة الرئيسية */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* الرأس */}
        <CardHeader className="py-3 border-b border-border flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                المفكر القانوني الذكي
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 ml-1" />
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                {caseContext ? "سياق قضية محمّل" : "عقل قانوني افتراضي متطور"}
              </p>
            </div>
          </div>
          <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 ml-2" />
                تحميل سياق قضية
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>اختر قضية لتحميل سياقها</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {casesData?.cases?.length > 0 ? (
                    casesData.cases.map((c: { id: string; internalNumber: string; caseType: string; client?: { fullName?: string } }) => (
                      <button
                        key={c.id}
                        onClick={() => loadCaseContext(c.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent text-right"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{c.internalNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.client?.fullName ?? "—"} • {c.caseType}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      لا توجد قضايا مسجلة
                    </p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* الرسائل */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConversation?.messages.length === 0 || !activeConversation ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">المفكر القانوني الذكي</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                مساعدك القانوني الشخصي. يمكنه صياغة العقود والمذكرات، تحليل القضايا،
                اقتراح الاستراتيجيات، وتقديم الاستشارات القانونية.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl">
                {QUICK_PROMPTS.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.label}
                      onClick={() => sendMessage(prompt.prompt)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition text-center"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium">{prompt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-primary/30 to-accent/30"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "group relative max-w-[80%] rounded-2xl p-4",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {/* عرض الإجراءات المنفذة */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            إجراءات منفذة ({msg.actions.length}):
                          </p>
                          {msg.actions.map((action, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded text-xs",
                                action.result.success
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                              )}
                            >
                              {action.result.success ? (
                                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span className="font-medium">{getToolLabel(action.tool)}</span>
                              <span className="opacity-70">— {action.result.message ?? action.result.error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <button
                    onClick={() => copyMessage(msg.content)}
                    className="absolute -bottom-2 -left-2 opacity-0 group-hover:opacity-100 transition bg-background border border-border rounded-md p-1 shadow-sm"
                    title="نسخ"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* مؤشر الكتابة */}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">المفكر يفكر...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* صندوق الإدخال */}
        <div className="border-t border-border p-3 space-y-2">
          {caseContext && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-2 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="flex-1">سياق قضية محمّل - سيستخدم المفكر بياناتها في ردوده</span>
              <button onClick={() => setCaseContext(null)} className="hover:underline">
                إزالة
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك أو طلبك القانوني..."
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="self-end h-11 w-11"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            المفكر القانوني يعمل بالذكاء الاصطناعي - يقدم استشارات قانونية احترافية بالعربية
          </p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// دالة مساعدة لعرض اسم الأداة بالعربية
// ============================================================
function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    search_cases: "بحث في القضايا",
    get_case_details: "تفاصيل قضية",
    create_case: "إنشاء قضية",
    update_case: "تحديث قضية",
    add_session: "تسجيل جلسة",
    postpone_session: "تأجيل جلسة",
    search_clients: "بحث في الموكلين",
    get_client_details: "تفاصيل موكل",
    create_client: "إنشاء موكل",
    search_documents: "بحث في المستندات",
    create_task: "إنشاء مهمة",
    list_tasks: "عرض المهام",
    list_appointments: "عرض المواعيد",
    create_appointment: "إنشاء موعد",
    get_finance_summary: "ملخص مالي",
    get_overdue_payments: "مستحقات متأخرة",
    get_stats: "إحصائيات",
  };
  return labels[toolName] ?? toolName;
}
