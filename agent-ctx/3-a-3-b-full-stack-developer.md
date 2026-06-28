# Task ID: 3-a + 3-b
## Agent: full-stack-developer (AI Sections Builder)
## Task: بناء 4 أقسام ذكاء اصطناعي حقيقية

### نظرة عامة
بنيت 4 أقسام ذكاء اصطناعي كاملة تستدعي الـ APIs الحقيقية الموجودة في `/api/ai/`:
1. **المفكر القانوني الذكي** (`ai-thinker-section.tsx`) - واجهة محادثة احترافية
2. **محرر المذكرات** (`memo-editor-section.tsx`) - محرر نصوص غني مع AI
3. **محلل النصوص** (`text-analyzer-section.tsx`) - 6 أنواع تحليل
4. **مساعد المرافعة** (`pleading-section.tsx`) - 4 مهام + مكتبة ردود + مؤقت

### Work Log

#### 1. AiThinkerSection (~980 سطر)
- **واجهة محادثة احترافية** بثيم قانوني (gradient ذهبي/زمردي على الرأس)
- **شريط جانبي للمحادثات السابقة** (260px) مع بحث + عدّاد رسائل + تاريخ
- **رسائل متبادلة**: المستخدم يمين (primary)، المساعد يسار (muted) مع Avatar
- **مؤشر كتابة** (TypingIndicator) - 3 نقاط bounce animation
- **دعم Markdown كامل** عبر `react-markdown` مع مكونات مخصصة لكل عنصر (h1/h2/h3/p/ul/ol/blockquote/code/table/hr/a)
- **حفظ محلي** (localStorage) للمحادثات مع تحميل تلقائي عند الترطيب
- **إنشاء محادثة جديدة** + حذف محادثة + بحث
- **5 قوالب سريعة** (صحيفة دعوى، تحليل قضية، مذكرة دفاع، عقد بيع، استشارة) - أزرار فوق مدخل الرسالة
- **زر "تحميل سياق قضية"** يفتح `CaseContextDialog` لاختيار قضية من `/api/cases`، يبني سياق كامل (رقم، نوع، محكمة، قاضي، خصم، وقائع، استراتيجية، ملاحظات، بيانات الموكل) ويمرره كـ `context` للـ API
- **زر نسخ** لكل رد مع animation check
- **معالجة الأخطاء**: رسالة خطأ في bubbble المساعد + toast
- **استدعاء API**: `POST /api/ai/chat` بـ `{ messages, context }`
- **سيناريو ذكي**: عند الإرسال، يُنشئ رسالة assistant فارغة أولاً لإظهار مؤشر الكتابة، ثم يستبدلها بالرد الفعلي
- **إرسال**: Enter للإرسال، Shift+Enter لسطر جديد

#### 2. MemoEditorSection (~1260 سطر)
- **3 أعمدة**: قائمة المذكرات (يسار) + المحرر (وسط) + القوالب (يمين)
- **محرر نصوص غني** عبر `contentEditable` div مع `execCommand`:
  - شريط أدوات كامل: تراجع/إعادة، عريض/مائل/تحته خط، عنوان 1/2/3، اقتباس، قائمة نقطية/رقمية، محاذاة يمين/وسط/يسار، خط فاصل
  - زر نسخ الكل
  - منع فقدان التركيز عند النقر على أزرار الشريط (`onMouseDown preventDefault`)
  - styling مخصص للعناوين والقوائم والاقتباسات
- **4 قوالب جاهزة**: مذكرة دفاع، صحيفة دعوى، عقد، استشارة - كل قالب محتوى HTML كامل
- **زر "توليد بالـ AI"** يفتح `AiGenerateDialog`:
  - اختيار نوع المستند (10 أنواع: صحيفة دعوى، مذكرة دفاع، عقود بيع/إيجار/عمل/شراكة، استشارة، إنذار، استئناف، طعن)
  - حقول: الأطراف، الموضوع، تفاصيل إضافية
  - يستدعي `POST /api/ai/generate-doc` بـ `{ docType, params, caseContext }`
  - يحوّل Markdown إلى HTML عبر `markdownToHtml()` ويدخله في المحرر
- **زر "إدراج من المكتبة"** يفتح `LibraryDialog`:
  - 3 فئات (قانون مدني، مرافعات، قانون عمل) - 11 نص قانوني
  - بحث + فلترة بالفئة
  - يُدرج كـ blockquote مخصص (legal-citation)
- **حفظ تلقائي** محلي بعد 1.5 ثانية من التوقف عن الكتابة
- **حفظ يدوي** مع flash "تم الحفظ"
- **قائمة المذكرات المحفوظة** مع بحث + عدّاد + تاريخ آخر تعديل
- **تصدير**:
  - PDF/طباعة عبر `window.print()` مع نمط طباعة احترافي (Cairo font, RTL, h1 center)
  - Word/DOCX عبر Blob بـ `application/msword` و`.doc` extension
- **عدّاد الكلمات والأحرف** في شريط الحالة + مؤشر "محفوظ/غير محفوظ"

#### 3. TextAnalyzerSection (~640 سطر)
- **6 أنواع تحليل** كشبكة بطاقات (grid 2/3/6):
  - تحليل مخاطر العقود (contract_risk) - أحمر
  - تحليل منطق المذكرات (memo_logic) - زمردي
  - مقارنة مستندين (compare) - أرجواني - يعرض حقلين
  - تلخيص (summary) - تركوازي
  - تدقيق الاستشهادات (citations) - كهرماني
  - تحليل الأسلوب (sentiment) - وردي
- **زر مثال** يملأ نصاً تجريبياً حسب النوع المختار
- **زر مسح** لتفريغ الحقول
- **عدّاد كلمات/أحرف**
- **زر "تحليل النص"** يستدعي `POST /api/ai/analyze` بـ `{ text, analysisType, compareWith }`
- **عرض النتائج** بـ Markdown مع ReactMarkdown مخصص
- **زر نسخ** للنتائج مع check animation
- **Skeleton loader** أثناء التحليل (pulse animation)
- **شاشة فارغة** عند عدم وجود نتائج
- **معالجة أخطاء** عبر useToast

#### 4. PleadingSection (~870 سطر)
- **نموذج إدخال بيانات القضية** بثلاثة حقول:
  - الوقائع / المرافعة المقترحة
  - دفوع الخصم
  - توجهات القاضي
- **4 أزرار مهام** (شبكة 2x2):
  - توليد نقاط المرافعة (pleading_points) → emerald
  - ردود سريعة (quick_responses) → amber
  - محاكاة أسئلة القاضي (judge_simulation) → purple
  - تحليل نقاط الضعف (weakness_analysis) → red
  - كل زر له loading state + check mark عند توفر نتيجة
- **عرض النتائج** بتبويبات `Tabs` (تظهر فقط للمهام المُنفّذة) مع Markdown
- **زر نسخ** لكل تبويب نتيجة
- **مؤقت المرافعة** في الرأس:
  - تنسيق HH:MM:SS
  - أزرار تشغيل/إيقاف مؤقت + إعادة تصفير
  - استخدم `setInterval` مع cleanup في useEffect
- **مكتبة الردود السريعة** (12 رد جاهز):
  - 4 فئات: اعتراضات شكلية، دفوع موضوعية، طلبات إجرائية، ردود على دفوع
  - بحث نصي + فلترة تلقائية بالفئة
  - بطاقات قابلة للنسخ بزر منفصل لكل رد
  - ScrollArea بـ height 320px
- **زر تحميل قضية** يفتح `CaseLoaderDialog`:
  - يستدعي `/api/cases`
  - يبني facts (وقائع، استراتيجية) + defenses (ملاحظات القاضي) من بيانات القضية
  - يملأ الحقول تلقائياً

### التزامات تقنية
- ✅ React 19 rules:
  - تجنّب setState في effect ما أمكن (بقيت حالات ترطيب localStorage فقط مع `eslint-disable-line`)
  - منع access ref خلال render (استخدمت `active.content` بدلاً من `editorRef.current` في useMemo)
- ✅ TypeScript صارم - لا أخطاء في الملفات الجديدة (تحققت بـ `tsc --noEmit`)
- ✅ ESLint نظيف - لا أخطاء في الملفات الجديدة (الخطأ الوحيد متبقٍ في `src/app/page.tsx` موجود مسبقاً)
- ✅ RTL عربي بالكامل - dir="rtl" على contentEditable وكل النصوص
- ✅ ألوان: التزمت بالثيم الزمردي/الذهبي (primary, emerald, amber, red, purple, teal, rose) - بدون indigo/blue
- ✅ responsive: شبكات 1/2/3 أعمدة حسب حجم الشاشة
- ✅ useToast للأخطاء + نجاح
- ✅ shadcn/ui كامل: Card, Button, Input, Textarea, Label, Badge, ScrollArea, Separator, Dialog, Select, Tabs, Tooltip
- ✅ react-markdown لعرض ردود AI
- ✅ lucide-react icons (Brain, Sparkles, Send, Plus, Trash2, Copy, Check, FolderOpen, MessageSquare, Loader2, Gavel, PenLine, ScanText, Scale, etc.)
- ✅ localStorage مع try/catch + check typeof window
- ✅ تحميل تلقائي عند الترطيب

### APIs المستخدمة (موجودة مسبقاً ولم أُعدّلها)
- `POST /api/ai/chat` - { messages, context } → { response }
- `POST /api/ai/analyze` - { text, analysisType, compareWith } → { analysis }
- `POST /api/ai/pleading` - { caseFacts, opponentDefenses, judgeTendencies, requestType } → { result }
- `POST /api/ai/generate-doc` - { docType, params, caseContext } → { content }
- `GET /api/cases` - لقوائم اختيار القضايا

### ملاحظة هامة عن _placeholder.tsx
لم أحذف `_placeholder.tsx` لأن **9 أقسام أخرى لا تزال تستورده**:
- performance-section, research-section, backup-section, updates-section, development-section, maps-section, settings-section, team-section, security-section
هذه الأقسام ليست ضمن نطاق هذه المهمة - سيبنيها وكلاء لاحقون. عند بناء كل الأقسام، يمكن حذف `_placeholder.tsx`.

### Stage Summary
- ✅ ai-thinker-section.tsx (~980 سطر): محادثة كاملة + قوالب + سياق قضية + markdown + copy
- ✅ memo-editor-section.tsx (~1260 سطر): محرر غني + 4 قوالب + AI generate + مكتبة قانونية + حفظ تلقائي + تصدير PDF/Word
- ✅ text-analyzer-section.tsx (~640 سطر): 6 أنواع تحليل + مقارنة + skeleton loader + أمثلة
- ✅ pleading-section.tsx (~870 سطر): 4 مهام + مؤقت + مكتبة 12 رد + تحميل قضية
- ✅ جميع الأقسام تستدعي z-ai-web-dev-sdk الحقيقي عبر الـ APIs الموجودة
- ✅ TypeScript نظيف + ESLint نظيف (باستثناء page.tsx الموجود مسبقاً)
- ✅ RTL عربي + responsive + animations + ثيم قانوني
- ✅ الصفحة تُحمّل بنجاح (HTTP 200)
