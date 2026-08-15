#!/usr/bin/env bash
# deploy.sh — pulls the latest BarCart code, rebuilds the static web export,
# and restarts the PM2-managed server. Runs on the Raspberry Pi (bunnypi).
#
# Usage:
#   ./scripts/deploy.sh            (manual)
#   */30 * * * * ~/barcart-app/scripts/deploy.sh   (cron, optional)
#   invoked as a shell tool call by PicoClaw after a chat-approved edit
#
# Requires: git, npm, npx (expo), pm2, curl. TELEGRAM_BOT_TOKEN and
# TELEGRAM_CHAT_ID set in a .env file next to this script's parent dir
# (see .env.example) if you want Telegram notifications.

set -uo pipefail

REPO_DIR="$HOME/barcart-app"
APP_NAME="barcart"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/notify.sh"

cd "$REPO_DIR" || { echo "Repo dir not found: $REPO_DIR"; exit 1; }

BEFORE_SHA="$(git rev-parse HEAD)"

if git pull origin main && npm install && npx expo export --platform web; then
  AFTER_SHA="$(git rev-parse HEAD)"
  if [ "$BEFORE_SHA" = "$AFTER_SHA" ]; then
    LAST_MSG="no new commits — redeployed existing build"
  else
    LAST_MSG="$(git log -1 --pretty=%s)"
  fi

  if pm2 restart "$APP_NAME" 2>/dev/null || pm2 start serve --name "$APP_NAME" -- -s dist -l 3000; then
    pm2 save
    send_telegram "✅ BarCart deployed on bunnypi — ${LAST_MSG}"
  else
    send_telegram "❌ BarCart deploy FAILED on bunnypi — pm2 could not start/restart the app. Check logs on the Pi."
    exit 1
  fi
else
  send_telegram "❌ BarCart deploy FAILED on bunnypi during git pull / npm install / expo export. Check logs on the Pi."
  exit 1
fi
