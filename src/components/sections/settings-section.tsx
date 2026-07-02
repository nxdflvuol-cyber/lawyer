"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsStore, useAuthStore, useNavStore } from "@/lib/stores";
import {
  Settings as SettingsIcon,
  User,
  Building,
  Palette,
  Shield,
  Bell,
  Database,
  Save,
  Moon,
  Sun,
  Eye,
  Languages,
  Clock,
  Brain,
  Wifi,
  CheckCircle,
  XCircle,
  Loader2,
  Server,
  UserCog,
  Plus,
  Trash2,
  Edit3,
  Power,
  Send,
  MessageCircle,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { DEFAULT_PERMISSIONS, ROLE_LABELS, type UserRole, type AccessLevel } from "@/lib/permissions";
import type { SectionId } from "@/lib/stores";

export function SettingsSection() {
  const settings = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const setIdleTimeout = useAuthStore((s) => s.setIdleTimeout);
  const idleTimeout = useAuthStore((s) => s.idleTimeout);
  const workMode = useNavStore((s) => s.workMode);
  const setWorkMode = useNavStore((s) => s.setWorkMode);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [lawFirmName, setLawFirmName] = useState(settings.lawFirmName);
  const [lawyerName, setLawyerName] = useState(settings.lawyerName);
  const [barNumber, setBarNumber] = useState(settings.barNumber);
  const [currency, setCurrency] = useState(settings.currency);

  function saveGeneral() {
    settings.setSetting("lawFirmName", lawFirmName);
    settings.setSetting("lawyerName", lawyerName);
    settings.setSetting("barNumber", barNumber);
    settings.setSetting("currency", currency);
    // حفظ في قاعدة البيانات
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: { lawFirmName, lawyerName, barNumber, currency },
      }),
    });
    toast({ title: "تم الحفظ", description: "تم حفظ الإعدادات بنجاح" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground mt-2">
          مركز التحكم الشامل في النظام والتخصيصات
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-8">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="notifications">التنبيهات</TabsTrigger>
          <TabsTrigger value="modes">أوضاع</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <UserCog className="w-3.5 h-3.5" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            تليجرام
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1">
            <ToggleRight className="w-3.5 h-3.5" />
            الميزات
          </TabsTrigger>
        </TabsList>

        {/* عام */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                بيانات المكتب
              </CardTitle>
              <CardDescription>معلومات المكتب القانوني الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المكتب</Label>
                  <Input value={lawFirmName} onChange={(e) => setLawFirmName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>اسم المحامي الرئيسي</Label>
                  <Input value={lawyerName} onChange={(e) => setLawyerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>رقم القيد بنقابة المحامين</Label>
                  <Input value={barNumber} onChange={(e) => setBarNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ج.م">جنيه مصري (ج.م)</SelectItem>
                      <SelectItem value="ر.س">ريال سعودي (ر.س)</SelectItem>
                      <SelectItem value="د.إ">درهم إماراتي (د.إ)</SelectItem>
                      <SelectItem value="د.ك">دينار كويتي (د.ك)</SelectItem>
                      <SelectItem value="$">دولار أمريكي ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveGeneral}>
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                بيانات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">الاسم</Label>
                  <p className="font-medium">{user?.name ?? "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                  <p className="font-medium">{user?.email ?? "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">الدور</Label>
                  <p className="font-medium">{user?.role === "admin" ? "مدير" : user?.role === "lawyer" ? "محامي" : "مساعد"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* المظهر */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                السمة
              </CardTitle>
              <CardDescription>اختر مظهر الواجهة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                    theme === "light" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Sun className="w-8 h-8 text-amber-500" />
                  <span className="font-medium">فاتح</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                    theme === "dark" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Moon className="w-8 h-8 text-indigo-500" />
                  <span className="font-medium">داكن</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                اللغة والمنطقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>اللغة</Label>
                  <p className="text-xs text-muted-foreground">لغة الواجهة</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => settings.setSetting("language", v as "ar" | "en")}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>نوع التقويم</Label>
                  <p className="text-xs text-muted-foreground">ميلادي أو هجري</p>
                </div>
                <Select value={settings.dateFormat} onValueChange={(v) => settings.setSetting("dateFormat", v as "gregorian" | "hijri")}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gregorian">ميلادي</SelectItem>
                    <SelectItem value="hijri">هجري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الأمان */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                تسجيل الخروج التلقائي
              </CardTitle>
              <CardDescription>فترة الخمول قبل تسجيل الخروج التلقائي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>مدة الخمول</Label>
                  <p className="text-xs text-muted-foreground">بالدقائق</p>
                </div>
                <Select value={String(idleTimeout)} onValueChange={(v) => setIdleTimeout(parseInt(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 دقائق</SelectItem>
                    <SelectItem value="15">15 دقيقة</SelectItem>
                    <SelectItem value="30">30 دقيقة</SelectItem>
                    <SelectItem value="60">ساعة</SelectItem>
                    <SelectItem value="120">ساعتين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                وضع الخصوصية
              </CardTitle>
              <CardDescription>إخفاء المعلومات الحساسة في الأماكن العامة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تفعيل وضع الخصوصية</Label>
                  <p className="text-xs text-muted-foreground">إخفاء الأسماء والمبالغ الحساسة</p>
                </div>
                <Switch
                  checked={settings.privacyMode}
                  onCheckedChange={(v) => settings.setSetting("privacyMode", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>وضع التمويه</Label>
                  <p className="text-xs text-muted-foreground">عرض بيانات وهمية عند الإكراه</p>
                </div>
                <Switch
                  checked={settings.camouflageMode}
                  onCheckedChange={(v) => settings.setSetting("camouflageMode", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التنبيهات */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                إعدادات التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تفعيل التنبيهات</Label>
                  <p className="text-xs text-muted-foreground">إشعارات النظام</p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(v) => settings.setSetting("notificationsEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>تنبيهات صوتية</Label>
                  <p className="text-xs text-muted-foreground">أصوات للتنبيهات</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(v) => settings.setSetting("soundEnabled", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* أوضاع العمل */}
        <TabsContent value="modes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                وضع العمل الحالي
              </CardTitle>
              <CardDescription>اختر واجهة مناسبة لسياق الاستخدام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: "office", label: "في المكتب", desc: "عرض تفصيلي شامل" },
                  { value: "court", label: "في المحكمة", desc: "واجهة مبسطة وسريعة" },
                  { value: "client-meeting", label: "مقابلة عميل", desc: "تركيز على بيانات العميل" },
                  { value: "pleading", label: "المرافعة", desc: "نقاط المرافعة والأدلة" },
                  { value: "investigation", label: "التحقيق", desc: "تدوين الملاحظات" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setWorkMode(mode.value as typeof workMode)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-lg border-2 transition text-right ${
                      workMode === mode.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="font-medium">{mode.label}</p>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الذكاء الاصطناعي */}
        <TabsContent value="ai" className="space-y-4">
          <AiProviderCard />
        </TabsContent>

        {/* المستخدمون والصلاحيات */}
        <TabsContent value="users" className="space-y-4">
          <UsersManagementCard />
        </TabsContent>

        {/* تليجرام */}
        <TabsContent value="telegram" className="space-y-4">
          <TelegramSettingsCard />
        </TabsContent>

        {/* الميزات (Feature Flags) */}
        <TabsContent value="features" className="space-y-4">
          <FeatureFlagsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// بطاقة Feature Flags - تفعيل/إيقاف الميزات
// ============================================================
function FeatureFlagsCard() {
  const [flags, setFlags] = useState<Array<{ id: string; label: string; description: string; enabled: boolean; isOverride: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/feature-flags?role=admin");
        const data = await res.json();
        if (!cancelled && data.success) setFlags(data.flags);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function toggleFlag(id: string, enabled: boolean) {
    setFlags((prev) => prev.map((f) => f.id === id ? { ...f, enabled: !enabled, isOverride: true } : f));
    try {
      await fetch("/api/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "admin", flagId: id, enabled: !enabled }),
      });
    } catch {}
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ToggleRight className="w-5 h-5 text-primary" />
          إدارة الميزات (Feature Flags)
        </CardTitle>
        <CardDescription>
          تفعيل أو إيقاف أي ميزة في النظام دون تعديل الكود. الإعدادات تنطبق على دور المدير.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.map((flag) => (
          <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{flag.label}</span>
                {flag.isOverride && (
                  <Badge variant="secondary" className="text-[10px]">مخصص</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
            </div>
            <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id, flag.enabled)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// بطاقة إعدادات مزود الذكاء الاصطناعي
// ============================================================
function AiProviderCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // جلب الإعدادات الحالية
  const { refetch } = useQuery({
    queryKey: ["ai-provider"],
    queryFn: async () => {
      const res = await fetch("/api/ai/provider");
      const data = await res.json();
      if (data.success) {
        setBaseUrl(data.config.baseUrl);
        setModel(data.config.model);
        setHasKey(data.config.hasKey);
      }
      return data;
    },
  });

  // تعيين القيم الافتراضية بعد التحميل
  if (!loaded && baseUrl === "" && model === "") {
    setLoaded(true);
    refetch();
  }

  async function saveSettings() {
    try {
      const updates: { baseUrl?: string; apiKey?: string; model?: string } = {};
      if (baseUrl) updates.baseUrl = baseUrl;
      if (apiKey) updates.apiKey = apiKey;
      if (model) updates.model = model;

      const res = await fetch("/api/ai/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "تم الحفظ", description: "تم حفظ إعدادات مزود الذكاء الاصطناعي" });
        setApiKey("");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["ai-provider"] });
      } else {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/provider", { method: "PUT" });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message ?? (data.success ? "نجح الاتصال" : "فشل الاتصال") });
      toast({
        title: data.success ? "نجح الاتصال" : "فشل الاتصال",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "خطأ غير معروف";
      setTestResult({ success: false, message: msg });
      toast({ title: "فشل الاتصال", description: msg, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          مزود الذكاء الاصطناعي
        </CardTitle>
        <CardDescription>
          إعدادات مزود الذكاء الاصطناعي للمفكر القانوني ومحلل النصوص ومساعد المرافعة وتوليد المستندات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* حالة الاتصال */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${testResult?.success ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : testResult ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-muted/50 border-border"}`}>
          {testing ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : testResult?.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : testResult ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Wifi className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {testing ? "جارٍ اختبار الاتصال..." : testResult ? (testResult.success ? "متصل" : "غير متصل") : "لم يتم اختبار الاتصال بعد"}
            </p>
            {testResult && (
              <p className={`text-xs ${testResult.success ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                {testResult.message}
              </p>
            )}
          </div>
          {hasKey && (
            <Badge variant="outline" className="text-xs">
              مفتاح مُعد
            </Badge>
          )}
        </div>

        {/* عنوان الـ API */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            عنوان الـ API (Base URL)
          </Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.freemodel.dev/v1"
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">
            عنوان المزود المتوافق مع OpenAI API
          </p>
        </div>

        {/* مفتاح API */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            مفتاح API {hasKey && <span className="text-xs text-emerald-600">(موجود - اكتب جديداً للتغيير)</span>}
          </Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "••••••••••••••••" : "fe_oa_xxxxx..."}
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">
            المفتاح مشفر ومخزن بأمان. لن يتم عرضه مرة أخرى بعد الحفظ.
          </p>
        </div>

        {/* اسم النموذج */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            اسم النموذج (Model)
          </Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-5.5"
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">
            اسم النموذج لدى المزود
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex gap-2 pt-2">
          <Button onClick={saveSettings} className="flex-1">
            <Save className="w-4 h-4 ml-2" />
            حفظ الإعدادات
          </Button>
          <Button onClick={testConnection} variant="outline" disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جارٍ الاختبار...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 ml-2" />
                اختبار الاتصال
              </>
            )}
          </Button>
        </div>

        {/* معلومات */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
          <p className="font-medium mb-1">معلومات عن المزود:</p>
          <ul className="space-y-1 list-disc pr-4">
            <li>المزود الحالي يدعم أي API متوافق مع OpenAI</li>
            <li>يُستخدم في: المفكر القانوني، محلل النصوص، مساعد المرافعة، توليد المستندات</li>
            <li>باقي أقسام النظام تعمل محلياً 100% بدون إنترنت</li>
            <li>البيانات تُرسل فقط للمزود عند استخدام ميزات الذكاء الاصطناعي</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// بطاقة إدارة المستخدمين والصلاحيات
// ============================================================
function UsersManagementCard() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    phone: "",
    pin: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "member",
    phone: "",
    isActive: true,
    password: "",
    pin: "",
  });

  // التحقق من صلاحية الإدارة - بعد الـ hooks
  if (user?.role !== "admin") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">صلاحية مطلوبة</p>
          <p className="text-sm text-muted-foreground mt-1">
            يجب أن تكون مديراً للوصول إلى إدارة المستخدمين
          </p>
        </CardContent>
      </Card>
    );
  }

  const users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    isActive: boolean;
    lastLogin?: string | null;
    createdAt: string;
  }> = data?.users ?? [];

  async function handleCreate() {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: "املأ جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "تم إنشاء المستخدم بنجاح" });
        setShowCreate(false);
        setCreateForm({ name: "", email: "", password: "", role: "member", phone: "", pin: "" });
        refetch();
      } else {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الإنشاء", variant: "destructive" });
    }
  }

  async function handleUpdate(id: string) {
    const updates: Record<string, unknown> = {};
    if (editForm.name) updates.name = editForm.name;
    if (editForm.email) updates.email = editForm.email;
    if (editForm.role) updates.role = editForm.role;
    updates.phone = editForm.phone || null;
    updates.isActive = editForm.isActive;
    if (editForm.password) updates.password = editForm.password;
    if (editForm.pin !== undefined) updates.pin = editForm.pin || null;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "تم تحديث المستخدم" });
        setEditingUser(null);
        refetch();
        // إذا كان المستخدم المُحدّث هو المستخدم الحالي، حدّث المتجر
        if (id === user?.id) {
          updateUser({
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          });
        }
      } else {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const result = await res.json();
      if (result.success) {
        toast({
          title: !currentActive ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم",
        });
        refetch();
      }
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (id === user?.id) {
      toast({ title: "لا يمكنك حذف حسابك الحالي", variant: "destructive" });
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast({ title: "تم حذف المستخدم" });
        refetch();
      } else {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  }

  function startEdit(u: typeof users[0]) {
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone ?? "",
      isActive: u.isActive,
      password: "",
      pin: "",
    });
    setEditingUser(u.id);
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    lawyer: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    assistant: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    member: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    intern: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  };

  const ROLE_LABELS_LOCAL: Record<string, string> = {
    admin: "مدير",
    lawyer: "محامي",
    assistant: "مساعد",
    member: "عضو",
    intern: "متدرب",
  };

  return (
    <div className="space-y-4">
      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              إدارة المستخدمين والصلاحيات
            </CardTitle>
            <CardDescription>
              إضافة وتعديل المستخدمين وتحديد أدوارهم وصلاحياتهم
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPermissions(!showPermissions)}>
              <Eye className="w-4 h-4 ml-2" />
              {showPermissions ? "إخفاء" : "عرض"} الصلاحيات
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 ml-2" />
              مستخدم جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">لا يوجد مستخدمون</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="group flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/30"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{u.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? ""}`}>
                        {ROLE_LABELS_LOCAL[u.role] ?? u.role}
                      </span>
                      {u.id === user?.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          أنت
                        </span>
                      )}
                      {!u.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          معطّل
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.lastLogin && (
                      <p className="text-[10px] text-muted-foreground">
                        آخر دخول: {new Date(u.lastLogin).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      title={u.isActive ? "تعطيل" : "تفعيل"}
                    >
                      <Power className={`w-4 h-4 ${u.isActive ? "text-emerald-600" : "text-red-600"}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => startEdit(u)}
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {u.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDelete(u.id, u.name)}
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* جدول الصلاحيات حسب الدور */}
      {showPermissions && <PermissionsMatrix />}

      {/* نافذة إنشاء مستخدم جديد */}
      {showCreate && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>أنشئ حساباً جديداً وحدد دوره وصلاحياته</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم *</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني *</Label>
                  <Input type="email" dir="ltr" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>كلمة المرور *</Label>
                  <Input type="password" dir="ltr" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>رمز PIN (اختياري)</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} dir="ltr" value={createForm.pin} onChange={(e) => setCreateForm({ ...createForm, pin: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الهاتف</Label>
                  <Input dir="ltr" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الدور</Label>
                  <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير (صلاحيات كاملة)</SelectItem>
                      <SelectItem value="lawyer">محامي</SelectItem>
                      <SelectItem value="assistant">مساعد قانوني</SelectItem>
                      <SelectItem value="member">عضو</SelectItem>
                      <SelectItem value="intern">متدرب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-xs">
                <p className="font-medium mb-1">صلاحيات الدور المختار:</p>
                <RolePermissionsSummary role={createForm.role} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء المستخدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* نافذة تعديل مستخدم */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
              <DialogDescription>عدّل بيانات المستخدم وصلاحياته</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" dir="ltr" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>كلمة مرور جديدة (اتركها فارغة للإبقاء)</Label>
                  <Input type="password" dir="ltr" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>رمز PIN (اتركه فارغاً للإزالة)</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} dir="ltr" value={editForm.pin} onChange={(e) => setEditForm({ ...editForm, pin: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الهاتف</Label>
                  <Input dir="ltr" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الدور</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير (صلاحيات كاملة)</SelectItem>
                      <SelectItem value="lawyer">محامي</SelectItem>
                      <SelectItem value="assistant">مساعد قانوني</SelectItem>
                      <SelectItem value="member">عضو</SelectItem>
                      <SelectItem value="intern">متدرب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <Label>الحساب نشط</Label>
                <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>إلغاء</Button>
              <Button onClick={() => handleUpdate(editingUser)}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================================
// ملخص صلاحيات الدور
// ============================================================
function RolePermissionsSummary({ role }: { role: string }) {
  const permissions = DEFAULT_PERMISSIONS[role as UserRole];
  if (!permissions) return null;

  const sections = [
    { id: "dashboard", label: "الرئيسية" },
    { id: "cases", label: "القضايا" },
    { id: "clients", label: "الموكلين" },
    { id: "documents", label: "المستندات" },
    { id: "tasks", label: "المهام" },
    { id: "appointments", label: "المواعيد" },
    { id: "finance", label: "المالية" },
    { id: "reports", label: "التقارير" },
    { id: "ai-thinker", label: "المفكر القانوني" },
    { id: "settings", label: "الإعدادات" },
    { id: "team", label: "المستخدمون" },
    { id: "security", label: "الأمان" },
  ];

  const allowed = sections.filter((s) => permissions[s.id as keyof typeof permissions] !== "none");

  return (
    <div className="flex flex-wrap gap-1">
      {allowed.map((s) => (
        <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
          {s.label}
        </span>
      ))}
      {allowed.length === 0 && <span className="text-red-600">لا صلاحيات</span>}
    </div>
  );
}

// ============================================================
// جدول الصلاحيات الكامل
// ============================================================
function PermissionsMatrix() {
  const roles: UserRole[] = ["admin", "lawyer", "assistant", "member", "intern"];
  const sections = [
    { id: "dashboard", label: "الرئيسية" },
    { id: "cases", label: "القضايا" },
    { id: "clients", label: "الموكلين" },
    { id: "documents", label: "المستندات" },
    { id: "tasks", label: "المهام" },
    { id: "appointments", label: "المواعيد" },
    { id: "finance", label: "المالية" },
    { id: "reports", label: "التقارير" },
    { id: "memo-editor", label: "محرر المذكرات" },
    { id: "calculators", label: "الحاسبات" },
    { id: "pleading", label: "مساعد المرافعة" },
    { id: "maps", label: "الخرائط" },
    { id: "ai-thinker", label: "المفكر القانوني" },
    { id: "text-analyzer", label: "محلل النصوص" },
    { id: "performance", label: "تحليل الأداء" },
    { id: "development", label: "التطوير المهني" },
    { id: "settings", label: "الإعدادات" },
    { id: "team", label: "المستخدمون" },
    { id: "backup", label: "النسخ الاحتياطي" },
    { id: "security", label: "الأمان" },
    { id: "updates", label: "التحديثات" },
    { id: "research", label: "البحث العلمي" },
  ] as const;

  const levelColors: Record<string, string> = {
    full: "bg-emerald-500",
    view: "bg-amber-400",
    none: "bg-red-400",
  };

  const levelLabels: Record<string, string> = {
    full: "كامل",
    view: "عرض",
    none: "ممنوع",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">مصفوفة الصلاحيات حسب الدور</CardTitle>
        <CardDescription>عرض الصلاحيات الافتراضية لكل دور</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-right p-2 font-medium">القسم</th>
              {roles.map((r) => (
                <th key={r} className="text-center p-2 font-medium">{ROLE_LABELS[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id} className="border-b hover:bg-accent/30">
                <td className="p-2 font-medium">{s.label}</td>
                {roles.map((r) => {
                  const level = DEFAULT_PERMISSIONS[r][s.id as SectionId] ?? "none";
                  return (
                    <td key={r} className="text-center p-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-white text-[10px] ${levelColors[level]}`}
                      >
                        {levelLabels[level]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// بطاقة إعدادات تليجرام
// ============================================================
function TelegramSettingsCard() {
  const { toast } = useToast();
  const [botToken, setBotToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [authorizedIds, setAuthorizedIds] = useState<string[]>([]);
  const [newChatId, setNewChatId] = useState("");
  const [botStatus, setBotStatus] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const [loaded, setLoaded] = useState(false);

  // جلب الإعدادات الحالية
  useQuery({
    queryKey: ["telegram-settings"],
    queryFn: async () => {
      const res = await fetch("/api/telegram");
      const data = await res.json();
      if (data.success) {
        setHasToken(data.config.hasToken);
        setAuthorizedIds(data.config.authorizedChatIds ?? []);
      }
      setLoaded(true);
      return data;
    },
    enabled: !loaded,
  });

  async function saveToken() {
    if (!botToken.trim()) {
      toast({ title: "أدخل رمز البوت", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "تم الحفظ", description: "تم حفظ رمز البوت" });
        setBotToken("");
        setHasToken(true);
      } else {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    }
  }

  async function checkBotStatus() {
    setBotStatus("checking");
    try {
      const res = await fetch("/api/telegram/health");
      const data = await res.json();
      const isOnline = data.bot === "configured" && data.telegramConnected;
      setBotStatus(isOnline ? "online" : data.bot === "configured" ? "offline" : "offline");
      toast({
        title: isOnline ? "البوت يعمل ✅" : "البوت غير متصل ❌",
        description: isOnline
          ? `متصل بـ @${data.botUsername}`
          : data.bot === "configured"
          ? "التوكن محفوظ لكن تعذر الاتصال بـ Telegram"
          : "لم يتم حفظ رمز البوت",
        variant: isOnline ? "default" : "destructive",
      });
    } catch {
      setBotStatus("offline");
      toast({ title: "تعذر فحص البوت", description: "تأكد من تشغيل الخادم", variant: "destructive" });
    }
  }

  async function addChatId() {
    if (!newChatId.trim()) return;
    const updated = [...authorizedIds, newChatId.trim()];
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatIds: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthorizedIds(updated);
        setNewChatId("");
        toast({ title: "تمت الإضافة", description: "تم تفويض معرف تليجرام" });
      }
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function removeChatId(id: string) {
    const updated = authorizedIds.filter((x) => x !== id);
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatIds: updated }),
      });
      setAuthorizedIds(updated);
      toast({ title: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function sendTestMessage() {
    if (authorizedIds.length === 0) {
      toast({ title: "أضف معرف تليجرام أولاً", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/telegram/send-test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "تم إرسال رسالة تجريبية ✅", description: data.message });
      } else {
        toast({ title: "فشل الإرسال", description: data.error ?? data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تأكد من تشغيل الخادم", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            مساعد تليجرام
          </CardTitle>
          <CardDescription>
            ربط النظام مع بوت تليجرام للاستعلام عن القضايا والمواعيد والمستحقات من أي مكان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* حالة البوت */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            botStatus === "online" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" :
            botStatus === "offline" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
            "bg-muted/50 border-border"
          }`}>
            <div className={`p-2 rounded-full ${
              botStatus === "online" ? "bg-emerald-100 text-emerald-600" :
              botStatus === "offline" ? "bg-red-100 text-red-600" :
              "bg-muted text-muted-foreground"
            }`}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {botStatus === "checking" ? "جارٍ الفحص..." :
                 botStatus === "online" ? "البوت يعمل" :
                 botStatus === "offline" ? "البوت متوقف" :
                 hasToken ? "البوت مُعد - اضغط فحص للتأكد" : "البوت غير مُعد"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasToken ? "رمز البوت محفوظ" : "لم يتم إدخال رمز البوت"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={checkBotStatus} disabled={botStatus === "checking"}>
              {botStatus === "checking" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Wifi className="w-4 h-4 ml-2" />}
              فحص
            </Button>
          </div>

          {/* رمز البوت */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              رمز البوت (Bot Token) {hasToken && <span className="text-xs text-emerald-600">(موجود)</span>}
            </Label>
            <Input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={hasToken ? "••••••••••••••••" : "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"}
              dir="ltr"
              className="text-left"
            />
            <p className="text-xs text-muted-foreground">
              احصل على الرمز من BotFather على تليجرام. اكتب <code dir="ltr">@BotFather</code> ثم <code dir="ltr">/newbot</code>
            </p>
          </div>

          <Button onClick={saveToken} disabled={!botToken.trim()}>
            <Save className="w-4 h-4 ml-2" />
            حفظ الرمز
          </Button>
        </CardContent>
      </Card>

      {/* المعرفات المصرح لها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            معرفات تليجرام المصرح لها
          </CardTitle>
          <CardDescription>
            قائمة معرفات الشات المسموح لها باستخدام البوت
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="معرف تليجرام (مثل: 123456789)"
              dir="ltr"
              className="text-left"
            />
            <Button onClick={addChatId} disabled={!newChatId.trim()}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>

          {authorizedIds.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              لا توجد معرفات مصرح لها بعد
            </p>
          ) : (
            <div className="space-y-2">
              {authorizedIds.map((id) => (
                <div key={id} className="group flex items-center gap-3 p-2 rounded-md border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-mono text-sm flex-1" dir="ltr">{id}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100"
                    onClick={() => removeChatId(id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t">
            <Button onClick={sendTestMessage} variant="outline" className="w-full" disabled={authorizedIds.length === 0}>
              <Send className="w-4 h-4 ml-2" />
              إرسال رسالة تجريبية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* دليل الاستخدام */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            دليل الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1"> setup البوت:</p>
            <ol className="list-decimal pr-5 space-y-1 text-xs text-muted-foreground">
              <li>افتح تليجرام وابحث عن <code dir="ltr">@BotFather</code></li>
              <li>أرسل <code dir="ltr">/newbot</code> وأنشئ بوتاً جديداً</li>
              <li>انسخ الرمز (Bot Token) والصقه أعلاه</li>
              <li>اضغط "حفظ الرمز"</li>
              <li>افتح البوت الذي أنشأته وأرسل <code dir="ltr">/start</code></li>
              <li>انسخ معرف الشات الذي يظهر لك وأضفه في القائمة أعلاه</li>
              <li>اضغط "فحص" للتأكد من عمل البوت</li>
            </ol>
          </div>

          <div>
            <p className="font-medium mb-1">الأوامر المتاحة في تليجرام:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-card border border-border">
                <code dir="ltr">/start</code> - بدء الاستخدام
              </div>
              <div className="p-2 rounded bg-card border border-border">
                <code dir="ltr">/help</code> - المساعدة
              </div>
              <div className="p-2 rounded bg-card border border-border">
                <code dir="ltr">/stats</code> - إحصائيات سريعة
              </div>
              <div className="p-2 rounded bg-card border border-border">
                <code dir="ltr">/appointments</code> - مواعيد اليوم
              </div>
              <div className="p-2 rounded bg-card border border-border">
                <code dir="ltr">/tasks</code> - مهام معلقة
              </div>
              <div className="p-2 rounded bg-card border border-border">
                أو اكتب سؤالك بالعربية
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">💡 أمثلة للاستخدام:</p>
            <ul className="space-y-1 list-disc pr-4">
              <li>"اعرض قضاياي النشطة"</li>
              <li>"ما جلسات الغد؟"</li>
              <li>"لخص قضية رقم 2024/123"</li>
              <li>"فيه مستحقات متأخرة؟"</li>
              <li>"أضف مهمة: متابعة مذكرة الدفاع"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
