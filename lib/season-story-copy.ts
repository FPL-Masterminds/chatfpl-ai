/** Copy helpers for Season Story prose. No sentence may start with a digit. */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
]

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

export function spellN(n: number): string {
  if (n < 0) return String(n)
  if (n < 20) return ONES[n] ?? String(n)
  if (n < 100) {
    const t = Math.floor(n / 10)
    const o = n % 10
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`
  }
  return String(n)
}

export function pluralN(n: number, singular: string, pluralForm?: string): string {
  const word = n === 1 ? singular : (pluralForm ?? `${singular}s`)
  return `${spellN(n)} ${word}`
}

export function pts(n: number): string {
  return `${n} point${n === 1 ? "" : "s"}`
}

/** How the user's score compares to the global FPL average (strict beat, not tie). */
export function fplAvgComparisonPhrase(userPts: number, fplAvg: number): string {
  if (userPts > fplAvg) return `That beat the FPL average of ${pts(fplAvg)}.`
  if (userPts === fplAvg) return `That was exactly the FPL average.`
  return `That fell short of the FPL average of ${pts(fplAvg)}.`
}

export function fplAvgComparisonShort(userPts: number, fplAvg: number): string {
  if (userPts > fplAvg) return `That beat the FPL average.`
  if (userPts === fplAvg) return `That was exactly the FPL average.`
  return `That fell short of the FPL average.`
}

export function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** FPL manager's real name (player_name), falling back to team name. */
export function mgr(row: { manager: string; team?: string }): string {
  const name = row.manager?.trim()
  if (name) return name
  return row.team?.trim() || "Unknown"
}

/** Manager name with FPL team in brackets when both exist. */
export function mgrTeam(row: { manager: string; team: string }): string {
  const name = mgr(row)
  const team = row.team?.trim()
  if (!team || team === name) return name
  return `${name} (${team})`
}

export function possessiveMgr(row: { manager: string; team?: string }): string {
  const name = mgr(row)
  return name.endsWith("s") ? `${name}'` : `${name}'s`
}

export function podiumManagers(rows: { manager: string; team: string }[]): string {
  return rows.map((p) => mgr(p)).join(", ")
}

export function podiumManagersRanked(rows: { manager: string; team: string }[]): string {
  return rows.map((p, i) => `${ord(i + 1)} ${mgr(p)}`).join(", ")
}

type SpoonRaceRow = { manager: string; team: string; totalPts: number }

/** Second sentence for basement copy. Skips nonsensical "0 points above last" when tied. */
export function spoonBasementFollowUp(f: {
  secondBottom: SpoonRaceRow | null
  woodenSpoon: SpoonRaceRow
  spoonRaceGap: number
}): string {
  const second = f.secondBottom
  if (!second) return "A long season remains to climb out."

  if (f.spoonRaceGap === 0) {
    return `${mgr(second)} and ${mgr(f.woodenSpoon)} are tied on ${f.woodenSpoon.totalPts} points at the foot of the table.`
  }
  if (f.spoonRaceGap > 0 && f.spoonRaceGap <= 8) {
    return `${mgr(second)} sits just ${pts(f.spoonRaceGap)} above last place.`
  }
  return "A long season remains to climb out."
}

/** Prefix for later-gameweek basement paragraphs. */
export function spoonRacePrefix(f: {
  secondBottom: SpoonRaceRow | null
  woodenSpoon: SpoonRaceRow
  spoonRaceGap: number
  gapFirstLast: number
}): string {
  const second = f.secondBottom
  if (second && f.spoonRaceGap === 0) {
    return `${mgr(second)} and ${mgr(f.woodenSpoon)} are level on points at the bottom. `
  }
  if (second && f.spoonRaceGap > 0 && f.spoonRaceGap <= 8) {
    return `The wooden spoon race is tight: ${mgr(second)} is only ${pts(f.spoonRaceGap)} ahead of last place. `
  }
  return `At the bottom, ${mgr(f.woodenSpoon)} is ${pts(f.gapFirstLast)} off the leader. `
}

export function gwName(gw: number): string {
  return `Gameweek ${gw}`
}

export function gwsLeft(gw: number): string {
  const left = 38 - gw
  return left === 1 ? "one gameweek remains" : `${spellN(left)} gameweeks remain`
}

/** Phrase for "with X gameweeks remaining" (avoids "has X gameweeks remain"). */
export function gwsRemaining(gw: number): string {
  const left = 38 - gw
  return left === 1 ? "one gameweek remaining" : `${spellN(left)} gameweeks remaining`
}

export function isFirstGameweek(gw: number): boolean {
  return gw === 1
}

/** Rank movement narratives need a prior week to compare against. */
export function canDiscussRankMovement(gw: number): boolean {
  return gw >= 4
}

/** Head-to-head and streak copy needs several weeks of history. */
export function canDiscussRivalryArc(gw: number): boolean {
  return gw >= 5
}

/** Week-on-week gap change needs a prior gameweek. */
export function canDiscussGapChange(gw: number): boolean {
  return gw >= 2
}

function capitalizeSentence(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function phaseNote(gw: number, phase: string, leagueName: string): string {
  if (phase === "opening") {
    return gw === 1
      ? "The season has only just begun, but first impressions already matter."
      : `After ${pluralN(gw, "gameweek")}, the picture is still forming, though habits are already emerging.`
  }
  if (phase === "second_half") return "The second half of the season brings fresh chips and renewed urgency."
  if (phase === "run_in") return "The run-in has arrived, and every gameweek now carries the weight of the full season behind it."
  if (phase === "final") return "This was the final gameweek. There are no more chances after this."
  return "We are deep enough into the campaign for patterns to matter more than luck."
}

/** Minimum bench points worth calling out in copy (lower bar on opening GW). */
export function benchMentionMinPts(gw: number): number {
  return gw === 1 ? 8 : 12
}

/** Ensure no sentence in a paragraph begins with a digit. */
export function sanitizeParagraph(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  return parts
    .map((sentence) => fixLeadingNumber(sentence.trim()))
    .map(capitalizeSentence)
    .join(" ")
}

function fixLeadingNumber(sentence: string): string {
  if (!sentence || !/^\d/.test(sentence)) return sentence

  if (/^\d+ points?/.test(sentence)) {
    return `The weekly return was ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`
  }
  if (/^\d+ of /.test(sentence)) {
    return `Across the league, ${sentence}`
  }
  if (/^\d+ managers/.test(sentence)) {
    return `In total, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`
  }
  if (/^\d+[-–]point/.test(sentence)) {
    return `The margin stood at ${sentence}`
  }
  if (/^\d+ places/.test(sentence)) {
    return `That shift covered ${sentence}`
  }
  if (/^\d+%/.test(sentence)) {
    return `The figure came in at ${sentence}`
  }

  return `The count was ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`
}
