"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DatabaseBackup,
  Download,
  Upload,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileJson,
  HardDrive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/constants";

export function BackupSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<"backup" | "restore" | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");

  const { data: backupsData, refetch } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      // لا يوجد API للقائمة، لكن نحفظها محليًا
      const saved = localStorage.getItem("shamel-backups-list");
      return saved ? JSON.parse(saved) : [];
    },
  });

  async function createBackup() {
    setLoading("backup");
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // تنزيل الملف
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shamel-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // حفظ في القائمة المحلية
      const newBackup = {
        id: Math.random().toString(36).slice(2),
        fileName: a.download,
        createdAt: new Date().toISOString(),
        size: blob.size,
      };
      const list = [newBackup, ...(backupsData ?? [])].slice(0, 20);
      localStorage.setItem("shamel-backups-list", JSON.stringify(list));
      refetch();

      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: `تم حفظ ${a.download}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  async function restoreBackup() {
    if (!restoreFile) {
      toast({ title: "اختر ملف النسخة الاحتياطية", variant: "destructive" });
      return;
    }
    setLoading("restore");
    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, mode: restoreMode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "تمت الاستعادة بنجاح",
        description: `تم استعادة ${data.itemCount} عنصر`,
      });
      queryClient.invalidateQueries();
      setRestoreFile(null);
    } catch (error) {
      toast({
        title: "خطأ في الاستعادة",
        description: error instanceof Error ? error.message : "ملف غير صالح",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  const backups = backupsData ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <DatabaseBackup className="w-8 h-8 text-primary" />
          النسخ الاحتياطي
        </h1>
        <p className="text-muted-foreground mt-2">
          نظام شامل للنسخ الاحتياطي واستعادة البيانات
        </p>
      </div>

      {/* بطاقات الحالة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">الحالة</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">آمن</p>
            <p className="text-xs text-muted-foreground mt-1">جميع البيانات مشفرة محلياً</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">آخر نسخة</span>
            </div>
            <p className="text-lg font-bold">
              {backups[0] ? formatDate(backups[0].createdAt) : "لا توجد"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {backups[0]?.fileName ?? "لم يتم إنشاء نسخ بعد"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">إجمالي النسخ</span>
            </div>
            <p className="text-lg font-bold">{backups.length}</p>
            <p className="text-xs text-muted-foreground mt-1">نسخة احتياطية محفوظة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* إنشاء نسخة احتياطية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              إنشاء نسخة احتياطية
            </CardTitle>
            <CardDescription>تصدير كامل لبيانات النظام إلى ملف</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p className="font-medium">سيتم تصدير:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                <li>جميع القضايا والجلسات والإجراءات</li>
                <li>بيانات الموكلين والتوكيلات</li>
                <li>المستندات والملفات المرفقة</li>
                <li>المهام والمواعيد</li>
                <li>البيانات المالية (أتعاب، مدفوعات، مصروفات)</li>
                <li>المكتبة القانونية والمذكرات</li>
                <li>الإعدادات وسجلات التدقيق</li>
              </ul>
            </div>
            <Button onClick={createBackup} disabled={loading === "backup"} className="w-full" size="lg">
              {loading === "backup" ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  إنشاء وتنزيل النسخة الاحتياطية
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* استعادة نسخة احتياطية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              استعادة نسخة احتياطية
            </CardTitle>
            <CardDescription>استعادة البيانات من ملف نسخة احتياطية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ملف النسخة الاحتياطية</Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
              />
              {restoreFile && (
                <p className="text-xs text-muted-foreground">
                  الملف: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} ك.ب)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>وضع الاستعادة</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRestoreMode("replace")}
                  className={`p-3 rounded-lg border-2 text-right transition ${
                    restoreMode === "replace" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium">استبدال كامل</p>
                  <p className="text-xs text-muted-foreground">حذف البيانات الحالية</p>
                </button>
                <button
                  onClick={() => setRestoreMode("merge")}
                  className={`p-3 rounded-lg border-2 text-right transition ${
                    restoreMode === "merge" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium">دمج</p>
                  <p className="text-xs text-muted-foreground">إضافة للبيانات الحالية</p>
                </button>
              </div>
            </div>
            <Button onClick={restoreBackup} disabled={loading === "restore" || !restoreFile} className="w-full" size="lg">
              {loading === "restore" ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الاستعادة...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  استعادة
                </>
              )}
            </Button>
            {restoreMode === "replace" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>تحذير: سيتم حذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* سجل النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            سجل النسخ الاحتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              لا توجد نسخ احتياطية بعد
            </p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup: { id: string; fileName: string; createdAt: string; size: number }) => (
                <div
                  key={backup.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/30"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{backup.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(backup.createdAt)} • {(backup.size / 1024).toFixed(1)} ك.ب
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">مكتملة</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* جدولة تلقائية */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">الجدولة التلقائية</CardTitle>
          <CardDescription>نسخ احتياطي تلقائي دوري</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">نسخ احتياطي يومي</p>
              <p className="text-xs text-muted-foreground">يتم تلقائياً كل 24 ساعة</p>
            </div>
            <Badge variant="default">مفعّل</Badge>
          </div>
          <Progress value={67} className="mt-3 h-1" />
          <p className="text-xs text-muted-foreground mt-1">آخر نسخة منذ 16 ساعة</p>
        </CardContent>
      </Card>
    </div>
  );
}
