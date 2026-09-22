# ChatFPL automated text tweets (FPL API)

9 text posts per day **09:55-17:55** London (sheet + Outbox update; IFTTT posts shortly after). 9am image stays on the Twitter/ScreenshotOne project.

Open script in Cursor: `scripts/google-apps-script/chatfpl-text-tweets/Code.gs`

## One-time setup

1. [Spreadsheet](https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/edit) -> **Extensions** -> **Apps Script** -> paste full `Code.gs`.
2. Project **timezone**: Europe/London.
3. Run **`debugTextTweetSetup`** -> check Executions log (lengths <= 280).
4. Run **`setupFplTextTweetTriggers`** once.
5. IFTTT Pro: Sheets **Outbox** cell **A1** -> X **Value**.

## Schedule (auto-generated, next GW only)

| Sheet / Outbox update | Topic (intended hour) |
|---------------------|------------------------|
| 09:55 | Deadline countdown (~10am) |
| 10:55 | xPts leaders (~11am) |
| 11:55 | Transfers in (~12pm) |
| 12:55 | Transfers out (~1pm) |
| 13:55 | Captain watch (~2pm) |
| 14:55 | Differentials (~3pm) |
| 15:55 | Injuries (~4pm) |
| 16:55 | DEFCON (~5pm) |
| 17:55 | Player compare (~6pm) |

Manual test: **`testFplTweetDeadline`** or **`testFplTweet('xpts')`**.

Logs append to **Tweets** tab. **Outbox** must stay the first (leftmost) tab.
