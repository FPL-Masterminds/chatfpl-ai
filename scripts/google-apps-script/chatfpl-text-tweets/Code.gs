/**
 * ChatFPL automated text tweets (FPL API -> Sheet log -> Outbox -> IFTTT -> X)
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU/
 * 9am image tweet: separate ChatFPL.ai / ScreenshotOne project (not this script).
 *
 * Setup: paste this file, timezone Europe/London, run setupFplTextTweetTriggers once.
 */

const SPREADSHEET_ID = '1-ZRSxETx67c9GD2yfFai_osHYIeCUnr0ziCgccyuGCU';
const TWEETS_SHEET_NAME = 'Tweets';
const OUTBOX_SHEET_NAME = 'Outbox';
const FPL_BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FPL_FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';
const MAX_TWEET_LENGTH = 280;
const BULLET_EMOJI = '\uD83D\uDFE2 ';
const STRIP_URLS_FROM_TWEET = true;
const APPEND_LINK_LINE = '';
const BULLETIZE_LINES_AFTER_FIRST = false;

const COL_TWEET = 1;
const COL_POSTED = 2;
const COL_POSTED_AT = 3;
const COL_TYPE = 4;
const COL_GW = 5;

/** London time. One handler name per row (Apps Script triggers need a real function). */
const FPL_TWEET_SLOTS = [
  { hour: 10, minute: 0, type: 'deadline', handler: 'postFplTweet10' },
  { hour: 11, minute: 0, type: 'xpts', handler: 'postFplTweet11' },
  { hour: 12, minute: 0, type: 'transfers_in', handler: 'postFplTweet12' },
  { hour: 13, minute: 0, type: 'transfers_out', handler: 'postFplTweet13' },
  { hour: 14, minute: 0, type: 'captain', handler: 'postFplTweet14' },
  { hour: 15, minute: 0, type: 'differentials', handler: 'postFplTweet15' },
  { hour: 16, minute: 0, type: 'injuries', handler: 'postFplTweet16' },
  { hour: 17, minute: 0, type: 'defcon', handler: 'postFplTweet17' },
  { hour: 18, minute: 0, type: 'compare', handler: 'postFplTweet18' },
];

function postFplTweet10() {
  publishFplScheduledTweet('deadline');
}
function postFplTweet11() {
  publishFplScheduledTweet('xpts');
}
function postFplTweet12() {
  publishFplScheduledTweet('transfers_in');
}
function postFplTweet13() {
  publishFplScheduledTweet('transfers_out');
}
function postFplTweet14() {
  publishFplScheduledTweet('captain');
}
function postFplTweet15() {
  publishFplScheduledTweet('differentials');
}
function postFplTweet16() {
  publishFplScheduledTweet('injuries');
}
function postFplTweet17() {
  publishFplScheduledTweet('defcon');
}
function postFplTweet18() {
  publishFplScheduledTweet('compare');
}

function getSpreadsheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === SPREADSHEET_ID) {
    return active;
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensureSheets(ss) {
  let tweets = ss.getSheetByName(TWEETS_SHEET_NAME);
  if (!tweets) {
    tweets = ss.insertSheet(TWEETS_SHEET_NAME);
  }
  if (tweets.getLastRow() < 1 || !tweets.getRange(1, 1).getValue()) {
    tweets.getRange(1, 1, 1, COL_GW).setValues([['tweet', 'posted', 'posted_at', 'type', 'gw']]);
  }
  tweets.getRange('A:A').setWrap(true);

  let outbox = ss.getSheetByName(OUTBOX_SHEET_NAME);
  if (!outbox) {
    outbox = ss.insertSheet(OUTBOX_SHEET_NAME, 0);
    outbox.getRange('A1').setValue('');
    outbox.getRange('B1').setValue('updated_at');
  }
  if (outbox.getIndex() !== 1) {
    ss.setActiveSheet(outbox);
    ss.moveActiveSheet(1);
  }
  return { tweets: tweets, outbox: outbox };
}

function fetchJson(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'ChatFPL/1.0' },
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('FPL fetch failed ' + response.getResponseCode() + ' ' + url);
  }
  return JSON.parse(response.getContentText());
}

function resolvePlanningEvent(events) {
  const now = Date.now();
  const sorted = events.slice().sort(function (a, b) {
    return a.id - b.id;
  });
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.deadline_time && Date.parse(e.deadline_time) > now) {
      return e;
    }
  }
  const next = sorted.filter(function (e) {
    return e.is_next;
  })[0];
  if (next) {
    return next;
  }
  const current = sorted.filter(function (e) {
    return e.is_current;
  })[0];
  return current || sorted[0];
}

function buildFplContext() {
  const bootstrap = fetchJson(FPL_BOOTSTRAP_URL);
  const events = bootstrap.events || [];
  const teams = bootstrap.teams || [];
  const elements = bootstrap.elements || [];
  const planningEvent = resolvePlanningEvent(events);
  const gw = planningEvent.id;
  const teamShort = {};
  teams.forEach(function (t) {
    teamShort[t.id] = t.short_name;
  });
  const players = elements.map(function (e) {
    return {
      id: e.id,
      name: e.web_name,
      team: teamShort[e.team] || '',
      ep: parseFloat(e.ep_next) || 0,
      form: parseFloat(e.form) || 0,
      sel: parseFloat(e.selected_by_percent) || 0,
      ti: e.transfers_in_event || 0,
      to: e.transfers_out_event || 0,
      status: e.status,
      news: e.news || '',
      price: (e.now_cost / 10).toFixed(1),
      type: e.element_type,
      mins: e.minutes || 0,
      dc90: parseFloat(e.defensive_contribution_per_90) || 0,
      goals: e.goals_scored || 0,
      assists: e.assists || 0,
      pts: e.total_points || 0,
    };
  });
  return {
    planningEvent: planningEvent,
    gw: gw,
    players: players,
    deadlineMs: planningEvent.deadline_time ? Date.parse(planningEvent.deadline_time) : 0,
  };
}

function tweetCharLength(text) {
  return String(text).length;
}

/** Headline + as many green-circle bullets as fit in 280 (emoji counts as 2). */
function composeTweet(headline, bulletParts) {
  headline = String(headline || '').replace(/\s+/g, ' ').trim();
  const bullets = (bulletParts || [])
    .map(function (b) {
      return String(b).replace(/\s+/g, ' ').trim();
    })
    .filter(function (b) {
      return b;
    });

  let lines = [headline];
  for (let i = 0; i < bullets.length; i++) {
    const nextLine = BULLET_EMOJI + bullets[i];
    const candidate = lines.concat([nextLine]).join('\n');
    if (tweetCharLength(candidate) > MAX_TWEET_LENGTH) {
      break;
    }
    lines.push(nextLine);
  }

  let text = lines.join('\n');
  if (tweetCharLength(text) > MAX_TWEET_LENGTH) {
    text = text.slice(0, MAX_TWEET_LENGTH - 1) + '\u2026';
  }
  if (STRIP_URLS_FROM_TWEET) {
    text = text.replace(/https?:\/\/[^\s\n]+/gi, '').trim();
  }
  if (APPEND_LINK_LINE && text.indexOf(APPEND_LINK_LINE) === -1) {
    const extra = text ? text + '\n' + APPEND_LINK_LINE : APPEND_LINK_LINE;
    if (tweetCharLength(extra) <= MAX_TWEET_LENGTH) {
      text = extra;
    }
  }
  if (tweetCharLength(text) > MAX_TWEET_LENGTH) {
    throw new Error('Tweet still too long after trim: ' + tweetCharLength(text));
  }
  return text;
}

function formatDeadlineCountdown(deadlineMs) {
  const diff = Math.max(0, deadlineMs - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }
  return days + ':' + pad(hours) + ':' + pad(mins) + ':' + pad(secs);
}

function topBy(players, filterFn, sortFn, limit) {
  return players
    .filter(filterFn)
    .sort(sortFn)
    .slice(0, limit);
}

function generateTweetText(type, ctx) {
  const gw = ctx.gw;
  const gwLabel = 'GW' + gw;

  if (type === 'deadline') {
    return composeTweet(gwLabel + ' deadline countdown', [
      formatDeadlineCountdown(ctx.deadlineMs) + ' until the next FPL lock',
    ]);
  }

  if (type === 'xpts') {
    const top = topBy(
      ctx.players,
      function (p) {
        return p.ep > 0 && p.mins > 0;
      },
      function (a, b) {
        return b.ep - a.ep;
      },
      5,
    );
    return composeTweet(
      gwLabel + ' xPts leaders (next GW)',
      top.map(function (p) {
        return p.name + ' ' + p.ep + ' (' + p.team + ', £' + p.price + 'm)';
      }),
    );
  }

  if (type === 'transfers_in') {
    const top = topBy(
      ctx.players,
      function (p) {
        return p.ti > 0;
      },
      function (a, b) {
        return b.ti - a.ti;
      },
      4,
    );
    return composeTweet(
      gwLabel + ' most transferred in',
      top.map(function (p) {
        return p.name + ' +' + formatThousands(p.ti) + ' (' + p.team + ')';
      }),
    );
  }

  if (type === 'transfers_out') {
    const top = topBy(
      ctx.players,
      function (p) {
        return p.to > 0;
      },
      function (a, b) {
        return b.to - a.to;
      },
      4,
    );
    return composeTweet(
      gwLabel + ' most transferred out',
      top.map(function (p) {
        return p.name + ' -' + formatThousands(p.to) + ' (' + p.team + ')';
      }),
    );
  }

  if (type === 'captain') {
    const top = topBy(
      ctx.players,
      function (p) {
        return p.ep > 0;
      },
      function (a, b) {
        return b.ep - a.ep;
      },
      4,
    );
    return composeTweet(
      gwLabel + ' captain watch (xPts)',
      top.map(function (p) {
        return p.name + ' ' + p.ep + ' xPts, ' + p.sel + '% owned';
      }),
    );
  }

  if (type === 'differentials') {
    const top = topBy(
      ctx.players,
      function (p) {
        return p.ep >= 4 && p.sel < 12 && p.mins > 0;
      },
      function (a, b) {
        return b.ep - a.ep;
      },
      4,
    );
    return composeTweet(
      gwLabel + ' differentials rising',
      top.map(function (p) {
        return p.name + ' ' + p.ep + ' xPts, ' + p.sel + '% (' + p.team + ')';
      }),
    );
  }

  if (type === 'injuries') {
    const flagged = topBy(
      ctx.players,
      function (p) {
        return p.status !== 'a' && (p.news || p.status === 'i' || p.status === 'd');
      },
      function (a, b) {
        return b.sel - a.sel;
      },
      5,
    );
    return composeTweet(
      gwLabel + ' injury flags',
      flagged.map(function (p) {
        const bit = shortNews(p.news) || p.status.toUpperCase();
        return p.name + ' (' + p.team + '): ' + bit;
      }),
    );
  }

  if (type === 'defcon') {
    const top = topBy(
      ctx.players,
      function (p) {
        return (p.type === 2 || p.type === 3) && p.mins >= 90 && p.dc90 > 0;
      },
      function (a, b) {
        return b.dc90 - a.dc90;
      },
      4,
    );
    return composeTweet(
      gwLabel + ' DEFCON (DC/90)',
      top.map(function (p) {
        return p.name + ' ' + p.dc90.toFixed(1) + ' DC/90 (' + p.team + ')';
      }),
    );
  }

  if (type === 'compare') {
    return generateCompareTweet(ctx);
  }

  throw new Error('Unknown tweet type: ' + type);
}

function formatThousands(n) {
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'm';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(0) + 'k';
  }
  return String(n);
}

function shortNews(news) {
  const s = String(news || '').replace(/\s+/g, ' ').trim();
  if (!s) {
    return '';
  }
  return s.length > 42 ? s.slice(0, 39) + '...' : s;
}

function generateCompareTweet(ctx) {
  const gwLabel = 'GW' + ctx.gw;
  const pool = ctx.players.filter(function (p) {
    return p.mins > 180 && p.ep > 0;
  });
  if (pool.length < 2) {
    return composeTweet(gwLabel + ' player compare', ['Data updating for next GW']);
  }
  const metrics = [
    { key: 'ep', label: 'xPts', fmt: function (p) {
      return p.ep;
    } },
    { key: 'form', label: 'form', fmt: function (p) {
      return p.form;
    } },
    { key: 'goals', label: 'goals', fmt: function (p) {
      return p.goals;
    } },
    { key: 'assists', label: 'assists', fmt: function (p) {
      return p.assists;
    } },
    { key: 'pts', label: 'season pts', fmt: function (p) {
      return p.pts;
    } },
  ];
  const seed = ctx.gw * 1000 + new Date().getDate();
  const m = metrics[seed % metrics.length];
  pool.sort(function (a, b) {
    return b[m.key] - a[m.key];
  });
  const a = pool[0];
  const b = pool[1 + (seed % Math.min(5, pool.length - 1))];
  return composeTweet(gwLabel + ' ' + m.label + ' compare', [
    a.name + ' (' + a.team + ') ' + m.fmt(a),
    b.name + ' (' + b.team + ') ' + m.fmt(b),
  ]);
}

function appendTweetLog(sheet, text, type, gw) {
  const row = sheet.getLastRow() + 1;
  const now = new Date();
  sheet.getRange(row, COL_TWEET, 1, COL_GW).setValues([[text, 'YES', now, type, gw]]);
}

function publishFplScheduledTweet(type) {
  const ss = getSpreadsheet();
  const sheets = ensureSheets(ss);
  const ctx = buildFplContext();
  const text = generateTweetText(type, ctx);
  const now = new Date();

  sheets.outbox.getRange('A1').setValue(text);
  sheets.outbox.getRange('B1').setValue(now.toISOString());
  appendTweetLog(sheets.tweets, text, type, ctx.gw);
  SpreadsheetApp.flush();

  Logger.log(
    'Published ' + type + ' GW' + ctx.gw + ' (' + tweetCharLength(text) + ' chars) to Outbox',
  );
}

function setupFplTextTweetTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  FPL_TWEET_SLOTS.forEach(function (slot) {
    ScriptApp.newTrigger(slot.handler)
      .timeBased()
      .atHour(slot.hour)
      .nearMinute(slot.minute)
      .everyDays(1)
      .create();
  });

  Logger.log('Created ' + FPL_TWEET_SLOTS.length + ' FPL text tweet triggers (10:00-18:00 London).');
}

/** Run any slot manually: testFplTweet('deadline') */
function testFplTweet(type) {
  publishFplScheduledTweet(type);
}

function testFplTweetDeadline() {
  publishFplScheduledTweet('deadline');
}

function debugTextTweetSetup() {
  const ctx = buildFplContext();
  Logger.log('Planning GW' + ctx.gw + ' deadline ' + ctx.planningEvent.deadline_time);
  FPL_TWEET_SLOTS.forEach(function (slot) {
    const text = generateTweetText(slot.type, ctx);
    Logger.log(slot.hour + ':00 ' + slot.type + ' (' + tweetCharLength(text) + ' chars)');
  });
}

/** @deprecated Use setupFplTextTweetTriggers */
function setupTextTweetTriggers() {
  setupFplTextTweetTriggers();
}
