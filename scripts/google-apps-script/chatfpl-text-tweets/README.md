# ChatFPL text tweets (Sheet -> IFTTT -> X)

Three **text** posts per day from [ChatFPL X.com sheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit). Separate from the daily **image** tweet (`chatfpl-twitter` + Drive + IFTTT).

## Sheet layout

### Tab `Tweets`

| tweet | posted | posted_at |
|-------|--------|-----------|
| (your text, max 280 chars) | | |

Data starts **row 2**. Script posts the first row where `posted` is blank, then sets `YES`.

### Tab `Outbox`

| A1 | B1 |
|----|-----|
| Latest tweet text (IFTTT reads this) | ISO timestamp (forces cell update) |

Create tabs manually or run `testPublishNextTweet` once after pasting the script (script creates tabs if missing).

## Apps Script

1. Open the [spreadsheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit).
2. **Extensions** -> **Apps Script**.
3. Name project **Text Tweets Script**.
4. Paste `Code.gs` from this folder.
5. **Project Settings** -> Time zone **Europe/London**.
6. Run **`setupTextTweetTriggers`** once (authorize).
7. Run **`testPublishNextTweet`** once to test.

Edit `POST_TIMES` in `Code.gs` if you want different slots (default `08:00`, `13:00`, `18:00`).

## IFTTT Applet

1. [Create Applet](https://ifttt.com/create/applet).
2. **If** Google Sheets -> **Cell updated in spreadsheet** (or **Any cell updated**).
   - Spreadsheet: **ChatFPL X.com**
   - Worksheet: **Outbox**
   - Cell: **A1** (or range `A1`)
3. **Then** Twitter (X) -> **Post a tweet** (wording varies).
   - Tweet text: ingredient **Value** / **Cell value** from the trigger (column A).
4. Turn **On**.

**Important:** Do not include the image Drive Applet logic here. Keep your existing **photo -> X** Applet separate.

## Test

1. Put one tweet in `Tweets!A2`.
2. Run **`testPublishNextTweet`**.
3. Check `Outbox!A1` and IFTTT **Activity** (may take up to ~1 hour on free IFTTT).
4. When satisfied, run **`setupTextTweetTriggers`**.

## Reset queue

Run **`resetTweetQueue`** to clear `posted` columns and reuse the same tweets.
