const CACHE_TTL_MS = 30 * 60 * 1000;
const SUBREDDITS = ["FantasyPL", "fantasypremierleague"];

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

let redditCache: { context: string; fetchedAt: number } | null = null;

type RedditPost = { title: string; score: number; snippet: string; flair: string };

function parseRssPosts(xml: string): RedditPost[] {
  const posts: RedditPost[] = [];
  const items = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const item of items) {
    const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    if (!title) continue;
    const scoreMatch = item.match(/<media:community[^>]*score="(\d+)"/i);
    const score = scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 0;
    const snippet =
      item.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200) ?? "";
    posts.push({ title, score, snippet, flair: "" });
    if (posts.length >= 8) break;
  }
  return posts;
}

async function fetchSubredditJson(sub: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=8&raw_json=1`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error(`[Reddit] r/${sub} JSON returned HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  const posts: any[] = data?.data?.children ?? [];
  const lines: RedditPost[] = [];
  for (const { data: post } of posts) {
    if (post.stickied) continue;
    lines.push({
      title: post.title,
      score: post.score ?? 0,
      snippet: post.selftext ? post.selftext.slice(0, 200).replace(/\n+/g, " ").trim() : "",
      flair: post.link_flair_text ?? "",
    });
    if (lines.length >= 8) break;
  }
  return lines;
}

async function fetchSubredditRss(sub: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${sub}/hot/.rss?limit=8`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!res.ok) {
    console.error(`[Reddit] r/${sub} RSS returned HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();
  if (xml.includes("whoa there, pardner") || xml.includes("<!doctype html")) {
    console.error(`[Reddit] r/${sub} RSS blocked by network policy page`);
    return [];
  }
  return parseRssPosts(xml);
}

async function fetchSubreddit(sub: string): Promise<RedditPost[]> {
  try {
    const jsonPosts = await fetchSubredditJson(sub);
    if (jsonPosts.length > 0) {
      console.log(`[Reddit] r/${sub}: fetched ${jsonPosts.length} posts via JSON`);
      return jsonPosts;
    }
  } catch (err) {
    console.error(`[Reddit] r/${sub} JSON error:`, err);
  }

  try {
    const rssPosts = await fetchSubredditRss(sub);
    if (rssPosts.length > 0) {
      console.log(`[Reddit] r/${sub}: fetched ${rssPosts.length} posts via RSS`);
      return rssPosts;
    }
  } catch (err) {
    console.error(`[Reddit] r/${sub} RSS error:`, err);
  }

  return [];
}

function formatPosts(sub: string, posts: RedditPost[]): string {
  const lines = posts.map((post) => {
    const flair = post.flair ? `[${post.flair}] ` : "";
    const body = post.snippet ? ` - "${post.snippet}..."` : "";
    return `• ${flair}${post.title} (upvotes: ${post.score})${body}`;
  });
  return `r/${sub}:\n${lines.join("\n")}`;
}

export async function getRedditContext(): Promise<string> {
  if (redditCache && Date.now() - redditCache.fetchedAt < CACHE_TTL_MS) {
    return redditCache.context;
  }

  try {
    const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));
    const sections = SUBREDDITS.map((sub, i) =>
      results[i].length > 0 ? formatPosts(sub, results[i]) : null,
    ).filter(Boolean);

    if (sections.length === 0) {
      console.error("[Reddit] All subreddit fetches failed or returned empty");
      return "";
    }

    const context = `PRE-FETCHED REDDIT DATA - YOU DO NOT NEED TO BROWSE ANYTHING. THIS DATA HAS ALREADY BEEN RETRIEVED FOR YOU AND IS PASTED BELOW. TREAT IT AS GIVEN FACTS:

${sections.join("\n\n")}

CRITICAL INSTRUCTION: The Reddit posts above were fetched by the server and injected directly into this message. You already have this data. Never say "I can't browse Reddit". If asked what is trending on Reddit, read the list above and report it directly, citing post titles and upvote scores.`;

    redditCache = { context, fetchedAt: Date.now() };
    return context;
  } catch (err) {
    console.error("[Reddit] getRedditContext failed:", err);
    return "";
  }
}
