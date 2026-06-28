"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Brain,
  BookOpen,
  Shield,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/constants";

export function UpdatesSection() {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const updates = [
    {
      id: "legal-db",
      title: "قاعدة البيانات التشريعية",
      currentVersion: "2024.10",
      newVersion: "2024.12",
      type: "legal",
      icon: BookOpen,
      description: "تحديث نصوص القوانين والقرارات الوزارية الجديدة",
      size: "12.4 MB",
      available: true,
    },
    {
      id: "ai-model",
      title: "نموذج الذكاء الاصطناعي",
      currentVersion: "v2.1",
      newVersion: "v2.3",
      type: "ai",
      icon: Brain,
      description: "تحسين دقة الصياغة القانونية والتحليلات",
      size: "48.7 MB",
      available: true,
    },
    {
      id: "security",
      title: "تحديثات أمنية",
      currentVersion: "1.0.5",
      newVersion: "1.0.7",
      type: "security",
      icon: Shield,
      description: "إصلاحات أمنية وتحسينات الحماية",
      size: "3.2 MB",
      available: true,
    },
    {
      id: "templates",
      title: "قوالب المستندات",
      currentVersion: "2024.1",
      newVersion: "2024.2",
      type: "templates",
      icon: Package,
      description: "قوالب جديدة للعقود والمذكرات",
      size: "5.8 MB",
      available: false,
    },
  ];

  async function checkUpdates() {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 1500));
    setChecking(false);
    toast({
      title: "تم فحص التحديثات",
      description: `${updates.filter((u) => u.available).length} تحديثات متاحة`,
    });
  }

  async function installUpdate(id: string) {
    setUpdating(id);
    await new Promise((r) => setTimeout(r, 2000));
    setUpdating(null);
    toast({
      title: "تم التثبيت",
      description: "تم تحديث العنصر بنجاح",
    });
  }

  function installAll() {
    toast({
      title: "جارٍ تثبيت جميع التحديثات",
      description: "سيتم تثبيت التحديثات بالترتيب",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary" />
            التحديثات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة تحديثات النظام والمحتوى القانوني ونماذج الذكاء الاصطناعي
          </p>
        </div>
        <Button onClick={checkUpdates} disabled={checking} variant="outline">
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جارٍ الفحص...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 ml-2" />
              فحص التحديثات
            </>
          )}
        </Button>
      </div>

      {/* بطاقة الحالة */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">الإصدار الحالي: 1.0.0</p>
                <p className="text-sm text-muted-foreground">
                  آخر فحص: {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-primary">
                {updates.filter((u) => u.available).length}
              </p>
              <p className="text-xs text-muted-foreground">تحديثات متاحة</p>
            </div>
          </div>
          <Progress value={75} className="mt-4 h-1.5" />
          <p className="text-xs text-muted-foreground mt-2">
            النظام محدّث بنسبة 75% - يُنصح بتثبيت التحديثات المتاحة
          </p>
        </CardContent>
      </Card>

      {/* قائمة التحديثات */}
      <div className="space-y-3">
        {updates.map((update) => {
          const Icon = update.icon;
          return (
            <Card key={update.id} className={!update.available ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    update.type === "ai" ? "bg-purple-50 text-purple-600" :
                    update.type === "security" ? "bg-red-50 text-red-600" :
                    update.type === "legal" ? "bg-emerald-50 text-emerald-600" :
                    "bg-amber-50 text-amber-600"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{update.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{update.description}</p>
                      </div>
                      {update.available && (
                        <Badge variant="default" className="flex-shrink-0">
                          متاح
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        الحالي: {update.currentVersion}
                      </span>
                      {update.available && (
                        <>
                          <ChevronLeft className="w-3 h-3" />
                          <span className="font-medium text-primary">
                            الجديد: {update.newVersion}
                          </span>
                          <span>•</span>
                          <span>{update.size}</span>
                        </>
                      )}
                    </div>
                    {update.available && (
                      <Button
                        onClick={() => installUpdate(update.id)}
                        disabled={updating === update.id}
                        size="sm"
                        className="mt-3"
                      >
                        {updating === update.id ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جارٍ التثبيت...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 ml-2" />
                            تثبيت التحديث
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* زر تثبيت الكل */}
      <div className="flex justify-end">
        <Button onClick={installAll} size="lg">
          <Download className="w-4 h-4 ml-2" />
          تثبيت جميع التحديثات
        </Button>
      </div>

      {/* معلومات */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-400">معلومات عن التحديثات</p>
              <p className="text-blue-600 dark:text-blue-500 text-xs mt-1">
                يتطلب تثبيت بعض التحديثات اتصالاً محدوداً بالإنترنت. جميع التحديثات تُختبَر محلياً
                قبل التثبيت لضمان عدم تأثيرها على بياناتك. لا يتم رفع أي بيانات شخصية للخادم.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
