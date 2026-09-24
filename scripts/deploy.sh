#!/usr/bin/env bash
# deploy.sh — pulls the latest BarCart code, rebuilds the static web export,
# and restarts the PM2-managed server. Runs on the Raspberry Pi (bunnypi).
#
# Usage:
#   ./scripts/deploy.sh            (manual; skips the rebuild if nothing changed)
#   ./scripts/deploy.sh --force    (rebuild + restart even if nothing changed)
#   */30 * * * * ~/barcart-app/scripts/deploy.sh   (cron, optional — stays
#                                                   silent when nothing changed)
#   invoked as a shell tool call by PicoClaw after a chat-approved edit
#
# Requires: git, npm, npx (expo), pm2, curl. TELEGRAM_BOT_TOKEN and
# TELEGRAM_CHAT_ID set in a .env file next to this script's parent dir
# (see .env.example) if you want Telegram notifications.

set -uo pipefail

REPO_DIR="$HOME/barcart-app"
APP_NAME="barcart"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Tracks the commit that is actually live, so a commit PicoClaw made and pushed
# from this same checkout (which `git pull` won't see as new) still gets deployed.
DEPLOYED_SHA_FILE="$REPO_DIR/.deployed-sha"

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

source "$SCRIPT_DIR/notify.sh"

cd "$REPO_DIR" || { echo "Repo dir not found: $REPO_DIR"; exit 1; }

if ! git pull origin main; then
  send_telegram "❌ BarCart deploy FAILED on bunnypi during git pull. Check logs on the Pi."
  exit 1
fi

HEAD_SHA="$(git rev-parse HEAD)"
DEPLOYED_SHA="$(cat "$DEPLOYED_SHA_FILE" 2>/dev/null || true)"

if [ "$FORCE" -eq 0 ] && [ "$HEAD_SHA" = "$DEPLOYED_SHA" ] && [ -d dist ]; then
  echo "Already deployed ${HEAD_SHA:0:7} — nothing to do (use --force to rebuild anyway)."
  exit 0
fi

if [ "$HEAD_SHA" = "$DEPLOYED_SHA" ]; then
  LAST_MSG="no new commits — redeployed existing build"
else
  LAST_MSG="$(git log -1 --pretty=%s)"
fi

if ! { npm install && npx expo export --platform web; }; then
  send_telegram "❌ BarCart deploy FAILED on bunnypi during npm install / expo export. Check logs on the Pi."
  exit 1
fi

if pm2 restart "$APP_NAME" 2>/dev/null || pm2 start serve --name "$APP_NAME" -- -s dist -l 3000; then
  pm2 save
  echo "$HEAD_SHA" > "$DEPLOYED_SHA_FILE"
  send_telegram "✅ BarCart deployed on bunnypi — ${LAST_MSG}"
else
  send_telegram "❌ BarCart deploy FAILED on bunnypi — pm2 could not start/restart the app. Check logs on the Pi."
  exit 1
fi
