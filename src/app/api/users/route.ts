import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { DEFAULT_PERMISSIONS, type UserRole } from "@/lib/permissions";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// جلب جميع المستخدمين
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
      roles: Object.entries(DEFAULT_PERMISSIONS).map(([key, _]) => ({
        value: key,
        label: getRoleLabel(key as UserRole),
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في جلب المستخدمين" },
      { status: 500 }
    );
  }
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "مدير",
    lawyer: "محامي",
    assistant: "مساعد قانوني",
    member: "عضو",
    intern: "متدرب",
  };
  return labels[role] ?? role;
}

// إنشاء مستخدم جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, pin } = body;

    // التحقق من البيانات
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "الاسم والبريد وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار البريد
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: role ?? "member",
        phone: phone ?? null,
        pin: pin ?? null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        action: "create_user",
        entity: "user",
        entityId: user.id,
        details: `إنشاء مستخدم جديد: ${name} (${role})`,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في إنشاء المستخدم" },
      { status: 500 }
    );
  }
}
