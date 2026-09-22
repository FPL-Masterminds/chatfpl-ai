# ChatFPL text tweets (Sheet -> IFTTT -> X)

Three **text** posts per day from [ChatFPL X.com sheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit). Separate from the daily **image** tweet (`chatfpl-twitter` + Drive + IFTTT).

## Sheet layout

### Tab `Tweets`

| tweet | posted | posted_at |
|-------|--------|-----------|
| (your text, max 280 chars) | | |

Data starts **row 2**. Script posts the first row where `posted` is blank, then sets `YES`.

### Line breaks in a cell

In Google Sheets, **Shift+Enter** usually moves to the next cell. For a new line **inside** the tweet cell use:

- **Windows:** **Ctrl+Enter**
- **Mac:** **Cmd+Enter**

Turn on **Format -> Wrapping -> Wrap** on column A (the script enables wrap on column A when it creates the tab). X will post those line breaks as separate lines.

### URLs

Do not put `https://...` in the tweet column if you hate how X looks. The script strips URLs before posting when `STRIP_URLS_FROM_TWEET` is true (default). Your X bio / pinned post can carry the link. Optional: set `APPEND_LINK_LINE` to `chatfpl.ai` in `Code.gs` for one short domain line without https.

### Green circle bullets

With `BULLETIZE_LINES_AFTER_FIRST = true` (default), the script formats multi-line tweets like:

- Line 1: headline (no bullet)
- Line 2+: `🟢` before each line

In the sheet you can use plain lines (Ctrl+Enter between them) or start lines with `-` / `•`; the script normalizes to 🟢 on X. Paste 🟢 yourself with **Win+.** (Windows) or **Ctrl+Cmd+Space** (Mac) if you prefer manual control (`BULLETIZE_LINES_AFTER_FIRST = false`).

### Tab `Outbox`

| A1 | B1 |
|----|-----|
| Latest tweet text (IFTTT reads this) | ISO timestamp (forces cell update) |

Create tabs manually or run `testPublishNextTweet` once after pasting the script (script creates tabs if missing).

## Apps Script

1. Open the [spreadsheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit).
2. **Extensions** -> **Apps Script**.
3. Name project **Text Tweets Script**.
4. Paste `Code.gs` from https://www.chatfpl.ai/chatfpl-text-tweets-script (or this repo folder).
5. **Project Settings** -> Time zone **Europe/London**.
6. Put at least one tweet in **`Tweets!A2`** (tab `Tweets`, not Sheet1).
7. Run **`testPublishNextTweet`** -> **Review permissions** -> Allow (same Google account as the sheet).
8. Run **`testPublishNextTweet`** again -> check **`Outbox!A1`** has the tweet and **`Tweets!B2`** is `YES`.
9. Only after step 8 works: run **`setupTextTweetTriggers`** once (3 daily triggers).

Edit `POST_TIMES` in `Code.gs` before step 9 if you want different slots (default `08:00`, `13:00`, `18:00`).

## IFTTT Applet

1. [Create Applet](https://ifttt.com/create/applet).
2. **If** Google Sheets -> **Cell updated in spreadsheet**.
   - Spreadsheet: **ChatFPL X.com** (URL or folder + filename)
   - **Which cell:** `A1` only (not `Outbox!A1`). IFTTT does not ask for a worksheet; it watches the **first tab** in the file.
   - The script moves tab **Outbox** to the left (first position) when it runs. Run **`testPublishNextTweet`** once after setup.
3. **Then** Twitter (X) -> **Post a tweet** (wording varies).
   - Tweet text: ingredient **Value** / **Cell value** from the trigger (column A).
4. Turn **On**.

**Important:** Do not include the image Drive Applet logic here. Keep your existing **photo -> X** Applet separate.

## IFTTT test

After Apps Script step 8, check IFTTT **Activity** when `Outbox!A1` updates (free tier may take up to ~1 hour).

## Reset queue

Run **`resetTweetQueue`** to clear `posted` columns and reuse the same tweets.
