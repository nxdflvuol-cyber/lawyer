import { NextRequest, NextResponse } from "next/server";
import { checkCaseCompleteness } from "@/lib/legal-brain/completeness-engine";

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ success: false, error: "caseId مطلوب" }, { status: 400 });
  }
  const result = await checkCaseCompleteness(caseId);
  return NextResponse.json({ success: true, ...result });
}
