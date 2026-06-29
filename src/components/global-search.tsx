"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Briefcase, Users, FileText, CheckSquare, Calendar } from "lucide-react";
import { useNavStore } from "@/lib/stores";
import { formatDate } from "@/lib/constants";

interface SearchResult {
  type: "case" | "client" | "document" | "task" | "appointment";
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
}

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
        const [casesRes, clientsRes, tasksRes] = await Promise.all([
          fetch(`/api/cases?search=${encodeURIComponent(query)}`).then((r) => r.json()),
          fetch(`/api/clients?search=${encodeURIComponent(query)}`).then((r) => r.json()),
          fetch(`/api/tasks?search=${encodeURIComponent(query)}`).then((r) => r.json()),
        ]);

        const mapped: SearchResult[] = [
          ...(casesRes.cases ?? []).slice(0, 5).map((c: Record<string, unknown>) => ({
            type: "case" as const,
            id: c.id as string,
            title: `قضية ${c.internalNumber}`,
            subtitle: (c.client as { fullName?: string })?.fullName ?? "—",
            meta: c.opponentName as string,
          })),
          ...(clientsRes.clients ?? []).slice(0, 5).map((c: Record<string, unknown>) => ({
            type: "client" as const,
            id: c.id as string,
            title: c.fullName as string,
            subtitle: c.idNumber as string ?? "—",
            meta: c.phone as string,
          })),
          ...(tasksRes.tasks ?? []).slice(0, 5).map((t: Record<string, unknown>) => ({
            type: "task" as const,
            id: t.id as string,
            title: t.title as string,
            subtitle: "مهمة",
            meta: t.dueDate ? formatDate(t.dueDate as string) : "",
          })),
        ];
        setResults(mapped);
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
    }
    onOpenChange(false);
  }

  const ICONS = {
    case: Briefcase,
    client: Users,
    document: FileText,
    task: CheckSquare,
    appointment: Calendar,
  };

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
            placeholder="ابحث في القضايا، الموكلين، المهام..."
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
              {results.map((r) => {
                const Icon = ICONS[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent text-right transition"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
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
