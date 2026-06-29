import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await db.case.findUnique({
      where: { id },
      include: {
        client: true,
        sessions: { orderBy: { sessionDate: "desc" } },
        procedures: { orderBy: { date: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        appointments: { orderBy: { startDate: "asc" } },
        fees: { orderBy: { createdAt: "desc" } },
        expenses: { orderBy: { expenseDate: "desc" } },
        evidences: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ success: false, error: "القضية غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: caseData });
  } catch (error) {
    console.error("Get case error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.case.update({
      where: { id },
      data: body,
      include: { client: true },
    });
    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error("Update case error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.case.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete case error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
