# ChatFPL automated text tweets (FPL API)

9 text posts per day **10:00-18:00** London (9am image stays on the Twitter/ScreenshotOne project).

Open script in Cursor: `scripts/google-apps-script/chatfpl-text-tweets/Code.gs`

## One-time setup

1. [Spreadsheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit) -> **Extensions** -> **Apps Script** -> paste full `Code.gs`.
2. Project **timezone**: Europe/London.
3. Run **`debugTextTweetSetup`** -> check Executions log (lengths <= 280).
4. Run **`setupFplTextTweetTriggers`** once.
5. IFTTT Pro: Sheets **Outbox** cell **A1** -> X **Value**.

## Schedule (auto-generated, next GW only)

| Time | Topic |
|------|--------|
| 10:00 | Deadline DD:HH:MM:SS |
| 11:00 | xPts leaders |
| 12:00 | Transfers in |
| 13:00 | Transfers out |
| 14:00 | Captain watch |
| 15:00 | Differentials |
| 16:00 | Injuries |
| 17:00 | DEFCON |
| 18:00 | Player compare |

Manual test: **`testFplTweetDeadline`** or **`testFplTweet('xpts')`**.

Logs append to **Tweets** tab. **Outbox** must stay the first (leftmost) tab.
