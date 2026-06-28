import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const caseId = searchParams.get("caseId");
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (caseId) where.caseId = caseId;
    if (clientId) where.clientId = clientId;

    const tasks = await db.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      include: {
        case: { select: { id: true, internalNumber: true, opponentName: true } },
        client: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        reminderDate: body.reminderDate ? new Date(body.reminderDate) : null,
        caseId: body.caseId || null,
        clientId: body.clientId || null,
        assignedToId: body.assignedToId || null,
        parentTaskId: body.parentTaskId || null,
        estimatedHours: body.estimatedHours,
        tags: body.tags,
        checklist: body.checklist,
      },
    });
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
