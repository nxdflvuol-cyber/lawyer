import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// بحث ذكي متعدد الكيانات - Fuzzy Search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "20");

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // إزالة التشكيل وتوحيد الهمزات
    const normalizedQuery = query
      .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
      .replace(/[أإآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .trim()
      .toLowerCase();

    const results: Array<{
      type: string;
      id: string;
      title: string;
      subtitle: string;
      meta?: string;
    }> = [];

    // البحث في القضايا
    const cases = await db.case.findMany({
      where: {
        OR: [
          { internalNumber: { contains: query } },
          { officialNumber: { contains: query } },
          { opponentName: { contains: query } },
          { client: { fullName: { contains: query } } },
          { facts: { contains: query } },
        ],
      },
      take: 5,
      include: { client: { select: { fullName: true } } },
    });
    cases.forEach((c) => {
      results.push({
        type: "case",
        id: c.id,
        title: c.internalNumber,
        subtitle: c.client?.fullName ?? "—",
        meta: c.opponentName ?? undefined,
      });
    });

    // البحث في الموكلين
    const clients = await db.client.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { phone: { contains: query } },
          { idNumber: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 5,
    });
    clients.forEach((c) => {
      results.push({
        type: "client",
        id: c.id,
        title: c.fullName,
        subtitle: c.idNumber ?? c.phone ?? "—",
      });
    });

    // البحث في ملفات التجهيز
    const preCases = await db.preCase.findMany({
      where: {
        OR: [
          { preCaseNumber: { contains: query } },
          { title: { contains: query } },
          { client: { fullName: { contains: query } } },
        ],
      },
      take: 5,
      include: { client: { select: { fullName: true } } },
    });
    preCases.forEach((pc) => {
      results.push({
        type: "precase",
        id: pc.id,
        title: pc.preCaseNumber,
        subtitle: pc.title,
        meta: pc.client?.fullName ?? undefined,
      });
    });

    // البحث في المستندات
    const documents = await db.document.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
          { textContent: { contains: query } },
        ],
      },
      take: 5,
    });
    documents.forEach((d) => {
      results.push({
        type: "document",
        id: d.id,
        title: d.title,
        subtitle: d.category ?? "مستند",
        meta: d.fileName,
      });
    });

    // البحث في المهام
    const tasks = await db.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 5,
    });
    tasks.forEach((t) => {
      results.push({
        type: "task",
        id: t.id,
        title: t.title,
        subtitle: t.status,
      });
    });

    // البحث في المكتبة القانونية
    const library = await db.legalLibrary.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      take: 5,
    });
    library.forEach((l) => {
      results.push({
        type: "library",
        id: l.id,
        title: l.title,
        subtitle: l.itemType,
      });
    });

    return NextResponse.json({
      success: true,
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error) {
    console.error("Smart search error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
