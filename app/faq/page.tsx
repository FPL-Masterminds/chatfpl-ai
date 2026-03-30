import { ConversationalFAQ } from "@/components/conversational-faq"
import { DevHeader } from "@/components/dev-header"
import Link from "next/link"

export const metadata = {
  title: "FAQ — ChatFPL",
  description: "Got questions about ChatFPL? Ask them right here.",
}

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black faq-root">
      <style>{`
        .faq-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .faq-root ::-webkit-scrollbar-track { background: transparent; }
        .faq-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .faq-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

      {/* Grid pattern — same as devlandingpage */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial green glow — mid-page */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 pb-12">

        {/* Heading */}
        <div className="text-center mb-10 max-w-2xl">
          <h1
            className="font-bold leading-[1.1] tracking-tighter mb-3 whitespace-nowrap"
            style={{ fontSize: "clamp(20px,3.5vw,42px)" }}
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

        {/* Ambient glow behind window — same as ChatShowcase */}
        <div className="relative w-full max-w-6xl">
          <div
            className="absolute inset-0 rounded-[32px] opacity-30 blur-2xl pointer-events-none"
            style={{ background: "linear-gradient(135deg,#00FFFF 0%,#00FF87 100%)" }}
          />

          {/* 2px animated glow border wrapper — verbatim from chat-showcase.tsx */}
          <div
            className="relative rounded-[26px] p-[2px]"
            style={{
              background: "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.15),#00FFFF,rgba(255,255,255,0.15),#00FF87)",
              backgroundSize: "220% 220%",
              animation: "glow_scroll 6s linear infinite",
            }}
          >
            {/* Inner chat window */}
            <div
              className="w-full flex flex-col overflow-hidden rounded-[24px] bg-[#080808]"
              style={{ height: "clamp(520px, 72vh, 780px)" }}
            >
              <ConversationalFAQ />
            </div>
          </div>
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
