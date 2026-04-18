import { getBootstrap, toSlug, getDisplayName } from "@/lib/fpl-player-page"

export interface InjuryPlayer {
  slug:        string
  displayName: string
  webName:     string
  code:        number
  club:        string
  teamCode:    number
  position:    string
  price:       string
  status:      string   // a / d / i / u / s
  news:        string
  chance:      number   // 0–100
  minutes:     number
  form:        string
  totalPts:    number
  epNext:      number
}

export interface InjuryHubData {
  gw:      number
  players: InjuryPlayer[]
}

// Status label helpers
export function statusLabel(status: string, chance: number): string {
  if (status === "i") return "Injured"
  if (status === "u") return "Unavailable"
  if (status === "s") return "Suspended"
  if (status === "d" || chance < 75) return chance < 50 ? "Injury Doubt" : "Fitness Concern"
  return "Available"
}

export function isFlagged(p: { status: string; chance: number; news: string }): boolean {
  return p.status !== "a" || p.chance < 100 || p.news !== ""
}

// ─── Hub data — all flagged players ──────────────────────────────────────────

export async function getInjuryHub(): Promise<InjuryHubData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent    = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number   = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const posMap: Record<number, string> = {}
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })

    const slugCounts: Record<string, number> = {}
    const players: InjuryPlayer[] = (bootstrap.elements ?? [])
      .filter((p: any) => {
        const status = p.status ?? "a"
        const chance = p.chance_of_playing_next_round ?? 100
        const news   = p.news ?? ""
        return isFlagged({ status, chance, news })
      })
      .map((p: any) => {
        const base  = toSlug(p.web_name)
        const team  = teamMap[p.team] ?? { name: "", short: "?", code: 0 }
        slugCounts[base] = (slugCounts[base] ?? 0) + 1
        const slug  = slugCounts[base] > 1 ? toSlug(p.web_name, team.short) : base
        return {
          slug,
          displayName: getDisplayName(p),
          webName:     p.web_name,
          code:        p.code,
          club:        team.short,
          teamCode:    team.code,
          position:    posMap[p.element_type] ?? "",
          price:       `£${(p.now_cost / 10).toFixed(1)}m`,
          status:      p.status ?? "a",
          news:        p.news ?? "",
          chance:      p.chance_of_playing_next_round ?? 100,
          minutes:     p.minutes ?? 0,
          form:        p.form ?? "0.0",
          totalPts:    p.total_points ?? 0,
          epNext:      parseFloat(p.ep_next ?? "0"),
        }
      })
      // Sort: unavailable/injured first, then by chance ascending
      .sort((a, b) => {
        const order: Record<string, number> = { i: 0, u: 1, s: 2, d: 3, a: 4 }
        const statusDiff = (order[a.status] ?? 4) - (order[b.status] ?? 4)
        if (statusDiff !== 0) return statusDiff
        return a.chance - b.chance
      })

    return { gw, players }
  } catch {
    return null
  }
}

// ─── Individual player injury data ───────────────────────────────────────────

export interface InjuryPlayerData {
  gw:           number
  player:       InjuryPlayer
  alternatives: InjuryPlayer[]  // fit players, same position, similar price
}

export async function getInjuryPlayerData(slug: string): Promise<InjuryPlayerData | null> {
  try {
    const bootstrap = await getBootstrap()
    const events: any[] = bootstrap.events ?? []
    const nextEvent    = events.find((e: any) => e.is_next)
    const currentEvent = events.find((e: any) => e.is_current)
    const gw: number   = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)

    const posMap: Record<number, string> = {}
    ;(bootstrap.element_types ?? []).forEach((et: any) => {
      posMap[et.id] = et.singular_name_short
    })

    const teamMap: Record<number, { name: string; short: string; code: number }> = {}
    ;(bootstrap.teams ?? []).forEach((t: any) => {
      teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
    })

    // Build slug → element map
    const slugCounts: Record<string, number> = {}
    const allMapped = (bootstrap.elements ?? []).map((p: any) => {
      const base = toSlug(p.web_name)
      const team = teamMap[p.team] ?? { name: "", short: "?", code: 0 }
      slugCounts[base] = (slugCounts[base] ?? 0) + 1
      const pSlug = slugCounts[base] > 1 ? toSlug(p.web_name, team.short) : base
      return { ...p, _slug: pSlug, _team: team, _pos: posMap[p.element_type] ?? "" }
    })

    const el = allMapped.find((p: any) => p._slug === slug)
    if (!el) return null

    const player: InjuryPlayer = {
      slug,
      displayName: getDisplayName(el),
      webName:     el.web_name,
      code:        el.code,
      club:        el._team.short,
      teamCode:    el._team.code,
      position:    el._pos,
      price:       `£${(el.now_cost / 10).toFixed(1)}m`,
      status:      el.status ?? "a",
      news:        el.news ?? "",
      chance:      el.chance_of_playing_next_round ?? 100,
      minutes:     el.minutes ?? 0,
      form:        el.form ?? "0.0",
      totalPts:    el.total_points ?? 0,
      epNext:      parseFloat(el.ep_next ?? "0"),
    }

    // Suggest 4 fit alternatives — same position, similar price, fully fit
    const playerCost = el.now_cost
    const alternatives: InjuryPlayer[] = allMapped
      .filter((p: any) =>
        p.id !== el.id &&
        p.element_type === el.element_type &&
        (p.status ?? "a") === "a" &&
        (p.chance_of_playing_next_round ?? 100) >= 75 &&
        p.minutes > 200 &&
        Math.abs(p.now_cost - playerCost) <= 20  // within £2.0m
      )
      .sort((a: any, b: any) =>
        parseFloat(b.ep_next ?? "0") - parseFloat(a.ep_next ?? "0")
      )
      .slice(0, 4)
      .map((p: any) => ({
        slug:        p._slug,
        displayName: getDisplayName(p),
        webName:     p.web_name,
        code:        p.code,
        club:        p._team.short,
        teamCode:    p._team.code,
        position:    p._pos,
        price:       `£${(p.now_cost / 10).toFixed(1)}m`,
        status:      p.status ?? "a",
        news:        p.news ?? "",
        chance:      p.chance_of_playing_next_round ?? 100,
        minutes:     p.minutes ?? 0,
        form:        p.form ?? "0.0",
        totalPts:    p.total_points ?? 0,
        epNext:      parseFloat(p.ep_next ?? "0"),
      }))

    return { gw, player, alternatives }
  } catch {
    return null
  }
}

// ─── Slugs for static params + sitemap ───────────────────────────────────────

export async function getInjurySlugs(): Promise<{ slug: string }[]> {
  try {
    const hub = await getInjuryHub()
    if (!hub) return []
    return hub.players.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}
