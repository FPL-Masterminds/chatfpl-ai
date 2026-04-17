// ─── /api/devchat ─────────────────────────────────────────────────────────────
// Identical to /api/chat but:
//   1. Restricted to ALLOWED_EMAIL only (dev sandbox)
//   2. Injects live r/FantasyPL Reddit context into the system prompt

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetFreeMessagesIfExpired } from "@/lib/reset-free-messages";
import {
  fixAssistantMarkdownPlayerPhotos,
  fplPhotoUrlFromElement,
  type FplPhotoRow,
} from "@/lib/fpl-player-photo";

export const runtime = "nodejs";

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com";

// ─── Reddit cache (30-minute module-level TTL) ────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let redditCache: { context: string; fetchedAt: number } | null = null;

const SUBREDDITS = [
  "FantasyPL",
  "fantasypremierleague",
];

async function fetchSubreddit(sub: string): Promise<string[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${sub}/hot.json?limit=5&raw_json=1`,
    { headers: { "User-Agent": "ChatFPL/1.0 (by /u/chatfpl)" } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const posts: any[] = data?.data?.children ?? [];
  const lines: string[] = [];

  for (const { data: post } of posts) {
    if (post.stickied) continue;
    const flair = post.link_flair_text ? `[${post.link_flair_text}] ` : "";
    const body = post.selftext
      ? ` — "${post.selftext.slice(0, 200).replace(/\n+/g, " ").trim()}…"`
      : "";
    lines.push(`• ${flair}${post.title} (↑${post.score})${body}`);
  }

  return lines;
}

async function getRedditContext(): Promise<string> {
  // Return cached version if still fresh
  if (redditCache && Date.now() - redditCache.fetchedAt < CACHE_TTL_MS) {
    return redditCache.context;
  }

  try {
    const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));

    const sections = SUBREDDITS.map((sub, i) =>
      results[i].length
        ? `r/${sub}:\n${results[i].join("\n")}`
        : null
    ).filter(Boolean);

    if (sections.length === 0) {
      redditCache = { context: "", fetchedAt: Date.now() };
      return "";
    }

    const context = `PRE-FETCHED REDDIT DATA — YOU DO NOT NEED TO BROWSE ANYTHING. THIS DATA HAS ALREADY BEEN RETRIEVED FOR YOU AND IS PASTED BELOW. TREAT IT AS GIVEN FACTS:

${sections.join("\n\n")}

CRITICAL INSTRUCTION: The Reddit posts above were fetched by the server moments ago and injected directly into this message. You already have this data — you do not need to browse the internet, visit any URLs, or disclaim that you cannot access Reddit. If the user asks what is trending on Reddit or what the top posts are, read the list above and report it back directly, citing post titles and upvote scores. Never say "I can't browse Reddit" — you have been given the data already.`;

    redditCache = { context, fetchedAt: Date.now() };
    return context;
  } catch {
    return ""; // silent fail — chat continues without Reddit data
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email || session.user.email !== ALLOWED_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        usageTracking: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          take: 1,
        },
        subscriptions: {
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUsage = await resetFreeMessagesIfExpired(user.id);
    let usage = updatedUsage || user.usageTracking[0];

    if (!usage) {
      const subscription = user.subscriptions[0];
      const plan = subscription?.plan.toLowerCase() || "free";
      let messagesLimit = 20;
      if (plan === "premium") messagesLimit = 100;
      else if (plan === "elite") messagesLimit = 500;
      else if (plan === "vip") messagesLimit = 999999;

      const now = new Date();
      usage = await prisma.usageTracking.create({
        data: {
          user_id: user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          messages_used: 0,
          messages_limit: messagesLimit,
        },
      });
    }

    const userFirstName = user.name?.split(" ")[0] || "there";

    if (usage.messages_used >= usage.messages_limit) {
      return NextResponse.json(
        { error: "Message limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // ── Fetch FPL data + Reddit context in parallel ──────────────────────────
    let fplContext = "";
    let photoRowsForFix: FplPhotoRow[] = [];

    const [redditContext] = await Promise.all([
      getRedditContext(),
      (async () => {
        try {
          const [fplResponse, fixturesResponse] = await Promise.all([
            fetch("https://fantasy.premierleague.com/api/bootstrap-static/"),
            fetch("https://fantasy.premierleague.com/api/fixtures/"),
          ]);

          if (fplResponse.ok && fixturesResponse.ok) {
            const fplData = await fplResponse.json();
            const fixturesData = await fixturesResponse.json();

            photoRowsForFix = (fplData.elements || []).map((p: any) => ({
              web_name: p.web_name,
              first_name: p.first_name,
              second_name: p.second_name,
              photoUrl: fplPhotoUrlFromElement(p.photo, p.code),
            }));

            const currentGameweek =
              fplData.events?.find((e: any) => e.is_current) || fplData.events?.[0];
            const nextGameweek = fplData.events?.find((e: any) => e.is_next);

            const allPlayers = fplData.elements?.map((p: any) => {
              const team = fplData.teams?.find((t: any) => t.id === p.team);
              const position = fplData.element_types?.find(
                (pt: any) => pt.id === p.element_type
              );
              const photoUrl = fplPhotoUrlFromElement(p.photo, p.code);
              const clubLabel = team ? `${team.name} (${team.short_name})` : "";
              const injuryNews = p.news ? `[${p.news}]` : "";
              return {
                formatted: `${p.web_name}|${p.first_name} ${p.second_name}|${clubLabel}|${position?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.total_points}pts|${p.form}form|${p.points_per_game}ppg|${p.selected_by_percent}%own|TI_GW:${p.transfers_in_event}|TO_GW:${p.transfers_out_event}|TI_Total:${p.transfers_in}|TO_Total:${p.transfers_out}|${p.minutes}min|xPNext:${p.ep_next}|xPThis:${p.ep_this}|G:${p.goals_scored}|A:${p.assists}|CS:${p.clean_sheets}|xG:${p.expected_goals}|xA:${p.expected_assists}|xGI:${p.expected_goal_involvements}|xGC:${p.expected_goals_conceded}|Bonus:${p.bonus}|BPS:${p.bps}|ICT:${p.ict_index}|Inf:${p.influence}|Cre:${p.creativity}|Thr:${p.threat}|YC:${p.yellow_cards}|RC:${p.red_cards}|Saves:${p.saves}|Pens:${p.penalties_saved}|PensMissed:${p.penalties_missed}|${p.status}|${p.chance_of_playing_next_round || 100}%fit${injuryNews}|${photoUrl}`,
                rawData: p,
                team: team?.short_name,
                position: position?.singular_name_short,
              };
            }) || [];

            const messageLower = message.toLowerCase();
            let filteredPlayers = allPlayers;
            let filterNote = "";

            const mentionedPlayers = allPlayers.filter(
              (p: any) =>
                messageLower.includes(p.rawData.web_name.toLowerCase()) ||
                messageLower.includes(p.rawData.first_name.toLowerCase()) ||
                messageLower.includes(p.rawData.second_name.toLowerCase())
            );

            if (mentionedPlayers.length > 0 && mentionedPlayers.length <= 5) {
              filteredPlayers = [
                ...mentionedPlayers,
                ...allPlayers
                  .filter((p: any) => !mentionedPlayers.includes(p))
                  .sort((a: any, b: any) => b.rawData.total_points - a.rawData.total_points)
                  .slice(0, 100),
              ];
              filterNote = "Focused on mentioned players plus top alternatives";
            } else if (
              messageLower.includes("differential") ||
              messageLower.includes("under the radar") ||
              messageLower.includes("hidden gem")
            ) {
              filteredPlayers = allPlayers
                .filter(
                  (p: any) =>
                    parseFloat(p.rawData.selected_by_percent) < 12 &&
                    parseFloat(p.rawData.form) > 3.0 &&
                    p.rawData.minutes > 200
                )
                .slice(0, 150);
              filterNote = "Showing players with <12% ownership, good form, and regular minutes";
            } else if (
              messageLower.includes("premium") ||
              messageLower.includes("expensive") ||
              messageLower.includes("high price")
            ) {
              filteredPlayers = allPlayers
                .filter((p: any) => p.rawData.now_cost >= 90)
                .slice(0, 100);
              filterNote = "Showing premium players (£9.0m+)";
            } else if (
              messageLower.includes("budget") ||
              messageLower.includes("cheap") ||
              messageLower.includes("enabler")
            ) {
              filteredPlayers = allPlayers
                .filter((p: any) => p.rawData.now_cost < 60)
                .slice(0, 150);
              filterNote = "Showing budget players (<£6.0m)";
            } else if (messageLower.includes("captain")) {
              filteredPlayers = allPlayers
                .filter(
                  (p: any) =>
                    p.rawData.total_points > 30 && parseFloat(p.rawData.form) > 4.0
                )
                .sort((a: any, b: any) => b.rawData.total_points - a.rawData.total_points)
                .slice(0, 120);
              filterNote = "Showing top captaincy options based on points and form";
            } else if (
              messageLower.includes("transfer") ||
              messageLower.includes("who to get") ||
              messageLower.includes("who should i bring in")
            ) {
              filteredPlayers = allPlayers
                .filter(
                  (p: any) =>
                    parseFloat(p.rawData.form) > 4.0 &&
                    p.rawData.total_points > 20 &&
                    p.rawData.status === "a"
                )
                .sort((a: any, b: any) => parseFloat(b.rawData.form) - parseFloat(a.rawData.form))
                .slice(0, 150);
              filterNote = "Showing in-form transfer targets";
            } else if (messageLower.match(/\b(gk|goalkeeper|keeper)\b/)) {
              filteredPlayers = allPlayers.filter((p: any) => p.position === "GKP").slice(0, 80);
              filterNote = "Showing goalkeepers only";
            } else if (messageLower.match(/\b(def|defender|defence|defense)\b/)) {
              filteredPlayers = allPlayers.filter((p: any) => p.position === "DEF").slice(0, 120);
              filterNote = "Showing defenders only";
            } else if (messageLower.match(/\b(mid|midfielder|midfield)\b/)) {
              filteredPlayers = allPlayers.filter((p: any) => p.position === "MID").slice(0, 150);
              filterNote = "Showing midfielders only";
            } else if (messageLower.match(/\b(fwd|forward|striker|attacker)\b/)) {
              filteredPlayers = allPlayers.filter((p: any) => p.position === "FWD").slice(0, 100);
              filterNote = "Showing forwards only";
            } else {
              filteredPlayers = allPlayers
                .filter(
                  (p: any) =>
                    p.rawData.total_points > 15 ||
                    parseFloat(p.rawData.form) > 4.0 ||
                    p.rawData.minutes > 300
                )
                .sort((a: any, b: any) => b.rawData.total_points - a.rawData.total_points)
                .slice(0, 150);
              filterNote = "Showing top 150 most relevant players (by points, form, and minutes)";
            }

            const currentGW = currentGameweek?.id || 1;

            let userTeamContext = "";
            if (user.fpl_team_id) {
              try {
                const [entryRes, picksRes, historyRes] = await Promise.all([
                  fetch(`https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/`, {
                    headers: { "User-Agent": "ChatFPL/1.0" },
                  }),
                  fetch(
                    `https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/event/${currentGW}/picks/`,
                    { headers: { "User-Agent": "ChatFPL/1.0" } }
                  ),
                  fetch(
                    `https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/history/`,
                    { headers: { "User-Agent": "ChatFPL/1.0" } }
                  ),
                ]);

                const entryData = entryRes.ok ? await entryRes.json() : null;
                const picksData = picksRes.ok ? await picksRes.json() : null;
                const historyData = historyRes.ok ? await historyRes.json() : null;

                if (entryData) {
                  const teamName = entryData.name || "Unknown";
                  const managerName =
                    `${entryData.player_first_name || ""} ${entryData.player_last_name || ""}`.trim();
                  const overallPoints = entryData.summary_overall_points ?? "?";
                  const overallRank =
                    (entryData.summary_overall_rank ?? "?").toLocaleString?.() ??
                    entryData.summary_overall_rank ??
                    "?";
                  const teamValue =
                    entryData.last_deadline_value != null
                      ? `£${(entryData.last_deadline_value / 10).toFixed(1)}m`
                      : "?";
                  const bank =
                    entryData.last_deadline_bank != null
                      ? `£${(entryData.last_deadline_bank / 10).toFixed(1)}m`
                      : "?";
                  const totalTransfers = entryData.last_deadline_total_transfers ?? "?";

                  const playedChips: any[] = historyData?.chips || entryData?.chips || [];
                  const chipsUsed: string[] = playedChips.map(
                    (c: any) => `${c.name} (GW${c.event})`
                  );
                  const usedNames: string[] = playedChips.map((c: any) => c.name);

                  const wildcardsUsed = usedNames.filter((n) => n === "wildcard").length;
                  const chipsAvailable: string[] = [];
                  if (wildcardsUsed < 2)
                    chipsAvailable.push(
                      `wildcard (${wildcardsUsed === 0 ? "both still available" : "1 used, 1 remaining"})`
                    );
                  if (!usedNames.includes("freehit")) chipsAvailable.push("freehit");
                  if (!usedNames.includes("bboost")) chipsAvailable.push("bboost (bench boost)");
                  if (!usedNames.includes("3xc")) chipsAvailable.push("3xc (triple captain)");

                  let squadSection = "";
                  if (picksData?.picks) {
                    const elementMap: { [key: number]: any } = {};
                    (fplData.elements || []).forEach((p: any) => {
                      elementMap[p.id] = p;
                    });

                    const formatPick = (pick: any): string | null => {
                      const p = elementMap[pick.element];
                      if (!p) return null;
                      const t = fplData.teams?.find((t: any) => t.id === p.team);
                      const pos = fplData.element_types?.find(
                        (pt: any) => pt.id === p.element_type
                      );
                      const flags = [
                        pick.is_captain ? "(C)" : "",
                        pick.is_vice_captain ? "(VC)" : "",
                        pick.multiplier === 3 ? "(3xC)" : "",
                      ]
                        .filter(Boolean)
                        .join("");
                      const injNote = p.news ? `|${p.news}` : "";
                      return `${p.web_name}${flags ? " " + flags : ""}|${t?.short_name}|${pos?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.form}form|${p.total_points}pts|${p.chance_of_playing_next_round ?? 100}%fit${injNote}`;
                    };

                    const startingXI = picksData.picks
                      .filter((p: any) => p.position <= 11)
                      .map(formatPick)
                      .filter(Boolean)
                      .join("\n");
                    const bench = picksData.picks
                      .filter((p: any) => p.position > 11)
                      .map(formatPick)
                      .filter(Boolean)
                      .join("\n");

                    const h = picksData.entry_history;
                    const gwStats = h
                      ? `GW${currentGW} points: ${h.points} | Transfers: ${h.event_transfers} (cost: ${h.event_transfers_cost}pts) | Points on bench: ${h.points_on_bench}`
                      : "";
                    const activeChip = picksData.active_chip
                      ? `Active chip this GW: ${picksData.active_chip}`
                      : "";

                    squadSection = `\nStarting XI:\n${startingXI}\n\nBench:\n${bench}\n\n${gwStats}${activeChip ? "\n" + activeChip : ""}`;
                  }

                  userTeamContext = `USER'S FPL TEAM (Team ID: ${user.fpl_team_id}):
Team: ${teamName} | Manager: ${managerName}
Overall Points: ${overallPoints} | Overall Rank: ${overallRank}
Team Value: ${teamValue} | Bank: ${bank} | Total Transfers Used: ${totalTransfers}
Chips Used: ${chipsUsed.length > 0 ? chipsUsed.join(", ") : "None yet"}
Chips Still Available: ${chipsAvailable.length > 0 ? chipsAvailable.join(", ") : "All used"}
${squadSection}

IMPORTANT: When the user asks about "my team", "my squad", "my captain", "my transfers", or anything personal, refer to the squad data above.
`;
                }
              } catch {
                // silent fail
              }
            }

            const upcomingFixtures = fixturesData.filter(
              (f: any) => f.event >= currentGW && f.event <= currentGW + 4 && !f.finished
            );

            const teamFixtures: { [key: string]: string[] } = {};
            fplData.teams?.forEach((team: any) => {
              const teamCode = team.short_name;
              teamFixtures[teamCode] = upcomingFixtures
                .filter((f: any) => f.team_h === team.id || f.team_a === team.id)
                .sort((a: any, b: any) => a.event - b.event)
                .slice(0, 5)
                .map((f: any) => {
                  const isHome = f.team_h === team.id;
                  const opponent = isHome
                    ? fplData.teams?.find((t: any) => t.id === f.team_a)
                    : fplData.teams?.find((t: any) => t.id === f.team_h);
                  const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
                  return `${opponent?.short_name || "TBC"}(${isHome ? "H" : "A"}-${difficulty})`;
                });
            });

            const fixtureRunsText = Object.entries(teamFixtures)
              .map(([team, fixtures]) => `${team}: ${fixtures.join(", ")}`)
              .join("\n");

            const formatDeadline = (isoString: string) => {
              const date = new Date(isoString);
              const ukDate = new Date(
                date.toLocaleString("en-GB", { timeZone: "Europe/London" })
              );
              const day = String(ukDate.getDate()).padStart(2, "0");
              const month = String(ukDate.getMonth() + 1).padStart(2, "0");
              const year = ukDate.getFullYear();
              const hours = String(ukDate.getHours()).padStart(2, "0");
              const minutes = String(ukDate.getMinutes()).padStart(2, "0");
              return `${day}-${month}-${year} ${hours}:${minutes}`;
            };

            fplContext = `LIVE FPL DATA (Updated: ${new Date().toISOString()}):

CURRENT GAMEWEEK: ${currentGameweek?.name || "Unknown"} (ID: ${currentGameweek?.id})
- Deadline: ${currentGameweek?.deadline_time ? formatDeadline(currentGameweek.deadline_time) : "Unknown"}
- Finished: ${currentGameweek?.finished ? "Yes" : "No"}

${nextGameweek ? `NEXT GAMEWEEK: ${nextGameweek.name} - Deadline: ${nextGameweek.deadline_time ? formatDeadline(nextGameweek.deadline_time) : "Unknown"}` : ""}

${userTeamContext ? userTeamContext + "\n" : ""}TEAM FIXTURE RUNS (Next 5 Gameweeks) - Format: OPPONENT(H/A-Difficulty):
${fixtureRunsText}

FILTERED PLAYER DATA (${filteredPlayers.length} players - ${filterNote}):
Format: WebName|FullName|ClubFullName (ShortCode)|Pos|Price|TotalPts|Form|PPG|Ownership%|TI_GW|TO_GW|TI_Total|TO_Total|Minutes|xPNext|xPThis|Goals|Assists|CleanSheets|xG|xA|xGI|xGC|Bonus|BPS|ICT|Inf|Cre|Thr|YellowCards|RedCards|Saves|PensSaved|PensMissed|Status|Fitness%|[InjuryNews]|PhotoURL
${filteredPlayers.map((p: any) => p.formatted).join("\n")}

TEAMS:
${fplData.teams?.map((t: any) => `${t.name} (${t.short_name})`).join(", ")}

FIELD EXPLANATIONS:
- xPNext = Expected points for NEXT gameweek (FPL official prediction)
- xPThis = Expected points for CURRENT gameweek
- xG = Expected goals this season (FPL/Opta data)
- xA = Expected assists this season
- xGI = Expected goal involvements (xG + xA combined)
- xGC = Expected goals conceded this season (useful for defenders/goalkeepers)
- TI_GW = Transfers IN this gameweek (trending players)
- TO_GW = Transfers OUT this gameweek
- Status: a=available, d=doubtful, i=injured, u=unavailable, s=suspended
- Fitness% = Chance of playing next round (0-100)

FIXTURE DIFFICULTY: 1=Easy, 2=Favorable, 3=Medium, 4=Tough, 5=Very Difficult. H=Home, A=Away.`;
          }
        } catch {
          // silent fail
        }
      })(),
    ]);

    // ── Build enhanced message with Reddit + FPL context ─────────────────────
    const formattingInstructions = `REDDIT USAGE (CRITICAL — READ THIS BEFORE ANSWERING):
- Reddit post data has been pre-fetched by the server and provided to you in this message. You already have it.
- NEVER say "I can't browse Reddit", "I don't have access to Reddit", or anything similar. That is factually wrong — the data is already in your context.
- When asked about Reddit posts, top threads, or community sentiment: read the PRE-FETCHED REDDIT DATA section above and report those specific posts back to the user, naming titles and upvote counts.
- Do not generalise or speak hypothetically. Use the actual posts you were given.

FORMATTING RULES:
- Format your response with clear paragraphs separated by TWO blank lines
- Use bullet points (•) for lists and multiple items
- Use HYPHENS (-) not em-dashes
- Keep each paragraph short (2-3 sentences max)
- IMPORTANT: When mentioning a player, ALWAYS include their photo using: ![Full Name Exactly As In Data](PhotoURL)
- PhotoURL MUST be copied character-for-character from the end of that player's row. Never invent or alter the URL.

FPL RULES (MANDATORY):
SQUAD: 2 GKP, 5 DEF, 5 MID, 3 FWD (15 total). Max 3 per club.
STARTING XI: 1 GKP + 10 outfield. Min 3 DEF, 2 MID, 1 FWD.
VALID FORMATIONS: 3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-2-3, 5-3-2, 5-4-1
POINTS: Goals GKP/DEF=6, MID=5, FWD=4. Assists=3. CS (60+ min) GKP/DEF=4, MID=1. Captain doubles.
TRANSFERS: 1 free/GW, max 2 rollover. Extra = -4pts each.

PERSONALITY:
- You are ChatFPL AI. Use "I" not "ChatFPL AI has..."
- User's name: ${userFirstName}. Use occasionally, not every message.
- British English: analyse, prioritise, favourite.
`;

    const combinedContext = [
      fplContext,
      redditContext,
    ].filter(Boolean).join("\n\n---\n\n");

    const enhancedMessage = combinedContext
      ? `${combinedContext}\n\n${formattingInstructions}\n---\n\nUser Question: ${message}`
      : `${formattingInstructions}\n---\n\nUser Question: ${message}`;

    // ── Dify API call ─────────────────────────────────────────────────────────
    const difyApiKey = process.env.DIFY_API_KEY;
    const difyBaseUrl = process.env.DIFY_BASE_URL || "https://api.dify.ai/v1";

    if (!difyApiKey) {
      return NextResponse.json({ error: "Dify API key not configured" }, { status: 500 });
    }

    let difyConversationId = "";
    if (conversationId) {
      const existingConv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { dify_conversation_id: true },
      });
      difyConversationId = existingConv?.dify_conversation_id || "";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let difyData: any;
    try {
      const difyResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${difyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: enhancedMessage,
          response_mode: "blocking",
          conversation_id: difyConversationId,
          user: user.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!difyResponse.ok) {
        return NextResponse.json(
          { error: "I'm having trouble processing your question right now. Please try again." },
          { status: 500 }
        );
      }

      difyData = await difyResponse.json();
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Your question is taking longer than expected. Please try a simpler question." },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    // ── Increment usage & save conversation ───────────────────────────────────
    await prisma.usageTracking.update({
      where: { id: usage.id },
      data: { messages_used: usage.messages_used + 1 },
    });

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user_id: user.id,
          title: message.substring(0, 50),
          dify_conversation_id: difyData.conversation_id || null,
        },
      });
    } else if (!conversation.dify_conversation_id && difyData.conversation_id) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { dify_conversation_id: difyData.conversation_id },
      });
    }

    await prisma.message.create({
      data: { conversation_id: conversation.id, role: "user", content: message },
    });

    const fixedAnswer = fixAssistantMarkdownPlayerPhotos(difyData.answer, photoRowsForFix);

    await prisma.message.create({
      data: { conversation_id: conversation.id, role: "assistant", content: fixedAnswer },
    });

    return NextResponse.json({
      answer: fixedAnswer,
      conversation_id: conversation.id,
      messages_used: usage.messages_used + 1,
      messages_limit: usage.messages_limit,
    });
  } catch (error: any) {
    console.error("Devchat API error:", error);
    return NextResponse.json(
      { error: "I'm having trouble answering right now. Please try again." },
      { status: 500 }
    );
  }
}
