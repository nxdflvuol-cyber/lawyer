# 📥 دليل التثبيت من GitHub والتحديث

<div dir="rtl">

## 🚀 التثبيت لأول مرة (من GitHub)

### الطريقة 1: باستخدام Bun (موصى به)

```bash
# 1. استنساخ المستودع
git clone https://github.com/nxdflvuol-cyber/lawyer.git
cd lawyer

# 2. تثبيت الحزم
bun install

# 3. نسخ ملف البيئة
cp .env.example .env

# 4. تعديل ملف .env (اختياري - يمكن من داخل النظام)
# افتح ملف .env وأضف مفتاح الـ AI إذا أردت

# 5. إعداد قاعدة البيانات
bun run setup

# 6. (اختياري) إضافة بيانات تجريبية
bun run seed

# 7. تشغيل النظام
bun run dev
```

### الطريقة 2: باستخدام npm

```bash
# 1. استنساخ المستودع
git clone https://github.com/nxdflvuol-cyber/lawyer.git
cd lawyer

# 2. تثبيت الحزم
npm install

# 3. نسخ ملف البيئة
cp .env.example .env

# 4. إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# 5. (اختياري) إضافة بيانات تجريبية
npx prisma db seed

# 6. تشغيل النظام
npm run dev
```

### الطريقة 3: على Windows (PowerShell)

```powershell
# 1. استنساخ المستودع
git clone https://github.com/nxdflvuol-cyber/lawyer.git
cd lawyer

# 2. تثبيت الحزم
bun install

# 3. نسخ ملف البيئة
Copy-Item .env.example .env

# 4. إعداد قاعدة البيانات
bun run setup

# 5. تشغيل النظام
bun run dev
```

---

## ✅ بعد التثبيت

### أول تسجيل دخول:
افتح المتصفح على: `http://localhost:3000`

**بيانات الدخول الافتراضية:**
- رمز PIN: `1234`
- أو البريد: `admin@lawyer.local` + كلمة المرور: `1234`

### إعداد الذكاء الاصطناعي:
1. اذهب إلى **الإعدادات ← الذكاء AI**
2. أدخل:
   - Base URL: `https://api.freemodel.dev/v1`
   - API Key: مفتاحك الخاص
   - Model: `gpt-5.5`
3. احفظ واضغط "اختبار الاتصال"

### إعداد تليجرام (اختياري):
1. اذهب إلى **الإعدادات ← تليجرام**
2. أنشئ بوت من `@BotFather` على تليجرام
3. أدخل Bot Token واحفظ
4. أرسل `/start` للبوت للحصول على معرف الشات
5. أضف المعرف في "المعرفات المصرح لها"

---

## 🔄 تحديث النظام عند توفر نسخة جديدة

### التحديث مع الحفاظ على بياناتك:

```bash
# 1. اذهب لمجلد المشروع
cd lawyer

# 2. احفظ نسخة احتياطية من بياناتك (مهم!)
cp db/custom.db db/backup-$(date +%Y%m%d).db

# 3. اسحب التحديثات من GitHub
git pull origin main

# 4. تثبيت أي حزم جديدة
bun install

# 5. تحديث قاعدة البيانات (إذا كانت هناك تغييرات في الـ schema)
bun run db:push

# 6. أعد تشغيل النظام
bun run dev
```

### التحديث على Windows:

```powershell
# 1. اذهب لمجلد المشروع
cd lawyer

# 2. احفظ نسخة احتياطية
Copy-Item db\custom.db "db\backup-$(Get-Date -Format 'yyyyMMdd').db"

# 3. اسحب التحديثات
git pull origin main

# 4. تثبيت الحزم
bun install

# 5. تحديث قاعدة البيانات
bun run db:push

# 6. إعادة التشغيل
bun run dev
```

---

## ⚠️ تحديثات مهمة (تغييرات جذرية في قاعدة البيانات)

إذا كان التحديث يحتوي على تغييرات كبيرة في قاعدة البيانات:

```bash
# 1. احفظ نسخة احتياطية كاملة من داخل النظام
#    اذهب للنظام ← النسخ الاحتياطي ← إنشاء وتنزيل النسخة

# 2. احفظ نسخة من ملف .env (يحتوي على إعداداتك)
cp .env .env.backup

# 3. اسحب التحديثات
git pull origin main

# 4. تثبيت الحزم
bun install

# 5. تحديث قاعدة البيانات
bun run db:push

# 6. استعادة إعداداتك من ملف .env
cp .env.backup .env

# 7. إعادة تشغيل النظام
bun run dev

# 8. (إذا لزم) استعادة البيانات من النسخة الاحتياطية
#    اذهب للنظام ← النسخ الاحتياطي ← استعادة
```

---

## 🔧 حل المشاكل بعد التحديث

### "حدث خطأ أثناء تسجيل الدخول" بعد التحديث:
```bash
# قاعدة البيانات تحتاج تحديث
bun run db:push
bun run dev
```

### "Module not found" أو أخطاء بعد التحديث:
```bash
# حذف الكاش وإعادة التثبيت
rm -rf node_modules .next/cache
bun install
bun run dev
```

### فقدان البيانات بعد التحديث:
```bash
# استعادة من النسخة الاحتياطية
cp db/backup-YYYYMMDD.db db/custom.db
bun run dev
```

### تعارض في git pull:
```bash
# إذا عدلت ملفات محلياً وتعارضت مع التحديث
git stash                    # احفظ تعديلاتك مؤقتاً
git pull origin main         # اسحب التحديث
git stash pop                # استعد تعديلاتك
bun install
bun run db:push
bun run dev
```

---

## 📋 قائمة التحقق بعد التحديث

- [ ] النظام يفتح بدون أخطاء (`http://localhost:3000`)
- [ ] تسجيل الدخول يعمل
- [ ] البيانات موجودة (قضايا، موكلين)
- [ ] المفكر القانوني يعمل (اختبر بسؤال بسيط)
- [ ] تليجرام يعمل (أرسل رسالة للبوت)
- [ ] الإعدادات محفوظة (AI، تليجرام)

---

## 🔄 التحديث التلقائي (سكربت)

أنشئ ملف `update.sh` (Linux/Mac) أو `update.bat` (Windows):

### Linux/Mac (`update.sh`):
```bash
#!/bin/bash
echo "🔄 تحديث المحامي الشامل..."

# نسخة احتياطية
cp db/custom.db "db/backup-$(date +%Y%m%d-%H%M%S).db" 2>/dev/null
echo "✅ تم حفظ نسخة احتياطية"

# سحب التحديثات
git pull origin main
echo "✅ تم سحب التحديثات"

# تثبيت الحزم
bun install
echo "✅ تم تثبيت الحزم"

# تحديث قاعدة البيانات
bun run db:push
echo "✅ تم تحديث قاعدة البيانات"

echo ""
echo "🎉 التحديث مكتمل! شغل النظام بـ: bun run dev"
```

### Windows (`update.bat`):
```batch
@echo off
echo تحديث المحامي الشامل...

copy db\custom.db "db\backup-%date:~-4%%date:~3,2%%date:~0,2%.db" >nul 2>&1
echo تم حفظ نسخة احتياطية

git pull origin main
echo تم سحب التحديثات

bun install
echo تم تثبيت الحزم

bun run db:push
echo تم تحديث قاعدة البيانات

echo.
echo التحديث مكتمل! شغل النظام بـ: bun run dev
pause
```

### طريقة الاستخدام:
```bash
# Linux/Mac
chmod +x update.sh
./update.sh

# Windows
update.bat
```

---

## 📌 معلومات إضافية

### معرفة النسخة الحالية:
```bash
git log --oneline -1
```

### معرفة التحديثات المتاحة قبل التحديث:
```bash
git fetch origin
git log HEAD..origin/main --oneline
```

### التراجع عن تحديث:
```bash
# معرفة آخر الـ commits
git log --oneline -5

# التراجع لنسخة سابقة
git checkout <commit-hash>
bun install
bun run db:push
bun run dev
```

### تحديث مع حذف كل التعديلات المحلية:
```bash
# ⚠️ تحذير: هذا يحذف أي تعديلات محلية
git fetch origin
git reset --hard origin/main
bun install
bun run db:push
bun run dev
```

---

## 🆘 طلب المساعدة

إذا واجهت مشاكل:
1. تحقق من ملف `dev.log` للأخطاء
2. تأكد من أن `bun run setup` يعمل بدون أخطاء
3. تأكد من وجود ملف `.env` بالمسار الصحيح
4. جرّب حذف الكاش: `rm -rf .next/cache`

---

**المستودع:** https://github.com/nxdflvuol-cyber/lawyer

</div>
