import { ConversationalAbout } from "@/components/conversational-about"
import { DevHeader } from "@/components/dev-header"

export const metadata = {
  title: "About — ChatFPL.ai",
  description: "Find out what ChatFPL AI is, how it works, and why FPL managers use it.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black about-root">
      <style>{`
        .about-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .about-root ::-webkit-scrollbar-track { background: transparent; }
        .about-root ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 99px; }
        .about-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,200,0.4); }
      `}</style>

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
          background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <DevHeader />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 pb-12">

        {/* Heading */}
        <div className="text-center mb-10 max-w-4xl">
          <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-tighter lg:text-6xl">
            <span className="text-white">About </span>
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right,#00ff85,#02efff)", WebkitBackgroundClip: "text" }}
            >
              ChatFPL AI
            </span>
          </h1>
          <p className="text-lg text-gray-300">
            Click a question and find out what ChatFPL AI is all about.
          </p>
        </div>

        {/* Chat */}
        <div
          className="w-full max-w-6xl flex flex-col"
          style={{ height: "clamp(520px, 72vh, 780px)" }}
        >
          <ConversationalAbout />
        </div>

      </main>
    </div>
  )
}
