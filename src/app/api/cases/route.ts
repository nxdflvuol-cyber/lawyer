import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const caseType = searchParams.get("caseType");
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { internalNumber: { contains: search } },
        { officialNumber: { contains: search } },
        { opponentName: { contains: search } },
        { client: { fullName: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (caseType) where.caseType = caseType;
    if (clientId) where.clientId = clientId;

    const cases = await db.case.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        sessions: { orderBy: { sessionDate: "desc" }, take: 1 },
        _count: {
          select: { sessions: true, documents: true, tasks: true, procedures: true },
        },
      },
    });

    return NextResponse.json({ success: true, cases });
  } catch (error) {
    console.error("Get cases error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      internalNumber,
      officialNumber,
      year,
      caseType,
      caseSubType,
      court,
      circuit,
      degree,
      judgeName,
      judgeNotes,
      clientId,
      opponentName,
      opponentLawyer,
      startDate,
      facts,
      strategy,
      estimatedValue,
      priority,
      notes,
    } = body;

    if (!internalNumber || !clientId || !caseType) {
      return NextResponse.json(
        { success: false, error: "الرقم الداخلي والموكل ونوع القضية مطلوبون" },
        { status: 400 }
      );
    }

    const newCase = await db.case.create({
      data: {
        internalNumber,
        officialNumber: officialNumber || null,
        year: year || new Date().getFullYear(),
        caseType,
        caseSubType: caseSubType || null,
        court: court || null,
        circuit: circuit || null,
        degree: degree || "primary",
        judgeName: judgeName || null,
        judgeNotes: judgeNotes || null,
        clientId,
        opponentName: opponentName || null,
        opponentLawyer: opponentLawyer || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        facts: facts || null,
        strategy: strategy || null,
        estimatedValue: estimatedValue || null,
        priority: priority || "medium",
        notes: notes || null,
      },
      include: { client: true },
    });

    // إنشاء إجراء مبدئي
    await db.caseProcedure.create({
      data: {
        caseId: newCase.id,
        date: new Date(),
        type: "filing",
        description: "فتح القضية وتسجيلها في النظام",
        performedBy: "النظام",
        status: "completed",
      },
    });

    return NextResponse.json({ success: true, case: newCase });
  } catch (error) {
    console.error("Create case error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
