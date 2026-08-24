// Honest form copy based on how many gameweeks of data FPL actually has.
// FPL's `form` field is a rolling average of up to six gameweeks, but early
// season it reflects fewer rounds. These helpers keep page copy aligned with
// the real sample size.

export type FplEventLike = {
  finished?: boolean
  is_current?: boolean
}

export function countFormSampleGameweeks(events: FplEventLike[]): number {
  const finished = events.filter((e) => e.finished).length
  if (finished > 0) return Math.min(finished, 6)
  if (events.some((e) => e.is_current)) return 1
  return 0
}

export function formPeriodPhrase(sampleGws: number): string {
  if (sampleGws <= 1) return "so far this season"
  if (sampleGws < 6) return `over the last ${sampleGws} gameweeks`
  return "over the last six gameweeks"
}

export function formPpgPhrase(form: string, sampleGws: number): string {
  return `${form} points per game ${formPeriodPhrase(sampleGws)}`
}

export function formPtsGamePhrase(form: string, sampleGws: number): string {
  return `${form} pts/game ${formPeriodPhrase(sampleGws)}`
}

export function formOfPhrase(form: string, sampleGws: number): string {
  return `Form of ${formPpgPhrase(form, sampleGws)}`
}

export function formBulletLine(form: string, sampleGws: number, suffix = ""): string {
  const base = `Form: ${formPtsGamePhrase(form, sampleGws)}`
  return suffix ? `${base} ${suffix}` : base
}

export function formAverageTierLine(
  webName: string,
  form: string,
  formVal: number,
  sampleGws: number,
): string {
  const avg = `averaging ${formPtsGamePhrase(form, sampleGws)}`
  if (formVal >= 8) return `${webName} is in exceptional form, ${avg}.`
  if (formVal >= 6) return `${webName} is in good form, ${avg}.`
  if (formVal >= 4) return `${webName}'s form is moderate at ${formPtsGamePhrase(form, sampleGws)}.`
  return `${webName} has been out of form recently, averaging just ${formPtsGamePhrase(form, sampleGws)}.`
}

export function formComparisonSharperLine(
  betterName: string,
  betterForm: string,
  sampleGws: number,
  betterPts?: number,
  worsePts?: number,
  worseName?: string,
): string {
  if (sampleGws < 3 && betterPts != null && worsePts != null && worseName) {
    return `${betterName} leads on returns so far this season (${betterPts} points vs ${worsePts} for ${worseName}).`
  }
  return `${betterName} is in sharper form with ${formPpgPhrase(betterForm, sampleGws)}.`
}

export function formComparisonPairLine(
  winnerName: string,
  winnerForm: string,
  loserName: string,
  loserForm: string,
  sampleGws: number,
): string {
  return `Form supports that picture: ${winnerName} has averaged ${formPpgPhrase(winnerForm, sampleGws)}, while ${loserName} is averaging ${formPpgPhrase(loserForm, sampleGws)}.`
}

export function formRecentLine(form: string, sampleGws: number): string {
  if (sampleGws <= 1) return `Recent returns of ${formPpgPhrase(form, sampleGws)}`
  return `Recent form of ${formPpgPhrase(form, sampleGws)}`
}

export function formStatLabel(sampleGws: number): string {
  if (sampleGws <= 1) return "Season PPG"
  if (sampleGws < 6) return `Form (${sampleGws} GWs)`
  return "Form"
}

export function shouldLeadWithForm(sampleGws: number): boolean {
  return sampleGws >= 3
}
