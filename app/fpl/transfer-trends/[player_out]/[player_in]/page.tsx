import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { DevHeader } from "@/components/dev-header"
import { isSeasonOver } from "@/lib/fpl-player-page"
import { SeasonEnded } from "@/components/season-ended"
import { ConversationalPlayer } from "@/components/conversational-player"
import { TransferHero } from "@/components/transfer-hero"
import {
  getTransferTrendPageData,
  getTransferTrendSlugs,
  buildTransferPageText,
  fmtTransfers,
} from "@/lib/fpl-transfer-trends"

export const revalidate = 3600
export const dynamic = "force-dynamic"
export const dynamicParams = true

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getTransferTrendSlugs(400)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ player_out: string; player_in: string }>
}): Promise<Metadata> {
  if (await isSeasonOver()) return { title: "FPL Transfer Analysis | ChatFPL AI" }
  const { player_out, player_in } = await params
  const data = await getTransferTrendPageData(player_out, player_in)
  if (!data) return { title: "FPL Transfer Analysis | ChatFPL AI" }
  const { gw, playerOut: pOut, playerIn: pIn } = data
  const title = `Should I sell ${pOut.displayName} for ${pIn.displayName}? FPL Transfer Analysis Gameweek ${gw} | ChatFPL AI`
  const description = `Transfer analysis for Gameweek ${gw}: ${fmtTransfers(pOut.transfersOut)} managers have sold ${pOut.webName} while ${fmtTransfers(pIn.transfersIn)} have bought ${pIn.webName}. Ownership impact, budget and fixture breakdown inside.`
  return {
    title,
    description,
    openGraph: { title, description, url: `https://www.chatfpl.ai/fpl/transfer-trends/${player_out}/${player_in}` },
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN = "#00FF87"
const CYAN  = "#00FFFF"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TransferTrendPage({
  params,
}: {
  params: Promise<{ player_out: string; player_in: string }>
}) {
  if (await isSeasonOver()) return <SeasonEnded />

  const { player_out, player_in } = await params
  const data = await getTransferTrendPageData(player_out, player_in)
  if (!data) notFound()

  const { gw, playerOut: pOut, playerIn: pIn } = data
  const text = buildTransferPageText(data)

  const VERDICT_COLOR =
    text.verdictLabel === "BACK THE MARKET"    ? GREEN
    : text.verdictLabel === "STAY PUT"         ? "#FFBE0B"
    : "white"

  const verdictBg =
    text.verdictLabel === "BACK THE MARKET"    ? "rgba(0,255,135,0.08)"
    : text.verdictLabel === "STAY PUT"         ? "rgba(255,180,0,0.06)"
    : "rgba(255,255,255,0.04)"

  const verdictBorder =
    text.verdictLabel === "BACK THE MARKET"    ? `rgba(0,255,135,0.35)`
    : text.verdictLabel === "STAY PUT"         ? `rgba(255,180,0,0.3)`
    : "rgba(255,255,255,0.12)"

  const welcome = `Here is the Gameweek ${gw} transfer breakdown for selling ${pOut.displayName} and buying ${pIn.displayName}. Click any question below for the full analysis.`

  const qaForChat = text.qaItems

  return (
    <div className="fpl-player-root flex min-h-screen flex-col bg-black overflow-x-hidden">
      <style>{`
        .fpl-player-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .fpl-player-root ::-webkit-scrollbar-track { background: transparent; }
        .fpl-player-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .fpl-player-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
        @media (max-width: 480px) {
          .comp-hero-cards { transform: scale(0.68); transform-origin: center top; margin-bottom: -99px; }
        }
        @media (min-width: 481px) and (max-width: 620px) {
          .comp-hero-cards { transform: scale(0.82); transform-origin: center top; margin-bottom: -56px; }
        }
      `}</style>

      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: text.qaItems.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer },
            })),
          }),
        }}
      />

      <DevHeader />

      {/* Hero with video background */}
      <TransferHero playerOut={pOut} playerIn={pIn} gw={gw} />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-10 pb-16 bg-black">

        <div className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.05) 0%, transparent 70%)" }}
        />

        {/* Subheading */}
        <div className="relative z-10 text-center mb-10 max-w-6xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">
            <span className="text-white">{pOut.displayName} vs {pIn.displayName}: </span>
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Gameweek {gw} Transfer Analysis
            </span>
          </h2>
        </div>

        {/* Verdict block */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-10">
          <div className="rounded-2xl px-6 py-6" style={{
            border: `1px solid ${verdictBorder}`,
            borderLeft: `4px solid ${VERDICT_COLOR}`,
            background: verdictBg,
          }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-black"
                style={{ background: VERDICT_COLOR }}
              >{text.verdictLabel}</span>
              <p className="text-white font-semibold text-base leading-snug">{text.verdict}</p>
            </div>
          </div>
        </div>

        {/* Chat section heading */}
        <div className="relative z-10 text-center mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
            <span className="text-white">{pOut.webName} vs {pIn.webName} </span>
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >Gameweek {gw}</span>
          </h2>
          <p className="text-white/70 text-sm">Click a question below to get the full transfer breakdown.</p>
        </div>

        {/* Chat window */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalPlayer welcome={welcome} qaItems={qaForChat} />
        </div>

        {/* CTA */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <div className="rounded-2xl px-8 py-10" style={{
            border: "1px solid rgba(0,255,135,0.18)",
            borderLeft: "4px solid #00FF87",
            background: "rgba(0,255,135,0.04)",
          }}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">
              Still not sure whether to sell {pOut.webName} for {pIn.webName}?
            </h3>
            <p className="text-sm text-white/70 mb-7">
              ChatFPL AI analyses your actual squad and available budget to recommend the best transfer for your specific team.
            </p>
            <Link
              href={`/chat?q=${encodeURIComponent(text.ctaPrompt)}`}
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{
                background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.4s linear infinite",
              }} />
              Should I sell {pOut.webName} for {pIn.webName} in GW{gw}?
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Back to hub */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-10 text-center">
          <div className="inline-block" style={{
            padding: "1.5px", borderRadius: "9999px",
            background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)",
            backgroundSize: "200% 200%",
            animation: "glow_scroll 3.5s linear infinite",
          }}>
            <Link href="/fpl/transfer-trends"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <span style={{ background: `linear-gradient(to right,${GREEN},${CYAN})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                All transfer market trends for Gameweek {gw}
              </span>
            </Link>
          </div>
        </div>

        {/* Also analyse */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-4 text-center">Also analyse</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: `/fpl/${player_out}`,               label: `Should I captain ${pOut.webName}?`       },
              { href: `/fpl/${player_out}/transfer`,       label: `Should I transfer in ${pOut.webName}?`   },
              { href: `/fpl/${player_in}`,                 label: `Should I captain ${pIn.webName}?`        },
              { href: `/fpl/${player_in}/transfer`,        label: `Should I transfer in ${pIn.webName}?`    },
              { href: `/fpl/${player_out}/differential`,   label: `Is ${pOut.webName} a differential?`     },
              { href: `/fpl/${player_in}/differential`,    label: `Is ${pIn.webName} a differential?`      },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
              >{label}</Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
