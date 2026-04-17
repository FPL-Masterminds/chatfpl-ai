import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getComparisonHub, type ComparisonHubPair } from "@/lib/fpl-comparison"
import { DevHeader } from "@/components/dev-header"
import { Reveal } from "@/components/scroll-reveal"
import { HubCardExpand } from "@/components/hub-card-expand"

export const dynamic = "force-dynamic"

const ALLOWED_EMAIL = "johnmcdermott1979@gmail.com"
const GREEN = "#00FF87"

// ─── Text generation — 3 rotating templates ───────────────────────────────────

function buildCompareText(pair: ComparisonHubPair, gw: number | string, rank: number, randomBase: number): string {
  const { nameA, nameB, epA, epB, formA, formB, totalPtsA, totalPtsB,
          goalsA, goalsB, assistsA, assistsB, priceA, priceB,
          ptsPerMillionA, ptsPerMillionB, ownershipA, ownershipB, position } = pair

  const epWinner    = epA >= epB ? nameA : nameB
  const epLeader    = Math.max(epA, epB).toFixed(1)
  const epTrailer   = Math.min(epA, epB).toFixed(1)
  const gap         = Math.abs(epA - epB).toFixed(1)
  const formWinner  = formA >= formB ? nameA : nameB
  const formLeader  = Math.max(formA, formB).toFixed(1)
  const formTrailer = Math.min(formA, formB).toFixed(1)
  const ptsWinner   = totalPtsA >= totalPtsB ? nameA : nameB
  const valueWinner = ptsPerMillionA >= ptsPerMillionB ? nameA : nameB

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `The expected points model has ${epWinner} at ${epLeader} for Gameweek ${gw}, against ${epTrailer} for their counterpart — a gap of ${gap} points heading into this gameweek. ` +
      `Form supports that picture: ${formWinner} has averaged ${formLeader} points per game over the last six gameweeks, while the other ${position} is averaging ${formTrailer}. ` +
      `Both players are competing for budget space in millions of squads, and the decision often comes down to who carries better short-term momentum. ` +
      `The full fixture run and detailed head-to-head breakdown are available on the comparison page.`
  }

  if (variant === 1) {
    const totalGA_A = goalsA + assistsA
    const totalGA_B = goalsB + assistsB
    const gaWinner  = totalGA_A >= totalGA_B ? nameA : nameB
    const gaLeader  = Math.max(totalGA_A, totalGA_B)
    const ptsDiff   = Math.abs(totalPtsA - totalPtsB)
    return `Across the season, ${ptsWinner} leads on total points and the gap stands at ${ptsDiff}. ` +
      `On attacking output, ${gaWinner} edges the combined goals and assists count with ${gaLeader} direct contributions. ` +
      `${nameA} has ${goalsA} goals and ${assistsA} assists this season; ${nameB} has ${goalsB} goals and ${assistsB} assists. ` +
      `Ownership sits at ${ownershipA}% for ${nameA} and ${ownershipB}% for ${nameB}, meaning this is a decision with real rank implications across a significant slice of the field. ` +
      `For Gameweek ${gw}, the model projects ${epLeader} expected points for ${epWinner}.`
  }

  const priceDiff = Math.abs(
    parseFloat(priceA.replace(/[£m]/g, "")) - parseFloat(priceB.replace(/[£m]/g, ""))
  ).toFixed(1)
  return `Priced at ${priceA} and ${priceB}, there is a £${priceDiff}m differential between these two ${position}s. ` +
    `On a pure value basis, ${valueWinner} generates more points per million this season — ` +
    `${nameA} at ${ptsPerMillionA} against ${nameB} at ${ptsPerMillionB}. ` +
    `The Gameweek ${gw} expected points model gives ${epWinner} the edge at ${epLeader} projected points. ` +
    `With ownership at ${ownershipA}% and ${ownershipB}% respectively, picking the right one has meaningful rank consequences. ` +
    `The full fixture-by-fixture comparison is on the dedicated head-to-head page.`
}

// ─── Photo strip ──────────────────────────────────────────────────────────────

function PhotoStrip({ code, name, teamCode, club, side }: {
  code: number; name: string; teamCode: number; club: string; side: "left" | "right"
}) {
  const radius = side === "left" ? "11px 0 0 11px" : "0 11px 11px 0"
  return (
    <div
      className="relative shrink-0 flex flex-col items-center justify-center w-16 sm:w-24"
      style={{ background: "rgba(0,0,0,0.4)", borderRadius: radius, padding: "12px 6px 10px" }}
    >
      <div className="flex flex-col items-center">
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`}
          alt={name}
          width={52} height={66}
          className="sm:hidden"
          style={{ objectFit: "contain" }}
          unoptimized
        />
        <Image
          src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`}
          alt={name}
          width={72} height={90}
          className="hidden sm:block"
          style={{ objectFit: "contain" }}
          unoptimized
        />
        <div style={{
          height: 1,
          width: "100%",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 70%, transparent)",
          boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
        }} />
      </div>
      <p className="text-[8px] sm:text-[10px] font-semibold text-white text-center leading-tight mt-1.5 px-0.5 line-clamp-2">
        {name}
      </p>
      <div className="flex items-center justify-center mt-1">
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`}
          alt={club}
          width={14} height={14}
          style={{ objectFit: "contain" }}
          unoptimized
        />
      </div>
    </div>
  )
}

// ─── Stat comparison row ──────────────────────────────────────────────────────

function StatRow({ label, valA, valB, numA, numB, higherWins = true }: {
  label: string
  valA: string
  valB: string
  numA: number
  numB: number
  higherWins?: boolean
}) {
  const aWins = higherWins ? numA > numB : numA < numB
  const bWins = higherWins ? numB > numA : numB < numA
  return (
    <div style={{ background: "#1A1A1A", borderRadius: 4, padding: "6px 8px" }}>
      <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <span className="text-right text-xs sm:text-sm font-bold tabular-nums"
          style={{ color: aWins ? GREEN : "white" }}>
          {valA}
        </span>
        <span className="text-center text-[9px] sm:text-[10px] uppercase tracking-wide text-white px-1.5"
          style={{ minWidth: 64 }}>
          {label}
        </span>
        <span className="text-left text-xs sm:text-sm font-bold tabular-nums"
          style={{ color: bWins ? GREEN : "white" }}>
          {valB}
        </span>
      </div>
    </div>
  )
}

// ─── Comparison card ──────────────────────────────────────────────────────────

function CompareCard({ pair, rank, even, gw, text }: {
  pair: ComparisonHubPair
  rank: number
  even: boolean
  gw: number | string
  text: string
}) {
  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 50% 50%, rgba(0,255,135,0.15) 0%, rgba(0,255,135,0.06) 50%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
    }}>
      <div className="flex flex-row">

        {/* Left — Player A photo strip */}
        <PhotoStrip
          code={pair.codeA}
          name={pair.nameA}
          teamCode={pair.teamCodeA}
          club={pair.clubA}
          side="left"
        />

        {/* Centre — stats + CTA + expand */}
        <div className="flex-1 min-w-0 flex flex-col p-2 sm:p-3 gap-1.5">

          {/* Rank + position header */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center justify-center rounded"
              style={{ width: 20, height: 20, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,255,135,0.25)" }}
            >
              <span className="text-[9px] font-bold tabular-nums text-white">{rank}</span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              VS
            </span>
            <span className="rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase"
              style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
            >
              {pair.position}
            </span>
          </div>

          {/* Stat rows */}
          <StatRow
            label={`xPts GW${gw}`}
            valA={pair.epA.toFixed(1)} valB={pair.epB.toFixed(1)}
            numA={pair.epA} numB={pair.epB}
          />
          <StatRow
            label="Form"
            valA={pair.formA.toFixed(1)} valB={pair.formB.toFixed(1)}
            numA={pair.formA} numB={pair.formB}
          />
          <StatRow
            label="Season Pts"
            valA={String(pair.totalPtsA)} valB={String(pair.totalPtsB)}
            numA={pair.totalPtsA} numB={pair.totalPtsB}
          />
          <StatRow
            label="Goals + Ast"
            valA={`${pair.goalsA}G ${pair.assistsA}A`}
            valB={`${pair.goalsB}G ${pair.assistsB}A`}
            numA={pair.goalsA + pair.assistsA}
            numB={pair.goalsB + pair.assistsB}
          />
          <StatRow
            label="Owned"
            valA={`${pair.ownershipA}%`} valB={`${pair.ownershipB}%`}
            numA={pair.ownershipA} numB={pair.ownershipB}
          />
          <StatRow
            label="Price"
            valA={pair.priceA} valB={pair.priceB}
            numA={parseFloat(pair.priceA.replace(/[£m]/g, ""))}
            numB={parseFloat(pair.priceB.replace(/[£m]/g, ""))}
            higherWins={false}
          />

          {/* Full comparison CTA */}
          <div className="flex items-center justify-between gap-2 mt-0.5"
            style={{ background: "#1A1A1A", borderRadius: 4, padding: "6px 8px" }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeA}.png`}
                alt={pair.clubA} width={12} height={12}
                style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
              <span className="text-[9px] text-white truncate">{pair.clubA}</span>
              <span className="text-white/20 text-[9px]">vs</span>
              <span className="text-[9px] text-white truncate">{pair.clubB}</span>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeB}.png`}
                alt={pair.clubB} width={12} height={12}
                style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
            </div>
            <Link
              href={`/fpl/compare/${pair.slugA}/${pair.slugB}`}
              className="shrink-0 whitespace-nowrap text-[10px] font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_16px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "5px 10px" }}
            >
              Full comparison →
            </Link>
          </div>

          {/* Expandable analysis */}
          <HubCardExpand
            slug={`${pair.slugA}-vs-${pair.slugB}`}
            gw={gw}
            text={text}
            promptLabel={`Who should I pick: ${pair.nameA} or ${pair.nameB} in GW${gw}?`}
          />

        </div>

        {/* Right — Player B photo strip */}
        <PhotoStrip
          code={pair.codeB}
          name={pair.nameB}
          teamCode={pair.teamCodeB}
          club={pair.clubB}
          side="right"
        />

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DevComparisonsPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.email !== ALLOWED_EMAIL) redirect("/login")

  const randomBase = Math.floor(Math.random() * 3)
  const data  = await getComparisonHub()
  const gw    = data?.gw ?? "?"
  const pairs = data?.pairs ?? []

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <DevHeader />

      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,255,135,0.06) 0%, transparent 70%)",
      }} />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">
        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(26px, 5vw, 52px)", maxWidth: 820 }}
        >
          <span className="text-white">FPL Head-to-Head Picks for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
          >
            Gameweek {gw}
          </span>
        </h1>
        <p className="text-white/60 text-base max-w-xl">
          Same-position matchups ranked by combined ownership. The stronger stat on each row highlights green. Click any pair for the full head-to-head breakdown.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
          >
            Dev preview
          </span>
          <Link href="/fpl/comparisons" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            View live page →
          </Link>
        </div>
      </section>

      {/* Cards */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {pairs.map((pair, i) => (
            <Reveal key={`${pair.slugA}-${pair.slugB}`} delay={i * 0.05}>
              <CompareCard
                pair={pair}
                rank={i + 1}
                even={(i + 1) % 2 === 0}
                gw={gw}
                text={buildCompareText(pair, gw, i + 1, randomBase)}
              />
            </Reveal>
          ))}
        </div>
      </main>
    </div>
  )
}
