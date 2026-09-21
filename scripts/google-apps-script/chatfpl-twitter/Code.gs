/**
 * ChatFPL X (Twitter) via ScreenshotOne + Google Drive + IFTTT
 *
 * Separate Apps Script project from Instagram (ChatFPL Instagram).
 * IFTTT watches ChatFPL_Screenshots and posts new PNGs to @ChatFPL_AI.
 *
 * Setup:
 * 1. script.google.com -> project "ChatFPL.ai" (or new) -> paste this file
 * 2. Script properties: SCREENSHOTONE_ACCESS_KEY, SOCIAL_CARD_TOKEN
 * 3. Run setupDailyTrigger once (09:00 Europe/London)
 */

const POST_TIME = '09:00';
const DRIVE_FOLDER_NAME = 'ChatFPL_Screenshots';
const DAILY_SLOT = 1;

function getProp(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing Script property: ' + key);
  }
  return value.trim();
}

function cardPageUrl(slot) {
  const token = getProp('SOCIAL_CARD_TOKEN');
  const date = new Date().toISOString().slice(0, 10);
  return (
    'https://www.chatfpl.ai/internal/social-card?slot=' +
    slot +
    '&token=' +
    encodeURIComponent(token) +
    '&capture=' +
    encodeURIComponent(date + '-slot-' + slot)
  );
}

function buildScreenshotOneApiUrl(pageUrl) {
  const accessKey = getProp('SCREENSHOTONE_ACCESS_KEY');
  const params = [
    'access_key=' + accessKey,
    'url=' + encodeURIComponent(pageUrl),
    'format=png',
    'selector=%23social-card-canvas',
    'delay=3',
    'block_ads=true',
    'block_cookie_banners=true',
    'block_trackers=true',
    'response_type=json',
    'cache=false',
  ];
  return 'https://api.screenshotone.com/take?' + params.join('&');
}

function captureScreenshotBlob(pageUrl) {
  const apiUrl = buildScreenshotOneApiUrl(pageUrl);
  const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status !== 200) {
    throw new Error('ScreenshotOne failed: ' + status + ' ' + body.slice(0, 200));
  }

  const json = JSON.parse(body);
  const headers = response.getHeaders();
  const cacheHeader =
    headers['x-screenshotone-cache-url'] || headers['X-Screenshotone-Cache-Url'];
  const imageUrl = json.cache_url || json.screenshot_url || cacheHeader;

  if (!imageUrl) {
    throw new Error('ScreenshotOne JSON missing image URL: ' + body.slice(0, 300));
  }

  const imageResponse = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
  if (imageResponse.getResponseCode() !== 200) {
    throw new Error('Could not download screenshot PNG: ' + imageUrl);
  }
  return imageResponse.getBlob();
}

function getTwitterFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (!folders.hasNext()) {
    return DriveApp.createFolder(DRIVE_FOLDER_NAME);
  }
  return folders.next();
}

function postDaily() {
  const date = new Date().toISOString().slice(0, 10);
  const pageUrl = cardPageUrl(DAILY_SLOT);
  const blob = captureScreenshotBlob(pageUrl);
  const folder = getTwitterFolder();
  const file = folder.createFile(blob.setName(date + '-slot-' + DAILY_SLOT + '.png'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('Saved ' + file.getName() + ' for IFTTT');
}

function postSlot1() {
  postDaily();
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  const parts = POST_TIME.split(':');
  ScriptApp.newTrigger('postDaily')
    .timeBased()
    .atHour(parseInt(parts[0], 10))
    .nearMinute(parseInt(parts[1], 10))
    .everyDays(1)
    .create();
}

/** @deprecated Use setupDailyTrigger */
function setupStaggeredTriggers() {
  setupDailyTrigger();
}
