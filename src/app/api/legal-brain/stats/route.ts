import { NextResponse } from "next/server";
import { getBrainStats } from "@/lib/legal-brain/brain";

export async function GET() {
  const stats = getBrainStats();
  return NextResponse.json({ success: true, ...stats });
}
