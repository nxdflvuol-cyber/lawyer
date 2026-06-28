"use client";

import { useState, useMemo, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  DOCUMENT_CATEGORIES,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  FileText,
  Search,
  Plus,
  Filter,
  X,
  Trash2,
  Edit3,
  Save,
  ChevronLeft,
  Upload,
  Download,
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  FileImage,
  FileType,
  File as FileIcon,
  Eye,
  Briefcase,
  User,
  Calendar,
  Hash,
  Tag,
  HardDrive,
  Clock,
  AlertCircle,
  ImageIcon,
  FileType2,
  ScrollText,
  Link2,
} from "lucide-react";

// ============================================================
// الأنواع
// ============================================================

interface CaseLite {
  id: string;
  internalNumber: string;
}

interface ClientLite {
  id: string;
  fullName: string;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  docType: string;
  category?: string | null;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  fileData?: string | null; // "[stored]" عند العودة من القائمة أو base64 عند التفصيل
  textContent?: string | null;
  tags?: string | null;
  folder?: string | null;
  caseId?: string | null;
  clientId?: string | null;
  case?: CaseLite | null;
  client?: ClientLite | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ثوابت محلية
// ============================================================

const DOC_TYPES = [
  { value: "pdf", label: "PDF", icon: FileType, color: "text-red-600 bg-red-50" },
  { value: "image", label: "صورة", icon: FileImage, color: "text-emerald-600 bg-emerald-50" },
  { value: "word", label: "Word", icon: FileType2, color: "text-sky-600 bg-sky-50" },
  { value: "text", label: "نص", icon: FileText, color: "text-slate-600 bg-slate-50" },
  { value: "other", label: "أخرى", icon: FileIcon, color: "text-amber-600 bg-amber-50" },
];

function getDocTypeConfig(type: string) {
  return DOC_TYPES.find((t) => t.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1];
}

function detectDocType(mime: string, name: string): string {
  const n = name.toLowerCase();
  if (mime === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx")
  )
    return "word";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} م.ب`;
}

function getCategoryLabel(value?: string | null): string {
  if (!value) return "أخرى";
  return DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// ============================================================
// مكوّن مساعد للحالة الفارغة
// ============================================================

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function DocumentsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const selectCase = useNavStore((s) => s.selectCase);
  const setSection = useNavStore((s) => s.setSection);
  const selectedCaseId = useNavStore((s) => s.selectedCaseId);
  const selectedClientId = useNavStore((s) => s.selectedClientId);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "folders">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [detailDocId, setDetailDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // مزامنة مع متجر التنقل
  const [prevCaseId, setPrevCaseId] = useState(selectedCaseId);
  if (selectedCaseId !== prevCaseId) {
    setPrevCaseId(selectedCaseId);
    if (selectedCaseId) setCaseFilter(selectedCaseId);
  }
  const [prevClientId, setPrevClientId] = useState(selectedClientId);
  if (selectedClientId !== prevClientId) {
    setPrevClientId(selectedClientId);
    if (selectedClientId) setClientFilter(selectedClientId);
  }

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (categoryFilter !== "all") p.set("category", categoryFilter);
    if (caseFilter !== "all") p.set("caseId", caseFilter);
    if (clientFilter !== "all") p.set("clientId", clientFilter);
    return p.toString();
  }, [search, categoryFilter, caseFilter, clientFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/documents?${queryParams}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: casesData } = useQuery({
    queryKey: ["cases", "for-doc-select"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-doc-select"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const cases: CaseLite[] = casesData?.cases ?? [];
  const clients: ClientLite[] = clientsData?.clients ?? [];

  const allDocuments: DocumentItem[] = data?.documents ?? [];

  // فلترة محلية حسب النوع (غير مدعومة في API)
  const documents = useMemo(() => {
    if (typeFilter === "all") return allDocuments;
    return allDocuments.filter((d) => d.docType === typeFilter);
  }, [allDocuments, typeFilter]);

  // إحصائيات
  const stats = useMemo(() => {
    const total = allDocuments.length;
    const byCategory: Record<string, number> = {};
    DOCUMENT_CATEGORIES.forEach((c) => {
      byCategory[c.value] = allDocuments.filter((d) => d.category === c.value).length;
    });
    const totalSize = allDocuments.reduce((sum, d) => sum + (d.fileSize ?? 0), 0);
    return { total, byCategory, totalSize };
  }, [allDocuments]);

  // تجميع حسب المجلد
  const folders = useMemo(() => {
    const map: Record<string, DocumentItem[]> = {};
    documents.forEach((d) => {
      const folder = d.folder || "غير مصنف";
      if (!map[folder]) map[folder] = [];
      map[folder].push(d);
    });
    return map;
  }, [documents]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم حذف المستند" });
      setDetailDocId(null);
    },
    onError: () => {
      toast({ title: "فشل الحذف", variant: "destructive" });
    },
  });

  const statCards = [
    {
      title: "إجمالي المستندات",
      value: stats.total,
      icon: FileText,
      color: "text-primary bg-primary/10",
    },
    {
      title: "العقود",
      value: stats.byCategory["contract"] ?? 0,
      icon: ScrollText,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "المذكرات",
      value: stats.byCategory["pleading"] ?? 0,
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "الأحكام",
      value: stats.byCategory["ruling"] ?? 0,
      icon: Hash,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "الأدلة",
      value: stats.byCategory["evidence"] ?? 0,
      icon: AlertCircle,
      color: "text-rose-600 bg-rose-50",
    },
    {
      title: "الحجم الكلي",
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      color: "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            إدارة المستندات
          </h1>
          <p className="text-muted-foreground mt-1">
            أرشفة شاملة للمستندات مع دعم PDF والصور وملفات Word
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSection("cases")}>
            <Briefcase className="w-4 h-4 ml-2" />
            القضايا
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Upload className="w-4 h-4 ml-2" />
            رفع مستند
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", card.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground truncate">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث في العنوان، الوصف، الوسوم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-3.5 h-3.5 ml-1" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Select value={caseFilter} onValueChange={setCaseFilter}>
              <SelectTrigger className="w-full md:w-56">
                <Briefcase className="w-3.5 h-3.5 ml-1" />
                <SelectValue placeholder="القضية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل القضايا</SelectItem>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.internalNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full md:w-56">
                <User className="w-3.5 h-3.5 ml-1" />
                <SelectValue placeholder="الموكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموكلين</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search ||
              categoryFilter !== "all" ||
              typeFilter !== "all" ||
              caseFilter !== "all" ||
              clientFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setTypeFilter("all");
                  setCaseFilter("all");
                  setClientFilter("all");
                  selectCase(null);
                }}
              >
                <X className="w-3.5 h-3.5 ml-1" />
                مسح الفلاتر
              </Button>
            )}
            <span className="text-sm text-muted-foreground mr-auto">
              {documents.length} مستند
            </span>
          </div>
        </CardContent>
      </Card>

      {/* مبدّل العرض */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              شبكة
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1">
              <ListIcon className="w-3.5 h-3.5" />
              قائمة
            </TabsTrigger>
            <TabsTrigger value="folders" className="gap-1">
              <FolderOpen className="w-3.5 h-3.5" />
              مجلدات
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* قائمة المستندات */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد مستندات"
              description="ابدأ برفع مستند جديد لإدارة أرشيف مكتبك القانوني"
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Upload className="w-4 h-4 ml-2" />
                  رفع مستند
                </Button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {documents.map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  onClick={() => setDetailDocId(d.id)}
                  onPreview={() => setPreviewDoc(d)}
                />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {documents.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  onClick={() => setDetailDocId(d.id)}
                  onPreview={() => setPreviewDoc(d)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(folders).map(([folder, docs]) => (
                <div key={folder}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{folder}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {docs.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-6 border-r-2 border-border">
                    {docs.map((d) => (
                      <DocumentCard
                        key={d.id}
                        doc={d}
                        onClick={() => setDetailDocId(d.id)}
                        onPreview={() => setPreviewDoc(d)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة الرفع */}
      <UploadDocumentDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        cases={cases}
        clients={clients}
        onUploaded={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }}
      />

      {/* لوحة تفاصيل المستند */}
      <DocumentDetailSheet
        docId={detailDocId}
        open={!!detailDocId}
        onClose={() => setDetailDocId(null)}
        onDelete={(id) => deleteMutation.mutate(id)}
        cases={cases}
        clients={clients}
      />

      {/* معاينة سريعة */}
      <DocumentPreviewDialog
        doc={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

// ============================================================
// بطاقة مستند (شبكة/مجلدات)
// ============================================================

function DocumentCard({
  doc,
  onClick,
  onPreview,
}: {
  doc: DocumentItem;
  onClick: () => void;
  onPreview: () => void;
}) {
  const Icon = getDocTypeConfig(doc.docType).icon;
  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in flex flex-col"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn("p-2 rounded-lg", getDocTypeConfig(doc.docType).color)}>
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className="text-xs">
          {getCategoryLabel(doc.category)}
        </Badge>
      </div>
      <p className="font-medium text-foreground truncate">{doc.title}</p>
      {doc.description && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {doc.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          {formatFileSize(doc.fileSize)}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(doc.createdAt)}
        </span>
      </div>
      {doc.case && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 truncate">
          <Briefcase className="w-3 h-3 text-primary" />
          {doc.case.internalNumber}
        </div>
      )}
      <div className="mt-auto pt-2">
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="w-3.5 h-3.5 ml-1" />
          معاينة
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// صف مستند (قائمة)
// ============================================================

function DocumentRow({
  doc,
  onClick,
  onPreview,
}: {
  doc: DocumentItem;
  onClick: () => void;
  onPreview: () => void;
}) {
  const Icon = getDocTypeConfig(doc.docType).icon;
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in flex items-center gap-3"
    >
      <div className={cn("p-2 rounded-lg flex-shrink-0", getDocTypeConfig(doc.docType).color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{doc.title}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {getDocTypeConfig(doc.docType).label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getCategoryLabel(doc.category)}
            </Badge>
          </div>
        </div>
        {doc.description && (
          <p className="text-xs text-muted-foreground truncate">
            {doc.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(doc.fileSize)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(doc.createdAt)}
          </span>
          {doc.case && (
            <span className="flex items-center gap-1 text-primary">
              <Briefcase className="w-3 h-3" />
              {doc.case.internalNumber}
            </span>
          )}
          {doc.client && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {doc.client.fullName}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
      >
        <Eye className="w-3.5 h-3.5 ml-1" />
        معاينة
      </Button>
      <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </div>
  );
}

// ============================================================
// نافذة رفع مستند
// ============================================================

interface UploadForm {
  title: string;
  description: string;
  category: string;
  folder: string;
  caseId: string;
  clientId: string;
  tags: string;
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  cases,
  clients,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cases: CaseLite[];
  clients: ClientLite[];
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null); // base64 data URL
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<UploadForm>({
    title: "",
    description: "",
    category: "other",
    folder: "",
    caseId: "",
    clientId: "",
    tags: "",
  });

  function resetForm() {
    setSelectedFile(null);
    setFilePreview(null);
    setForm({
      title: "",
      description: "",
      category: "other",
      folder: "",
      caseId: "",
      clientId: "",
      tags: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    // تحديد حجم أقصى (10 م.ب لقاعدة البيانات)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى 10 ميجابايت",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    if (!form.title) {
      setForm((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, "") }));
    }
    // قراءة base64
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.onerror = () => {
      toast({ title: "تعذّر قراءة الملف", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !filePreview) throw new Error("no file");
      setUploading(true);
      const docType = detectDocType(selectedFile.type, selectedFile.name);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          docType,
          category: form.category,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          fileData: filePreview,
          tags: form.tags || null,
          folder: form.folder || null,
          caseId: form.caseId || null,
          clientId: form.clientId || null,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUploading(false);
      if (data.success) {
        toast({
          title: "تم رفع المستند",
          description: form.title,
        });
        resetForm();
        onUploaded();
      } else {
        toast({
          title: "فشل الرفع",
          description: data.error ?? "خطأ غير معروف",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setUploading(false);
      toast({ title: "خطأ في الرفع", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!selectedFile) {
      toast({ title: "اختر ملفاً أولاً", variant: "destructive" });
      return;
    }
    if (!form.title) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    uploadMutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            رفع مستند جديد
          </DialogTitle>
          <DialogDescription>
            يدعم PDF، الصور (JPG/PNG/GIF)، وملفات Word. الحد الأقصى 10 ميجابايت.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* منطقة رفع الملف */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e.target.files?.[0] ?? null)
                }
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    {selectedFile.type.startsWith("image/") && filePreview ? (
                      <img
                        src={filePreview}
                        alt={selectedFile.name}
                        className="max-h-40 rounded-lg border"
                      />
                    ) : (
                      <div className={cn(
                        "p-3 rounded-lg",
                        getDocTypeConfig(detectDocType(selectedFile.type, selectedFile.name)).color
                      )}>
                        {(() => {
                          const Icon = getDocTypeConfig(detectDocType(selectedFile.type, selectedFile.name)).icon;
                          return <Icon className="w-10 h-10" />;
                        })()}
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} •{" "}
                    {selectedFile.type || "نوع غير معروف"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                  >
                    <X className="w-3.5 h-3.5 ml-1" />
                    إزالة
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <p className="font-medium">اسحب الملف هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, GIF, DOC, DOCX, TXT
                  </p>
                </div>
              )}
            </div>

            {/* بيانات المستند */}
            <div className="space-y-1.5">
              <Label>
                عنوان المستند <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: عقد وكالة - موكل أحمد"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="وصف موجز لمحتوى المستند..."
                className="min-h-16"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الفئة</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>المجلد</Label>
                <Input
                  value={form.folder}
                  onChange={(e) => setForm({ ...form, folder: e.target.value })}
                  placeholder="مثال: عقود 2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>القضية المرتبطة</Label>
                <Select
                  value={form.caseId}
                  onValueChange={(v) =>
                    setForm({ ...form, caseId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.internalNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموكل المرتبط</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) =>
                    setForm({ ...form, clientId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الوسوم</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="وسوم مفصولة بفواصل (مثال: مهم, عاجل, مالي)"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Clock className="w-4 h-4 ml-2 animate-pulse" />
                جارٍ الرفع...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                رفع المستند
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل المستند
// ============================================================

function DocumentDetailSheet({
  docId,
  open,
  onClose,
  onDelete,
  cases,
  clients,
}: {
  docId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  cases: CaseLite[];
  clients: ClientLite[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    category: string;
    folder: string;
    tags: string;
    caseId: string;
    clientId: string;
  }>({
    title: "",
    description: "",
    category: "other",
    folder: "",
    tags: "",
    caseId: "",
    clientId: "",
  });
  const [docDetail, setDocDetail] = useState<DocumentItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["document", docId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${docId}`);
      return res.json();
    },
    enabled: !!docId,
  });

  // مزامنة البيانات مع نمط React 19 الموصى به
  const [prevData, setPrevData] = useState<DocumentItem | null>(null);
  const doc: DocumentItem | null = data?.document ?? null;
  if (doc !== prevData) {
    setPrevData(doc);
    setDocDetail(doc);
    if (doc && !editing) {
      setEditForm({
        title: doc.title,
        description: doc.description ?? "",
        category: doc.category ?? "other",
        folder: doc.folder ?? "",
        tags: doc.tags ?? "",
        caseId: doc.caseId ?? "",
        clientId: doc.clientId ?? "",
      });
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", docId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "تم تحديث المستند" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  function handleSave() {
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      category: editForm.category,
      folder: editForm.folder || null,
      tags: editForm.tags || null,
      caseId: editForm.caseId || null,
      clientId: editForm.clientId || null,
    });
  }

  function handleDownload() {
    if (!docDetail?.fileData || docDetail.fileData === "[stored]") {
      toast({ title: "لا توجد بيانات ملف متاحة للتحميل", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = docDetail.fileData;
    link.download = docDetail.fileName || docDetail.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!open || !docId) return null;
  const Icon = docDetail ? getDocTypeConfig(docDetail.docType).icon : FileText;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              ) : docDetail ? (
                <>
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {docDetail.title}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeConfig(docDetail.docType).label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(docDetail.category)}
                    </Badge>
                  </SheetDescription>
                </>
              ) : (
                <SheetTitle>المستند غير موجود</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {docDetail && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(!editing)}
                    title={editing ? "إلغاء التعديل" : "تعديل"}
                  >
                    {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    title="تحميل"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDelete(true)}
                    title="حذف"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : docDetail ? (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* معاينة الملف */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    معاينة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {docDetail.docType === "image" &&
                  docDetail.fileData &&
                  docDetail.fileData !== "[stored]" ? (
                    <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2">
                      <img
                        src={docDetail.fileData}
                        alt={docDetail.title}
                        className="max-h-80 rounded-lg border"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                      <div className={cn("p-3 rounded-lg", getDocTypeConfig(docDetail.docType).color)}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{docDetail.fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getDocTypeConfig(docDetail.docType).label} •{" "}
                          {formatFileSize(docDetail.fileSize)}
                        </p>
                      </div>
                      {docDetail.fileData && docDetail.fileData !== "[stored]" && (
                        <Button size="sm" variant="outline" onClick={handleDownload}>
                          <Download className="w-3.5 h-3.5 ml-1" />
                          تحميل
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* البيانات */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    بيانات المستند
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editing ? (
                    <>
                      <div className="space-y-1.5">
                        <Label>العنوان</Label>
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>الوصف</Label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="min-h-16"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>الفئة</Label>
                          <Select
                            value={editForm.category}
                            onValueChange={(v) =>
                              setEditForm({ ...editForm, category: v })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>المجلد</Label>
                          <Input
                            value={editForm.folder}
                            onChange={(e) =>
                              setEditForm({ ...editForm, folder: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>القضية</Label>
                          <Select
                            value={editForm.caseId || "none"}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                caseId: v === "none" ? "" : v,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون</SelectItem>
                              {cases.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.internalNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>الموكل</Label>
                          <Select
                            value={editForm.clientId || "none"}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                clientId: v === "none" ? "" : v,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون</SelectItem>
                              {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>الوسوم</Label>
                        <Input
                          value={editForm.tags}
                          onChange={(e) =>
                            setEditForm({ ...editForm, tags: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <DetailRow
                        icon={FileText}
                        label="العنوان"
                        value={docDetail.title}
                      />
                      {docDetail.description && (
                        <DetailRow
                          icon={FileText}
                          label="الوصف"
                          value={docDetail.description}
                        />
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow
                          icon={Tag}
                          label="الفئة"
                          value={getCategoryLabel(docDetail.category)}
                        />
                        <DetailRow
                          icon={FileType}
                          label="النوع"
                          value={getDocTypeConfig(docDetail.docType).label}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow
                          icon={HardDrive}
                          label="الحجم"
                          value={formatFileSize(docDetail.fileSize)}
                        />
                        <DetailRow
                          icon={Calendar}
                          label="تاريخ الرفع"
                          value={formatDate(docDetail.createdAt)}
                        />
                      </div>
                      <DetailRow
                        icon={FileIcon}
                        label="اسم الملف"
                        value={docDetail.fileName}
                      />
                      {docDetail.mimeType && (
                        <DetailRow
                          icon={FileType2}
                          label="نوع MIME"
                          value={docDetail.mimeType}
                        />
                      )}
                      {docDetail.folder && (
                        <DetailRow
                          icon={FolderOpen}
                          label="المجلد"
                          value={docDetail.folder}
                        />
                      )}
                      {docDetail.tags && (
                        <DetailRow
                          icon={Tag}
                          label="الوسوم"
                          value={docDetail.tags}
                        />
                      )}
                      {docDetail.case && (
                        <DetailRow
                          icon={Briefcase}
                          label="القضية"
                          value={docDetail.case.internalNumber}
                        />
                      )}
                      {docDetail.client && (
                        <DetailRow
                          icon={User}
                          label="الموكل"
                          value={docDetail.client.fullName}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* المحتوى النصي */}
              {docDetail.textContent && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-primary" />
                      المحتوى النصي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-64 rounded border bg-muted/30 p-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {docDetail.textContent}
                      </p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : null}

        {/* تأكيد الحذف */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف المستند</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف &quot;{docDetail?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (docId) onDelete(docId);
                  setConfirmDelete(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-1 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// معاينة سريعة
// ============================================================

function DocumentPreviewDialog({
  doc,
  open,
  onClose,
}: {
  doc: DocumentItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [fullDoc, setFullDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [prevDocId, setPrevDocId] = useState<string | null>(null);

  // جلب البيانات الكاملة عند فتح المعاينة لمستند جديد
  if (doc?.id !== prevDocId) {
    setPrevDocId(doc?.id ?? null);
    setFullDoc(null);
    if (doc && open) {
      setLoading(true);
      fetch(`/api/documents/${doc.id}`)
        .then((r) => r.json())
        .then((data) => {
          setFullDoc(data.document ?? null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }

  if (!doc) return null;
  const Icon = getDocTypeConfig(doc.docType).icon;

  function handleDownload() {
    if (!fullDoc?.fileData || fullDoc.fileData === "[stored]") {
      toast({ title: "لا توجد بيانات ملف", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = fullDoc.fileData;
    link.download = fullDoc.fileName || fullDoc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const previewDoc = fullDoc ?? doc;
  const hasImageData =
    previewDoc.docType === "image" &&
    previewDoc.fileData &&
    previewDoc.fileData !== "[stored]";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {doc.title}
          </DialogTitle>
          <DialogDescription>
            {getDocTypeConfig(doc.docType).label} •{" "}
            {formatFileSize(doc.fileSize)} •{" "}
            {getCategoryLabel(doc.category)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Clock className="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
          ) : hasImageData ? (
            <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-64">
              <img
                src={previewDoc.fileData!}
                alt={doc.title}
                className="max-h-[60vh] rounded-lg border"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8">
              <div className={cn("p-4 rounded-lg", getDocTypeConfig(doc.docType).color)}>
                <Icon className="w-12 h-12" />
              </div>
              <p className="font-medium text-foreground">{doc.fileName}</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {doc.docType === "pdf"
                  ? "ملفات PDF تُحمّل فقط ولا تُعرض مباشرة في المتصفح."
                  : doc.docType === "word"
                  ? "ملفات Word تُحمّل فقط."
                  : "هذا النوع من الملفات لا يدعم المعاينة المباشرة."}
              </p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 ml-2" />
                تحميل الملف
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button onClick={handleDownload} disabled={loading}>
            <Download className="w-4 h-4 ml-2" />
            تحميل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
