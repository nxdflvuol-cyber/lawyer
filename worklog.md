# سجل العمل - مشروع المحامي الشامل

## نظرة عامة على المشروع
نظام "المحامي الشامل" - تطبيق ويب متكامل لإدارة مكاتب المحاماة مع 24 قسمًا وذكاء اصطناعي قانوني.

## التقنيات المستخدمة
- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite
- z-ai-web-dev-sdk للذكاء الاصطناعي
- React Query + Zustand

## الحالة الحالية
تم بناء الأساس بالكامل:
- ✅ قاعدة البيانات الشاملة (Prisma schema لكل الكيانات)
- ✅ الثيم القانوني العربي RTL (ذهبي/زمردي)
- ✅ شاشة تسجيل الدخول (PIN + كلمة مرور)
- ✅ الهيكل الرئيسي مع الشريط الجانبي (24 قسم)
- ✅ متاجر Zustand (المصادقة، التنقل، الإعدادات، التنبيهات)
- ✅ APIs أساسية (auth, stats, cases, clients, tasks, appointments, finance, documents)
- ✅ APIs الذكاء الاصطناعي (chat, analyze, pleading, generate-doc)
- ✅ APIs النظام (backup, security, settings, team, research)
- ✅ لوحة المعلومات (Dashboard) كاملة
- ✅ البحث الشامل
- ✅ مُحدد وضع العمل (مكتب/محكمة/مقابلة/مرافعة/تحقيق)
- ✅ مُراقب الخمول لتسجيل الخروج التلقائي

## ملاحظات للـ subagents
- الواجهة عربية بالكامل RTL
- استخدم مكوّنات shadcn/ui الموجودة في src/components/ui
- استخدم متجر useNavStore للتنقل: setSection, selectCase, selectClient
- استخدم الثوابت من src/lib/constants.ts
- استخدم API routes الموجودة في src/app/api
- z-ai-web-dev-sdk للاستخدام في backend فقط
- لا تستخدم ألوان indigo/blue

---
Task ID: 2-a
Agent: full-stack-developer
Task: بناء قسمي القضايا والموكلين

Work Log:
- قرأت ملفات الأساس: constants.ts, stores.ts, APIs (cases, clients, finance, documents, tasks), dashboard-section.tsx, prisma schema, وكل مكونات shadcn/ui المستخدمة.
- بنيت `src/components/sections/cases-section.tsx` (~3500 سطر):
  * `CasesSection` رئيسي مع:
    - بطاقات إحصائية (إجمالي، نشطة، منتهية، كسب)
    - بحث + فلترة (الحالة، النوع، درجة التقاضي) مع زر مسح الفلاتر
    - قائمة بطاقات قضايا تعرض الموكل، الخصم، المحكمة، آخر جلسة، عدّادات (جلسات/مستندات/مهام)
    - زر "قضية جديدة" يفتح Dialog شامل (رقم داخلي/رسمي، سنة، نوع، تصنيف دقيق ديناميكي حسب النوع، درجة، أولوية، محكمة، دائرة، قاضي، خصم، محامي خصم، تاريخ بدء، قيمة مقدرة، وقائع، استراتيجية، ملاحظات)
  * `CaseDetailSheet` لوحة تفاصيل شاملة (Sheet جانبي يسار، عريض) مع 7 تبويبات:
    - نظرة عامة: بيانات أساسية + نمط تعديل كامل (status, priority, degree, court, circuit, judge, opponent, estimatedValue, facts, strategy, judgeNotes, result, notes)
    - الجلسات: إضافة/عرض جلسة كاملة (17 حقل: تاريخ، رقم، غرض، محكمة، دائرة، قاضي، وقائع، طلبات الخصم، دفوع الخصم، مرافعة المحامي، قرارات، سبب التأجيل، موقف المحكمة/الخصم، استراتيجية، حاضرون، مستندات مطلوبة، الجلسة القادمة) - تُضاف الجلسة القادمة كموعد تلقائياً
    - الإجراءات: timeline مع إضافة إجراء (نوع، وصف، نتيجة، إجراء تالٍ، حالة)
    - المستندات: شبكة بطاقات مع نموذج إضافة
    - المهام: قائمة مع badge للأولوية/الحالة/التأخر، إضافة مهمة مرتبطة
    - المالية: 4 بطاقات ملخص (إجمالي الأتعاب، المحصّل، المتبقي، المصروفات) + جدول أتعاب + جدول مصروفات + نماذج إضافة لكل من الأتعاب والمصروفات
    - التسلسل الزمني: تجميع كل الأحداث (إنشاء، إجراءات، جلسات، مستندات، أتعاب) مرتبة زمنياً مع أيقونات ملوّنة
  * حذف مع تأكيد، تحرير/حفظ مع toast، invalidateQueries بعد كل تعديل
  * مزامنة `selectedCaseId` من useNavStore
- بنيت `src/components/sections/clients-section.tsx` (~3000 سطر):
  * `ClientsSection` رئيسي مع:
    - بطاقات إحصائية (إجمالي، نشطين، محتملين)
    - بحث + فلترة (الحالة، النوع) مع زر مسح
    - شبكة بطاقات موكلين (Avatar مع initials، نوع، حالة، هاتف، إيميل، مدينة، عدّاد قضايا/مستندات)
    - زر "موكل جديد" يفتح Dialog شامل بثلاث بطاقات فرعية:
      · بيانات شخصية (للأفراد): رقم هوية، جنسية، تاريخ ميلاد، جنس
      · بيانات شركة (للشركات): نوع، شكل قانوني، سجل تجاري، رقم ضريبي، تاريخ تأسيس
      · بيانات تواصل: هاتف1، هاتف2، إيميل، عنوان، مدينة، دولة
      · ملاحظات
  * `ClientDetailSheet` لوحة تفاصيل شاملة مع 6 تبويبات:
    - البيانات: معلومات أساسية + بطاقة تواصل + بيانات شخصية/شركة (حسب النوع) + ملاحظات + سجل جنائي/طبي + نمط تحرير كامل
    - القضايا: قائمة قضايا الموكل مع إمكانية فتح القضية مباشرة (تنتقل لقسم القضايا وتفتح Sheet التفاصيل)
    - المستندات: شبكة بطاقات + إضافة
    - التواصل: timeline سجل تواصل (مكالمة/مقابلة/بريد/رسالة/زيارة) مع متابعة وتاريخ متابعة وتنبيه للتأخر
    - التوكيلات: قائمة توكيلات مع حالة (ساري/منتهي/ملغي) + إضافة توكيل كامل
    - المالية: ملخص (إجمالي مدفوعات، عدد الدفعات، متوسط الدفعة) + جدول دفعات + تسجيل دفعة جديدة
  * حذف مع تأكيد، تحرير/حفظ، invalidateQueries
  * مزامنة `selectedClientId` من useNavStore
- التزمت بقاعدة React 19 `react-hooks/set-state-in-effect` باستخدام نمط "تخزين القيمة السابقة" بدلاً من useEffect للمزامنة، و`key` prop لإعادة التركيب عند تغيّر الكيان.
- استخدمت: CASE_TYPES, CASE_STATUS, CASE_DEGREE, CLIENT_TYPES, CLIENT_STATUS, TASK_PRIORITY, TASK_STATUS, FEE_TYPES, EXPENSE_CATEGORIES, DOCUMENT_CATEGORIES, PROCEDURE_TYPES + formatDate, formatCurrency, getCaseTypeLabel, getCaseStatusLabel.
- ألوان: التزمت بثيم الزمردي/الذهبي (primary, emerald, amber, red, slate, purple) - بدون indigo/blue.
- RTL كامل، responsive (mobile/desktop)، animations خفيفة (animate-fade-in).
- ملاحظة للوكلاء اللاحقين: يلزم إضافة API routes لـ `/api/clients/[id]/communications` و `/api/clients/[id]/powers` (POST) - الكود الحالي يستدعيها مع fallback آمن يظهر toast تنبيه.

Stage Summary:
- ✅ cases-section.tsx: 7 تبويبات شاملة (نظرة عامة، جلسات، إجراءات، مستندات، مهام، مالية، تسلسل زمني) + بحث/فلترة + إنشاء/تحرير/حذف + 4 بطاقات إحصائية
- ✅ clients-section.tsx: 6 تبويبات شاملة (بيانات، قضايا، مستندات، تواصل، توكيلات، مالية) + بحث/فلترة + إنشاء/تحرير/حذف + 3 بطاقات إحصائية
- ✅ react-query لكل العمليات (useQuery + useMutation + invalidateQueries)
- ✅ useToast للإشعارات + useNavStore للمزامنة
- ✅ shadcn/ui كامل (Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, Table, ScrollArea, Avatar, Separator)
- ✅ TypeScript صارم بدون أخطاء (tsc --noEmit نظيف لكلا الملفين)
- ✅ ESLint نظيف (لا أخطاء في الملفين الجديدين)
- ✅ RTL عربي + responsive + animations

---
Task ID: 2-c-part1
Agent: full-stack-developer
Task: بناء أقسام المستندات والمهام والمواعيد

Work Log:
- قرأت worklog.md و agent-ctx/2-a-full-stack-developer.md لفهم ما تم.
- قرأت constants.ts, stores.ts, dashboard-section.tsx, cases-section.tsx (نموذج الأسلوب), APIs (documents, tasks, appointments + [id]), prisma schema, app-shell.tsx, globals.css, calendar.tsx, use-toast.ts.
- بنيت `src/components/sections/documents-section.tsx` (~1700 سطر):
  * `DocumentsSection` رئيسي مع 6 بطاقات إحصائية (إجمالي، عقود، مذكرات، أحكام، أدلة، حجم كلي)
  * بحث + فلترة (الفئة، النوع، القضية، الموكل) مع زر مسح + مزامنة مع useNavStore
  * 3 أوضاع عرض: شبكة / قائمة / مجلدات (Tabs)
  * `UploadDocumentDialog`: رفع عبر file input + drag & drop → FileReader.readAsDataURL → base64 → API. يدعم PDF, صور, Word, TXT. حد 10MB. كشف نوع تلقائي من MIME. معاينة الصورة قبل الرفع.
  * `DocumentCard` و `DocumentRow` مع أيقونات ملوّنة حسب docType
  * `DocumentDetailSheet`: Sheet تفاصيل مع نمط تحرير كامل (title, description, category, folder, tags, caseId, clientId) + تحميل (base64 data URL) + حذف مع تأكيد
  * `DocumentPreviewDialog`: معاينة سريعة - الصور مباشرة، PDF/Word كـ download fallback
  * استخدم DOCUMENT_CATEGORIES + DOC_TYPES محلي (pdf/image/word/text/other)
- بنيت `src/components/sections/tasks-section.tsx` (~1400 سطر):
  * `TasksSection` رئيسي مع 3 بطاقات إحصائية (للتنفيذ، قيد التنفيذ، متأخرة)
  * Kanban (3 أعمدة: todo, in_progress, completed) مع DnD كامل:
    - @dnd-kit/core (DndContext, DragOverlay, useDroppable, PointerSensor, closestCorners)
    - @dnd-kit/sortable (SortableContext, useSortable, verticalListSortingStrategy)
    - @dnd-kit/utilities (CSS.Transform)
    - السحب بين الأعمدة يحدّث الحالة عبر PUT /api/tasks/[id]
    - DragOverlay بتأثير rotate+opacity
    - GripVertical كمقبض سحب
  * عرض قائمة (Tabs للتبديل Kanban/List) + بحث + فلترة بالأولوية
  * `CreateTaskDialog`: عنوان، وصف، حالة، أولوية، موعد، تذكير، ربط بقضية/موكل، ساعات مقدّرة، وسوم
  * `TaskDetailSheet`: Sheet تفاصيل + تعديل كامل + أزرار حالة سريعة (مجدول/مكتمل/ملغي)
  * مؤشرات الأولوية بألوان (TASK_PRIORITY) + كشف التأخير (red)
  * استخدم TASK_STATUS + TASK_PRIORITY
- بنيت `src/components/sections/appointments-section.tsx` (~1900 سطر):
  * `AppointmentsSection` رئيسي مع 3 بطاقات إحصائية (مواعيد اليوم، هذا الشهر، قادمة)
  * تقويم شهري مخصص (شبكة 7×6): تمييز اليوم الحالي والمختار، نقاط ملوّنة حسب نوع الموعد، عنوان أول موعد، النقر ينتقل لعرض يومي
  * 4 تبويبات: يومي / أسبوعي / شهري / قائمة (Tabs)
  * قائمة جانبية لمواعيد اليوم المختار (ScrollArea)
  * أزرار تنقل (السابق/التالي/اليوم) تتكيف مع العرض
  * `CreateAppointmentDialog`: عنوان، نوع، وصف، allDay switch، تاريخ/وقت بداية/نهاية، موقع، محكمة، ربط بقضية/موكل، تذكير
  * تمييز بألوان حسب EVENT_TYPES + أيقونات مخصصة (EventTypeIcon بـ switch لتجنب إنشاء مكوّنات أثناء العرض)
  * `AppointmentDetailSheet`: تفاصيل + تعديل + أزرار حالة (مجدول/مكتمل/ملغي)
  * `LegalDeadlineCalculator`: حاسبة المواعيد القانونية كاملة:
    - مدخلات: تاريخ الواقعة + عدد أيام العمل
    - خيارات استثناء (Switch): الجمعة، السبت، الأعياد
    - إدارة الأعياد: 8 أعياد مصرية افتراضية + إضافة/حذف
    - خوارزمية: يحسب أيام العمل متخطياً العطلات حسب الخيارات
    - نتيجة: الموعد النهائي + يوم الأسبوع + 4 بطاقات (عمل/تقويم/جمعة/سبت) + تفصيل كامل لكل يوم مع Badge ملوّن
  * استخدم EVENT_TYPES + WEEKDAYS_AR + MONTHS_AR
- عدّلت `src/app/api/documents/[id]/route.ts`: أضفت PUT لدعم التحرير.
- التزمت بقواعد React 19:
  * `react-hooks/set-state-in-effect`: نمط "تخزين القيمة السابقة" بدلاً من useEffect للمزامنة
  * `react-hooks/static-components`: أنشأت `EventTypeIcon` كمكوّن stable بـ switch
  * `react-hooks/use-memo`: استخدمت متغير بسيط `selectedYear` بدلاً من استدعاء دالة في deps
- استخدمت: DOCUMENT_CATEGORIES, TASK_PRIORITY, TASK_STATUS, EVENT_TYPES + formatDate, cn, react-query, useToast, useNavStore.
- ألوان: التزمت بثيم الزمردي/الذهبي (primary, emerald, amber, red, slate, purple, rose, sky فاتح لـ Word/task) - بدون indigo/blue صريح.
- RTL كامل، responsive (mobile/desktop)، animations خفيفة (animate-fade-in).
- ملاحظة للوكلاء اللاحقين: الحاسبة القانونية تستخدم قائمة أعياد افتراضية مصرية 2025 - يمكن توسيعها لاحقاً بقاعدة بيانات أعياد ديناميكية حسب الدولة/السنة.

Stage Summary:
- ✅ documents-section.tsx: 6 بطاقات إحصائية + بحث/فلترة (فئة/نوع/قضية/موكل) + رفع (drag&drop + base64) + 3 أوضاع عرض (شبكة/قائمة/مجلدات) + معاينة + تحميل + Sheet تفاصيل/تعديل + حذف
- ✅ tasks-section.tsx: 3 بطاقات إحصائية + Kanban (3 أعمدة) مع DnD كامل (@dnd-kit) + عرض قائمة + Tabs + بحث/فلترة + إنشاء/تحرير/حذف + أزرار حالة سريعة
- ✅ appointments-section.tsx: 3 بطاقات + تقويم شهري مخصص (نقاط ملوّنة) + 4 تبويبات (يومي/أسبوعي/شهري/قائمة) + قائمة جانبية + حاسبة مواعيد قانونية كاملة (استثناء جمعة/سبت/أعياد + تفصيل)
- ✅ react-query لكل العمليات (useQuery + useMutation + invalidateQueries)
- ✅ useToast للإشعارات + useNavStore للمزامنة
- ✅ shadcn/ui كامل (Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, ScrollArea, Separator, Switch, AlertDialog)
- ✅ TypeScript صارم بدون أخطاء (tsc --noEmit نظيف للملفات الجديدة)
- ✅ ESLint نظيف (لا أخطاء في الملفات الجديدة)
- ✅ RTL عربي + responsive + animations
- ✅ API: أضفت PUT لـ /api/documents/[id]

---
Task ID: 2-c-part2 + 4-a-finance
Agent: full-stack-developer
Task: بناء أقسام المالية والتقارير والحاسبات القانونية

Work Log:
- قرأت worklog.md و agent-ctx/2-c-part1-full-stack-developer.md لفهم ما تم.
- قرأت constants.ts (FEE_TYPES, EXPENSE_CATEGORIES, CASE_TYPES, CASE_STATUS, TASK_PRIORITY, TASK_STATUS, CLIENT_TYPES, CLIENT_STATUS, formatCurrency, formatDate, getCaseTypeLabel, getCaseStatusLabel)، stores.ts (useNavStore), dashboard-section.tsx (نموذج Recharts)، cases-section.tsx، appointments-section.tsx (نموذج الحاسبة القانونية)، prisma schema (Fee, Payment, Expense, Invoice, Memo, Case, Client, CaseSession, CaseProcedure)، APIs (finance, stats, cases, clients).
- بنيت `src/components/sections/finance-section.tsx` (~2030 سطر):
  * `FinanceSection` رئيسي مع 4 بطاقات إحصائية (إجمالي الدخل، المصروفات، صافي الدخل، أتعاب معلقة)
  * رسم بياني للتدفق النقدي الشهري (AreaChart + LineChart) - آخر 12 شهراً
  * 4 تبويبات: الأتعاب / المدفوعات / المصروفات / الفواتير مع عدّادات وبحث لكل تبويب
  * جدول كامل لكل نوع مع إجراءات (عرض/تعديل/حذف)
  * `CreateFinanceDialog`: 4 أنواع (fee/payment/expense/invoice) بأيقونات ملوّنة:
    - Fee: caseId، feeType (FEE_TYPES)، amount، paidAmount، description، dueDate، status (تحديث تلقائي للحالة حسب المبلغ المدفوع)
    - Payment: clientId، caseId، feeId (لتحديث حالة الأتعاب تلقائياً)، amount، paymentMethod (نقدي/تحويل/شيك/بطاقة)، reference، notes
    - Expense: category (EXPENSE_CATEGORIES)، amount، description، caseId، clientId، رفع صورة إيصال (base64 + معاينة)
    - Invoice: clientId، caseId، items ديناميكية (JSON)، taxRate، subtotal/taxAmount/total محسوبة تلقائياً، dueDate، status
  * `FinanceDetailSheet`: Sheet تفاصيل/تعديل لكل نوع (نمط تحرير كامل)
  * `InvoicePrintDialog`: معاينة فاتورة احترافية + زر طباعة/PDF (window.print)
  * حذف مع تأكيد (AlertDialog) + invalidateQueries
  * استخدم FEE_TYPES, EXPENSE_CATEGORIES, formatCurrency, formatDate
- بنيت `src/components/sections/reports-section.tsx` (~1245 سطر):
  * `ReportsSection` رئيسي مع شبكة 5 بطاقات لاختيار نوع التقرير
  * 5 أنواع تقارير:
    - **cases**: total، totalValue، byType، byStatus، byDegree، byCourt + جدول قضايا
    - **finance**: totalIncome/Expenses/netIncome، pendingFees، feesByType، expensesByCategory، monthly cash flow + جدول مدفوعات/مصروفات/أعقاب
    - **clients**: total، byType، byStatus، byCity، topClients (أعلى 10) + جدول موكلين
    - **tasks**: total، completed، overdue، completionRate، byStatus، byPriority + جدول مهام
    - **productivity**: totalSessions، totalProcedures، tasksCompleted، documentsCreated، newCases، monthly، proceduresByType + جدول نشاط
  * نموذج معايير: نطاق زمني (6 presets: اليوم/أسبوع/شهر/ربع/سنة/الكل) + from/to + فلترة (caseType/status/priority/clientType)
  * `ReportOverview`: لوحة بطاقات تكاملية حسب نوع التقرير
  * `ReportCharts`: BarChart, PieChart, AreaChart, LineChart حسب نوع التقرير
  * `ReportTable`: جدول تفصيلي لكل نوع
  * زر تصدير CSV (BOM للعربية) + زر طباعة + زر مسح الفلاتر
  * استخدم كل ثوابت CASE_TYPES, CASE_STATUS, TASK_*, CLIENT_*, FEE_TYPES, EXPENSE_CATEGORIES
- بنيت `src/components/sections/calculators-section.tsx` (~1230 سطر):
  * `CalculatorsSection` رئيسي مع شبكة 6 بطاقات حاسبات (gradient backgrounds احترافية)
  * `CalcIcon`: مكوّن مستقر (switch) لتجنب إنشاء مكونات أثناء العرض
  * 6 حاسبات كاملة:
    1. **حاسبة المواعيد القانونية**: تاريخ + أيام عمل + استثناء (جمعة/سبت/أعياد) + إدارة قائمة أعياد (7 أعياد مصرية) + تفصيل النتيجة
    2. **حاسبة التعويضات**: نوع إصابة (6 أنواع مع معامل) + درجة عجز + أجر + عمر → تعويض أساسي + تعويض عجز
    3. **حاسبة الفوائد القانونية**: مبلغ + نسبة + مدة (شهور/سنوات) + بسيطة/مركبة → فوائد + إجمالي
    4. **حاسبة رسوم القضايا**: قيمة مطالبة + نوع قضية (مدنية/تجارية/إدارية/عمالية/أحوال شخصية) → رسم أساسي + نسبي
    5. **حاسبة النفقة**: دخل + أطفال + زوجة + مسكن → تفصيل وإجمالي
    6. **حاسبة التعويضات العمالية**: أجر يومي + عجز + عمر + نوع إصابة → تعويض مقطوع أو معاش شهري
  * كل حاسبة: نتيجة رئيسية في بطاقة gradient + بطاقات إحصائية فرعية + AlertCard بملاحظة قانونية
  * `SaveResultDialog`: حفظ النتيجة (POST /api/calculators) مع ربط بقضية/موكل (يُحفظ في Memo)
  * استخدم formatCurrency, formatDate
- أنشأت 3 APIs جديدة:
  * `src/app/api/finance/[id]/route.ts`: PUT (تحديث fee/payment/expense/invoice) + DELETE (حذف حسب kind)
  * `src/app/api/reports/route.ts` (~400 سطر): GET بـ 5 أنواع تقارير، يدعم نطاق التاريخ + فلترة (caseType/status/priority/clientType)، يعيد items + summary (إحصائيات + بيانات الرسوم)
  * `src/app/api/calculators/route.ts`: GET (جلب الميمو المحفوظة) + POST (حفظ نتيجة حاسبة كـ Memo)
- أنشأت `src/components/sections/_placeholder.tsx` + 13 stub section للأقسام غير المبنية بعد (memo-editor, pleading, maps, ai-thinker, text-analyzer, performance, development, settings, backup, security, updates, team, research):
  * السبب: app-shell.tsx يستورد كل الأقسام ديناميكياً، وبدون الـ stubs كانت الصفحة لا تُحمّل (HTTP 500)
  * كل stub يعرض بطاقة "قيد التطوير" - سيستبدلها وكلاء لاحقون بالأقسام الفعلية
- التزمت بقواعد React 19:
  * `react-hooks/set-state-in-effect`: نمط "تخزين القيمة السابقة" (prevDefault/lastDefault، storedId/lastLoadedId، storedPreset/rangePreset)
  * `react-hooks/static-components`: أنشأت `CalcIcon` كمكوّن stable بـ switch
- استخدمت: FEE_TYPES, EXPENSE_CATEGORIES, CASE_TYPES, CASE_STATUS, TASK_PRIORITY, TASK_STATUS, CLIENT_TYPES, CLIENT_STATUS, formatCurrency, formatDate, getCaseTypeLabel, getCaseStatusLabel + react-query + useToast + cn + Recharts (BarChart, PieChart, AreaChart, LineChart) + shadcn/ui كامل.
- ألوان: التزمت بثيم الزمردي/الذهبي (primary, emerald, amber, red, purple, teal, rose, orange) - بدون indigo/blue.
- RTL كامل، responsive (mobile/desktop)، animations خفيفة (animate-fade-in).

Stage Summary:
- ✅ finance-section.tsx: 4 بطاقات + رسم تدفق نقدي + 4 تبويبات (أتعاب/مدفوعات/مصروفات/فواتير) + بحث + إنشاء/تحرير/حذف + طباعة فاتورة + إيصال base64 + ربط أتعاب بالمدفوعات
- ✅ reports-section.tsx: 5 أنواع تقارير (قضايا/مالية/موكلين/مهام/إنتاجية) + معايير (نطاق + فلترة) + بطاقات + 2-3 رسوم بيانية لكل نوع + جدول + تصدير CSV + طباعة
- ✅ calculators-section.tsx: 6 حاسبات (مواعيد/تعويضات/فوائد/رسوم/نفقة/عمالية) + حفظ النتيجة + ملاحظات قانونية
- ✅ 3 APIs جديدة: finance/[id] (PUT/DELETE)، reports (GET متعدد)، calculators (GET/POST)
- ✅ react-query لكل العمليات + useToast + invalidateQueries بعد كل تعديل
- ✅ shadcn/ui كامل (Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, Table, ScrollArea, Separator, Switch, AlertDialog)
- ✅ TypeScript صارم بدون أخطاء
- ✅ ESLint نظيف للملفات الجديدة (الخطأ الوحيد في src/app/page.tsx موجود مسبقاً)
- ✅ RTL عربي + responsive + animations
- ✅ compile ناجح + التطبيق يُحمّل (HTTP 200) بعد إضافة stubs
- ✅ 13 stub section للأقسام غير المبنية (سيستبدلها وكلاء لاحقون)


---
Task ID: 3-a + 3-b
Agent: full-stack-developer (AI Sections Builder)
Task: بناء 4 أقسام ذكاء اصطناعي حقيقية

Work Log:
- قرأت worklog.md وملفات الـ APIs الأربعة (chat/analyze/pleading/generate-doc) و constants.ts و stores.ts و dashboard-section.tsx (نموذج الأسلوب) و _placeholder.tsx و globals.css (الثيم).
- بنيت `src/components/sections/ai-thinker-section.tsx` (~980 سطر):
  * واجهة محادثة احترافية بثيم قانوني (gradient ذهبي/زمردي على الرأس)
  * شريط جانبي للمحادثات السابقة (260px) مع بحث + عدّاد رسائل + تاريخ + حذف
  * رسائل متبادلة: المستخدم يمين (primary)، المساعد يسار (muted) مع Avatar
  * مؤشر كتابة (TypingIndicator) - 3 نقاط bounce animation
  * دعم Markdown كامل عبر react-markdown مع مكونات مخصصة لكل عنصر
  * حفظ محلي (localStorage) للمحادثات مع تحميل تلقائي
  * 5 قوالب سريعة (صحيفة دعوى، تحليل قضية، مذكرة دفاع، عقد بيع، استشارة)
  * زر "تحميل سياق قضية" يفتح CaseContextDialog (يستدعي /api/cases) ويبني سياق كامل
  * زر نسخ لكل رد + معالجة أخطاء
  * استدعاء POST /api/ai/chat بـ { messages, context }
  * سيناريو ذكي: يُنشئ رسالة assistant فارغة أولاً لإظهار مؤشر الكتابة، ثم يستبدلها بالرد
- بنيت `src/components/sections/memo-editor-section.tsx` (~1260 سطر):
  * 3 أعمدة: قائمة المذكرات (يسار) + المحرر (وسط) + القوالب (يمين)
  * محرر نصوص غني عبر contentEditable مع execCommand:
    - شريط أدوات كامل: تراجع/إعادة، عريض/مائل/تحته خط، عنوان 1/2/3، اقتباس، قوائم، محاذاة
    - منع فقدان التركيز عند النقر على الأزرار (onMouseDown preventDefault)
    - styling مخصص للعناوين والقوائم والاقتباسات
  * 4 قوالب جاهزة: مذكرة دفاع، صحيفة دعوى، عقد، استشارة - كل قالب HTML كامل
  * زر "توليد بالـ AI" يفتح AiGenerateDialog (10 أنواع مستندات) → POST /api/ai/generate-doc
    - يحوّل Markdown إلى HTML عبر markdownToHtml() ويدخله في المحرر
  * زر "إدراج من المكتبة" يفتح LibraryDialog (3 فئات، 11 نص قانوني)
  * حفظ تلقائي محلي بعد 1.5 ثانية + حفظ يدوي مع flash
  * تصدير PDF عبر window.print() + Word عبر Blob بـ application/msword
  * عدّاد كلمات/أحرف + مؤشر محفوظ/غير محفوظ
- بنيت `src/components/sections/text-analyzer-section.tsx` (~640 سطر):
  * 6 أنواع تحليل كشبكة بطاقات: contract_risk, memo_logic, compare, summary, citations, sentiment
  * وضع compare يعرض حقلين (مستند 1 + مستند 2)
  * زر مثال يملأ نصاً تجريبياً + زر مسح + عدّاد كلمات/أحرف
  * زر تحليل يستدعي POST /api/ai/analyze بـ { text, analysisType, compareWith }
  * عرض النتائج بـ Markdown مع ReactMarkdown مخصص
  * Skeleton loader أثناء التحليل + شاشة فارغة عند عدم وجود نتائج
  * زر نسخ مع check animation
- بنيت `src/components/sections/pleading-section.tsx` (~870 سطر):
  * نموذج إدخال بيانات القضية: وقائع، دفوع الخصم، توجهات القاضي
  * 4 أزرار مهام (شبكة 2x2): pleading_points, quick_responses, judge_simulation, weakness_analysis
    - كل زر له loading state + check mark عند توفر نتيجة
  * عرض النتائج بتبويبات Tabs مع Markdown
  * زر نسخ لكل تبويب نتيجة
  * مؤقت المرافعة (HH:MM:SS) مع تشغيل/إيقاف/إعادة تصفير
  * مكتبة 12 رد سريع جاهز (4 فئات: اعتراضات شكلية، دفوع موضوعية، طلبات إجرائية، ردود على دفوع) + بحث
  * زر تحميل قضية يفتح CaseLoaderDialog ويملأ الحقول تلقائياً من /api/cases
  * استدعاء POST /api/ai/pleading بـ { caseFacts, opponentDefenses, judgeTendencies, requestType }
- التزمت بقواعد React 19:
  * تجنّب setState في effect ما أمكن (بقيت حالات ترطيب localStorage فقط مع eslint-disable-line)
  * منع access ref خلال render (استخدمت active.content بدلاً من editorRef.current في useMemo)
- ألوان: التزمت بالثيم الزمردي/الذهبي (primary, emerald, amber, red, purple, teal, rose) - بدون indigo/blue.
- RTL كامل، responsive (mobile/desktop)، animations خفيفة (animate-fade-in).
- ملاحظة هامة: لم أحذف _placeholder.tsx لأن 9 أقسام أخرى لا تزال تستورده (performance, research, backup, updates, development, maps, settings, team, security) - ليست ضمن نطاق هذه المهمة. سيحذفه وكيل لاحق عند بناء كل الأقسام.

Stage Summary:
- ✅ ai-thinker-section.tsx (~980 سطر): محادثة كاملة + قوالب + سياق قضية + markdown + copy
- ✅ memo-editor-section.tsx (~1260 سطر): محرر غني + 4 قوالب + AI generate + مكتبة قانونية + حفظ تلقائي + تصدير PDF/Word
- ✅ text-analyzer-section.tsx (~640 سطر): 6 أنواع تحليل + مقارنة + skeleton + أمثلة
- ✅ pleading-section.tsx (~870 سطر): 4 مهام + مؤقت + مكتبة 12 رد + تحميل قضية
- ✅ جميع الأقسام تستدعي z-ai-web-dev-sdk الحقيقي عبر الـ APIs الموجودة
- ✅ TypeScript صارم نظيف (tsc --noEmit بدون أخطاء في الملفات الجديدة)
- ✅ ESLint نظيف للملفات الجديدة (الخطأ الوحيد المتبقي في src/app/page.tsx موجود مسبقاً)
- ✅ RTL عربي + responsive + animations + ثيم قانوني
- ✅ الصفحة تُحمّل بنجاح (HTTP 200)
