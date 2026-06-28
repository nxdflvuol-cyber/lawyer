import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// فحص حالة النظام - يساعد في تشخيص المشاكل
export async function GET() {
  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    database: { ok: false, error: "" as string },
    aiProvider: { configured: false },
    user: { exists: false, count: 0 },
  };

  // فحص قاعدة البيانات
  try {
    await db.$queryRaw`SELECT 1`;
    health.database.ok = true;

    // فحص وجود المستخدم الافتراضي
    const userCount = await db.user.count();
    health.user.count = userCount;
    health.user.exists = userCount > 0;
  } catch (error) {
    health.database.error = error instanceof Error ? error.message : String(error);
    health.success = false;
  }

  // فحص مزود الذكاء الاصطناعي
  const aiKey = process.env.AI_PROVIDER_API_KEY;
  health.aiProvider.configured = !!aiKey;

  return NextResponse.json(health, { status: health.success ? 200 : 500 });
}
