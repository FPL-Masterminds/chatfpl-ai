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

export function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function gwName(gw: number): string {
  return `Gameweek ${gw}`
}

export function gwsLeft(gw: number): string {
  const left = 38 - gw
  return left === 1 ? "one gameweek remains" : `${spellN(left)} gameweeks remain`
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

/** Ensure no sentence in a paragraph begins with a digit. */
export function sanitizeParagraph(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  return parts.map((sentence) => fixLeadingNumber(sentence.trim())).join(" ")
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
