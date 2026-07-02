import { NextRequest, NextResponse } from "next/server";
import {
  getAllDetectedPatterns,
  getPreferences,
  recordPreference,
  recordUsagePattern,
  clearUserMemory,
} from "@/lib/legal-brain/long-memory";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "default";
  const [patterns, preferences] = await Promise.all([
    getAllDetectedPatterns(userId),
    getPreferences(userId),
  ]);
  return NextResponse.json({
    success: true,
    patterns,
    preferences,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId ?? "default";

    if (body.action === "record_pattern") {
      await recordUsagePattern(userId, body.pattern, body.context ?? {});
      return NextResponse.json({ success: true });
    }
    if (body.action === "record_preference") {
      await recordPreference(userId, body.key, body.value);
      return NextResponse.json({ success: true });
    }
    if (body.action === "clear_memory") {
      await clearUserMemory(userId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
