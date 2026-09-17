import { fplLiveFetchOptions } from "@/lib/fpl-gw-live-status";
import { getTransferReplacementFactsForChat } from "@/lib/chat-transfer-envelope";
import type { ChatPlayerRow } from "@/lib/chat-player-filter";
import { fplPhotoUrlFromElement } from "@/lib/fpl-player-photo";

const SMOKE_MESSAGE =
  "Who should I replace Salah with this gameweek?";

function mapBootstrapToPlayerRows(fplData: {
  elements?: unknown[];
  teams?: { id: number; name: string; short_name: string }[];
  element_types?: { id: number; singular_name_short: string }[];
}): ChatPlayerRow[] {
  const elements = fplData.elements ?? [];
  const teams = fplData.teams ?? [];
  const types = fplData.element_types ?? [];

  return elements.map((p: any) => {
    const team = teams.find((t) => t.id === p.team);
    const position = types.find((pt) => pt.id === p.element_type);
    const photoUrl = fplPhotoUrlFromElement(p.photo, p.code);
    const clubLabel = team ? `${team.name} (${team.short_name})` : "";
    const injuryNews = p.news ? `[${p.news}]` : "";
    return {
      formatted: `${p.web_name}|${p.first_name} ${p.second_name}|${clubLabel}|${position?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m`,
      rawData: p,
      team: team?.short_name,
      position: position?.singular_name_short,
    };
  });
}

/**
 * Exercises the same pre-Dify transfer-replacement path as /api/chat without calling Dify.
 * Catches scope/build mistakes that would 500 real FPL questions.
 */
export async function runChatPreDifySmoke(): Promise<{ ok: true } | { ok: false; error: string }> {
  let allPlayers: ChatPlayerRow[] = [];
  const squadElementIds: number[] = [];
  const squadWebNames: string[] = [];

  try {
    const fplResponse = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      fplLiveFetchOptions(),
    );

    if (fplResponse.ok) {
      const fplData = await fplResponse.json();
      allPlayers = mapBootstrapToPlayerRows(fplData);
    }

    getTransferReplacementFactsForChat(SMOKE_MESSAGE, {
      allPlayers,
      squadElementIds,
      squadWebNames,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
