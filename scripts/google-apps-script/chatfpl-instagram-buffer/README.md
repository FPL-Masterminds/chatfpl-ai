# ChatFPL Instagram (separate Apps Script)

Instagram only. Does not touch your Twitter / IFTTT project.

## Two projects

| Project | What it does |
|---------|----------------|
| **ChatFPL.ai** (Twitter) | Screenshot -> `ChatFPL_Screenshots` -> IFTTT -> X. Repo: `scripts/google-apps-script/chatfpl-twitter/Code.gs` |
| **ChatFPL Instagram** (this one) | Screenshot -> Buffer queue -> Instagram |

Turn off the failing IFTTT **Drive -> Buffer** applet.

## ScreenshotOne quota (why X posts != API usage)

Both projects use the **same** `SCREENSHOTONE_ACCESS_KEY`. **Every** `/take` request counts toward your plan, including:

- Each daily X capture (1/day after you update triggers)
- Each daily Instagram capture (1/day)
- Failed runs that retry
- Opening the **ScreenshotOne API URL** from the admin social screenshots page (it executes a capture)

Example: with **3 posts/day on X and 3 on Instagram**, you burn **~6 captures/day** even though IFTTT only tweeted 3 times. That explains ~50 API uses vs ~19 visible X posts over a few weeks.

## Create the project

1. Go to [script.google.com](https://script.google.com) -> **New project**
2. Name it **ChatFPL Instagram**
3. Delete the default `Code.gs` content and paste everything from `Code.gs` in this folder
4. **Project Settings** -> **Script properties** -> add:

| Property | Value |
|----------|--------|
| `SCREENSHOTONE_ACCESS_KEY` | Same as Twitter project |
| `SOCIAL_CARD_TOKEN` | Same as Twitter project |
| `BUFFER_API_KEY` | From [publish.buffer.com/settings/api](https://publish.buffer.com/settings/api) |

5. Run **`fetchBufferInstagramChannelId`** -> open **Execution log**
6. Copy the Instagram id into Script property **`BUFFER_INSTAGRAM_CHANNEL_ID`**
7. Run **`postSlot1`** once to test -> check Buffer **Publish** queue
8. Run **`setupStaggeredTriggers`** once (**09:00** London only, one post per day)

Update the **Twitter** project the same way: paste `chatfpl-twitter/Code.gs` and run **`setupDailyTrigger`** once.

## Notes

- Images archive to Drive folder **`ChatFPL_Instagram`** (backup only)
- Buffer uses ScreenshotOne's hosted `screenshot_url` / `cache_url`, not the `/take` API link or Drive
- **One** ScreenshotOne capture per day on Instagram (slot 1). Hub rotates on the site by date.
- Apps Script trigger at **09:00** London; Buffer publishes at your queue time

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Image could not be read from its URL` | Update `Code.gs` from this repo. Buffer cannot fetch the ScreenshotOne API URL; the script must pass `screenshot_url` from the JSON response. |
| `Channel not found` | Run `verifyBufferInstagramChannelId` and fix `BUFFER_INSTAGRAM_CHANNEL_ID`. |
| No execution at slot time | Re-run `setupStaggeredTriggers`. Check project timezone is Europe/London. |
