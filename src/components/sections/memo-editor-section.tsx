"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  PenLine,
  Sparkles,
  Save,
  FileText,
  Printer,
  Plus,
  Trash2,
  BookOpen,
  Wand2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SavedMemo {
  id: string;
  title: string;
  content: string;
  type: string;
  updatedAt: number;
}

const MEMO_TEMPLATES = [
  {
    id: "defense-memo",
    title: "مذكرة دفاع",
    type: "memo",
    content: `<h1>مذكرة دفاع</h1>
<p><strong>المحكمة:</strong> _________________</p>
<p><strong>الدائرة:</strong> _________________</p>
<p><strong>رقم القضية:</strong> _________________ لسنة __________</p>
<h2>الوقائع</h2>
<p>_______________</p>
<h2>الطلبات</h2>
<p>يلتمس المدعى عليه من عدالة المحكمة الموقرة:</p>
<ol>
<li>_________________</li>
<li>_________________</li>
</ol>
<h2>الدفوع</h2>
<p><strong>أولاً:</strong> _________________</p>
<p><strong>ثانياً:</strong> _________________</p>
<h2>الخاتمة</h2>
<p>بناءً على ما تقدم، نلتمس الحكم:</p>
<ol>
<li>_________________</li>
<li>إلزام المدعي بالمصروفات والأتعاب.</li>
</ol>
<p><strong>المحامي:</strong> _________________</p>`,
  },
  {
    id: "lawsuit",
    title: "صحيفة دعوى",
    type: "pleading",
    content: `<h1>صحيفة دعوى</h1>
<p><strong>المحكمة:</strong> _________________</p>
<p><strong>الدائرة:</strong> _________________</p>
<h2>الخصوم</h2>
<p><strong>المدعي:</strong> _________________</p>
<p><strong>المدعى عليه:</strong> _________________</p>
<h2>الموضوع</h2>
<p>_______________</p>
<h2>الطلبات الختامية</h2>
<p>يلتمس المدعي من عدالة المحكمة الموقرة الحكم له بآتي:</p>
<ol>
<li>_________________</li>
<li>إلزام المدعى عليه بالمصروفات والأتعاب.</li>
</ol>`,
  },
  {
    id: "contract",
    title: "عقد",
    type: "contract",
    content: `<h1>عقد _________________</h1>
<p>إنه في يوم _________________ الموافق _________________، قد تراضى كل من:</p>
<p><strong>الطرف الأول:</strong> _________________</p>
<p><strong>الطرف الثاني:</strong> _________________</p>
<h2>التمهيد</h2>
<p>_______________</p>
<h2>البنود</h2>
<p><strong>المادة الأولى:</strong> _________________</p>
<p><strong>المادة الثانية:</strong> _________________</p>
<p><strong>المادة الثالثة:</strong> _________________</p>
<h2>التوقيعات</h2>
<p>الطرف الأول: _________________</p>
<p>الطرف الثاني: _________________</p>`,
  },
  {
    id: "consultation",
    title: "استشارة قانونية",
    type: "consultation",
    content: `<h1>استشارة قانونية</h1>
<p><strong>التاريخ:</strong> _________________</p>
<p><strong>المستشير:</strong> _________________</p>
<h2>السؤال</h2>
<p>_______________</p>
<h2>الإجابة</h2>
<p>_______________</p>
<h2>النصيحة القانونية</h2>
<p>_______________</p>`,
  },
];

export function MemoEditorSection() {
  const { toast } = useToast();
  const [memos, setMemos] = useState<SavedMemo[]>([]);
  const [activeMemoId, setActiveMemoId] = useState<string | null>(null);
  const [title, setTitle] = useState("مذكرة جديدة");
  const [content, setContent] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [aiDocType, setAiDocType] = useState("مذكرة دفاع");
  const [aiParams, setAiParams] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // تحميل المذكرات المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem("shamel-memos");
    if (saved) {
      const parsed = JSON.parse(saved) as SavedMemo[];
      setMemos(parsed);
      if (parsed.length > 0) {
        setActiveMemoId(parsed[0].id);
        setTitle(parsed[0].title);
        setContent(parsed[0].content);
      }
    }
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (activeMemoId) {
      const timeout = setTimeout(() => {
        setMemos((prev) =>
          prev.map((m) =>
            m.id === activeMemoId ? { ...m, title, content, updatedAt: Date.now() } : m
          )
        );
        localStorage.setItem("shamel-memos", JSON.stringify(memos));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [title, content, activeMemoId, memos]);

  function newMemo() {
    const memo: SavedMemo = {
      id: Math.random().toString(36).slice(2),
      title: "مذكرة جديدة",
      content: "",
      type: "memo",
      updatedAt: Date.now(),
    };
    setMemos((prev) => [memo, ...prev]);
    setActiveMemoId(memo.id);
    setTitle(memo.title);
    setContent(memo.content);
  }

  function loadTemplate(template: typeof MEMO_TEMPLATES[0]) {
    setContent(template.content);
    setTitle(template.title);
    toast({ title: "تم تحميل القالب", description: template.title });
  }

  function execCmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }

  function handleEditorInput() {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }

  async function generateWithAI() {
    if (!aiParams.trim()) {
      toast({ title: "أدخل المعطيات", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: aiDocType,
          params: { المعطيات: aiParams },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const generated = `<h1>${aiDocType}</h1><div>${data.content.replace(/\n/g, "<br>")}</div>`;
      setContent(generated);
      if (editorRef.current) {
        editorRef.current.innerHTML = generated;
      }
      setAiDialogOpen(false);
      toast({ title: "تم توليد المستند بالذكاء الاصطناعي", description: "راجع المحتوى وحرّره حسب الحاجة" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function openLibrary() {
    setLibraryDialogOpen(true);
    try {
      const res = await fetch("/api/research");
      const data = await res.json();
      if (data.success) setLibraryItems(data.items ?? []);
    } catch {
      // ignore
    }
  }

  function insertLibraryItem(item: { content: string; title: string }) {
    const html = `<blockquote class="border-r-4 border-primary pr-3 py-1 bg-accent/30 my-2"><strong>${item.title}:</strong><br>${item.content}</blockquote>`;
    const newContent = content + html;
    setContent(newContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = newContent;
    }
    setLibraryDialogOpen(false);
    toast({ title: "تم الإدراج", description: item.title });
  }

  function printMemo() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar"><head><title>${title}</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; padding: 40px; line-height: 1.8; }
        h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
        h2 { color: #0f766e; margin-top: 24px; }
        blockquote { border-right: 4px solid #0f766e; padding-right: 12px; background: #f0fdfa; padding: 8px 12px; }
      </style></head><body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const wordCount = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* الشريط الجانبي - المذكرات */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2 hidden md:flex">
        <Button onClick={newMemo}>
          <Plus className="w-4 h-4 ml-2" />
          مذكرة جديدة
        </Button>
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              المذكرات المحفوظة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-2">
                {memos.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">لا توجد مذكرات</p>
                ) : (
                  memos.map((memo) => (
                    <button
                      key={memo.id}
                      onClick={() => {
                        setActiveMemoId(memo.id);
                        setTitle(memo.title);
                        setContent(memo.content);
                        if (editorRef.current) editorRef.current.innerHTML = memo.content;
                      }}
                      className={cn(
                        "group w-full flex items-center gap-2 p-2 rounded-md text-right transition",
                        memo.id === activeMemoId ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                      <span className="text-sm truncate flex-1">{memo.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemos((prev) => prev.filter((m) => m.id !== memo.id));
                          if (memo.id === activeMemoId) {
                            setActiveMemoId(null);
                            setTitle("");
                            setContent("");
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {/* القوالب */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              قوالب جاهزة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {MEMO_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t)}
                className="w-full text-right p-2 rounded-md hover:bg-accent text-sm"
              >
                {t.title}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* المحرر */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 h-9 text-base font-medium"
              placeholder="عنوان المذكرة"
            />
            <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(true)}>
              <Sparkles className="w-4 h-4 ml-2 text-primary" />
              توليد بالـ AI
            </Button>
            <Button variant="outline" size="icon" onClick={openLibrary} title="إدراج من المكتبة">
              <BookOpen className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={printMemo} title="طباعة">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* شريط الأدوات */}
        <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => execCmd("bold")} title="عريض">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("italic")} title="مائل">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("underline")} title="تسطير">
            <Underline className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => execCmd("formatBlock", "h1")} title="عنوان 1">
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("formatBlock", "h2")} title="عنوان 2">
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("formatBlock", "h3")} title="عنوان 3">
            <Heading3 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => execCmd("insertUnorderedList")} title="قائمة نقطية">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("insertOrderedList")} title="قائمة رقمية">
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => execCmd("formatBlock", "blockquote")} title="اقتباس">
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        {/* منطقة التحرير */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_h1]:text-primary [&_h1]:border-b [&_h1]:border-primary/30 [&_h1]:pb-1 [&_h2]:text-primary/80 [&_blockquote]:border-r-4 [&_blockquote]:border-primary [&_blockquote]:pr-3 [&_blockquote]:bg-accent/30 [&_blockquote]:py-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* الشريط السفلي */}
        <div className="border-t border-border p-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{wordCount} كلمة</span>
            <Badge variant="outline" className="text-xs">حفظ تلقائي</Badge>
          </div>
          <span>المحرر القانوني الذكي</span>
        </div>
      </Card>

      {/* Dialog توليد بالـ AI */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              توليد مستند بالذكاء الاصطناعي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع المستند</Label>
              <Select value={aiDocType} onValueChange={setAiDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="مذكرة دفاع">مذكرة دفاع</SelectItem>
                  <SelectItem value="صحيفة دعوى">صحيفة دعوى</SelectItem>
                  <SelectItem value="عقد بيع">عقد بيع</SelectItem>
                  <SelectItem value="عقد إيجار">عقد إيجار</SelectItem>
                  <SelectItem value="عقد عمل">عقد عمل</SelectItem>
                  <SelectItem value="استشارة قانونية">استشارة قانونية</SelectItem>
                  <SelectItem value="عقد شراكة">عقد شراكة</SelectItem>
                  <SelectItem value="مذكرة استئناف">مذكرة استئناف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المعطيات والتفاصيل</Label>
              <Textarea
                value={aiParams}
                onChange={(e) => setAiParams(e.target.value)}
                placeholder="اكتب تفاصيل المستند المطلوب... مثلاً: عقد بيع شقة سكنية بين أحمد ومحمد، المبلغ 500 ألف جنيه، الدفع نقداً..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={generateWithAI} disabled={aiLoading}>
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  توليد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog المكتبة القانونية */}
      <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إدراج من المكتبة القانونية</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {libraryItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  لا توجد عناصر في المكتبة. أضف نصوصاً قانونية من قسم البحث العلمي.
                </p>
              ) : (
                libraryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => insertLibraryItem(item)}
                    className="w-full text-right p-3 rounded-md hover:bg-accent border border-border"
                  >
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{item.content.slice(0, 100)}</p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
