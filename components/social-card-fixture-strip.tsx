import Image from "next/image";
import type { FixtureGW } from "@/lib/fpl-fixtures";

const GREEN = "#00FF87";

function FdrDots({ fdr }: { fdr: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 9,
            height: 9,
            background: i <= fdr ? GREEN : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </span>
  );
}

function FixtureCard({ fix }: { fix: FixtureGW }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg"
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.12)",
        padding: "10px 4px 8px",
      }}
    >
      <span className="text-[14px] font-bold tabular-nums text-white">GW{fix.gw}</span>
      {fix.opponentCode > 0 && (
        <Image
          src={`https://resources.premierleague.com/premierleague/badges/70/t${fix.opponentCode}.png`}
          alt={fix.opponentShort}
          width={40}
          height={40}
          className="h-[40px] w-auto object-contain"
          unoptimized
        />
      )}
      <span className="text-[15px] font-bold leading-none text-white">{fix.isHome ? "H" : "A"}</span>
      <FdrDots fdr={fix.fdr} />
    </div>
  );
}

export function SocialCardFixtureStrip({ fixtures }: { fixtures: FixtureGW[] }) {
  const run = fixtures.slice(0, 5);
  if (run.length === 0) return null;

  return (
    <div className="flex w-full gap-2">
      {run.map((fix) => (
        <FixtureCard key={`${fix.gw}-${fix.opponentShort}`} fix={fix} />
      ))}
    </div>
  );
}
