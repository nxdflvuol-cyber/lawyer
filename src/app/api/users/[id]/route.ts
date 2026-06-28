import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// تحديث مستخدم
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, phone, isActive, password, pin } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.passwordHash = hashPassword(password);
    if (pin !== undefined) updates.pin = pin || null;

    const user = await db.user.update({
      where: { id },
      data: updates,
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

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        action: "update_user",
        entity: "user",
        entityId: id,
        details: `تحديث بيانات المستخدم: ${name ?? user.name}`,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في تحديث المستخدم" },
      { status: 500 }
    );
  }
}

// حذف مستخدم
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // منع حذف آخر مدير
    const adminCount = await db.user.count({ where: { role: "admin", isActive: true } });
    const user = await db.user.findUnique({ where: { id } });

    if (user?.role === "admin" && adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: "لا يمكن حذف آخر مدير في النظام" },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        action: "delete_user",
        entity: "user",
        entityId: id,
        details: `حذف المستخدم: ${user?.name ?? ""}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في حذف المستخدم" },
      { status: 500 }
    );
  }
}
