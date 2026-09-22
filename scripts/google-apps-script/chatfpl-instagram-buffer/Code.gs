/**
 * ChatFPL Instagram via Buffer (standalone Apps Script project)
 *
 * Do NOT merge this with your Twitter project.
 * Twitter:  ScreenshotOne -> Drive (ChatFPL_Screenshots) -> IFTTT -> X
 * Instagram (+ optional Facebook Page): ScreenshotOne -> Buffer queue
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

/** One Instagram capture per day (slot 1). Hub rotates via hubForSlot on the site. */
const POST_TIMES = ['09:00'];
const DRIVE_FOLDER_NAME = 'ChatFPL_Instagram';
const BUFFER_API_URL = 'https://api.buffer.com';
const CAPTION = 'Fantasy Premier League insights powered ChatFPL.ai';

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

function getOptionalProp(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value ? value.trim() : '';
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

function queueBufferImagePost(channelId, imageUrl, caption, metadataLine) {
  const mutation = [
    'mutation {',
    '  createPost(input: {',
    '    text: "' + escapeGraphqlString(caption) + '"',
    '    channelId: "' + escapeGraphqlString(channelId) + '"',
    '    schedulingType: automatic',
    '    mode: addToQueue',
    '    assets: [{ image: { url: "' + escapeGraphqlString(imageUrl) + '" } }]',
    metadataLine,
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
      'Buffer createPost failed: ' + result.message + ' (channelId=' + channelId + ').',
    );
  }
  return result.post;
}

function queueInstagramPost(imageUrl, caption) {
  const channelId = getProp('BUFFER_INSTAGRAM_CHANNEL_ID');
  return queueBufferImagePost(
    channelId,
    imageUrl,
    caption,
    '    metadata: { instagram: { type: post, shouldShareToFeed: true } },',
  );
}

function queueFacebookPost(imageUrl, caption) {
  const channelId = getProp('BUFFER_FACEBOOK_CHANNEL_ID');
  return queueBufferImagePost(
    channelId,
    imageUrl,
    caption,
    '    metadata: { facebook: { type: post } },',
  );
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
  const igPost = queueInstagramPost(imageUrl, CAPTION);
  Logger.log(
    'Queued Instagram post ' +
      igPost.id +
      ' for ' +
      igPost.dueAt +
      ' (' +
      filename +
      ')',
  );

  const facebookChannelId = getOptionalProp('BUFFER_FACEBOOK_CHANNEL_ID');
  if (facebookChannelId) {
    const fbPost = queueFacebookPost(imageUrl, CAPTION);
    Logger.log('Queued Facebook post ' + fbPost.id + ' for ' + fbPost.dueAt);
  } else {
    Logger.log('Skipped Facebook (set BUFFER_FACEBOOK_CHANNEL_ID after connecting Page in Buffer).');
  }
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
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  POST_TIMES.forEach(function (time) {
    const parts = time.split(':');
    ScriptApp.newTrigger('postSlot1')
      .timeBased()
      .atHour(parseInt(parts[0], 10))
      .nearMinute(parseInt(parts[1], 10))
      .everyDays(1)
      .create();
  });
}

/** Alias for manual runs. Same as postSlot1. */
function postDaily() {
  captureAndQueueInstagram(0);
}

/**
 * Run once after adding BUFFER_API_KEY.
 * Copy the Instagram channel id into Script property BUFFER_INSTAGRAM_CHANNEL_ID.
 */
/**
 * Lists all Buffer channels. Copy ids into Script properties for Instagram and Facebook.
 */
function listBufferChannels() {
  fetchBufferInstagramChannelId(true);
}

function fetchBufferInstagramChannelId(listAll) {
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
  const facebook = channels.filter(function (channel) {
    return String(channel.service).toLowerCase() === 'facebook';
  });

  if (!instagram.length && !listAll) {
    throw new Error('No Instagram channel found. Connect Instagram in Buffer first.');
  }

  Logger.log('');
  if (instagram.length) {
    Logger.log('Set BUFFER_INSTAGRAM_CHANNEL_ID to:');
    Logger.log(instagram[0].id);
  }
  if (facebook.length) {
    Logger.log('Set BUFFER_FACEBOOK_CHANNEL_ID to (optional, same image as Instagram):');
    facebook.forEach(function (channel) {
      Logger.log('  ' + channel.displayName + ' -> ' + channel.id);
    });
  } else {
    Logger.log('No Facebook channel yet. In Buffer: Channels -> Connect -> Facebook Page (Chatfpl AI).');
  }
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
