"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, useNavStore, useNotificationStore } from "@/lib/stores";

export function IdleWatcher() {
  const resetIdle = useAuthStore((s) => s.resetIdle);
  const loginAt = useAuthStore((s) => s.loginAt);
  const idleTimeout = useAuthStore((s) => s.idleTimeout);
  const logout = useAuthStore((s) => s.logout);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const lastReset = useRef(loginAt);

  useEffect(() => {
    if (!loginAt) return;

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const onActivity = () => {
      const now = Date.now();
      // throttle: لا نعيد التعيين أكثر من مرة كل 30 ثانية
      if (!lastReset.current || now - lastReset.current > 30 * 1000) {
        lastReset.current = now;
        resetIdle();
      }
    };

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Date.now() - (loginAt ?? Date.now());
      const limit = idleTimeout * 60 * 1000;
      if (elapsed > limit) {
        addNotification({
          title: "تسجيل خروج تلقائي",
          message: "تم تسجيل الخروج بسبب فترة الخمول",
          type: "warning",
        });
        logout();
      }
    }, 60 * 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
     
  }, [loginAt, idleTimeout]);

  return null;
}
