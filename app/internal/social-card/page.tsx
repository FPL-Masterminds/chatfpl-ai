import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";
import {
  getSocialCardData,
  isSocialCardTokenValid,
  parseSocialCardSlot,
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
const SITE = "https://www.chatfpl.ai";

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

export default async function SocialCardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const allowed =
    isSocialCardTokenValid(params.token) || isSiteOwner(session?.user?.email);
  if (!allowed) notFound();

  const slot = parseSocialCardSlot(params.slot);
  const card = await getSocialCardData(slot);
  if (!card) notFound();

  const p = card.player;

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
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.45,
        }}
      />
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(0,255,135,0.16) 0%, transparent 62%)",
        }}
      />

      {/* Animated-style glow frame (static gradient for clean screenshots) */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          borderRadius: 36,
          padding: 2,
          background: `linear-gradient(135deg, ${GREEN}, rgba(255,255,255,0.12), ${CYAN}, rgba(255,255,255,0.08), ${GREEN})`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 34,
            background: "rgba(0,0,0,0.92)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "48px 56px 44px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${SITE}/ChatFPL_AI_Logo.png`}
              alt="ChatFPL"
              width={56}
              height={56}
              style={{ width: 56, height: 56, objectFit: "contain" }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                ChatFPL AI
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 16, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
                Live FPL data
              </p>
            </div>
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: `1px solid ${GREEN}66`,
              background: "rgba(0,255,135,0.1)",
              color: GREEN,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            GW{card.gw}
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginTop: 36, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GREEN,
              background: `${GREEN}14`,
              border: `1px solid ${GREEN}44`,
            }}
          >
            {card.cardType.replace("_", " ")}
          </p>
          <h1
            style={{
              margin: "18px 0 0",
              fontSize: 58,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {card.headline}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 24, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            {card.subline}
          </p>
        </div>

        {/* Player card (homepage carousel style, scaled up) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <div style={{ position: "relative", width: 500, height: 560 }}>
            {/* Photo */}
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 250, width: 280, zIndex: 5 }}>
              <div
                style={{
                  width: 120,
                  height: 18,
                  margin: "0 auto -8px",
                  borderRadius: 999,
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 80%)",
                  filter: "blur(4px)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.photoUrl}
                alt={p.webName}
                width={280}
                height={340}
                style={{
                  width: 280,
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 16px 32px rgba(0,255,133,0.28))",
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

            {/* Card face */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 360,
                borderRadius: 28,
                overflow: "hidden",
                background: "linear-gradient(145deg, rgba(0,20,16,0.96) 0%, rgba(0,10,20,0.98) 100%)",
                boxShadow: "0 0 48px rgba(0,255,133,0.18), 0 28px 56px rgba(0,0,0,0.65)",
              }}
            >
              <div style={{ height: 4, background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 25%, rgba(0,255,133,0.08) 0%, transparent 65%)",
                }}
              />

              <div style={{ position: "absolute", left: 28, right: 28, bottom: 28, top: 120 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: 999,
                      padding: "6px 14px",
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: GREEN,
                      background: `${GREEN}18`,
                      border: `1px solid ${GREEN}44`,
                    }}
                  >
                    {p.position}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badgeUrl(p.teamCode)}
                    alt={p.teamShort}
                    width={44}
                    height={44}
                    style={{ width: 44, height: 44, objectFit: "contain" }}
                  />
                </div>

                <h2
                  style={{
                    margin: "16px 0 0",
                    fontSize: 52,
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#fff",
                  }}
                >
                  {p.webName}
                </h2>
                <p style={{ margin: "8px 0 0", fontSize: 20, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                  {p.teamShort} · {p.fixtureLabel}
                </p>

                <div
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    paddingTop: 18,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {[
                    { label: "xP", value: p.epNext.toFixed(1), accent: true },
                    { label: "Form", value: p.form, accent: false },
                    { label: "Own", value: `${p.ownership.toFixed(1)}%`, accent: false },
                    { label: "Price", value: p.price, accent: false },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 28,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: stat.accent ? GREEN : "rgba(255,255,255,0.92)",
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 11,
                          letterSpacing: "0.16em",
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
              </div>
            </div>

            {/* Glow ring */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 360,
                borderRadius: 28,
                padding: 1,
                background: `linear-gradient(135deg, ${GREEN}, rgba(255,255,255,0.1), ${CYAN}, ${GREEN})`,
                pointerEvents: "none",
                zIndex: 6,
                boxSizing: "border-box",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <div
            style={{
              padding: "3px",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN}, ${GREEN})`,
            }}
          >
            <div
              style={{
                padding: "14px 36px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.92)",
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                backgroundImage: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
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
