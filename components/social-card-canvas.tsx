import type { SocialCardData } from "@/lib/social-card";
import { SocialCardBackground } from "@/components/social-card-background";
import { SocialCardFooter } from "@/components/social-card-footer";
import { SocialCardSplitPane } from "@/components/social-card-split-pane";

const SITE = "https://www.chatfpl.ai";

export function SocialCardCanvas({ card }: { card: SocialCardData }) {
  const dual = card.layout === "dual";

  return (
    <div
      className="relative flex flex-col bg-black text-white antialiased"
      style={{ width: 1080, height: 1080, padding: "36px 44px 40px" }}
    >
      <SocialCardBackground />

      {/* Brand header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE}/ChatFPL_AI_Logo.png`}
          alt="ChatFPL AI"
          width={140}
          height={140}
          className="h-[72px] w-auto object-contain"
        />
        <span
          className="rounded-full px-6 py-2.5 text-[18px] font-bold tracking-wide text-[#1A0E24]"
          style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
        >
          GW{card.gw}
        </span>
      </div>

      {/* Headline */}
      <div
        className="relative z-10 mt-4 flex shrink-0 items-center justify-center px-4 text-center"
        style={{ marginBottom: 20 }}
      >
        <h1
          className="font-bold leading-[1.08] tracking-tighter text-white"
          style={{ fontSize: dual ? 36 : 44 }}
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

      {/* Two-column split (landing page style, no glow borders) */}
      <div className="relative z-10 shrink-0">
        <SocialCardSplitPane
          players={card.players}
          dual={dual}
          prompt={card.prompt}
          stats={card.stats}
        />
      </div>

      {/* Footer card (homepage "The Edge" style) */}
      <div className="relative z-10 mt-5 shrink-0">
        <SocialCardFooter
          tag={card.footerTag}
          title={card.footerTitle}
          paragraph={card.paragraph}
          slot={card.slot}
        />
      </div>
    </div>
  );
}
