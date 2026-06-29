import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const member = await db.teamMember.create({
      data: {
        name: body.name,
        position: body.position,
        email: body.email,
        phone: body.phone,
        role: body.role ?? "member",
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        salary: body.salary,
        notes: body.notes,
      },
    });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("Create team member error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
