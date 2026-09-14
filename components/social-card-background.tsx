"use client";

import { DevHeroVideoBg } from "@/components/dev-hero-video-bg";

/** Mask: transparent = hidden, black = visible */
const VIDEO_MASK =
  "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 50%, #000 72%, #000 100%)";

const GRID_MASK =
  "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 58%, #000 78%, #000 100%)";

export function SocialCardBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Solid black base */}
      <div className="absolute inset-0 bg-black" />

      {/* Hero video - same Mux stream as hub heroes, fades in lower half */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: VIDEO_MASK,
          maskImage: VIDEO_MASK,
        }}
      >
        <DevHeroVideoBg />
      </div>

      {/* Grid reference texture - bottom half fade */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/social-card-grid-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          WebkitMaskImage: GRID_MASK,
          maskImage: GRID_MASK,
          opacity: 0.95,
        }}
      />

      {/* CSS grid reinforcement for sharper lines at full opacity */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,135,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,135,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          WebkitMaskImage: GRID_MASK,
          maskImage: GRID_MASK,
        }}
      />

      {/* Hub hero vignette - matches hub-hero.tsx overlay */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* Soft green glow lower centre */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 78%, rgba(0,255,133,0.16) 0%, transparent 65%)",
          WebkitMaskImage: GRID_MASK,
          maskImage: GRID_MASK,
        }}
      />
    </div>
  );
}
