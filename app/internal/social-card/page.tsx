import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSocialCardData,
  parseSocialCardSlot,
  type SocialCardPlayer,
  type SocialCardStat,
} from "@/lib/social-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Card",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

const GREEN = "#00FF87";
const CYAN = "#00FFFF";
const GRADIENT = "linear-gradient(to right, #00ff85, #02efff)";
const SITE = "https://www.chatfpl.ai";

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

function PlayerCard({ player, compact }: { player: SocialCardPlayer; compact?: boolean }) {
  const w = compact ? 200 : 240;
  const cardH = compact ? 280 : 320;
  const photoW = compact ? 120 : 150;

  return (
    <div style={{ position: "relative", width: w, height: cardH + 80 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: cardH - 40,
          width: photoW,
          zIndex: 5,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.photoUrl}
          alt={player.displayName}
          width={photoW}
          height={photoW * 1.2}
          style={{
            width: photoW,
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 12px 24px rgba(0,255,133,0.28))",
          }}
        />
        <div
          style={{
            height: 2,
            marginTop: 4,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.75) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 70%, transparent)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.28)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: cardH,
          borderRadius: 20,
          overflow: "hidden",
          background: "linear-gradient(145deg, rgba(0,20,16,0.96) 0%, rgba(0,10,20,0.98) 100%)",
          boxShadow: "0 0 40px rgba(0,255,133,0.16), 0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ height: 3, background: GRADIENT }} />
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, top: compact ? 72 : 88 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                display: "inline-block",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: GREEN,
                background: `${GREEN}18`,
                border: `1px solid ${GREEN}44`,
              }}
            >
              {player.position}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl(player.teamCode)}
              alt={player.teamShort}
              width={32}
              height={32}
              style={{ width: 32, height: 32, objectFit: "contain" }}
            />
          </div>
          <h2
            style={{
              margin: "10px 0 0",
              fontSize: compact ? 26 : 32,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {player.displayName}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            {player.price}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ stats }: { stats: SocialCardStat[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
        gap: 10,
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {stats.map((stat) => (
        <div key={stat.label} style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.1,
              color: stat.accent ? GREEN : "rgba(255,255,255,0.92)",
            }}
          >
            {stat.value}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 600,
            }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function SocialCardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const slot = parseSocialCardSlot(params.slot);
  const card = await getSocialCardData(slot);
  if (!card) notFound();

  const dual = card.players.length > 1;

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1080,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
        background: "#000",
      }}
    >
      {/* Hero-style background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(0,255,133,0.14) 0%, transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #000 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.35,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "44px 52px 40px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${SITE}/ChatFPL_AI_Logo.png`}
              alt="ChatFPL"
              width={44}
              height={44}
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {card.hubLabel}
            </span>
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: `1px solid ${GREEN}55`,
              background: "rgba(0,255,135,0.08)",
              color: GREEN,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            GW{card.gw}
          </div>
        </div>

        {/* Hub hero headline */}
        <div style={{ marginTop: 28, textAlign: "center", padding: "0 24px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: dual ? 46 : 52,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {card.heroWhite}
            <span
              style={{
                backgroundImage: GRADIENT,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {card.heroGradient}
            </span>
          </h1>
        </div>

        {/* Player(s) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: dual ? 28 : 0,
            marginTop: 8,
            minHeight: 0,
          }}
        >
          {card.players.map((player) => (
            <PlayerCard key={player.code} player={player} compact={dual} />
          ))}
        </div>

        {/* Chat bubble */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 4 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "linear-gradient(to bottom right, #22d3ee, #34d399)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 900,
              color: "#000",
            }}
          >
            CF
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 20,
              borderBottomLeftRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.35)",
              padding: "16px 20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 400,
              }}
            >
              {card.bubbleText}
            </p>
            <StatsRow stats={card.stats} />
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <div
            style={{
              padding: "3px",
              borderRadius: 999,
              background: GRADIENT,
            }}
          >
            <div
              style={{
                padding: "12px 32px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.9)",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                backgroundImage: GRADIENT,
                WebkitBackgroundClip: "text",
                color: "transparent",
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
