"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  FileLock,
  Database,
  Fingerprint,
  Bell,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

export function SecuritySection() {
  const { data, isLoading } = useQuery({
    queryKey: ["security"],
    queryFn: async () => {
      const res = await fetch("/api/security");
      return res.json();
    },
  });

  const auditLogs = data?.auditLogs ?? [];
  const stats = data?.stats ?? { failedAttempts: 0, sensitiveAccess: 0, suspiciousActivities: 0, totalToday: 0 };

  const securityFeatures = [
    { title: "تشفير AES-256", icon: FileLock, enabled: true, desc: "تشفير عسكري المستوى للبيانات الحساسة" },
    { title: "قفل تلقائي", icon: Lock, enabled: true, desc: "تسجيل خروج بعد فترة خمول" },
    { title: "مصادقة PIN", icon: Key, enabled: true, desc: "حماية الوصول برمز سري" },
    { title: "بصمة الجلسة", icon: Fingerprint, enabled: true, desc: "تتبع جلسات المستخدم" },
    { title: "سجل التدقيق", icon: Activity, enabled: true, desc: "توثيق كل العمليات الحساسة" },
    { title: "كشف النشاط المريب", icon: Eye, enabled: true, desc: "مراقبة الأنماط غير المعتادة" },
    { title: "تنبيهات الأمان", icon: Bell, enabled: true, desc: "إشعارات فورية للمخاطر" },
    { title: "نسخ احتياطي مشفر", icon: Database, enabled: true, desc: "حماية البيانات الاحتياطية" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          الأمان والخصوصية
        </h1>
        <p className="text-muted-foreground mt-2">
          منظومة أمن متعددة الطبقات وسجل التدقيق الشامل
        </p>
      </div>

      {/* بطاقات حالة الأمان */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <Badge variant="default" className="bg-emerald-600">آمن</Badge>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">ممتاز</p>
            <p className="text-xs text-muted-foreground mt-1">حالة الأمان العامة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{stats.totalToday}</p>
            <p className="text-xs text-muted-foreground mt-1">عمليات اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{stats.sensitiveAccess}</p>
            <p className="text-xs text-muted-foreground mt-1">وصول للبيانات الحساسة</p>
          </CardContent>
        </Card>

        <Card className={stats.suspiciousActivities > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`w-6 h-6 ${stats.suspiciousActivities > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
            </div>
            <p className="text-2xl font-bold">{stats.suspiciousActivities}</p>
            <p className="text-xs text-muted-foreground mt-1">أنشطة مريبة</p>
          </CardContent>
        </Card>
      </div>

      {/* ميزات الأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ميزات الأمان المفعّلة</CardTitle>
          <CardDescription>منظومة الحماية متعددة الطبقات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {securityFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  {feature.enabled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* سجل التدقيق */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            سجل التدقيق الأمني
          </CardTitle>
          <CardDescription>توثيق كل عمليات الوصول للبيانات الحساسة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              لا توجد سجلات بعد
            </p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {auditLogs.map((log: {
                  id: string;
                  action: string;
                  entity: string;
                  details?: string;
                  createdAt: string;
                  user?: { name?: string };
                }) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-accent/30"
                  >
                    <div className={`p-1.5 rounded ${
                      log.action === "login" ? "bg-emerald-50 text-emerald-600" :
                      log.action === "login_failed" ? "bg-red-50 text-red-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {log.action === "login" ? <CheckCircle className="w-3.5 h-3.5" /> :
                       log.action === "login_failed" ? <XCircle className="w-3.5 h-3.5" /> :
                       <Activity className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {log.action === "login" ? "تسجيل دخول" :
                         log.action === "login_failed" ? "محاولة دخول فاشلة" :
                         log.action}
                        {log.user?.name && ` - ${log.user.name}`}
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.createdAt, true)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{log.entity}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* إجراءات أمنية */}
      <Card className="bg-gradient-to-l from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            إجراءات الطوارئ
          </CardTitle>
          <CardDescription>إجراءات أمنية متقدمة للحالات الحرجة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
            <div>
              <p className="text-sm font-medium">تدمير آمن للبيانات</p>
              <p className="text-xs text-muted-foreground">حذف دائم وغير قابل للاستعادة</p>
            </div>
            <Button variant="destructive" size="sm">
              تفعيل
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
            <div>
              <p className="text-sm font-medium">وضع الطوارئ</p>
              <p className="text-xs text-muted-foreground">تسجيل خروج فوري وتأمين الجلسة</p>
            </div>
            <Button variant="outline" size="sm">
              تفعيل
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
            <div>
              <p className="text-sm font-medium">تغيير رمز PIN</p>
              <p className="text-xs text-muted-foreground">تحديث رمز الدخول</p>
            </div>
            <Button variant="outline" size="sm">
              تغيير
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
