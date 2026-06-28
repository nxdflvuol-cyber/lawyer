import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// إدارة الأتعاب والمدفوعات والمصروفات
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "all"; // fees | payments | expenses | invoices

    const result: Record<string, unknown> = {};

    if (type === "all" || type === "fees") {
      result.fees = await db.fee.findMany({
        orderBy: { createdAt: "desc" },
        include: { case: { include: { client: true } } },
      });
    }
    if (type === "all" || type === "payments") {
      result.payments = await db.payment.findMany({
        orderBy: { paymentDate: "desc" },
        include: { client: true, case: true },
      });
    }
    if (type === "all" || type === "expenses") {
      result.expenses = await db.expense.findMany({
        orderBy: { expenseDate: "desc" },
        include: { case: true, client: true },
      });
    }
    if (type === "all" || type === "invoices") {
      result.invoices = await db.invoice.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true, case: true },
      });
    }

    // ملخص مالي
    const [income, expense, pendingFees] = await Promise.all([
      db.payment.aggregate({ _sum: { amount: true } }),
      db.expense.aggregate({ _sum: { amount: true } }),
      db.fee.aggregate({
        _sum: { amount: true, paidAmount: true },
        where: { status: { not: "paid" } },
      }),
    ]);

    result.summary = {
      totalIncome: income._sum.amount ?? 0,
      totalExpenses: expense._sum.amount ?? 0,
      netIncome: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0),
      pendingFees: (pendingFees._sum.amount ?? 0) - (pendingFees._sum.paidAmount ?? 0),
    };

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Finance GET error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kind } = body; // fee | payment | expense | invoice

    let result;
    if (kind === "fee") {
      result = await db.fee.create({
        data: {
          caseId: body.caseId,
          feeType: body.feeType,
          amount: body.amount,
          paidAmount: body.paidAmount ?? 0,
          description: body.description,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: body.status ?? "unpaid",
        },
      });
    } else if (kind === "payment") {
      result = await db.payment.create({
        data: {
          clientId: body.clientId,
          caseId: body.caseId || null,
          feeId: body.feeId || null,
          amount: body.amount,
          paymentMethod: body.paymentMethod,
          reference: body.reference,
          notes: body.notes,
          invoiceNumber: body.invoiceNumber,
        },
      });
      // تحديث حالة الأتعاب
      if (body.feeId) {
        const fee = await db.fee.findUnique({ where: { id: body.feeId } });
        if (fee) {
          const newPaid = fee.paidAmount + body.amount;
          await db.fee.update({
            where: { id: body.feeId },
            data: {
              paidAmount: newPaid,
              status: newPaid >= fee.amount ? "paid" : "partial",
            },
          });
        }
      }
    } else if (kind === "expense") {
      result = await db.expense.create({
        data: {
          caseId: body.caseId || null,
          clientId: body.clientId || null,
          category: body.category,
          amount: body.amount,
          description: body.description,
          receiptData: body.receiptData,
        },
      });
    } else if (kind === "invoice") {
      const count = await db.invoice.count();
      result = await db.invoice.create({
        data: {
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
          clientId: body.clientId || null,
          caseId: body.caseId || null,
          items: JSON.stringify(body.items ?? []),
          subtotal: body.subtotal,
          taxRate: body.taxRate ?? 0,
          taxAmount: body.taxAmount ?? 0,
          total: body.total,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          notes: body.notes,
          status: body.status ?? "draft",
        },
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Finance POST error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
