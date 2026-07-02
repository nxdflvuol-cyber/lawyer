// ============================================================
// Legal Brain - Long Memory + Pattern Learning
// ذاكرة طويلة المدى + تعلم أنماط الاستخدام
// ============================================================

import { db } from "@/lib/db";

// ---- Long Memory: ذاكرة دائمة في قاعدة البيانات ----

export interface LongMemoryEntry {
  id: string;
  userId: string;
  category: "preference" | "pattern" | "template" | "shortcut" | "workflow" | "entity";
  key: string;
  value: string;
  confidence: number;
  timesObserved: number;
  lastObserved: Date;
  createdAt: Date;
}

// تخزين مؤقت في الذاكرة + قاعدة البيانات (Setting table)
// نستخدم جدول Setting كمخزن KV للذاكرة طويلة المدى
const MEMORY_KEY_PREFIX = "brain:longmemory:";

// تسجيل نمط استخدام
export async function recordUsagePattern(
  userId: string,
  action: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  try {
    const patternKey = `${MEMORY_KEY_PREFIX}pattern:${userId}:${action}`;
    const existing = await db.setting.findUnique({ where: { id: patternKey } });
    const count = existing ? (parseInt(existing.value) || 0) + 1 : 1;
    const payload = JSON.stringify({
      action,
      count,
      context,
      lastObserved: new Date().toISOString(),
    });

    if (existing) {
      await db.setting.update({ where: { id: patternKey }, data: { value: payload } });
    } else {
      await db.setting.create({ data: { id: patternKey, value: payload } });
    }
  } catch {
    // تجاهل الأخطاء - الذاكرة اختيارية
  }
}

// استرجاع أنماط مستخدم
export async function getUserPatterns(userId: string): Promise<
  Array<{ action: string; count: number; lastObserved: string }>
> {
  try {
    const prefix = `${MEMORY_KEY_PREFIX}pattern:${userId}:`;
    const records = await db.setting.findMany({
      where: { id: { startsWith: prefix } },
    });
    return records.map((r) => {
      try {
        const parsed = JSON.parse(r.value);
        return {
          action: parsed.action ?? r.id.replace(prefix, ""),
          count: parsed.count ?? 1,
          lastObserved: parsed.lastObserved ?? new Date().toISOString(),
        };
      } catch {
        return { action: r.id.replace(prefix, ""), count: 1, lastObserved: new Date().toISOString() };
      }
    });
  } catch {
    return [];
  }
}

// تسجيل تفضيل مستخدم
export async function recordPreference(
  userId: string,
  key: string,
  value: string
): Promise<void> {
  try {
    const prefKey = `${MEMORY_KEY_PREFIX}pref:${userId}:${key}`;
    const existing = await db.setting.findUnique({ where: { id: prefKey } });
    if (existing) {
      await db.setting.update({ where: { id: prefKey }, data: { value } });
    } else {
      await db.setting.create({ data: { id: prefKey, value } });
    }
  } catch {}
}

// استرجاع تفضيلات مستخدم
export async function getPreferences(userId: string): Promise<Record<string, string>> {
  try {
    const prefix = `${MEMORY_KEY_PREFIX}pref:${userId}:`;
    const records = await db.setting.findMany({
      where: { id: { startsWith: prefix } },
    });
    const prefs: Record<string, string> = {};
    records.forEach((r) => {
      prefs[r.id.replace(prefix, "")] = r.value;
    });
    return prefs;
  } catch {
    return {};
  }
}

// ---- Pattern Detection: كشف أنماط العمل المتكررة ----

export interface DetectedPattern {
  type: "sequential" | "frequent" | "temporal";
  description: string;
  confidence: number;
  suggestion: string;
}

// كشف تسلسل الإجراءات المتكرر
// مثال: بعد إنشاء قضية → رفع صحيفة → رفع توكيل → إضافة جلسة
export async function detectSequentialPatterns(
  userId: string
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  try {
    const userPatterns = await getUserPatterns(userId);

    // أنماط معروفة مسبقاً
    const knownSequences = [
      {
        steps: ["case.created", "document.uploaded"],
        suggestion: "بعد إنشاء قضية، عادة ترفع مستندات. هل تريد رفع مستند الآن؟",
      },
      {
        steps: ["document.uploaded", "ai.analyze"],
        suggestion: "بعد رفع مستند، عادة تشغّل التحليل. هل تريد تحليل المستند؟",
      },
      {
        steps: ["session.created", "memo.created"],
        suggestion: "بعد إضافة جلسة، عادة تُنشئ مذكرة. هل تريد إنشاء مذكرة؟",
      },
      {
        steps: ["judgment.issued", "execution.started"],
        suggestion: "بعد صدور الحكم، عادة تبدأ التنفيذ. هل تريد بدء إجراءات التنفيذ؟",
      },
      {
        steps: ["client.created", "poa.created"],
        suggestion: "بعد إضافة موكل، عادة تُضيف توكيل. هل تريد إضافة توكيل؟",
      },
      {
        steps: ["case.created", "task.created"],
        suggestion: "بعد إنشاء قضية، عادة تُنشئ مهام متابعة. هل تريد إنشاء مهمة؟",
      },
    ];

    for (const seq of knownSequences) {
      // إذا كان النمط الأول ملاحظاً بشكل متكرر
      const firstStep = userPatterns.find((p) => p.action === seq.steps[0]);
      if (firstStep && firstStep.count >= 2) {
        patterns.push({
          type: "sequential",
          description: `تسلسل: ${seq.steps.join(" → ")}`,
          confidence: Math.min(0.9, 0.4 + firstStep.count * 0.1),
          suggestion: seq.suggestion,
        });
      }
    }
  } catch {}

  return patterns;
}

// كشف الأنشطة المتكررة (frequent actions)
export async function detectFrequentActions(
  userId: string,
  threshold = 5
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];
  try {
    const userPatterns = await getUserPatterns(userId);
    const frequent = userPatterns
      .filter((p) => p.count >= threshold)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    for (const p of frequent) {
      patterns.push({
        type: "frequent",
        description: `إجراء متكرر: ${p.action} (${p.count} مرة)`,
        confidence: Math.min(0.95, 0.5 + p.count * 0.05),
        suggestion: `يبدو أنك تستخدم "${p.action}" كثيراً. يمكن إنشاء اختصار سريع له.`,
      });
    }
  } catch {}
  return patterns;
}

// تجميع كل الأنماط لمستخدم
export async function getAllDetectedPatterns(
  userId: string
): Promise<DetectedPattern[]> {
  const [sequential, frequent] = await Promise.all([
    detectSequentialPatterns(userId),
    detectFrequentActions(userId),
  ]);
  return [...sequential, ...frequent].sort((a, b) => b.confidence - a.confidence);
}

// ---- المساعد الاستباقي: اقتراح الإجراء التالي ----

export interface NextActionSuggestion {
  action: string;
  label: string;
  confidence: number;
  reason: string;
}

export async function suggestNextAction(
  userId: string,
  lastAction: string
): Promise<NextActionSuggestion | null> {
  const patterns = await detectSequentialPatterns(userId);
  const matching = patterns.find((p) => {
    const steps = p.description.replace("تسلسل: ", "").split(" → ");
    return steps[0] === lastAction;
  });

  if (matching && matching.confidence > 0.5) {
    return {
      action: lastAction,
      label: matching.suggestion,
      confidence: matching.confidence,
      reason: `ملاحظ ${matching.description}`,
    };
  }
  return null;
}

// ---- مسح ذاكرة مستخدم (للخصوصية) ----

export async function clearUserMemory(userId: string): Promise<void> {
  try {
    const prefix = `${MEMORY_KEY_PREFIX}`;
    // حذف كل سجلات هذا المستخدم
    const records = await db.setting.findMany({
      where: { id: { startsWith: prefix } },
    });
    const userRecords = records.filter((r) => r.id.includes(`:${userId}:`));
    for (const r of userRecords) {
      await db.setting.delete({ where: { id: r.id } });
    }
  } catch {}
}
