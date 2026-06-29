#!/bin/bash
# ============================================================
# سكربت تشغيل المحامي الشامل - يشغل جميع الخدمات مع إعادة تشغيل تلقائي
# ============================================================

cd /home/z/my-project

echo "🚀 بدء تشغيل المحامي الشامل..."

# ============================================================
# 1. بوت تليجرام (مع إعادة تشغيل تلقائي)
# ============================================================
echo "📱 تشغيل بوت تليجرام..."
pkill -f "bun.*telegram-bot/index" 2>/dev/null
sleep 1

start_telegram_bot() {
  cd /home/z/my-project/mini-services/telegram-bot
  while true; do
    bun index.ts >> /home/z/my-project/telegram-bot.log 2>&1
    echo "⚠️ البوت توقف، إعادة التشغيل خلال 3 ثوانٍ..." >> /home/z/my-project/telegram-bot.log
    sleep 3
  done
}
export -f start_telegram_bot
nohup setsid bash -c 'start_telegram_bot' > /dev/null 2>&1 &

# ============================================================
# 2. خادم Next.js (مع إعادة تشغيل تلقائي)
# ============================================================
echo "🌐 تشغيل خادم Next.js..."
pkill -f "next dev" 2>/dev/null
sleep 2

start_next_server() {
  cd /home/z/my-project
  export NODE_OPTIONS="--max-old-space-size=3072"
  while true; do
    ./node_modules/.bin/next dev -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1
    echo "⚠️ الخادم توقف، إعادة التشغيل خلال 5 ثوانٍ..." >> /home/z/my-project/dev.log
    sleep 5
  done
}
export -f start_next_server
nohup setsid bash -c 'start_next_server' > /dev/null 2>&1 &

echo ""
echo "✅ تم تشغيل جميع الخدمات!"
echo "   📱 بوت تليجرام: المنفذ 3004"
echo "   🌐 خادم Next.js: المنفذ 3000"
echo ""
echo "📋 للتحقق من الحالة:"
echo "   curl http://localhost:3004/health"
echo "   curl http://localhost:3000/"
