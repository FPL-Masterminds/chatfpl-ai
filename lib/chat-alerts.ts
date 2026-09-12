import { fplPhotoUrlFromElement } from "@/lib/fpl-player-photo"
import { fplLiveFetchOptions } from "@/lib/fpl-gw-live-status"
import { asciiPlayerName } from "@/lib/chat-player-filter"

function promptName(player: { web_name?: string }): string {
  return asciiPlayerName(String(player.web_name ?? ""))
}

export type ChatAlertAvatar =
  | { kind: "cf" }
  | { kind: "player"; photoUrl: string; name: string }

export type ChatAlert = {
  id: string
  title: string
  body: string
  prompt: string
  avatar: ChatAlertAvatar
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Morning"
  if (h < 18) return "Afternoon"
  return "Evening"
}

function formatSold(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

function hoursUntil(iso: string | undefined): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(ms)) return null
  return ms / 3_600_000
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function playerAlert(
  id: string,
  player: any,
  title: string,
  body: string,
  prompt: string,
): ChatAlert {
  return {
    id,
    title: asciiPlayerName(title),
    body,
    prompt,
    avatar: {
      kind: "player",
      name: asciiPlayerName(player.web_name),
      photoUrl: fplPhotoUrlFromElement(player.photo, player.code),
    },
  }
}

function cfAlert(id: string, title: string, body: string, prompt: string): ChatAlert {
  return { id, title, body, prompt, avatar: { kind: "cf" } }
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      ...fplLiveFetchOptions(),
      headers: { "User-Agent": "ChatFPL/1.0" },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function fixtureCountsForGw(
  fixtures: any[],
  gwId: number,
  teams: any[],
): { blanks: any[]; doubles: any[] } {
  const counts = new Map<number, number>()
  for (const team of teams) counts.set(team.id, 0)
  for (const f of fixtures) {
    if (f.event !== gwId) continue
    counts.set(f.team_h, (counts.get(f.team_h) ?? 0) + 1)
    counts.set(f.team_a, (counts.get(f.team_a) ?? 0) + 1)
  }
  const blanks: any[] = []
  const doubles: any[] = []
  for (const team of teams) {
    const n = counts.get(team.id) ?? 0
    if (n === 0) blanks.push(team)
    if (n >= 2) doubles.push(team)
  }
  return { blanks, doubles }
}

export async function buildChatAlerts(fplTeamId: number | null): Promise<ChatAlert[]> {
  const [bootstrap, fixtures] = await Promise.all([
    fetchJson("https://fantasy.premierleague.com/api/bootstrap-static/"),
    fetchJson("https://fantasy.premierleague.com/api/fixtures/"),
  ])
  if (!bootstrap) return []

  const elements: any[] = bootstrap.elements ?? []
  const events: any[] = bootstrap.events ?? []
  const teams: any[] = bootstrap.teams ?? []
  const fixtureRows: any[] = Array.isArray(fixtures) ? fixtures : []

  const current = events.find((e: any) => e.is_current)
  const next = events.find((e: any) => e.is_next)
  const planning = next ?? current
  const planningGwId: number | null = planning?.id ?? null
  const deadlineHours = hoursUntil(planning?.deadline_time)
  const gwLabel = planning?.name || (planningGwId ? `GW${planningGwId}` : "this gameweek")

  const { blanks, doubles } = planningGwId
    ? fixtureCountsForGw(fixtureRows, planningGwId, teams)
    : { blanks: [], doubles: [] }
  const blankIds = new Set(blanks.map((t: any) => t.id))
  const doubleIds = new Set(doubles.map((t: any) => t.id))

  const alerts: ChatAlert[] = []

  if (deadlineHours != null && deadlineHours > 0 && deadlineHours <= 36) {
    const hours = Math.max(1, Math.round(deadlineHours))
    alerts.push(cfAlert(
      `deadline-${planningGwId ?? "next"}`,
      `${gwLabel} deadline`,
      `${greeting()}. ${hours} hour${hours === 1 ? "" : "s"} left to lock transfers.`,
      "What should I do before the deadline using xP, form and my squad?",
    ))
  }

  if (doubles.length > 0) {
    const names = doubles.map((t: any) => t.short_name).slice(0, 4).join(", ")
    alerts.push(cfAlert(
      `dgw-${planningGwId}`,
      `Double gameweek ${planningGwId}`,
      `${names} play twice. Prioritise minutes and xP, not just the badge.`,
      `Who are the must-haves and traps for the ${gwLabel} Double Gameweek on xP?`,
    ))
  }

  if (blanks.length > 0) {
    const names = blanks.map((t: any) => t.short_name).slice(0, 4).join(", ")
    alerts.push(cfAlert(
      `bgw-${planningGwId}`,
      `Blank gameweek ${planningGwId}`,
      `${names} have no fixture. Do not captain or transfer them in.`,
      `Who should I avoid in ${gwLabel} because of blanks, and who is the replacement?`,
    ))
  }

  let squadPlayers: any[] = []
  if (fplTeamId) {
    const entry = await fetchJson(`https://fantasy.premierleague.com/api/entry/${fplTeamId}/`)
    const gwId = current?.id ?? entry?.current_event ?? next?.id
    const picksPayload = gwId
      ? await fetchJson(`https://fantasy.premierleague.com/api/entry/${fplTeamId}/event/${gwId}/picks/`)
      : null
    const squadIds = new Set((picksPayload?.picks ?? []).map((p: any) => p.element))
    squadPlayers = elements.filter((e: any) => squadIds.has(e.id))

    const flagged = squadPlayers
      .filter((e: any) => ["d", "i", "u", "s"].includes(e.status) || toNum(e.chance_of_playing_next_round) < 50)
      .sort((a: any, b: any) => {
        const priority: Record<string, number> = { i: 4, u: 3, s: 2, d: 1 }
        return (priority[b.status] || 0) - (priority[a.status] || 0)
      })

    if (flagged[0]) {
      const top = flagged[0]
      const label =
        top.status === "d" ? "is a doubt" :
        top.status === "i" ? "is injured" :
        top.status === "s" ? "is suspended" :
        top.status === "u" ? "is unavailable" :
        "has a fitness flag"
      const extra = flagged.length > 1 ? ` +${flagged.length - 1} more in your squad` : ""
      alerts.push(playerAlert(
        `squad-flag-${top.id}`,
        top,
        top.web_name,
        `${label}${extra}. ${top.news || "Check before you lock."}`.trim(),
        `Should I transfer out ${top.web_name} given their status, minutes and xP?`,
      ))
    }

    const squadBlank = squadPlayers.find((e: any) => blankIds.has(e.team) && (e.status ?? "a") === "a")
    if (squadBlank) {
      const club = teams.find((t: any) => t.id === squadBlank.team)?.name ?? "their club"
      alerts.push(playerAlert(
        `squad-blank-${squadBlank.id}`,
        squadBlank,
        squadBlank.web_name,
        `${club} are blank in ${gwLabel}. Bench them or move them on.`,
        `I own ${squadBlank.web_name} and they have a blank. Who is the best replacement on xP and price?`,
      ))
    }

    const squadDgw = squadPlayers.find((e: any) => doubleIds.has(e.team))
    if (squadDgw) {
      alerts.push(playerAlert(
        `squad-dgw-${squadDgw.id}`,
        squadDgw,
        squadDgw.web_name,
        `Two fixtures in ${gwLabel}. Check minutes and xP before you captain or hold.`,
        `I own ${squadDgw.web_name} in a Double Gameweek. Should I captain them or just start them?`,
      ))
    }

    const squadFall = [...squadPlayers]
      .filter((e: any) => toNum(e.cost_change_event) < 0)
      .sort((a: any, b: any) => toNum(a.cost_change_event) - toNum(b.cost_change_event))[0]
    if (squadFall) {
      const drop = Math.abs(toNum(squadFall.cost_change_event) / 10).toFixed(1)
      alerts.push(playerAlert(
        `squad-fall-${squadFall.id}`,
        squadFall,
        squadFall.web_name,
        `Down £${drop}m this week. Decide on the numbers, not the price tick.`,
        `I own ${squadFall.web_name} and they just dropped in price. Hold or sell on form and xP?`,
      ))
    }

    const squadRise = [...squadPlayers]
      .filter((e: any) => toNum(e.cost_change_event) > 0)
      .sort((a: any, b: any) => toNum(b.cost_change_event) - toNum(a.cost_change_event))[0]
    if (squadRise && !squadFall) {
      const rise = (toNum(squadRise.cost_change_event) / 10).toFixed(1)
      alerts.push(playerAlert(
        `squad-rise-${squadRise.id}`,
        squadRise,
        squadRise.web_name,
        `Up £${rise}m this week. Nice if you already own them. Not a reason to buy late.`,
        `I own ${squadRise.web_name} after a price rise. Still a hold on xP and fixtures?`,
      ))
    }

    const sold = [...squadPlayers]
      .filter((e: any) => toNum(e.transfers_out_event) > 80_000)
      .sort((a: any, b: any) => toNum(b.transfers_out_event) - toNum(a.transfers_out_event))[0]
    if (sold) {
      alerts.push(playerAlert(
        `squad-sold-${sold.id}`,
        sold,
        sold.web_name,
        `${formatSold(sold.transfers_out_event)} transfers out this week. Check the numbers before you follow.`,
        `Is ${sold.web_name} a sell on form, xP and fixtures, or a hold?`,
      ))
    }

    const defconOwned = [...squadPlayers]
      .filter((e: any) => (e.element_type === 2 || e.element_type === 3) && toNum(e.defensive_contribution_per_90) >= 11)
      .sort((a: any, b: any) => toNum(b.defensive_contribution_per_90) - toNum(a.defensive_contribution_per_90))[0]
    if (defconOwned) {
      alerts.push(playerAlert(
        `squad-defcon-${defconOwned.id}`,
        defconOwned,
        defconOwned.web_name,
        `${toNum(defconOwned.defensive_contribution_per_90).toFixed(1)} DEFCON actions per 90. That is a real floor, not just attacking luck.`,
        `How should I use ${defconOwned.web_name}'s DEFCON numbers in my transfer and captain plan?`,
      ))
    }

    const coldOwned = [...squadPlayers]
      .filter((e: any) => toNum(e.form) > 0 && toNum(e.form) < 2.5 && toNum(e.selected_by_percent) >= 15 && toNum(e.now_cost) >= 70)
      .sort((a: any, b: any) => toNum(a.form) - toNum(b.form))[0]
    if (coldOwned) {
      alerts.push(playerAlert(
        `squad-cold-${coldOwned.id}`,
        coldOwned,
        coldOwned.web_name,
        `Form is ${toNum(coldOwned.form).toFixed(1)} at ${toNum(coldOwned.selected_by_percent).toFixed(1)}% ownership. Premium price, cold return.`,
        `Is ${coldOwned.web_name} a hold or a sell based on form, xP and fixtures?`,
      ))
    }
  } else {
    alerts.push(cfAlert(
      "link-team",
      "Link your FPL team",
      "Link your FPL Team ID in Settings for reliable squad advice. Pasting players in chat can lose context.",
      "How do I get the most from ChatFPL once my FPL team is linked?",
    ))
  }

  const leagueRiser = [...elements]
    .filter((e: any) => toNum(e.cost_change_event) >= 2 && toNum(e.minutes) >= 90)
    .sort((a: any, b: any) => toNum(b.cost_change_event) - toNum(a.cost_change_event))[0]
  if (leagueRiser && !squadPlayers.some((p) => p.id === leagueRiser.id)) {
    const rise = (toNum(leagueRiser.cost_change_event) / 10).toFixed(1)
    alerts.push(playerAlert(
      `price-rise-${leagueRiser.id}`,
      leagueRiser,
      leagueRiser.web_name,
      `Up £${rise}m this week. Chase the underlying numbers, not the price arrow.`,
      `Is ${leagueRiser.web_name} still worth buying after the price rise on xP and fixtures?`,
    ))
  }

  const rising = [...elements]
    .filter((e: any) => toNum(e.minutes) >= 90)
    .sort((a: any, b: any) => toNum(b.transfers_in_event) - toNum(a.transfers_in_event))[0]
  if (rising && toNum(rising.transfers_in_event) > 50_000) {
    alerts.push(playerAlert(
      `momentum-${rising.id}`,
      rising,
      rising.web_name,
      `Most transferred in this week (${formatSold(rising.transfers_in_event)}). Worth a look on xP and ownership.`,
      `Is ${rising.web_name} a good buy this week on xP, form and fixtures?`,
    ))
  }

  const trap = [...elements]
    .filter((e: any) => toNum(e.transfers_in_event) > 80_000 && toNum(e.ep_next) < 4 && toNum(e.minutes) >= 90)
    .sort((a: any, b: any) => toNum(b.transfers_in_event) - toNum(a.transfers_in_event))[0]
  if (trap && trap.id !== rising?.id) {
    alerts.push(playerAlert(
      `trap-${trap.id}`,
      trap,
      trap.web_name,
      `${formatSold(trap.transfers_in_event)} transfers in, but xP next is only ${toNum(trap.ep_next).toFixed(1)}. Possible bandwagon.`,
      `Is ${trap.web_name} a trap buy this week if xP is only ${toNum(trap.ep_next).toFixed(1)}?`,
    ))
  }

  const defconGem = [...elements]
    .filter((e: any) =>
      (e.element_type === 2 || e.element_type === 3) &&
      toNum(e.defensive_contribution_per_90) >= 12 &&
      toNum(e.selected_by_percent) < 10 &&
      toNum(e.minutes) >= 180 &&
      !squadPlayers.some((p) => p.id === e.id)
    )
    .sort((a: any, b: any) => toNum(b.defensive_contribution_per_90) - toNum(a.defensive_contribution_per_90))[0]
  if (defconGem) {
    alerts.push(playerAlert(
      `defcon-gem-${defconGem.id}`,
      defconGem,
      defconGem.web_name,
      `${toNum(defconGem.defensive_contribution_per_90).toFixed(1)} DEFCON actions per 90 and only ${toNum(defconGem.selected_by_percent).toFixed(1)}% owned.`,
      `Is ${defconGem.web_name} a good DEFCON differential at ${toNum(defconGem.selected_by_percent).toFixed(1)}% ownership?`,
    ))
  }

  const xpDiff = [...elements]
    .filter((e: any) =>
      toNum(e.ep_next) >= 6 &&
      toNum(e.selected_by_percent) < 12 &&
      (e.status ?? "a") === "a" &&
      !blankIds.has(e.team)
    )
    .sort((a: any, b: any) => toNum(b.ep_next) - toNum(a.ep_next))[0]
  if (xpDiff) {
    alerts.push(playerAlert(
      `xp-diff-${xpDiff.id}`,
      xpDiff,
      xpDiff.web_name,
      `${toNum(xpDiff.ep_next).toFixed(1)} xP this week at ${toNum(xpDiff.selected_by_percent).toFixed(1)}% ownership. Strong differential captain case.`,
      `Is ${xpDiff.web_name} a better captain than the template pick on xP this week?`,
    ))
  }

  const seen = new Set<string>()
  return alerts.filter((alert) => {
    if (seen.has(alert.id)) return false
    seen.add(alert.id)
    return true
  }).slice(0, 8)
}
