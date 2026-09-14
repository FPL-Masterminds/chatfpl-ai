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

/** Keep bubble copy short enough to read on Twitter. */
function shortBubble(text: string, max = 200): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trim()}...`;
}

export function SocialCardCanvas({ card }: { card: SocialCardData }) {
  const dual = card.layout === "dual";
  const highlights = pickHighlightStats(card);
  const dualCols = card.tableCols.slice(0, 5);
  const bubble = shortBubble(card.bubbleText);

  return (
    <div
      className="relative overflow-hidden bg-black text-white antialiased"
      style={{
        width: 1080,
        height: 1080,
        display: "grid",
        gridTemplateRows: dual
          ? "72px 76px 248px 200px 1fr"
          : "72px 88px 520px 1fr",
        gap: 14,
        padding: "36px 44px 40px",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 45% at 50% 38%, rgba(0,255,133,0.18) 0%, transparent 55%), #000",
        }}
      />

      {/* Brand header */}
      <div className="relative z-10 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE}/ChatFPL_AI_Logo.png`}
          alt="ChatFPL AI"
          width={140}
          height={140}
          className="h-[72px] w-auto object-contain"
        />
        <div className="flex items-center gap-4">
          <p className="text-[15px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {card.hubLabel}
          </p>
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
      </div>

      {/* Headline */}
      <div className="relative z-10 flex items-center justify-center px-4 text-center">
        <h1
          className="font-bold leading-[1.08] tracking-tighter text-white"
          style={{ fontSize: dual ? 36 : 46 }}
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

      {/* Player zone — overflow visible so photo head is not clipped */}
      <div className="relative z-10 flex items-end justify-center" style={{ overflow: "visible" }}>
        {dual ? (
          <div className="flex w-full items-end justify-center gap-6">
            <SocialCardPlayerPhoto player={card.players[0]} />
            <span
              className="pb-20 text-[28px] font-black tracking-widest text-transparent bg-clip-text"
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
          <SocialCardPlayerHero player={card.players[0]} highlightStats={highlights} />
        )}
      </div>

      {/* Dual stat table */}
      {dual && card.tableRows.length > 0 && (
        <div className="relative z-10 min-h-0 overflow-hidden">
          <SocialCardStatTable cols={dualCols} rows={card.tableRows} compact />
        </div>
      )}

      {/* Chat bubble */}
      <div className="relative z-10 flex items-start gap-3 self-end">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[11px] font-black text-black"
        >
          CF
        </div>
        <div className="flex-1 rounded-[20px] rounded-bl-md border border-white/10 bg-black/50 px-5 py-3.5">
          <p className="text-[19px] leading-snug text-white/90 line-clamp-3">{bubble}</p>
        </div>
      </div>
    </div>
  );
}
