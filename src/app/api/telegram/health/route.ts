import { NextResponse } from "next/server";
import { getBotToken, getAuthorizedChatIds } from "@/lib/telegram-bot-integrated";

// فحص حالة البوت - يعمل داخل Next.js مباشرة
export async function GET() {
  try {
    const token = await getBotToken();
    const chatIds = await getAuthorizedChatIds();

    // محاولة الاتصال بـ Telegram API للتحقق من صحة التوكن
    let botInfo: { username?: string; first_name?: string } | null = null;
    let telegramOk = false;

    if (token) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (data.ok) {
          telegramOk = true;
          botInfo = data.result;
        }
      } catch {
        // تجاهل - البوت قد لا يكون متصلاً بالإنترنت
      }
    }

    return NextResponse.json({
      success: true,
      bot: token ? "configured" : "not configured",
      botTokenPreview: token ? token.slice(0, 10) + "..." : "",
      telegramConnected: telegramOk,
      botUsername: botInfo?.username ?? null,
      botName: botInfo?.first_name ?? null,
      authorizedChatIds: chatIds,
      message: telegramOk
        ? `البوت يعمل ✅ (${botInfo?.username ?? ""})`
        : token
        ? "التوكن محفوظ لكن تعذر الاتصال بـ Telegram"
        : "لم يتم حفظ رمز البوت",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        bot: "not configured",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}
