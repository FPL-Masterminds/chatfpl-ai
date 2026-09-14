import { getComparisonHub, getComparisonData, type ComparisonPlayer } from "@/lib/fpl-comparison";
import { getDefconHub } from "@/lib/fpl-defcon";
import { getFixtureHub } from "@/lib/fpl-fixtures";
import { getInjuryHub, statusLabel } from "@/lib/fpl-injury";
import {
  getCaptainHub,
  getDifferentialHub,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page";
import { fplPlayerPhotoUrl } from "@/lib/fpl-player-photo";
import { getTransferTrendsHub, type TransferTrendPlayer } from "@/lib/fpl-transfer-trends";

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

export interface SocialCardTableCol {
  label: string;
  key: string;
  higherIsBetter: boolean;
}

export interface SocialCardTableRow {
  code: number;
  webName: string;
  position: string;
  club: string;
  nums: Record<string, number>;
  display: Record<string, string>;
}

export interface SocialCardBullet {
  label: string;
  text: string;
}

export interface SocialCardInsights {
  sectionTitle: string;
  badge: string;
  headline: string;
  bullets: SocialCardBullet[];
}

export interface SocialCardData {
  slot: SocialCardSlot;
  hub: SocialHubType;
  hubLabel: string;
  layout: "single" | "dual";
  heroWhite: string;
  heroGradient: string;
  analysisLine?: { white: string; gradient: string };
  players: SocialCardPlayer[];
  tableCols: SocialCardTableCol[];
  tableRows: SocialCardTableRow[];
  insights: SocialCardInsights;
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

/** Same columns as /fpl/compare StatTable */
const COMPARE_COLS: SocialCardTableCol[] = [
  { label: "GW xPts", key: "ep_next", higherIsBetter: true },
  { label: "Form", key: "formVal", higherIsBetter: true },
  { label: "Season Pts", key: "totalPts", higherIsBetter: true },
  { label: "Goals", key: "goals", higherIsBetter: true },
  { label: "Assists", key: "assists", higherIsBetter: true },
  { label: "Pts per £m", key: "ptsPerMillion", higherIsBetter: true },
  { label: "Ownership", key: "ownership", higherIsBetter: false },
  { label: "Price", key: "priceRaw", higherIsBetter: false },
];

const CAPTAIN_COLS: SocialCardTableCol[] = [
  { label: "GW xPts", key: "ep_next", higherIsBetter: true },
  { label: "Form", key: "formVal", higherIsBetter: true },
  { label: "Ownership", key: "ownership", higherIsBetter: false },
  { label: "Transfers In", key: "transfersIn", higherIsBetter: true },
  { label: "FDR", key: "fdrNext", higherIsBetter: false },
  { label: "Price", key: "priceRaw", higherIsBetter: false },
];

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

function fixtureLine(p: CaptainHubPlayer): string {
  if (!p.opponentShort) return "Fixture TBC";
  return `${p.opponentShort} (${p.isHome ? "H" : "A"})`;
}

function fdrText(fdr: number | null): string {
  if (!fdr) return "TBC";
  return FDR_LABELS[fdr] ?? "Medium";
}

function rowFromComparisonPlayer(p: ComparisonPlayer): SocialCardTableRow {
  return {
    code: p.code,
    webName: p.webName,
    position: p.position,
    club: p.club,
    nums: {
      ep_next: p.ep_next,
      formVal: p.formVal,
      totalPts: p.totalPts,
      goals: p.goals,
      assists: p.assists,
      ptsPerMillion: p.ptsPerMillion,
      ownership: p.ownership,
      priceRaw: p.priceRaw,
    },
    display: {
      ep_next: String(p.ep_next),
      formVal: p.form,
      totalPts: String(p.totalPts),
      goals: String(p.goals),
      assists: String(p.assists),
      ptsPerMillion: String(p.ptsPerMillion),
      ownership: `${p.ownership}%`,
      priceRaw: p.price,
    },
  };
}

function rowFromCaptain(p: CaptainHubPlayer): SocialCardTableRow {
  const priceRaw = parseFloat(p.price.replace("£", "").replace("m", "")) || 0;
  const ownership = parseFloat(String(p.ownership)) || 0;
  const formVal = parseFloat(p.form) || 0;
  const fdr = p.fdrNext ?? 5;
  return {
    code: p.code,
    webName: p.webName,
    position: p.position,
    club: p.club,
    nums: {
      ep_next: p.ep_next,
      formVal,
      ownership,
      transfersIn: p.transfersIn,
      fdrNext: fdr,
      priceRaw,
    },
    display: {
      ep_next: p.ep_next.toFixed(1),
      formVal: p.form,
      ownership: `${p.ownership}%`,
      transfersIn: p.transfersIn.toLocaleString(),
      fdrNext: fdrText(p.fdrNext),
      priceRaw: p.price,
    },
  };
}

function rowFromTransferPlayer(p: TransferTrendPlayer): SocialCardTableRow {
  return {
    code: p.code,
    webName: p.webName,
    position: p.position,
    club: p.club,
    nums: {
      ep_next: p.ep_next,
      formVal: p.formVal,
      ownership: p.ownership,
      transfersIn: p.transfersIn,
      transfersOut: p.transfersOut,
      priceRaw: p.priceRaw,
    },
    display: {
      ep_next: p.ep_next.toFixed(1),
      formVal: p.form,
      ownership: `${p.ownership.toFixed(1)}%`,
      transfersIn: p.transfersIn.toLocaleString(),
      transfersOut: p.transfersOut.toLocaleString(),
      priceRaw: p.price,
    },
  };
}

function toSocialPlayer(
  code: number,
  displayName: string,
  webName: string,
  club: string,
  teamCode: number,
  position: string,
  price: string,
): SocialCardPlayer {
  return {
    code,
    displayName,
    teamShort: club,
    teamCode,
    position,
    price,
    photoUrl: fplPlayerPhotoUrl(code),
  };
}

export function parseSocialCardSlot(raw: string | undefined): SocialCardSlot {
  const v = raw?.toLowerCase().trim();
  if (v === "2" || v === "pm" || v === "midday" || v === "noon") return "2";
  if (v === "3" || v === "eve" || v === "evening" || v === "night") return "3";
  return "1";
}

export function isSocialCardTokenValid(_token: string | undefined): boolean {
  return true;
}

function hubForSlot(dateKey: string, slot: SocialCardSlot): SocialHubType {
  const seed = hashSeed(`${dateKey}:${slot}`);
  const offset = slot === "1" ? 0 : slot === "2" ? 2 : 4;
  return HUB_ORDER[(seed + offset) % HUB_ORDER.length];
}

async function buildCaptainCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getCaptainHub();
  if (!hub?.players.length) return null;
  const p = hub.players[pickIndex(seed, hub.players.length, 11)];
  return {
    slot: "1",
    hub: "captains",
    hubLabel: HUB_LABELS.captains,
    layout: "single",
    heroWhite: "Thinking of captaining ",
    heroGradient: `${p.displayName}?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: CAPTAIN_COLS,
    tableRows: [rowFromCaptain(p)],
    insights: {
      sectionTitle: "THE CASE FOR",
      badge: "CONTEXT",
      headline: `Worth weighing up if the armband is on your mind for Gameweek ${gw}.`,
      bullets: [
        { label: "Form", text: `${p.form} pts/game recently` },
        { label: "Expected points", text: `${p.ep_next.toFixed(1)} xP projected for GW${gw}` },
        {
          label: "Ownership",
          text:
            p.ownership >= 30
              ? `${p.ownership}% owned - blanking carries rank risk`
              : `${p.ownership}% owned - a differential captain call`,
        },
        { label: "Fixture", text: `${fixtureLine(p)} rated ${fdrText(p.fdrNext)}` },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDifferentialCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getDifferentialHub();
  if (!hub?.players.length) return null;
  const p = hub.players[pickIndex(seed, hub.players.length, 19)];
  return {
    slot: "1",
    hub: "differentials",
    hubLabel: HUB_LABELS.differentials,
    layout: "single",
    heroWhite: "Thinking of a differential like ",
    heroGradient: `${p.displayName}?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: CAPTAIN_COLS,
    tableRows: [rowFromCaptain(p)],
    insights: {
      sectionTitle: "THE CASE FOR",
      badge: "DIFFERENTIAL",
      headline: `${p.displayName} at ${p.ownership}% ownership could shift your rank if he delivers.`,
      bullets: [
        { label: "Expected points", text: `${p.ep_next.toFixed(1)} xP projected for GW${gw}` },
        { label: "Form", text: `${p.form} pts/game recently` },
        {
          label: "Ownership",
          text: `Only ${p.ownership}% owned - low template risk, high upside if he hauls`,
        },
        { label: "Fixture", text: `${fixtureLine(p)} rated ${fdrText(p.fdrNext)}` },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildComparisonCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getComparisonHub();
  if (!hub?.pairs.length) return null;
  const pair = hub.pairs[pickIndex(seed, hub.pairs.length, 23)];
  const data = await getComparisonData(pair.slugA, pair.slugB);
  if (!data) return null;
  const { playerA, playerB } = data;
  return {
    slot: "1",
    hub: "comparisons",
    hubLabel: HUB_LABELS.comparisons,
    layout: "dual",
    heroWhite: "Thinking of ",
    heroGradient: `${playerA.displayName} or ${playerB.displayName}?`,
    analysisLine: {
      white: `${playerA.displayName} vs ${playerB.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [
      toSocialPlayer(playerA.code, playerA.displayName, playerA.webName, playerA.club, playerA.teamCode, playerA.position, playerA.price),
      toSocialPlayer(playerB.code, playerB.displayName, playerB.webName, playerB.club, playerB.teamCode, playerB.position, playerB.price),
    ],
    tableCols: COMPARE_COLS,
    tableRows: [rowFromComparisonPlayer(playerA), rowFromComparisonPlayer(playerB)],
    insights: {
      sectionTitle: "HEAD TO HEAD",
      badge: "VS",
      headline: `Torn between ${playerA.displayName} and ${playerB.displayName} this week?`,
      bullets: [
        {
          label: "Expected points",
          text: `${playerA.displayName} ${playerA.ep_next.toFixed(1)} xP vs ${playerB.displayName} ${playerB.ep_next.toFixed(1)} xP`,
        },
        { label: "Form", text: `${playerA.form} vs ${playerB.form} over recent gameweeks` },
        {
          label: "Ownership",
          text: `${playerA.ownership.toFixed(1)}% vs ${playerB.ownership.toFixed(1)}% owned`,
        },
        { label: "Price", text: `${playerA.price} vs ${playerB.price}` },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildInjuryCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getInjuryHub();
  if (!hub?.players.length) return null;
  const p = hub.players[pickIndex(seed, hub.players.length, 29)];
  const status = statusLabel(p.status, p.chance);
  const injuryCols: SocialCardTableCol[] = [
    { label: "Chance", key: "chance", higherIsBetter: true },
    { label: "GW xPts", key: "epNext", higherIsBetter: true },
    { label: "Form", key: "formVal", higherIsBetter: true },
    { label: "Season Pts", key: "totalPts", higherIsBetter: true },
    { label: "Price", key: "priceRaw", higherIsBetter: false },
  ];
  const priceRaw = parseFloat(p.price.replace("£", "").replace("m", "")) || 0;
  const formVal = parseFloat(p.form) || 0;
  return {
    slot: "1",
    hub: "injuries",
    hubLabel: HUB_LABELS.injuries,
    layout: "single",
    heroWhite: "Worried about ",
    heroGradient: `${p.displayName}'s fitness?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: injuryCols,
    tableRows: [{
      code: p.code,
      webName: p.webName,
      position: p.position,
      club: p.club,
      nums: { chance: p.chance, epNext: p.epNext, formVal, totalPts: p.totalPts, priceRaw },
      display: {
        chance: `${p.chance}%`,
        epNext: p.epNext.toFixed(1),
        formVal: p.form,
        totalPts: String(p.totalPts),
        priceRaw: p.price,
      },
    }],
    insights: {
      sectionTitle: "FITNESS CHECK",
      badge: p.chance >= 75 ? "AVAILABLE" : p.chance >= 50 ? "DOUBT" : "RISK",
      headline: `Check the flag before you commit to ${p.displayName} for GW${gw}.`,
      bullets: [
        { label: "Status", text: status },
        { label: "Chance to play", text: `${p.chance}% for the next round` },
        ...(p.news ? [{ label: "Latest note", text: p.news }] : []),
        { label: "Expected points", text: `${p.epNext.toFixed(1)} xP if available` },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildTransferCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getTransferTrendsHub();
  if (!hub?.pairs.length) return null;
  const pair = hub.pairs[pickIndex(seed, hub.pairs.length, 37)];
  const out = pair.playerOut;
  const inn = pair.playerIn;
  const transferCols: SocialCardTableCol[] = [
    { label: "GW xPts", key: "ep_next", higherIsBetter: true },
    { label: "Form", key: "formVal", higherIsBetter: true },
    { label: "Transfers In", key: "transfersIn", higherIsBetter: true },
    { label: "Transfers Out", key: "transfersOut", higherIsBetter: false },
    { label: "Ownership", key: "ownership", higherIsBetter: false },
    { label: "Price", key: "priceRaw", higherIsBetter: false },
  ];
  return {
    slot: "1",
    hub: "transfer_trends",
    hubLabel: HUB_LABELS.transfer_trends,
    layout: "dual",
    heroWhite: "Thinking of swapping ",
    heroGradient: `${out.displayName} for ${inn.displayName}?`,
    analysisLine: {
      white: `${out.displayName} vs ${inn.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [
      toSocialPlayer(out.code, out.displayName, out.webName, out.club, out.teamCode, out.position, out.price),
      toSocialPlayer(inn.code, inn.displayName, inn.webName, inn.club, inn.teamCode, inn.position, inn.price),
    ],
    tableCols: transferCols,
    tableRows: [rowFromTransferPlayer(out), rowFromTransferPlayer(inn)],
    insights: {
      sectionTitle: "MARKET MOVEMENT",
      badge: "TRENDING",
      headline: `Managers are moving from ${out.displayName} to ${inn.displayName}.`,
      bullets: [
        { label: "Transfers out", text: `${out.transfersOut.toLocaleString()} managers selling ${out.displayName}` },
        { label: "Transfers in", text: `${inn.transfersIn.toLocaleString()} managers buying ${inn.displayName}` },
        {
          label: "Expected points",
          text: `${out.ep_next.toFixed(1)} xP out vs ${inn.ep_next.toFixed(1)} xP in for GW${gw}`,
        },
        {
          label: "Budget shift",
          text: `${pair.budgetDelta >= 0 ? "+" : ""}£${pair.budgetDelta.toFixed(1)}m if you make the swap`,
        },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildFixtureCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getFixtureHub();
  if (!hub?.players.length) return null;
  const p = hub.players[pickIndex(seed, hub.players.length, 41)];
  const nextFix = p.fixtures
    .slice(0, 3)
    .map((f) => `${f.opponentShort} (${f.isHome ? "H" : "A"}) FDR${f.fdr}`)
    .join(" · ");
  const fixtureCols: SocialCardTableCol[] = [
    { label: "Avg FDR", key: "avgFdr", higherIsBetter: false },
    { label: "GW xPts", key: "ep_next", higherIsBetter: true },
    { label: "Form", key: "formVal", higherIsBetter: true },
    { label: "Ownership", key: "ownership", higherIsBetter: false },
    { label: "Price", key: "priceRaw", higherIsBetter: false },
  ];
  const priceRaw = parseFloat(p.price.replace("£", "").replace("m", "")) || 0;
  const formVal = parseFloat(p.form) || 0;
  return {
    slot: "1",
    hub: "fixtures",
    hubLabel: HUB_LABELS.fixtures,
    layout: "single",
    heroWhite: "Targeting ",
    heroGradient: `${p.displayName} for fixtures?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: fixtureCols,
    tableRows: [{
      code: p.code,
      webName: p.webName,
      position: p.position,
      club: p.club,
      nums: { avgFdr: p.avgFdr, ep_next: p.ep_next, formVal, ownership: p.ownership, priceRaw },
      display: {
        avgFdr: p.avgFdr.toFixed(1),
        ep_next: p.ep_next.toFixed(1),
        formVal: p.form,
        ownership: `${p.ownership.toFixed(1)}%`,
        priceRaw: p.price,
      },
    }],
    insights: {
      sectionTitle: "FIXTURE RUN",
      badge: p.verdictLabel.toUpperCase(),
      headline: `${p.displayName}'s schedule is ${p.verdictLabel.toLowerCase()} over the coming weeks.`,
      bullets: [
        { label: "Average FDR", text: `${p.avgFdr.toFixed(1)} across the next five gameweeks` },
        { label: "Next fixtures", text: nextFix || "TBC" },
        { label: "Expected points", text: `${p.ep_next.toFixed(1)} xP projected for GW${gw}` },
        { label: "Form", text: `${p.form} pts/game recently` },
      ],
    },
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDefconCard(seed: number, gw: number): Promise<SocialCardData | null> {
  const hub = await getDefconHub();
  if (!hub?.ready) return null;
  const pool = [...hub.defenders, ...hub.midfielders];
  if (!pool.length) return null;
  const p = pool[pickIndex(seed, pool.length, 47)];
  const threshold = p.elementType === 2 ? 10 : 12;
  const defconCols: SocialCardTableCol[] = [
    { label: "DC/90", key: "dc90", higherIsBetter: true },
    { label: "CBIT", key: "cbit", higherIsBetter: true },
    { label: "Bonus Hits", key: "bonusHits", higherIsBetter: true },
    { label: "GW xPts", key: "ep_next", higherIsBetter: true },
    { label: "Form", key: "formVal", higherIsBetter: true },
    { label: "Price", key: "priceRaw", higherIsBetter: false },
  ];
  const priceRaw = parseFloat(p.price.replace("£", "").replace("m", "")) || 0;
  const formVal = parseFloat(p.form) || 0;
  return {
    slot: "1",
    hub: "defcon",
    hubLabel: HUB_LABELS.defcon,
    layout: "single",
    heroWhite: "Thinking of ",
    heroGradient: `${p.displayName} for DEFCON?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: defconCols,
    tableRows: [{
      code: p.code,
      webName: p.webName,
      position: p.position,
      club: p.club,
      nums: {
        dc90: p.dc90,
        cbit: p.cbit,
        bonusHits: p.bonusHits ?? 0,
        ep_next: p.ep_next,
        formVal,
        priceRaw,
      },
      display: {
        dc90: p.dc90.toFixed(1),
        cbit: p.cbit.toLocaleString(),
        bonusHits: String(p.bonusHits ?? 0),
        ep_next: p.ep_next.toFixed(1),
        formVal: p.form,
        priceRaw: p.price,
      },
    }],
    insights: {
      sectionTitle: "THE CASE FOR",
      badge: "DEFCON",
      headline: `${p.displayName} adds defensive volume that can floor quieter attacking weeks.`,
      bullets: [
        { label: "DC/90", text: `${p.dc90.toFixed(1)} defensive actions per 90 this season` },
        { label: "CBIT", text: `${p.cbit.toLocaleString()} combined clearances, blocks, interceptions and tackles` },
        {
          label: "Bonus hits",
          text: `${p.bonusHits ?? 0} at the ${threshold}+ threshold this season`,
        },
        { label: "Expected points", text: `${p.ep_next.toFixed(1)} xP projected for GW${gw}` },
      ],
    },
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
