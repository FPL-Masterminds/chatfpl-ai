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

// ─── Reddit cache (30-minute module-level TTL) ────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000;
let redditCache: { context: string; fetchedAt: number } | null = null;
const SUBREDDITS = ["FantasyPL", "fantasypremierleague"];

async function fetchSubreddit(sub: string): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(
      `https://www.reddit.com/r/${sub}/hot.json?limit=8&raw_json=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ChatFPL/1.0; +https://chatfpl.ai)",
          "Accept": "application/json",
        },
        next: { revalidate: 0 },
      }
    );
  } catch (err) {
    console.error(`[Reddit] Network error fetching r/${sub}:`, err);
    return [];
  }
  if (!res.ok) {
    console.error(`[Reddit] r/${sub} returned HTTP ${res.status} ${res.statusText}`);
    return [];
  }
  let data: any;
  try {
    data = await res.json();
  } catch (err) {
    console.error(`[Reddit] Failed to parse JSON from r/${sub}:`, err);
    return [];
  }
  const posts: any[] = data?.data?.children ?? [];
  const lines: string[] = [];
  for (const { data: post } of posts) {
    if (post.stickied) continue;
    const flair = post.link_flair_text ? `[${post.link_flair_text}] ` : "";
    const body = post.selftext
      ? ` - "${post.selftext.slice(0, 200).replace(/\n+/g, " ").trim()}..."`
      : "";
    lines.push(`• ${flair}${post.title} (upvotes: ${post.score})${body}`);
  }
  console.log(`[Reddit] r/${sub}: fetched ${lines.length} posts`);
  return lines;
}

async function getRedditContext(): Promise<string> {
  if (redditCache && Date.now() - redditCache.fetchedAt < CACHE_TTL_MS) {
    return redditCache.context;
  }
  try {
    const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));
    const sections = SUBREDDITS.map((sub, i) =>
      results[i].length ? `r/${sub}:\n${results[i].join("\n")}` : null
    ).filter(Boolean);
    if (sections.length === 0) {
      redditCache = { context: "", fetchedAt: Date.now() };
      return "";
    }
    const context = `PRE-FETCHED REDDIT DATA — YOU DO NOT NEED TO BROWSE ANYTHING. THIS DATA HAS ALREADY BEEN RETRIEVED FOR YOU AND IS PASTED BELOW. TREAT IT AS GIVEN FACTS:

${sections.join("\n\n")}

CRITICAL INSTRUCTION: The Reddit posts above were fetched by the server and injected directly into this message. You already have this data — never say "I can't browse Reddit". If asked what is trending on Reddit, read the list above and report it directly, citing post titles and upvote scores.`;
    redditCache = { context, fetchedAt: Date.now() };
    return context;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user with usage tracking and subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        usageTracking: {
          orderBy: { id: 'desc' },
          take: 1,
        },
        subscriptions: {
          take: 1,
          orderBy: { id: 'desc' }
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.subscriptions[0]?.plan.toLowerCase() || 'free';
    const isFree = plan === 'free';
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let usage = user.usageTracking[0];

    if (isFree) {
      // Free tier: lifetime allowance — never create a new monthly row
      if (!usage) {
        usage = await prisma.usageTracking.create({
          data: {
            user_id: user.id,
            month: currentMonth,
            year: currentYear,
            messages_used: 0,
            messages_limit: 20,
          },
        });
        console.log(`Created lifetime usage tracking for free user ${user.id}`);
      }
    } else {
      // Paid tier: monthly allowance — create a fresh row each new month
      if (!usage || usage.month !== currentMonth || usage.year !== currentYear) {
        let messagesLimit = 100;
        if (plan === 'elite') messagesLimit = 500;
        else if (plan === 'vip') messagesLimit = 999999;

        usage = await prisma.usageTracking.create({
          data: {
            user_id: user.id,
            month: currentMonth,
            year: currentYear,
            messages_used: 0,
            messages_limit: messagesLimit,
          },
        });
        console.log(`Created monthly usage tracking for paid user ${user.id}: plan=${plan}, limit=${messagesLimit}`);
      }
    }
    
    const userFirstName = user.name?.split(' ')[0] || "there";

    // Check message limit
    if (usage.messages_used >= usage.messages_limit) {
      return NextResponse.json(
        { error: "Message limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Fetch Reddit context + FPL data in parallel
    const redditContext = await getRedditContext();

    let fplContext = "";
    let photoRowsForFix: FplPhotoRow[] = [];
    try {
      // Fetch both bootstrap data and fixtures
      const [fplResponse, fixturesResponse] = await Promise.all([
        fetch("https://fantasy.premierleague.com/api/bootstrap-static/"),
        fetch("https://fantasy.premierleague.com/api/fixtures/")
      ]);
      
      if (fplResponse.ok && fixturesResponse.ok) {
        const fplData = await fplResponse.json();
        const fixturesData = await fixturesResponse.json();

        // Full player list for post-processing model output (correct headshot URLs + alt matching)
        photoRowsForFix = (fplData.elements || []).map((p: any) => ({
          web_name: p.web_name,
          first_name: p.first_name,
          second_name: p.second_name,
          photoUrl: fplPhotoUrlFromElement(p.photo, p.code),
        }));
        
        // Extract key data
        const currentGameweek = fplData.events?.find((e: any) => e.is_current) || fplData.events?.[0];
        const nextGameweek = fplData.events?.find((e: any) => e.is_next);
        
        // Get ALL players first
        const allPlayers = fplData.elements?.map((p: any) => {
          const team = fplData.teams?.find((t: any) => t.id === p.team);
          const position = fplData.element_types?.find((pt: any) => pt.id === p.element_type);
          const photoUrl = fplPhotoUrlFromElement(p.photo, p.code);
          const clubLabel = team ? `${team.name} (${team.short_name})` : "";
          const injuryNews = p.news ? `[${p.news}]` : '';
            return {
            formatted: `${p.web_name}|${p.first_name} ${p.second_name}|${clubLabel}|${position?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.total_points}pts|${p.form}form|${p.points_per_game}ppg|${p.selected_by_percent}%own|TI_GW:${p.transfers_in_event}|TO_GW:${p.transfers_out_event}|TI_Total:${p.transfers_in}|TO_Total:${p.transfers_out}|${p.minutes}min|xPNext:${p.ep_next}|xPThis:${p.ep_this}|G:${p.goals_scored}|A:${p.assists}|CS:${p.clean_sheets}|xG:${p.expected_goals}|xA:${p.expected_assists}|xGI:${p.expected_goal_involvements}|xGC:${p.expected_goals_conceded}|Bonus:${p.bonus}|BPS:${p.bps}|ICT:${p.ict_index}|Inf:${p.influence}|Cre:${p.creativity}|Thr:${p.threat}|YC:${p.yellow_cards}|RC:${p.red_cards}|Saves:${p.saves}|Pens:${p.penalties_saved}|PensMissed:${p.penalties_missed}|${p.status}|${p.chance_of_playing_next_round || 100}%fit${injuryNews}|${photoUrl}`,
            rawData: p,
            team: team?.short_name,
            position: position?.singular_name_short
          };
        }) || [];

        // Smart filtering based on question keywords
        const messageLower = message.toLowerCase();
        let filteredPlayers = allPlayers;
        let filterNote = "";

        // Detect comprehensive preview / newsletter-style questions — slim the payload
        const isNewsletterMode = (
          messageLower.includes('preview report') ||
          messageLower.includes('newsletter') ||
          messageLower.includes('preview') ||
          messageLower.includes('executive summary') ||
          (messageLower.includes('double gameweek') && messageLower.includes('differential') && messageLower.includes('captain'))
        );

        // Check for specific player names mentioned (skip in newsletter mode)
        const mentionedPlayers = isNewsletterMode ? [] : allPlayers.filter(p =>
          messageLower.includes(p.rawData.web_name.toLowerCase()) ||
          messageLower.includes(p.rawData.first_name.toLowerCase()) ||
          messageLower.includes(p.rawData.second_name.toLowerCase())
        );

        if (isNewsletterMode) {
          // For broad reports, send only the top 80 most relevant players to leave
          // room for a long structured response and avoid hitting model token limits.
          filteredPlayers = allPlayers
            .filter(p =>
              p.rawData.total_points > 30 ||
              parseFloat(p.rawData.form) > 5.0 ||
              parseFloat(p.rawData.selected_by_percent) > 15
            )
            .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
            .slice(0, 80);
          filterNote = `Newsletter/preview mode: top 80 players by relevance (points, form, ownership)`;
        }
        else if (mentionedPlayers.length > 0 && mentionedPlayers.length <= 5) {
          // User asked about specific players - send those + top alternatives
          filteredPlayers = [
            ...mentionedPlayers,
            ...allPlayers
              .filter(p => !mentionedPlayers.includes(p))
              .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
              .slice(0, 100)
          ];
          filterNote = `Focused on mentioned players plus top alternatives`;
        }
        else if (messageLower.includes('differential') || messageLower.includes('under the radar') || messageLower.includes('hidden gem')) {
          // Differentials: Low ownership (<12%), decent form, playing regularly
          filteredPlayers = allPlayers.filter(p => 
            parseFloat(p.rawData.selected_by_percent) < 12 &&
            parseFloat(p.rawData.form) > 3.0 &&
            p.rawData.minutes > 200
          ).slice(0, 150);
          filterNote = `Showing players with <12% ownership, good form, and regular minutes`;
        }
        else if (messageLower.includes('premium') || messageLower.includes('expensive') || messageLower.includes('high price')) {
          // Premium players: £9.0m+
          filteredPlayers = allPlayers.filter(p => p.rawData.now_cost >= 90).slice(0, 100);
          filterNote = `Showing premium players (£9.0m+)`;
        }
        else if (messageLower.includes('budget') || messageLower.includes('cheap') || messageLower.includes('enabler')) {
          // Budget players: <£6.0m
          filteredPlayers = allPlayers.filter(p => p.rawData.now_cost < 60).slice(0, 150);
          filterNote = `Showing budget players (<£6.0m)`;
        }
        else if (messageLower.includes('captain')) {
          // Captain picks: High points, good form, playing regularly
          filteredPlayers = allPlayers
            .filter(p => p.rawData.total_points > 30 && parseFloat(p.rawData.form) > 4.0)
            .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
            .slice(0, 120);
          filterNote = `Showing top captaincy options based on points and form`;
        }
        else if (messageLower.includes('transfer') || messageLower.includes('who to get') || messageLower.includes('who should i bring in')) {
          // Transfer targets: Good form, decent points, available
          filteredPlayers = allPlayers
            .filter(p => 
              parseFloat(p.rawData.form) > 4.0 &&
              p.rawData.total_points > 20 &&
              p.rawData.status === 'a'
            )
            .sort((a, b) => parseFloat(b.rawData.form) - parseFloat(a.rawData.form))
            .slice(0, 150);
          filterNote = `Showing in-form transfer targets`;
        }
        else if (messageLower.match(/\b(gk|goalkeeper|keeper)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'GKP').slice(0, 80);
          filterNote = `Showing goalkeepers only`;
        }
        else if (messageLower.match(/\b(def|defender|defence|defense)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'DEF').slice(0, 120);
          filterNote = `Showing defenders only`;
        }
        else if (messageLower.match(/\b(mid|midfielder|midfield)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'MID').slice(0, 150);
          filterNote = `Showing midfielders only`;
        }
        else if (messageLower.match(/\b(fwd|forward|striker|attacker)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'FWD').slice(0, 100);
          filterNote = `Showing forwards only`;
        }
        else {
          // General question: Send top 150 most relevant players
          filteredPlayers = allPlayers
            .filter(p => 
              p.rawData.total_points > 15 || 
              parseFloat(p.rawData.form) > 4.0 ||
              p.rawData.minutes > 300
            )
            .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
            .slice(0, 150);
          filterNote = `Showing top 150 most relevant players (by points, form, and minutes)`;
        }

        // Get upcoming fixtures grouped by team (next 5 gameweeks)
        const currentGW = currentGameweek?.id || 1;

        // Fetch user's personal FPL team data if they have saved a Team ID
        let userTeamContext = "";
        if (user.fpl_team_id) {
          try {
            const [entryRes, picksRes, historyRes] = await Promise.all([
              fetch(`https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/`, {
                headers: { "User-Agent": "ChatFPL/1.0" },
              }),
              fetch(`https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/event/${currentGW}/picks/`, {
                headers: { "User-Agent": "ChatFPL/1.0" },
              }),
              fetch(`https://fantasy.premierleague.com/api/entry/${user.fpl_team_id}/history/`, {
                headers: { "User-Agent": "ChatFPL/1.0" },
              }),
            ]);

            const entryData = entryRes.ok ? await entryRes.json() : null;
            const picksData = picksRes.ok ? await picksRes.json() : null;
            const historyData = historyRes.ok ? await historyRes.json() : null;

            if (entryData) {
              const teamName = entryData.name || "Unknown";
              const managerName = `${entryData.player_first_name || ""} ${entryData.player_last_name || ""}`.trim();
              const overallPoints = entryData.summary_overall_points ?? "?";
              const overallRank = (entryData.summary_overall_rank ?? "?").toLocaleString?.() ?? entryData.summary_overall_rank ?? "?";
              const teamValue = entryData.last_deadline_value != null ? `£${(entryData.last_deadline_value / 10).toFixed(1)}m` : "?";
              const bank = entryData.last_deadline_bank != null ? `£${(entryData.last_deadline_bank / 10).toFixed(1)}m` : "?";
              const totalTransfers = entryData.last_deadline_total_transfers ?? "?";

              // Use history endpoint for chip data — it's the reliable source
              const playedChips: any[] = historyData?.chips || entryData?.chips || [];
              const chipsUsed: string[] = playedChips.map((c: any) => `${c.name} (GW${c.event})`);
              const usedNames: string[] = playedChips.map((c: any) => c.name);

              // Wildcards: managers get 2 per season — track usage count
              const wildcardsUsed = usedNames.filter((n) => n === "wildcard").length;
              const chipsAvailable: string[] = [];
              if (wildcardsUsed < 2) chipsAvailable.push(`wildcard (${wildcardsUsed === 0 ? "both still available" : "1 used, 1 remaining"})`);
              if (!usedNames.includes("freehit")) chipsAvailable.push("freehit");
              if (!usedNames.includes("bboost")) chipsAvailable.push("bboost (bench boost)");
              if (!usedNames.includes("3xc")) chipsAvailable.push("3xc (triple captain)");

              let squadSection = "";
              if (picksData?.picks) {
                const elementMap: { [key: number]: any } = {};
                (fplData.elements || []).forEach((p: any) => { elementMap[p.id] = p; });

                const formatPick = (pick: any): string | null => {
                  const p = elementMap[pick.element];
                  if (!p) return null;
                  const t = fplData.teams?.find((t: any) => t.id === p.team);
                  const pos = fplData.element_types?.find((pt: any) => pt.id === p.element_type);
                  const flags = [
                    pick.is_captain ? "(C)" : "",
                    pick.is_vice_captain ? "(VC)" : "",
                    pick.multiplier === 3 ? "(3xC)" : "",
                  ].filter(Boolean).join("");
                  const injNote = p.news ? `|${p.news}` : "";
                  return `${p.web_name}${flags ? " " + flags : ""}|${t?.short_name}|${pos?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.form}form|${p.total_points}pts|${p.chance_of_playing_next_round ?? 100}%fit${injNote}`;
                };

                const startingXI = picksData.picks.filter((p: any) => p.position <= 11).map(formatPick).filter(Boolean).join("\n");
                const bench = picksData.picks.filter((p: any) => p.position > 11).map(formatPick).filter(Boolean).join("\n");

                const h = picksData.entry_history;
                const gwStats = h
                  ? `GW${currentGW} points: ${h.points} | Transfers: ${h.event_transfers} (cost: ${h.event_transfers_cost}pts) | Points on bench: ${h.points_on_bench}`
                  : "";
                const activeChip = picksData.active_chip ? `Active chip this GW: ${picksData.active_chip}` : "";

                squadSection = `
Starting XI:
${startingXI}

Bench:
${bench}

${gwStats}${activeChip ? "\n" + activeChip : ""}`;
              }

              userTeamContext = `USER'S FPL TEAM (Team ID: ${user.fpl_team_id}):
Team: ${teamName} | Manager: ${managerName}
Overall Points: ${overallPoints} | Overall Rank: ${overallRank}
Team Value: ${teamValue} | Bank: ${bank} | Total Transfers Used: ${totalTransfers}
Chips Used: ${chipsUsed.length > 0 ? chipsUsed.join(", ") : "None yet"}
Chips Still Available: ${chipsAvailable.length > 0 ? chipsAvailable.join(", ") : "All used"}
${squadSection}

IMPORTANT: When the user asks about "my team", "my squad", "my captain", "my transfers", or anything personal, refer to the squad data above. Use their actual picks and stats to give personalised advice.
`;
            }
          } catch (teamErr) {
            console.error("FPL team data fetch error:", teamErr);
            // Silent fail - chat continues without team data
          }
        }
        const upcomingFixtures = fixturesData.filter((f: any) => 
          f.event >= currentGW && f.event <= currentGW + 4 && !f.finished
        );

        // Build fixture run for each team
        const teamFixtures: { [key: string]: string[] } = {};
        
        fplData.teams?.forEach((team: any) => {
          const teamCode = team.short_name;
          const fixtures = upcomingFixtures
            .filter((f: any) => f.team_h === team.id || f.team_a === team.id)
            .sort((a: any, b: any) => a.event - b.event)
            .slice(0, 5)
            .map((f: any) => {
              const isHome = f.team_h === team.id;
              const opponent = isHome 
                ? fplData.teams?.find((t: any) => t.id === f.team_a)
                : fplData.teams?.find((t: any) => t.id === f.team_h);
              const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
              return `${opponent?.short_name || 'TBC'}(${isHome ? 'H' : 'A'}-${difficulty})`;
            });
          
          teamFixtures[teamCode] = fixtures;
        });

        const fixtureRunsText = Object.entries(teamFixtures)
          .map(([team, fixtures]) => `${team}: ${fixtures.join(', ')}`)
          .join('\n');

        // Explicit DGW detection — teams with 2+ fixtures in the current GW
        const currentGWId = currentGameweek?.id;
        const dgwTeams = currentGWId
          ? (fplData.teams ?? []).filter((team: any) =>
              fixturesData.filter((f: any) =>
                f.event === currentGWId &&
                (f.team_h === team.id || f.team_a === team.id)
              ).length >= 2
            ).map((t: any) => t.name)
          : [];
        const dgwNote = dgwTeams.length > 0
          ? `\nDOUBLE GAMEWEEK ${currentGWId} TEAMS (each has TWO fixtures this week): ${dgwTeams.join(', ')}\n`
          : '';

        // Explicit BGW detection — teams with ZERO fixtures in the current GW
        const bgwTeams = currentGWId
          ? (fplData.teams ?? []).filter((team: any) =>
              fixturesData.filter((f: any) =>
                f.event === currentGWId &&
                (f.team_h === team.id || f.team_a === team.id)
              ).length === 0
            ).map((t: any) => t.name)
          : [];
        const bgwNote = bgwTeams.length > 0
          ? `\nBLANK GAMEWEEK ${currentGWId} TEAMS (NO fixture scheduled this week — xPNext will be 0.0): ${bgwTeams.join(', ')}\n`
          : '';

        console.log('=== FIXTURE DATA DEBUG ===');
        console.log('Total fixtures fetched:', fixturesData.length);
        console.log('Current GW:', currentGW);
        console.log('Filtered fixtures count:', upcomingFixtures.length);
        console.log('Arsenal fixtures:', teamFixtures['ARS']);
        console.log('Fixture runs text length:', fixtureRunsText.length);
        console.log('DGW teams:', dgwTeams);
        console.log('BGW teams:', bgwTeams);
        console.log('=== END DEBUG ===');

        // Format deadline to UK format (DD-MM-YYYY HH:mm in UK time)
        const formatDeadline = (isoString: string) => {
          const date = new Date(isoString);
          // Convert to UK time
          const ukDate = new Date(date.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
          const day = String(ukDate.getDate()).padStart(2, '0');
          const month = String(ukDate.getMonth() + 1).padStart(2, '0');
          const year = ukDate.getFullYear();
          const hours = String(ukDate.getHours()).padStart(2, '0');
          const minutes = String(ukDate.getMinutes()).padStart(2, '0');
          return `${day}-${month}-${year} ${hours}:${minutes}`;
        };

        // Build context string with filtered players
        fplContext = `LIVE FPL DATA (Updated: ${new Date().toISOString()}):

CURRENT GAMEWEEK: ${currentGameweek?.name || "Unknown"} (ID: ${currentGameweek?.id})
- Deadline: ${currentGameweek?.deadline_time ? formatDeadline(currentGameweek.deadline_time) : 'Unknown'}
- Finished: ${currentGameweek?.finished ? "Yes" : "No"}

${nextGameweek ? `NEXT GAMEWEEK: ${nextGameweek.name} - Deadline: ${nextGameweek.deadline_time ? formatDeadline(nextGameweek.deadline_time) : 'Unknown'}` : ""}

${userTeamContext ? userTeamContext + "\n" : ""}${dgwNote}${bgwNote}TEAM FIXTURE RUNS (Next 5 Gameweeks) - Format: OPPONENT(H/A-Difficulty):
${fixtureRunsText}

FILTERED PLAYER DATA (${filteredPlayers.length} players - ${filterNote}):
Format: WebName|FullName|ClubFullName (ShortCode)|Pos|Price|TotalPts|Form|PPG|Ownership%|TI_GW|TO_GW|TI_Total|TO_Total|Minutes|xPNext|xPThis|Goals|Assists|CleanSheets|xG|xA|xGI|xGC|Bonus|BPS|ICT|Inf|Cre|Thr|YellowCards|RedCards|Saves|PensSaved|PensMissed|Status|Fitness%|[InjuryNews]|PhotoURL
${filteredPlayers.map(p => p.formatted).join("\n")}

TEAMS:
${fplData.teams?.map((t: any) => `${t.name} (${t.short_name})`).join(", ")}

FIELD EXPLANATIONS:
- xPNext = Expected points for NEXT gameweek (FPL's official prediction) — always use this for forward-looking recommendations. CRITICAL: if xPNext is 0.0 for a player, it means their club has a BLANK GAMEWEEK and they will score 0 points this week — do NOT recommend them for captaincy or transfer in regardless of their form or ownership.
- xPThis = Expected points for the CURRENT gameweek (FPL's official prediction). IMPORTANT: once a gameweek has concluded, the FPL API resets this field to 0.0 — that value simply means the gameweek is over or the player had no remaining fixture that round. A value of 0.0 does NOT mean the player performed poorly, had a blank, or was injured. Never interpret xPThis=0.0 as negative; always rely on xPNext for upcoming gameweek predictions.
- TI_GW = Transfers IN this gameweek (shows trending players)
- TO_GW = Transfers OUT this gameweek (shows who managers are selling)
- TI_Total = Total transfers IN this season
- TO_Total = Total transfers OUT this season
- Ownership% = Percentage of teams that own this player
- Goals/Assists/CleanSheets = Actual stats this season
- xG = Expected goals this season (from FPL/Opta data)
- xA = Expected assists this season
- xGI = Expected goal involvements (xG + xA combined)
- xGC = Expected goals conceded this season (useful for defenders and goalkeepers)
- ICT = ICT Index (combination of Influence, Creativity, Threat)
- BPS = Bonus Points System score (determines bonus point allocation)
- Inf/Cre/Thr = Individual ICT components (higher = better)
- Minutes = Total minutes played this season
- YC/RC = Yellow/Red cards this season
- Saves/Pens/PensMissed = Goalkeeper/penalty stats
- Status: a=available, d=doubtful, i=injured, u=unavailable, s=suspended
- Fitness% = Chance of playing next round (0-100)
- [InjuryNews] = Latest injury/availability news if any

FIXTURE DIFFICULTY: 1=Easy, 2=Favorable, 3=Medium, 4=Tough, 5=Very Difficult. H=Home, A=Away.

You now have access to FPL expected points predictions, ownership trends (transfers in/out this GW and total season), actual performance stats (goals, assists, minutes, clean sheets), bonus/ICT data, injury updates, and disciplinary records. Use this live data to answer the user's question accurately. Check team fixtures and transfer trends before recommending players. All data is current as of today.

DATA INTEGRITY (MANDATORY):
- Use ONLY club names, prices, stats, and PhotoURL values from the pipe-delimited rows above. Do not substitute clubs or numbers from memory or older seasons.
- PhotoURL is always the final field after the last pipe (|) on each player row. Copy that URL exactly into markdown images — never guess or reconstruct image links.
- For markdown images use the player's real full name in the alt text (e.g. ![Jacob Ramsey](PhotoURL)) so the name matches the row you used for stats.
- If a player does not appear in the filtered rows, say they are not in the current excerpt and ask to narrow the question — do not invent stats or photos.
- DATA SOURCES AVAILABLE: FPL API data (players, fixtures, ownership, xG/xA, injuries from the news field) and Reddit hot posts from r/FantasyPL. Press conference transcripts, external news sites, and detailed midweek injury updates are NOT available — if asked for these, state clearly what data you do and do not have, then work with what you have.`;
      }
    } catch (fplError) {
      console.error("FPL API fetch error:", fplError);
      // Continue without FPL data if fetch fails
    }

    // Call Dify API
    const difyApiKey = process.env.DIFY_API_KEY;
    const difyBaseUrl = process.env.DIFY_BASE_URL || "https://api.dify.ai/v1";

    if (!difyApiKey) {
      return NextResponse.json(
        { error: "Dify API key not configured" },
        { status: 500 }
      );
    }

                // Append FPL data and formatting instructions to the user's message
                const formattingInstructions = `FORMATTING RULES:
- Format your response with clear paragraphs separated by TWO blank lines
- Use bullet points (•) for lists and multiple items
- Add a blank line between each major section or topic
- Use HYPHENS (-) not em-dashes when writing (e.g., "Man City (FWD)" not "Man City — FWD")
- Keep each paragraph short (2-3 sentences max)
- Add extra spacing between different players or topics for readability
- Make comparisons easy to read with clear formatting and spacing
- IMPORTANT: When mentioning a player, ALWAYS include their photo using: ![Full Name Exactly As In Data](PhotoURL)
- PhotoURL MUST be copied character-for-character from the end of that player's row in LIVE FPL DATA (final field after the last |). Never invent, shorten, or alter the URL.
- Example shape: "![Mohamed Salah](PASTE_EXACT_PhotoURL_FROM_ROW) Mohamed Salah is in great form..."


FPL RULES (MANDATORY - never contradict or guess at these):

SQUAD COMPOSITION (15 players total):
- 2 Goalkeepers (GKP), 5 Defenders (DEF), 5 Midfielders (MID), 3 Forwards (FWD)
- Maximum 3 players from any single Premier League club

STARTING XI (always exactly 1 GKP + 10 outfield players):
- Minimum 3 DEF, minimum 2 MID, minimum 1 FWD - these are hard limits
- VALID formations (DEF-MID-FWD): 3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-2-3, 5-3-2, 5-4-1
- INVALID: anything with fewer than 3 DEF, fewer than 2 MID, or fewer than 1 FWD
- 4 bench players: 1 GKP + 3 outfield in priority order
- Never swap a player into a position that violates the minimums above

FORMATION RULES (use when simulating or suggesting lineups):
- 3-4-3 = 3 DEF, 4 MID, 3 FWD (VALID)
- 3-5-2 = 3 DEF, 5 MID, 2 FWD (VALID)
- 4-3-3 = 4 DEF, 3 MID, 3 FWD (VALID)
- 4-4-2 = 4 DEF, 4 MID, 2 FWD (VALID)
- 4-5-1 = 4 DEF, 5 MID, 1 FWD (VALID)
- 5-2-3 = 5 DEF, 2 MID, 3 FWD (VALID)
- 5-3-2 = 5 DEF, 3 MID, 2 FWD (VALID)
- 5-4-1 = 5 DEF, 4 MID, 1 FWD (VALID)
- If user plays 5 MID they must have exactly 3 DEF and 2 FWD
- If user plays 5 DEF bench a MID or FWD, never a DEF
- Never tell a user their formation is illegal if it is in the valid list above
- When simulating a lineup always validate the formation before presenting it

BLANK AND DOUBLE GAMEWEEKS (MANDATORY — never violate these rules):
- Any player whose club appears in the BLANK GAMEWEEK TEAMS list above has NO fixture and will score 0 points this week.
- NEVER recommend a player from a BLANK GAMEWEEK team as captain, vice-captain, or a transfer in for the current gameweek. State clearly they have a blank gameweek and suggest alternatives.
- If the user asks about captaining a blank gameweek player (e.g. Haaland when Man City blank), explicitly tell them that player cannot score points this week and name alternative captains.
- Players from DOUBLE GAMEWEEK teams have TWO fixtures and double their scoring opportunities — they are strong captain and transfer targets.
- Always check the BLANK GAMEWEEK TEAMS and DOUBLE GAMEWEEK TEAMS sections above before making any captaincy or transfer recommendation.

POINTS SCORING:
- Goals: GKP/DEF=6pts, MID=5pts, FWD=4pts
- Assists: 3pts for all positions
- Clean sheet (60+ mins): GKP/DEF=4pts, MID=1pt
- Appearance: less than 60 mins=1pt, 60+ mins=2pts
- Yellow card: -1pt, Red card: -3pts
- Captain scores double, Vice-captain doubles only if captain does not play

TRANSFERS:
- 1 free transfer per GW, rolls over to max 2 if unused
- Each additional transfer costs 4 points (a hit)
- Wildcard: unlimited free transfers, squad changes are permanent
- Free Hit: unlimited transfers for one GW only, squad reverts next GW
- Bench Boost: all bench players score points this GW
- Triple Captain: captain scores triple instead of double this GW

PERSONALITY RULES:
- You are ChatFPL AI, a friendly FPL assistant
- Use first person ("I", "I've", "I'll", "me") when referring to yourself in responses
- NEVER say "ChatFPL AI has analyzed" or "ChatFPL AI will help" - say "I've analysed" or "I'll help"
- Don't repeatedly introduce yourself in every response - just get straight to helping
- The user's name is ${userFirstName}
- Use ${userFirstName}'s name occasionally (about 1 in 4 responses) to keep the conversation personal and friendly
- Don't overuse their name - be natural and conversational
- Examples: "Great question, ${userFirstName}!" or "${userFirstName}, here's what the data shows..." or "Let me help you with that, ${userFirstName}."
- Use BRITISH ENGLISH spelling: analyse (not analyze), prioritise (not prioritize), favourite (not favorite), etc.

`;
                
                const redditInstruction = redditContext ? `REDDIT USAGE (CRITICAL - READ THIS):
- Reddit post data has already been fetched by the server and injected into this message above. You have it right now.
- NEVER say "I don't have Reddit data", "I can't browse Reddit", or "Reddit isn't in the data you gave me". That is factually wrong - it IS in this message.
- When asked about Reddit, scan the PRE-FETCHED REDDIT DATA section above and report the post titles, upvote counts, and topics directly.
- You do not need to browse anything. The data is already here.

` : `REDDIT NOTE: No Reddit data was fetched for this request (fetch failed or returned empty). Do not claim you have Reddit data you don't have - tell the user Reddit posts could not be retrieved this time.

`;

                const combinedContext = [fplContext, redditContext].filter(Boolean).join("\n\n---\n\n");

                const enhancedMessage = combinedContext
                  ? `${combinedContext}\n\n${redditInstruction}${formattingInstructions}\n---\n\nUser Question: ${message}`
                  : `${formattingInstructions}\n---\n\nUser Question: ${message}`;

    console.log('=== DIFY PAYLOAD DEBUG ===');
    console.log('Enhanced message length:', enhancedMessage.length);
    console.log('FPL context length:', fplContext.length);
    console.log('First 500 chars of enhanced message:', enhancedMessage.substring(0, 500));
    console.log('=== END PAYLOAD DEBUG ===');

    // Resolve the Dify-side conversation ID so threading works correctly.
    let difyConversationId = "";
    if (conversationId) {
      const existingConv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { dify_conversation_id: true },
      });
      difyConversationId = existingConv?.dify_conversation_id || "";
    }

    // ── Streaming Dify call ────────────────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let difyResponse: Response;
    try {
      difyResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${difyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: enhancedMessage,
          response_mode: "streaming",
          conversation_id: difyConversationId,
          user: user.id,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Your question is taking longer than expected. Try breaking it into smaller parts - for example, ask about DGW teams first, then player recommendations separately." },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!difyResponse.ok || !difyResponse.body) {
      try {
        const errData = await difyResponse.json();
        console.error("Dify error:", difyResponse.status, errData);
      } catch {}
      return NextResponse.json(
        { error: "I'm having trouble right now. Please try again in a moment." },
        { status: 500 }
      );
    }

    // ── Forward Dify SSE stream to client ─────────────────────────────────
    const difyBody = difyResponse.body;
    const enc = new TextEncoder();

    const stream = new ReadableStream({
      async start(ctrl) {
        const reader = difyBody.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let fullAnswer = "";
        let difyConvIdFinal = difyConversationId;

        const send = (obj: object) =>
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json || json === "[DONE]") continue;
              try {
                const evt = JSON.parse(json);
                if (evt.event === "message" || evt.event === "agent_message") {
                  const chunk: string = evt.answer ?? "";
                  fullAnswer += chunk;
                  if (chunk) send({ type: "chunk", text: chunk });
                  if (evt.conversation_id) difyConvIdFinal = evt.conversation_id;
                } else if (evt.event === "message_end") {
                  if (evt.conversation_id) difyConvIdFinal = evt.conversation_id;
                } else if (evt.event === "error") {
                  throw new Error(evt.message || "Dify stream error");
                }
              } catch { /* skip malformed SSE lines */ }
            }
          }

          // Fix hallucinated player photo URLs in the accumulated response
          const fixedAnswer = fixAssistantMarkdownPlayerPhotos(fullAnswer, photoRowsForFix);

          // ── DB operations (run after stream completes) ─────────────────
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
                dify_conversation_id: difyConvIdFinal || null,
              },
            });
          } else if (!conversation.dify_conversation_id && difyConvIdFinal) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { dify_conversation_id: difyConvIdFinal },
            });
          }

          await prisma.message.create({
            data: { conversation_id: conversation.id, role: "user", content: message },
          });
          await prisma.message.create({
            data: { conversation_id: conversation.id, role: "assistant", content: fixedAnswer },
          });

          send({
            type: "done",
            conversation_id: conversation.id,
            messages_used: usage.messages_used + 1,
            messages_limit: usage.messages_limit,
          });
        } catch (err: any) {
          console.error("Streaming error:", err);
          send({ type: "error", message: "Something went wrong generating your response. Please try again." });
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    // Professional, user-friendly error message
    const userMessage = "I'm having trouble answering your question right now. Please try:\n\n• Refreshing the page and asking again\n• Checking your internet connection\n• Simplifying your question\n\nIf the issue persists, please contact our support team.";
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

