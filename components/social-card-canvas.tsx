import type { SocialCardData } from "@/lib/social-card";
import { SocialCardPlayerHero } from "@/components/social-card-player-hero";
import { SocialCardStatTable } from "@/components/social-card-stat-table";

const SITE = "https://www.chatfpl.ai";

function pickHighlightStats(card: SocialCardData) {
  const row = card.tableRows[0];
  if (!row) return [];
  const keys = card.tableCols.slice(0, 4).map((c) => c.key);
  return keys.map((key, i) => {
    const col = card.tableCols[i];
    return {
      label: col?.label ?? key,
      value: row.display[key] ?? "",
      accent: i === 0,
    };
  });
}

export function SocialCardCanvas({ card }: { card: SocialCardData }) {
  const dual = card.layout === "dual";
  const highlights = pickHighlightStats(card);

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden bg-black text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 50% at 50% 35%, rgba(0,255,133,0.18) 0%, transparent 60%), #000",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-12 pb-10 pt-11">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${SITE}/ChatFPL_AI_Logo.png`}
              alt="ChatFPL"
              width={72}
              height={72}
              className="h-[72px] w-[72px] object-contain"
            />
            <div>
              <p
                className="text-[28px] font-bold leading-none tracking-tight text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                  WebkitBackgroundClip: "text",
                }}
              >
                ChatFPL AI
              </p>
              <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.2em] text-white/45">
                {card.hubLabel}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-5 py-2 text-[18px] font-bold tracking-wide"
            style={{
              border: "1px solid rgba(0,255,135,0.4)",
              background: "rgba(0,255,135,0.12)",
              color: "#00FF87",
            }}
          >
            GW{card.gw}
          </span>
        </div>

        {/* Headline */}
        <div className="mt-6 text-center px-2">
          <h1
            className="font-bold leading-[1.08] tracking-tighter text-white"
            style={{ fontSize: dual ? 40 : 44 }}
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
        </div>

        {/* Hero player(s) */}
        <div className="mt-2 flex flex-1 min-h-0 items-center justify-center">
          {dual ? (
            <div className="flex w-full items-end justify-center gap-6">
              <SocialCardPlayerHero player={card.players[0]} size="medium" />
              <div className="flex flex-col items-center gap-2 pb-16">
                <span
                  className="text-[32px] font-black tracking-widest text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(to bottom,#00FF87,#00FFFF)",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  VS
                </span>
              </div>
              <SocialCardPlayerHero player={card.players[1]} size="medium" />
            </div>
          ) : (
            <SocialCardPlayerHero
              player={card.players[0]}
              size="large"
              highlightStats={highlights}
            />
          )}
        </div>

        {/* Dual: stat table below heroes */}
        {dual && card.tableRows.length > 0 && (
          <div className="mt-2 shrink-0">
            <SocialCardStatTable cols={card.tableCols} rows={card.tableRows} large />
          </div>
        )}

        {/* Chat bubble */}
        <div className="mt-4 flex items-start gap-4 shrink-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[12px] font-black text-black"
          >
            CF
          </div>
          <div className="flex-1 rounded-[22px] rounded-bl-md border border-white/10 bg-black/40 px-5 py-4">
            <p className="text-[17px] leading-relaxed text-white/90 line-clamp-3">{card.bubbleText}</p>
          </div>
        </div>

        {/* CTA — solid gradient like HubHero, readable black text */}
        <div className="mt-5 flex justify-center shrink-0">
          <div
            className="rounded-full px-12 py-4 text-[26px] font-bold tracking-tight text-[#08020E]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            {card.cta}
          </div>
        </div>
      </div>
    </div>
  );
}
