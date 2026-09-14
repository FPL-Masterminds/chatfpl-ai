import type { SocialCardData } from "@/lib/social-card";
import { SocialCardStatTable } from "@/components/social-card-stat-table";

const SITE = "https://www.chatfpl.ai";

export function SocialCardCanvas({ card }: { card: SocialCardData }) {
  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden bg-black text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(0,255,133,0.12) 0%, transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, #000 72%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-10 pb-9 pt-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${SITE}/ChatFPL_AI_Logo.png`}
              alt="ChatFPL"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {card.hubLabel}
            </span>
          </div>
          <span
            className="rounded-full px-4 py-1.5 text-[13px] font-bold tracking-[0.12em]"
            style={{
              border: "1px solid rgba(0,255,135,0.35)",
              background: "rgba(0,255,135,0.08)",
              color: "#00FF87",
            }}
          >
            GW{card.gw}
          </span>
        </div>

        {/* Hero — same classes as HubHero / ComparisonHero */}
        <div className="mt-7 text-center px-4">
          <h1
            className="font-bold leading-[1.1] tracking-tighter text-white"
            style={{ fontSize: card.layout === "dual" ? 34 : 38 }}
          >
            {card.heroWhite}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                WebkitBackgroundClip: "text",
              }}
            >
              {card.heroGradient}
            </span>
          </h1>
          {card.analysisLine && (
            <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
              <span className="text-white">{card.analysisLine.white}</span>
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                  WebkitBackgroundClip: "text",
                }}
              >
                {card.analysisLine.gradient}
              </span>
            </h2>
          )}
        </div>

        {/* Stat table — same component pattern as /fpl/compare */}
        <div className="mt-6 flex-1 min-h-0 flex flex-col justify-center">
          {card.tableCols && card.tableRows && card.tableRows.length > 0 && (
            <SocialCardStatTable cols={card.tableCols} rows={card.tableRows} />
          )}
        </div>

        {/* Chat bubble — same pattern as ConversationalPlayer */}
        <div className="mt-5 flex items-end gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[10px] font-black text-black"
          >
            CF
          </div>
          <div
            className="flex-1 rounded-[20px] rounded-bl-sm border border-white/8 bg-black/30 px-4 py-3"
          >
            <p className="text-[13px] leading-relaxed text-white/85">{card.bubbleText}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 flex justify-center">
          <div
            className="rounded-full p-[3px]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            <div
              className="rounded-full px-8 py-2.5 text-[20px] font-bold tracking-tight text-transparent"
              style={{
                background: "rgba(0,0,0,0.92)",
                backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                WebkitBackgroundClip: "text",
              }}
            >
              {card.cta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
