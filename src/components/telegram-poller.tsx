"use client";

import { useEffect, useRef } from "react";

/**
 * مكوّن خفي يبدأ بوت تليجرام عند تحميل الصفحة
 * يعمل في الخلفية بدون أي واجهة مرئية
 * نبدأه مرة واحدة فقط - الخادم يحافظ على الـ polling
 */
export function TelegramPoller() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // بدء الـ polling مرة واحدة عند تحميل الصفحة
    // الخادم يستخدم globalThis flag لمنع تكرار pollers
    fetch("/api/telegram-poll", { method: "POST" })
      .then(() => {
        console.log("✅ Telegram polling started");
      })
      .catch((error) => {
        console.error("Failed to start Telegram polling:", error);
      });

    // لا حاجة لإعادة المحاولة - الـ polling مستمر في الخادم
    // طالما الخادم يعمل، البوت يعمل
  }, []);

  // مكوّن خفي - لا يعرض شيئاً
  return null;
}
