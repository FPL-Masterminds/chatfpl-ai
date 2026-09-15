import { DevHeroVideoBg } from "@/components/dev-hero-video-bg"
import { ProductCtaLink } from "@/components/product-cta-link"

interface HubHeroProps {
  headingWhite: React.ReactNode
  headingGradient: React.ReactNode
  subtitle: string
  badge?: React.ReactNode
  headingFontSize?: string
  containerMaxWidth?: string
}

export function HubHero({
  headingWhite,
  headingGradient,
  subtitle,
  badge,
  headingFontSize = "clamp(30px, 5vw, 60px)",
  containerMaxWidth = "max-w-4xl",
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

      <div className={`relative z-10 mx-auto w-full ${containerMaxWidth} px-4 sm:px-6 text-center`}>
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
            <ProductCtaLink />

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
