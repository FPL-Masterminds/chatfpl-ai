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
const GREEN  = "#00FF87"
const CYAN   = "#00FFFF"
const MUTED  = "#8b949e"
const SURFACE = "rgba(13,17,23,0.82)"
const BORDER  = "rgba(255,255,255,0.07)"

// ─── Text generation ──────────────────────────────────────────────────────────

function buildCompareText(pair: ComparisonHubPair, gw: number | string, rank: number, randomBase: number): string {
  const { nameA, nameB, epA, epB, formA, formB, totalPtsA, totalPtsB,
          goalsA, goalsB, assistsA, assistsB, priceA, priceB,
          ptsPerMillionA, ptsPerMillionB, ownershipA, ownershipB, position } = pair

  const epWinner    = epA >= epB ? nameA : nameB
  const epLoser     = epA >= epB ? nameB : nameA
  const epLeader    = Math.max(epA, epB).toFixed(1)
  const epTrailer   = Math.min(epA, epB).toFixed(1)
  const gap         = Math.abs(epA - epB).toFixed(1)
  const formWinner  = formA >= formB ? nameA : nameB
  const formLoser   = formA >= formB ? nameB : nameA
  const formLeader  = Math.max(formA, formB).toFixed(1)
  const formTrailer = Math.min(formA, formB).toFixed(1)
  const ptsWinner   = totalPtsA >= totalPtsB ? nameA : nameB
  const valueWinner = ptsPerMillionA >= ptsPerMillionB ? nameA : nameB

  const variant = (randomBase + rank) % 3

  if (variant === 0) {
    return `The expected points model has ${epWinner} at ${epLeader} for Gameweek ${gw}, against ${epTrailer} for ${epLoser}, a gap of ${gap} points heading into this gameweek. ` +
      `Form supports that picture: ${formWinner} has averaged ${formLeader} points per game over the last six gameweeks, while ${formLoser} is averaging ${formTrailer}. ` +
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
    `On a pure value basis, ${valueWinner} generates more points per million this season. ` +
    `${nameA} at ${ptsPerMillionA} against ${nameB} at ${ptsPerMillionB}. ` +
    `The Gameweek ${gw} expected points model gives ${epWinner} the edge at ${epLeader} projected points. ` +
    `With ownership at ${ownershipA}% and ${ownershipB}% respectively, picking the right one has meaningful rank consequences. ` +
    `The full fixture-by-fixture comparison is on the dedicated head-to-head page.`
}

// ─── Stat row — horizontal label | value for each player ──────────────────────

function StatRow({ label, valA, valB, winsA, winsB }: {
  label: string; valA: string; valB: string; winsA: boolean; winsB: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
      {/* Player A value */}
      <div
        className="flex items-center justify-start pl-3 py-2"
        style={{
          fontSize: 13, fontWeight: 700,
          color: winsA ? GREEN : "white",
          textShadow: winsA ? `0 0 12px ${GREEN}80` : "none",
          background: winsA ? "rgba(0,255,135,0.05)" : "transparent",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {valA}
      </div>
      {/* Label */}
      <div
        className="flex items-center justify-center px-3 py-2"
        style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, whiteSpace: "nowrap" }}
      >
        {label}
      </div>
      {/* Player B value */}
      <div
        className="flex items-center justify-end pr-3 py-2"
        style={{
          fontSize: 13, fontWeight: 700,
          color: winsB ? GREEN : "white",
          textShadow: winsB ? `0 0 12px ${GREEN}80` : "none",
          background: winsB ? "rgba(0,255,135,0.05)" : "transparent",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {valB}
      </div>
    </div>
  )
}

// ─── Comparison card ──────────────────────────────────────────────────────────

function CompareCard({ pair, rank, gw, text }: {
  pair: ComparisonHubPair
  rank: number
  gw: number | string
  text: string
}) {
  const priceNumA = parseFloat(pair.priceA.replace(/[£m]/g, ""))
  const priceNumB = parseFloat(pair.priceB.replace(/[£m]/g, ""))

  return (
    <div
      className="compare-card group"
      style={{
        background: SURFACE,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${BORDER}`,
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.8)",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: 2, background: `linear-gradient(to right,${GREEN},${CYAN})`, opacity: 0.6 }} />

      <div className="flex flex-row">

        {/* Left photo strip */}
        <div
          className="relative shrink-0 flex flex-col items-center justify-center w-28 sm:w-44"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          {/* Rank badge */}
          <div className="absolute top-2 left-2 z-10 flex items-center justify-center rounded"
            style={{ width: 20, height: 20, background: "rgba(0,0,0,0.8)", border: `1px solid rgba(0,255,135,0.2)` }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{rank}</span>
          </div>
          {/* Position badge */}
          <div className="absolute top-2 right-2 z-10 rounded px-1 py-0.5"
            style={{ background: "rgba(0,255,135,0.1)", color: GREEN, border: "1px solid rgba(0,255,135,0.2)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {pair.position}
          </div>
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeA}.png`}
              alt={pair.nameA} width={120} height={153}
              style={{ objectFit: "contain" }} unoptimized
            />
            <div style={{
              height: 1, width: 120,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

        {/* Centre */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Player name headers */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-r" style={{ borderColor: BORDER }}>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeA}.png`}
                alt={pair.clubA} width={16} height={16}
                style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pair.nameA}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 px-3 py-2.5">
              <span className="text-white font-bold truncate text-xs sm:text-sm">{pair.nameB}</span>
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/70/t${pair.teamCodeB}.png`}
                alt={pair.clubB} width={16} height={16}
                style={{ objectFit: "contain", flexShrink: 0 }} unoptimized
              />
            </div>
          </div>

          {/* Stat rows */}
          <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
            <div style={{ borderColor: BORDER, borderBottomWidth: 1, borderBottomStyle: "solid" }}>
              <StatRow
                label="xPTS"
                valA={pair.epA.toFixed(1)} valB={pair.epB.toFixed(1)}
                winsA={pair.epA > pair.epB} winsB={pair.epB > pair.epA}
              />
            </div>
            <div style={{ borderColor: BORDER, borderBottomWidth: 1, borderBottomStyle: "solid" }}>
              <StatRow
                label="FORM"
                valA={pair.formA.toFixed(1)} valB={pair.formB.toFixed(1)}
                winsA={pair.formA > pair.formB} winsB={pair.formB > pair.formA}
              />
            </div>
            <div>
              <StatRow
                label="PRICE"
                valA={pair.priceA} valB={pair.priceB}
                winsA={priceNumA < priceNumB} winsB={priceNumB < priceNumA}
              />
            </div>
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-center px-3 py-3 border-t" style={{ borderColor: BORDER }}>
            <div
              className="rounded-full p-px transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)]"
              style={{ background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }}
            >
              <Link
                href={`/fpl/compare/${pair.slugA}/${pair.slugB}`}
                className="block whitespace-nowrap font-bold rounded-full"
                style={{ background: "#0d1117", padding: "5px 20px", fontSize: 12 }}
              >
                <span style={{
                  backgroundImage: `linear-gradient(to right, ${GREEN}, ${CYAN})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Full comparison
                </span>
              </Link>
            </div>
          </div>

          {/* Expand */}
          <div className="border-t" style={{ borderColor: BORDER }}>
            <HubCardExpand
              slug={`${pair.slugA}-vs-${pair.slugB}`}
              gw={gw}
              text={text}
              promptLabel={`Who should I pick: ${pair.nameA} or ${pair.nameB} in GW${gw}?`}
            />
          </div>

        </div>

        {/* Right photo strip */}
        <div
          className="relative shrink-0 flex flex-col items-center justify-center w-28 sm:w-44"
          style={{ background: "rgba(0,0,0,0.5)", padding: "14px 8px" }}
        >
          <div className="flex flex-col items-center">
            <Image
              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${pair.codeB}.png`}
              alt={pair.nameB} width={120} height={153}
              style={{ objectFit: "contain" }} unoptimized
            />
            <div style={{
              height: 1, width: 120,
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
            }} />
          </div>
        </div>

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
    <div className="flex min-h-screen flex-col overflow-x-hidden" style={{ background: "#05070a" }}>
      <style>{`
        .compare-card:hover {
          transform: scale(1.005);
          border-color: rgba(0,255,135,0.25) !important;
          box-shadow: 0 12px 40px 0 rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,135,0.1) !important;
        }
      `}</style>

      <DevHeader />

      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(0,255,135,0.04) 0%, transparent 70%)",
      }} />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-28 pb-14">

        {/* System status badge */}
        <div className="flex items-center gap-2 mb-6 rounded-full px-4 py-1.5"
          style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}
        >
          <span
            className="rounded-full animate-pulse"
            style={{ width: 7, height: 7, display: "inline-block", background: GREEN, boxShadow: `0 0 6px 2px ${GREEN}80` }}
          />
          <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GREEN, fontFamily: "ui-monospace, monospace" }}>
            Live Data Stream
          </span>
        </div>

        <h1
          className="font-bold leading-[1.1] tracking-tighter mb-4"
          style={{ fontSize: "clamp(26px, 5vw, 52px)", maxWidth: 820 }}
        >
          <span className="text-white">FPL Head-to-Head Picks for </span>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: `linear-gradient(to right,${GREEN},${CYAN})`, WebkitBackgroundClip: "text" }}
          >
            Gameweek {gw}
          </span>
        </h1>

        <p className="text-white/60 text-base max-w-xl mb-4">
          Same-position matchups ranked by combined ownership. Monospace values highlight the stronger stat. Click any pair for the full breakdown.
        </p>

        <div className="flex items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(0,255,135,0.08)", color: GREEN, border: "1px solid rgba(0,255,135,0.2)", fontFamily: "ui-monospace, monospace" }}
          >
            Dev preview
          </span>
          <Link href="/fpl/comparisons" className="text-xs transition-colors" style={{ color: MUTED }}>
            View live page
          </Link>
        </div>
      </section>

      {/* Cards */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {pairs.map((pair, i) => (
            <Reveal key={`${pair.slugA}-${pair.slugB}`} delay={i * 0.04}>
              <CompareCard
                pair={pair}
                rank={i + 1}
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
