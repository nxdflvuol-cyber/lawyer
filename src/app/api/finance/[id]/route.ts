import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// تحديث عنصر مالي (fee | payment | expense | invoice)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { kind, ...data } = body;

    let result;
    if (kind === "fee") {
      result = await db.fee.update({
        where: { id },
        data: {
          feeType: data.feeType,
          amount: data.amount,
          paidAmount: data.paidAmount,
          description: data.description,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status,
        },
      });
    } else if (kind === "payment") {
      result = await db.payment.update({
        where: { id },
        data: {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          invoiceNumber: data.invoiceNumber,
        },
      });
    } else if (kind === "expense") {
      result = await db.expense.update({
        where: { id },
        data: {
          category: data.category,
          amount: data.amount,
          description: data.description,
          receiptData: data.receiptData,
        },
      });
    } else if (kind === "invoice") {
      result = await db.invoice.update({
        where: { id },
        data: {
          items: data.items ? JSON.stringify(data.items) : undefined,
          subtotal: data.subtotal,
          taxRate: data.taxRate,
          taxAmount: data.taxAmount,
          total: data.total,
          paidAmount: data.paidAmount,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes,
          status: data.status,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "نوع غير معروف" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Finance PUT [id] error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// حذف عنصر مالي
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") ?? "fee";

    if (kind === "fee") {
      await db.fee.delete({ where: { id } });
    } else if (kind === "payment") {
      await db.payment.delete({ where: { id } });
    } else if (kind === "expense") {
      await db.expense.delete({ where: { id } });
    } else if (kind === "invoice") {
      await db.invoice.delete({ where: { id } });
    } else {
      return NextResponse.json(
        { success: false, error: "نوع غير معروف" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Finance DELETE [id] error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
