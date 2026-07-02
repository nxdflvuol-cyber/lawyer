import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Knowledge Graph - استكشاف علاقات الكيانات
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: "نوع ومعرف الكيان مطلوبان" }, { status: 400 });
    }

    const nodes: Array<{ id: string; type: string; label: string; data?: unknown }> = [];
    const edges: Array<{ source: string; target: string; relation: string }> = [];

    // العقدة الأساسية
    if (entityType === "case") {
      const caseData = await db.case.findUnique({
        where: { id: entityId },
        include: {
          client: true,
          sessions: { take: 5, orderBy: { sessionDate: "desc" } },
          procedures: { take: 5, orderBy: { date: "desc" } },
          fees: { take: 3 },
          tasks: { where: { status: { not: "completed" } }, take: 5 },
          documentLinks: { include: { document: true }, take: 10 },
          opponents: true,
          properties: true,
          contracts: true,
          evidences: true,
        },
      });

      if (!caseData) return NextResponse.json({ success: false, error: "غير موجود" }, { status: 404 });

      nodes.push({ id: caseData.id, type: "case", label: caseData.internalNumber });

      // الموكل
      if (caseData.client) {
        nodes.push({ id: caseData.client.id, type: "client", label: caseData.client.fullName });
        edges.push({ source: caseData.client.id, target: caseData.id, relation: "لديه قضية" });
      }

      // الجلسات
      caseData.sessions.forEach((s) => {
        nodes.push({ id: s.id, type: "session", label: `جلسة ${new Date(s.sessionDate).toLocaleDateString("ar-EG")}` });
        edges.push({ source: caseData.id, target: s.id, relation: "لها جلسة" });
      });

      // الإجراءات
      caseData.procedures.forEach((p) => {
        nodes.push({ id: p.id, type: "procedure", label: p.description.slice(0, 30) });
        edges.push({ source: caseData.id, target: p.id, relation: "لها إجراء" });
      });

      // المستندات
      caseData.documentLinks.forEach((dl) => {
        if (dl.document) {
          nodes.push({ id: dl.document.id, type: "document", label: dl.document.title });
          edges.push({ source: caseData.id, target: dl.document.id, relation: "لها مستند" });
        }
      });

      // الخصوم
      caseData.opponents.forEach((o) => {
        nodes.push({ id: o.id, type: "opponent", label: o.name });
        edges.push({ source: caseData.id, target: o.id, relation: "لها خصم" });
      });

      // العقارات
      caseData.properties.forEach((p) => {
        nodes.push({ id: p.id, type: "property", label: p.title });
        edges.push({ source: caseData.id, target: p.id, relation: "لها عقار" });
      });

      // العقود
      caseData.contracts.forEach((c) => {
        nodes.push({ id: c.id, type: "contract", label: c.title });
        edges.push({ source: caseData.id, target: c.id, relation: "لها عقد" });
      });

      // المهام
      caseData.tasks.forEach((t) => {
        nodes.push({ id: t.id, type: "task", label: t.title });
        edges.push({ source: caseData.id, target: t.id, relation: "لها مهمة" });
      });

      // الأتعاب
      caseData.fees.forEach((f) => {
        nodes.push({ id: f.id, type: "fee", label: `${f.amount} جنيه` });
        edges.push({ source: caseData.id, target: f.id, relation: "لها أتعاب" });
      });

    } else if (entityType === "client") {
      const client = await db.client.findUnique({
        where: { id: entityId },
        include: {
          cases: { select: { id: true, internalNumber: true, status: true } },
          preCases: { select: { id: true, preCaseNumber: true, status: true } },
          powers: true,
          payments: { take: 5, orderBy: { paymentDate: "desc" } },
        },
      });

      if (!client) return NextResponse.json({ success: false, error: "غير موجود" }, { status: 404 });

      nodes.push({ id: client.id, type: "client", label: client.fullName });

      client.cases.forEach((c) => {
        nodes.push({ id: c.id, type: "case", label: c.internalNumber });
        edges.push({ source: client.id, target: c.id, relation: "لديه قضية" });
      });

      client.preCases.forEach((pc) => {
        nodes.push({ id: pc.id, type: "precase", label: pc.preCaseNumber });
        edges.push({ source: client.id, target: pc.id, relation: "لديه ملف تجهيز" });
      });

      client.powers.forEach((p) => {
        nodes.push({ id: p.id, type: "power", label: p.poaNumber });
        edges.push({ source: client.id, target: p.id, relation: "لديه توكيل" });
      });
    }

    return NextResponse.json({ success: true, nodes, edges });
  } catch (error) {
    console.error("Knowledge graph error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ" }, { status: 500 });
  }
}
