#!/bin/bash
cd /home/z/my-project/mini-services/telegram-bot
while true; do
  echo "=== Starting bot at $(date) ===" >> /home/z/my-project/telegram-bot.log
  bun index.ts >> /home/z/my-project/telegram-bot.log 2>&1
  EXIT_CODE=$?
  echo "=== Bot exited with code $EXIT_CODE at $(date) ===" >> /home/z/my-project/telegram-bot.log
  echo "=== Restarting in 3 seconds... ===" >> /home/z/my-project/telegram-bot.log
  sleep 3
done
