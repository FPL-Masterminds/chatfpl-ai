import Image from "next/image";
import type { FixtureGW } from "@/lib/fpl-fixtures";
import { SocialCardFixtureStrip } from "@/components/social-card-fixture-strip";
import { SocialCardPlayerStatTable } from "@/components/social-card-player-stat-table";
import type { SocialCardPlayer, SocialCardStat } from "@/lib/social-card";

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

/** FPL cutout assets are 110x140 (11:14). Scale by height, never stretch. */
const PL_PHOTO_W = 110;
const PL_PHOTO_H = 140;

function PlayerPortrait({ player, compact = false }: { player: SocialCardPlayer; compact?: boolean }) {
  const nameBlockH = compact ? 64 : 76;
  const badgeSize = compact ? 28 : 36;

  return (
    <div className={`relative h-full w-full ${compact ? "flex-1" : ""}`}>
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden px-1"
        style={{ bottom: nameBlockH }}
      >
        <Image
          src={player.photoUrl}
          alt={player.displayName}
          width={PL_PHOTO_W}
          height={PL_PHOTO_H}
          className="h-full w-auto max-w-full object-contain object-bottom"
          style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.55))" }}
          unoptimized
        />
        <div
          className="pointer-events-none absolute bottom-0 left-4 right-4"
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2.5 px-2"
        style={{ height: nameBlockH }}
      >
        <Image
          src={badgeUrl(player.teamCode)}
          alt={player.teamShort}
          width={badgeSize}
          height={badgeSize}
          className="shrink-0 object-contain"
          unoptimized
        />
        <div className="min-w-0 text-left">
          <p className={`font-bold leading-tight text-white ${compact ? "text-[16px]" : "text-[22px]"}`}>
            {player.displayName}
          </p>
          <p className={`mt-0.5 text-white/50 ${compact ? "text-[12px]" : "text-[15px]"}`}>
            {player.teamShort} · {player.position} · {player.price}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SocialCardSplitPane({
  players,
  dual,
  prompt,
  stats,
  fixtures,
}: {
  players: SocialCardPlayer[];
  dual: boolean;
  prompt: string;
  stats: SocialCardStat[];
  fixtures?: FixtureGW[];
}) {
  const hasFixtures = Boolean(fixtures?.length);
  const paneHeight = hasFixtures ? 580 : 560;

  return (
    <div
      className="grid w-full gap-5"
      style={{ gridTemplateColumns: "46fr 54fr", height: paneHeight }}
    >
      {/* Left: player portrait(s) */}
      <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-black/35">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="relative h-full px-2 pb-3 pt-1">
          {dual ? (
            <div className="flex h-full items-end justify-center gap-3">
              <PlayerPortrait player={players[0]} compact />
              <span
                className="pb-24 text-[26px] font-black tracking-widest text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to bottom,#00FF87,#00FFFF)",
                  WebkitBackgroundClip: "text",
                }}
              >
                VS
              </span>
              <PlayerPortrait player={players[1]} compact />
            </div>
          ) : (
            <PlayerPortrait player={players[0]} />
          )}
        </div>
      </div>

      {/* Right: prompt + stat table */}
      <div className={`flex min-w-0 flex-col py-1 ${hasFixtures ? "gap-3" : "gap-4"}`}>
        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(0,255,135,0.1)",
              color: "#00FF87",
              border: "1px solid rgba(0,255,135,0.25)",
            }}
          >
            Ask ChatFPL AI
          </span>
          <p className="mt-3 text-[28px] font-medium leading-snug text-white">{prompt}</p>
        </div>

        <SocialCardPlayerStatTable stats={stats} compact={hasFixtures} />

        {hasFixtures ? <SocialCardFixtureStrip fixtures={fixtures!} /> : null}
      </div>
    </div>
  );
}
