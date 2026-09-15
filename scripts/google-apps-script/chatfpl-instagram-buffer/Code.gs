/**
 * ChatFPL Instagram via Buffer (standalone Apps Script project)
 *
 * Do NOT merge this with your Twitter project.
 * Twitter:  ScreenshotOne -> Drive (ChatFPL_Screenshots) -> IFTTT -> X
 * Instagram: ScreenshotOne -> Buffer queue -> chatfpl_ai (this script only)
 *
 * Setup (one time):
 * 1. script.google.com -> New project -> paste this file -> name it ChatFPL Instagram
 * 2. Project Settings -> Script properties -> add:
 *    - SCREENSHOTONE_ACCESS_KEY
 *    - SOCIAL_CARD_TOKEN
 *    - BUFFER_API_KEY
 *    - BUFFER_INSTAGRAM_CHANNEL_ID  (run fetchBufferInstagramChannelId first)
 * 3. Run fetchBufferInstagramChannelId -> copy Instagram channel id into BUFFER_INSTAGRAM_CHANNEL_ID
 * 4. Run setupStaggeredTriggers once
 * 5. Turn OFF the IFTTT Drive -> Buffer Instagram applet (it fails without post type)
 */

const POST_TIMES = ['09:00', '14:00', '19:00'];
const DRIVE_FOLDER_NAME = 'ChatFPL_Instagram';
const BUFFER_API_URL = 'https://api.buffer.com';
const CAPTION = 'Fantasy Premier League insights powered by AI. chatfpl.ai';

const CARDS = [
  { name: 'slot-1', slot: 1 },
  { name: 'slot-2', slot: 2 },
  { name: 'slot-3', slot: 3 },
];

function getProp(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing Script property: ' + key);
  }
  return value.trim();
}

function cardPageUrl(slot) {
  const token = getProp('SOCIAL_CARD_TOKEN');
  return (
    'https://www.chatfpl.ai/internal/social-card?slot=' +
    slot +
    '&token=' +
    encodeURIComponent(token)
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
    'cache=true',
    'cache_ttl=86400',
  ];
  return 'https://api.screenshotone.com/take?' + params.join('&');
}

/**
 * Returns a direct PNG URL Buffer can fetch (screenshot_url / cache_url).
 * The ScreenshotOne /take API URL itself is not a stable image link.
 */
function captureScreenshotImageUrl(pageUrl) {
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
    throw new Error(
      'ScreenshotOne JSON missing image URL: ' + body.slice(0, 300),
    );
  }

  return imageUrl;
}

function getInstagramFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (!folders.hasNext()) {
    return DriveApp.createFolder(DRIVE_FOLDER_NAME);
  }
  return folders.next();
}

function archiveScreenshot(folder, blob, filename) {
  const file = folder.createFile(blob.setName(filename));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file;
}

function escapeGraphqlString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

function bufferGraphql(query) {
  const apiKey = getProp('BUFFER_API_KEY');
  const response = UrlFetchApp.fetch(BUFFER_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify({ query: query }),
    muteHttpExceptions: true,
  });

  const body = response.getContentText();
  if (response.getResponseCode() !== 200) {
    throw new Error('Buffer HTTP ' + response.getResponseCode() + ': ' + body);
  }

  const json = JSON.parse(body);
  if (json.errors && json.errors.length) {
    throw new Error('Buffer GraphQL error: ' + JSON.stringify(json.errors));
  }
  return json;
}

function queueInstagramPost(imageUrl, caption) {
  const channelId = getProp('BUFFER_INSTAGRAM_CHANNEL_ID');
  const mutation = [
    'mutation {',
    '  createPost(input: {',
    '    text: "' + escapeGraphqlString(caption) + '"',
    '    channelId: "' + escapeGraphqlString(channelId) + '"',
    '    schedulingType: automatic',
    '    mode: addToQueue',
    '    assets: [{ image: { url: "' + escapeGraphqlString(imageUrl) + '" } }]',
    '    metadata: { instagram: { type: post, shouldShareToFeed: true } }',
    '  }) {',
    '    ... on PostActionSuccess { post { id dueAt } }',
    '    ... on MutationError { message }',
    '  }',
    '}',
  ].join('\n');

  const json = bufferGraphql(mutation);
  const result = json.data && json.data.createPost;
  if (!result) {
    throw new Error('Buffer createPost returned no data: ' + JSON.stringify(json));
  }
  if (result.message) {
    throw new Error(
      'Buffer createPost failed: ' +
        result.message +
        ' (channelId=' +
        channelId +
        '). Run verifyBufferInstagramChannelId if unsure.',
    );
  }
  return result.post;
}

function captureAndQueueInstagram(cardIndex) {
  const card = CARDS[cardIndex];
  const date = new Date().toISOString().slice(0, 10);
  const folder = getInstagramFolder();
  const pageUrl = cardPageUrl(card.slot);
  const imageUrl = captureScreenshotImageUrl(pageUrl);

  const imageResponse = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
  if (imageResponse.getResponseCode() !== 200) {
    throw new Error(
      'Could not download screenshot PNG: ' +
        imageResponse.getResponseCode() +
        ' ' +
        imageUrl,
    );
  }

  const filename = date + '-' + card.name + '.png';
  archiveScreenshot(folder, imageResponse.getBlob(), filename);

  // Buffer needs a direct image URL. Drive links and ScreenshotOne API URLs do not work.
  const post = queueInstagramPost(imageUrl, CAPTION);

  Logger.log(
    'Queued Instagram post ' +
      post.id +
      ' for ' +
      post.dueAt +
      ' (' +
      filename +
      ', image=' +
      imageUrl +
      ')',
  );
}

function postSlot1() {
  captureAndQueueInstagram(0);
}

function postSlot2() {
  captureAndQueueInstagram(1);
}

function postSlot3() {
  captureAndQueueInstagram(2);
}

function setupStaggeredTriggers() {
  const handlers = ['postSlot1', 'postSlot2', 'postSlot3'];

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  POST_TIMES.forEach(function (time, i) {
    const parts = time.split(':');
    ScriptApp.newTrigger(handlers[i])
      .timeBased()
      .atHour(parseInt(parts[0], 10))
      .nearMinute(parseInt(parts[1], 10))
      .everyDays(1)
      .create();
  });
}

/**
 * Run once after adding BUFFER_API_KEY.
 * Copy the Instagram channel id into Script property BUFFER_INSTAGRAM_CHANNEL_ID.
 */
function fetchBufferInstagramChannelId() {
  const accountJson = bufferGraphql(
    'query { account { organizations { id name } } }',
  );
  const orgs = accountJson.data.account.organizations;
  if (!orgs || !orgs.length) {
    throw new Error('No Buffer organizations found on this API key.');
  }

  Logger.log('Buffer organizations:');
  orgs.forEach(function (org) {
    Logger.log('  ' + org.id + ' -> ' + org.name);
  });

  const orgId = orgs[0].id;
  const channelsJson = bufferGraphql(
    [
      'query {',
      '  channels(input: { organizationId: "' + escapeGraphqlString(orgId) + '" }) {',
      '    id',
      '    name',
      '    displayName',
      '    service',
      '  }',
      '}',
    ].join('\n'),
  );

  const channels = channelsJson.data.channels || [];
  Logger.log('Channels for ' + orgs[0].name + ':');
  channels.forEach(function (channel) {
    Logger.log(
      '  [' + channel.service + '] ' + channel.displayName + ' (' + channel.name + ') -> ' + channel.id,
    );
  });

  const instagram = channels.filter(function (channel) {
    return String(channel.service).toLowerCase() === 'instagram';
  });
  if (!instagram.length) {
    throw new Error('No Instagram channel found. Connect Instagram in Buffer first.');
  }

  Logger.log('');
  Logger.log('Set Script property BUFFER_INSTAGRAM_CHANNEL_ID to:');
  Logger.log(instagram[0].id);
}

/**
 * Run if postSlot fails with "Channel not found".
 * Confirms BUFFER_INSTAGRAM_CHANNEL_ID matches your Instagram channel.
 */
function verifyBufferInstagramChannelId() {
  const stored = getProp('BUFFER_INSTAGRAM_CHANNEL_ID');
  const accountJson = bufferGraphql('query { account { organizations { id name } } }');
  const org = accountJson.data.account.organizations[0];
  const channelsJson = bufferGraphql(
    [
      'query {',
      '  channels(input: { organizationId: "' + escapeGraphqlString(org.id) + '" }) {',
      '    id',
      '    displayName',
      '    service',
      '  }',
      '}',
    ].join('\n'),
  );

  const instagram = (channelsJson.data.channels || []).filter(function (channel) {
    return String(channel.service).toLowerCase() === 'instagram';
  });
  if (!instagram.length) {
    throw new Error('No Instagram channel on this Buffer API key.');
  }

  const expected = instagram[0].id;
  Logger.log('Stored BUFFER_INSTAGRAM_CHANNEL_ID: ' + stored);
  Logger.log('Expected Instagram channel id:          ' + expected);

  if (stored !== expected) {
    throw new Error(
      'Wrong channel id in Script properties. Use ' +
        expected +
        ' (not the organization id ' +
        org.id +
        ').',
    );
  }

  Logger.log('Channel id looks correct. Run postSlot1 again.');
}
