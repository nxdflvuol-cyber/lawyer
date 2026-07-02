import { NextResponse } from "next/server";
import { startTelegramPolling } from "@/lib/telegram-bot-integrated";

// استخدام globalThis لمنع تكرار بدء pollers
const globalAny = globalThis as unknown as {
  __tgPollStarted?: boolean;
  __tgPollerStartedAt?: number;
};

function maybeStartPolling() {
  // ابدأ poller واحدة فقط - الـ generation في telegram-bot-integrated
  // يضمن أن الـ poller الأحدث هي النشطة
  const lastStarted = globalAny.__tgPollerStartedAt ?? 0;
  const now = Date.now();
  // أعد البدء فقط إذا لم تبدأ منذ 30 ثانية (تفادي الاستدعاءات المتكررة السريعة)
  if (!globalAny.__tgPollStarted || (now - lastStarted > 30000)) {
    globalAny.__tgPollStarted = true;
    globalAny.__tgPollerStartedAt = now;
    startTelegramPolling();
  }
}

export async function GET() {
  maybeStartPolling();
  return NextResponse.json({
    success: true,
    message: "Telegram polling is running inside Next.js server",
    note: "البوت يعمل ضمن خادم Next.js - لن يتوقف طالما الخادم يعمل",
  });
}

export async function POST() {
  maybeStartPolling();
  return NextResponse.json({
    success: true,
    message: "Telegram polling started",
  });
}
