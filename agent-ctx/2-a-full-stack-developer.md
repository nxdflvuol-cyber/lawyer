# Task 2-a: بناء قسمي القضايا والموكلين

**Agent**: full-stack-developer
**Status**: ✅ مكتمل
**Date**: 2025

## ملخص العمل

تم بناء قسمين كاملين في مشروع "المحامي الشامل":

1. **`src/components/sections/cases-section.tsx`** (~3500 سطر) - قسم القضايا
2. **`src/components/sections/clients-section.tsx`** (~3000 سطر) - قسم الموكلين

## الملفات المُنشأة

### 1. cases-section.tsx

#### التصديرات
- `CasesSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `CaseRow` - صف قضية في القائمة
- `CreateCaseDialog` - نافذة إنشاء قضية
- `CaseDetailSheet` - لوحة تفاصيل شاملة (Sheet)
- `OverviewTab` - تبويب النظرة العامة (قابل للتحرير)
- `SessionsTab` + `SessionCard` - تبويب الجلسات
- `ProceduresTab` - تبويب الإجراءات (timeline)
- `DocumentsTab` - تبويب المستندات
- `TasksTab` - تبويب المهام المرتبطة
- `FinanceTab` - تبويب المالية (أتعاب + مصروفات + جداول)
- `TimelineTab` - تبويب التسلسل الزمني الشامل
- `StatusBadge`, `PriorityBadge`, `EmptyState`, `DetailRow` - مكوّنات مساعدة

#### الميزات
- 4 بطاقات إحصائية (إجمالي/نشطة/منتهية/كسب)
- بحث + فلترة ثلاثية (الحالة، النوع، درجة التقاضي)
- 7 تبويبات في تفاصيل القضية
- نموذج إنشاء قضية بـ 17 حقل
- نموذج جلسة بـ 17 حقل (يُنشئ موعد تلقائياً للجلسة القادمة)
- حذف مع تأكيد + تحرير/حفظ
- مزامنة `selectedCaseId` مع `useNavStore`

### 2. clients-section.tsx

#### التصديرات
- `ClientsSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `ClientRow` - صف موكل في القائمة
- `CreateClientDialog` - نافذة إنشاء موكل (3 بطاقات: شخصية/شركة/تواصل)
- `ClientDetailSheet` - لوحة تفاصيل شاملة
- `ClientOverviewTab` - بيانات + تحرير
- `ClientCasesTab` - قضايا الموكل (مع تنقل إلى تفاصيل القضية)
- `ClientDocumentsTab` - مستندات الموكل
- `ClientCommunicationsTab` - سجل تواصل (timeline)
- `ClientPowersTab` - التوكيلات
- `ClientFinanceTab` - الملخص المالي + جدول دفعات
- `StatusBadge`, `ClientTypeBadge`, `EmptyState`, `ContactRow` - مساعدة

#### الميزات
- 3 بطاقات إحصائية (إجمالي/نشطين/محتملين)
- بحث + فلترة ثنائية (الحالة، النوع)
- 6 تبويبات في تفاصيل الموكل
- نموذج إنشاء موكل ديناميكي (يتغير حسب نوع الموكل: فرد/شركة)
- تنقل من الموكل → قضياه → تفاصيل القضية
- حذف مع تأكيد + تحرير/حفظ
- مزامنة `selectedClientId` مع `useNavStore`

## APIs المستخدمة

### موجودة (تعمل بالكامل)
- `GET/POST /api/cases` - قائمة وإنشاء القضايا
- `GET/PUT/DELETE /api/cases/[id]` - تفاصيل/تحديث/حذف قضية
- `POST /api/cases/[id]/sessions` - إضافة جلسة
- `POST /api/cases/[id]/procedures` - إضافة إجراء
- `GET/POST /api/clients` - قائمة وإنشاء الموكلين
- `GET/PUT/DELETE /api/clients/[id]` - تفاصيل/تحديث/حذف موكل
- `POST /api/finance` - إضافة أتعاب/مصروفات/دفعات
- `POST /api/documents` - إضافة مستند
- `POST /api/tasks` - إضافة مهمة

### مطلوب إضافتها (مع fallback آمن)
- `POST /api/clients/[id]/communications` - إضافة سجل تواصل
- `POST /api/clients/[id]/powers` - إضافة توكيل

الكود يستدعيها مع `try/catch` ويظهر toast تنبيه إذا لم تتوفر، مع `invalidateQueries` على أي حال.

## التزامات تقنية

- ✅ TypeScript صارم (تم التحقق بـ `tsc --noEmit` - لا أخطاء في الملفين)
- ✅ ESLint نظيف (لا أخطاء في الملفين)
- ✅ RTL عربي كامل
- ✅ Responsive (mobile/desktop)
- ✅ لا ألوان indigo/blue
- ✅ animations خفيفة (animate-fade-in)
- ✅ React Query (useQuery + useMutation + invalidateQueries)
- ✅ useToast للإشعارات
- ✅ useNavStore للمزامنة
- ✅ shadcn/ui (Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, Table, ScrollArea, Avatar, Separator)
- ✅ الثوابت من constants.ts (CASE_TYPES, CASE_STATUS, CASE_DEGREE, CLIENT_TYPES, CLIENT_STATUS, TASK_PRIORITY, TASK_STATUS, FEE_TYPES, EXPENSE_CATEGORIES, DOCUMENT_CATEGORIES, PROCEDURE_TYPES)
- ✅ الدوال المساعدة (formatDate, formatCurrency, getCaseTypeLabel, getCaseStatusLabel)
- ✅ نمط React 19 الموصى به لتجنب `set-state-in-effect` (استخدام "previous prop" pattern + `key` prop)

## ملاحظات للوكلاء اللاحقين

1. **APIs مفقودة**: يلزم إضافة routes لـ communications و powers (الكود يعمل مع fallback حالياً)
2. **التنقل بين الأقسام**: عند فتح قضية من قسم الموكلين، يتم استخدام `useNavStore.getState().selectCase()` ثم `setSection("cases")` - يعمل بشكل صحيح
3. **إعادة التركيب**: استخدمت `key={caseData.id}` و `key={client.id}` على تبويب النظرة العامة لإعادة تهيئة نموذج التحرير عند تغيّر الكيان
4. **الترميز اللوني للحالات**: استخدمت نفس ألوان constants.ts (emerald/amber/slate/red/green/purple)
