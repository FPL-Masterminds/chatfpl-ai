# Chat production status

Use this after every deploy to know if **real FPL chat** can reach Dify, not just the conversational shortcut.

## Quick check (you or Cursor)

```bash
node scripts/chat-production-status.mjs
```

After a fresh push, wait for Vercel (~2 minutes):

```bash
# bash
CHAT_HEALTH_WAIT_MS=120000 node scripts/chat-production-status.mjs
```

```powershell
# PowerShell
$env:CHAT_HEALTH_WAIT_MS=120000; node scripts/chat-production-status.mjs
```

**Output you want:** `Status: Chat Online`  
**Bad:** `Status: Chat Offline` (script exits code 1)

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

Workflow **Chat production status** is **manual only** (Actions tab → Run workflow). It polls `https://www.chatfpl.ai/api/health/chat` after a short wait. It does not run on every push, so you should not get failure emails on each commit.

After pushes, Cursor should run `npm run chat:status` and tell you `**Production chat:** Online` or `Offline`.

## Cursor agent rule

`.cursor/rules/post-push-chat-status.mdc` requires the agent to run the script after pushes and end with:

`**Production chat:** Online` or `**Production chat:** Offline`

## What shallow health does not prove

Shallow checks do not call Dify (no message cost). They do not catch every Dify outage. For full end-to-end, send one real question on https://www.chatfpl.ai/chat while logged in.

Deep check (`CRON_SECRET`) runs `runChatPreDifySmoke()` and catches bugs like undeclared `allPlayers` before Dify.

## Optional: Vercel alerts

In Vercel, add a notification when `/api/chat` error rate spikes or when `/api/health/chat` returns 503.
