"use client";

import { useEffect, useRef } from "react";

/**
 * مكوّن خفي يبدأ بوت تليجرام عند تحميل الصفحة
 * يعمل في الخلفية بدون أي واجهة مرئية
 */
export function TelegramPoller() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // بدء الـ polling عند تحميل الصفحة
    fetch("/api/telegram-poll", { method: "POST" })
      .then(() => {
        console.log("✅ Telegram polling started");
      })
      .catch((error) => {
        console.error("Failed to start Telegram polling:", error);
      });

    // إعادة المحاولة كل 5 دقائق للتأكد من استمرار العمل
    const interval = setInterval(() => {
      fetch("/api/telegram-poll", { method: "POST" }).catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // مكوّن خفي - لا يعرض شيئاً
  return null;
}
