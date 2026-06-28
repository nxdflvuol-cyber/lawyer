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
    // التحقق من اتصال قاعدة البيانات أولاً
    await ensureDefaultUser();

    const body = await req.json();
    const { email, password, pin } = body;

    // التحقق من وجود البيانات المطلوبة
    if (!pin && (!email || !password)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال رمز PIN أو البريد وكلمة المرور" },
        { status: 400 }
      );
    }

    let user;
    if (pin) {
      user = await db.user.findFirst({ where: { pin } });
    } else if (email && password) {
      user = await db.user.findFirst({
        where: { email, passwordHash: hashPassword(password) },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "الحساب معطّل. يرجى الاتصال بالمدير" },
        { status: 403 }
      );
    }

    // تحديث آخر تسجيل دخول
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // تسجيل في سجل التدقيق
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "login",
          entity: "auth",
          details: "تسجيل دخول ناجح",
        },
      });
    } catch {
      // تجاهل أخطاء سجل التدقيق - لا تؤثر على تسجيل الدخول
    }

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

    // رسائل خطأ مفصلة حسب نوع الخطأ
    let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
    let statusCode = 500;

    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("database") || msg.includes("prisma") || msg.includes("connection")) {
        errorMessage = "تعذر الاتصال بقاعدة البيانات. تأكد من تشغيل: bun run db:push";
      } else if (msg.includes("Does not exist") || msg.includes("not found")) {
        errorMessage = "قاعدة البيانات غير مهيأة. شغّل: bun run db:push";
      } else if (msg.includes("Unique constraint")) {
        errorMessage = "خطأ في البيانات - تواصل مع المدير";
      } else {
        errorMessage = `خطأ تقني: ${msg.slice(0, 100)}`;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
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
      { success: false, error: "حدث خطأ في جلب المستخدمين" },
      { status: 500 }
    );
  }
}
