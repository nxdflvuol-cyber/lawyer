import { NextResponse } from "next/server";
import { getBotToken, getAuthorizedChatIds } from "@/lib/telegram-bot-integrated";

// إرسال رسالة تجريبية لكل المعرفات المصرح لها
export async function POST() {
  try {
    const token = await getBotToken();
    if (!token) {
      return NextResponse.json({
        success: false,
        error: "لم يتم تكوين رمز البوت. أضف Bot Token من الإعدادات أولاً.",
      });
    }

    const chatIds = await getAuthorizedChatIds();
    if (chatIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "لا توجد معرفات مصرح لها. أضف معرف الشات أولاً.",
      });
    }

    let sent = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const chatId of chatIds) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ رسالة تجريبية من نظام المحامي الشامل\n\nالبوت يعمل بنجاح! ⚖️\n\nيمكنك الآن:\n• إرسال أي سؤال بالعربية\n• رفع صورة توكيل لإضافة موكل تلقائياً\n• رفع مستندات PDF/Word للأرشيف",
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();
        if (data.ok) {
          sent++;
        } else {
          errors++;
          errorMessages.push(`${chatId}: ${data.description ?? "خطأ"}`);
        }
      } catch (err) {
        errors++;
        errorMessages.push(`${chatId}: ${err instanceof Error ? err.message : "خطأ"}`);
      }
    }

    return NextResponse.json({
      success: sent > 0,
      message:
        sent > 0
          ? `تم إرسال ${sent} رسالة بنجاح${errors > 0 ? `، فشل ${errors}` : ""}`
          : "فشل إرسال جميع الرسائل",
      sent,
      errors,
      errorDetails: errorMessages.length > 0 ? errorMessages.join("; ") : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}
