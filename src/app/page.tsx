"use client";

import { useAuthStore } from "@/lib/stores";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";
import { IdleWatcher } from "@/components/idle-watcher";

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <IdleWatcher />
      <AppShell />
    </>
  );
}
