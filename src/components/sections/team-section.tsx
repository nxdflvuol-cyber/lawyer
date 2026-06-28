"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserCog,
  Plus,
  Trash2,
  Edit,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/constants";

export function TeamSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    role: "member",
    salary: 0,
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "تم الحفظ بنجاح" });
      setOpen(false);
      setForm({ name: "", position: "", email: "", phone: "", role: "member", salary: 0, notes: "" });
    },
  });

  const members = data?.members ?? [];

  function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "أدخل الاسم", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  }

  const roleLabels: Record<string, string> = {
    admin: "مدير",
    lawyer: "محامي",
    assistant: "مساعد",
    member: "عضو",
    intern: "متدرب",
  };

  const stats = {
    total: members.length,
    active: members.filter((m: { isActive: boolean }) => m.isActive).length,
    lawyers: members.filter((m: { role: string }) => m.role === "lawyer").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            أعضاء المكتب والإداريين
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة فريق المحاماة والموظفين والصلاحيات
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عضو جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>المنصب</Label>
                  <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الهاتف</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الدور</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="lawyer">محامي</SelectItem>
                      <SelectItem value="assistant">مساعد</SelectItem>
                      <SelectItem value="member">عضو</SelectItem>
                      <SelectItem value="intern">متدرب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>الراتب</Label>
                  <Input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الأعضاء</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">أعضاء نشطون</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lawyers}</p>
                <p className="text-xs text-muted-foreground">محامون</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الأعضاء */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أعضاء الفريق</CardTitle>
          <CardDescription>إدارة بيانات موظفي المكتب وأدوارهم</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد أعضاء بعد</p>
              <p className="text-xs text-muted-foreground mt-1">أضف أعضاء فريقك للبدء</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member: {
                id: string;
                name: string;
                position?: string;
                email?: string;
                phone?: string;
                role: string;
                salary?: number;
                hireDate?: string;
                notes?: string;
                isActive: boolean;
              }) => (
                <div
                  key={member.id}
                  className="group flex items-center gap-4 p-3 rounded-md border border-border hover:bg-accent/30"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.name}</p>
                      <Badge variant="outline" className="text-xs">{roleLabels[member.role] ?? member.role}</Badge>
                      {!member.isActive && <Badge variant="secondary" className="text-xs">غير نشط</Badge>}
                    </div>
                    {member.position && (
                      <p className="text-xs text-muted-foreground mt-0.5">{member.position}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {member.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </span>
                      )}
                      {member.salary ? (
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {formatCurrency(member.salary)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ميزات التعاون */}
      <Card className="bg-gradient-to-l from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">ميزات التعاون</CardTitle>
          <CardDescription>أدوات العمل الجماعي عبر الشبكة المحلية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "مشاركة القضايا", icon: Briefcase },
              { label: "نظام تراسل محلي", icon: Mail },
              { label: "تحرير تعاوني", icon: Edit },
              { label: "خريطة مهام الفريق", icon: Calendar },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border text-center">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs">{feat.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
