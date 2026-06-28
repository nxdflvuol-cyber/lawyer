import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.startDate = {};
      if (from) (where.startDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startDate as Record<string, unknown>).lte = new Date(to);
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        case: { select: { id: true, internalNumber: true } },
        client: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointment = await db.appointment.create({
      data: {
        title: body.title,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        allDay: body.allDay ?? false,
        eventType: body.eventType ?? "other",
        location: body.location,
        court: body.court,
        caseId: body.caseId || null,
        clientId: body.clientId || null,
        reminder: body.reminder,
        color: body.color,
        status: "scheduled",
      },
    });
    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
