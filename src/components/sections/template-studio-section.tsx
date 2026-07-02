"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  FileText,
  Loader2,
  Save,
  Save as SaveIcon,
  Bold,
  Italic,
  Underline,
  Variable,
  Code2,
  Repeat,
  Layers,
  Sparkles,
  Eye,
  Printer,
  Download,
  FileDown,
  History,
  CheckCircle2,
  FilePlus2,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  FileType2,
  Calendar,
  Tag,
  CircleDot,
  Braces,
  Bot,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ScrollText,
  ListTree,
  RefreshCw,
  ClipboardCopy,
} from "lucide-react";

// ============================================================
// الثوابت: أنواع القوالب + كتالوج المتغيرات + الأقسام
// ============================================================

const TEMPLATE_TYPES = [
  { value: "lawsuit", label: "صحيفة دعوى" },
  { value: "memo", label: "مذكرة" },
  { value: "contract", label: "عقد" },
  { value: "warning", label: "إنذار" },
  { value: "request", label: "طلب" },
  { value: "appeal", label: "صحيفة استئناف" },
  { value: "cassation", label: "صحيفة نقض" },
  { value: "declaration", label: "إقرار" },
  { value: "letter", label: "خطاب رسمي" },
  { value: "receipt", label: "إيصال" },
];

const TEMPLATE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TEMPLATE_TYPES.map((t) => [t.value, t.label])
);

const VARIABLE_CATALOG = [
  {
    group: "بيانات القضية",
    vars: [
      "case.number",
      "case.year",
      "case.type",
      "case.court",
      "case.circuit",
      "case.degree",
      "case.subject",
      "case.facts",
      "case.client",
      "case.opponent",
      "case.opponentLawyer",
      "case.judge",
    ],
  },
  {
    group: "بيانات الموكل",
    vars: [
      "client.name",
      "client.idNumber",
      "client.phone",
      "client.email",
      "client.address",
      "client.nationality",
      "client.birthDate",
    ],
  },
  {
    group: "بيانات الخصم",
    vars: ["opponent.name", "opponent.idNumber", "opponent.address", "opponent.lawyer"],
  },
  {
    group: "المحكمة والدائرة",
    vars: ["court.name", "court.type", "circuit.name", "court.address"],
  },
  {
    group: "الجلسة",
    vars: ["session.date", "session.type", "session.result", "session.notes"],
  },
  {
    group: "الحكم",
    vars: ["judgment.date", "judgment.text", "judgment.result"],
  },
  {
    group: "التنفيذ",
    vars: ["execution.number", "execution.status", "execution.date"],
  },
  {
    group: "التوكيل",
    vars: [
      "poa.number",
      "poa.letter",
      "poa.year",
      "poa.type",
      "poa.issuer",
      "poa.notary",
      "poa.issueDate",
      "poa.expiryDate",
    ],
  },
  {
    group: "العقار",
    vars: ["property.address", "property.area", "property.type", "property.register"],
  },
  {
    group: "العقد",
    vars: ["contract.number", "contract.date", "contract.parties", "contract.value"],
  },
  {
    group: "بيانات المكتب",
    vars: [
      "firm.name",
      "firm.address",
      "firm.phone",
      "firm.email",
      "firm.lawyer",
      "firm.license",
    ],
  },
  {
    group: "التاريخ والوقت",
    vars: ["date.today", "date.hijri", "date.full", "time.now"],
  },
  {
    group: "المستخدم الحالي",
    vars: ["user.name", "user.role", "user.email"],
  },
];

const TEMPLATE_SECTIONS = [
  { value: "header", label: "رأس" },
  { value: "intro", label: "تمهيد" },
  { value: "facts", label: "وقائع" },
  { value: "requests", label: "طلبات" },
  { value: "conclusion", label: "خاتمة" },
];

const SECTION_LABEL: Record<string, string> = Object.fromEntries(
  TEMPLATE_SECTIONS.map((s) => [s.value, s.label])
);

// نموذج بيانات لمعاينة القالب
const SAMPLE_DATA: Record<string, string> = {
  "case.number": "1452",
  "case.year": "1446",
  "case.type": "مدنية",
  "case.court": "محكمة الرياض",
  "case.circuit": "الدائرة المدنية الأولى",
  "case.degree": "أول درجة",
  "case.subject": "مطالبة مالية",
  "case.facts": "تتلخص وقائع الدعوى في...",
  "case.client": "شركة الأمل التجارية",
  "case.opponent": "مؤسسة النور",
  "case.opponentLawyer": "أ. خالد العتيبي",
  "case.judge": "الأستاذ/ قاضي الدائرة",
  "client.name": "محمد عبدالله السالم",
  "client.idNumber": "1012345678",
  "client.phone": "0501234567",
  "client.email": "client@example.com",
  "client.address": "الرياض - حي النخيل",
  "client.nationality": "سعودي",
  "client.birthDate": "1985-04-12",
  "opponent.name": "شركة الفجر",
  "opponent.idNumber": "7000123456",
  "opponent.address": "جدة - حي الروضة",
  "opponent.lawyer": "أ. سعيد الغامدي",
  "court.name": "محكمة الرياض",
  "court.type": "محكمة عامة",
  "circuit.name": "الدائرة المدنية الأولى",
  "court.address": "الرياض - طريق الملك فهد",
  "session.date": "1446/08/15",
  "session.type": "جلسة نظر",
  "session.result": "تأجيل",
  "session.notes": "طلب تكملة مذكرات",
  "judgment.date": "1446/09/01",
  "judgment.text": "حكمت المحكمة بـ...",
  "judgment.result": "لصالح المدعي",
  "execution.number": "9876",
  "execution.status": "قيد التنفيذ",
  "execution.date": "1446/09/10",
  "poa.number": "5521",
  "poa.letter": "أ",
  "poa.year": "1446",
  "poa.type": "وكالة خاصة",
  "poa.issuer": "وزارة العدل",
  "poa.notary": "كاتب العدل بالرياض",
  "poa.issueDate": "1446/01/01",
  "poa.expiryDate": "1448/01/01",
  "property.address": "الرياض - حي العليا",
  "property.area": "600 م²",
  "property.type": "أرض سكنية",
  "property.register": "حفر الباطن / 123",
  "contract.number": "C-2024-001",
  "contract.date": "1446/02/15",
  "contract.parties": "الطرف الأول / الطرف الثاني",
  "contract.value": "100,000 ريال",
  "firm.name": "مكتب العدالة للمحاماة",
  "firm.address": "الرياض - طريق الملك عبدالله",
  "firm.phone": "0112345678",
  "firm.email": "office@firm.sa",
  "firm.lawyer": "أ. فهد القحطاني",
  "firm.license": "L-12345",
  "date.today": "1446/08/20",
  "date.hijri": "20 صفر 1447 هـ",
  "date.full": "الإثنين 20 صفر 1447 هـ الموافق 18 أغسطس 2025 م",
  "time.now": "10:30 ص",
  "user.name": "أ. فهد القحطاني",
  "user.role": "محامي",
  "user.email": "fahad@firm.sa",
};

// ============================================================
// الأنواع
// ============================================================

interface TemplateRecord {
  id: string;
  name: string;
  templateType: string;
  category?: string | null;
  content: string;
  variables?: string | null;
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomVar {
  name: string;
  defaultValue: string;
}

interface TemplateVersion {
  version: number;
  savedAt: string;
  content: string;
  note?: string;
}

interface AIDraftResult {
  content: string;
  docType: string;
}

interface ReviewSuggestion {
  type: "tip" | "warning" | "improvement";
  title: string;
  detail: string;
}

// ============================================================
// دوال مساعدة
// ============================================================

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA-u-nu-latn", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-SA-u-nu-latn", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// توليد معاينة حية لقالب - استبدال المتغيرات ومعالجة الشروط والحلقات
function renderPreview(
  body: string,
  customVars: CustomVar[]
): string {
  let out = body;

  // 1) استبدال المتغيرات {{var}}
  out = out.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, key: string) => {
    if (SAMPLE_DATA[key] !== undefined) return SAMPLE_DATA[key];
    const cv = customVars.find((c) => c.name === key);
    if (cv) return cv.defaultValue || `[${key}]`;
    return `[${key}]`;
  });

  // 2) معالجة الشروط {% if condition %}...{% endif %}
  // شرط بسيط: نُبقي المحتوى إذا كان المتغير موجوداً بقيمة غير فارغة في SAMPLE_DATA
  out = out.replace(
    /\{%\s*if\s+([^%]+?)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
    (_m, cond: string, inner: string) => {
      const key = cond.trim();
      const val = SAMPLE_DATA[key];
      return val ? inner : "";
    }
  );

  // 3) معالجة الحلقات {% for item in items %}...{% endfor %}
  // نعرض المحتوى مرتين كنموذج
  out = out.replace(
    /\{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
    (_m, item: string, _list: string, inner: string) => {
      const a = inner.replace(new RegExp(`\\{\\{\\s*${item}\\.?(\\w*)\\s*\\}\\}`, "g"), "الأول");
      const b = inner.replace(new RegExp(`\\{\\{\\s*${item}\\.?(\\w*)\\s*\\}\\}`, "g"), "الثاني");
      return a + "\n" + b;
    }
  );

  // 4) إزالة علامات الأقسام (تعليقات HTML) واستبدالها بعناوين
  out = out.replace(
    /<!--\s*SECTION:\s*(\w+)\s*-->/g,
    (_m, sec: string) =>
      `\n────────────────────────\n【${SECTION_LABEL[sec] || sec}】\n────────────────────────\n`
  );

  return out;
}

// استخراج علامات الأقسام الموجودة في النص
function extractSections(body: string): string[] {
  const re = /<!--\s*SECTION:\s*(\w+)\s*-->/g;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    found.push(m[1]);
  }
  return found;
}

// ============================================================
// المكوّن الرئيسي
// ============================================================

export function TemplateStudioSection() {
  const { toast } = useToast();

  // --- الحالة ---
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [templateType, setTemplateType] = useState<string>("memo");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [customVars, setCustomVars] = useState<CustomVar[]>([]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "versions">("edit");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // مؤشر التحميل للذكاء الاصطناعي
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState<AIDraftResult | null>(null);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ReviewSuggestion[]>([]);

  // نافذة إنشاء متغير مخصص
  const [customVarOpen, setCustomVarOpen] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarDefault, setNewVarDefault] = useState("");

  // نافذة حفظ كنسخة جديدة
  const [versionNoteOpen, setVersionNoteOpen] = useState(false);
  const [versionNote, setVersionNote] = useState("");

  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // --- تحميل القوالب ---
  const loadTemplates = useCallback(async () => {
    setLoadingList(true);
    try {
      const url = new URL("/api/templates", window.location.origin);
      if (filterType !== "all") url.searchParams.set("type", filterType);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (data?.success) {
        setTemplates(data.templates as TemplateRecord[]);
      } else {
        toast({
          variant: "destructive",
          title: "تعذّر تحميل القوالب",
          description: data?.error || "خطأ غير معروف",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "خطأ في الشبكة",
        description: e instanceof Error ? e.message : "تعذّر الاتصال بالخادم",
      });
    } finally {
      setLoadingList(false);
    }
  }, [filterType, toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // --- القوالب المفلترة (بحث) ---
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      return (
        t.name?.toLowerCase().includes(q) ||
        TEMPLATE_TYPE_LABEL[t.templateType]?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [templates, search]);

  // --- إحصائيات سريعة ---
  const stats = useMemo(() => {
    const byType = new Map<string, number>();
    for (const t of templates) {
      byType.set(t.templateType, (byType.get(t.templateType) || 0) + 1);
    }
    return { total: templates.length, types: byType.size };
  }, [templates]);

  // --- اختيار قالب ---
  const selectTemplate = useCallback((t: TemplateRecord) => {
    setSelectedId(t.id);
    setTitle(t.name);
    setTemplateType(t.templateType);
    setCategory(t.category || "");
    setBody(t.content || "");
    setDirty(false);
    setActiveTab("edit");

    // parse variables
    try {
      const parsed = t.variables ? JSON.parse(t.variables) : null;
      if (Array.isArray(parsed)) {
        setCustomVars(parsed as CustomVar[]);
      } else if (parsed && typeof parsed === "object") {
        setCustomVars(
          Object.entries(parsed).map(([name, defaultValue]) => ({
            name,
            defaultValue: String(defaultValue ?? ""),
          }))
        );
      } else {
        setCustomVars([]);
      }
    } catch {
      setCustomVars([]);
    }

    // إصدارات وهمية بناءً على createdAt/updatedAt
    const v: TemplateVersion[] = [];
    if (t.createdAt) {
      v.push({
        version: 1,
        savedAt: t.createdAt,
        content: t.content || "",
        note: "النسخة الأصلية",
      });
    }
    if (t.updatedAt && t.updatedAt !== t.createdAt) {
      v.push({
        version: 2,
        savedAt: t.updatedAt,
        content: t.content || "",
        note: "آخر تعديل محفوظ",
      });
    }
    setVersions(v);
  }, []);

  // --- قالب جديد ---
  const newTemplate = useCallback(() => {
    setSelectedId(null);
    setTitle("قالب جديد");
    setTemplateType("memo");
    setCategory("");
    setBody("");
    setCustomVars([]);
    setVersions([]);
    setDirty(false);
    setActiveTab("edit");
  }, []);

  // --- إدراج نص عند المؤشر ---
  const insertAtCursor = useCallback(
    (text: string) => {
      const el = editorRef.current;
      if (!el) {
        setBody((b) => b + text);
        return;
      }
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const before = body.slice(0, start);
      const after = body.slice(end);
      const next = before + text + after;
      setBody(next);
      setDirty(true);
      // إعادة التركيز وتحريك المؤشر بعد النص المُدرج
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + text.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [body]
  );

  // --- إدراج متغير ---
  const insertVariable = useCallback(
    (varName: string) => {
      insertAtCursor(`{{${varName}}}`);
      toast({ title: "تم الإدراج", description: `{{${varName}}}` });
    },
    [insertAtCursor, toast]
  );

  // --- إدراج شرط ---
  const insertCondition = useCallback(() => {
    insertAtCursor(
      `\n{% if client.name %}\n  النص الظاهر عند تحقق الشرط\n{% endif %}\n`
    );
  }, [insertAtCursor]);

  // --- إدراج حلقة ---
  const insertLoop = useCallback(() => {
    insertAtCursor(
      `\n{% for item in case.items %}\n  - {{item.name}}\n{% endfor %}\n`
    );
  }, [insertAtCursor]);

  // --- إدراج قسم ---
  const insertSection = useCallback(
    (secValue: string) => {
      const label = SECTION_LABEL[secValue] || secValue;
      insertAtCursor(
        `\n<!-- SECTION: ${secValue} -->\n【${label}】\n\n`
      );
    },
    [insertAtCursor]
  );

  // --- تنسييق (Bold/Italic/Underline) ---
  const wrapSelection = useCallback(
    (prefix: string, suffix = prefix) => {
      const el = editorRef.current;
      if (!el) {
        setBody((b) => b + `${prefix}نص${suffix}`);
        return;
      }
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const selected = body.slice(start, end) || "نص";
      const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
      setBody(next);
      setDirty(true);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + prefix.length;
        el.setSelectionRange(pos, pos + selected.length);
      });
    },
    [body]
  );

  // --- إضافة متغير مخصص ---
  const addCustomVar = useCallback(() => {
    const name = newVarName.trim().replace(/\s+/g, "_");
    if (!name) {
      toast({ variant: "destructive", title: "الاسم مطلوب" });
      return;
    }
    if (
      VARIABLE_CATALOG.some((g) => g.vars.includes(name)) ||
      customVars.some((c) => c.name === name)
    ) {
      toast({ variant: "destructive", title: "المتغير موجود مسبقاً" });
      return;
    }
    setCustomVars((v) => [...v, { name, defaultValue: newVarDefault.trim() }]);
    setNewVarName("");
    setNewVarDefault("");
    setCustomVarOpen(false);
    setDirty(true);
    toast({ title: "تمت إضافة المتغير", description: `{{${name}}}` });
  }, [newVarName, newVarDefault, customVars, toast]);

  const removeCustomVar = useCallback(
    (name: string) => {
      setCustomVars((v) => v.filter((c) => c.name !== name));
      setDirty(true);
    },
    []
  );

  // --- حفظ القالب (جديد أو تحديث) ---
  const saveTemplate = useCallback(
    async (asNewVersion = false) => {
      if (!title.trim()) {
        toast({ variant: "destructive", title: "العنوان مطلوب" });
        return;
      }
      if (!body.trim()) {
        toast({ variant: "destructive", title: "محتوى القالب فارغ" });
        return;
      }
      setSaving(true);
      try {
        const payload = {
          name: title.trim(),
          templateType,
          category: category.trim() || null,
          content: body,
          variables: JSON.stringify(customVars),
          sections: extractSections(body),
        };
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.success) {
          const saved = data.template as TemplateRecord;
          setDirty(false);
          if (asNewVersion || selectedId) {
            // تسجيل كنسخة جديدة
            setVersions((v) => [
              ...v,
              {
                version: v.length + 1,
                savedAt: new Date().toISOString(),
                content: body,
                note: versionNote.trim() || `نسخة ${v.length + 1}`,
              },
            ]);
          }
          if (!selectedId) {
            setSelectedId(saved.id);
          }
          setVersionNote("");
          setVersionNoteOpen(false);
          toast({
            title: "تم الحفظ",
            description: asNewVersion
              ? "تم حفظ نسخة جديدة من القالب"
              : "تم حفظ القالب بنجاح",
          });
          await loadTemplates();
        } else {
          toast({
            variant: "destructive",
            title: "فشل الحفظ",
            description: data?.error || "خطأ غير معروف",
          });
        }
      } catch (e) {
        toast({
          variant: "destructive",
          title: "خطأ في الشبكة",
          description: e instanceof Error ? e.message : "تعذّر الحفظ",
        });
      } finally {
        setSaving(false);
      }
    },
    [title, body, templateType, category, customVars, selectedId, versionNote, toast, loadTemplates]
  );

  // --- توليد مسودة بالذكاء الاصطناعي ---
  const generateAI = useCallback(async () => {
    setAiLoading(true);
    try {
      const prompt =
        title.trim() ||
        `مسودة ${TEMPLATE_TYPE_LABEL[templateType] || "وثيقة قانونية"}`;
      const res = await fetch("/api/ai/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: TEMPLATE_TYPE_LABEL[templateType] || "وثيقة قانونية",
          type: templateType,
          prompt,
          caseData: {
            title,
            subject: category,
            preview: body.slice(0, 500),
          },
        }),
      });
      const data = await res.json();
      if (data?.success && data.content) {
        setAiDraft({ content: data.content, docType: data.docType || templateType });
        setAiDraftOpen(true);
      } else {
        // احتياطي: توليد مسودة محلية إذا فشل الـ API
        const fallback = generateFallbackDraft(templateType, title);
        setAiDraft({ content: fallback, docType: templateType });
        setAiDraftOpen(true);
        toast({
          title: "وضع احتياطي",
          description: "تعذّر الوصول للـ AI، تم توليد مسودة أساسية.",
        });
      }
    } catch (e) {
      const fallback = generateFallbackDraft(templateType, title);
      setAiDraft({ content: fallback, docType: templateType });
      setAiDraftOpen(true);
      toast({
        title: "وضع احتياطي",
        description: e instanceof Error ? e.message : "خطأ في الاتصال بالـ AI",
      });
    } finally {
      setAiLoading(false);
    }
  }, [title, templateType, category, body, toast]);

  // --- مراجعة بالذكاء الاصطناعي (mock) ---
  const reviewAI = useCallback(async () => {
    if (!body.trim()) {
      toast({ variant: "destructive", title: "القالب فارغ", description: "اكتب محتوى قبل المراجعة" });
      return;
    }
    setAiReviewOpen(true);
    setAiReviewLoading(true);
    setAiSuggestions([]);
    // محاكاة استجابة AI
    await new Promise((r) => setTimeout(r, 900));
    const suggestions: ReviewSuggestion[] = [];
    if (!/\{\{.*\}\}/.test(body)) {
      suggestions.push({
        type: "warning",
        title: "لا توجد متغيرات ديناميكية",
        detail: "القالب لا يحتوي على أي متغيرات {{...}}. يُنصح بإضافة متغيرات مثل {{client.name}} و{{case.number}} لجعله قابلاً لإعادة الاستخدام.",
      });
    } else {
      const count = (body.match(/\{\{[^}]+\}\}/g) || []).length;
      suggestions.push({
        type: "tip",
        title: `${count} متغير مستخدم`,
        detail: "تأكد من توفير قيم افتراضية للمتغيرات الحرجة لتجنب ظهور أماكن فارغة.",
      });
    }
    if (!/<!--\s*SECTION:/.test(body)) {
      suggestions.push({
        type: "improvement",
        title: "أضف أقساماً واضحة",
        detail: "تقسيم القالب إلى أقسام (رأس، تمهيد، وقائع، طلبات، خاتمة) يسهّل التحرير والمعاينة.",
      });
    }
    if (!/\{%\s*if/.test(body)) {
      suggestions.push({
        type: "improvement",
        title: "استخدم شروطاً منطقية",
        detail: "يمكن استخدام {% if condition %}...{% endif %} لإظهار فقرات اختيارية حسب نوع القضية.",
      });
    }
    if (body.length < 200) {
      suggestions.push({
        type: "warning",
        title: "المحتوى قصير",
        detail: "القالب أقصر من المتوقع لوثيقة قانونية. راجع البنود الأساسية.",
      });
    }
    suggestions.push({
      type: "tip",
      title: "التوقيع والاعتماد",
      detail: "تأكد من وجود مكان للتوقيع والختم وتاريخ الإصدار في نهاية الوثيقة.",
    });
    setAiSuggestions(suggestions);
    setAiReviewLoading(false);
  }, [body, toast]);

  // --- إدراج مسودة AI في المحرر ---
  const insertAIDraft = useCallback(
    (mode: "replace" | "append") => {
      if (!aiDraft) return;
      if (mode === "replace") {
        setBody(aiDraft.content);
      } else {
        setBody((b) => b + "\n\n" + aiDraft.content);
      }
      setDirty(true);
      setAiDraftOpen(false);
      setActiveTab("edit");
      toast({ title: "تم الإدراج", description: "أُدخلت مسودة AI في المحرر" });
    },
    [aiDraft, toast]
  );

  // --- تصدير ---
  const exportAs = useCallback(
    (kind: "txt" | "html" | "md") => {
      if (!body.trim()) {
        toast({ variant: "destructive", title: "لا يوجد محتوى للتصدير" });
        return;
      }
      let content = body;
      let mime = "text/plain;charset=utf-8";
      let ext = "txt";
      if (kind === "html") {
        const preview = renderPreview(body, customVars);
        content = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
        <style>body{font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.9;padding:32px;max-width:820px;margin:auto;color:#0f172a}
        h1,h2,h3{color:#047857}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${preview}</pre></body></html>`;
        mime = "text/html;charset=utf-8";
        ext = "html";
      } else if (kind === "md") {
        ext = "md";
      }
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "template"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "تم التصدير", description: `${ext.toUpperCase()} • ${a.download}` });
    },
    [body, title, customVars, toast]
  );

  // --- طباعة ---
  const printTemplate = useCallback(() => {
    if (!body.trim()) {
      toast({ variant: "destructive", title: "لا يوجد محتوى للطباعة" });
      return;
    }
    const preview = renderPreview(body, customVars);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      toast({ variant: "destructive", title: "تعذّر فتح نافذة الطباعة" });
      return;
    }
    w.document.write(
      `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:'Segoe UI',Tahoma,sans-serif;line-height:2;padding:40px;max-width:820px;margin:auto;color:#0f172a}
      h1,h2,h3{color:#047857}pre{white-space:pre-wrap;font-family:inherit}</style></head>
      <body><pre>${preview}</pre></body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }, [body, title, customVars, toast]);

  // --- نسخ المحتوى ---
  const copyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(body);
      toast({ title: "تم النسخ", description: "نُسخ محتوى القالب إلى الحافظة" });
    } catch {
      toast({ variant: "destructive", title: "تعذّر النسخ" });
    }
  }, [body, toast]);

  // --- استرجاع نسخة ---
  const restoreVersion = useCallback(
    (v: TemplateVersion) => {
      setBody(v.content);
      setDirty(true);
      setActiveTab("edit");
      toast({ title: "تم الاسترجاع", description: `النسخة رقم ${v.version}` });
    },
    [toast]
  );

  // --- معاينة فورية ---
  const previewContent = useMemo(
    () => renderPreview(body, customVars),
    [body, customVars]
  );

  const sectionsInBody = useMemo(() => extractSections(body), [body]);
  const variablesInBody = useMemo(() => {
    const set = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) set.add(m[1]);
    return Array.from(set);
  }, [body]);

  // عدد الكلمات
  const wordCount = useMemo(() => {
    const stripped = body.replace(/\{\{[^}]+\}\}/g, " ").replace(/\{%-?[^%]+-?%\}/g, " ");
    return (stripped.match(/\S+/g) || []).length;
  }, [body]);

  // ============================================================
  // الواجهة
  // ============================================================

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex min-h-screen flex-col bg-slate-50/60">
        {/* رأس لاصق */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  استوديو القوالب القانونية
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm" dir="ltr" style={{ textAlign: "right" }}>
                  Legal Template Studio · تصميم قوالب ذكية للمستندات القانونية
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700">
                <FileText className="h-3 w-3" />
                {stats.total} قالب
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700">
                <Layers className="h-3 w-3" />
                {stats.types} نوع
              </Badge>
              {dirty && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                  <CircleDot className="h-3 w-3" />
                  تعديل غير محفوظ
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTemplates()}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>
        </header>

        {/* المحتوى */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-6 lg:py-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
            {/* ===== لوحة القوالب (الشريط الجانبي) ===== */}
            <Card className="flex h-fit flex-col overflow-hidden border-slate-200 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-110px)]">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-slate-800">
                    مكتبة القوالب
                  </CardTitle>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={newTemplate}>
                    <Plus className="h-4 w-4" />
                    جديد
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="ابحث باسم القالب أو النوع..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="فلترة حسب النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-340px)]">
                  {loadingList ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      جارٍ التحميل...
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                      <FileText className="h-10 w-10" />
                      <p className="text-sm">لا توجد قوالب مطابقة</p>
                      <Button size="sm" variant="outline" onClick={newTemplate} className="mt-2 gap-1.5">
                        <Plus className="h-4 w-4" /> إنشاء قالب
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {filteredTemplates.map((t) => {
                        const active = t.id === selectedId;
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => selectTemplate(t)}
                              className={cn(
                                "flex w-full flex-col gap-1.5 px-3 py-3 text-right transition-colors hover:bg-emerald-50/60",
                                active && "bg-emerald-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={cn(
                                  "line-clamp-1 text-sm font-semibold",
                                  active ? "text-emerald-800" : "text-slate-800"
                                )}>
                                  {t.name}
                                </span>
                                {t.isBuiltIn ? (
                                  <Badge variant="outline" className="shrink-0 border-slate-200 text-[10px] text-slate-500">
                                    نظامي
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="shrink-0 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                    مخصص
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                <Badge
                                  variant="secondary"
                                  className="bg-slate-100 text-[10px] text-slate-600"
                                >
                                  {TEMPLATE_TYPE_LABEL[t.templateType] || t.templateType}
                                </Badge>
                                {t.category && (
                                  <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {t.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>آخر تعديل: {formatDate(t.updatedAt || t.createdAt)}</span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* ===== منطقة المحرر ===== */}
            <div className="min-w-0">
              {!selectedId && !dirty && !title ? (
                <EmptyState onCreate={newTemplate} />
              ) : (
                <Card className="flex flex-col overflow-hidden border-slate-200">
                  {/* شريط الأدوات العلوي */}
                  <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 p-3">
                    {/* صف العنوان والإجراءات */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="عنوان القالب..."
                          className="h-9 flex-1 bg-white font-semibold text-slate-800"
                        />
                        <Select value={templateType} onValueChange={(v) => { setTemplateType(v); setDirty(true); }}>
                          <SelectTrigger className="h-9 w-full bg-white sm:w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateAI}
                          disabled={aiLoading}
                          className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          {aiLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          اقتراح AI
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={reviewAI}
                          className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                          <Bot className="h-4 w-4" />
                          AI مراجعة
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveTemplate(false)}
                          disabled={saving}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          حفظ
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <Download className="h-4 w-4" />
                              تصدير
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>تصدير القالب</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => exportAs("txt")}>
                              <FileDown className="h-4 w-4 text-slate-500" />
                              ملف نصي (.txt)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportAs("md")}>
                              <FileDown className="h-4 w-4 text-slate-500" />
                              ملف Markdown (.md)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportAs("html")}>
                              <FileDown className="h-4 w-4 text-slate-500" />
                              صفحة HTML للمعاينة
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={printTemplate}>
                              <Printer className="h-4 w-4 text-slate-500" />
                              طباعة / PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* صف أدوات التنسيق والإدراج */}
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => wrapSelection("**")}>
                            <Bold className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">عريض</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => wrapSelection("*")}>
                            <Italic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">مائل</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => wrapSelection("__")}>
                            <Underline className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">تسطير</TooltipContent>
                      </Tooltip>

                      <Separator orientation="vertical" className="mx-1 h-6" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600">
                            <Variable className="h-4 w-4 text-emerald-600" />
                            متغير
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuLabel>إدراج متغير</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <ScrollArea className="max-h-72">
                            {VARIABLE_CATALOG.map((g) => (
                              <div key={g.group}>
                                <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">{g.group}</p>
                                {g.vars.slice(0, 4).map((v) => (
                                  <DropdownMenuItem key={v} onClick={() => insertVariable(v)} className="font-mono text-xs">
                                    {`{{${v}}}`}
                                  </DropdownMenuItem>
                                ))}
                                {g.vars.length > 4 && (
                                  <p className="px-2 pb-1 text-[10px] text-slate-400">+{g.vars.length - 4} أخرى</p>
                                )}
                              </div>
                            ))}
                            {customVars.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">متغيرات مخصصة</p>
                                {customVars.map((v) => (
                                  <DropdownMenuItem key={v.name} onClick={() => insertVariable(v.name)} className="font-mono text-xs">
                                    {`{{${v.name}}}`}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600">
                            <Layers className="h-4 w-4 text-amber-600" />
                            قسم
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>إدراج قسم</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {TEMPLATE_SECTIONS.map((s) => (
                            <DropdownMenuItem key={s.value} onClick={() => insertSection(s.value)}>
                              <Layers className="h-4 w-4 text-amber-600" />
                              {s.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600" onClick={insertCondition}>
                            <Code2 className="h-4 w-4 text-rose-600" />
                            <span className="text-xs">شرط</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{"{% if %} ... {% endif %}"}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600" onClick={insertLoop}>
                            <Repeat className="h-4 w-4 text-rose-600" />
                            <span className="text-xs">حلقة</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{"{% for %} ... {% endfor %}"}</TooltipContent>
                      </Tooltip>

                      <Separator orientation="vertical" className="mx-1 h-6" />

                      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600" onClick={copyContent}>
                        <ClipboardCopy className="h-4 w-4" />
                        <span className="text-xs">نسخ</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-slate-600" onClick={printTemplate}>
                        <Printer className="h-4 w-4" />
                        <span className="text-xs">طباعة</span>
                      </Button>
                    </div>
                  </div>

                  {/* التبويبات */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 pt-2">
                      <TabsList className="bg-slate-100">
                        <TabsTrigger value="edit" className="gap-1.5">
                          <Pencil className="h-4 w-4" />
                          تحرير
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-1.5">
                          <Eye className="h-4 w-4" />
                          معاينة
                        </TabsTrigger>
                        <TabsTrigger value="versions" className="gap-1.5">
                          <History className="h-4 w-4" />
                          الإصدارات
                          {versions.length > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-slate-200 text-[10px] text-slate-600">
                              {versions.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                      <div className="hidden items-center gap-3 pb-2 text-[11px] text-slate-500 sm:flex">
                        <span className="inline-flex items-center gap-1">
                          <Braces className="h-3 w-3 text-emerald-600" />
                          {variablesInBody.length} متغير
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ListTree className="h-3 w-3 text-amber-600" />
                          {sectionsInBody.length} قسم
                        </span>
                        <span>{wordCount} كلمة</span>
                      </div>
                    </div>

                    {/* ===== تبويب التحرير ===== */}
                    <TabsContent value="edit" className="m-0 flex-1">
                      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[1fr_300px]">
                        {/* المحرر */}
                        <div className="min-w-0 border-b border-slate-100 xl:border-b-0 xl:border-l">
                          <div className="p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <Label className="text-xs font-medium text-slate-500">نص القالب</Label>
                              <span className="text-[10px] text-slate-400" dir="ltr">
                                {"{{var}} · {% if %} · {% for %} · <!-- SECTION -->"}
                              </span>
                            </div>
                            <Textarea
                              ref={editorRef}
                              value={body}
                              onChange={(e) => {
                                setBody(e.target.value);
                                setDirty(true);
                              }}
                              placeholder="اكتب محتوى القالب هنا... استخدم {{client.name}} لإدراج متغير، أو {% if condition %}...{% endif %} للشروط."
                              className="min-h-[480px] w-full resize-y bg-white font-mono text-sm leading-7 text-slate-800 xl:min-h-[calc(100vh-340px)]"
                              dir="rtl"
                            />
                          </div>
                        </div>

                        {/* لوحة المتغيرات */}
                        <div className="bg-slate-50/40">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Variable className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-semibold text-slate-700">
                                المتغيرات الديناميكية
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => setCustomVarOpen(true)}
                            >
                              <Plus className="h-3 w-3" />
                              مخصص
                            </Button>
                          </div>
                          <ScrollArea className="h-[calc(100vh-360px)] min-h-[300px]">
                            <div className="p-2">
                              <Accordion type="multiple" defaultValue={[VARIABLE_CATALOG[0].group]} className="w-full">
                                {VARIABLE_CATALOG.map((g) => (
                                  <AccordionItem key={g.group} value={g.group} className="border-slate-200">
                                    <AccordionTrigger className="px-2 py-2 text-right text-xs font-semibold text-slate-700 hover:no-underline">
                                      <span className="flex flex-1 items-center justify-between">
                                        <span>{g.group}</span>
                                        <Badge variant="secondary" className="ml-2 bg-slate-200 text-[10px] text-slate-600">
                                          {g.vars.length}
                                        </Badge>
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1">
                                      <div className="flex flex-wrap gap-1 px-1">
                                        {g.vars.map((v) => (
                                          <Tooltip key={v}>
                                            <TooltipTrigger asChild>
                                              <button
                                                type="button"
                                                onClick={() => insertVariable(v)}
                                                className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                              >
                                                {`{{${v}}}`}
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                              <span className="font-mono text-xs">{v}</span>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>

                              {/* المتغيرات المخصصة */}
                              {customVars.length > 0 && (
                                <div className="mt-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-2">
                                  <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-emerald-800">
                                    <Variable className="h-3 w-3" />
                                    متغيرات مخصصة
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {customVars.map((v) => (
                                      <div
                                        key={v.name}
                                        className="group inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => insertVariable(v.name)}
                                          className="font-mono text-[11px] text-emerald-700"
                                          title={v.defaultValue || "بدون قيمة افتراضية"}
                                        >
                                          {`{{${v.name}}}`}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeCustomVar(v.name)}
                                          className="text-slate-300 transition-colors hover:text-rose-500"
                                          title="حذف"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* إدراج سريع للمنطق */}
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2">
                                <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-600">
                                  <Braces className="h-3 w-3 text-rose-600" />
                                  منطق القالب
                                </p>
                                <div className="grid grid-cols-2 gap-1">
                                  <Button size="sm" variant="outline" className="h-7 justify-start gap-1.5 text-[11px]" onClick={insertCondition}>
                                    <Code2 className="h-3 w-3 text-rose-600" />
                                    شرط if
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 justify-start gap-1.5 text-[11px]" onClick={insertLoop}>
                                    <Repeat className="h-3 w-3 text-rose-600" />
                                    حلقة for
                                  </Button>
                                </div>
                              </div>

                              {/* إدراج سريع للأقسام */}
                              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                                <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-600">
                                  <Layers className="h-3 w-3 text-amber-600" />
                                  أقسام القالب
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {TEMPLATE_SECTIONS.map((s) => (
                                    <button
                                      key={s.value}
                                      type="button"
                                      onClick={() => insertSection(s.value)}
                                      className="rounded-md border border-amber-200 bg-amber-50/50 px-2 py-1 text-[11px] text-amber-800 transition-colors hover:bg-amber-100"
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ===== تبويب المعاينة ===== */}
                    <TabsContent value="preview" className="m-0 flex-1">
                      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_280px]">
                        <div className="bg-white p-6">
                          <div className="mx-auto max-w-3xl">
                            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                              <h2 className="text-base font-bold text-slate-800">{title || "معاينة"}</h2>
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                                {TEMPLATE_TYPE_LABEL[templateType]}
                              </Badge>
                            </div>
                            <pre
                              className="whitespace-pre-wrap break-words font-[inherit] text-sm leading-8 text-slate-700"
                              style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}
                            >
                              {previewContent || "— لا يوجد محتوى —"}
                            </pre>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50/40 p-3 lg:border-r lg:border-t-0">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            بيانات المعاينة (نموذجية)
                          </p>
                          <ScrollArea className="h-[calc(100vh-380px)] min-h-[280px]">
                            <div className="space-y-1.5">
                              {variablesInBody.length === 0 ? (
                                <p className="rounded-md bg-white p-2 text-[11px] text-slate-400">
                                  لا توجد متغيرات مستخدمة بعد.
                                </p>
                              ) : (
                                variablesInBody.map((v) => (
                                  <div
                                    key={v}
                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1"
                                  >
                                    <code className="text-[10px] text-slate-500">{v}</code>
                                    <span className="line-clamp-1 text-[11px] font-medium text-slate-700">
                                      {SAMPLE_DATA[v] ?? `[${v}]`}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ===== تبويب الإصدارات ===== */}
                    <TabsContent value="versions" className="m-0 flex-1">
                      <div className="p-4">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">سجل الإصدارات</h3>
                            <p className="text-xs text-slate-500">
                              إجمالي الإصدارات: {versions.length} · الإصدار الحالي: {versions.length || "—"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setVersionNoteOpen(true)}
                            disabled={!body.trim()}
                          >
                            <FilePlus2 className="h-4 w-4" />
                            حفظ كنسخة جديدة
                          </Button>
                        </div>

                        {versions.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center text-slate-400">
                            <History className="h-10 w-10" />
                            <p className="text-sm">لا توجد إصدارات محفوظة بعد</p>
                            <p className="text-xs">احفظ القالب لإنشاء أول إصدار</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {[...versions].reverse().map((v) => (
                              <Card key={v.version} className="border-slate-200">
                                <CardContent className="flex items-start justify-between gap-3 p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                      v{v.version}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-semibold text-slate-800">
                                          الإصدار {v.version}
                                        </span>
                                        {v.note && (
                                          <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-500">
                                            {v.note}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                        <Calendar className="h-3 w-3" />
                                        {formatDateTime(v.savedAt)}
                                      </p>
                                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                                        {v.content.slice(0, 160) || "—"}
                                        {v.content.length > 160 ? "…" : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1 text-xs text-slate-600 hover:bg-slate-100"
                                    onClick={() => restoreVersion(v)}
                                  >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    استرجاع
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* شريط الحالة السفلي */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <FileType2 className="h-3 w-3" />
                        {TEMPLATE_TYPE_LABEL[templateType]}
                      </span>
                      {category && (
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{wordCount} كلمة</span>
                      <span>·</span>
                      <span>{body.length} حرف</span>
                      {dirty && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <CircleDot className="h-3 w-3" />
                          غير محفوظ
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>

        {/* ===== نافذة: متغير مخصص ===== */}
        <Dialog open={customVarOpen} onOpenChange={setCustomVarOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5 text-emerald-600" />
                إنشاء متغير مخصص
              </DialogTitle>
              <DialogDescription>
                أضف متغيراً مخصصاً يمكن إدراجه في القالب. سيُستبدل بقيمته الافتراضية في المعاينة.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="cv-name">اسم المتغير</Label>
                <Input
                  id="cv-name"
                  placeholder="مثال: contract.value"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="font-mono"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-500">يُستخدم داخل {"{{contract.value}}"} — أحرف إنجليزية ونقطة فقط.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cv-default">القيمة الافتراضية</Label>
                <Input
                  id="cv-default"
                  placeholder="مثال: 100,000 ريال"
                  value={newVarDefault}
                  onChange={(e) => setNewVarDefault(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomVarOpen(false)}>إلغاء</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addCustomVar}>
                <Plus className="h-4 w-4" />
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== نافذة: حفظ كنسخة جديدة ===== */}
        <Dialog open={versionNoteOpen} onOpenChange={setVersionNoteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FilePlus2 className="h-5 w-5 text-emerald-600" />
                حفظ كنسخة جديدة
              </DialogTitle>
              <DialogDescription>
                أضف ملاحظة قصيرة تصف هذا الإصدار (اختياري).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="vn-note">ملاحظة الإصدار</Label>
                <Input
                  id="vn-note"
                  placeholder="مثال: إضافة بند التحكيم"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                />
              </div>
              <div className="rounded-md bg-slate-50 p-2 text-[11px] text-slate-500">
                الإصدار التالي سيكون رقم <span className="font-bold text-slate-700">{versions.length + 1}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVersionNoteOpen(false)}>إلغاء</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => saveTemplate(true)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ النسخة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== نافذة: مسودة AI ===== */}
        <Dialog open={aiDraftOpen} onOpenChange={setAiDraftOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                مسودة مقترحة من الذكاء الاصطناعي
              </DialogTitle>
              <DialogDescription>
                راجع المسودة ثم اختر طريقة الإدراج في المحرر.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
                {aiDraft?.content || "—"}
              </pre>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setAiDraftOpen(false)}>إغلاق</Button>
              <Button variant="outline" className="gap-1.5" onClick={() => insertAIDraft("append")}>
                <ChevronLeft className="h-4 w-4" />
                إلحاق في النهاية
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => insertAIDraft("replace")}>
                <ArrowLeft className="h-4 w-4" />
                استبدال المحتوى
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== نافذة: مراجعة AI ===== */}
        <Dialog open={aiReviewOpen} onOpenChange={setAiReviewOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-amber-600" />
                مراجعة AI للقالب
              </DialogTitle>
              <DialogDescription>
                اقتراحات لتحسين القالب وضمان اكتماله.
              </DialogDescription>
            </DialogHeader>
            {aiReviewLoading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
                <p className="text-sm">جارٍ تحليل القالب...</p>
                <Progress className="mt-2 h-1.5 w-2/3" value={70} />
              </div>
            ) : (
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-2 py-1">
                  {aiSuggestions.map((s, i) => {
                    const cfg =
                      s.type === "warning"
                        ? { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "تنبيه" }
                        : s.type === "improvement"
                        ? { icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "تحسين" }
                        : { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "نصيحة" };
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className={cn("rounded-lg border p-3", cfg.border, cfg.bg)}>
                        <div className="mb-1 flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                          <span className="text-sm font-semibold text-slate-800">{s.title}</span>
                          <Badge variant="outline" className={cn("mr-auto border-0 text-[10px]", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs leading-6 text-slate-600">{s.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiReviewOpen(false)}>إغلاق</Button>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => { setAiReviewOpen(false); setActiveTab("edit"); }}>
                <Pencil className="h-4 w-4" />
                تطبيق التحسينات يدوياً
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// حالة فارغة
// ============================================================

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="flex min-h-[60vh] flex-col items-center justify-center border-dashed border-slate-300 bg-white">
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50">
          <ScrollText className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-800">استوديو القوالب القانونية</h2>
          <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">
            صمّم قوالب ذكية لمستنداتك القانونية (صحف دعاوى، مذكرات، عقود، إنذارات)
            مع متغيرات ديناميكية وشروط منطقية ومعاينة حية.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            إنشاء قالب جديد
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={onCreate}>
            <Sparkles className="h-4 w-4 text-emerald-600" />
            ابدأ بمسودة AI
          </Button>
        </div>
        <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-2 text-center">
          <Feature icon={Variable} label="متغيرات ديناميكية" color="text-emerald-600" />
          <Feature icon={Code2} label="شروط وحلقات" color="text-rose-600" />
          <Feature icon={Eye} label="معاينة حية" color="text-amber-600" />
        </div>
      </CardContent>
    </Card>
  );
}

function Feature({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
      <Icon className={cn("h-5 w-5", color)} />
      <span className="text-[10px] font-medium text-slate-600">{label}</span>
    </div>
  );
}

// ============================================================
// مسودة احتياطية محلية (في حال فشل AI API)
// ============================================================

function generateFallbackDraft(type: string, title: string): string {
  const label = TEMPLATE_TYPE_LABEL[type] || "وثيقة قانونية";
  const t = title || label;
  switch (type) {
    case "lawsuit":
    case "appeal":
    case "cassation":
      return `<!-- SECTION: header -->
【رأس الصحيفة】

بسم الله الرحمن الرحيم

المحكمة: {{case.court}} — الدائرة: {{case.circuit}}
رقم القضية: {{case.number}} لسنة {{case.year}} {{case.type}}

<!-- SECTION: intro -->
【تمهيد】
يتقدم الموكل {{client.name}} بمقامة الدعوى رقم {{case.number}} لسنة {{case.year}} أمام عدالتكم ضد {{opponent.name}}، وذلك على النحو الآتي:

<!-- SECTION: facts -->
【الوقائع】
{{case.facts}}

{% if poa.number %}
وكالتنا رقم {{poa.number}}/{{poa.letter}} لسنة {{poa.year}} الصادرة من {{poa.issuer}}.
{% endif %}

<!-- SECTION: requests -->
【الطلبات】
يلتمس المدعي من عدالتكم الموقرة الحكم له بما يلي:
1. ____________________
2. ____________________
3. إلزام المدعى عليه بالمصاريف وأتعاب المحاماة.

<!-- SECTION: conclusion -->
【الخاتمة】
بناءً على ما تقدم، نلتمس من عدالتكم الحكم لنا بطلباتنا.

وكيل المدعي: {{user.name}}
{{firm.name}}
تاريخ: {{date.full}}
`;
    case "memo":
      return `<!-- SECTION: header -->
【مذكرة】
المحكمة: {{case.court}} — القضية: {{case.number}} لسنة {{case.year}}

<!-- SECTION: intro -->
【تمهيد】
مذكرة مقدمة من الموكل {{client.name}} في القضية المذكورة أعلاه.

<!-- SECTION: facts -->
【الوقائع】
{{case.facts}}

<!-- SECTION: requests -->
【الدفوع والطلبات】
أولاً: ____________________
ثانياً: ____________________

<!-- SECTION: conclusion -->
【الخاتمة】
نلتمس من عدالتكم رفض الدعوى لثبوت عدم تأسيسها.

الوكيل: {{user.name}}
{{date.full}}
`;
    case "contract":
      return `<!-- SECTION: header -->
【عقد】
رقم العقد: {{contract.number}}
تاريخه: {{contract.date}}

<!-- SECTION: intro -->
【تمهيد】
أبرم هذا العقد بين:
الطرف الأول: {{client.name}}
الطرف الثاني: {{opponent.name}}

<!-- SECTION: facts -->
【البند الأول — موضوع العقد】
{{contract.parties}}

<!-- SECTION: requests -->
【البند الثاني — القيمة】
قيمة العقد: {{contract.value}}

<!-- SECTION: conclusion -->
【الخاتمة】
حُرر هذا العقد من نسختين بتاريخ {{date.full}}.

الطرف الأول: ____________   الطرف الثاني: ____________
`;
    case "warning":
      return `<!-- SECTION: header -->
【إنذار】
من: {{firm.name}}
إلى: {{opponent.name}}

<!-- SECTION: intro -->
إنذار رسمي

<!-- SECTION: facts -->
نحيطكم علماً بأنه يحق لموكلنا {{client.name}} اتخاذ الإجراءات القانونية بحقكم بسبب:

____________________

<!-- SECTION: conclusion -->
لذا نطلب منكم التصرف خلال 15 يوماً من تاريخه.

الوكيل: {{user.name}}
{{date.full}}
`;
    case "letter":
      return `<!-- SECTION: header -->
【خطاب رسمي】
المرسل: {{firm.name}}
المرسل إليه: {{opponent.name}}

<!-- SECTION: intro -->
الموضوع: ${t}

<!-- SECTION: facts -->
السلام عليكم ورحمة الله وبركاته،

<!-- SECTION: conclusion -->
وتفضلوا بقبول فائق الاحترام،،،

{{user.name}}
{{firm.name}}
{{date.full}}
`;
    case "receipt":
      return `<!-- SECTION: header -->
【إيصال استلام】
رقم: ____________   التاريخ: {{date.today}}

<!-- SECTION: facts -->
استلمت أنا الموقع أدناه {{client.name}} مبلغاً قدره ____________ من {{opponent.name}}.

<!-- SECTION: conclusion -->
المستلم: {{client.name}}
التوقيع: ____________
`;
    default:
      return `<!-- SECTION: header -->
【${label}】
العنوان: ${t}

<!-- SECTION: intro -->
مقدمة الوثيقة...

<!-- SECTION: facts -->
المحتوى الرئيسي...

<!-- SECTION: requests -->
الطلبات / البنود...

<!-- SECTION: conclusion -->
الخاتمة: {{user.name}} — {{date.full}}
`;
  }
}
