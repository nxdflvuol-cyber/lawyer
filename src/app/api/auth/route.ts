import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function ensureDefaultUser() {
  const count = await db.user.count();
  if (count === 0) {
    await db.user.create({
      data: {
        name: "المحامي",
        email: "admin@lawyer.local",
        passwordHash: hashPassword("1234"),
        role: "admin",
        pin: "1234",
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultUser();
    const body = await req.json();
    const { email, password, pin } = body;

    let user;
    if (pin) {
      user = await db.user.findFirst({ where: { pin } });
    } else if (email && password) {
      user = await db.user.findFirst({
        where: { email, passwordHash: hashPassword(password) },
      });
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "login",
        entity: "auth",
        details: "تسجيل دخول ناجح",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureDefaultUser();
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
