"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Briefcase, Users, FileText, CheckSquare, Calendar,
  FileCheck, BookOpen, FileImage,
} from "lucide-react";
import { useNavStore } from "@/lib/stores";

interface SearchResult {
  type: "case" | "client" | "document" | "task" | "appointment" | "precase" | "library";
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
}

const ICONS: Record<string, typeof Briefcase> = {
  case: Briefcase,
  client: Users,
  document: FileText,
  task: CheckSquare,
  appointment: Calendar,
  precase: FileCheck,
  library: BookOpen,
};

const TYPE_LABELS: Record<string, string> = {
  case: "قضية",
  client: "موكل",
  document: "مستند",
  task: "مهمة",
  appointment: "موعد",
  precase: "ملف تجهيز",
  library: "مرجع قانوني",
};

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const setSection = useNavStore((s) => s.setSection);
  const selectCase = useNavStore((s) => s.selectCase);
  const selectClient = useNavStore((s) => s.selectClient);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        // استخدام Smart Search API الجديد
        const res = await fetch(`/api/smart-search?q=${encodeURIComponent(query)}&limit=30`);
        const data = await res.json();

        if (data.success) {
          setResults(data.results ?? []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleResultClick(result: SearchResult) {
    if (result.type === "case") {
      selectCase(result.id);
      setSection("cases");
    } else if (result.type === "client") {
      selectClient(result.id);
      setSection("clients");
    } else if (result.type === "task") {
      setSection("tasks");
    } else if (result.type === "precase") {
      setSection("precases");
    } else if (result.type === "document") {
      setSection("documents");
    } else if (result.type === "library") {
      setSection("research");
    } else if (result.type === "appointment") {
      setSection("appointments");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>بحث شامل</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القضايا، الموكلين، المستندات، المهام، المكتبة القانونية..."
            className="pr-10"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-96">
          {loading && <p className="p-4 text-center text-sm text-muted-foreground">جارٍ البحث...</p>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, i) => {
                const Icon = ICONS[r.type] ?? FileImage;
                return (
                  <button
                    key={`${r.type}-${r.id}-${i}`}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent text-right transition"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {TYPE_LABELS[r.type] ?? r.type}
                    </span>
                    {r.meta && (
                      <span className="text-xs text-muted-foreground">{r.meta}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
