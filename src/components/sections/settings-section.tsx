"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="notifications">التنبيهات</TabsTrigger>
          <TabsTrigger value="modes">أوضاع العمل</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
