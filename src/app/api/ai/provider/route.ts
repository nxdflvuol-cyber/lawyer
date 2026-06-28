import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig, saveProviderConfig, testProviderConnection } from "@/lib/ai-client";

// جلب إعدادات المزود الحالية
export async function GET() {
  try {
    const config = await getProviderConfig();
    // إخفاء المفتاح جزئياً للأمان
    const maskedKey = config.apiKey
      ? config.apiKey.slice(0, 8) + "••••••••" + config.apiKey.slice(-4)
      : "";
    return NextResponse.json({
      success: true,
      config: {
        baseUrl: config.baseUrl,
        model: config.model,
        apiKeyMasked: maskedKey,
        hasKey: !!config.apiKey,
      },
    });
  } catch (error) {
    console.error("Get provider config error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// حفظ إعدادات المزود
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl, apiKey, model } = body;

    const updates: { baseUrl?: string; apiKey?: string; model?: string } = {};
    if (baseUrl) updates.baseUrl = baseUrl;
    if (apiKey) updates.apiKey = apiKey;
    if (model) updates.model = model;

    await saveProviderConfig(updates);

    return NextResponse.json({
      success: true,
      message: "تم حفظ إعدادات المزود بنجاح",
    });
  } catch (error) {
    console.error("Save provider config error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// اختبار الاتصال
export async function PUT() {
  try {
    const result = await testProviderConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Test provider error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "خطأ غير معروف",
    });
  }
}
