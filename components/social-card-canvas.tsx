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
          ? "88px 84px 210px 248px 1fr"
          : "88px 100px 1fr 1fr",
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
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${SITE}/ChatFPL_AI_Logo.png`}
            alt="ChatFPL AI"
            width={120}
            height={120}
            className="h-[120px] w-[120px] object-contain"
          />
          <p className="text-[16px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {card.hubLabel}
          </p>
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
          <p className="text-[20px] leading-snug text-white/92 line-clamp-4">{card.bubbleText}</p>
        </div>
      </div>
    </div>
  );
}
