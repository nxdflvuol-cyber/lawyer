"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Lock, User, Eye, EyeOff, ShieldCheck, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const { toast } = useToast();
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body =
        mode === "pin"
          ? { pin }
          : { email, password };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        toast({
          title: "فشل تسجيل الدخول",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      login(data.user);
      toast({
        title: "مرحباً بك",
        description: `تم تسجيل الدخول بنجاح، ${data.user.name}`,
      });
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center legal-pattern p-4 bg-background">
      <div className="w-full max-w-md">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mb-4 shadow-lg">
            <Scale className="w-11 h-11 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">المحامي الشامل</h1>
          <p className="text-muted-foreground mt-2">
            نظام إدارة المكاتب القانونية المتكامل
          </p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription>
              أدخل بياناتك للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* التبديل بين PIN وكلمة المرور */}
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setMode("pin")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                  mode === "pin"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Fingerprint className="w-4 h-4" />
                رمز PIN
              </button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                  mode === "password"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock className="w-4 h-4" />
                كلمة المرور
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "pin" ? (
                <div className="space-y-2">
                  <Label htmlFor="pin">رمز PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="text-center text-2xl tracking-widest"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    الرمز الافتراضي: 1234
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@lawyer.local"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••"
                        className="pr-10 pl-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      كلمة المرور الافتراضية: 1234
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "جارٍ التحقق..." : "دخول النظام"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>محـمي بتشفير AES-256 - يعمل محلياً بالكامل</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} المحامي الشامل - جميع البيانات مخزنة محلياً
        </p>
      </div>
    </div>
  );
}
