import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب إعدادات تليجرام
export async function GET() {
  try {
    const tokenSetting = await db.setting.findUnique({ where: { id: "telegram_bot_token" } });
    const chatIdsSetting = await db.setting.findUnique({ where: { id: "telegram_chat_ids" } });

    const hasToken = !!tokenSetting?.value;
    const authorizedChatIds = chatIdsSetting ? JSON.parse(chatIdsSetting.value) : [];

    return NextResponse.json({
      success: true,
      config: {
        hasToken,
        tokenMasked: hasToken ? tokenSetting!.value.slice(0, 10) + "••••" : "",
        authorizedChatIds,
      },
    });
  } catch (error) {
    console.error("Telegram GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// حفظ إعدادات تليجرام
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botToken, chatIds } = body;

    if (botToken) {
      await db.setting.upsert({
        where: { id: "telegram_bot_token" },
        update: { value: botToken },
        create: { id: "telegram_bot_token", value: botToken },
      });
    }

    if (chatIds && Array.isArray(chatIds)) {
      await db.setting.upsert({
        where: { id: "telegram_chat_ids" },
        update: { value: JSON.stringify(chatIds) },
        create: { id: "telegram_chat_ids", value: JSON.stringify(chatIds) },
      });
    }

    return NextResponse.json({ success: true, message: "تم الحفظ" });
  } catch (error) {
    console.error("Telegram POST error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
