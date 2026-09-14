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
      style={{ width: 1080, height: 1080, padding: "32px 44px 28px" }}
    >
      <SocialCardBackground />

      {/* Top bar: GW pill only */}
      <div className="relative z-10 flex shrink-0 justify-end">
        <span
          className="rounded-full px-7 py-2.5 text-[22px] font-bold tracking-wide text-[#1A0E24]"
          style={{ background: "linear-gradient(to right,#00FF87,#00FFFF)" }}
        >
          GW{card.gw}
        </span>
      </div>

      {/* Headline */}
      <div
        className="relative z-10 mt-3 flex shrink-0 items-center justify-center px-2 text-center"
        style={{ marginBottom: 16 }}
      >
        <h1
          className="font-bold leading-[1.08] tracking-tighter text-white"
          style={{ fontSize: dual ? 45 : 54 }}
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

      {/* Two-column split */}
      <div className="relative z-10 shrink-0">
        <SocialCardSplitPane
          players={card.players}
          dual={dual}
          prompt={card.prompt}
          stats={card.stats}
        />
      </div>

      {/* Edge-style commentary card */}
      <div className="relative z-10 mt-4 shrink-0">
        <SocialCardFooter
          tag={card.footerTag}
          title={card.footerTitle}
          paragraph={card.paragraph}
        />
      </div>

      {/* Brand footer */}
      <div
        className="relative z-10 mt-3 flex shrink-0 items-center justify-center border-t border-white/8 pt-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE}/ChatFPL_AI_Logo.png`}
          alt="ChatFPL AI"
          width={120}
          height={120}
          className="h-[48px] w-auto object-contain opacity-90"
        />
      </div>
    </div>
  );
}
