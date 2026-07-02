import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// جلب إشعارات المستخدم
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, notifications });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// إنشاء إشعار
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notif = await db.notification.create({
      data: {
        userId: body.userId || null,
        title: body.title,
        message: body.message,
        type: body.type || "info",
        entityType: body.entityType || null,
        entityId: body.entityId || null,
        actionUrl: body.actionUrl || null,
      },
    });
    return NextResponse.json({ success: true, notification: notif });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}

// تعليم كمقروء
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, markAllRead, userId } = body;

    if (markAllRead && userId) {
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db.notification.update({ where: { id }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "معرف مطلوب" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
