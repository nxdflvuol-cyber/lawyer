"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Plus,
  Search,
  Scale,
  Gavel,
  FileText,
  Lightbulb,
  Library,
  GraduationCap,
  Trash2,
  BookMarked,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ITEM_TYPES = [
  { value: "law", label: "تشريع", icon: Scale },
  { value: "precedent", label: "سابقة قضائية", icon: Gavel },
  { value: "template", label: "قالب", icon: FileText },
  { value: "jurisprudence", label: "فقه قانوني", icon: BookOpen },
  { value: "article", label: "مقال", icon: Lightbulb },
];

export function ResearchSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    itemType: "law",
    category: "",
    content: "",
    reference: "",
    source: "",
    tags: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["library", search, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterType !== "all") params.append("itemType", filterType);
      const res = await fetch(`/api/research?${params}`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast({ title: "تمت الإضافة", description: "تم إضافة العنصر للمكتبة" });
      setOpen(false);
      setForm({ title: "", itemType: "law", category: "", content: "", reference: "", source: "", tags: "" });
    },
  });

  const items = data?.items ?? [];

  const stats = ITEM_TYPES.map((type) => ({
    ...type,
    count: items.filter((i: { itemType: string }) => i.itemType === type.value).length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            البحث العلمي والأكاديمي
          </h1>
          <p className="text-muted-foreground mt-2">
            المكتبة القانونية الشاملة والأبحاث الأكاديمية
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عنصر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة عنصر للمكتبة القانونية</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>العنوان</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>النوع</Label>
                  <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>التصنيف</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>المرجع</Label>
                  <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>المصدر</Label>
                  <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الوسوم (مفصولة بفواصل)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>المحتوى</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                {mutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات النوع */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.value} className="cursor-pointer hover:shadow-md transition" onClick={() => setFilterType(stat.value)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl font-bold">{stat.count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* بحث وفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في المكتبة القانونية..."
                className="pr-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة العناصر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Library className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد عناصر في المكتبة</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ بإضافة نصوص قانونية وسوابق قضائية</p>
          </div>
        ) : (
          items.map((item: {
            id: string;
            title: string;
            itemType: string;
            category?: string;
            content: string;
            reference?: string;
            source?: string;
            tags?: string;
            createdAt: string;
          }) => {
            const type = ITEM_TYPES.find((t) => t.value === item.itemType);
            const Icon = type?.icon ?? BookOpen;
            return (
              <Card key={item.id} className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{type?.label}</Badge>
                      </div>
                      {item.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {item.content.slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {item.reference && (
                          <span className="flex items-center gap-1">
                            <BookMarked className="w-3 h-3" />
                            {item.reference}
                          </span>
                        )}
                        {item.tags && (
                          <span className="truncate">{item.tags.split(",").slice(0, 2).join("، ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* أدوات البحث */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            أدوات البحث والتدريب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "محلل القانون المقارن", icon: Scale },
              { label: "تحليل الاتجاهات القضائية", icon: Gavel },
              { label: "محاكاة قضايا افتراضية", icon: FileText },
              { label: "اختبارات معرفية", icon: GraduationCap },
            ].map((tool, i) => {
              const Icon = tool.icon;
              return (
                <button
                  key={i}
                  onClick={() => toast({ title: tool.label, description: "قريباً" })}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/30 transition text-center"
                >
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
