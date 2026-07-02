"use client";

// ============================================================
// Smart Sidebar - شريط جانبي سياقي
// يتغير حسب الكيان المفتوح حالياً (قضية / موكل / مستند)
// ============================================================

import { useEffect, useState } from "react";
import {
  Scale,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  Gavel,
  Brain,
  History,
  FileCheck,
  Building2,
  ShieldAlert,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/lib/stores";

interface SmartSidebarProps {
  // نوع السياق الحالي
  contextType: "case" | "client" | "document" | "precase" | null;
  // معرف الكيان
  entityId?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  color?: string;
  onClick?: () => void;
}

export function SmartSidebar({ contextType, entityId }: SmartSidebarProps) {
  const setSection = useNavStore((s) => s.setSection);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!entityId || !contextType) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const endpoint =
          contextType === "case" ? `/api/cases/${entityId}`
          : contextType === "client" ? `/api/clients/${entityId}`
          : contextType === "document" ? `/api/documents/${entityId}`
          : `/api/precases/${entityId}`;
        const res = await fetch(endpoint);
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json[contextType] ?? json.client ?? json.case ?? json.document ?? json.preCase);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [contextType, entityId]);

  if (!contextType) {
    return (
      <div className="w-full p-4 text-center text-xs text-muted-foreground">
        <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
        الشريط الذكي يظهر عند فتح قضية أو موكل
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {contextType === "case" && <CaseContext data={data} setSection={setSection} />}
          {contextType === "client" && <ClientContext data={data} setSection={setSection} />}
          {contextType === "document" && <DocumentContext data={data} setSection={setSection} />}
          {contextType === "precase" && <PreCaseContext data={data} setSection={setSection} />}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// سياق القضية
// ============================================================
function CaseContext({ data, setSection }: { data: any; setSection: (s: any) => void }) {
  if (!data) return null;
  const items: SidebarItem[] = [
    { id: "client", label: "الموكل", sublabel: data.client?.fullName, icon: Users, color: "text-emerald-600" },
    { id: "sessions", label: "الجلسات القادمة", badge: data.sessions?.length ?? 0, icon: Calendar, color: "text-amber-600" },
    { id: "tasks", label: "المهام", badge: data.tasks?.length ?? 0, icon: CheckSquare, color: "text-cyan-600" },
    { id: "documents", label: "المستندات", badge: data.documentLinks?.length ?? 0, icon: FileText, color: "text-violet-600" },
    { id: "judgments", label: "الأحكام", icon: Gavel, color: "text-rose-600" },
    { id: "timeline", label: "الخط الزمني", icon: History, color: "text-slate-600" },
    { id: "ai", label: "المساعد الذكي", icon: Brain, color: "text-primary" },
  ];

  return (
    <>
      <ContextHeader
        icon={Scale}
        title={data.internalNumber ?? "قضية"}
        subtitle={data.subject ?? data.caseType}
        status={data.status}
      />
      <ItemsList items={items} setSection={setSection} />
      {data.opponentName && (
        <MiniCard icon={ShieldAlert} title="الخصم" value={data.opponentName} />
      )}
      {data.court && (
        <MiniCard icon={Building2} title="المحكمة" value={`${data.court ?? ""} ${data.circuit ?? ""}`.trim()} />
      )}
    </>
  );
}

// ============================================================
// سياق الموكل
// ============================================================
function ClientContext({ data, setSection }: { data: any; setSection: (s: any) => void }) {
  if (!data) return null;
  const items: SidebarItem[] = [
    { id: "cases", label: "قضاياه", badge: data.cases?.length ?? data._count?.cases ?? 0, icon: Scale, color: "text-emerald-600" },
    { id: "documents", label: "مستنداته", badge: data._count?.documentLinks ?? 0, icon: FileText, color: "text-violet-600" },
    { id: "poa", label: "التوكيلات", badge: data.powers?.length ?? 0, icon: FileCheck, color: "text-amber-600" },
    { id: "tasks", label: "المهام", badge: data.tasks?.length ?? 0, icon: CheckSquare, color: "text-cyan-600" },
    { id: "timeline", label: "الخط الزمني", icon: History, color: "text-slate-600" },
  ];

  return (
    <>
      <ContextHeader
        icon={Users}
        title={data.fullName ?? "موكل"}
        subtitle={data.phone ?? data.email}
        status={data.status}
      />
      <ItemsList items={items} setSection={setSection} />
      {data.idNumber && <MiniCard icon={FileText} title="رقم البطاقة" value={data.idNumber} />}
      {data.address && <MiniCard icon={Building2} title="العنوان" value={data.address} />}
    </>
  );
}

// ============================================================
// سياق المستند
// ============================================================
function DocumentContext({ data, setSection }: { data: any; setSection: (s: any) => void }) {
  if (!data) return null;
  const links = data.documentLinks ?? [];
  const items: SidebarItem[] = [
    { id: "links", label: "الكيانات المرتبطة", badge: links.length, icon: Scale, color: "text-emerald-600" },
    { id: "timeline", label: "الخط الزمني", icon: History, color: "text-slate-600" },
    { id: "ai", label: "تحليل AI", icon: Brain, color: "text-primary" },
  ];

  return (
    <>
      <ContextHeader
        icon={FileText}
        title={data.title ?? "مستند"}
        subtitle={data.category ?? data.docType}
        status={data.ocrStatus === "completed" ? "تم التحليل" : undefined}
      />
      <ItemsList items={items} setSection={setSection} />
      {data.aiSummary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1">
              <Brain className="w-3 h-3 text-primary" />
              ملخص AI
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-3">{data.aiSummary}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ============================================================
// سياق ملف التجهيز
// ============================================================
function PreCaseContext({ data, setSection }: { data: any; setSection: (s: any) => void }) {
  if (!data) return null;
  const items: SidebarItem[] = [
    { id: "client", label: "الموكل", sublabel: data.client?.fullName, icon: Users, color: "text-emerald-600" },
    { id: "opponents", label: "الخصوم", badge: data.opponents?.length ?? 0, icon: ShieldAlert, color: "text-rose-600" },
    { id: "documents", label: "المستندات", badge: data.documentLinks?.length ?? 0, icon: FileText, color: "text-violet-600" },
    { id: "checklist", label: "قائمة المراجعة", badge: data.checklistItems?.length ?? 0, icon: CheckSquare, color: "text-amber-600" },
    { id: "timeline", label: "الخط الزمني", icon: History, color: "text-slate-600" },
    { id: "ai", label: "المساعد الذكي", icon: Brain, color: "text-primary" },
  ];

  return (
    <>
      <ContextHeader
        icon={FileCheck}
        title={data.preCaseNumber ?? "ملف تجهيز"}
        subtitle={data.legalCategory ?? "قيد التجهيز"}
        status={data.status}
      />
      <ItemsList items={items} setSection={setSection} />
    </>
  );
}

// ============================================================
// مكوّنات مشتركة
// ============================================================

function ContextHeader({
  icon: Icon,
  title,
  subtitle,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status?: string;
}) {
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{title}</div>
          {status && <Badge variant="secondary" className="text-[10px] h-4">{status}</Badge>}
        </div>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
    </div>
  );
}

function ItemsList({ items, setSection }: { items: SidebarItem[]; setSection: (s: any) => void }) {
  return (
    <Card>
      <CardContent className="p-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.onClick?.()}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-right transition-colors group"
            >
              <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", item.color ?? "text-muted-foreground")} />
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs font-medium truncate">{item.label}</div>
                {item.sublabel && <div className="text-[10px] text-muted-foreground truncate">{item.sublabel}</div>}
              </div>
              {item.badge !== undefined && item.badge !== 0 && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {item.badge}
                </Badge>
              )}
              <ChevronLeft className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MiniCard({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground">{title}</span>
        </div>
        <p className="text-xs text-foreground truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
