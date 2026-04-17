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
    // xPts + form narrative
    return `The expected points model has ${epWinner} at ${epLeader} for Gameweek ${gw}, against ${epTrailer} for their counterpart — a gap of ${gap} points heading into this gameweek. ` +
      `Form supports that picture: ${formWinner} has averaged ${formLeader} points per game over the last six gameweeks, while the other ${position} is averaging ${formTrailer}. ` +
      `Both players are competing for budget space in millions of squads, and the decision often comes down to who carries better short-term momentum. ` +
      `The full fixture run and detailed head-to-head breakdown are available on the comparison page.`
  }

  if (variant === 1) {
    // Season output + ownership narrative
    const totalGA_A = goalsA + assistsA
    const totalGA_B = goalsB + assistsB
    const gaWinner  = totalGA_A >= totalGA_B ? nameA : nameB
    const gaLeader  = Math.max(totalGA_A, totalGA_B)
    const ptsDiff   = Math.abs(totalPtsA - totalPtsB)
    return `Across the season, ${ptsWinner} leads on total points and the gap stands at ${ptsDiff}. ` +
      `On attacking output, ${gaWinner} edges the combined goals and assists count with ${gaLeader} direct contributions. ` +
      `${nameA} carries ${goalsA} goals and ${assistsA} assists this season; ${nameB} has ${goalsB} goals and ${assistsB} assists. ` +
      `Ownership sits at ${ownershipA}% for ${nameA} and ${ownershipB}% for ${nameB}, meaning this is a decision with real rank implications across a significant slice of the field. ` +
      `For Gameweek ${gw}, the model projects ${epLeader} expected points for ${epWinner}.`
  }

  // Value + price narrative
  const priceDiff = Math.abs(parseFloat(priceA.replace(/[£m]/g, "")) - parseFloat(priceB.replace(/[£m]/g, ""))).toFixed(1)
  return `Priced at ${priceA} and ${priceB}, there is a £${priceDiff}m differential between these two ${position}s. ` +
    `On a pure value basis, ${valueWinner} generates more points per million this season. ` +
    `${nameA} has returned ${ptsPerMillionA} points per million; ${nameB} has returned ${ptsPerMillionB}. ` +
    `The Gameweek ${gw} expected points model gives ${epWinner} the edge at ${epLeader} projected points against ${epTrailer} for their rival. ` +
    `With ownership at ${ownershipA}% and ${ownershipB}% respectively, picking the right one has meaningful rank consequences. ` +
    `The full fixture-by-fixture comparison is on the dedicated head-to-head page.`
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, valA, valB, higherWins = true }: {
  label: string
  valA: number | string
  valB: number | string
  higherWins?: boolean
}) {
  const numA = typeof valA === "number" ? valA : parseFloat(String(valA).replace(/[^0-9.-]/g, ""))
  const numB = typeof valB === "number" ? valB : parseFloat(String(valB).replace(/[^0-9.-]/g, ""))
  const aWins = higherWins ? numA > numB : numA < numB
  const bWins = higherWins ? numB > numA : numB < numA

  return (
    <div className="grid items-center gap-1" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
      <span
        className="text-right text-sm sm:text-base font-bold tabular-nums"
        style={{ color: aWins ? GREEN : "white" }}
      >
        {valA}
      </span>
      <span
        className="text-center text-[10px] uppercase tracking-wider px-2 whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.5)", minWidth: 80 }}
      >
        {label}
      </span>
      <span
        className="text-left text-sm sm:text-base font-bold tabular-nums"
        style={{ color: bWins ? GREEN : "white" }}
      >
        {valB}
      </span>
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
  const gaNumA = pair.goalsA + pair.assistsA
  const gaNumB = pair.goalsB + pair.assistsB

  return (
    <div style={{
      background: even
        ? "radial-gradient(ellipse 90% 100% at 50% 50%, rgba(0,255,135,0.12) 0%, rgba(0,255,135,0.05) 50%, transparent 100%)"
        : "rgba(0,255,135,0.03)",
      border: "1px solid rgba(0,255,135,0.18)",
      borderRadius: 12,
      overflow: "hidden",
    }}>

      {/* ── Header: rank + position badge ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
        <div className="flex items-center justify-center rounded"
          style={{ width: 22, height: 22, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,135,0.25)" }}
        >
          <span className="text-[10px] font-bold tabular-nums text-white">{rank}</span>
        </div>
        <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background: "rgba(0,255,135,0.15)", color: GREEN, border: "1px solid rgba(0,255,135,0.3)" }}
        >
          {pair.position}
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* ── Player photos + names ── */}
      <div className="grid items-end px-3 pt-2 pb-3 gap-2"
        style={{ gridTemplateColumns: "1fr 40px 1fr" }}
      >
        {/* Player A */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col items-center"
            style={{ background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "10px 6px 0" }}
          >
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeA}.png`}
              alt={pair.nameA}
              width={72} height={90}
              className="sm:hidden"
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeA}.png`}
              alt={pair.nameA}
              width={88} height={110}
              className="hidden sm:block"
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <div style={{
              height: 1, width: "100%",
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
            }} />
          </div>
          <p className="text-white font-semibold text-xs sm:text-sm text-center leading-tight mt-1">{pair.nameA}</p>
          <div className="flex items-center gap-1">
            <Image
              src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeA}.png`}
              alt={pair.clubA}
              width={14} height={14}
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <span className="text-[10px] text-white">{pair.clubA}</span>
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center self-center mb-6">
          <span
            className="text-[11px] font-black tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            VS
          </span>
        </div>

        {/* Player B */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col items-center"
            style={{ background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "10px 6px 0" }}
          >
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeB}.png`}
              alt={pair.nameB}
              width={72} height={90}
              className="sm:hidden"
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeB}.png`}
              alt={pair.nameB}
              width={88} height={110}
              className="hidden sm:block"
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <div style={{
              height: 1, width: "100%",
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
            }} />
          </div>
          <p className="text-white font-semibold text-xs sm:text-sm text-center leading-tight mt-1">{pair.nameB}</p>
          <div className="flex items-center gap-1">
            <Image
              src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeB}.png`}
              alt={pair.clubB}
              width={14} height={14}
              style={{ objectFit: "contain" }}
              unoptimized
            />
            <span className="text-[10px] text-white">{pair.clubB}</span>
          </div>
        </div>
      </div>

      {/* ── Stat comparison rows ── */}
      <div className="flex flex-col gap-0.5 px-3 pb-3"
        style={{ background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}
      >
        <StatRow label={`xPts GW${gw}`} valA={pair.epA.toFixed(1)} valB={pair.epB.toFixed(1)} />
        <StatRow label="Form" valA={pair.formA.toFixed(1)} valB={pair.formB.toFixed(1)} />
        <StatRow label="Season Pts" valA={pair.totalPtsA} valB={pair.totalPtsB} />
        <StatRow label="Goals + Assists" valA={`${pair.goalsA}G ${pair.assistsA}A`} valB={`${pair.goalsB}G ${pair.assistsB}A`} higherWins={true} />
        <StatRow label="Ownership" valA={`${pair.ownershipA}%`} valB={`${pair.ownershipB}%`} />
        <StatRow label="Price" valA={pair.priceA} valB={pair.priceB} higherWins={false} />
      </div>

      {/* ── CTA row ── */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <Link
          href={`/fpl/compare/${pair.slugA}/${pair.slugB}`}
          className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
          style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)", color: "#1A0E24", padding: "6px 14px" }}
        >
          Full comparison →
        </Link>
      </div>

      {/* ── Expandable analysis ── */}
      <div className="px-3 pb-3">
        <HubCardExpand
          slug={`${pair.slugA}-vs-${pair.slugB}`}
          gw={gw}
          text={text}
          promptLabel={`Who should I pick: ${pair.nameA} or ${pair.nameB} in GW${gw}?`}
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
  const data = await getComparisonHub()
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
          Same-position matchups ranked by combined ownership. Green highlights the stronger stat. Click any matchup for the full analysis.
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
        <div className="w-full max-w-3xl flex flex-col gap-4">
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
