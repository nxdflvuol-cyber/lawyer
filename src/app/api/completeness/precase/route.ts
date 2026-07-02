import { NextRequest, NextResponse } from "next/server";
import { checkPreCaseCompleteness } from "@/lib/legal-brain/completeness-engine";

export async function GET(req: NextRequest) {
  const preCaseId = req.nextUrl.searchParams.get("preCaseId");
  if (!preCaseId) {
    return NextResponse.json({ success: false, error: "preCaseId مطلوب" }, { status: 400 });
  }
  const result = await checkPreCaseCompleteness(preCaseId);
  return NextResponse.json({ success: true, ...result });
}
