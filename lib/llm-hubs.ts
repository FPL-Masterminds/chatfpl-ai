import { SITE_URL } from "@/lib/seo/metadata"
import { getComparisonHub } from "@/lib/fpl-comparison"
import { getDefconHub } from "@/lib/fpl-defcon"
import { getFixtureHub } from "@/lib/fpl-fixtures"
import { getGameweekHub } from "@/lib/fpl-gameweeks"
import { getInjuryHub, statusLabel } from "@/lib/fpl-injury"
import { getTransferTrendsHub } from "@/lib/fpl-transfer-trends"
import {
  getCaptainHub,
  getDifferentialHub,
  getTeamSlugs,
} from "@/lib/fpl-player-page"

export type LlmHubEntry = {
  id: string
  title: string
  summary: string
  htmlPath: string
  mdPath: string
}

export const LLM_HUB_ENTRIES: LlmHubEntry[] = [
  {
    id: "index",
    title: "ChatFPL AI overview",
    summary: "What ChatFPL is and how to use the AI chat product.",
    htmlPath: "/",
    mdPath: "/llms/index.md",
  },
  {
    id: "fpl/captains",
    title: "FPL captain picks",
    summary: "Top captain options ranked by expected points for the planning gameweek.",
    htmlPath: "/fpl/captains",
    mdPath: "/llms/fpl/captains.md",
  },
  {
    id: "fpl/differentials",
    title: "FPL differentials",
    summary: "Low-ownership players with strong expected points and form.",
    htmlPath: "/fpl/differentials",
    mdPath: "/llms/fpl/differentials.md",
  },
  {
    id: "fpl/comparisons",
    title: "FPL player comparisons",
    summary: "Head-to-head picks between popular owned players.",
    htmlPath: "/fpl/comparisons",
    mdPath: "/llms/fpl/comparisons.md",
  },
  {
    id: "fpl/transfer-trends",
    title: "FPL transfer trends",
    summary: "Who managers are selling and buying this gameweek.",
    htmlPath: "/fpl/transfer-trends",
    mdPath: "/llms/fpl/transfer-trends.md",
  },
  {
    id: "fpl/injuries",
    title: "FPL injuries and availability",
    summary: "Injured, doubtful, and suspended players with latest news.",
    htmlPath: "/fpl/injuries",
    mdPath: "/llms/fpl/injuries.md",
  },
  {
    id: "fpl/fixtures",
    title: "FPL fixture difficulty",
    summary: "Players with the best upcoming fixture runs.",
    htmlPath: "/fpl/fixtures",
    mdPath: "/llms/fpl/fixtures.md",
  },
  {
    id: "fpl/gameweeks",
    title: "FPL gameweek planner",
    summary: "Blank and double gameweeks on the horizon.",
    htmlPath: "/fpl/gameweeks",
    mdPath: "/llms/fpl/gameweeks.md",
  },
  {
    id: "fpl/teams",
    title: "FPL players by club",
    summary: "Browse every Premier League club on ChatFPL.",
    htmlPath: "/fpl/teams",
    mdPath: "/llms/fpl/teams.md",
  },
  {
    id: "fpl/defcon",
    title: "FPL DEFCON rankings",
    summary: "Defensive contribution picks for the 2025/26 DEFCON scoring rule.",
    htmlPath: "/fpl/defcon",
    mdPath: "/llms/fpl/defcon.md",
  },
]

function canonical(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`
}

function mdLink(label: string, path: string): string {
  return `[${label}](${canonical(path)})`
}

function hubHeader(title: string, htmlPath: string, description: string, gw?: number | string): string {
  const gwLine = gw !== undefined ? `\n\nGameweek: **${gw}** (planning GW from live FPL data).` : ""
  return `# ${title}

> ${description}

Canonical HTML page: ${canonical(htmlPath)}${gwLine}

Data source: live Fantasy Premier League API. Updated when this Markdown file is requested (cached up to 1 hour).

`
}

function hubFooter(): string {
  return `

---

## ChatFPL AI

- Ask anything FPL-related: ${canonical("/chat")}
- Sign up: ${canonical("/signup")}
- More hub pages: ${canonical("/llms.txt")}
`
}

export function buildLlmsTxt(): string {
  const lines = [
    "# ChatFPL AI",
    "",
    "> AI-powered Fantasy Premier League assistant with live FPL stats, expected points, and gameweek planning.",
    "",
    "ChatFPL publishes Markdown mirrors of its main FPL hub pages so AI crawlers can read clean text without HTML layout noise.",
    "",
    "## Product",
    `- [Chat](${canonical("/chat")}): Paid AI chat with live FPL data injected on every message.`,
    `- [Sign up](${canonical("/signup")}): Create an account.`,
    `- [Pricing](${canonical("/")}#pricing): Free tier plus Premium and Elite plans.`,
    "",
    "## FPL hub pages (Markdown)",
    ...LLM_HUB_ENTRIES.filter((e) => e.id !== "index").map(
      (e) => `- [${e.title}](${canonical(e.mdPath)}): ${e.summary}`,
    ),
    "",
    "## Site overview",
    `- [ChatFPL overview](${canonical("/llms/index.md")})`,
    "",
    "## HTML sitemap",
    `- [sitemap.xml](${canonical("/sitemap.xml")}): Full site index (includes programmatic player pages). Hub Markdown files above are the preferred entry points for LLM crawlers.`,
    "",
  ]
  return lines.join("\n")
}

async function markdownIndex(): Promise<string> {
  const body = `# ChatFPL AI

> Your Fantasy Premier League AI analyst. Live FPL data on every answer.

ChatFPL helps managers with captaincy, transfers, differentials, fixtures, injuries, DEFCON (2025/26 defensive contribution scoring), and squad-specific advice when an FPL team ID is linked.

## Main product

- ${mdLink("Chat", "/chat")}
- ${mdLink("Sign up", "/signup")}
- ${mdLink("Home", "/")}

## FPL data hubs (Markdown)

${LLM_HUB_ENTRIES
  .filter((e) => e.id !== "index")
  .map((e) => `- ${mdLink(e.title, e.mdPath)}: ${e.summary}`)
  .join("\n")}

## Notes for AI systems

- Player names follow FPL \`web_name\` formatting.
- CBIT means clearances, blocks, interceptions and tackles (DEFCON threshold stat).
- Expected points fields: xPNext = planning gameweek, xPThis = current gameweek (often 0 after GW ends).
`
  return body + hubFooter()
}

async function markdownCaptains(): Promise<string> {
  const data = await getCaptainHub()
  if (!data) return hubHeader("FPL captain picks", "/fpl/captains", "Captain options unavailable.") + hubFooter()

  const rows = data.players.slice(0, 20).map((p, i) => {
    const opp = p.opponentName ? ` vs ${p.opponentName} (${p.isHome ? "H" : "A"})` : ""
    return `${i + 1}. **${p.displayName}** (${p.club}, ${p.position}) - xP next GW: ${p.ep_next.toFixed(1)}, Form: ${p.form}, Own: ${p.ownership}%${opp}`
  })

  return (
    hubHeader(
      `FPL captain picks - Gameweek ${data.gw}`,
      "/fpl/captains",
      "Top captain options ranked by expected points for the planning gameweek.",
      data.gw,
    ) +
    `## Top captain options\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownDifferentials(): Promise<string> {
  const data = await getDifferentialHub()
  if (!data) return hubHeader("FPL differentials", "/fpl/differentials", "Differentials unavailable.") + hubFooter()

  const rows = data.players.slice(0, 20).map((p, i) => {
    return `${i + 1}. **${p.displayName}** (${p.club}, ${p.position}) - ${p.price}, xP: ${p.ep_next.toFixed(1)}, Own: ${p.ownership}%, Form: ${p.form}`
  })

  return (
    hubHeader(
      `FPL differentials - Gameweek ${data.gw}`,
      "/fpl/differentials",
      "Low-ownership players with strong expected points.",
      data.gw,
    ) +
    `## Top differentials\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownComparisons(): Promise<string> {
  const data = await getComparisonHub()
  if (!data) return hubHeader("FPL comparisons", "/fpl/comparisons", "Comparisons unavailable.") + hubFooter()

  const rows = data.pairs.slice(0, 20).map((pair, i) => {
    const leader = pair.epA >= pair.epB ? pair.nameA : pair.nameB
    return `${i + 1}. **${pair.nameA}** vs **${pair.nameB}** (${pair.position}) - xP ${pair.epA.toFixed(1)} vs ${pair.epB.toFixed(1)}. Edge on xP: ${leader}.`
  })

  return (
    hubHeader(
      `FPL head-to-head comparisons - Gameweek ${data.gw}`,
      "/fpl/comparisons",
      "Popular owned players compared on expected points and form.",
      data.gw,
    ) +
    `## Featured comparisons\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownTransferTrends(): Promise<string> {
  const data = await getTransferTrendsHub()
  if (!data) return hubHeader("FPL transfer trends", "/fpl/transfer-trends", "Transfer trends unavailable.") + hubFooter()

  const rows = data.pairs
    .slice()
    .sort((a, b) => b.netTransfers - a.netTransfers)
    .slice(0, 20)
    .map((pair, i) => {
      return `${i + 1}. OUT **${pair.playerOut.displayName}** (${pair.playerOut.transfersOut.toLocaleString()} out) -> IN **${pair.playerIn.displayName}** (${pair.playerIn.transfersIn.toLocaleString()} in) - ${pair.position}`
    })

  return (
    hubHeader(
      `FPL transfer trends - Gameweek ${data.gw}`,
      "/fpl/transfer-trends",
      "Trending sell/buy pairs from live transfer event data.",
      data.gw,
    ) +
    `## Trending moves\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownInjuries(): Promise<string> {
  const data = await getInjuryHub()
  if (!data) return hubHeader("FPL injuries", "/fpl/injuries", "Injury hub unavailable.") + hubFooter()

  const rows = data.players.slice(0, 40).map((p) => {
    const news = p.news ? ` - ${p.news}` : ""
    return `- **${p.displayName}** (${p.club}, ${p.position}) - ${statusLabel(p.status, p.chance)}, ${p.chance}% chance${news}`
  })

  return (
    hubHeader(
      `FPL injuries and availability - Gameweek ${data.gw}`,
      "/fpl/injuries",
      "Flagged players from the FPL API news and status fields.",
      data.gw,
    ) +
    `## Flagged players (${data.players.length} total)\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownFixtures(): Promise<string> {
  const data = await getFixtureHub()
  if (!data) return hubHeader("FPL fixtures", "/fpl/fixtures", "Fixture hub unavailable.") + hubFooter()

  const rows = data.players.slice(0, 20).map((p, i) => {
    return `${i + 1}. **${p.displayName}** (${p.club}, ${p.position}) - Avg FDR next 5: ${p.avgFdr.toFixed(1)}, ${p.verdictLabel}`
  })

  return (
    hubHeader(
      `FPL fixture difficulty - Gameweek ${data.gw}`,
      "/fpl/fixtures",
      "Players with favourable upcoming fixture runs.",
      data.gw,
    ) +
    `## Best fixture runs\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownGameweeks(): Promise<string> {
  const data = await getGameweekHub()
  if (!data) return hubHeader("FPL gameweeks", "/fpl/gameweeks", "Gameweek planner unavailable.") + hubFooter()

  const rows = data.gameweeks.map((gw) => {
    const tags: string[] = []
    if (gw.isDGW) tags.push("Double GW")
    if (gw.isBGW) tags.push("Blank GW")
    const label = tags.length ? tags.join(", ") : "Normal"
    const teams = gw.isDGW && gw.dgwTeams.length
      ? ` Clubs with double: ${gw.dgwTeams.map((t) => t.teamShort).join(", ")}.`
      : gw.isBGW && gw.bgwTeams.length
        ? ` Clubs blanking: ${gw.bgwTeams.map((t) => t.teamShort).join(", ")}.`
        : ""
    return `- **GW${gw.gw}** (${label})${teams}`
  })

  const dgwPlayers = data.topDGWPlayers.slice(0, 10).map((p, i) => {
    return `${i + 1}. **${p.displayName}** (${p.club}) - xP ${p.ep_next.toFixed(1)}`
  })

  return (
    hubHeader(
      "FPL gameweek planner",
      "/fpl/gameweeks",
      "Upcoming blank and double gameweeks.",
    ) +
    `## Schedule\n\n${rows.join("\n")}\n\n## Top double-gameweek players\n\n${dgwPlayers.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownTeams(): Promise<string> {
  const [teams, captainHub] = await Promise.all([getTeamSlugs(), getCaptainHub()])
  const gw = captainHub?.gw ?? "?"

  const rows = teams.map((t) => `- ${mdLink(t.teamName, `/fpl/team/${t.teamSlug}`)} (${t.teamShort})`)

  return (
    hubHeader(
      `FPL players by club - Gameweek ${gw}`,
      "/fpl/teams",
      "Links to each Premier League club hub on ChatFPL.",
      gw,
    ) +
    `## Clubs\n\n${rows.join("\n")}\n` +
    hubFooter()
  )
}

async function markdownDefcon(): Promise<string> {
  const data = await getDefconHub()
  if (!data) return hubHeader("FPL DEFCON", "/fpl/defcon", "DEFCON hub unavailable.") + hubFooter()

  if (!data.ready) {
    return (
      hubHeader(
        "FPL DEFCON",
        "/fpl/defcon",
        "DEFCON rankings launch once the season has enough minutes for reliable per-90 rates.",
        data.gw,
      ) +
      `DEFCON is the 2025/26 bonus: defenders need 10+ CBIT (clearances, blocks, interceptions and tackles) in a match; midfielders need 12+ CBIT plus recoveries.\n\nRankings are not published yet. Max minutes in the league: ${data.maxMinutes}.\n` +
      hubFooter()
    )
  }

  const defRows = data.defenders.slice(0, 15).map((p, i) => {
    return `${i + 1}. **${p.displayName}** (${p.club}) - DC/90: ${p.dc90.toFixed(2)}, CBIT: ${p.cbit}, ${p.price}`
  })
  const midRows = data.midfielders.slice(0, 15).map((p, i) => {
    return `${i + 1}. **${p.displayName}** (${p.club}) - DC/90: ${p.dc90.toFixed(2)}, CBIT: ${p.cbit}, ${p.price}`
  })

  return (
    hubHeader(
      `FPL DEFCON - Gameweek ${data.gw}`,
      "/fpl/defcon",
      "Defensive contribution workload rankings for DEFCON scoring.",
      data.gw,
    ) +
    `## Top defenders (DC/90)\n\n${defRows.join("\n")}\n\n## Top midfielders (DC/90)\n\n${midRows.join("\n")}\n` +
    hubFooter()
  )
}

const GENERATORS: Record<string, () => Promise<string>> = {
  index: markdownIndex,
  "fpl/captains": markdownCaptains,
  "fpl/differentials": markdownDifferentials,
  "fpl/comparisons": markdownComparisons,
  "fpl/transfer-trends": markdownTransferTrends,
  "fpl/injuries": markdownInjuries,
  "fpl/fixtures": markdownFixtures,
  "fpl/gameweeks": markdownGameweeks,
  "fpl/teams": markdownTeams,
  "fpl/defcon": markdownDefcon,
}

/** e.g. "fpl/captains.md" -> generator */
export async function getLlmHubMarkdown(slugPath: string): Promise<string | null> {
  const id = slugPath.replace(/\.md$/i, "")
  const gen = GENERATORS[id]
  if (!gen) return null
  return gen()
}

export function buildSitemapMd(): string {
  const lines = [
    "# ChatFPL AI sitemap (Markdown hubs)",
    "",
    "> Markdown mirrors for AI crawlers. Canonical HTML pages are listed in sitemap.xml.",
    "",
    `- [llms.txt](${canonical("/llms.txt")})`,
    "",
    "## FPL hub pages",
    ...LLM_HUB_ENTRIES.map(
      (e) => `- [${e.title}](${canonical(e.mdPath)}) (HTML: ${canonical(e.htmlPath)})`,
    ),
    "",
  ]
  return lines.join("\n")
}

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const

export function markdownResponse(body: string): Response {
  return new Response(body, { headers: MARKDOWN_HEADERS })
}
