import Link from "next/link"
import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"

interface HubHeroProps {
  headingWhite: string
  headingGradient: string
  subtitle: string
  ctaHref?: string
  ctaLabel?: string
  badge?: React.ReactNode
  headingFontSize?: string
}

export function HubHero({
  headingWhite,
  headingGradient,
  subtitle,
  ctaHref = "/chat",
  ctaLabel = "Start Chatting for Free",
  badge,
  headingFontSize = "clamp(30px, 5vw, 60px)",
}: HubHeroProps) {
  return (
    <section className="relative isolate flex min-h-[540px] items-center justify-center overflow-hidden bg-black pt-28 pb-16">

      {/* Video background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <DevHeroVideoBg />
      </div>

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/50 to-black/90"
        aria-hidden
      />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hub-fadein { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 text-center">
        <div className="space-y-6">

          <h1
            className="hub-fadein font-bold leading-[1.1] tracking-tighter text-white"
            style={{ fontSize: headingFontSize, animationDelay: "0.1s" }}
          >
            {headingWhite}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {headingGradient}
            </span>
          </h1>

          <p
            className="hub-fadein text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: "0.25s" }}
          >
            {subtitle}
          </p>

          <div
            className="hub-fadein flex flex-col items-center gap-4"
            style={{ animationDelay: "0.4s" }}
          >
            {/* CTA */}
            <div
              className="inline-block rounded-full p-[4px] transition-all duration-300 hover:scale-105"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 0 40px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <Link
                href={ctaHref}
                className="relative block overflow-hidden rounded-full px-10 py-4 font-bold text-lg text-[#08020E]"
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
                {ctaLabel}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white/70">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#00FF87]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white/70">Instant access</span>
              </div>
            </div>

            {/* Optional extra badge (e.g. dev pill, player count) */}
            {badge && <div>{badge}</div>}
          </div>

        </div>
      </div>
    </section>
  )
}
