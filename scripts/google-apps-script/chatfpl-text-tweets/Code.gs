/**
 * ChatFPL Text Tweets (Google Sheet -> Outbox cell -> IFTTT -> X)
 *
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/
 *
 * Setup:
 * 1. Create tabs "Tweets" and "Outbox" (see README).
 * 2. Paste this file into Apps Script project named "Text Tweets Script"
 *    (Extensions -> Apps Script from the spreadsheet, or standalone with SPREADSHEET_ID).
 * 3. Run setupTextTweetTriggers once (Europe/London project timezone).
 * 4. IFTTT: Google Sheets cell update on Outbox!A1 -> X post tweet text.
 */

/** Spreadsheet ID from the sheet URL (path /d/THIS_ID/edit). */
const SPREADSHEET_ID = '1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU';

/** Tab with tweet queue. Row 1 = headers. Data from row 2. */
const TWEETS_SHEET_NAME = 'Tweets';

/** Tab IFTTT watches. A1 = latest tweet text. */
const OUTBOX_SHEET_NAME = 'Outbox';

/** Column letters on Tweets sheet (row 1 = headers). */
const COL_TWEET = 1;
const COL_POSTED = 2;
const COL_POSTED_AT = 3;

/** Max length for X (API allows 280). */
const MAX_TWEET_LENGTH = 280;

/**
 * Three runs per day, 24h clock, project timezone (set Europe/London).
 * Change times here if you want different slots.
 */
const POST_TIMES = ['08:00', '13:00', '18:00'];

/** Function name used by time triggers. */
const TRIGGER_HANDLER = 'publishNextTweetToOutbox';

function getSpreadsheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === SPREADSHEET_ID) {
    return active;
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Run this first if testPublishNextTweet hangs or fails.
 * View: Executions -> latest run -> Logs (or legacy Execution log).
 */
function debugTextTweetSetup() {
  Logger.log('Step 1: opening spreadsheet ' + SPREADSHEET_ID);
  let ss;
  try {
    ss = getSpreadsheet();
  } catch (e) {
    Logger.log('FAILED to open sheet. Use the same Google account that owns the sheet. Error: ' + e);
    throw e;
  }
  Logger.log('Step 2: opened "' + ss.getName() + '"');

  const names = ss.getSheets().map(function (s) {
    return s.getName() + ' (lastRow=' + s.getLastRow() + ')';
  });
  Logger.log('Step 3: tabs: ' + names.join(', '));

  const tweets = ss.getSheetByName(TWEETS_SHEET_NAME);
  if (!tweets) {
    Logger.log(
      'MISSING tab "' +
        TWEETS_SHEET_NAME +
        '". Create it or run testPublishNextTweet (script can create tabs).',
    );
    return;
  }
  if (tweets.getLastRow() < 2) {
    Logger.log(
      'Tab "' +
        TWEETS_SHEET_NAME +
        '" has no tweet rows. Put text in column A from row 2 up (not only on Sheet1).',
    );
    return;
  }
  Logger.log('Step 4: A2 preview: ' + String(tweets.getRange(2, 1).getValue()).slice(0, 80));
  Logger.log('OK. Run testPublishNextTweet next.');
}

function ensureSheets(ss) {
  let tweets = ss.getSheetByName(TWEETS_SHEET_NAME);
  if (!tweets) {
    tweets = ss.insertSheet(TWEETS_SHEET_NAME);
    tweets.getRange(1, COL_TWEET, 1, COL_POSTED_AT).setValues([
      ['tweet', 'posted', 'posted_at'],
    ]);
  }
  let outbox = ss.getSheetByName(OUTBOX_SHEET_NAME);
  if (!outbox) {
    outbox = ss.insertSheet(OUTBOX_SHEET_NAME);
    outbox.getRange('A1').setValue('');
    outbox.getRange('B1').setValue('updated_at');
  }
  return { tweets: tweets, outbox: outbox };
}

function isPostedFlag(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === 'yes' || v === 'y' || v === 'true' || v === '1';
}

/**
 * Picks the first unposted tweet (top to bottom), writes to Outbox!A1, marks row posted.
 */
function publishNextTweetToOutbox() {
  const ss = getSpreadsheet();
  const sheets = ensureSheets(ss);
  const tweets = sheets.tweets;
  const outbox = sheets.outbox;

  const lastRow = tweets.getLastRow();
  if (lastRow < 2) {
    throw new Error('No tweets in sheet "' + TWEETS_SHEET_NAME + '". Add rows from row 2.');
  }

  const data = tweets.getRange(2, 1, lastRow, COL_POSTED_AT).getValues();
  let pickedIndex = -1;
  let text = '';

  for (let i = 0; i < data.length; i++) {
    if (!isPostedFlag(data[i][COL_POSTED - 1])) {
      pickedIndex = i;
      text = String(data[i][COL_TWEET - 1] || '').trim();
      break;
    }
  }

  if (pickedIndex < 0) {
    Logger.log('All tweets marked posted. Run resetTweetQueue() or add new rows.');
    return;
  }

  if (!text) {
    throw new Error('Empty tweet text on Tweets row ' + (pickedIndex + 2));
  }
  if (text.length > MAX_TWEET_LENGTH) {
    throw new Error(
      'Tweet too long (' + text.length + ' chars) on row ' + (pickedIndex + 2) + '. Max ' + MAX_TWEET_LENGTH,
    );
  }

  const rowNumber = pickedIndex + 2;
  const now = new Date();

  outbox.getRange('A1').setValue(text);
  outbox.getRange('B1').setValue(now.toISOString());

  tweets.getRange(rowNumber, COL_POSTED).setValue('YES');
  tweets.getRange(rowNumber, COL_POSTED_AT).setValue(now);

  Logger.log('Outbox updated from Tweets row ' + rowNumber + ' (' + text.length + ' chars).');
}

/** Manual test (same as trigger). */
function testPublishNextTweet() {
  Logger.log('testPublishNextTweet: start');
  try {
    publishNextTweetToOutbox();
    SpreadsheetApp.flush();
    Logger.log('testPublishNextTweet: done');
  } catch (e) {
    Logger.log('testPublishNextTweet: ERROR ' + e);
    throw e;
  }
}

/** Clears posted flags so the queue cycles again (does not clear Outbox). */
function resetTweetQueue() {
  const ss = getSpreadsheet();
  const tweets = ensureSheets(ss).tweets;
  const lastRow = tweets.getLastRow();
  if (lastRow < 2) {
    return;
  }
  tweets.getRange(2, COL_POSTED, lastRow, COL_POSTED_AT).clearContent();
  Logger.log('Cleared posted flags on rows 2-' + lastRow);
}

function setupTextTweetTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  POST_TIMES.forEach(function (time) {
    const parts = time.split(':');
    ScriptApp.newTrigger(TRIGGER_HANDLER)
      .timeBased()
      .atHour(parseInt(parts[0], 10))
      .nearMinute(parseInt(parts[1], 10))
      .everyDays(1)
      .create();
  });

  Logger.log('Created ' + POST_TIMES.length + ' daily triggers for ' + TRIGGER_HANDLER + ': ' + POST_TIMES.join(', '));
}
