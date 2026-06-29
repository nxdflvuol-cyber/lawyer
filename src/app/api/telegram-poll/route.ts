import { NextResponse } from "next/server";
import { startTelegramPolling } from "@/lib/telegram-bot-integrated";

// بدء الـ polling عند أول طلب للنظام
let started = false;

export async function GET() {
  if (!started) {
    started = true;
    startTelegramPolling();
  }

  return NextResponse.json({
    success: true,
    message: "Telegram polling is running inside Next.js server",
    note: "البوت يعمل ضمن خادم Next.js - لن يتوقف طالما الخادم يعمل",
  });
}

export async function POST() {
  if (!started) {
    started = true;
    startTelegramPolling();
  }

  return NextResponse.json({
    success: true,
    message: "Telegram polling started",
  });
}
