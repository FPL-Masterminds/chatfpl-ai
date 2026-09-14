import { getComparisonHub, getComparisonData, type ComparisonPlayer } from "@/lib/fpl-comparison";
import { getDefconHub } from "@/lib/fpl-defcon";
import { getFixtureHub, getFixtureRunForPlayerCode, type FixtureGW } from "@/lib/fpl-fixtures";
import { getInjuryHub, statusLabel } from "@/lib/fpl-injury";
import {
  getCaptainHub,
  getDifferentialHub,
  type CaptainHubPlayer,
} from "@/lib/fpl-player-page";
import { fplPlayerPhotoExists, fplPlayerPhotoUrl, fplPlayerPhotosExist } from "@/lib/fpl-player-photo";
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

export interface SocialCardStat {
  label: string;
  value: string;
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
  prompt: string;
  stats: SocialCardStat[];
  footerTag: string;
  footerTitle: string;
  paragraph: string;
  gw: number;
  cta: string;
  fixtures?: FixtureGW[];
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

const H2H_TABLE_COLS: SocialCardTableCol[] = [
  { label: "GW xPts", key: "ep_next", higherIsBetter: true },
  { label: "Home", key: "homeNext", higherIsBetter: false },
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
  { label: "Fixture Difficulty Rating", key: "fdrNext", higherIsBetter: false },
  { label: "Price", key: "priceRaw", higherIsBetter: false },
];

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export const DAILY_SOCIAL_CARD_SLOTS = 3;

function utcDayNumber(dateKey = utcDateKey()): number {
  return Math.floor(new Date(`${dateKey}T12:00:00Z`).getTime() / 86_400_000);
}

/** Cycles through each hub's pool day by day so the same pick is not repeated daily. */
export function pickRotatingIndex(
  hub: SocialHubType,
  length: number,
  dateKey?: string,
): number {
  if (length <= 0) return 0;
  const day = utcDayNumber(dateKey);
  const hubOffset = HUB_ORDER.indexOf(hub);
  return (day + hubOffset) % length;
}

function fixtureLine(p: CaptainHubPlayer): string {
  if (!p.opponentShort) return "Fixture TBC";
  return `${p.opponentShort} (${p.isHome ? "H" : "A"})`;
}

function fdrText(fdr: number | null): string {
  if (!fdr) return "TBC";
  return FDR_LABELS[fdr] ?? "Medium";
}

function nextHomeLabel(fixtureRun: FixtureGW[]): string {
  const match = fixtureRun[0]?.matches[0];
  if (!match) return "TBC";
  return match.isHome ? "Home" : "Away";
}

function rowWithHome(row: SocialCardTableRow, fixtureRun: FixtureGW[]): SocialCardTableRow {
  return {
    ...row,
    nums: { ...row.nums, homeNext: 0 },
    display: { ...row.display, homeNext: nextHomeLabel(fixtureRun) },
  };
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

export { isSocialCardTokenValid } from "@/lib/social-card-token";

function statsFromRow(
  cols: SocialCardTableCol[],
  row: SocialCardTableRow,
  max = 6,
): SocialCardStat[] {
  return cols.slice(0, max).map((col) => ({
    label: col.label,
    value: row.display[col.key] ?? "",
  }));
}

function slotIndex(slot: SocialCardSlot): number {
  if (slot === "2") return 1;
  if (slot === "3") return 2;
  return 0;
}

async function pickPlayerWithPhoto<T extends { code: number }>(
  hub: SocialHubType,
  pool: T[],
): Promise<T | null> {
  if (!pool.length) return null;
  const start = pickRotatingIndex(hub, pool.length);
  for (let i = 0; i < pool.length; i++) {
    const player = pool[(start + i) % pool.length];
    if (await fplPlayerPhotoExists(player.code)) return player;
  }
  return null;
}

/** Three hubs per day, rotating through all seven over time. */
export function hubForSlot(dateKey: string, slot: SocialCardSlot): SocialHubType {
  const day = utcDayNumber(dateKey);
  const dailyStart = (day * DAILY_SOCIAL_CARD_SLOTS) % HUB_ORDER.length;
  return HUB_ORDER[(dailyStart + slotIndex(slot)) % HUB_ORDER.length];
}

async function buildCaptainCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getCaptainHub();
  if (!hub?.players.length) return null;
  const p = await pickPlayerWithPhoto("captains", hub.players);
  if (!p) return null;
  return {
    slot: "1",
    hub: "captains",
    hubLabel: HUB_LABELS.captains,
    layout: "single",
    heroWhite: "Thinking of captaining ",
    heroGradient: `${p.displayName} for Gameweek ${gw}?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: CAPTAIN_COLS,
    tableRows: [rowFromCaptain(p)],
    prompt: `I'm thinking of captaining ${p.displayName} this week. What do the numbers say for Gameweek ${gw}?`,
    stats: statsFromRow(CAPTAIN_COLS, rowFromCaptain(p)),
    footerTag: "THE ARMBAND",
    footerTitle: "Weigh the numbers.",
    paragraph:
      `Not a directive, just context if the armband is on your mind. ${p.displayName} faces ${fixtureLine(p)} ` +
      `with ${p.ownership}% ownership, so the rank risk profile depends on how template your squad already is.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDifferentialCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getDifferentialHub();
  if (!hub?.players.length) return null;
  const p = await pickPlayerWithPhoto("differentials", hub.players);
  if (!p) return null;
  return {
    slot: "1",
    hub: "differentials",
    hubLabel: HUB_LABELS.differentials,
    layout: "single",
    heroWhite: "Thinking of a differential like ",
    heroGradient: `${p.webName} for Gameweek ${gw}?`,
    analysisLine: {
      white: `${p.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [toSocialPlayer(p.code, p.displayName, p.webName, p.club, p.teamCode, p.position, p.price)],
    tableCols: CAPTAIN_COLS,
    tableRows: [rowFromCaptain(p)],
    prompt: `${p.displayName} is only ${p.ownership}% owned. Is he still worth bringing in for Gameweek ${gw}?`,
    stats: statsFromRow(CAPTAIN_COLS, rowFromCaptain(p)),
    footerTag: "THE EDGE",
    footerTitle: "Spot the invisible.",
    paragraph:
      `Low-owned picks can move rank quickly, but the risk profile is different from template assets. ` +
      `${p.displayName}'s next fixture is ${fixtureLine(p)}, rated ${fdrText(p.fdrNext)} for difficulty.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildComparisonCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getComparisonHub();
  if (!hub?.pairs.length) return null;
  const start = pickRotatingIndex("comparisons", hub.pairs.length);
  let data: Awaited<ReturnType<typeof getComparisonData>> = null;
  for (let i = 0; i < hub.pairs.length; i++) {
    const pair = hub.pairs[(start + i) % hub.pairs.length];
    const candidate = await getComparisonData(pair.slugA, pair.slugB);
    if (!candidate) continue;
    if (await fplPlayerPhotosExist([candidate.playerA.code, candidate.playerB.code])) {
      data = candidate;
      break;
    }
  }
  if (!data) return null;
  const { playerA, playerB, fixtureRunA, fixtureRunB } = data;
  return {
    slot: "1",
    hub: "comparisons",
    hubLabel: HUB_LABELS.comparisons,
    layout: "dual",
    heroWhite: `${playerA.displayName} vs ${playerB.displayName}: Who should I pick for `,
    heroGradient: `Fantasy Premier League Gameweek ${gw}?`,
    analysisLine: {
      white: `${playerA.displayName} vs ${playerB.displayName}: `,
      gradient: `Gameweek ${gw} Analysis`,
    },
    players: [
      toSocialPlayer(playerA.code, playerA.displayName, playerA.webName, playerA.club, playerA.teamCode, playerA.position, playerA.price),
      toSocialPlayer(playerB.code, playerB.displayName, playerB.webName, playerB.club, playerB.teamCode, playerB.position, playerB.price),
    ],
    tableCols: H2H_TABLE_COLS,
    tableRows: [
      rowWithHome(rowFromComparisonPlayer(playerA), fixtureRunA),
      rowWithHome(rowFromComparisonPlayer(playerB), fixtureRunB),
    ],
    prompt: `Torn between ${playerA.displayName} and ${playerB.displayName} for Gameweek ${gw}?`,
    footerTag: "HEAD TO HEAD",
    footerTitle: "Cut through the noise.",
    stats: [
      { label: `${playerA.webName} xP`, value: playerA.ep_next.toFixed(1) },
      { label: `${playerB.webName} xP`, value: playerB.ep_next.toFixed(1) },
      { label: `${playerA.webName} Form`, value: playerA.form },
      { label: `${playerB.webName} Form`, value: playerB.form },
      { label: `${playerA.webName} Own`, value: `${playerA.ownership.toFixed(1)}%` },
      { label: `${playerB.webName} Own`, value: `${playerB.ownership.toFixed(1)}%` },
    ],
    paragraph:
      `A few numbers if you are stuck between them. ${playerA.displayName} projects ${playerA.ep_next.toFixed(1)} xP ` +
      `against ${playerB.ep_next.toFixed(1)} xP for ${playerB.displayName}, with a price gap of ${playerA.price} vs ${playerB.price}.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildInjuryCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getInjuryHub();
  if (!hub?.players.length) return null;
  const p = await pickPlayerWithPhoto("injuries", hub.players);
  if (!p) return null;
  const status = statusLabel(p.status, p.chance);
  const injuryCols: SocialCardTableCol[] = [
    { label: "Chance of Playing", key: "chance", higherIsBetter: true },
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
    heroGradient: `${p.displayName}'s fitness for Gameweek ${gw}?`,
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
    prompt: `Is ${p.displayName} fit for Gameweek ${gw}, and should you still be considering him?`,
    footerTag: "THE FLAG",
    footerTitle: "Check before you commit.",
    stats: statsFromRow(injuryCols, {
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
    }),
    paragraph:
      `Here is what the FPL flag says right now: ${status}. ` +
      (p.news ? `${p.news}. ` : "") +
      `Worth checking before you commit a transfer or start ${p.displayName} in GW${gw}.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildTransferCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getTransferTrendsHub();
  if (!hub?.pairs.length) return null;
  const start = pickRotatingIndex("transfer_trends", hub.pairs.length);
  let pair: (typeof hub.pairs)[number] | null = null;
  for (let i = 0; i < hub.pairs.length; i++) {
    const candidate = hub.pairs[(start + i) % hub.pairs.length];
    if (await fplPlayerPhotosExist([candidate.playerOut.code, candidate.playerIn.code])) {
      pair = candidate;
      break;
    }
  }
  if (!pair) return null;
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
    heroWhite: `Thinking of swapping ${out.displayName} for ${inn.displayName} in `,
    heroGradient: `Fantasy Premier League Gameweek ${gw}?`,
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
    prompt: `Thinking of swapping ${out.displayName} for ${inn.displayName} this gameweek?`,
    footerTag: "THE MARKET",
    footerTitle: "Follow the flow.",
    stats: [
      { label: "Transfers out", value: out.transfersOut.toLocaleString() },
      { label: "Transfers in", value: inn.transfersIn.toLocaleString() },
      { label: `${out.webName} xP`, value: out.ep_next.toFixed(1) },
      { label: `${inn.webName} xP`, value: inn.ep_next.toFixed(1) },
      {
        label: "Budget shift",
        value: `${pair.budgetDelta >= 0 ? "+" : ""}£${pair.budgetDelta.toFixed(1)}m`,
      },
      { label: `${inn.webName} Form`, value: inn.form },
    ],
    paragraph:
      `The market is active on this move. ${out.transfersOut.toLocaleString()} managers are selling ${out.displayName} ` +
      `while ${inn.transfersIn.toLocaleString()} are buying ${inn.displayName} ahead of Gameweek ${gw}.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildFixtureCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getFixtureHub();
  if (!hub?.players.length) return null;
  const p = await pickPlayerWithPhoto("fixtures", hub.players);
  if (!p) return null;
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
    heroGradient: `${p.displayName} for fixtures from Gameweek ${gw}?`,
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
    prompt: `I want to bring in ${p.displayName} for the next few weeks. How good is his fixture run?`,
    footerTag: "THE RUN",
    footerTitle: "Plan the schedule.",
    stats: statsFromRow(fixtureCols, {
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
    }),
    paragraph:
      `${p.displayName}'s upcoming run averages FDR ${p.avgFdr.toFixed(1)} (${p.verdictLabel.toLowerCase()}). ` +
      `Fixture swings matter as much as raw form when you plan transfers across the next few gameweeks.`,
    fixtures: p.fixtures.slice(0, 5),
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildDefconCard(gw: number): Promise<SocialCardData | null> {
  const hub = await getDefconHub();
  if (!hub?.ready) return null;
  const pool = [...hub.defenders, ...hub.midfielders];
  if (!pool.length) return null;
  const p = await pickPlayerWithPhoto("defcon", pool);
  if (!p) return null;
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
    heroGradient: `${p.displayName} in Gameweek ${gw} for DEFCON?`,
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
    prompt: `How many DEFCON points could ${p.displayName} bring in for Gameweek ${gw}, and why?`,
    footerTag: "THE FLOOR",
    footerTitle: "Defensive volume counts.",
    stats: statsFromRow(defconCols, {
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
    }),
    paragraph:
      `${p.displayName} brings defensive volume that can add a floor on quieter attacking weeks. ` +
      `The ${threshold}+ threshold is the key number to watch if you want DEFCON upside without chasing goals.`,
    gw,
    cta: "chatfpl.ai",
  };
}

async function buildForHub(
  hub: SocialHubType,
  gwFallback: number,
): Promise<SocialCardData | null> {
  switch (hub) {
    case "captains":
      return buildCaptainCard(gwFallback);
    case "differentials":
      return buildDifferentialCard(gwFallback);
    case "comparisons":
      return buildComparisonCard(gwFallback);
    case "injuries":
      return buildInjuryCard(gwFallback);
    case "transfer_trends":
      return buildTransferCard(gwFallback);
    case "fixtures":
      return buildFixtureCard(gwFallback);
    case "defcon":
      return buildDefconCard(gwFallback);
    default:
      return null;
  }
}

async function enrichSocialCard(card: SocialCardData | null): Promise<SocialCardData | null> {
  if (!card || card.layout !== "single" || card.players.length !== 1) return card;
  if (card.fixtures?.length) return card;

  const fixtures = await getFixtureRunForPlayerCode(card.players[0].code);
  return { ...card, fixtures };
}

function parseHubOverride(raw: string | undefined): SocialHubType | null {
  const v = raw?.toLowerCase().trim();
  if (!v) return null;
  return HUB_ORDER.find((hub) => hub === v || hub.replace("_", "-") === v) ?? null;
}

export async function getSocialCardData(
  slot: SocialCardSlot,
  hubOverride?: string,
): Promise<SocialCardData | null> {
  const dateKey = utcDateKey();
  const primaryHub = parseHubOverride(hubOverride) ?? hubForSlot(dateKey, slot);

  let gw = 1;
  const captainPeek = await getCaptainHub();
  if (captainPeek?.gw) gw = captainPeek.gw;

  let card = await enrichSocialCard(await buildForHub(primaryHub, gw));
  if (card) return { ...card, slot };

  for (let i = 1; i < HUB_ORDER.length; i++) {
    const fallbackHub = HUB_ORDER[(HUB_ORDER.indexOf(primaryHub) + i) % HUB_ORDER.length];
    card = await enrichSocialCard(await buildForHub(fallbackHub, gw));
    if (card) return { ...card, slot };
  }

  return null;
}
