import { getComparisonHub } from "@/lib/fpl-comparison";
import { getDefconHub } from "@/lib/fpl-defcon";
import { getFixtureHub } from "@/lib/fpl-fixtures";
import { getInjuryHub, statusLabel } from "@/lib/fpl-injury";
import {
  getCaptainHub,
  getDifferentialHub,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page";
import { fplPhotoUrlFromElement, fplPlayerPhotoUrl } from "@/lib/fpl-player-photo";
import { getTransferTrendsHub, fdrLabel } from "@/lib/fpl-transfer-trends";

export type SocialCardSlot = "1" | "2" | "3";

export type SocialHubType =
  | "captains"
  | "differentials"
  | "comparisons"
  | "injuries"
  | "transfer_trends"
  | "fixtures"
  | "defcon";

export interface SocialCardPlayer {
  code: number;
  displayName: string;
  teamShort: string;
  teamCode: number;
  position: string;
  price: string;
  photoUrl: string;
}

export interface SocialCardStat {
  label: string;
  value: string;
  accent?: boolean;
}

export interface SocialCardData {
  slot: SocialCardSlot;
  hub: SocialHubType;
  hubLabel: string;
  heroWhite: string;
  heroGradient: string;
  players: SocialCardPlayer[];
  bubbleText: string;
  stats: SocialCardStat[];
  gw: number;
  cta: string;
}

const HUB_ORDER: SocialHubType[] = [
  "captains",
  "differentials",
  "comparisons",
  "injuries",
  "transfer_trends",
  "fixtures",
  "defcon",
];

const HUB_LABELS: Record<SocialHubType, string> = {
  captains: "Captain Picks",
  differentials: "Differentials",
  comparisons: "Head to Head",
  injuries: "Injuries",
  transfer_trends: "Transfer Market Trends",
  fixtures: "Fixture Difficulty",
  defcon: "DEFCON",
};

const FDR_LABELS = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickIndex(seed: number, length: number, salt: number): number {
  if (length <= 0) return 0;
  return ((seed + salt * 9973) >>> 0) % length;
}

function toPlayer(
  p: {
    code: number;
    displayName?: string;
    webName?: string;
    teamCode: number;
    club?: string;
    position: string;
    price: string;
    photo?: string;
  },
  teamShort?: string,
): SocialCardPlayer {
  const code = p.code;
  const displayName = p.displayName ?? p.webName ?? "Player";
  return {
    code,
    displayName,
    teamShort: teamShort ?? (typeof p.club === "string" ? p.club.split(" ").pop() ?? p.club : "???"),
    teamCode: p.teamCode,
    position: p.position,
    price: p.price,
    photoUrl: fplPhotoUrlFromElement(String(p.photo ?? ""), code) || fplPlayerPhotoUrl(code),
  };
}

function fixtureLine(p: CaptainHubPlayer): string {
  if (!p.opponentShort) return "Fixture TBC";
  return `${p.opponentShort} (${p.isHome ? "H" : "A"})`;
}

function fdrText(fdr: number | null): string {
  if (!fdr) return "TBC";
  return FDR_LABELS[fdr] ?? "Medium";
}

export function parseSocialCardSlot(raw: string | undefined): SocialCardSlot {
  const v = raw?.toLowerCase().trim();
  if (v === "2" || v === "pm" || v === "midday" || v === "noon") return "2";
  if (v === "3" || v === "eve" || v === "evening" || v === "night") return "3";
  return "1";
}

/** @deprecated Token no longer required; kept for backwards-compatible IFTTT URLs. */
export function isSocialCardTokenValid(_token: string | undefined): boolean {
  return true;
}

function hubForSlot(dateKey: string, slot: SocialCardSlot): SocialHubType {
  const seed = hashSeed(`${dateKey}:${slot}`);
  const offset = slot === "1" ? 0 : slot === "2" ? 2 : 4;
  return HUB_ORDER[(seed + offset) % HUB_ORDER.length];
}

async function buildCaptainCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getCaptainHub();
  if (!hub?.players.length) return null;
  const idx = pickIndex(seed, hub.players.length, 11);
  const p = hub.players[idx];
  const player = toPlayer(p, p.opponentShort ? undefined : p.club);
  return {
    slot: "1",
    hub: "captains",
    hubLabel: HUB_LABELS.captains,
    heroWhite: "Thinking of captaining ",
    heroGradient: `${p.displayName}?`,
    players: [player],
    bubbleText:
      `Here are some numbers to weigh up. ${p.displayName} projects ${p.ep_next.toFixed(1)} xP ` +
      `for Gameweek ${gw}, with form at ${p.form} and ${p.ownership}% ownership. ` +
      `The fixture is ${fixtureLine(p)}, rated ${fdrText(p.fdrNext)} for difficulty. ` +
      `Not a directive, just context if the armband is on your mind.`,
    stats: [
      { label: "xP", value: p.ep_next.toFixed(1), accent: true },
      { label: "Form", value: p.form },
      { label: "Own", value: `${p.ownership}%` },
      { label: "FDR", value: fdrText(p.fdrNext) },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDifferentialCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getDifferentialHub();
  if (!hub?.players.length) return null;
  const idx = pickIndex(seed, hub.players.length, 19);
  const p = hub.players[idx];
  const player = toPlayer(p);
  return {
    slot: "1",
    hub: "differentials",
    hubLabel: HUB_LABELS.differentials,
    heroWhite: "Thinking of a differential like ",
    heroGradient: `${p.displayName}?`,
    players: [player],
    bubbleText:
      `${p.displayName} sits at ${p.ownership}% ownership with ${p.ep_next.toFixed(1)} xP projected ` +
      `for Gameweek ${gw}. Form reads ${p.form} and the next fixture is ${fixtureLine(p)}. ` +
      `Low-owned picks can move rank quickly, but the risk profile is different from template assets.`,
    stats: [
      { label: "xP", value: p.ep_next.toFixed(1), accent: true },
      { label: "Own", value: `${p.ownership}%` },
      { label: "Form", value: p.form },
      { label: "Price", value: p.price },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildComparisonCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getComparisonHub();
  if (!hub?.pairs.length) return null;
  const idx = pickIndex(seed, hub.pairs.length, 23);
  const pair = hub.pairs[idx];
  const players: SocialCardPlayer[] = [
    {
      code: pair.codeA,
      displayName: pair.nameA,
      teamShort: pair.clubA,
      teamCode: pair.teamCodeA,
      position: pair.position,
      price: pair.priceA,
      photoUrl: fplPlayerPhotoUrl(pair.codeA),
    },
    {
      code: pair.codeB,
      displayName: pair.nameB,
      teamShort: pair.clubB,
      teamCode: pair.teamCodeB,
      position: pair.position,
      price: pair.priceB,
      photoUrl: fplPlayerPhotoUrl(pair.codeB),
    },
  ];
  return {
    slot: "1",
    hub: "comparisons",
    hubLabel: HUB_LABELS.comparisons,
    heroWhite: "Thinking of ",
    heroGradient: `${pair.nameA} or ${pair.nameB}?`,
    players,
    bubbleText:
      `A few stats if you are torn between them. ${pair.nameA} projects ${pair.epA.toFixed(1)} xP ` +
      `with ${pair.ownershipA.toFixed(1)}% ownership. ${pair.nameB} is on ${pair.epB.toFixed(1)} xP ` +
      `at ${pair.ownershipB.toFixed(1)}% owned. Form is ${pair.formA.toFixed(1)} vs ${pair.formB.toFixed(1)}. ` +
      `Price gap: ${pair.priceA} vs ${pair.priceB}.`,
    stats: [
      { label: `${pair.nameA} xP`, value: pair.epA.toFixed(1), accent: true },
      { label: `${pair.nameB} xP`, value: pair.epB.toFixed(1), accent: true },
      { label: "Form A/B", value: `${pair.formA.toFixed(1)} / ${pair.formB.toFixed(1)}` },
      { label: "Pos", value: pair.position },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildInjuryCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getInjuryHub();
  if (!hub?.players.length) return null;
  const idx = pickIndex(seed, hub.players.length, 29);
  const p = hub.players[idx];
  const player = toPlayer(p);
  const status = statusLabel(p.status, p.chance);
  return {
    slot: "1",
    hub: "injuries",
    hubLabel: HUB_LABELS.injuries,
    heroWhite: "Worried about ",
    heroGradient: `${p.displayName}'s fitness?`,
    players: [player],
    bubbleText:
      `Here is what the FPL flag says right now. Status: ${status}. ` +
      `Chance of playing next round: ${p.chance}%. ` +
      (p.news ? `Latest note: ${p.news}. ` : "") +
      `Projected ${p.epNext.toFixed(1)} xP for Gameweek ${gw} if available. Worth checking before you commit a transfer.`,
    stats: [
      { label: "Status", value: status, accent: true },
      { label: "Chance", value: `${p.chance}%` },
      { label: "xP", value: p.epNext.toFixed(1) },
      { label: "Form", value: p.form },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildTransferCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getTransferTrendsHub();
  if (!hub?.pairs.length) return null;
  const idx = pickIndex(seed, hub.pairs.length, 37);
  const pair = hub.pairs[idx];
  const out = pair.playerOut;
  const inn = pair.playerIn;
  const players: SocialCardPlayer[] = [
    toPlayer(out, out.club),
    toPlayer(inn, inn.club),
  ];
  return {
    slot: "1",
    hub: "transfer_trends",
    hubLabel: HUB_LABELS.transfer_trends,
    heroWhite: "Thinking of swapping ",
    heroGradient: `${out.displayName} for ${inn.displayName}?`,
    players,
    bubbleText:
      `The market is active on this move. ${out.displayName} has ${out.transfersOut.toLocaleString()} transfers out ` +
      `this gameweek. ${inn.displayName} has ${inn.transfersIn.toLocaleString()} transfers in. ` +
      `xP projection: ${out.ep_next.toFixed(1)} out vs ${inn.ep_next.toFixed(1)} in. ` +
      `Budget shift: ${pair.budgetDelta >= 0 ? "+" : ""}£${(pair.budgetDelta).toFixed(1)}m.`,
    stats: [
      { label: "Out xP", value: out.ep_next.toFixed(1) },
      { label: "In xP", value: inn.ep_next.toFixed(1), accent: true },
      { label: "TI", value: inn.transfersIn.toLocaleString() },
      { label: "TO", value: out.transfersOut.toLocaleString() },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildFixtureCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getFixtureHub();
  if (!hub?.players.length) return null;
  const idx = pickIndex(seed, hub.players.length, 41);
  const p = hub.players[idx];
  const player = toPlayer(p, p.clubShort);
  const nextFix = p.fixtures.slice(0, 3).map((f) => `${f.opponentShort} (${f.isHome ? "H" : "A"}) FDR${f.fdr}`).join(" · ");
  return {
    slot: "1",
    hub: "fixtures",
    hubLabel: HUB_LABELS.fixtures,
    heroWhite: "Targeting ",
    heroGradient: `${p.displayName} for fixtures?`,
    players: [player],
    bubbleText:
      `${p.displayName}'s upcoming run averages FDR ${p.avgFdr.toFixed(1)} (${p.verdictLabel}). ` +
      `Next fixtures: ${nextFix || "TBC"}. ` +
      `${p.ep_next.toFixed(1)} xP projected for Gameweek ${gw} with form at ${p.form}. ` +
      `Fixture swings matter as much as raw form when you plan transfers.`,
    stats: [
      { label: "Avg FDR", value: p.avgFdr.toFixed(1), accent: true },
      { label: "Run", value: p.verdictLabel },
      { label: "xP", value: p.ep_next.toFixed(1) },
      { label: "Form", value: p.form },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDefconCard(
  seed: number,
  gw: number,
): Promise<SocialCardData | null> {
  const hub = await getDefconHub();
  if (!hub?.ready) return null;
  const pool = [...hub.defenders, ...hub.midfielders];
  if (!pool.length) return null;
  const idx = pickIndex(seed, pool.length, 47);
  const p = pool[idx];
  const player = toPlayer(p);
  const threshold = p.elementType === 2 ? 10 : 12;
  return {
    slot: "1",
    hub: "defcon",
    hubLabel: HUB_LABELS.defcon,
    heroWhite: "Thinking of ",
    heroGradient: `${p.displayName} for DEFCON?`,
    players: [player],
    bubbleText:
      `DEFCON context for ${p.displayName}. ${p.dc90.toFixed(1)} defensive actions per 90 this season, ` +
      `${p.cbit.toLocaleString()} CBIT total, and ${p.bonusHits ?? 0} bonus hits at the ${threshold}+ threshold. ` +
      `${p.displayName} projects ${p.ep_next.toFixed(1)} xP for Gameweek ${gw}. ` +
      `DEF/MID defensive volume can add a floor even on quieter attacking returns.`,
    stats: [
      { label: "DC/90", value: p.dc90.toFixed(1), accent: true },
      { label: "CBIT", value: p.cbit.toLocaleString() },
      { label: "Hits", value: String(p.bonusHits ?? 0) },
      { label: "xP", value: p.ep_next.toFixed(1) },
    ],
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildForHub(
  hub: SocialHubType,
  seed: number,
  gwFallback: number,
): Promise<SocialCardData | null> {
  switch (hub) {
    case "captains":
      return buildCaptainCard(seed, gwFallback);
    case "differentials":
      return buildDifferentialCard(seed, gwFallback);
    case "comparisons":
      return buildComparisonCard(seed, gwFallback);
    case "injuries":
      return buildInjuryCard(seed, gwFallback);
    case "transfer_trends":
      return buildTransferCard(seed, gwFallback);
    case "fixtures":
      return buildFixtureCard(seed, gwFallback);
    case "defcon":
      return buildDefconCard(seed, gwFallback);
    default:
      return null;
  }
}

export async function getSocialCardData(slot: SocialCardSlot): Promise<SocialCardData | null> {
  const dateKey = utcDateKey();
  const seed = hashSeed(`${dateKey}:${slot}`);
  const primaryHub = hubForSlot(dateKey, slot);

  let gw = 1;
  const captainPeek = await getCaptainHub();
  if (captainPeek?.gw) gw = captainPeek.gw;

  let card = await buildForHub(primaryHub, seed, gw);
  if (card) return { ...card, slot };

  for (let i = 1; i < HUB_ORDER.length; i++) {
    const fallbackHub = HUB_ORDER[(HUB_ORDER.indexOf(primaryHub) + i) % HUB_ORDER.length];
    card = await buildForHub(fallbackHub, seed + i, gw);
    if (card) return { ...card, slot };
  }

  return null;
}
