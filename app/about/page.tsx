import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"
import { Reveal } from "@/components/scroll-reveal"
import { Database } from "lucide-react"

export const metadata = {
  title: "About — ChatFPL",
  description: "ChatFPL is your AI-powered Fantasy Premier League assistant, built by managers for managers.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">

      {/* Grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial green glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 px-4 pt-28 pb-20">
        <div className="container mx-auto max-w-4xl">

          {/* Hero */}
          <Reveal className="text-center mb-16">
            <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
              <span className="text-white">About </span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
              >
                ChatFPL
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Your AI-powered Fantasy Premier League assistant - built by managers, for managers.
            </p>
          </Reveal>

          {/* Introduction */}
          <Reveal delay={0.1} className="mb-16 space-y-5 max-w-3xl mx-auto">
            <p className="text-base text-gray-300 leading-relaxed">
              ChatFPL helps Fantasy Premier League players make sharper, faster, and more informed decisions. It blends{" "}
              <span className="text-[#00FF87] font-medium">real-time FPL data</span> with{" "}
              <span className="text-[#00FF87] font-medium">advanced AI insights</span> to deliver instant, personalised advice that keeps you one step ahead of the competition.
            </p>
            <p className="text-base text-gray-300 leading-relaxed">
              We created ChatFPL so every manager - casual or seasoned - can access the kind of tactical insight and data-driven analysis that was once only available to experts. We combine the power of artificial intelligence with real-time FPL data to provide instant, personalised advice that helps you climb the rankings.
            </p>
            <p className="text-base text-gray-300 leading-relaxed">
              Created by FPL obsessives who live the game every week. ChatFPL evolves through feedback, strategy discussions, and real-world testing from the community itself.
            </p>
          </Reveal>

          {/* How It Works */}
          <section className="mb-16">
            <Reveal className="text-center mb-10">
              <h2 className="mb-3 text-[32px] font-bold leading-[1.1] tracking-tighter lg:text-5xl">
                <span className="text-white">How </span>
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
                >
                  It Works
                </span>
              </h2>
              <p className="text-lg text-gray-300">Real-time insights, powered by AI</p>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-3">

              {/* Live Data Feed */}
              <Reveal delay={0.1}>
                <div
                  className="relative rounded-2xl p-[1px] h-full"
                  style={{
                    background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.06),#02efff,rgba(255,255,255,0.06),#00FF87)",
                    backgroundSize: "220% 220%",
                    animation: "glow_scroll 7s linear infinite",
                  }}
                >
                  <div className="bg-[#080808] rounded-2xl p-7 h-full flex flex-col items-center text-center">
                    <div
                      className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
                      style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}
                    >
                      <Database className="h-6 w-6 text-[#00FF87]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">Live Data Feed</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Connected directly to up-to-the-minute player statistics, fixture difficulty, player availability, performance and transfer trends.
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* AI-Driven Insights */}
              <Reveal delay={0.2}>
                <div
                  className="relative rounded-2xl p-[1px] h-full"
                  style={{
                    background: "linear-gradient(90deg,#02efff,rgba(255,255,255,0.06),#00FF87,rgba(255,255,255,0.06),#02efff)",
                    backgroundSize: "220% 220%",
                    animation: "glow_scroll 9s linear infinite",
                  }}
                >
                  <div className="bg-[#080808] rounded-2xl p-7 h-full flex flex-col items-center text-center">
                    <div
                      className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden"
                      style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}
                    >
                      <Image
                        src="/AI_Driven Insights.png"
                        alt="AI-Driven Insights"
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">AI-Driven Insights</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Context-rich, actionable recommendations for your FPL squad - not just raw numbers and figures.
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Instant Answers */}
              <Reveal delay={0.3}>
                <div
                  className="relative rounded-2xl p-[1px] h-full"
                  style={{
                    background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.06),#02efff,rgba(255,255,255,0.06),#00FF87)",
                    backgroundSize: "220% 220%",
                    animation: "glow_scroll 11s linear infinite",
                  }}
                >
                  <div className="bg-[#080808] rounded-2xl p-7 h-full flex flex-col items-center text-center">
                    <div
                      className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden"
                      style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}
                    >
                      <Image
                        src="/Instant_Answers.png"
                        alt="Instant Answers"
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">Instant Answers</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Ask anything in plain English and get an instant response. No spreadsheets, no scraping - straight-to-the-point analysis.
                    </p>
                  </div>
                </div>
              </Reveal>

            </div>
          </section>

          {/* Why ChatFPL */}
          <Reveal delay={0.1} className="mb-16">
            <div
              className="relative rounded-2xl p-[1px]"
              style={{
                background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.06),#02efff,rgba(255,255,255,0.06),#00FF87)",
                backgroundSize: "220% 220%",
                animation: "glow_scroll 8s linear infinite",
              }}
            >
              <div className="bg-[#080808] rounded-2xl p-8 md:p-10">
                <h2 className="mb-3 text-[32px] font-bold leading-[1.1] tracking-tighter lg:text-5xl text-center">
                  <span className="text-white">Why </span>
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
                  >
                    ChatFPL?
                  </span>
                </h2>
                <p className="mb-6 text-center text-lg text-gray-300">Fantasy Premier League changes fast</p>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <p className="text-base text-gray-300 leading-relaxed">
                    Fixtures shift, players explode, data evolves. ChatFPL gives you the power to react in seconds, not hours, using real insights - not guesswork.
                  </p>
                  <p className="text-base text-gray-300 leading-relaxed">
                    Whether you're setting your captain, planning transfers, or analysing upcoming fixtures, ChatFPL is your always-on tactical partner, built to help you climb the ranks and enjoy the game even more.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.1} className="text-center">
            <p className="mb-8 text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
              Stop overthinking. Start winning. Let ChatFPL analyse your squad, fixtures, and form in seconds - so you make the right move every time.
            </p>
            <div
              className="inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <Link
                href="/signup"
                className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-[#08020E]"
                style={{ background: "linear-gradient(to right, #00FF87, #00FFFF)" }}
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2.4s linear infinite",
                  }}
                />
                Start your 20-message free trial today
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/40">Free trial - no credit card required</p>
          </Reveal>

        </div>
      </main>
    </div>
  )
}
