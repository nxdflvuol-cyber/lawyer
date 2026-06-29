import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// إضافة جلسة لقضية
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const session = await db.caseSession.create({
      data: {
        caseId: id,
        sessionDate: new Date(body.sessionDate),
        sessionNumber: body.sessionNumber,
        court: body.court,
        circuit: body.circuit,
        judgeName: body.judgeName,
        purpose: body.purpose,
        attendees: body.attendees,
        facts: body.facts,
        opponentRequests: body.opponentRequests,
        opponentDefenses: body.opponentDefenses,
        lawyerPleading: body.lawyerPleading,
        decisions: body.decisions,
        adjournReason: body.adjournReason,
        nextSessionDate: body.nextSessionDate ? new Date(body.nextSessionDate) : null,
        documentsRequested: body.documentsRequested,
        courtStance: body.courtStance,
        opponentStance: body.opponentStance,
        strategy: body.strategy,
      },
    });

    // إذا كانت هناك جلسة قادمة، نضيفها كموعداً
    if (body.nextSessionDate) {
      await db.appointment.create({
        data: {
          title: `جلسة قضية ${body.internalNumber ?? id}`,
          startDate: new Date(body.nextSessionDate),
          eventType: "court_session",
          caseId: id,
          location: body.court,
        },
      });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Add session error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
