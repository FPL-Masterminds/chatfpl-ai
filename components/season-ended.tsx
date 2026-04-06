import Link from "next/link"
import { DevHeader } from "@/components/dev-header"

export function SeasonEnded() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <DevHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        {/* Icon */}
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ border: "1px solid rgba(0,255,135,0.3)", background: "rgba(0,255,135,0.05)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>

        {/* Heading */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#00FF87" }}>
          2025/26 Season Complete
        </p>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          That&apos;s a wrap.
        </h1>
        <p className="mb-2 max-w-md text-white/70">
          The Fantasy Premier League season has ended. Player analysis, captaincy verdicts, and comparison pages will return when the 2026/27 season begins.
        </p>
        <p className="mb-10 max-w-md text-white/50 text-sm">
          In the meantime, you can still use the ChatFPL AI assistant on the homepage.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-80"
          style={{ background: "#00FF87" }}
        >
          Go to ChatFPL AI
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </main>
    </div>
  )
}
