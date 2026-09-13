import { getBootstrap } from "@/lib/fpl-player-page";
import { fplPhotoUrlFromElement, fplPlayerPhotoUrl } from "@/lib/fpl-player-photo";

export type SocialCardSlot = "am" | "pm";

export type SocialCardType = "captain" | "differential" | "transfer_in";

export interface SocialCardPlayer {
  code: number;
  webName: string;
  photoUrl: string;
  teamShort: string;
  teamCode: number;
  position: string;
  price: string;
  form: string;
  totalPts: number;
  epNext: number;
  ownership: number;
  fixtureLabel: string;
  transfersInGw: number;
}

export interface SocialCardData {
  slot: SocialCardSlot;
  cardType: SocialCardType;
  headline: string;
  subline: string;
  gw: number;
  statLabel: string;
  statValue: string;
  player: SocialCardPlayer;
  cta: string;
}

const POS_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

function nextPlanningGw(events: { id: number; is_next?: boolean; finished?: boolean }[]): number {
  const next = events.find((e) => e.is_next);
  if (next) return next.id;
  const current = events.find((e) => e.is_current);
  if (current && !current.finished) return current.id;
  return events.find((e) => !e.finished)?.id ?? 1;
}

function fixtureLabelForTeam(
  teamId: number,
  gw: number,
  fixtures: { team_h: number; team_a: number; event: number }[],
  teams: Record<number, { short_name: string }>,
): string {
  const fix = fixtures.find((f) => f.event === gw && (f.team_h === teamId || f.team_a === teamId));
  if (!fix) return "Blank GW";
  const isHome = fix.team_h === teamId;
  const oppId = isHome ? fix.team_a : fix.team_h;
  const opp = teams[oppId]?.short_name ?? "???";
  return `${opp} (${isHome ? "H" : "A"})`;
}

function captainScore(p: Record<string, unknown>): number {
  return (
    parseFloat(String(p.ep_next ?? "0")) * 4 +
    parseFloat(String(p.form ?? "0")) * 3 +
    (Number(p.total_points) || 0) * 0.05
  );
}

function activePlayers(elements: Record<string, unknown>[]): Record<string, unknown>[] {
  const all = elements.filter((p) => p.status !== "u" && p.status !== "s");
  const midseason = all.some((p) => Number(p.minutes) > 500);
  return midseason ? all.filter((p) => Number(p.minutes) > 200) : all;
}

function toCardPlayer(
  p: Record<string, unknown>,
  teams: Record<number, { short_name: string; code: number }>,
  fixtureLabel: string,
): SocialCardPlayer {
  const team = teams[Number(p.team)];
  const code = Number(p.code);
  return {
    code,
    webName: String(p.web_name),
    photoUrl: fplPhotoUrlFromElement(String(p.photo), code) || fplPlayerPhotoUrl(code),
    teamShort: team?.short_name ?? "???",
    teamCode: team?.code ?? 0,
    position: POS_MAP[Number(p.element_type)] ?? "MID",
    price: `£${(Number(p.now_cost) / 10).toFixed(1)}m`,
    form: parseFloat(String(p.form ?? "0")).toFixed(1),
    totalPts: Number(p.total_points ?? 0),
    epNext: parseFloat(String(p.ep_next ?? "0")),
    ownership: parseFloat(String(p.selected_by_percent ?? "0")),
    fixtureLabel,
    transfersInGw: Number(p.transfers_in_event ?? 0),
  };
}

function pickCaptain(pool: Record<string, unknown>[]): Record<string, unknown> | null {
  const sorted = [...pool]
    .filter((p) => Number(p.element_type) >= 3 && parseFloat(String(p.ep_next ?? "0")) > 0)
    .sort((a, b) => captainScore(b) - captainScore(a));
  return sorted[0] ?? null;
}

function pickDifferential(pool: Record<string, unknown>[]): Record<string, unknown> | null {
  const sorted = [...pool]
    .filter(
      (p) =>
        parseFloat(String(p.selected_by_percent ?? "0")) < 12 &&
        parseFloat(String(p.ep_next ?? "0")) >= 3 &&
        parseFloat(String(p.form ?? "0")) >= 4,
    )
    .sort(
      (a, b) =>
        parseFloat(String(b.ep_next ?? "0")) - parseFloat(String(a.ep_next ?? "0")) ||
        parseFloat(String(b.form ?? "0")) - parseFloat(String(a.form ?? "0")),
    );
  if (sorted[0]) return sorted[0];
  return (
    [...pool]
      .filter((p) => parseFloat(String(p.selected_by_percent ?? "0")) < 15)
      .sort((a, b) => parseFloat(String(b.ep_next ?? "0")) - parseFloat(String(a.ep_next ?? "0")))[0] ?? null
  );
}

function pickTransferIn(pool: Record<string, unknown>[]): Record<string, unknown> | null {
  return (
    [...pool]
      .filter((p) => Number(p.transfers_in_event) > 0)
      .sort((a, b) => Number(b.transfers_in_event) - Number(a.transfers_in_event))[0] ?? null
  );
}

export function parseSocialCardSlot(raw: string | undefined): SocialCardSlot {
  return raw?.toLowerCase() === "pm" ? "pm" : "am";
}

export function isSocialCardTokenValid(token: string | undefined): boolean {
  const secret = process.env.SOCIAL_CARD_TOKEN?.trim();
  if (!secret || !token) return false;
  return token === secret;
}

export async function getSocialCardData(slot: SocialCardSlot): Promise<SocialCardData | null> {
  const bootstrap = await getBootstrap();
  const elements = (bootstrap.elements ?? []) as Record<string, unknown>[];
  const teamsList = (bootstrap.teams ?? []) as { id: number; short_name: string; code: number }[];
  const teams: Record<number, { short_name: string; code: number }> = {};
  for (const t of teamsList) teams[t.id] = t;

  const gw = nextPlanningGw((bootstrap.events ?? []) as { id: number; is_next?: boolean; finished?: boolean }[]);

  let fixtures: { team_h: number; team_a: number; event: number }[] = [];
  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${gw}`,
      { headers: { "User-Agent": "ChatFPL/1.0" }, cache: "no-store" },
    );
    if (res.ok) fixtures = await res.json();
  } catch {
    fixtures = [];
  }

  const pool = activePlayers(elements);
  if (!pool.length) return null;

  if (slot === "am") {
    const raw = pickCaptain(pool);
    if (!raw) return null;
    const player = toCardPlayer(
      raw,
      teams,
      fixtureLabelForTeam(Number(raw.team), gw, fixtures, teams),
    );
    return {
      slot,
      cardType: "captain",
      headline: "Captain pick",
      subline: `Gameweek ${gw} by xP`,
      gw,
      statLabel: "xP next",
      statValue: player.epNext.toFixed(1),
      player,
      cta: "chatfpl.ai",
    };
  }

  const useTransfer = new Date().getUTCDay() % 2 === 0;
  const raw = useTransfer ? pickTransferIn(pool) : pickDifferential(pool);
  const fallback = raw ?? pickDifferential(pool) ?? pickTransferIn(pool);
  if (!fallback) return null;

  const cardType: SocialCardType = useTransfer && raw ? "transfer_in" : "differential";
  const player = toCardPlayer(
    fallback,
    teams,
    fixtureLabelForTeam(Number(fallback.team), gw, fixtures, teams),
  );

  if (cardType === "transfer_in") {
    return {
      slot,
      cardType,
      headline: "Most transferred in",
      subline: `Gameweek ${gw} template watch`,
      gw,
      statLabel: "Transfers in",
      statValue: player.transfersInGw.toLocaleString(),
      player,
      cta: "chatfpl.ai",
    };
  }

  return {
    slot,
    cardType: "differential",
    headline: "Differential watch",
    subline: `Gameweek ${gw} under 12% owned`,
    gw,
    statLabel: "Ownership",
    statValue: `${player.ownership.toFixed(1)}%`,
    player,
    cta: "chatfpl.ai",
  };
}
