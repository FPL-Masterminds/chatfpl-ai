/**
 * Derives FPL transfer-window status from live bootstrap event data.
 * No seasonal toggles: GW1 deadline from the FPL API is the single source of truth.
 */

export interface FplEventLike {
  id: number
  name: string
  deadline_time: string
  finished: boolean
  is_current?: boolean
  is_next?: boolean
}

export interface TransferWindowStatus {
  nowIso: string
  unlimitedTransfersActive: boolean
  gw1DeadlinePassed: boolean
  gw1: { id: number; name: string; deadlineUk: string } | null
  scoringGameweek: { id: number; name: string; finished: boolean } | null
  transferPlanningGameweek: { id: number; name: string; deadlineUk: string } | null
}

export function formatFplDeadlineUk(isoString: string): string {
  const date = new Date(isoString)
  const ukDate = new Date(date.toLocaleString("en-GB", { timeZone: "Europe/London" }))
  const day = String(ukDate.getDate()).padStart(2, "0")
  const month = String(ukDate.getMonth() + 1).padStart(2, "0")
  const year = ukDate.getFullYear()
  const hours = String(ukDate.getHours()).padStart(2, "0")
  const minutes = String(ukDate.getMinutes()).padStart(2, "0")
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

export function getTransferWindowStatus(
  events: FplEventLike[],
  now: Date = new Date(),
): TransferWindowStatus {
  const gw1 = events.find((e) => e.id === 1) ?? events[0] ?? null
  const scoringGameweek = events.find((e) => e.is_current) ?? null

  const gw1Deadline = gw1?.deadline_time ? new Date(gw1.deadline_time) : null
  const gw1DeadlinePassed = gw1Deadline ? now >= gw1Deadline : false
  const unlimitedTransfersActive = gw1Deadline ? now < gw1Deadline : false

  const upcomingDeadlineEvent =
    events
      .filter((e) => e.deadline_time && new Date(e.deadline_time) > now)
      .sort(
        (a, b) =>
          new Date(a.deadline_time).getTime() - new Date(b.deadline_time).getTime(),
      )[0] ?? null

  const transferPlanningGameweek = upcomingDeadlineEvent
    ? {
        id: upcomingDeadlineEvent.id,
        name: upcomingDeadlineEvent.name,
        deadlineUk: formatFplDeadlineUk(upcomingDeadlineEvent.deadline_time),
      }
    : null

  return {
    nowIso: now.toISOString(),
    unlimitedTransfersActive,
    gw1DeadlinePassed,
    gw1: gw1
      ? {
          id: gw1.id,
          name: gw1.name,
          deadlineUk: formatFplDeadlineUk(gw1.deadline_time),
        }
      : null,
    scoringGameweek: scoringGameweek
      ? {
          id: scoringGameweek.id,
          name: scoringGameweek.name,
          finished: scoringGameweek.finished,
        }
      : null,
    transferPlanningGameweek,
  }
}

/**
 * Authoritative transfer block for chat context. The model should follow this
 * instead of inferring from CURRENT GAMEWEEK Finished status.
 */
export function formatTransferWindowContext(status: TransferWindowStatus): string {
  const lines: string[] = [
    "TRANSFER WINDOW (computed from live FPL deadlines - authoritative, do not override):",
  ]

  if (status.unlimitedTransfersActive && status.gw1) {
    lines.push(`- Status: PRE-SEASON UNLIMITED TRANSFERS ACTIVE until ${status.gw1.name} deadline (${status.gw1.deadlineUk} UK)`)
    lines.push("- Unlimited transfers: YES. The user can reshape their entire squad with zero point cost.")
    lines.push('- NEVER tell the user they only have "1 free transfer" while this status is active.')
    if (status.transferPlanningGameweek) {
      lines.push(
        `- Upcoming deadline: ${status.transferPlanningGameweek.name} on ${status.transferPlanningGameweek.deadlineUk} UK`,
      )
    }
  } else {
    lines.push(
      `- Status: STANDARD TRANSFER RULES APPLY${status.gw1 ? ` (${status.gw1.name} deadline passed on ${status.gw1.deadlineUk} UK)` : ""}`,
    )
    lines.push("- Unlimited transfers: NO. Pre-season unlimited transfers ended when the GW1 deadline passed.")
    lines.push(
      "- IMPORTANT: A scoring gameweek can still show Finished: No while fixtures are live. That does NOT bring back unlimited transfers.",
    )
    if (status.scoringGameweek) {
      lines.push(
        `- Scoring gameweek: ${status.scoringGameweek.name} (Finished: ${status.scoringGameweek.finished ? "Yes" : "No"})`,
      )
    }
    if (status.transferPlanningGameweek) {
      lines.push(
        `- Next transfer deadline: ${status.transferPlanningGameweek.name} on ${status.transferPlanningGameweek.deadlineUk} UK`,
      )
    }
    lines.push("- Standard rules: 1 free transfer per gameweek, banked up to a maximum of 5, then -4 points per extra transfer.")
    lines.push("- Wildcard and Free Hit are the only ways to make unlimited transfers after the GW1 deadline.")
  }

  return lines.join("\n")
}
