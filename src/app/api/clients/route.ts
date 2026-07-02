import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const clientType = searchParams.get("clientType");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (clientType) where.clientType = clientType;

    const clients = await db.client.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { cases: true, documentLinks: true, payments: true },
        },
      },
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error("Get clients error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await db.client.create({
      data: {
        fullName: body.fullName,
        clientType: body.clientType ?? "individual",
        idNumber: body.idNumber,
        taxNumber: body.taxNumber,
        nationality: body.nationality,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        gender: body.gender,
        phone: body.phone,
        phone2: body.phone2,
        email: body.email,
        address: body.address,
        city: body.city,
        country: body.country,
        status: body.status ?? "active",
        notes: body.notes,
        criminalRecord: body.criminalRecord,
        medicalRecord: body.medicalRecord,
        companyType: body.companyType,
        legalForm: body.legalForm,
        incorporationDate: body.incorporationDate ? new Date(body.incorporationDate) : null,
        customFields: body.customFields,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
