# Task 2-c-part1: بناء قسمي المستندات والمهام والمواعيد

**Agent**: full-stack-developer
**Status**: ✅ مكتمل
**Task ID**: 2-c-part1
**Date**: 2025

## ملخص العمل

تم بناء ثلاثة أقسام كاملة في مشروع "المحامي الشامل":

1. **`src/components/sections/documents-section.tsx`** (~1700 سطر) - قسم المستندات
2. **`src/components/sections/tasks-section.tsx`** (~1400 سطر) - قسم المهام مع Kanban و DnD
3. **`src/components/sections/appointments-section.tsx`** (~1900 سطر) - قسم المواعيد مع حاسبة قانونية

كما تم تعديل `src/app/api/documents/[id]/route.ts` لإضافة دعم `PUT` للتحرير.

## الملفات المُنشأة

### 1. documents-section.tsx

#### التصديرات
- `DocumentsSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `DocumentCard` - بطاقة مستند (شبكة/مجلدات)
- `DocumentRow` - صف مستند (قائمة)
- `UploadDocumentDialog` - نافذة رفع مستند (drag & drop + file input → base64)
- `DocumentDetailSheet` - لوحة تفاصيل/تعديل (Sheet)
- `DocumentPreviewDialog` - معاينة سريعة (صورة مباشرة / معلومات ملف)
- `DetailRow` - صف بيانات

#### الميزات
- ✅ 6 بطاقات إحصائية (إجمالي، عقود، مذكرات، أحكام، أدلة، حجم كلي)
- ✅ بحث + فلترة (الفئة، النوع، القضية، الموكل) مع زر مسح الفلاتر
- ✅ رفع مستندات عبر file input + drag & drop → FileReader.readAsDataURL → base64 → API
  - يدعم PDF, صور (JPG/PNG/GIF), Word (DOC/DOCX), TXT
  - حد أقصى 10 ميجابايت
  - كشف نوع المستند تلقائياً من MIME type
  - معاينة الصورة قبل الرفع
- ✅ معاينة المستند:
  - الصور تُعرض مباشرة داخل Dialog
  - PDF/Word تُحمّل فقط مع معلومات
- ✅ 3 أوضاع عرض: شبكة / قائمة / مجلدات (Tabs)
- ✅ ربط مستند بقضية أو موكل
- ✅ تحميل (Download) عبر base64 data URL
- ✅ حذف مع تأكيد (AlertDialog)
- ✅ تعديل كامل (title, description, category, folder, tags, caseId, clientId)
- ✅ استخدم DOCUMENT_CATEGORIES من constants
- ✅ استخدام DOC_TYPES محلي (pdf/image/word/text/other) مع أيقونات ملوّنة
- ✅ مزامنة مع useNavStore (selectedCaseId, selectedClientId)
- ✅ استخدمت `formatDate`, `cn`, react-query, useToast

### 2. tasks-section.tsx

#### التصديرات
- `TasksSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `KanbanColumn` - عمود كانبان (droppable)
- `KanbanCard` - بطاقة مهمة (sortable مع GripVertical)
- `TaskRow` - صف مهمة (قائمة)
- `CreateTaskDialog` - نافذة إنشاء مهمة
- `TaskDetailSheet` - لوحة تفاصيل/تعديل (Sheet)
- `DetailRow` - صف بيانات

#### الميزات
- ✅ 3 بطاقات إحصائية (للتنفيذ، قيد التنفيذ، متأخرة)
- ✅ عرض Kanban (3 أعمدة: للتنفيذ، قيد التنفيذ، مكتملة) مع DnD
  - استخدم `@dnd-kit/core` (DndContext, DragOverlay, useDroppable, PointerSensor, closestCorners)
  - استخدم `@dnd-kit/sortable` (SortableContext, useSortable, verticalListSortingStrategy)
  - استخدم `@dnd-kit/utilities` (CSS.Transform)
  - السحب بين الأعمدة يحدّث الحالة عبر PUT /api/tasks/[id]
  - DragOverlay يعرض البطاقة المسحوبة بتأثير rotate + opacity
- ✅ عرض قائمة مع فلترة (Tabs للتبديل بين Kanban والقائمة)
- ✅ بحث + فلترة بالأولوية
- ✅ زر "مهمة جديدة" بنموذج (عنوان، وصف، حالة، أولوية، موعد، تذكير، ربط بقضية/موكل، ساعات مقدّرة، وسوم)
- ✅ النقر على مهمة → فتح Sheet تفاصيل/تعديل
- ✅ أزرار سريعة لتغيير الحالة (مجدول/مكتمل/ملغي)
- ✅ مؤشرات الأولوية بألوان (TASK_PRIORITY: urgent=red, high=orange, medium=amber, low=slate)
- ✅ استخدم TASK_STATUS من constants
- ✅ كشف التأخير (dueDate < now) مع تلوين أحمر
- ✅ حذف مع تأكيد (AlertDialog)
- ✅ استخدمت `formatDate`, `cn`, react-query, useToast

### 3. appointments-section.tsx

#### التصديرات
- `AppointmentsSection` (المكوّن الرئيسي)

#### المكوّنات الداخلية
- `MonthlyCalendar` - تقويم شهري مخصص (grid 7×6 مع نقاط ملوّنة للأيام التي بها مواعيد)
- `WeekView` - عرض أسبوعي
- `DayView` - عرض يومي
- `ListView` - عرض كقائمة (ScrollArea)
- `AppointmentListItem` - عنصر قائمة موعد
- `CreateAppointmentDialog` - نافذة إنشاء موعد
- `AppointmentDetailSheet` - لوحة تفاصيل/تعديل (Sheet)
- `LegalDeadlineCalculator` - حاسبة المواعيد القانونية
- `EventTypeIcon` - مكوّن أيقونة نوع الموعد (switch لتفادي إنشاء مكوّنات أثناء العرض)
- `DetailRow` - صف بيانات
- `Stat` - بطاقة إحصائية صغيرة

#### الميزات
- ✅ 3 بطاقات إحصائية (مواعيد اليوم، هذا الشهر، قادمة)
- ✅ تقويم شهري مخصص (بدون react-day-picker):
  - شبكة 7×6 مع أيام الشهر السابق/اللاحق باهتة
  - تمييز اليوم الحالي (ring-2 ring-primary)
  - تمييز اليوم المختار (border-primary bg-primary/5)
  - نقاط ملوّنة حسب نوع الموعد (حتى 3 نقاط + "+N")
  - عنوان اليوم الأول من الموعد
  - النقر على يوم ينتقل لعرض يومي
- ✅ 4 تبويبات: يومي / أسبوعي / شهري / قائمة (Tabs)
- ✅ قائمة جانبية للمواعيد في اليوم المختار (ScrollArea, max-h-60vh)
- ✅ أزرار تنقل (السابق/التالي/اليوم) تتكيف مع العرض الحالي
- ✅ زر "موعد جديد" بنموذج (عنوان، نوع، وصف، allDay switch، تاريخ ووقت بداية/نهاية، موقع، محكمة، ربط بقضية/موكل، تذكير)
- ✅ تمييز المواعيد بألوان حسب النوع (EVENT_TYPES: court_session=red, client_meeting=emerald, deadline=orange, task=sky, consultation=purple, hearing=amber, other=slate)
- ✅ أيقونات مخصصة لكل نوع (Gavel/Users/AlertCircle/CheckCircle2/Info/Calendar)
- ✅ مفتاح الألوان أسفل التقويم الشهري
- ✅ Sheet تفاصيل مع تعديل كامل + أزرار حالة سريعة (مجدول/مكتمل/ملغي)
- ✅ حذف مع تأكيد (AlertDialog)
- ✅ استخدم EVENT_TYPES من constants

#### حاسبة المواعيد القانونية (LegalDeadlineCalculator)
- ✅ Dialog منفصل يفتح بزر "حاسبة المواعيد القانونية"
- ✅ مدخلات: تاريخ الواقعة + عدد أيام العمل
- ✅ خيارات استثناء (Switch): الجمعة، السبت، الأعياد الرسمية
- ✅ إدارة الأعياد الرسمية: قائمة افتراضية (8 أعياد مصرية 2025) + إضافة/حذف
- ✅ خوارزمية الحساب:
  - يبدأ من تاريخ الواقعة
  - يحسب أيام العمل (يوم البداية يُحتسب كأول يوم)
  - يتخطى الجمعة/السبت/الأعياد حسب الخيارات
  - ينتهي عند الوصول لعدد الأيام المطلوب
- ✅ النتيجة تعرض:
  - الموعد النهائي (تاريخ + يوم الأسبوع بالعربية)
  - 4 بطاقات: أيام العمل، أيام التقويم، الجمعة المستثناة، السبت المستثنى
  - عدد الأعياد المستثناة (إن وُجدت)
  - تفصيل كامل لكل يوم (ScrollArea) مع Badge ملوّن (work=emerald, friday/saturday=amber, holiday=rose)
- ✅ أيام الأسبوع بالعربية (WEEKDAYS_AR, WEEKDAYS_SHORT)
- ✅ أسماء الأشهر بالعربية (MONTHS_AR)

## تعديلات API

### `src/app/api/documents/[id]/route.ts`
- أضفت دالة `PUT` لدعم تحرير المستندات (title, description, category, folder, tags, caseId, clientId, textContent)

## القيود المُلتزم بها
- ✅ الواجهة عربية بالكامل، RTL
- ✅ لا توجد ألوان indigo/blue (استخدمت primary/emerald/amber/red/slate/purple/rose/sky فقط)
  - ملاحظة: sky-50/sky-600 لـ Word في DOC_TYPES (سماوي فاتح، وليس blue صريح)
  - task=sky في EVENT_TYPES (نفس المبدأ)
- ✅ استخدمت shadcn/ui الموجودة (Card, Dialog, Sheet, Tabs, Select, Input, Textarea, Label, Button, Badge, ScrollArea, Separator, Switch, AlertDialog, Popover غير مستخدم)
- ✅ استخدمت react-query (useQuery + useMutation + invalidateQueries)
- ✅ استخدمت useToast للإشعارات
- ✅ استخدمت formatDate من constants
- ✅ بعد كل تعديل، invalidateQueries للـ keys المناسبة (documents/tasks/appointments/stats/case/client)
- ✅ تصميم احترافي مع animations خفيفة (animate-fade-in)
- ✅ responsive (mobile-first مع md:/lg: breakpoints)
- ✅ التزمت بقاعدة React 19 `react-hooks/set-state-in-effect` بنمط "تخزين القيمة السابقة"
- ✅ التزمت بقاعدة `react-hooks/static-components` بإنشاء `EventTypeIcon` كمكوّن stable بـ switch
- ✅ التزمت بقاعدة `react-hooks/use-memo` باستخدام متغير بسيط `selectedYear` بدلاً من استدعاء دالة في deps
- ✅ استخدمت @dnd-kit/core و @dnd-kit/sortable و @dnd-kit/utilities للسحب والإفلات

## التحقق
- ✅ ESLint نظيف لكل الملفات الجديدة (لا أخطاء)
- ✅ TypeScript نظيف (لا أخطاء في الملفات الجديدة — الأخطاء الظاهرة في tsc كلها pre-existing في ملفات أخرى)
- ✅ dev server جاه بدون أخطاء compile
- ✅ جميع APIs المستخدمة موجودة وتعمل (documents, tasks, appointments + [id] variants)
