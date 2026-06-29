// سكربت إضافة بيانات تجريبية شاملة - المحامي الشامل
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seed() {
  console.log("🌱 بدء إضافة البيانات التجريبية...\n");

  // المحاكم والقضاة
  console.log("📍 إضافة المحاكم والقضاة...");
  const courts = await Promise.all([
    db.court.create({ data: { name: "محكمة شمال القاهرة الابتدائية", courtType: "primary", address: "ميدان العباسية، القاهرة", city: "القاهرة", phone: "02-26701234", workingHours: "9:00 ص - 2:00 م" } }),
    db.court.create({ data: { name: "محكمة جنوب القاهرة الابتدائية", courtType: "primary", address: "شارع الجلاء، المعادي", city: "القاهرة", phone: "02-23568790", workingHours: "9:00 ص - 2:00 م" } }),
    db.court.create({ data: { name: "محكمة استئناف القاهرة", courtType: "appeal", address: "ميدان رمسيس، القاهرة", city: "القاهرة", phone: "02-25771234", workingHours: "9:00 ص - 3:00 م" } }),
    db.court.create({ data: { name: "محكمة الجيزة الابتدائية", courtType: "primary", address: "شارع النيل، الجيزة", city: "الجيزة", phone: "02-35721345", workingHours: "9:00 ص - 2:00 م" } }),
    db.court.create({ data: { name: "محكمة الأسرة - حدائق القبة", courtType: "family", address: "حدائق القبة، القاهرة", city: "القاهرة", phone: "02-26854321", workingHours: "9:00 ص - 2:00 م" } }),
    db.court.create({ data: { name: "محكمة نقض القاهرة", courtType: "cassation", address: "الأمريكان، المعادي", city: "القاهرة", phone: "02-23567890", workingHours: "9:00 ص - 3:00 م" } }),
    db.court.create({ data: { name: "محكمة جنوب القاهرة الاقتصادية", courtType: "economic", address: "مدينة نصر، القاهرة", city: "القاهرة", phone: "02-24012345", workingHours: "9:00 ص - 3:00 م" } }),
    db.court.create({ data: { name: "محكمة إمبابة الابتدائية", courtType: "primary", address: "إمبابة، الجيزة", city: "الجيزة", phone: "02-37605432", workingHours: "9:00 ص - 2:00 م" } }),
  ]);
  const judges = await Promise.all([
    db.judge.create({ data: { name: "ال مستشار أحمد فهمي", court: "محكمة شمال القاهرة", circuit: "الدائرة الأولى مدني", tendencies: "يميل إلى الإجراءات الدقيقة، يحب المرافعات المكتوبة" } }),
    db.judge.create({ data: { name: "ال مستشارة سعاد عبد الله", court: "محكمة جنوب القاهرة", circuit: "الدائرة الثالثة مدني", tendencies: "صارمة في المواعيد، تفضل التسوية" } }),
    db.judge.create({ data: { name: "ال مستشار محمد رفعت", court: "محكمة استئناف القاهرة", circuit: "الدائرة الاستئنافية الثانية", tendencies: "يركز على الأدلة، يحب التحليل القانوني العميق" } }),
    db.judge.create({ data: { name: "ال مستشارة فاطمة الزهراء", court: "محكمة الأسرة", circuit: "دائرة الأحوال الشخصية", tendencies: "تميل للمصالحة، تهتم بمصلحة الأطفال" } }),
    db.judge.create({ data: { name: "ال مستشار خالد سمير", court: "محكمة الجيزة", circuit: "الدائرة التجارية", tendencies: "يحب المرافعات السريعة، يكره التأجيلات" } }),
    db.judge.create({ data: { name: "ال مستشار نبيل عبد العزيز", court: "محكمة نقض القاهرة", circuit: "الدائرة المدنية", tendencies: "دقيق في الطعون، يحب البحث القانوني" } }),
  ]);
  console.log(`   ✓ ${courts.length} محكمة، ${judges.length} قاضي\n`);

  // الموكلون
  console.log("👥 إضافة الموكلين...");
  const clients = await Promise.all([
    db.client.create({ data: { fullName: "أحمد محمد عبدالله السيد", clientType: "individual", idNumber: "29101012345678", phone: "01012345678", phone2: "0223456789", email: "ahmed.sayed@email.com", address: "15 شارع الجمهورية، عابدين", city: "القاهرة", country: "مصر", nationality: "مصري", status: "active", gender: "ذكر", birthDate: new Date("1985-03-15"), notes: "موكل دائم منذ 2020" } }),
    db.client.create({ data: { fullName: "شركة النيل للتجارة والمقاولات", clientType: "company", idNumber: "123456789", taxNumber: "987-654-321", phone: "0226789012", email: "info@nileco.com", address: "برج النيل، الطابق 5، مدينة نصر", city: "القاهرة", country: "مصر", legalForm: "شركة مساهمة مصرية", companyType: "company", status: "active", notes: "شركة كبيرة - قضايا متعددة" } }),
    db.client.create({ data: { fullName: "سيدة فاطمة حسن إبراهيم", clientType: "individual", idNumber: "27401054321678", phone: "01122334455", email: "fatma.h@email.com", address: "8 شارع المشتل، الزيتون", city: "القاهرة", country: "مصر", nationality: "مصرية", status: "active", gender: "أنثى", birthDate: new Date("1990-07-22"), notes: "قضية أحوال شخصية" } }),
    db.client.create({ data: { fullName: "محمود علي حسن الشناوي", clientType: "individual", idNumber: "28502067891234", phone: "01233445566", address: "45 شارع الجلاء، الدقي", city: "الجيزة", country: "مصر", nationality: "مصري", status: "active", gender: "ذكر", birthDate: new Date("1982-11-30"), notes: "قضيايا عمالية" } }),
    db.client.create({ data: { fullName: "شركة الأهرام للمستلزمات الطبية", clientType: "company", idNumber: "987654321", taxNumber: "456-789-123", phone: "0234567890", email: "contact@ahram-med.com", address: "المنطقة الصناعية، 6 أكتوبر", city: "الجيزة", country: "مصر", legalForm: "شركة ذات مسؤولية محدودة", companyType: "company", status: "active" } }),
    db.client.create({ data: { fullName: "خالد إبراهيم عبد العال", clientType: "individual", idNumber: "26803098765432", phone: "01099887766", email: "khaled.ibrahim@email.com", address: "22 شارع النصر، حلوان", city: "القاهرة", country: "مصر", nationality: "مصري", status: "active", gender: "ذكر", birthDate: new Date("1978-05-10") } }),
    db.client.create({ data: { fullName: "نورا أحمد فؤاد", clientType: "individual", idNumber: "29204056789012", phone: "01555667788", email: "noura.ahmed@email.com", address: "10 شارع البساتين، المعادي", city: "القاهرة", country: "مصر", nationality: "مصرية", status: "potential", gender: "أنثى", birthDate: new Date("1995-02-18"), notes: "استشارة فقط" } }),
    db.client.create({ data: { fullName: "عبد الرحمن سعد الدين", clientType: "individual", idNumber: "27905034567890", phone: "01066554433", address: "33 شارع هرم، هرم", city: "الجيزة", country: "مصر", nationality: "مصري", status: "former", gender: "ذكر", birthDate: new Date("1975-09-25"), notes: "قضية منتهية - كسبناها" } }),
    db.client.create({ data: { fullName: "شركة الصفا للإسكندرية للنقل", clientType: "company", idNumber: "456789123", taxNumber: "789-123-456", phone: "0345678901", email: "safatransport@alex.com", address: "المنطقة الصناعية، برج العرب", city: "الإسكندرية", country: "مصر", legalForm: "شركة مساهمة", companyType: "company", status: "active" } }),
    db.client.create({ data: { fullName: "هالة مصطفى كامل", clientType: "individual", idNumber: "28306067890123", phone: "01277889900", email: "hala.mostafa@email.com", address: "5 شارع الميرغني، مصر الجديدة", city: "القاهرة", country: "مصر", nationality: "مصرية", status: "active", gender: "أنثى", birthDate: new Date("1988-12-03") } }),
  ]);
  console.log(`   ✓ ${clients.length} موكل\n`);

  // توكيلات
  console.log("📝 إضافة التوكيلات...");
  await Promise.all([
    db.powerOfAttorney.create({ data: { clientId: clients[0].id, poaNumber: "2024/12345", issuer: "شهر عقاري عابدين", poaType: "توكيل خاص", scope: "قضية مدنية رقم 2024/123", issueDate: new Date("2024-01-15"), expiryDate: new Date("2026-01-15"), status: "active" } }),
    db.powerOfAttorney.create({ data: { clientId: clients[1].id, poaNumber: "2024/67890", issuer: "شهر عقاري مدينة نصر", poaType: "توكيل عام", scope: "جميع القضايا والمعاملات", issueDate: new Date("2023-06-10"), expiryDate: new Date("2026-06-10"), status: "active" } }),
    db.powerOfAttorney.create({ data: { clientId: clients[2].id, poaNumber: "2024/34567", issuer: "شهر عقاري الزيتون", poaType: "توكيل خاص", scope: "قضية أحوال شخصية - طلاق", issueDate: new Date("2024-03-01"), expiryDate: new Date("2026-03-01"), status: "active" } }),
    db.powerOfAttorney.create({ data: { clientId: clients[3].id, poaNumber: "2023/89101", issuer: "شهر عقاري الدقي", poaType: "توكيل خاص", scope: "قضايا عمالية", issueDate: new Date("2023-09-20"), expiryDate: new Date("2025-09-20"), status: "active" } }),
    db.powerOfAttorney.create({ data: { clientId: clients[5].id, poaNumber: "2022/55667", issuer: "شهر عقاري حلوان", poaType: "توكيل خاص", scope: "نزاع عقاري", issueDate: new Date("2022-11-05"), expiryDate: new Date("2025-11-05"), status: "expired" } }),
  ]);
  console.log("   ✓ 5 توكيلات\n");

  // تواصل
  console.log("📞 إضافة سجلات التواصل...");
  await Promise.all([
    db.communication.create({ data: { clientId: clients[0].id, type: "call", subject: "متابعة قضية", summary: "اتصل الموكل للاستفسار عن موعد الجلسة القادمة", priority: "normal", followUpDate: new Date(Date.now() + 86400000) } }),
    db.communication.create({ data: { clientId: clients[1].id, type: "meeting", subject: "اجتماع استراتيجي", summary: "اجتماع لمناقشة استراتيجية الدفاع في القضية التجارية", priority: "high", followUpDate: new Date(Date.now() + 3 * 86400000) } }),
    db.communication.create({ data: { clientId: clients[2].id, type: "call", subject: "تأكيد حضور الجلسة", summary: "تأكيد حضور الموكلة لجلسة الأحوال الشخصية", priority: "urgent" } }),
    db.communication.create({ data: { clientId: clients[4].id, type: "email", subject: "إرسال مستندات", summary: "الموكل أرسل عقود العمل المطلوبة عبر البريد", priority: "normal" } }),
    db.communication.create({ data: { clientId: clients[7].id, type: "visit", subject: "زيارة مكتب", summary: "الموكل زار المكتب لتسليم المستندات الأصلية", priority: "normal" } }),
  ]);
  console.log("   ✓ 5 سجلات تواصل\n");

  // القضايا
  console.log("⚖️ إضافة القضايا...");
  const cases = await Promise.all([
    db.case.create({ data: { internalNumber: "2024/001", officialNumber: "4521/2024 مدني شمال", year: 2024, caseType: "civil", caseSubType: "مدني كلي", court: "محكمة شمال القاهرة الابتدائية", circuit: "الدائرة الأولى مدني كلي", degree: "primary", judgeName: "ال مستشار أحمد فهمي", clientId: clients[0].id, opponentName: "شركة الإسكان للمستثمرين", opponentLawyer: "أ. سمير عبد الوهاب", status: "active", startDate: new Date("2024-02-15"), facts: "الموكل اشترى عقاراً من الشركة المدعى عليها بمبلغ 2.5 مليون جنيه، وتم سداد المبلغ كاملاً، لكن الشركة رفضت تسليم العقار بحجة تأخر في الإجراءات الإدارية. الموكل يطالب إما بتسليم العقار أو التعويض عن الضرر.", strategy: "التركيز على إثبات سداد المبلغ كاملاً مع إيصالات الدفع، والمطالبة بالتنفيذ العيني للعقد أو التعويض عن كامل الضرر.", estimatedValue: 2500000, priority: "high", notes: "قضية مهمة - موكل دائم" } }),
    db.case.create({ data: { internalNumber: "2024/002", officialNumber: "1876/2024 تجاري جنوب", year: 2024, caseType: "commercial", caseSubType: "منازعات تجارية عامة", court: "محكمة جنوب القاهرة الابتدائية", circuit: "الدائرة التجارية الثالثة", degree: "primary", judgeName: "ال مستشار خالد سمير", clientId: clients[1].id, opponentName: "شركة المتوسط للاستيراد", opponentLawyer: "أ. منى رشاد", status: "active", startDate: new Date("2024-03-10"), facts: "نزاع تجاري بين شركتي النيل والمتوسط حول صفقة استيراد بضائع بقيمة 5 مليون جنيه. الشركة المدعى عليها لم تسلم البضائع في الموعد المتفق عليه مما تسبب في خسائر للشركة الموكلة.", strategy: "إثبات العقد التجاري والمواعيد المتفق عليها، المطالبة بالتعويض عن الخسائر المباشرة وغير المباشرة.", estimatedValue: 5000000, priority: "urgent" } }),
    db.case.create({ data: { internalNumber: "2024/003", officialNumber: "2398/2024 أحوال شخصية أسرة", year: 2024, caseType: "personal_status", caseSubType: "طلاق", court: "محكمة الأسرة - حدائق القبة", circuit: "دائرة الأحوال الشخصية", degree: "primary", judgeName: "ال مستشارة فاطمة الزهراء", clientId: clients[2].id, opponentName: "الزوج - محمد عادل إبراهيم", opponentLawyer: "أ. هاني فؤاد", status: "active", startDate: new Date("2024-04-01"), facts: "تطلب الموكلة الطلاق للشقاق والضرر. زواج استمر 7 سنوات وأنجبا طفلين. الضرر يتمثل في الإهمال المستمر والسب والقذف. الموكلة تطلب حضانة الأطفال ونفقة.", strategy: "إثبات الضرر بالشهود والرسائل، المطالبة بالحضانة للأم كونها الأحق، نفقة الأطفال والأم، ومطالبة مالية.", priority: "high" } }),
    db.case.create({ data: { internalNumber: "2024/004", officialNumber: "5421/2024 عمالي الجيزة", year: 2024, caseType: "civil", caseSubType: "مدني عمالي", court: "محكمة الجيزة الابتدائية", circuit: "الدائرة العمالية", degree: "primary", judgeName: "ال مستشار خالد سمير", clientId: clients[3].id, opponentName: "شركة المصريين للصناعات", opponentLawyer: "أ. عادل شعبان", status: "active", startDate: new Date("2024-01-20"), facts: "الموكل عمل بالشركة المدعى عليها لمدة 12 سنة، تم فصله تعسفياً دون مبرر قانوني ودون إخطار مسبق. يطالب بالتعويض عن الفصل التعسفي ومستحقاته المالية.", strategy: "إثبات عدم وجود مبرر قانوني للفصل، المطالبة بالتعويض وفقاً لقانون العمل، ومستحقات نهاية الخدمة.", estimatedValue: 350000, priority: "medium" } }),
    db.case.create({ data: { internalNumber: "2023/089", officialNumber: "8765/2023 إداري مجلس الدولة", year: 2023, caseType: "administrative", caseSubType: "إلغاء قرارات", court: "مجلس الدولة - محكمة القضاء الإداري", circuit: "الدائرة الأولى إداري", degree: "primary", judgeName: "ال مستشار نبيل عبد العزيز", clientId: clients[4].id, opponentName: "وزارة الصحة - هيئة الدواء", status: "pending", startDate: new Date("2023-08-15"), facts: "طعن على قرار هيئة الدواء برفض ترخيص استيراد مستلزمات طبية للشركة الموكلة دون مبرر قانوني سليم.", strategy: "إثبات توافر الشروط القانونية للترخيص، إثبات عيب المشروعية في القرار، المطالبة بإلغاء القرار والتعويض.", estimatedValue: 1500000, priority: "medium" } }),
    db.case.create({ data: { internalNumber: "2024/005", officialNumber: "1023/2024 جنح عابدين", year: 2024, caseType: "criminal", caseSubType: "جنح", court: "محكمة عابدين الجزئية", circuit: "دائرة الجنح", degree: "primary", judgeName: "ال مستشار أحمد فهمي", clientId: clients[5].id, opponentName: "النيابة العامة", status: "active", startDate: new Date("2024-05-01"), facts: "الموكل متهم في جنحة شيك بدون رصيد بقيمة 200,000 جنيه. الشيك كان ضماناً لصفقة لم تكتمل.", strategy: "إثبات أن الشيك كان ضماناً وليس ديناً، إثبات عدم وجود نية جنائية، المطالبة بالبراءة.", estimatedValue: 200000, priority: "urgent" } }),
    db.case.create({ data: { internalNumber: "2023/045", officialNumber: "3456/2023 استئناف مدني", year: 2023, caseType: "civil", caseSubType: "مدني كلي", court: "محكمة استئناف القاهرة", circuit: "الدائرة الاستئنافية الثانية", degree: "appeal", judgeName: "ال مستشار محمد رفعت", clientId: clients[6].id, opponentName: "ورثة حسن عبد الله", opponentLawyer: "أ. كريمان السيد", status: "closed", result: "won", endDate: new Date("2024-02-28"), startDate: new Date("2023-05-10"), facts: "نزاع على ميراث عقاري. استئناف على حكم ابتدائي لمصلحة الخصم. حكم الاستئناف لمصلحة الموكل.", strategy: "إثبات حق الموكل في الميراث بالوثائق الشرعية، الطعن على الحكم الابتدائي.", estimatedValue: 1800000, priority: "high" } }),
    db.case.create({ data: { internalNumber: "2024/006", officialNumber: "6789/2024 تجاري اقتصادي", year: 2024, caseType: "commercial", caseSubType: "منازعات بنكية", court: "محكمة جنوب القاهرة الاقتصادية", circuit: "الدائرة الاقتصادية", degree: "primary", judgeName: "ال مستشار خالد سمير", clientId: clients[7].id, opponentName: "بنك القاهرة", opponentLawyer: "أ. عماد زكي", status: "active", startDate: new Date("2024-06-01"), facts: "نزاع حول قرض رهن عقاري. البنك يطالب بمبلغ 3 مليون جنيه بفوائد مرتفعة. الموكل يطعن على الفوائد ويرفض المبلغ المطالب به.", strategy: "الطعن على الفوائد الربوية، إثبات عدم الاتفاق على هذه الفوائد، المطالبة بإعادة جدولة القرض.", estimatedValue: 3000000, priority: "high" } }),
  ]);
  console.log(`   ✓ ${cases.length} قضية\n`);

  // جلسات
  console.log("📅 إضافة الجلسات...");
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const lastWeek = new Date(now.getTime() - 7 * 86400000);
  const lastMonth = new Date(now.getTime() - 30 * 86400000);
  await Promise.all([
    db.caseSession.create({ data: { caseId: cases[0].id, sessionDate: lastMonth, purpose: "جلسة أولى - تقديم صحيفة الدعوى", court: "محكمة شمال القاهرة", judgeName: "ال مستشار أحمد فهمي", facts: "تم تقديم الصحيفة وتبادل اللوائح الأولية", decisions: "تأجيل لتبادل المستندات", nextSessionDate: lastWeek } }),
    db.caseSession.create({ data: { caseId: cases[0].id, sessionDate: lastWeek, purpose: "جلسة تبادل مستندات", court: "محكمة شمال القاهرة", judgeName: "ال مستشار أحمد فهمي", facts: "تم تقديم إيصالات الدفع وعقد البيع", decisions: "تأجيل للمرافعة", nextSessionDate: nextWeek } }),
    db.caseSession.create({ data: { caseId: cases[0].id, sessionDate: nextWeek, purpose: "جلسة مرافعة", court: "محكمة شمال القاهرة", judgeName: "ال مستشار أحمد فهمي" } }),
    db.caseSession.create({ data: { caseId: cases[1].id, sessionDate: lastMonth, purpose: "جلسة تقديم الدعوى", court: "محكمة جنوب القاهرة", facts: "تبادل اللوائح الأولية", decisions: "تأجيل لتبادل المستندات", nextSessionDate: tomorrow } }),
    db.caseSession.create({ data: { caseId: cases[1].id, sessionDate: tomorrow, purpose: "جلسة مستندات", court: "محكمة جنوب القاهرة" } }),
    db.caseSession.create({ data: { caseId: cases[2].id, sessionDate: lastWeek, purpose: "جلسة تصالح", court: "محكمة الأسرة", judgeName: "ال مستشارة فاطمة الزهراء", facts: "محاولة صلح فشلت", decisions: "تأجيل للمرافعة", nextSessionDate: nextWeek } }),
    db.caseSession.create({ data: { caseId: cases[2].id, sessionDate: nextWeek, purpose: "جلسة مرافعة - شهود", court: "محكمة الأسرة", judgeName: "ال مستشارة فاطمة الزهراء" } }),
    db.caseSession.create({ data: { caseId: cases[3].id, sessionDate: lastWeek, purpose: "جلسة مرافعة", court: "محكمة الجيزة", facts: "تقديم شهادات العمل", decisions: "تأجيل لخبير حسابي", nextSessionDate: new Date(now.getTime() + 14 * 86400000) } }),
    db.caseSession.create({ data: { caseId: cases[4].id, sessionDate: lastMonth, purpose: "جلسة مذكرة", court: "مجلس الدولة", decisions: "تأجيل للحكم", nextSessionDate: new Date(now.getTime() + 21 * 86400000) } }),
    db.caseSession.create({ data: { caseId: cases[5].id, sessionDate: tomorrow, purpose: "جلسة مرافعة جنائية", court: "محكمة عابدين" } }),
    db.caseSession.create({ data: { caseId: cases[7].id, sessionDate: nextWeek, purpose: "جلسة أولى", court: "محكمة اقتصادية" } }),
  ]);
  console.log("   ✓ 11 جلسة\n");

  // إجراءات
  console.log("📋 إضافة الإجراءات...");
  await Promise.all([
    db.caseProcedure.create({ data: { caseId: cases[0].id, date: new Date("2024-02-15"), type: "filing", description: "رفع الدعوى وتسجيلها", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[0].id, date: new Date("2024-02-20"), type: "notification", description: "إعلان الخصم بصحيفة الدعوى", performedBy: "محضر المحكمة", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[0].id, date: new Date("2024-03-01"), type: "hearing", description: "جلسة أولى - تبادل لوائح", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[1].id, date: new Date("2024-03-10"), type: "filing", description: "رفع الدعوى التجارية", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[2].id, date: new Date("2024-04-01"), type: "filing", description: "رفع دعوى الطلاق للشقاق", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[3].id, date: new Date("2024-01-20"), type: "filing", description: "رفع الدعوى العمالية", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[4].id, date: new Date("2023-08-15"), type: "filing", description: "تقديم الطعن الإداري", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[5].id, date: new Date("2024-05-01"), type: "filing", description: "تقديم المذكرة الجنائية", performedBy: "المحامي", status: "completed" } }),
    db.caseProcedure.create({ data: { caseId: cases[6].id, date: new Date("2024-02-28"), type: "ruling", description: "صدور حكم الاستئناف لمصلحة الموكل", performedBy: "المحكمة", result: "كسب القضية", status: "completed" } }),
  ]);
  console.log("   ✓ 9 إجراءات\n");

  // أدلة
  console.log("🔍 إضافة الأدلة...");
  await Promise.all([
    db.evidence.create({ data: { caseId: cases[0].id, title: "عقد البيع", description: "عقد البيع الموثق بين الموكل والشركة", evidenceType: "documentary", submittedDate: new Date("2024-02-15"), status: "submitted" } }),
    db.evidence.create({ data: { caseId: cases[0].id, title: "إيصالات الدفع", description: "إيصالات سداد كامل المبلغ (2.5 مليون)", evidenceType: "documentary", submittedDate: new Date("2024-02-15"), status: "submitted" } }),
    db.evidence.create({ data: { caseId: cases[2].id, title: "شهادة ميلاد الأطفال", description: "إثبات نسب الأطفال للموكلة", evidenceType: "documentary", status: "collected" } }),
    db.evidence.create({ data: { caseId: cases[3].id, title: "شهادات الراتب", description: "كشوف راتب الموكل لآخر 3 سنوات", evidenceType: "documentary", submittedDate: new Date("2024-02-01"), status: "submitted" } }),
  ]);
  console.log("   ✓ 4 أدلة\n");

  // مستندات
  console.log("📄 إضافة المستندات...");
  const sampleText = "هذا نص تجريبي للمستند. يحتوي على محتوى قانوني متنوع يمكن البحث عنه.";
  await Promise.all([
    db.document.create({ data: { title: "عقد بيع عقار - قضية 2024/001", description: "عقد البيع الموثق للعقار محل النزاع", docType: "pdf", category: "contract", fileName: "contract_2024_001.pdf", fileSize: 245678, mimeType: "application/pdf", textContent: sampleText, tags: "عقد,بيع,عقار", caseId: cases[0].id, clientId: clients[0].id } }),
    db.document.create({ data: { title: "صحيفة دعوى مدنية", description: "صحيفة الدعوى الأصلية", docType: "word", category: "pleading", fileName: "lawsuit_2024_001.docx", fileSize: 87234, textContent: sampleText, tags: "صحيفة,دعوى,مدني", caseId: cases[0].id, clientId: clients[0].id } }),
    db.document.create({ data: { title: "مذكرة دفاع أولى", description: "المذكرة الأولى للدفاع عن الموكل", docType: "word", category: "pleading", fileName: "defense_memo_1.docx", fileSize: 124567, textContent: sampleText, tags: "مذكرة,دفاع", caseId: cases[0].id, clientId: clients[0].id } }),
    db.document.create({ data: { title: "عقد تجاري - صفقة استيراد", description: "العقد التجاري بين شركتي النيل والمتوسط", docType: "pdf", category: "contract", fileName: "commercial_contract.pdf", fileSize: 356789, textContent: sampleText, tags: "عقد,تجاري,استيراد", caseId: cases[1].id, clientId: clients[1].id } }),
    db.document.create({ data: { title: "صحيفة دعوى تجارية", description: "صحيفة الدعوى التجارية", docType: "word", category: "pleading", fileName: "commercial_lawsuit.docx", fileSize: 98765, textContent: sampleText, caseId: cases[1].id, clientId: clients[1].id } }),
    db.document.create({ data: { title: "صحيفة دعوى طلاق للشقاق", description: "صحيفة الدعوى أمام محكمة الأسرة", docType: "word", category: "pleading", fileName: "divorce_lawsuit.docx", fileSize: 76543, textContent: sampleText, tags: "طلاق,أحوال شخصية", caseId: cases[2].id, clientId: clients[2].id } }),
    db.document.create({ data: { title: "شهادة ميلاد الطفل الأول", description: "شهادة ميلاد الطفل الأول للموكلة", docType: "image", category: "evidence", fileName: "birth_cert_1.jpg", fileSize: 456789, mimeType: "image/jpeg", tags: "شهادة ميلاد", caseId: cases[2].id, clientId: clients[2].id } }),
    db.document.create({ data: { title: "كشف راتب آخر 3 سنوات", description: "كشوف راتب الموكل من الشركة", docType: "pdf", category: "evidence", fileName: "salary_slips.pdf", fileSize: 178234, textContent: sampleText, tags: "كشف راتب,عمالي", caseId: cases[3].id, clientId: clients[3].id } }),
    db.document.create({ data: { title: "عقد عمل", description: "عقد العمل بين الموكل والشركة", docType: "pdf", category: "contract", fileName: "employment_contract.pdf", fileSize: 134567, textContent: sampleText, tags: "عقد عمل", caseId: cases[3].id, clientId: clients[3].id } }),
    db.document.create({ data: { title: "الطعن الإداري", description: "مذكرة الطعن على قرار هيئة الدواء", docType: "word", category: "pleading", fileName: "administrative_appeal.docx", fileSize: 156789, textContent: sampleText, caseId: cases[4].id, clientId: clients[4].id } }),
    db.document.create({ data: { title: "حكم استئناف - قضية ميراث", description: "حكم محكمة الاستئناف لمصلحة الموكل", docType: "pdf", category: "ruling", fileName: "appeal_verdict.pdf", fileSize: 234567, textContent: sampleText, tags: "حكم,استئناف,ميراث", caseId: cases[6].id, clientId: clients[6].id } }),
    db.document.create({ data: { title: "بطاقة هوية الموكل - أحمد", description: "صورة بطاقة الرقم القومي", docType: "image", category: "other", fileName: "id_card.jpg", fileSize: 567890, mimeType: "image/jpeg", tags: "هوية", clientId: clients[0].id } }),
    db.document.create({ data: { title: "السجل التجاري - شركة النيل", description: "صورة السجل التجاري للشركة", docType: "pdf", category: "other", fileName: "commercial_register.pdf", fileSize: 123456, textContent: sampleText, tags: "سجل تجاري", clientId: clients[1].id } }),
    db.document.create({ data: { title: "مذكرة دفاع عمالية", description: "مذكرة الدفاع في القضيا العمالية", docType: "word", category: "pleading", fileName: "labor_defense.docx", fileSize: 89012, textContent: sampleText, caseId: cases[3].id } }),
    db.document.create({ data: { title: "عقد قرض رهن عقاري", description: "عقد القرض من بنك القاهرة", docType: "pdf", category: "contract", fileName: "mortgage_contract.pdf", fileSize: 345678, textContent: sampleText, caseId: cases[7].id, clientId: clients[7].id } }),
  ]);
  console.log("   ✓ 15 مستند\n");

  // مهام
  console.log("✅ إضافة المهام...");
  await Promise.all([
    db.task.create({ data: { title: "إعداد مذكرة الدفاع الثانية", description: "تحضير مذكرة الدفاع الثانية لقضية 2024/001 - بيع عقار", status: "in_progress", priority: "high", dueDate: nextWeek, caseId: cases[0].id, clientId: clients[0].id } }),
    db.task.create({ data: { title: "متابعة إيصالات الدفع", description: "جمع إيصالات إضافية من الموكل", status: "todo", priority: "medium", dueDate: tomorrow, caseId: cases[0].id, clientId: clients[0].id } }),
    db.task.create({ data: { title: "تحضير شهود الإثبات", description: "تحضير قائمة الشهود لقضية الأحوال الشخصية", status: "todo", priority: "high", dueDate: new Date(now.getTime() + 5 * 86400000), caseId: cases[2].id, clientId: clients[2].id } }),
    db.task.create({ data: { title: "مذكرة رد على الخصم", description: "إعداد مذكرة رد على مذكرة خصم قضية 2024/002", status: "todo", priority: "urgent", dueDate: new Date(now.getTime() + 3 * 86400000), caseId: cases[1].id, clientId: clients[1].id } }),
    db.task.create({ data: { title: "استلام تقرير الخبير الحسابي", description: "متابعة تقرير الخبير في القضية العمالية", status: "todo", priority: "medium", dueDate: new Date(now.getTime() + 14 * 86400000), caseId: cases[3].id, clientId: clients[3].id } }),
    db.task.create({ data: { title: "تسجيل حكم الاستئناف", description: "تسجيل حكم الاستئناف لمصلحة الموكل في قضية الميراث", status: "completed", priority: "high", caseId: cases[6].id, clientId: clients[6].id } }),
    db.task.create({ data: { title: "اجتماع مع الموكل - شركة النيل", description: "اجتماع لمناقشة استراتيجية القضية التجارية", status: "todo", priority: "high", dueDate: new Date(now.getTime() + 2 * 86400000), caseId: cases[1].id, clientId: clients[1].id } }),
    db.task.create({ data: { title: "تحضير المرافعة الجنائية", description: "إعداد مرافعة دفاع في قضية الشيك", status: "in_progress", priority: "urgent", dueDate: tomorrow, caseId: cases[5].id, clientId: clients[5].id } }),
    db.task.create({ data: { title: "مراجعة عقد القرض", description: "مراجعة شروط عقد القرض مع البنك", status: "todo", priority: "high", dueDate: new Date(now.getTime() + 4 * 86400000), caseId: cases[7].id, clientId: clients[7].id } }),
    db.task.create({ data: { title: "إعداد تقرير مالي شهري", description: "تقرير عن الأتعاب والمستحقات", status: "todo", priority: "low", dueDate: new Date(now.getTime() + 7 * 86400000) } }),
    db.task.create({ data: { title: "متابعة تنفيذ حكم", description: "متابعة تنفيذ حكم قضية الميراث", status: "in_progress", priority: "medium", dueDate: new Date(now.getTime() + 30 * 86400000), caseId: cases[6].id } }),
    db.task.create({ data: { title: "تحصيل أتعاب متأخرة", description: "متابعة تحصيل أتعاب من موكلين متأخرين", status: "todo", priority: "high", dueDate: new Date(now.getTime() - 2 * 86400000) } }),
  ]);
  console.log("   ✓ 12 مهمة\n");

  // مواعيد
  console.log("📅 إضافة المواعيد...");
  await Promise.all([
    db.appointment.create({ data: { title: "جلسة مرافعة - قضية 2024/001", startDate: nextWeek, endDate: new Date(nextWeek.getTime() + 3600000), eventType: "court_session", location: "محكمة شمال القاهرة - الدائرة الأولى", court: "محكمة شمال القاهرة", caseId: cases[0].id, clientId: clients[0].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "جلسة مستندات - قضية تجارية", startDate: tomorrow, endDate: new Date(tomorrow.getTime() + 3600000), eventType: "court_session", location: "محكمة جنوب القاهرة", court: "محكمة جنوب القاهرة", caseId: cases[1].id, clientId: clients[1].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "جلسة مرافعة - قضية طلاق", startDate: nextWeek, endDate: new Date(nextWeek.getTime() + 3600000), eventType: "court_session", location: "محكمة الأسرة - حدائق القبة", court: "محكمة الأسرة", caseId: cases[2].id, clientId: clients[2].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "جلسة مرافعة جنائية", startDate: tomorrow, endDate: new Date(tomorrow.getTime() + 3600000), eventType: "court_session", location: "محكمة عابدين الجزئية", court: "محكمة عابدين", caseId: cases[5].id, clientId: clients[5].id, reminder: 120 } }),
    db.appointment.create({ data: { title: "اجتماع مع شركة النيل", startDate: new Date(now.getTime() + 2 * 86400000), endDate: new Date(now.getTime() + 2 * 86400000 + 3600000), eventType: "client_meeting", location: "مكتب المحاماة", caseId: cases[1].id, clientId: clients[1].id, reminder: 60 } }),
    db.appointment.create({ data: { title: "موعد نهائي تقديم مذكرة", startDate: new Date(now.getTime() + 3 * 86400000), eventType: "deadline", caseId: cases[1].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "استشارة قانونية - موكل جديد", startDate: new Date(now.getTime() + 5 * 86400000), endDate: new Date(now.getTime() + 5 * 86400000 + 1800000), eventType: "consultation", location: "المكتب", clientId: clients[6].id, reminder: 60 } }),
    db.appointment.create({ data: { title: "جلسة أولى - قضية بنكية", startDate: nextWeek, endDate: new Date(nextWeek.getTime() + 3600000), eventType: "court_session", location: "محكمة اقتصادية", caseId: cases[7].id, clientId: clients[7].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "تذكير - تحضير الشهود", startDate: new Date(now.getTime() + 4 * 86400000), eventType: "task", caseId: cases[2].id, reminder: 1440 } }),
    db.appointment.create({ data: { title: "جلسة طعن إداري", startDate: new Date(now.getTime() + 21 * 86400000), eventType: "court_session", location: "مجلس الدولة", caseId: cases[4].id, clientId: clients[4].id, reminder: 1440 } }),
  ]);
  console.log("   ✓ 10 مواعيد\n");

  // المالية
  console.log("💰 إضافة البيانات المالية...");
  await Promise.all([
    db.fee.create({ data: { caseId: cases[0].id, feeType: "staged", amount: 100000, paidAmount: 50000, description: "أتعاب قضية بيع عقار - على 3 مراحل", dueDate: new Date(now.getTime() + 30 * 86400000), status: "partial" } }),
    db.fee.create({ data: { caseId: cases[1].id, feeType: "percentage", amount: 250000, paidAmount: 250000, description: "أتعاب قضية تجارية - 5% من قيمة القضية", status: "paid" } }),
    db.fee.create({ data: { caseId: cases[2].id, feeType: "fixed", amount: 30000, paidAmount: 15000, description: "أتعاب قضية أحوال شخصية", dueDate: new Date(now.getTime() + 14 * 86400000), status: "partial" } }),
    db.fee.create({ data: { caseId: cases[3].id, feeType: "percentage", amount: 35000, paidAmount: 0, description: "أتعاب قضية عمالية - 10% من التعويض", dueDate: new Date(now.getTime() - 7 * 86400000), status: "unpaid" } }),
    db.fee.create({ data: { caseId: cases[4].id, feeType: "fixed", amount: 75000, paidAmount: 75000, description: "أتعاب طعن إداري", status: "paid" } }),
    db.fee.create({ data: { caseId: cases[5].id, feeType: "fixed", amount: 20000, paidAmount: 10000, description: "أتعاب قضية جنائية", dueDate: new Date(now.getTime() - 3 * 86400000), status: "partial" } }),
    db.fee.create({ data: { caseId: cases[6].id, feeType: "percentage", amount: 180000, paidAmount: 180000, description: "أتعاب قضية ميراث - 10%", status: "paid" } }),
    db.fee.create({ data: { caseId: cases[7].id, feeType: "staged", amount: 150000, paidAmount: 50000, description: "أتعاب قضية بنكية - على مراحل", dueDate: new Date(now.getTime() + 45 * 86400000), status: "partial" } }),
  ]);
  await Promise.all([
    db.payment.create({ data: { clientId: clients[0].id, caseId: cases[0].id, amount: 50000, paymentDate: new Date("2024-02-20"), paymentMethod: "transfer", reference: "TR-2024-001", notes: "الدفعة الأولى" } }),
    db.payment.create({ data: { clientId: clients[1].id, caseId: cases[1].id, amount: 250000, paymentDate: new Date("2024-03-15"), paymentMethod: "check", reference: "CH-2024-002", notes: "دفعة كاملة" } }),
    db.payment.create({ data: { clientId: clients[2].id, caseId: cases[2].id, amount: 15000, paymentDate: new Date("2024-04-05"), paymentMethod: "cash", reference: "CASH-001" } }),
    db.payment.create({ data: { clientId: clients[4].id, caseId: cases[4].id, amount: 75000, paymentDate: new Date("2023-09-01"), paymentMethod: "transfer", reference: "TR-2023-005" } }),
    db.payment.create({ data: { clientId: clients[5].id, caseId: cases[5].id, amount: 10000, paymentDate: new Date("2024-05-10"), paymentMethod: "cash" } }),
    db.payment.create({ data: { clientId: clients[6].id, caseId: cases[6].id, amount: 180000, paymentDate: new Date("2024-03-01"), paymentMethod: "transfer", reference: "TR-2024-006", notes: "دفعة كاملة بعد كسب القضية" } }),
    db.payment.create({ data: { clientId: clients[7].id, caseId: cases[7].id, amount: 50000, paymentDate: new Date("2024-06-10"), paymentMethod: "check", reference: "CH-2024-008" } }),
  ]);
  await Promise.all([
    db.expense.create({ data: { caseId: cases[0].id, category: "court_fees", amount: 2500, expenseDate: new Date("2024-02-15"), description: "رسوم رفع الدعوى" } }),
    db.expense.create({ data: { caseId: cases[0].id, category: "travel", amount: 500, expenseDate: new Date("2024-03-01"), description: "تنقلات للمحكمة" } }),
    db.expense.create({ data: { caseId: cases[1].id, category: "court_fees", amount: 5000, expenseDate: new Date("2024-03-10"), description: "رسوم الدعوى التجارية" } }),
    db.expense.create({ data: { caseId: cases[1].id, category: "experts", amount: 15000, expenseDate: new Date("2024-04-01"), description: "أتعاب خبير اقتصادي" } }),
    db.expense.create({ data: { caseId: cases[2].id, category: "court_fees", amount: 1000, expenseDate: new Date("2024-04-01"), description: "رسوم محكمة الأسرة" } }),
    db.expense.create({ data: { caseId: cases[3].id, category: "documents", amount: 800, expenseDate: new Date("2024-01-25"), description: "تصوير مستندات" } }),
    db.expense.create({ data: { caseId: cases[4].id, category: "court_fees", amount: 3000, expenseDate: new Date("2023-08-15"), description: "رسوم الطعن الإداري" } }),
    db.expense.create({ data: { caseId: cases[5].id, category: "travel", amount: 300, expenseDate: new Date("2024-05-01"), description: "تنقلات لمحكمة عابدين" } }),
    db.expense.create({ data: { category: "other", amount: 2000, expenseDate: new Date("2024-05-15"), description: "مستلزمات مكتبية" } }),
    db.expense.create({ data: { category: "documents", amount: 1500, expenseDate: new Date("2024-06-01"), description: "طباعة ومستلزمات" } }),
  ]);
  await Promise.all([
    db.invoice.create({ data: { invoiceNumber: "INV-2024-0001", clientId: clients[0].id, caseId: cases[0].id, issueDate: new Date("2024-02-20"), dueDate: new Date("2024-03-20"), items: JSON.stringify([{ description: "أتعاب قضية بيع عقار - المرحلة الأولى", amount: 50000 }]), subtotal: 50000, taxRate: 14, taxAmount: 7000, total: 57000, paidAmount: 50000, status: "partial" } }),
    db.invoice.create({ data: { invoiceNumber: "INV-2024-0002", clientId: clients[1].id, caseId: cases[1].id, issueDate: new Date("2024-03-15"), dueDate: new Date("2024-04-15"), items: JSON.stringify([{ description: "أتعاب قضية تجارية", amount: 250000 }]), subtotal: 250000, taxRate: 14, taxAmount: 35000, total: 285000, paidAmount: 285000, status: "paid" } }),
    db.invoice.create({ data: { invoiceNumber: "INV-2024-0003", clientId: clients[2].id, caseId: cases[2].id, issueDate: new Date("2024-04-05"), dueDate: new Date("2024-05-05"), items: JSON.stringify([{ description: "أتعاب قضية أحوال شخصية", amount: 15000 }]), subtotal: 15000, taxRate: 14, taxAmount: 2100, total: 17100, paidAmount: 17100, status: "paid" } }),
    db.invoice.create({ data: { invoiceNumber: "INV-2024-0004", clientId: clients[7].id, caseId: cases[7].id, issueDate: new Date("2024-06-10"), dueDate: new Date("2024-07-10"), items: JSON.stringify([{ description: "أتعاب قضية بنكية - الدفعة الأولى", amount: 50000 }]), subtotal: 50000, taxRate: 14, taxAmount: 7000, total: 57000, paidAmount: 50000, status: "partial" } }),
  ]);
  console.log("   ✓ 8 أتعاب، 7 مدفوعات، 10 مصروفات، 4 فواتير\n");

  // أعضاء المكتب
  console.log("👥 إضافة أعضاء المكتب...");
  await Promise.all([
    db.teamMember.create({ data: { name: "أ. منى رشاد", position: "محامية مشاركة", email: "mona@lawfirm.com", phone: "01011223344", role: "lawyer", hireDate: new Date("2022-09-01"), salary: 15000, isActive: true } }),
    db.teamMember.create({ data: { name: "أ. هاني فؤاد", position: "محامي", email: "hani@lawfirm.com", phone: "01055667788", role: "lawyer", hireDate: new Date("2023-03-15"), salary: 12000, isActive: true } }),
    db.teamMember.create({ data: { name: "سارة محمد", position: "سكرتيرة قانونية", email: "sara@lawfirm.com", phone: "01077889900", role: "assistant", hireDate: new Date("2023-06-01"), salary: 7000, isActive: true } }),
    db.teamMember.create({ data: { name: "محمود علي", position: "محامي متدرب", email: "mahmoud@lawfirm.com", phone: "01088990011", role: "intern", hireDate: new Date("2024-01-01"), salary: 3000, isActive: true } }),
    db.teamMember.create({ data: { name: "أحمد إبراهيم", position: "محاسب", email: "ahmed.ib@lawfirm.com", phone: "01099001122", role: "member", hireDate: new Date("2022-01-15"), salary: 9000, isActive: true } }),
  ]);
  console.log("   ✓ 5 أعضاء\n");

  // المكتبة القانونية
  console.log("📚 إضافة المكتبة القانونية...");
  await Promise.all([
    db.legalLibrary.create({ data: { title: "القانون المدني المصري - القانون رقم 131 لسنة 1948", itemType: "law", category: "مدني", content: "القانون المدني المصري هو التشريع الأساسي الذي ينظم العلاقات المدنية بين الأفراد. يتكون من 1110 مادة قانونية موزعة على بابين.", reference: "القانون رقم 131 لسنة 1948", source: "مجلة التشريع المصرية", tags: "مدني,التزامات,حقوق عينية" } }),
    db.legalLibrary.create({ data: { title: "قانون التجارة - القانون رقم 17 لسنة 1999", itemType: "law", category: "تجاري", content: "قانون التجارة المصري ينظم الأنشطة التجارية والشركات التجارية والعقود التجارية والإفلاس والتصفية.", reference: "القانون رقم 17 لسنة 1999", tags: "تجاري,شركات,إفلاس" } }),
    db.legalLibrary.create({ data: { title: "قانون العمل - القانون رقم 12 لسنة 2003", itemType: "law", category: "عمالي", content: "ينظم قانون العمل العلاقة بين العامل وصاحب العمل. يتناول عقد العمل، الأجور، ساعات العمل، الإجازات، الفصل التعسفي.", reference: "القانون رقم 12 لسنة 2003", tags: "عمل,عقد عمل,فصل تعسفي" } }),
    db.legalLibrary.create({ data: { title: "قانون الأحوال الشخصية", itemType: "law", category: "أحوال شخصية", content: "ينظم قضايا الأسرة من زواج وطلاق ونفقة وحضانة وميراث. مستمد من الشريعة الإسلامية.", tags: "أحوال شخصية,طلاق,حضانة,نفقة,ميراث" } }),
    db.legalLibrary.create({ data: { title: "قانون الإثبات - القانون رقم 25 لسنة 1968", itemType: "law", category: "إثبات", content: "ينظم طرق الإثبات في المواد المدنية والتجارية. يتناول الكتابة، الشهادة، القرائن، الإقرار، اليمين، المعاينة.", reference: "القانون رقم 25 لسنة 1968", tags: "إثبات,شهادة,يمين" } }),
    db.legalLibrary.create({ data: { title: "المرافعات المدنية والتجارية - القانون رقم 13 لسنة 1968", itemType: "law", category: "مرافعات", content: "ينظم إجراءات التقاضي أمام المحاكم المدنية والتجارية.", reference: "القانون رقم 13 لسنة 1968", tags: "مرافعات,إجراءات,طعن" } }),
    db.legalLibrary.create({ data: { title: "حكم نقض - الشيك بدون رصيد", itemType: "precedent", category: "جنائي", content: "الطعن رقم 1234 لسنة 2023 - محكمة النقض. حكمت المحكمة ببراءة الطاعن لثبوت أن الشيك كان ضماناً وليس ديناً.", reference: "الطعن 1234/2023", source: "مجموعة الأحكام النقضية", tags: "شيك,بدون رصيد,براءة" } }),
    db.legalLibrary.create({ data: { title: "حكم - الفصل التعسفي", itemType: "precedent", category: "عمالي", content: "استئناف رقم 5678 لسنة 2023 - محكمة استئناف القاهرة. قضت المحكمة بتعويض العامل عن الفصل التعسفي بمبلغ يعادل راتب 6 أشهر.", reference: "استئناف 5678/2023", tags: "فصل تعسفي,تعويض,عمالي" } }),
    db.legalLibrary.create({ data: { title: "قالب مذكرة دفاع مدني", itemType: "template", category: "مدني", content: "مذكرة دفاع في دعوى مدنية. الهيكل: المقدمة، الوقائع، الدفوع، الطلبات.", tags: "مذكرة,دفاع,مدني" } }),
    db.legalLibrary.create({ data: { title: "قالب صحيفة دعوى طلاق", itemType: "template", category: "أحوال شخصية", content: "صحيفة دعوى طلاق للشقاق والضرر.", tags: "طلاق,صحيفة,أحوال شخصية" } }),
    db.legalLibrary.create({ data: { title: "قالب عقد بيع عقار", itemType: "template", category: "عقود", content: "عقد بيع عقار محرر بين البائع والمشتري.", tags: "عقد,بيع,عقار" } }),
    db.legalLibrary.create({ data: { title: "مبادئ القانون الإداري", itemType: "jurisprudence", category: "إداري", content: "مبادئ القانون الإداري تشمل: المشروعية، الطعن على القرارات الإدارية، التعويض عن القرارات غير المشروعة.", tags: "إداري,مشروعية,قرارات" } }),
  ]);
  console.log("   ✓ 12 عنصر في المكتبة\n");

  // مستخدمون إضافيون
  console.log("👤 إضافة مستخدمين إضافيين...");
  await Promise.all([
    db.user.create({ data: { name: "أ. منى رشاد", email: "mona@lawfirm.com", passwordHash: hashPassword("1234"), role: "lawyer", pin: "1111", isActive: true } }),
    db.user.create({ data: { name: "سارة محمد", email: "sara@lawfirm.com", passwordHash: hashPassword("1234"), role: "assistant", pin: "2222", isActive: true } }),
    db.user.create({ data: { name: "محمود علي", email: "mahmoud@lawfirm.com", passwordHash: hashPassword("1234"), role: "intern", pin: "3333", isActive: true } }),
  ]);
  console.log("   ✓ 3 مستخدمين إضافيين\n");

  // مذكرات
  console.log("📝 إضافة المذكرات...");
  await Promise.all([
    db.memo.create({ data: { title: "مذكرة دفاع - قضية بيع عقار", memoType: "memo", caseId: cases[0].id, clientId: clients[0].id, content: "<h1>مذكرة دفاع</h1><p>الوقائع...</p><h2>الطلبات</h2><p>...</p>", status: "final" } }),
    db.memo.create({ data: { title: "صحيفة دعوى تجارية", memoType: "pleading", caseId: cases[1].id, clientId: clients[1].id, content: "<h1>صحيفة دعوى</h1><p>...</p>", status: "final" } }),
    db.memo.create({ data: { title: "مذكرة دفاع عمالي", memoType: "memo", caseId: cases[3].id, clientId: clients[3].id, content: "<h1>مذكرة دفاع</h1><p>...</p>", status: "draft" } }),
    db.memo.create({ data: { title: "عقد بيع - نموذج", memoType: "contract", content: "<h1>عقد بيع</h1><p>...</p>", status: "final" } }),
    db.memo.create({ data: { title: "استشارة قانونية - طلاق", memoType: "consultation", clientId: clients[2].id, caseId: cases[2].id, content: "<h1>استشارة قانونية</h1><p>...</p>", status: "final" } }),
  ]);
  console.log("   ✓ 5 مذكرات\n");

  // ملخص
  const summary = await Promise.all([
    db.client.count(), db.case.count(), db.caseSession.count(), db.caseProcedure.count(),
    db.document.count(), db.task.count(), db.appointment.count(), db.fee.count(),
    db.payment.count(), db.expense.count(), db.invoice.count(), db.court.count(),
    db.judge.count(), db.teamMember.count(), db.legalLibrary.count(), db.powerOfAttorney.count(),
    db.communication.count(), db.evidence.count(), db.memo.count(), db.user.count(),
  ]);

  console.log("🎉 تم إضافة البيانات التجريبية بنجاح!\n");
  console.log("📊 ملخص البيانات:");
  console.log(`   👥 الموكلون: ${summary[0]}`);
  console.log(`   ⚖️ القضايا: ${summary[1]}`);
  console.log(`   📅 الجلسات: ${summary[2]}`);
  console.log(`   📋 الإجراءات: ${summary[3]}`);
  console.log(`   📄 المستندات: ${summary[4]}`);
  console.log(`   ✅ المهام: ${summary[5]}`);
  console.log(`   📆 المواعيد: ${summary[6]}`);
  console.log(`   💰 الأتعاب: ${summary[7]}`);
  console.log(`   💵 المدفوعات: ${summary[8]}`);
  console.log(`   💸 المصروفات: ${summary[9]}`);
  console.log(`   🧾 الفواتير: ${summary[10]}`);
  console.log(`   🏛️ المحاكم: ${summary[11]}`);
  console.log(`   ⚖️ القضاة: ${summary[12]}`);
  console.log(`   👤 أعضاء المكتب: ${summary[13]}`);
  console.log(`   📚 المكتبة القانونية: ${summary[14]}`);
  console.log(`   📝 التوكيلات: ${summary[15]}`);
  console.log(`   📞 سجلات التواصل: ${summary[16]}`);
  console.log(`   🔍 الأدلة: ${summary[17]}`);
  console.log(`   📝 المذكرات: ${summary[18]}`);
  console.log(`   🔐 المستخدمون: ${summary[19]}`);

  await db.$disconnect();
}

seed().catch((e) => {
  console.error("خطأ:", e);
  process.exit(1);
});
