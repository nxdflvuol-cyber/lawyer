import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await db.client.findUnique({
      where: { id },
      include: {
        cases: {
          orderBy: { updatedAt: "desc" },
          include: { _count: { select: { sessions: true, documents: true } } },
        },
        documents: { orderBy: { createdAt: "desc" } },
        communications: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } },
        powers: true,
        tasks: { where: { status: { not: "completed" } }, orderBy: { dueDate: "asc" } },
      },
    });
    if (!client) {
      return NextResponse.json({ success: false, error: "الموكل غير موجود" }, { status: 404 });
    }
    // حساب الملخص المالي
    const totalPaid = client.payments.reduce((sum, p) => sum + p.amount, 0);
    return NextResponse.json({ success: true, client, financialSummary: { totalPaid } });
  } catch (error) {
    console.error("Get client error:", error);
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
    const updated = await db.client.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
