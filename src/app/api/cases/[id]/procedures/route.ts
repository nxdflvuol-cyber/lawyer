import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const procedure = await db.caseProcedure.create({
      data: {
        caseId: id,
        date: new Date(body.date ?? new Date()),
        type: body.type,
        description: body.description,
        performedBy: body.performedBy,
        result: body.result,
        nextAction: body.nextAction,
        status: body.status ?? "pending",
      },
    });
    return NextResponse.json({ success: true, procedure });
  } catch (error) {
    console.error("Add procedure error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
