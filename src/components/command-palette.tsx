"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavStore, useAuthStore } from "@/lib/stores";
import { SECTIONS } from "@/lib/constants";
import { hasAccess } from "@/lib/permissions";
import {
  Search,
  Briefcase,
  Users,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  Brain,
  Settings,
  Plus,
  ArrowRight,
  Command,
  FileCheck,
  Scale,
  PenLine,
  Gavel,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  category: "navigation" | "create" | "action";
  keywords: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const setSection = useNavStore((s) => s.setSection);
  const userRole = useAuthStore((s) => s.user?.role ?? "member");

  // فتح/إغلاق بـ Ctrl+K أو Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // focus على الـ input عند الفتح
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
       
      setSelectedIndex(0);
    }
  }, [open]);

  // بناء قائمة الأوامر
  const commands: CommandItem[] = [
    // التنقل
    ...SECTIONS.filter((s) => s.id !== "logout" && hasAccess(userRole, s.id)).map((s) => ({
      id: `nav-${s.id}`,
      label: s.label,
      description: s.description,
      icon: s.icon,
      action: () => {
        setSection(s.id);
        setOpen(false);
      },
      category: "navigation" as const,
      keywords: [s.label, s.description, s.id],
    })),
    // إنشاء
    {
      id: "create-case",
      label: "إنشاء قضية جديدة",
      description: "افتح نموذج إنشاء قضية",
      icon: Briefcase,
      action: () => { setSection("cases"); setOpen(false); },
      category: "create",
      keywords: ["قضية", "جديدة", "case", "create", "إنشاء", "افتح"],
    },
    {
      id: "create-precase",
      label: "ملف إجراءات ما قبل رفع الدعوى",
      description: "إنشاء ملف تجهيز جديد",
      icon: FileCheck,
      action: () => { setSection("precases"); setOpen(false); },
      category: "create",
      keywords: ["تجهيز", "precase", "ما قبل", "دعوى", "إجراءات"],
    },
    {
      id: "create-client",
      label: "إضافة موكل جديد",
      description: "افتح نموذج إضافة موكل",
      icon: Users,
      action: () => { setSection("clients"); setOpen(false); },
      category: "create",
      keywords: ["موكل", "عميل", "client", "جديد", "إضافة"],
    },
    {
      id: "create-task",
      label: "إضافة مهمة جديدة",
      description: "إنشاء مهمة جديدة",
      icon: CheckSquare,
      action: () => { setSection("tasks"); setOpen(false); },
      category: "create",
      keywords: ["مهمة", "task", "تذكير", "جديدة"],
    },
    {
      id: "create-appointment",
      label: "إضافة موعد جديد",
      description: "جدولة موعد جديد",
      icon: Calendar,
      action: () => { setSection("appointments"); setOpen(false); },
      category: "create",
      keywords: ["موعد", "جلسة", "appointment", "جدولة"],
    },
    // إجراءات
    {
      id: "ai-consult",
      label: "استشارة قانونية بالذكاء الاصطناعي",
      description: "افتح المفكر القانوني الذكي",
      icon: Brain,
      action: () => { setSection("ai-thinker"); setOpen(false); },
      category: "action",
      keywords: ["استشارة", "ذكاء", "اصطناعي", "ai", "سؤال", "قانون"],
    },
    {
      id: "draft-memo",
      label: "صياغة مذكرة قانونية",
      description: "افتح محرر المذكرات",
      icon: PenLine,
      action: () => { setSection("memo-editor"); setOpen(false); },
      category: "action",
      keywords: ["مذكرة", "صياغة", "محرر", "كتابة", "memo"],
    },
    {
      id: "pleading-assist",
      label: "مساعد المرافعة",
      description: "توليد نقاط المرافعة",
      icon: Gavel,
      action: () => { setSection("pleading"); setOpen(false); },
      category: "action",
      keywords: ["مرافعة", "جلسة", "دفاع", "pleading"],
    },
    {
      id: "finance-report",
      label: "التقارير المالية",
      description: "عرض التقارير المالية",
      icon: DollarSign,
      action: () => { setSection("finance"); setOpen(false); },
      category: "action",
      keywords: ["مالية", "تقارير", "أتعاب", "دخل", "finance"],
    },
  ];

  // فلترة الأوامر حسب البحث
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  // التنقل بالأسهم
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) cmd.action();
      }
    },
    [filteredCommands, selectedIndex]
  );

  // إعادة تعيين التحديد عند تغيير البحث
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [query]);

  const categoryLabels: Record<string, string> = {
    navigation: "التنقل",
    create: "إنشاء",
    action: "إجراءات",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب أمراً أو ابحث... (مثلاً: أنشئ قضية، افتح الموكلين)"
              className="border-0 p-0 h-auto text-base focus-visible:ring-0"
            />
            <kbd className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
              ESC
            </kbd>
          </div>

          <ScrollArea className="max-h-[400px]">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                لا توجد نتائج لـ &quot;{query}&quot;
              </div>
            ) : (
              <div className="p-2">
                {(["navigation", "create", "action"] as const).map((cat) => {
                  const items = filteredCommands.filter((c) => c.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="mb-2">
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryLabels[cat]}
                      </p>
                      {items.map((cmd) => {
                        const Icon = cmd.icon;
                        const idx = filteredCommands.indexOf(cmd);
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2.5 rounded-md text-right transition",
                              selectedIndex === idx
                                ? "bg-accent"
                                : "hover:bg-accent/50"
                            )}
                          >
                            <div className={cn(
                              "p-1.5 rounded-lg flex-shrink-0",
                              cmd.category === "create"
                                ? "bg-emerald-50 text-emerald-600"
                                : cmd.category === "action"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-primary/10 text-primary"
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{cmd.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                            </div>
                            {selectedIndex === idx && (
                              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd>
                تنقل
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd>
                تنفيذ
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              Command Palette
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
