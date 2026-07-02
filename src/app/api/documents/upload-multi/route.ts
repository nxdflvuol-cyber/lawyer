import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// رفع مستند وربطه بكيانات متعددة دفعة واحدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, docType, category, legalType,
      fileName, fileSize, mimeType, fileData, textContent,
      tags, securityLevel,
      // كيانات الربط
      caseId, clientId, preCaseId, powerOfAttorneyId,
      linkType, uploadedById,
    } = body;

    if (!title || !fileName || !fileData) {
      return NextResponse.json(
        { success: false, error: "العنوان واسم الملف والبيانات مطلوبة" },
        { status: 400 }
      );
    }

    // حساب Hash لمنع التكرار
    const fileHash = crypto.createHash("sha256").update(fileData).digest("hex").slice(0, 32);

    // التحقق من وجود مستند بنفس الـ Hash
    const existing = await db.document.findFirst({ where: { fileHash } });
    let document;

    if (existing) {
      // المستند موجود - فقط أضف رابطاً جديداً
      document = existing;
    } else {
      // إنشاء مستند جديد
      const docCount = await db.document.count();
      document = await db.document.create({
        data: {
          internalNumber: `DOC-${new Date().getFullYear()}-${String(docCount + 1).padStart(5, "0")}`,
          title,
          description: description || null,
          docType: docType || "other",
          category: category || "other",
          legalType: legalType || null,
          fileName,
          fileSize: fileSize || null,
          mimeType: mimeType || null,
          fileExtension: fileName.split(".").pop()?.toLowerCase() || null,
          fileData,
          fileHash,
          textContent: textContent || null,
          tags: tags || null,
          securityLevel: securityLevel || "normal",
          ocrStatus: "none",
          aiStatus: "none",
        },
      });
    }

    // إنشاء رابط بين المستند والكيانات
    const link = await db.documentLink.create({
      data: {
        documentId: document.id,
        caseId: caseId || null,
        clientId: clientId || null,
        preCaseId: preCaseId || null,
        powerOfAttorneyId: powerOfAttorneyId || null,
        linkedById: uploadedById || null,
        linkType: linkType || "primary",
      },
    });

    // Timeline event
    const entityType = caseId ? "case" : preCaseId ? "precase" : clientId ? "client" : "document";
    const entityId = caseId || preCaseId || clientId || document.id;

    await db.timelineEvent.create({
      data: {
        eventType: "document_uploaded",
        entityType,
        entityId,
        title: `تم رفع مستند: ${title}`,
        description: `نوع: ${docType}, حجم: ${fileSize || "?"} بايت`,
        caseId: caseId || null,
        preCaseId: preCaseId || null,
        clientId: clientId || null,
        documentId: document.id,
        userId: uploadedById || null,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: uploadedById || null,
        action: "upload",
        entity: "document",
        entityId: document.id,
        entityName: title,
        details: `رفع مستند: ${title} (${fileName})`,
      },
    });

    return NextResponse.json({
      success: true,
      document,
      link,
      isDuplicate: !!existing,
      message: existing ? "تم ربط المستند الحالي بهذا الكيان" : "تم رفع المستند وربطه بنجاح",
    });
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ في الرفع" }, { status: 500 });
  }
}
