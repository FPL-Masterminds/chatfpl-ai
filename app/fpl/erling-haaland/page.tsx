import { DevHeader } from "@/components/dev-header"
import { Footer } from "@/components/footer"
import { FplPlayerHero } from "@/components/fpl-player-hero"
import { ConversationalPlayer, type PlayerQA } from "@/components/conversational-player"
import Link from "next/link"

// ─── Static player data (hardcoded for design; replaced by API in dynamic version) ───

const PLAYER = {
  // Identity
  code:        223094,
  name:        "Haaland",
  full_name:   "Erling Haaland",
  team:        "MCI",
  teamCode:    43,
  pos:         "FWD",
  price:       "14.0",
  // Performance
  form:        8.5,
  ep_next:     8.2,
  total_points: 178,
  goals:       22,
  assists:     4,
  ownership:   47.3,
  // Next fixture
  gw:          32,
  opponent:    "Aston Villa",
  home:        true,
  fdr:         2,
  // Availability
  news:        "",
  chance:      100,
}

// Flanking players for the hero showcase
const SHOWCASE_PLAYERS = [
  { code: 118748, name: "Salah",       team: "LIV", teamCode: 14,  pos: "MID", price: "13.2", form: "10.5", total_points: 210 },
  { code: 237670, name: "Palmer",      team: "CHE", teamCode: 8,   pos: "MID", price: "10.5", form: "7.2",  total_points: 162 },
  { code: PLAYER.code, name: PLAYER.name, team: PLAYER.team, teamCode: PLAYER.teamCode, pos: PLAYER.pos, price: PLAYER.price, form: String(PLAYER.form), total_points: PLAYER.total_points },
  { code: 557819, name: "Mbeumo",      team: "BRE", teamCode: 94,  pos: "FWD", price: "8.2",  form: "6.8",  total_points: 153 },
  { code: 182522, name: "B.Fernandes", team: "MUN", teamCode: 1,   pos: "MID", price: "9.5",  form: "5.5",  total_points: 148 },
]

// ─── Conditional text blocks ──────────────────────────────────────────────────

const p = PLAYER
const fixture = `${p.opponent} (${p.home ? "H" : "A"})`

// Block 1: Opening verdict
const verdict =
  p.ep_next >= 8 ? `Yes — ${p.name} is one of the strongest captaincy options in Gameweek ${p.gw}.`
  : p.ep_next >= 6 ? `Probably yes — ${p.name} is a solid captaincy pick for Gameweek ${p.gw}.`
  : p.ep_next >= 4 ? `It depends — ${p.name} is a reasonable option but not the obvious armband choice this week.`
  : `Probably not — there are stronger captaincy options available for Gameweek ${p.gw}, but here is the case for ${p.name}.`

// Block 2: Form
const formText =
  p.form >= 8 ? `${p.name} is in exceptional form right now, averaging ${p.form} points per game over the last six gameweeks.`
  : p.form >= 6 ? `${p.name} is in good form, averaging ${p.form} points per game over the last six gameweeks.`
  : p.form >= 4 ? `${p.name}'s form is moderate — ${p.form} points per game over the last six gameweeks.`
  : `${p.name} has been out of form recently, averaging just ${p.form} points per game over the last six gameweeks.`

// Block 3: Fixture
const fixtureText =
  p.fdr <= 2 ? `${p.name} faces ${fixture} — one of the more favourable fixtures in the gameweek.`
  : p.fdr === 3 ? `${p.name} faces ${fixture} — a mid-table fixture that is neither easy nor particularly tough.`
  : `${p.name} faces ${fixture} — a difficult fixture on paper, which is the main reason to hesitate.`

// Block 4: Ownership
const ownershipText =
  p.ownership >= 40 ? `With ${p.ownership}% of managers owning ${p.name}, not captaining him is a significant differential decision. You would need a strong reason to look elsewhere.`
  : p.ownership >= 20 ? `At ${p.ownership}% ownership, ${p.name} is a popular pick. Missing his points could cost you rank.`
  : p.ownership >= 10 ? `${p.name} is owned by ${p.ownership}% of managers — well held but not so popular that skipping him is a disaster.`
  : `With only ${p.ownership}% ownership, ${p.name} is a genuine differential. If he delivers, you gain significantly on the field.`

// Block 5: Availability
const availabilityText =
  p.chance < 50 ? `There is a significant fitness concern: ${p.news}. Captaining ${p.name} carries real risk this week.`
  : p.chance < 75 ? `There is a minor doubt over ${p.name}'s availability. ${p.news}. Worth monitoring before the deadline.`
  : `There are no injury concerns flagged at the time of writing.`

// Block 6: Closing verdict
const closingText =
  p.ep_next >= 6 && p.fdr <= 3 ? `The combination of strong expected points and a manageable fixture makes ${p.name} a captain pick you can make with confidence.`
  : p.ep_next >= 6 && p.fdr >= 4 ? `${p.name}'s expected output is strong, but the fixture is tough. A viable captain pick for those willing to back him against the odds.`
  : p.ep_next < 6 && p.fdr <= 2 ? `The fixture is kind, which gives ${p.name} an outside chance of a big week even if the numbers do not shout captain.`
  : `With a difficult fixture and modest expected points, ${p.name} is not a captain pick to recommend this week unless your options are limited.`

// CTA lead-in
const ctaLeadin =
  p.ep_next >= 6
    ? `Want to know how ${p.name} compares against the other top captaincy options this week? ChatFPL AI can compare your specific options based on your actual squad.`
    : `Not convinced ${p.name} is the right call? ChatFPL AI can suggest the strongest captaincy option for your squad and budget.`

// ─── Q&A items ────────────────────────────────────────────────────────────────

const QA_ITEMS: PlayerQA[] = [
  {
    id: "captain",
    question: `Should I captain ${p.name} in Gameweek ${p.gw}?`,
    answer: [
      verdict,
      "",
      formText,
      `He faces ${fixture} in Gameweek ${p.gw}, with an FDR rating of ${p.fdr} out of 5. His expected points for the gameweek sit at ${p.ep_next}.`,
      "",
      ownershipText,
      "",
      availabilityText,
      "",
      closingText,
    ].join("\n"),
  },
  {
    id: "transfer",
    question: `Should I transfer ${p.name} in before Gameweek ${p.gw}?`,
    answer: [
      p.ep_next >= 6
        ? `If you have the budget, yes — the timing makes sense.`
        : `It is worth considering, but the case is not as clear-cut as it might appear.`,
      "",
      `At £${p.price}m, ${p.name} is one of the more expensive options in his position. He has registered ${p.goals} goals and ${p.assists} assists this season for ${p.total_points} points in total. ${formText}`,
      "",
      fixtureText,
      "",
      `The main argument against bringing him in is the price point. At £${p.price}m, you need to make cuts elsewhere in your squad to fit him in. Whether that trade-off is worth it depends on who you would be selling and what your ITB looks like.`,
      "",
      `ChatFPL AI can look at your specific squad and budget and tell you whether the transfer makes sense for your team right now.`,
    ].join("\n"),
  },
  {
    id: "fixtures",
    question: `What are ${p.name}'s upcoming fixtures?`,
    answer: [
      `${p.name}'s next fixture is ${fixture} in Gameweek ${p.gw}, rated ${p.fdr} out of 5 for difficulty${p.fdr <= 2 ? " — a comfortable match on paper" : p.fdr === 3 ? " — a workable fixture" : " — a tough assignment"}.`,
      "",
      `Fixture difficulty ratings give you a rough guide but they do not account for recent form, home or away advantage in depth, or how a team has performed against specific opponents this season.`,
      "",
      `For a full fixture run breakdown across the next four or five gameweeks, ChatFPL AI can compare ${p.name}'s schedule against the other premium options in his position and tell you whether now is a good time to hold or sell.`,
    ].join("\n"),
  },
  {
    id: "value",
    question: `Is ${p.name} worth £${p.price}m in FPL?`,
    answer: [
      p.total_points >= 150
        ? `Based on the numbers, yes — ${p.name} has justified his price tag this season.`
        : `It depends on how the rest of your squad is structured.`,
      "",
      `${p.name} has scored ${p.total_points} points at £${p.price}m this season. ${formText} That combination of consistent returns and current form is what makes him a fixture in so many squads right now.`,
      "",
      p.ownership >= 30
        ? `At ${p.ownership}% ownership, avoiding ${p.name} is increasingly a deliberate differential call rather than a neutral decision. Most managers who skip him need a strong reason to do so.`
        : `At ${p.ownership}% ownership, ${p.name} is not as universal a pick as some premium assets. There is some room to take a different view without it costing you rank.`,
      "",
      `The real question at £${p.price}m is always whether you can afford him without weakening two or three other positions. ChatFPL AI can assess your squad balance and tell you whether the budget allocation makes sense.`,
    ].join("\n"),
  },
]

const WELCOME_MSG = `${verdict} Click a question below and I will walk you through the numbers.`

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
  title: `Should I captain Erling Haaland in Fantasy Premier League Gameweek ${PLAYER.gw}? | ChatFPL AI`,
  description: `Haaland has ${PLAYER.form} form and ${PLAYER.ep_next} expected points for Gameweek ${PLAYER.gw}. Find out if he is the right captain pick with live FPL data and AI analysis from ChatFPL AI.`,
  openGraph: {
    title: `Should I captain Erling Haaland? — Gameweek ${PLAYER.gw} FPL Analysis`,
    description: `${PLAYER.form} form. ${PLAYER.ep_next} xPts. ${PLAYER.ownership}% owned. Here is the full captain verdict for Haaland in GW${PLAYER.gw}.`,
    url: "https://www.chatfpl.ai/fpl/erling-haaland",
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HaalandPage() {
  const h1 = `Should I captain Erling Haaland in Fantasy Premier League Gameweek ${PLAYER.gw}?`
  const subtitle = `Gameweek ${PLAYER.gw} · Man City · FWD · £${PLAYER.price}m`

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <DevHeader />

      {/* Hero */}
      <FplPlayerHero
        h1={h1}
        subtitle={subtitle}
        players={SHOWCASE_PLAYERS}
      />

      {/* Analysis section */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-16 bg-black">

        {/* Grid + glow */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
          style={{
            backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.06) 0%, transparent 70%)" }}
        />

        {/* Stat strip */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Form (last 6 GWs)", value: String(PLAYER.form) },
              { label: `Expected points, GW${PLAYER.gw}`, value: String(PLAYER.ep_next) },
              { label: "Season total", value: `${PLAYER.total_points} pts` },
              { label: "Ownership", value: `${PLAYER.ownership}%` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center"
              >
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 mb-1">{s.label}</p>
                <p
                  className="text-2xl font-bold text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)", WebkitBackgroundClip: "text" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat heading */}
        <div className="relative z-10 text-center mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2">
            <span className="text-white">Haaland Analysis </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Gameweek {PLAYER.gw}
            </span>
          </h2>
          <p className="text-white/70 text-sm">Click a question below and get the full breakdown.</p>
        </div>

        {/* Chat window */}
        <div
          className="relative z-10 w-full max-w-4xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalPlayer
            welcome={WELCOME_MSG}
            qaItems={QA_ITEMS}
          />
        </div>

        {/* CTA section */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 text-center">
          <div
            className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.04] px-8 py-10"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">ChatFPL AI</p>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">
              {ctaLeadin}
            </h3>
            <p className="text-sm text-white/70 mb-7">
              Get 20 free messages. No credit card required.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex overflow-hidden items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,135,0.35)]"
              style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
              Try ChatFPL AI for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
