import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// Feature Flags - ميزات قابلة للتفعيل/الإيقاف لكل مستخدم/دور
// ============================================================

const FLAGS_KEY_PREFIX = "featureflag:";

// الميزات الافتراضية
export const FEATURE_FLAGS = [
  { id: "legal_brain", label: "العقل القانوني", description: "تفعيل الذكاء الاصطناعي القانوني", defaultFor: { admin: true, lawyer: true, assistant: true, member: false, intern: false } },
  { id: "automation", label: "محرك الأتمتة", description: "تنفيذ القواعد الآلية", defaultFor: { admin: true, lawyer: true, assistant: false, member: false, intern: false } },
  { id: "workflow_designer", label: "مصمم سير العمل", description: "إنشاء وتعديل مسارات القضايا", defaultFor: { admin: true, lawyer: false, assistant: false, member: false, intern: false } },
  { id: "template_studio", label: "استوديو القوالب", description: "محرر القوالب القانونية", defaultFor: { admin: true, lawyer: true, assistant: true, member: false, intern: false } },
  { id: "reporting_bi", label: "منصة التحليلات", description: "منشئ التقارير واللوحات", defaultFor: { admin: true, lawyer: true, assistant: false, member: false, intern: false } },
  { id: "integration_hub", label: "مركز التكاملات", description: "إدارة التكاملات الخارجية", defaultFor: { admin: true, lawyer: false, assistant: false, member: false, intern: false } },
  { id: "digital_twin", label: "النموذج الرقمي", description: "لوحة النموذج الرقمي للمكتب", defaultFor: { admin: true, lawyer: false, assistant: false, member: false, intern: false } },
  { id: "telegram_bot", label: "بوت تليجرام", description: "تكامل تليجرام", defaultFor: { admin: true, lawyer: true, assistant: true, member: false, intern: false } },
  { id: "ocr", label: "التعرف الضوئي", description: "استخراج النصوص من الصور", defaultFor: { admin: true, lawyer: true, assistant: true, member: false, intern: false } },
  { id: "long_memory", label: "الذاكرة طويلة المدى", description: "تعلم أنماط الاستخدام", defaultFor: { admin: true, lawyer: true, assistant: true, member: false, intern: false } },
  { id: "voice_commands", label: "الأوامر الصوتية (تجريبي)", description: "تحكم صوتي - مستقبلاً", defaultFor: { admin: false, lawyer: false, assistant: false, member: false, intern: false } },
  { id: "multi_office", label: "متعدد الفروع (تجريبي)", description: "إدارة عدة مكاتب - مستقبلاً", defaultFor: { admin: false, lawyer: false, assistant: false, member: false, intern: false } },
] as const;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const role = req.nextUrl.searchParams.get("role") ?? "member";

  // جلب التجاوزات (overrides) لهذا المستخدم
  let overrides: Record<string, boolean> = {};
  if (userId) {
    try {
      const records = await db.setting.findMany({
        where: { id: { startsWith: `${FLAGS_KEY_PREFIX}${userId}:` } },
      });
      records.forEach((r) => {
        overrides[r.id.replace(`${FLAGS_KEY_PREFIX}${userId}:`, "")] = r.value === "true";
      });
    } catch {}
  }

  // دمج الافتراضي مع التجاوزات
  const flags = FEATURE_FLAGS.map((f) => ({
    id: f.id,
    label: f.label,
    description: f.description,
    enabled: f.id in overrides ? overrides[f.id] : (f.defaultFor as any)[role] ?? false,
    isOverride: f.id in overrides,
  }));

  return NextResponse.json({ success: true, flags });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, flagId, enabled } = body;
    if (!userId || !flagId) {
      return NextResponse.json({ success: false, error: "userId و flagId مطلوبان" }, { status: 400 });
    }
    const key = `${FLAGS_KEY_PREFIX}${userId}:${flagId}`;
    const existing = await db.setting.findUnique({ where: { id: key } });
    if (existing) {
      await db.setting.update({ where: { id: key }, data: { value: String(enabled) } });
    } else {
      await db.setting.create({ data: { id: key, value: String(enabled) } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
