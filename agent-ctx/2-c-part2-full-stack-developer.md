# Task 2-c-part2: بناء أقسام المالية والتقارير والحاسبات القانونية

**Agent**: full-stack-developer
**Status**: ✅ مكتمل
**Task ID**: 2-c-part2 (يشمل 4-a-finance)
**Date**: 2025

## ملخص العمل

تم بناء ثلاثة أقسام كاملة في مشروع "المحامي الشامل" + 3 APIs جديدة:

1. **`src/components/sections/finance-section.tsx`** (~2030 سطر) - قسم المالية
2. **`src/components/sections/reports-section.tsx`** (~1245 سطر) - قسم التقارير
3. **`src/components/sections/calculators-section.tsx`** (~1230 سطر) - قسم الحاسبات القانونية

كما تم إنشاء:
- `src/app/api/finance/[id]/route.ts` (PUT + DELETE للعناصر المالية)
- `src/app/api/reports/route.ts` (نظام تقارير متكامل: 5 أنواع)
- `src/app/api/calculators/route.ts` (GET + POST لحفظ نتائج الحاسبات)
- `src/components/sections/_placeholder.tsx` + 13 stub section للأقسام غير المبنية بعد (سيستبدلها وكلاء لاحقون)

## الملفات المُنشأة

### 1. finance-section.tsx

#### التصديرات
- `FinanceSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `CreateFinanceDialog` - نافذة إنشاء (fee | payment | expense | invoice) بأيقونات ملوّنة
- `FinanceDetailSheet` - Sheet تفاصيل/تعديل لكل نوع
- `InvoicePrintDialog` - معاينة وطباعة الفاتورة
- `DetailRow` - صف بيانات مع أيقونة
- `EmptyChart`, `EmptyList` - حالات فارغة

#### الميزات
- ✅ 4 بطاقات إحصائية (إجمالي الدخل، المصروفات، صافي الدخل، أتعاب معلقة)
- ✅ 4 تبويبات: الأتعاب / المدفوعات / المصروفات / الفواتير
  - عدّاد لكل تبويب في الـ TabsList
  - بحث لكل تبويب
  - جدول كامل لكل نوع
- ✅ الأتعاب: نوع (FEE_TYPES: fixed/hourly/percentage/mixed/staged)، مبلغ، مدفوع، حالة، استحقاق، ربط بقضية
- ✅ المدفوعات: مبلغ، طريقة دفع (نقدي/تحويل/شيك/بطاقة)، مرجع، ربط بموكل/قضية، ربط بأتعاب لتحديث الحالة تلقائياً
- ✅ المصروفات: فئة (EXPENSE_CATEGORIES)، مبلغ، وصف، ربط بقضية، رفع صورة إيصال (base64)
- ✅ الفواتير: توليد رقم تلقائي (INV-YYYY-NNNN)، بنود JSON ديناميكية، إجمالي، ضريبة، حالة
- ✅ رسم بياني للتدفق النقدي الشهري (AreaChart + LineChart) آخر 12 شهراً
- ✅ زر تصدير PDF/طباعة للفاتورة (window.print) مع ترويسة احترافية
- ✅ Sheet تعديل لكل نوع (تحرير/حفظ)
- ✅ حذف مع تأكيد (AlertDialog)
- ✅ استخدم: FEE_TYPES, EXPENSE_CATEGORIES, formatCurrency, formatDate من constants
- ✅ react-query (useQuery + useMutation + invalidateQueries)
- ✅ useToast للإشعارات
- ✅ shadcn/ui: Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, Table, ScrollArea, Separator, AlertDialog

### 2. reports-section.tsx

#### التصديرات
- `ReportsSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `ReportOverview` - لوحة بطاقات تكاملية حسب نوع التقرير
- `ReportCharts` - رسوم بيانية مخصصة لكل نوع
- `ReportTable` - جدول تفصيلي لكل نوع
- `StatCard` - بطاقة إحصائية
- `ChartCard` - بطاقة رسم بياني
- `EmptyChart`, `EmptyList`

#### الميزات
- ✅ 5 أنواع تقارير جاهزة:
  - **تقرير القضايا**: total، totalValue، byType، byStatus، byDegree، byCourt + جدول
  - **تقرير المالية**: totalIncome/Expenses/netIncome، pendingFees، feesByType، expensesByCategory، monthly + جدول مدفوعات/مصروفات/أتعاب
  - **تقرير الموكلين**: total، byType، byStatus، byCity، topClients + جدول
  - **تقرير المهام**: total، completed، overdue، completionRate، byStatus، byPriority + جدول
  - **تقرير الإنتاجية**: totalSessions، totalProcedures، tasksCompleted، documentsCreated، newCases، monthly، proceduresByType + جدول
- ✅ نموذج تحديد المعايير:
  - نطاق التاريخ (preset: اليوم/أسبوع/شهر/ربع سنة/سنة/الكل + تخصيص من/إلى)
  - نوع القضية / حالة / أولوية / نوع الموكل (حسب نوع التقرير)
- ✅ عرض كل تقرير: 4-5 بطاقات إحصائية + 2-3 رسوم بيانية + جدول تفصيلي
- ✅ رسوم Recharts: BarChart, PieChart, AreaChart, LineChart مع ألوان ثيم (emerald, amber, red, purple, teal)
- ✅ زر تصدير CSV (BOM لدعم العربية في Excel)
- ✅ زر طباعة (window.print)
- ✅ زر مسح الفلاتر
- ✅ استخدم CASE_TYPES, CASE_STATUS, TASK_STATUS, TASK_PRIORITY, CLIENT_TYPES, CLIENT_STATUS, FEE_TYPES, EXPENSE_CATEGORIES, formatCurrency, formatDate, getCaseTypeLabel, getCaseStatusLabel
- ✅ react-query لجلب البيانات + تخصيص queryKey حسب المعايير

### 3. calculators-section.tsx

#### التصديرات
- `CalculatorsSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `CalcDialog` - نافذة الحاسبة النشطة
- `CalcIcon` - أيقونة مستقرة (switch بدلاً من إنشاء مكونات أثناء العرض)
- 6 حاسبات مستقلة: `DeadlineCalculator`, `CompensationCalculator`, `InterestCalculator`, `CourtFeesCalculator`, `AlimonyCalculator`, `WorkersCompCalculator`
- `SaveResultDialog` - نافذة حفظ النتيجة (ربط بقضية/موكل)
- `ResultStat` - بطاقة نتيجة
- `AlertCard` - تنبيه قانوني

#### الميزات
- ✅ شبكة بطاقات للحاسبات المتاحة (6 حاسبات) مع تدرجات لونية احترافية
- ✅ الحاسبات:
  1. **حاسبة المواعيد القانونية**: تاريخ + مدة (أيام عمل) → تاريخ نهاية مع استثناء الجمعة/السبت/الأعياد + إدارة قائمة أعياد (7 أعياد مصرية افتراضية) + تفصيل الأيام
  2. **حاسبة التعويضات**: نوع الإصابة (6 أنواع مع معامل) + درجة العجز + الأجر + العمر → تعويض أساسي + تعويض عجز + إجمالي
  3. **حاسبة الفوائد القانونية**: مبلغ + نسبة + مدة (شهور/سنوات) + بسيطة/مركبة → فوائد + إجمالي
  4. **حاسبة رسوم القضايا**: قيمة المطالبة + نوع القضية (مدنية/تجارية/إدارية/عمالية/أحوال) → رسم أساسي + رسم نسبي + إجمالي
  5. **حاسبة النفقة**: الدخل + عدد الأطفال + نفقة الزوجة + تكلفة المسكن → تفصيل وإجمالي
  6. **حاسبة التعويضات العمالية**: الأجر اليومي + نسبة العجز + العمر + نوع الإصابة → تعويض مقطوع أو معاش شهري
- ✅ النقر على حاسبة يفتح Dialog بنموذج + نتيجة فورية
- ✅ كل حاسبة تعرض: نتيجة رئيسية في بطاقة ملوّنة + بطاقات إحصائية فرعية + تنبيه قانوني
- ✅ إمكانية حفظ النتيجة (POST /api/calculators) مع ربط بقضية/موكل (تُحفظ في Memo model)
- ✅ استخدم: formatCurrency, formatDate من constants + useToast + useQuery + useMutation
- ✅ ملاحظات قانونية مرجعية في كل حاسبة (قانون 90/1944 للرسوم، قانون 79/1975 للتأمينات، الخ)

## الـ APIs المُنشأة

### `src/app/api/finance/[id]/route.ts`
- **PUT**: تحديث fee/payment/expense/invoice حسب `kind`
- **DELETE**: حذف حسب `kind` (query param)

### `src/app/api/reports/route.ts`
- **GET**: تقارير شاملة بأنواعها الخمسة (cases/finance/clients/tasks/productivity)
- يدعم: نطاق التاريخ (from/to)، فلترة بـ caseType، status، priority، clientType
- يعيد: items + summary (إحصائيات مجمّعة + بيانات الرسوم البيانية)

### `src/app/api/calculators/route.ts`
- **GET**: جلب نتائج الحاسبات المحفوظة (Memo records بنوع consultation)
- **POST**: حفظ نتيجة حاسبة (تنشئ Memo مع caseId/clientId اختياري)

## الـ Stubs للأقسام غير المبنية

أنشأت `src/components/sections/_placeholder.tsx` مع `SectionPlaceholder` + 13 stub section:
- `memo-editor-section.tsx` → `MemoEditorSection`
- `pleading-section.tsx` → `PleadingSection`
- `maps-section.tsx` → `MapsSection`
- `ai-thinker-section.tsx` → `AiThinkerSection`
- `text-analyzer-section.tsx` → `TextAnalyzerSection`
- `performance-section.tsx` → `PerformanceSection`
- `development-section.tsx` → `DevelopmentSection`
- `settings-section.tsx` → `SettingsSection`
- `backup-section.tsx` → `BackupSection`
- `security-section.tsx` → `SecuritySection`
- `updates-section.tsx` → `UpdatesSection`
- `team-section.tsx` → `TeamSection`
- `research-section.tsx` → `ResearchSection`

كل stub يعرض بطاقة "قيد التطوير" مع وصف القسم. هذه ملفات مؤقتة سيستبدلها وكلاء لاحقون بالأقسام الفعلية. السبب: app-shell.tsx يستورد كل الأقسام ديناميكياً، وبدون الـ stubs كانت الصفحة لا تُحمّل (HTTP 500).

## الالتزام بالقواعد

- ✅ React 19 rules: استخدمت نمط "تخزين القيمة السابقة" بدلاً من useEffect للمزامنة (prevDefault/lastDefault، storedId/lastLoadedId، storedPreset/rangePreset)
- ✅ مكوّن `CalcIcon` مستقر (switch) بدلاً من إنشاء مكونات أثناء العرض
- ✅ RTL عربي بالكامل
- ✅ Responsive (mobile/desktop)
- ✅ ألوان الثيم (emerald, amber, red, purple, teal, rose, orange) - بدون indigo/blue
- ✅ animations خفيفة (animate-fade-in)
- ✅ shadcn/ui كامل
- ✅ TypeScript صارم
- ✅ ESLint نظيف (الخطأ الوحيد في src/app/page.tsx موجود مسبقاً وغير مرتبط بعملي)

## التحقق

- ✅ ESLint نظيف لكل الملفات الجديدة (لا أخطاء ولا تحذيرات)
- ✅ التجميع (compile) ناجح للملفات الثلاثة عند استيرادها منفردة (اختُبر بصفحة مؤقتة)
- ✅ التطبيق الكامل يُحمّل بنجاح (HTTP 200) بعد إضافة stubs للأقسام غير المبنية
- ✅ استخدام Recharts، react-query، useToast، shadcn/ui، constants من المشروع

## ملاحظات للوكلاء اللاحقين

1. **الـ stubs**: استبدلوا ملفات الـ stubs (التي تستورد `_placeholder.tsx`) بالأقسام الفعلية. يمكن حذف `_placeholder.tsx` بعد استبدال كل الـ stubs.
2. **APIs إضافية محتملة**:
   - تقارير أكثر تفصيلاً (تقرير الإيرادات حسب محامٍ، تقرير الجلسات حسب محكمة)
   - حفظ نتائج الحاسبات في جدول منفصل (CalculationResult) بدلاً من Memo
3. **الحاسبات**: القوانين المستخدمة هي قوانين مصرية. يمكن توسيعتها لاحقاً لدول عربية أخرى.
4. **الفواتير**: يمكن إضافة دعم تصدير PDF حقيقي (بدلاً من window.print) لاحقاً باستخدام مكتبة مثل jsPDF.
