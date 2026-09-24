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
#
# Also alerts if the weekly recipe suggestions have gone stale (see below).

set -uo pipefail

APP_URL="http://localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/notify.sh"

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$APP_URL")"

if [ "$HTTP_CODE" != "200" ]; then
  send_telegram "⚠️ BarCart uptime check failed on bunnypi — ${APP_URL} returned HTTP ${HTTP_CODE:-no response}. Check pm2 status on the Pi."
fi

# Weekly recipe suggestions (see PICOCLAW.md) — alert if PicoClaw hasn't added
# any in over a week, so a stalled job doesn't go unnoticed.
STALE_DAYS=8
SUGGESTIONS_FILE="$SCRIPT_DIR/../data/suggestedRecipes.json"
NEWEST="$(node -e '
  const list = require(process.argv[1]);
  const dates = list.map((r) => r.dateAdded).filter(Boolean).sort();
  console.log(dates.length ? dates[dates.length - 1] : "");
' "$SUGGESTIONS_FILE" 2>/dev/null)"

if [ -z "$NEWEST" ]; then
  send_telegram "⚠️ BarCart has no dated recipe suggestions — PicoClaw's weekly suggestion job may not be running."
else
  AGE_DAYS=$(( ( $(date +%s) - $(date -d "$NEWEST" +%s) ) / 86400 ))
  if [ "$AGE_DAYS" -ge "$STALE_DAYS" ]; then
    send_telegram "⚠️ BarCart's newest recipe suggestion is ${AGE_DAYS} days old (${NEWEST}) — PicoClaw's weekly suggestion job hasn't run. Check its schedule on bunnypi."
  fi
fi
