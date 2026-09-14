import type { SocialCardData } from "@/lib/social-card";
import { SocialCardPlayerHero, SocialCardPlayerPhoto } from "@/components/social-card-player-hero";
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
  const dualCols = card.tableCols.slice(0, 5);

  return (
    <div
      className="relative overflow-hidden bg-black text-white antialiased"
      style={{
        width: 1080,
        height: 1080,
        display: "grid",
        gridTemplateRows: dual
          ? "88px 84px 210px 248px 230px 92px"
          : "88px 100px 1fr 164px 92px",
        gap: 12,
        padding: "32px 40px 36px",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 50% at 50% 32%, rgba(0,255,133,0.2) 0%, transparent 58%), #000",
        }}
      />

      {/* Brand header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${SITE}/ChatFPL_AI_Logo.png`}
            alt="ChatFPL"
            width={100}
            height={100}
            className="h-[100px] w-[100px] object-contain"
          />
          <div>
            <p
              className="text-[32px] font-bold leading-none tracking-tight text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to right,#00ff85,#02efff)",
                WebkitBackgroundClip: "text",
              }}
            >
              ChatFPL AI
            </p>
            <p className="mt-1.5 text-[14px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {card.hubLabel}
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-6 py-2.5 text-[20px] font-bold tracking-wide"
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
      <div className="relative z-10 flex items-center justify-center px-2 text-center">
        <h1
          className="font-bold leading-[1.08] tracking-tighter text-white"
          style={{ fontSize: dual ? 38 : 50 }}
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

      {/* Player zone */}
      <div className="relative z-10 flex min-h-0 items-center justify-center overflow-hidden">
        {dual ? (
          <div className="flex w-full items-end justify-center gap-10">
            <SocialCardPlayerPhoto player={card.players[0]} />
            <span
              className="pb-12 text-[36px] font-black tracking-widest text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to bottom,#00FF87,#00FFFF)",
                WebkitBackgroundClip: "text",
              }}
            >
              VS
            </span>
            <SocialCardPlayerPhoto player={card.players[1]} />
          </div>
        ) : (
          <SocialCardPlayerHero
            player={card.players[0]}
            size="large"
            highlightStats={highlights}
          />
        )}
      </div>

      {/* Dual stat table */}
      {dual && card.tableRows.length > 0 && (
        <div className="relative z-10 min-h-0 overflow-hidden">
          <SocialCardStatTable cols={dualCols} rows={card.tableRows} compact />
        </div>
      )}

      {/* Chat bubble */}
      <div className="relative z-10 flex min-h-0 items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[13px] font-black text-black"
        >
          CF
        </div>
        <div className="flex-1 rounded-[22px] rounded-bl-md border border-white/10 bg-black/45 px-5 py-4">
          <p className="text-[20px] leading-snug text-white/92 line-clamp-3">{card.bubbleText}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 flex items-center justify-center">
        <div
          className="rounded-full p-[3px]"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 0 32px rgba(0,255,135,0.28), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          <div
            className="rounded-full px-14 py-4 text-[28px] font-bold tracking-tight text-[#08020E]"
            style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
          >
            {card.cta}
          </div>
        </div>
      </div>
    </div>
  );
}
