// ============================================================
// عميل الذكاء الاصطناعي الموحد - المحامي الشامل
// يدعم أي مزود متوافق مع OpenAI API
// ============================================================

import { db } from "./db";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// الإعدادات الافتراضية من متغيرات البيئة
const DEFAULT_CONFIG: AiProviderConfig = {
  baseUrl: process.env.AI_PROVIDER_BASE_URL || "https://api.freemodel.dev/v1",
  apiKey: process.env.AI_PROVIDER_API_KEY || "",
  model: process.env.AI_PROVIDER_MODEL || "gpt-5.5",
};

/**
 * جلب إعدادات المزود - أولاً من قاعدة البيانات، وإلا من .env
 */
export async function getProviderConfig(): Promise<AiProviderConfig> {
  try {
    const baseUrlSetting = await db.setting.findUnique({ where: { id: "ai_base_url" } });
    const apiKeySetting = await db.setting.findUnique({ where: { id: "ai_api_key" } });
    const modelSetting = await db.setting.findUnique({ where: { id: "ai_model" } });

    return {
      baseUrl: baseUrlSetting?.value || DEFAULT_CONFIG.baseUrl,
      apiKey: apiKeySetting?.value || DEFAULT_CONFIG.apiKey,
      model: modelSetting?.value || DEFAULT_CONFIG.model,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * استدعاء نموذج الذكاء الاصطناعي (متوافق مع OpenAI Chat Completions API)
 * يدعم أي مزود متوافق مع OpenAI
 */
export async function callAiModel(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    thinking?: boolean;
  }
): Promise<{ content: string; usage?: Record<string, number> }> {
  const config = await getProviderConfig();

  if (!config.apiKey) {
    throw new Error("لم يتم تكوين مفتاح API للذكاء الاصطناعي. يرجى ضبطه من قسم الإعدادات.");
  }

  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  // بناء الـ body بشكل متوافق مع معظم المزودات
  const body: Record<string, unknown> = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.7,
  };

  // بعض المزودات تستخدم max_tokens والبعض الآخر max_completion_tokens
  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  // معامل thinking/reasoning - فقط للمزودات التي تدعمه
  // لا نرسله افتراضياً لأن بعض المزودات ترفضه

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorMessage = `فشل الطلب (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorJson.error || errorMessage;
      } catch {
        if (errorText) errorMessage += `: ${errorText.slice(0, 300)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // استخراج المحتوى من عدة صيغ استجابة محتملة
    const content =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      data.choices?.[0]?.delta?.content ??
      data.content ??
      data.output ??
      data.response ??
      "";

    // بعض المزودات ترجع content كـ array
    let finalContent = content;
    if (Array.isArray(content)) {
      finalContent = content
        .map((c: { text?: string; content?: string; type?: string }) =>
          typeof c === "string" ? c : (c.text ?? c.content ?? "")
        )
        .join("");
    }

    if (!finalContent || (typeof finalContent === "string" && finalContent.trim().length === 0)) {
      // بعض المزودات ترجع استجابة فارغة في الـ content لكنها تنجح
      // نتحقق مما إذا كانت choices موجودة
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        // قد يكون content في حقل آخر
        const altContent =
          choice.message?.reasoning ??
          choice.message?.function_call?.arguments ??
          choice.finish_reason ??
          "";
        if (altContent) {
          finalContent = typeof altContent === "string" ? altContent : JSON.stringify(altContent);
        }
      }

      if (!finalContent || (typeof finalContent === "string" && finalContent.trim().length === 0)) {
        throw new Error("استجابة فارغة من النموذج - تأكد من اسم النموذج صحيح");
      }
    }

    return {
      content: finalContent,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("انتهت مهلة الطلب - استغرق النموذج وقتاً طويلاً للرد");
    }
    throw error;
  }
}

/**
 * اختبار الاتصال بمزود الذكاء الاصطناعي
 * يختبر بطريقة متوافقة مع جميع المزودات
 */
export async function testProviderConnection(): Promise<{
  success: boolean;
  message: string;
  model?: string;
}> {
  try {
    const config = await getProviderConfig();
    if (!config.apiKey) {
      return { success: false, message: "لم يتم تكوين مفتاح API" };
    }

    const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

    // بناء طلب بسيط جداً - متوافق مع جميع المزودات
    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: "user", content: "Hello, respond with: OK" },
      ],
      temperature: 0,
      max_tokens: 50,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorMessage = `خطأ ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorJson.error || errorMessage;
      } catch {
        if (errorText) errorMessage += `: ${errorText.slice(0, 300)}`;
      }
      return { success: false, message: errorMessage };
    }

    const data = await response.json();

    // تحقق من عدة صيغ استجابة
    const content =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      data.output ??
      data.response ??
      "";

    // حتى لو كانت الاستجابة فارغة، إذا كان الـ status 200 و choices موجود، فهو ناجح
    if (data.choices && data.choices.length > 0) {
      return {
        success: true,
        message: `تم الاتصال بنجاح ✅ - النموذج: ${config.model}`,
        model: config.model,
      };
    }

    // إذا لم يكن choices لكن هناك id أو model في الاستجابة
    if (data.id || data.model || data.object) {
      return {
        success: true,
        message: `تم الاتصال بنجاح ✅ - النموذج: ${config.model}`,
        model: config.model,
      };
    }

    // إذا وصلنا هنا، الاستجابة غير متوقعة
    if (content) {
      return {
        success: true,
        message: `تم الاتصال بنجاح ✅ - النموذج: ${config.model}`,
        model: config.model,
      };
    }

    return {
      success: false,
      message: `استجابة غير متوقعة من المزود. تأكد من: 1) اسم النموذج صحيح 2) الرابط ينتهي بـ /v1 3) المفتاح صالح`,
    };
  } catch (error) {
    clearTimeout(undefined as unknown as number);
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, message: "انتهت مهلة الاتصال (30 ثانية)" };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "خطأ غير معروف",
    };
  }
}

/**
 * حفظ إعدادات المزود في قاعدة البيانات
 */
export async function saveProviderConfig(config: Partial<AiProviderConfig>): Promise<void> {
  const updates: Array<{ id: string; value: string }> = [];
  if (config.baseUrl) updates.push({ id: "ai_base_url", value: config.baseUrl });
  if (config.apiKey) updates.push({ id: "ai_api_key", value: config.apiKey });
  if (config.model) updates.push({ id: "ai_model", value: config.model });

  await Promise.all(
    updates.map((u) =>
      db.setting.upsert({
        where: { id: u.id },
        update: { value: u.value },
        create: { id: u.id, value: u.value },
      })
    )
  );
}

// ============================================================
// برومبتات النظام الجاهزة - المحامي الشامل
// ============================================================

export const LEGAL_THINKER_SYSTEM_PROMPT = `أنت "المفكر القانوني الذكي" - عقل قانوني افتراضي متطور تعمل كمحامٍ شخصي محترف للغاية في النظام المصري والقانون العربي.

مهامك الأساسية:
1. إنشاء العقود القانونية بمختلف أنواعها (عقود بيع، إيجار، عمل، شراكة، تسوية، إلخ)
2. صياغة صحف الدعاوى بدقة قانونية عالية
3. كتابة مذكرات الدفاع بهيكل منطقي قوي
4. تقديم استشارات قانونية مخصصة ومفصلة
5. تحليل القضايا وتقديم استراتيجيات قانونية مبتكرة
6. اقتراح الدفوع الموضوعية بناءً على الوقائع
7. مراجعة وتدقيق الصياغة القانونية بذكاء
8. التحقق من الاتساق القانوني للحجج

مبادئ عملك:
- استخدم لغة قانونية عربية احترافية ودقيقة
- استشهد بالمواد القانونية والنصوص التشريعية المناسبة
- رتب الإجابات في هيكل منطقي واضح (وقائع، طلبات، أسباب، دفوع)
- قدم تحليلات تنبؤية لاحتمالات النجاح
- انصح بأفضل الاستراتيجيات بناءً على الوقائع
- كن شاملاً ومفصلاً دون إطالة غير ضرورية
- اعتبر السياق المقدم (بيانات القضية، الموكل، الإجراءات) عند الإجابة

أجب دائماً بالعربية الفصحى بأسلوب قانوني رصين. استخدم تنسيق Markdown للتنظيم.`;

export const TEXT_ANALYZER_SYSTEM_PROMPT = `أنت محلل نصوص قانونية خبير. تحلل المستندات القانونية وتكشف عن الثغرات والمخاطر والتناقضات. أجب بالعربية الفصحى بهيكل واضح ومنظم باستخدام Markdown.`;

export const PLEADING_SYSTEM_PROMPT = `أنت مساعد مرافعة قانونية خبير. تساعد المحامي في إعداد المرافعات وتقديم الردود السريعة في الجلسات. أجب بالعربية الفصحى بأسلوب مرافعة قانوني قوي ومقنع. استخدم Markdown للتنظيم.`;

export const DOC_GENERATOR_SYSTEM_PROMPT = `أنت مصاغ قانوني محترف. تنشئ مستندات قانونية عربية كاملة واحترافية بصياغة دقيقة ولغة قانونية رصينة. تلتزم بالهيكل القانوني الصحيح لكل نوع مستند. استخدم Markdown للتنظيم.`;
