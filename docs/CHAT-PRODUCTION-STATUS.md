# Chat production status

Use this when **you** want to know if real FPL chat can reach Dify, not just the conversational shortcut.

## Quick check (manual)

```bash
node scripts/chat-production-status.mjs
```

Default: no deploy wait (`CHAT_HEALTH_WAIT_MS` defaults to `0`). Run the script immediately after a push; do not block the reply on a two-minute Vercel wait unless the owner asks.

If you just pushed and want to poll until deploy finishes, set a wait yourself (optional):

```bash
CHAT_HEALTH_WAIT_MS=60000 node scripts/chat-production-status.mjs
```

After pushes that affect production chat, Cursor agents should run the script with **zero wait** and end the owner reply with:

`**Production chat:** Online` or `**Production chat:** Offline`

## HTTP endpoint

Public (shallow): https://www.chatfpl.ai/api/health/chat

- Checks: `DIFY_API_KEY` present, database `SELECT 1`, FPL bootstrap API reachable.
- JSON `status`: `online` | `offline`
- JSON `label`: `Chat Online` | `Chat Offline`

Deep check (same pre-Dify path as `/api/chat`, no Dify call):

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.chatfpl.ai/api/health/chat
```

Includes `chat_pre_dify_pipeline` when `CRON_SECRET` matches.

## GitHub Actions (optional)

Workflow **Chat production status** is **manual only** (Actions tab → Run workflow). It polls `https://www.chatfpl.ai/api/health/chat` after a short wait. It does not run on every push.

## What shallow health does not prove

Shallow checks do not call Dify (no message cost). They do not catch every Dify outage. For full end-to-end, send one real question on https://www.chatfpl.ai/chat while logged in.

Deep check (`CRON_SECRET`) runs `runChatPreDifySmoke()` and catches bugs like undeclared `allPlayers` before Dify.

## Optional: Vercel alerts

In Vercel, add a notification when `/api/chat` error rate spikes or when `/api/health/chat` returns 503.
