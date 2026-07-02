// ============================================================
// Legal Brain Memory - مدير الذاكرة
// ذاكرة الجلسة + الذاكرة طويلة المدى لكل مستخدم
// ============================================================

import { db } from "@/lib/db";
import type { BrainInput, MemoryItem, MemoryResult } from "./types";

// ذاكرة مؤقتة في الذاكرة (session-level)
interface SessionMemory {
  items: MemoryItem[];
  lastCase?: { id: string; title: string };
  lastClient?: { id: string; name: string };
  lastDocument?: { id: string; title: string };
  conversationSummary?: string;
  messageCount: number;
}

// تخزين الجلسات في الذاكرة (يُعاد ضبطه عند إعادة التشغيل)
const sessionStore = new Map<string, SessionMemory>();

function getSession(sessionId: string): SessionMemory {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      items: [],
      messageCount: 0,
    });
  }
  return sessionStore.get(sessionId)!;
}

// استخراج الكيانات المذكورة من النص
function extractEntities(text: string): {
  caseIds?: string[];
  clientIds?: string[];
} {
  const result: { caseIds?: string[]; clientIds?: string[] } = {};
  // البحث عن معرفات القضايا (صيغة cuid)
  const cuidPattern = /cl[a-z0-9]{20,}/g;
  const ids = text.match(cuidPattern);
  if (ids) result.caseIds = ids;
  return result;
}

// استخراج ذاكرة من النص
export function extractMemoryFromMessage(message: string): MemoryItem[] {
  const items: MemoryItem[] = [];
  const now = Date.now();

  // ذكر رقم قضية
  const caseNoMatch = message.match(/(?:قضية|دعوى|محمولة)\s*(?:رقم|ذات رقم)?\s*([0-9]+(?:\/[0-9]+)*)/);
  if (caseNoMatch) {
    items.push({
      key: "mentioned_case_number",
      value: caseNoMatch[1],
      timestamp: now,
      type: "entity",
    });
  }

  // ذكر اسم موكل (نمط تقريبي)
  const clientMatch = message.match(/(?:الموكل|العميل)\s+(?:السيد\/ة?\s*)?([أ-ي\s]{3,30})/);
  if (clientMatch) {
    items.push({
      key: "mentioned_client",
      value: clientMatch[1].trim(),
      timestamp: now,
      type: "entity",
    });
  }

  // ذكر تاريخ
  const dateMatch = message.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  if (dateMatch) {
    items.push({
      key: "mentioned_date",
      value: dateMatch[1],
      timestamp: now,
      type: "fact",
    });
  }

  return items;
}

// حفظ ذاكرة الجلسة
export function saveToMemory(
  sessionId: string,
  input: BrainInput,
  response: string
): void {
  const session = getSession(sessionId);
  session.messageCount++;

  // استخراج عناصر الذاكرة
  const extracted = extractMemoryFromMessage(input.message);
  session.items.push(...extracted);

  // تحديث آخر كيانات ذُكرت
  if (input.explicit_context?.caseId) {
    session.lastCase = { id: input.explicit_context.caseId, title: "" };
  }
  if (input.explicit_context?.clientId) {
    session.lastClient = { id: input.explicit_context.clientId, name: "" };
  }
  if (input.explicit_context?.documentId) {
    session.lastDocument = { id: input.explicit_context.documentId, title: "" };
  }

  // تحديث ملخص المحادثة (مبسط)
  if (session.messageCount % 5 === 0) {
    session.conversationSummary = `تبادل ${session.messageCount} رسائل. آخر موضوع: ${input.message.slice(0, 100)}`;
  }
}

// استرجاع الذاكرة
export async function retrieveMemory(input: BrainInput): Promise<MemoryResult> {
  const sessionId = input.sessionId ?? "default";
  const session = getSession(sessionId);

  // تحديث أسماء الكيانات الأخيرة من قاعدة البيانات
  let recentEntities: MemoryResult["recent_entities"] = {};
  if (session.lastCase?.id) {
    try {
      const c = await db.case.findUnique({
        where: { id: session.lastCase.id },
        select: { id: true, internalNumber: true },
      });
      if (c) recentEntities.last_case = { id: c.id, title: c.internalNumber };
    } catch {}
  }
  if (session.lastClient?.id) {
    try {
      const cl = await db.client.findUnique({
        where: { id: session.lastClient.id },
        select: { id: true, fullName: true },
      });
      if (cl) recentEntities.last_client = { id: cl.id, name: cl.fullName };
    } catch {}
  }

  return {
    session_items: session.items.slice(-10), // آخر 10 عناصر
    recent_entities: recentEntities,
    conversation_summary: session.conversationSummary,
  };
}

// مسح ذاكرة جلسة
export function clearMemory(sessionId: string): void {
  sessionStore.delete(sessionId);
}
