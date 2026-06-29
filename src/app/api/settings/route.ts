import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const settings = await db.setting.findMany();
    const obj: Record<string, string> = {};
    settings.forEach((s) => (obj[s.id] = s.value));
    return NextResponse.json({ success: true, settings: obj });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    // تحديث أو إنشاء كل إعداد
    await Promise.all(
      Object.entries(settings).map(([id, value]) =>
        db.setting.upsert({
          where: { id },
          update: { value },
          create: { id, value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
