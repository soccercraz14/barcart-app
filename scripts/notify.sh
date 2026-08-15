#!/usr/bin/env bash
# notify.sh — sends a message to your Telegram bot.
# Sourced by deploy.sh, or callable standalone: ./notify.sh "message text"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -a
[ -f "$SCRIPT_DIR/../.env" ] && source "$SCRIPT_DIR/../.env"
set +a

send_telegram() {
  local message="$1"
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    echo "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set in .env — skipping notification."
    return 0
  fi
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode chat_id="${TELEGRAM_CHAT_ID}" \
    --data-urlencode text="${message}" > /dev/null
}

# Allow standalone invocation: ./notify.sh "some message"
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  send_telegram "$1"
fi
