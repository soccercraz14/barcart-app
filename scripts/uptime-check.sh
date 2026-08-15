#!/usr/bin/env bash
# uptime-check.sh — checks that BarCart is responding on localhost:3000 and
# Telegrams an alert if it isn't. Runs on the Raspberry Pi (bunnypi).
#
# Usage:
#   ./scripts/uptime-check.sh                 (manual)
#   0 9 * * * ~/barcart-app/scripts/uptime-check.sh   (cron, daily)
#
# Only sends a Telegram message when the check fails — a healthy site stays
# quiet, so you're not getting a "still up" ping every day.

set -uo pipefail

APP_URL="http://localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/notify.sh"

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$APP_URL")"

if [ "$HTTP_CODE" != "200" ]; then
  send_telegram "⚠️ BarCart uptime check failed on bunnypi — ${APP_URL} returned HTTP ${HTTP_CODE:-no response}. Check pm2 status on the Pi."
fi
