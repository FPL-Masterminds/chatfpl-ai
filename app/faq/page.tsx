import { ConversationalFAQ } from "@/components/conversational-faq"
import { DevHeader } from "@/components/dev-header"
export const metadata = {
  title: "FAQ — ChatFPL.ai",
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
        <div className="text-center mb-10 max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
            <span className="text-white">Frequently </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              Asked Questions
            </span>
          </h1>
          <p className="text-lg text-gray-300">
            Click a question below and get the answer instantly.
          </p>
        </div>

        {/* Chat — no panel, questions float on the dark background */}
        <div
          className="w-full max-w-6xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalFAQ />
        </div>

        {/* Back link */}
      </main>
    </div>
  )
}
