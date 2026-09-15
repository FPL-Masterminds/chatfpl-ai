# ChatFPL Instagram (separate Apps Script)

Instagram only. Does not touch your Twitter / IFTTT project.

## Two projects

| Project | What it does |
|---------|----------------|
| **ChatFPL.ai** (existing) | Screenshot -> `ChatFPL_Screenshots` -> IFTTT -> X |
| **ChatFPL Instagram** (this one) | Screenshot -> Buffer queue -> Instagram |

Turn off the failing IFTTT **Drive -> Buffer** applet.

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
8. Run **`setupStaggeredTriggers`** once (9:00, 14:00, 19:00)

## Notes

- Images archive to Drive folder **`ChatFPL_Instagram`** (backup only)
- Buffer uses ScreenshotOne's hosted `screenshot_url` / `cache_url`, not the `/take` API link or Drive
- Uses 3 extra ScreenshotOne captures per day (separate from Twitter)
- Apps Script triggers fire at 9:00 / 14:00 / 19:00; Buffer publishes at your queue times (e.g. 9:05 / 14:05 / 19:05)

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Image could not be read from its URL` | Update `Code.gs` from this repo. Buffer cannot fetch the ScreenshotOne API URL; the script must pass `screenshot_url` from the JSON response. |
| `Channel not found` | Run `verifyBufferInstagramChannelId` and fix `BUFFER_INSTAGRAM_CHANNEL_ID`. |
| No execution at slot time | Re-run `setupStaggeredTriggers`. Check project timezone is Europe/London. |
