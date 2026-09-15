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

- Images archive to Drive folder **`ChatFPL_Instagram`** (not `ChatFPL_Screenshots`)
- Uses 3 extra ScreenshotOne captures per day (separate from Twitter)
- Buffer posts at your schedule slots (9:05 / 2:05 / 7:05)
