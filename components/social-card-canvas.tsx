import type { SocialCardData } from "@/lib/social-card";
import { SocialCardBackground } from "@/components/social-card-background";
import { SocialCardFooter } from "@/components/social-card-footer";
import { SocialCardHeadToHead } from "@/components/social-card-h2h";
import { SocialCardSplitPane } from "@/components/social-card-split-pane";

const SITE = "https://www.chatfpl.ai";

export function SocialCardCanvas({ card }: { card: SocialCardData }) {
  const dual = card.layout === "dual";
  const isDualTable = card.hub === "comparisons" || card.hub === "transfer_trends";

  return (
    <div
      id="social-card-canvas"
      className="relative box-border flex w-[1080px] min-w-[1080px] max-w-[1080px] flex-col overflow-hidden bg-black text-white antialiased"
      style={{ height: 1080, padding: "32px 40px 24px" }}
    >
      <SocialCardBackground />

      {/* Headline */}
      <div className="relative z-10 mb-4 flex w-full shrink-0 items-center justify-center px-2 text-center">
        <h1
          className="font-bold leading-[1.08] tracking-tighter text-white"
          style={{ fontSize: isDualTable ? 44 : dual ? 52 : 62 }}
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

      {/* Player content */}
      <div className="relative z-10 w-full shrink-0">
        {isDualTable ? (
          <SocialCardHeadToHead
            players={card.players}
            tableCols={card.tableCols}
            tableRows={card.tableRows}
          />
        ) : (
          <SocialCardSplitPane
            players={card.players}
            dual={dual}
            prompt={card.prompt}
            stats={card.stats}
            fixtures={card.fixtures ?? []}
          />
        )}
      </div>

      {/* Edge-style commentary card */}
      <div className="relative z-10 mt-4 w-full shrink-0">
        <SocialCardFooter
          tag={card.footerTag}
          title={card.footerTitle}
          paragraph={card.paragraph}
        />
      </div>

      {/* Brand watermark */}
      <div className="pointer-events-none absolute bottom-6 right-6 z-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE}/ChatFPL_AI_Logo.png`}
          alt="ChatFPL AI"
          width={120}
          height={120}
          className="h-[12px] w-auto object-contain opacity-80"
        />
      </div>
    </div>
  );
}
