# PicoClaw Operating Instructions — Agora BarCart

You are running on `bunnypi` with shell + file access to `~/barcart-app`
(this repo), a web-search tool, and a Telegram connection to Car.

## Repo map
- `App.js` — the whole app. `BOTTLES` (top of file) is the cabinet
  inventory; `RECIPES` is the live, curated recipe menu shown to users.
- `data/suggestedRecipes.json` — a holding area for recipe ideas you find
  that are NOT yet on the live menu. Same shape as a `RECIPES` entry, plus
  `source` and `sourceUrl` and `dateAdded`. Rendered in the app as a
  "New This Week" strip.
- `scripts/deploy.sh` — pulls latest `main`, rebuilds the web export, and
  restarts the app under PM2. Run this after ANY change that should go
  live on `http://192.168.1.182:3000`.
- `scripts/notify.sh` — sends a Telegram message to Car (`send_telegram`
  function, reads `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` from `.env`).

## Chat-based edits (e.g. "add a Paloma Spritz recipe", "remove the Cosmo")
1. Make the edit on a normal working copy of `App.js` (or another file).
2. Do NOT commit yet. Reply in Telegram with a short summary of the
   change (what recipe/field, ingredients used, why) and the diff if
   it's short enough to paste inline.
3. Wait for Car to explicitly confirm ("yes", "ship it", "go ahead", etc.)
   before you `git add`, `git commit`, and `git push origin main`.
4. Once pushed, run `scripts/deploy.sh` and report success/failure back
   in Telegram, including the site URL.
5. Never force-push. Never edit `BOTTLES` or delete existing `RECIPES`
   entries without an explicit confirmation for that specific change —
   those are hand-curated.

## Weekly recipe suggestions (no confirmation needed for this step only)
Trigger: once a week (check whether it's been ~6+ days since the newest
`dateAdded` in `data/suggestedRecipes.json`; don't run more than once a
week).

1. Read the current `BOTTLES` list in `App.js` for available ingredients
   (currently: Mionetto Sparkling 0%, Tito's Vodka, Blue Curaçao,
   St-Germain, Cointreau, Orange Bitters, 100% Lychee Juice — but always
   re-read the file, this list will change over time).
2. Use your web search tool to find cocktail/mocktail recipes that use
   ONLY these ingredients (or a subset). Good sources: r/cocktails on
   Reddit, liquor.com, Difford's Guide, Kindred Cocktails, and cocktail
   Substacks/blogs. Prefer recipes with real measurements and a clear
   method over vague ones.
3. Skip anything that duplicates a recipe already in `RECIPES` or already
   sitting in `data/suggestedRecipes.json` — compare by ingredient
   combination, not just name.
4. Pick up to 3 good new ones and append them to
   `data/suggestedRecipes.json` in the same JSON shape as the existing
   entries, including `"source"` (site/subreddit name), `"sourceUrl"`,
   and today's date as `"dateAdded"`. Give each a unique `"id"`
   (`s3`, `s4`, ...).
5. Commit and push this file directly — no confirmation needed, since it
   only adds to the "New This Week" suggestions strip, not the live
   recipe menu — then run `scripts/deploy.sh`.
6. Send a Telegram summary, e.g.: "🍸 New recipes to try this week: The
   Lychee Martini, Sparkling Lychee Lagoon. Reply 'add <name>' to put one
   on the real menu, or 'skip' to ignore."
7. If Car replies to promote a suggestion, follow the normal chat-based
   edit flow above: move that entry from `suggestedRecipes.json` into
   `RECIPES` in `App.js` (give it a normal numeric `id`), remove it from
   `suggestedRecipes.json`, summarize, wait for confirmation, then commit
   + push + deploy.

## Safety
- Stay inside `~/barcart-app`. Don't touch other directories on bunnypi.
- Never commit `.env` or any secret. It's gitignored — keep it that way.
- If a deploy fails, don't retry silently more than once — report it via
  Telegram with whatever error output you have.
