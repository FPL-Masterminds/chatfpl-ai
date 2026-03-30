import { ConversationalFAQ } from "@/components/conversational-faq"
import { DevHeader } from "@/components/dev-header"
import Link from "next/link"

export const metadata = {
  title: "FAQ — ChatFPL",
  description: "Got questions about ChatFPL? Ask them right here.",
}

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 pb-12">

        {/* Heading */}
        <div className="text-center mb-10 max-w-xl">
          <h1
            className="font-bold leading-[1.1] tracking-tighter mb-3"
            style={{ fontSize: "clamp(28px,5vw,52px)" }}
          >
            <span className="text-white">Frequently </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Asked Questions
            </span>
          </h1>
          <p className="text-white/45 text-base">
            Click a question below and get the answer instantly.
          </p>
        </div>

        {/* Chat window */}
        <div
          className="w-full max-w-4xl flex flex-col overflow-hidden"
          style={{
            height: "clamp(520px, 72vh, 760px)",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(to bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          <ConversationalFAQ />
        </div>

        {/* Back link */}
        <Link
          href="/devlandingpage"
          className="mt-8 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          ← Back to ChatFPL
        </Link>

      </main>
    </div>
  )
}
