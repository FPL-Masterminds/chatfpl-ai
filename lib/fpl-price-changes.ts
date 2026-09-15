import { unstable_cache } from "next/cache"
import {
  getBootstrapFresh,
  buildSlugLookup,
  getDisplayName,
  filterEligiblePlayers,
  isEligiblePlayer,
} from "@/lib/fpl-player-page"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceChangeProjection {
  offset: number
  projectedPercent: number
  likelihood: number
}

export type PriceChangeDirection = "rise" | "fall" | "neutral"

export interface PriceChangePlayer {
  elementId: number
  slug: string
  displayName: string
  webName: string
  code: number
  club: string
  teamCode: number
  position: string
  elementType: number
  priceRaw: number
  price: string
  ownership: number
  transfersIn: number
  transfersOut: number
  costChangeEvent: number
  costChangeSeason: number
  progressPercent: number
  hourlyRate: number
  likelihood: number
  direction: PriceChangeDirection
  statusLabel: string
  projections: PriceChangeProjection[]
  lockedUntil: string | null
  isLocked: boolean
  calibrating: boolean
  news: string
  chance: number
  status: string
}

export interface PriceChangesHubData {
  gw: number
  fetchedAt: string
  nextChangeAt: string
  seasonCalibrating: boolean
  likelyRisers: PriceChangePlayer[]
  likelyFallers: PriceChangePlayer[]
  locked: PriceChangePlayer[]
  changedThisGw: PriceChangePlayer[]
  unlikely: PriceChangePlayer[]
}

export interface PlayerPriceOutlook {
  gw: number
  fetchedAt: string
  nextChangeAt: string
  player: PriceChangePlayer
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

export function parsePriceChangePercent(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function parsePriceProjections(raw: unknown): PriceChangeProjection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const offset = typeof row.offset === "number" ? row.offset : Number(row.offset)
      if (!Number.isFinite(offset)) return null
      return {
        offset,
        projectedPercent: parsePriceChangePercent(row.projected_percent),
        likelihood: typeof row.likelihood === "number" ? row.likelihood : Number(row.likelihood) || 0,
      }
    })
    .filter((item): item is PriceChangeProjection => item !== null)
    .sort((a, b) => a.offset - b.offset)
}

export function priceChangeDirection(likelihood: number): PriceChangeDirection {
  if (likelihood > 0) return "rise"
  if (likelihood < 0) return "fall"
  return "neutral"
}

export function isPriceLocked(lockedUntil: string | null | undefined): boolean {
  if (!lockedUntil) return false
  const until = new Date(lockedUntil)
  return Number.isFinite(until.getTime()) && until.getTime() > Date.now()
}

/**
 * FPL's official price-change likelihood scale from bootstrap-static:
 * positive = rising, negative = falling, 0 = unlikely to change.
 */
export function likelihoodLabel(likelihood: number, locked = false): string {
  if (locked) return "Price locked"
  if (likelihood >= 5) return "Very likely to rise"
  if (likelihood >= 3) return "Likely to rise"
  if (likelihood >= 1) return "Could rise"
  if (likelihood <= -5) return "Very likely to fall"
  if (likelihood <= -3) return "Likely to fall"
  if (likelihood <= -1) return "Could fall"
  return "Unlikely to change"
}

/** Next FPL nightly price change (UK midnight). */
export function getNextPriceChangeAt(from = new Date()): Date {
  const ukNow = new Date(from.toLocaleString("en-US", { timeZone: "Europe/London" }))
  const next = new Date(ukNow)
  next.setHours(24, 0, 0, 0)
  const offsetMs = ukNow.getTime() - from.getTime()
  return new Date(next.getTime() - offsetMs)
}

export function formatNextPriceChangeCountdown(from = new Date()): string {
  const ms = getNextPriceChangeAt(from).getTime() - from.getTime()
  if (ms <= 0) return "Any moment now"
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function planningGameweek(events: any[]): number {
  const nextEvent = events.find((e: any) => e.is_next)
  const currentEvent = events.find((e: any) => e.is_current)
  return nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1)
}

function buildMaps(bootstrap: any) {
  const teamMap: Record<number, { name: string; short: string; code: number }> = {}
  const posMap: Record<number, string> = {}
  ;(bootstrap.teams ?? []).forEach((t: any) => {
    teamMap[t.id] = { name: t.name, short: t.short_name, code: t.code }
  })
  ;(bootstrap.element_types ?? []).forEach((et: any) => {
    posMap[et.id] = et.singular_name_short
  })
  return { teamMap, posMap }
}

function buildPriceChangePlayer(
  el: any,
  slug: string,
  teamMap: Record<number, { name: string; short: string; code: number }>,
  posMap: Record<number, string>,
): PriceChangePlayer {
  const team = teamMap[el.team] ?? { name: "", short: "?", code: 0 }
  const projections = parsePriceProjections(el.price_change_projections)
  const tonight = projections.find((p) => p.offset === 0)
  const likelihood = tonight?.likelihood ?? 0
  const lockedUntil = typeof el.price_change_locked_until === "string" ? el.price_change_locked_until : null
  const locked = isPriceLocked(lockedUntil)
  const priceRaw = (el.now_cost ?? 0) / 10

  return {
    elementId: el.id,
    slug,
    displayName: getDisplayName(el),
    webName: el.web_name,
    code: el.code,
    club: team.name,
    teamCode: team.code,
    position: posMap[el.element_type] ?? "",
    elementType: el.element_type,
    priceRaw,
    price: `£${priceRaw.toFixed(1)}m`,
    ownership: parseFloat(el.selected_by_percent ?? "0"),
    transfersIn: el.transfers_in_event ?? 0,
    transfersOut: el.transfers_out_event ?? 0,
    costChangeEvent: (el.cost_change_event ?? 0) / 10,
    costChangeSeason: (el.cost_change_start ?? 0) / 10,
    progressPercent: parsePriceChangePercent(el.price_change_percent),
    hourlyRate: typeof el.price_change_hourly_rate === "number" ? el.price_change_hourly_rate : 0,
    likelihood,
    direction: priceChangeDirection(likelihood),
    statusLabel: likelihoodLabel(likelihood, locked),
    projections,
    lockedUntil,
    isLocked: locked,
    calibrating: Boolean(el.price_change_calibrating),
    news: el.news ?? "",
    chance: el.chance_of_playing_next_round ?? 100,
    status: el.status ?? "a",
  }
}

function sortRisers(a: PriceChangePlayer, b: PriceChangePlayer): number {
  return b.likelihood - a.likelihood
    || Math.abs(b.progressPercent) - Math.abs(a.progressPercent)
    || b.hourlyRate - a.hourlyRate
}

function sortFallers(a: PriceChangePlayer, b: PriceChangePlayer): number {
  return a.likelihood - b.likelihood
    || Math.abs(b.progressPercent) - Math.abs(a.progressPercent)
    || b.hourlyRate - a.hourlyRate
}

function sortChanged(a: PriceChangePlayer, b: PriceChangePlayer): number {
  return Math.abs(b.costChangeEvent) - Math.abs(a.costChangeEvent)
    || Math.abs(b.progressPercent) - Math.abs(a.progressPercent)
}

// ─── Hub data (15-minute cache) ───────────────────────────────────────────────

const loadPriceChangesHub = unstable_cache(
  async (): Promise<PriceChangesHubData | null> => {
    try {
      const bootstrap = await getBootstrapFresh()
      if (!bootstrap?.elements?.length) return null

      const gw = planningGameweek(bootstrap.events ?? [])
      const fetchedAt = new Date().toISOString()
      const nextChangeAt = getNextPriceChangeAt().toISOString()
      const { teamMap, posMap } = buildMaps(bootstrap)

      const eligible = filterEligiblePlayers(bootstrap.elements ?? [])
      const slugLookup = buildSlugLookup(eligible, bootstrap.teams ?? [])
      const idToSlug = new Map<number, string>()
      for (const [slug, id] of slugLookup) idToSlug.set(id, slug)

      const players: PriceChangePlayer[] = eligible.map((el: any) =>
        buildPriceChangePlayer(el, idToSlug.get(el.id) ?? "", teamMap, posMap),
      )

      const seasonCalibrating = players.some((p) => p.calibrating)

      const locked = players
        .filter((p) => p.isLocked)
        .sort((a, b) => (a.lockedUntil ?? "").localeCompare(b.lockedUntil ?? ""))

      const active = players.filter((p) => !p.isLocked)

      const likelyRisers = active
        .filter((p) => p.likelihood > 0)
        .sort(sortRisers)

      const likelyFallers = active
        .filter((p) => p.likelihood < 0)
        .sort(sortFallers)

      const changedThisGw = active
        .filter((p) => p.costChangeEvent !== 0)
        .sort(sortChanged)

      const unlikely = active
        .filter((p) => p.likelihood === 0 && p.costChangeEvent === 0)
        .sort((a, b) => Math.abs(b.progressPercent) - Math.abs(a.progressPercent))

      return {
        gw,
        fetchedAt,
        nextChangeAt,
        seasonCalibrating,
        likelyRisers,
        likelyFallers,
        locked,
        changedThisGw,
        unlikely,
      }
    } catch {
      return null
    }
  },
  ["fpl-price-changes-hub"],
  { revalidate: 900 },
)

export async function getPriceChangesHub(): Promise<PriceChangesHubData | null> {
  return loadPriceChangesHub()
}

export async function getPlayerPriceOutlook(
  slug: string,
): Promise<PlayerPriceOutlook | null> {
  const hub = await getPriceChangesHub()
  if (!hub) return null

  const player =
    [...hub.likelyRisers, ...hub.likelyFallers, ...hub.locked, ...hub.changedThisGw, ...hub.unlikely]
      .find((p) => p.slug === slug)

  if (!player) return null

  return {
    gw: hub.gw,
    fetchedAt: hub.fetchedAt,
    nextChangeAt: hub.nextChangeAt,
    player,
  }
}

export async function getPlayerPriceOutlookByElementId(
  elementId: number,
): Promise<PlayerPriceOutlook | null> {
  const hub = await getPriceChangesHub()
  if (!hub) return null

  const player =
    [...hub.likelyRisers, ...hub.likelyFallers, ...hub.locked, ...hub.changedThisGw, ...hub.unlikely]
      .find((p) => p.elementId === elementId)

  if (!player) return null

  return {
    gw: hub.gw,
    fetchedAt: hub.fetchedAt,
    nextChangeAt: hub.nextChangeAt,
    player,
  }
}

/** Look up any bootstrap element, including ineligible players not shown on the hub. */
export async function getPlayerPriceOutlookFromBootstrap(
  slug: string,
): Promise<PlayerPriceOutlook | null> {
  try {
    const bootstrap = await getBootstrapFresh()
    if (!bootstrap?.elements?.length) return null

    const gw = planningGameweek(bootstrap.events ?? [])
    const fetchedAt = new Date().toISOString()
    const nextChangeAt = getNextPriceChangeAt().toISOString()
    const { teamMap, posMap } = buildMaps(bootstrap)

    const allWithSlugs = bootstrap.elements ?? []
    const slugLookup = buildSlugLookup(
      allWithSlugs.filter(isEligiblePlayer),
      bootstrap.teams ?? [],
    )

    let elementId: number | undefined
    for (const [s, id] of slugLookup) {
      if (s === slug) {
        elementId = id
        break
      }
    }
    if (!elementId) return null

    const el = allWithSlugs.find((p: any) => p.id === elementId)
    if (!el) return null

    return {
      gw,
      fetchedAt,
      nextChangeAt,
      player: buildPriceChangePlayer(el, slug, teamMap, posMap),
    }
  } catch {
    return null
  }
}
