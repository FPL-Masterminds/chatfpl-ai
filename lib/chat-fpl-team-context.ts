import { prisma } from "@/lib/prisma";
import {
  formatTeamFixtureStateLabel,
  fplLiveFetchOptions,
  teamFixtureStateInGw,
} from "@/lib/fpl-gw-live-status";

export type ResolvedFplTeamId = {
  teamId: number | null;
  source: "profile" | "message" | "conversation" | null;
  /** When set, persist this ID on the user record after a successful fetch. */
  persistTeamId: number | null;
};

const TEAM_ID_PHRASE =
  /(?:team\s*id|squad\s*id|fpl\s*id|entry\s*id|my\s+id)[:\s#-]*(\d{5,10})/i;

const TEAM_ID_FOLLOW_UP =
  /^(?:(?:that(?:'s|s)?|it(?:'s|s)?|this(?:'s)?)\s+(?:my\s+)?)?(?:(?:squad|team)\s*id|fpl\s*id)\.?$/i;

export function parseFplTeamIdFromMessage(message: string): number | null {
  const trimmed = message.trim();
  if (/^\d{5,10}$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const match = trimmed.match(TEAM_ID_PHRASE);
  if (match) return parseInt(match[1], 10);
  return null;
}

export async function findRecentFplTeamIdInConversation(
  conversationId: string,
): Promise<number | null> {
  const rows = await prisma.message.findMany({
    where: { conversation_id: conversationId, role: "user" },
    orderBy: { timestamp: "desc" },
    take: 10,
    select: { content: true },
  });

  for (const row of rows) {
    const fromPhrase = parseFplTeamIdFromMessage(row.content);
    if (fromPhrase) return fromPhrase;
  }
  return null;
}

export async function resolveFplTeamIdForChat(input: {
  userFplTeamId: number | null;
  message: string;
  conversationId?: string | null;
}): Promise<ResolvedFplTeamId> {
  const fromMessage = parseFplTeamIdFromMessage(input.message);
  if (fromMessage) {
    return {
      teamId: fromMessage,
      source: "message",
      persistTeamId:
        input.userFplTeamId !== fromMessage ? fromMessage : null,
    };
  }

  if (TEAM_ID_FOLLOW_UP.test(input.message.trim()) && input.conversationId) {
    const fromConversation = await findRecentFplTeamIdInConversation(
      input.conversationId,
    );
    if (fromConversation) {
      return {
        teamId: fromConversation,
        source: "conversation",
        persistTeamId:
          input.userFplTeamId !== fromConversation ? fromConversation : null,
      };
    }
  }

  if (input.userFplTeamId) {
    return {
      teamId: input.userFplTeamId,
      source: "profile",
      persistTeamId: null,
    };
  }

  return { teamId: null, source: null, persistTeamId: null };
}

export type FplTeamContextResult = {
  context: string;
  squadElementIds: number[];
  squadWebNames: string[];
};

export async function buildFplTeamContext(
  teamId: number,
  fplData: any,
  fixturesData: any[],
  currentGW: number,
  source: ResolvedFplTeamId["source"],
): Promise<FplTeamContextResult> {
  const empty: FplTeamContextResult = {
    context: "",
    squadElementIds: [],
    squadWebNames: [],
  };

  try {
    const [entryRes, picksRes, historyRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`, fplLiveFetchOptions()),
      fetch(
        `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentGW}/picks/`,
        fplLiveFetchOptions(),
      ),
      fetch(
        `https://fantasy.premierleague.com/api/entry/${teamId}/history/`,
        fplLiveFetchOptions(),
      ),
    ]);

    const entryData = entryRes.ok ? await entryRes.json() : null;
    const picksData = picksRes.ok ? await picksRes.json() : null;
    const historyData = historyRes.ok ? await historyRes.json() : null;
    const squadElementIds = (picksData?.picks ?? []).map((p: any) => p.element);

    if (!entryData) return empty;

    const elementMap: Record<number, any> = {};
    (fplData.elements || []).forEach((p: any) => {
      elementMap[p.id] = p;
    });

    const squadWebNames = squadElementIds
      .map((id: number) => elementMap[id]?.web_name)
      .filter(Boolean) as string[];

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
    const chipsUsed: string[] = playedChips.map((c: any) => `${c.name} (GW${c.event})`);
    const usedNames: string[] = playedChips.map((c: any) => c.name);

    const wildcardsUsed = usedNames.filter((n) => n === "wildcard").length;
    const chipsAvailable: string[] = [];
    if (wildcardsUsed < 2) {
      chipsAvailable.push(
        `wildcard (${wildcardsUsed === 0 ? "both still available" : "1 used, 1 remaining"})`,
      );
    }
    if (!usedNames.includes("freehit")) chipsAvailable.push("freehit");
    if (!usedNames.includes("bboost")) chipsAvailable.push("bboost (bench boost)");
    if (!usedNames.includes("3xc")) chipsAvailable.push("3xc (triple captain)");

    const formatPick = (pick: any): string | null => {
      const p = elementMap[pick.element];
      if (!p) return null;
      const t = fplData.teams?.find((team: any) => team.id === p.team);
      const pos = fplData.element_types?.find((pt: any) => pt.id === p.element_type);
      const flags = [
        pick.is_captain ? "(C)" : "",
        pick.is_vice_captain ? "(VC)" : "",
        pick.multiplier === 3 ? "(3xC)" : "",
      ]
        .filter(Boolean)
        .join("");
      const injNote = p.news ? `|${p.news}` : "";
      const fixtureState = formatTeamFixtureStateLabel(
        teamFixtureStateInGw(p.team, currentGW, fixturesData),
      );
      return `${p.web_name}${flags ? " " + flags : ""}|${t?.short_name}|${pos?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|GWpts:${p.event_points ?? 0}|${p.form}form|${p.total_points}pts|${fixtureState}|${p.chance_of_playing_next_round ?? 100}%fit${injNote}`;
    };

    let squadSection = "";
    if (picksData?.picks) {
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

      squadSection = `
Starting XI:
${startingXI}

Bench:
${bench}

${gwStats}${activeChip ? "\n" + activeChip : ""}`;
    }

    const loadedNote =
      source === "message" || source === "conversation"
        ? `Loaded automatically from the user's FPL Team ID in this chat (not only from saved profile settings).
`
        : "";

    const rosterLine =
      squadWebNames.length > 0
        ? `Current squad web_names (15): ${squadWebNames.join(", ")}. Only these players are in the user's team - never claim they own anyone else.
`
        : "";

    const context = `USER'S FPL TEAM (Team ID: ${teamId}):
${loadedNote}${rosterLine}Team: ${teamName} | Manager: ${managerName}
Overall Points: ${overallPoints} | Overall Rank: ${overallRank}
Team Value: ${teamValue} | Bank: ${bank} | Total Transfers Used: ${totalTransfers}
Chips Used: ${chipsUsed.length > 0 ? chipsUsed.join(", ") : "None yet"}
Chips Still Available: ${chipsAvailable.length > 0 ? chipsAvailable.join(", ") : "All used"}
${squadSection}

IMPORTANT: When the user asks about "my team", "my squad", "my captain", "my transfers", or anything personal, refer to the squad data above. Use their actual picks and stats to give personalised advice. Never recommend selling or replacing a player they do not own.
`;

    return { context, squadElementIds, squadWebNames };
  } catch (err) {
    console.error("FPL team data fetch error:", err);
    return empty;
  }
}

export async function persistFplTeamIdForUser(
  userId: string,
  teamId: number,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { fpl_team_id: teamId },
  });
}
