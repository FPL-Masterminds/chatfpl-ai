const FPL_HUB_SLUGS = new Set([
  "captains",
  "differentials",
  "comparisons",
  "transfer-trends",
  "injuries",
  "fixtures",
  "gameweeks",
  "teams",
  "defcon",
])

export type SitemapBreakdownRow = {
  id: string
  label: string
  count: number
}

function pathFromSitemapUrl(url: string): string {
  try {
    return new URL(url).pathname || "/"
  } catch {
    const withoutHost = url.replace(/^https?:\/\/[^/]+/i, "")
    return withoutHost.startsWith("/") ? withoutHost : `/${withoutHost}`
  }
}

/** Group sitemap URLs into buckets so admin can see what moved when totals jump. */
export function categorizeSitemapUrls(urls: string[]): SitemapBreakdownRow[] {
  const counts = {
    comparisons: 0,
    transfer_trends: 0,
    player_pages: 0,
    player_variants: 0,
    fixtures: 0,
    injuries: 0,
    teams: 0,
    gameweeks: 0,
    defcon: 0,
    best_value: 0,
    static_and_hubs: 0,
  }

  for (const url of urls) {
    const path = pathFromSitemapUrl(url)

    if (path.startsWith("/fpl/compare/")) {
      counts.comparisons++
      continue
    }
    if (path.startsWith("/fpl/transfer-trends/")) {
      counts.transfer_trends++
      continue
    }
    if (path.startsWith("/fpl/fixtures/")) {
      counts.fixtures++
      continue
    }
    if (path.startsWith("/fpl/injury/")) {
      counts.injuries++
      continue
    }
    if (path.startsWith("/fpl/team/")) {
      counts.teams++
      continue
    }
    if (path.startsWith("/fpl/gameweeks/") || path.startsWith("/fpl/double-gameweek/")) {
      counts.gameweeks++
      continue
    }
    if (path.startsWith("/fpl/defcon")) {
      counts.defcon++
      continue
    }
    if (path.startsWith("/fpl/best/")) {
      counts.best_value++
      continue
    }
    if (/^\/fpl\/[^/]+\/(transfer|sell|differential)$/.test(path)) {
      counts.player_variants++
      continue
    }

    const singleFplMatch = path.match(/^\/fpl\/([^/]+)$/)
    if (singleFplMatch && !FPL_HUB_SLUGS.has(singleFplMatch[1])) {
      counts.player_pages++
      continue
    }

    counts.static_and_hubs++
  }

  const rows: SitemapBreakdownRow[] = [
    { id: "comparisons", label: "Comparisons", count: counts.comparisons },
    { id: "transfer_trends", label: "Transfer trends", count: counts.transfer_trends },
    { id: "player_pages", label: "Player pages", count: counts.player_pages },
    { id: "player_variants", label: "Player transfer / sell / differential", count: counts.player_variants },
    { id: "fixtures", label: "Fixture pages", count: counts.fixtures },
    { id: "injuries", label: "Injury pages", count: counts.injuries },
    { id: "teams", label: "Team hubs", count: counts.teams },
    { id: "gameweeks", label: "Gameweeks & DGW", count: counts.gameweeks },
    { id: "defcon", label: "DEFCON", count: counts.defcon },
    { id: "best_value", label: "Best value", count: counts.best_value },
    { id: "static_and_hubs", label: "Static pages & hub indexes", count: counts.static_and_hubs },
  ]

  return rows.filter((row) => row.count > 0).sort((a, b) => b.count - a.count)
}

export function extractSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
}
