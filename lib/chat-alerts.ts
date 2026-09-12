import { fplPhotoUrlFromElement } from "@/lib/fpl-player-photo"
import { fplLiveFetchOptions } from "@/lib/fpl-gw-live-status"

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

export async function buildChatAlerts(fplTeamId: number | null): Promise<ChatAlert[]> {
  const bootstrap = await fetchJson("https://fantasy.premierleague.com/api/bootstrap-static/")
  if (!bootstrap) return []

  const elements: any[] = bootstrap.elements ?? []
  const events: any[] = bootstrap.events ?? []
  const alerts: ChatAlert[] = []

  const current = events.find((e: any) => e.is_current)
  const next = events.find((e: any) => e.is_next)
  const planning = next ?? current
  const deadlineHours = hoursUntil(planning?.deadline_time)
  const gwLabel = planning?.name || (planning?.id ? `GW${planning.id}` : "this gameweek")

  if (deadlineHours != null && deadlineHours > 0 && deadlineHours <= 36) {
    const hours = Math.max(1, Math.round(deadlineHours))
    alerts.push({
      id: `deadline-${planning?.id ?? "next"}`,
      title: `${gwLabel} deadline`,
      body: `${greeting()}. ${hours} hour${hours === 1 ? "" : "s"} left to lock transfers.`,
      prompt: "What should I do before the deadline using xP, form and my squad?",
      avatar: { kind: "cf" },
    })
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
      .filter((e: any) => ["d", "i", "u", "s"].includes(e.status))
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
        "is unavailable"
      const extra = flagged.length > 1 ? ` +${flagged.length - 1} more in your squad` : ""
      alerts.push({
        id: `squad-flag-${top.id}`,
        title: top.web_name,
        body: `${label}${extra}. ${top.news || "Check before you lock."}`.trim(),
        prompt: `Should I transfer out ${top.web_name} given their status, minutes and xP?`,
        avatar: {
          kind: "player",
          name: top.web_name,
          photoUrl: fplPhotoUrlFromElement(top.photo, top.code),
        },
      })
    }

    const sold = [...squadPlayers]
      .filter((e: any) => (e.transfers_out_event ?? 0) > 80_000)
      .sort((a: any, b: any) => (b.transfers_out_event ?? 0) - (a.transfers_out_event ?? 0))[0]

    if (sold) {
      alerts.push({
        id: `squad-sold-${sold.id}`,
        title: sold.web_name,
        body: `${formatSold(sold.transfers_out_event)} transfers out this week. Check the numbers before you follow.`,
        prompt: `Is ${sold.web_name} a sell on form, xP and fixtures, or a hold?`,
        avatar: {
          kind: "player",
          name: sold.web_name,
          photoUrl: fplPhotoUrlFromElement(sold.photo, sold.code),
        },
      })
    }
  } else {
    alerts.push({
      id: "link-team",
      title: "Link your FPL team",
      body: "Personal alerts need your public Team ID. Takes about 10 seconds in Settings.",
      prompt: "How do I get the most from ChatFPL once my FPL team is linked?",
      avatar: { kind: "cf" },
    })
  }

  const rising = [...elements]
    .filter((e: any) => (e.minutes ?? 0) >= 90)
    .sort((a: any, b: any) => (b.transfers_in_event ?? 0) - (a.transfers_in_event ?? 0))[0]

  if (rising && (rising.transfers_in_event ?? 0) > 50_000) {
    alerts.push({
      id: `momentum-${rising.id}`,
      title: rising.web_name,
      body: `Most transferred in this week (${formatSold(rising.transfers_in_event)}). Worth a look on xP and ownership.`,
      prompt: `Is ${rising.web_name} a good buy this week on xP, form and fixtures?`,
      avatar: {
        kind: "player",
        name: rising.web_name,
        photoUrl: fplPhotoUrlFromElement(rising.photo, rising.code),
      },
    })
  }

  return alerts.slice(0, 4)
}
