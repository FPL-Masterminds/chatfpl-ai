import Image from "next/image";
import type { FixtureGW } from "@/lib/fpl-fixtures";
import { SocialCardFixtureStrip } from "@/components/social-card-fixture-strip";
import { SocialCardPlayerStatTable } from "@/components/social-card-player-stat-table";
import type { SocialCardPlayer, SocialCardStat } from "@/lib/social-card";

const PL_PHOTO_W = 110;
const PL_PHOTO_H = 140;
const NAME_BLOCK_H = 76;

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

function PlayerNameBlock({ player, compact = false }: { player: SocialCardPlayer; compact?: boolean }) {
  const badgeSize = compact ? 28 : 36;

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2.5 px-2 text-center"
      style={{ height: compact ? 64 : NAME_BLOCK_H }}
    >
      <Image
        src={badgeUrl(player.teamCode)}
        alt={player.teamShort}
        width={badgeSize}
        height={badgeSize}
        className="shrink-0 object-contain"
        unoptimized
      />
      <div className="min-w-0">
        <p className={`font-bold leading-tight text-white ${compact ? "text-[16px]" : "text-[22px]"}`}>
          {player.displayName}
        </p>
        <p className={`mt-0.5 text-white/50 ${compact ? "text-[12px]" : "text-[15px]"}`}>
          {player.teamShort} · {player.position} · {player.price}
        </p>
      </div>
    </div>
  );
}

function PlayerPhoto({ player, compact = false }: { player: SocialCardPlayer; compact?: boolean }) {
  return (
    <div className="relative flex h-full min-h-0 items-end justify-center overflow-hidden px-1">
      <Image
        src={player.photoUrl}
        alt={player.displayName}
        width={compact ? 180 : PL_PHOTO_W}
        height={compact ? 230 : PL_PHOTO_H}
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
  );
}

function SinglePlayerColumn({ player }: { player: SocialCardPlayer }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <PlayerPhoto player={player} />
      </div>
      <PlayerNameBlock player={player} />
    </div>
  );
}

export function SocialCardSplitPane({
  players,
  dual,
  prompt,
  stats,
  fixtures = [],
}: {
  players: SocialCardPlayer[];
  dual: boolean;
  prompt: string;
  stats: SocialCardStat[];
  fixtures?: FixtureGW[];
}) {
  const showFixtures = !dual && fixtures.length > 0;

  return (
    <div
      className="grid w-full gap-5"
      style={{ gridTemplateColumns: "46fr 54fr", height: 560 }}
    >
      {/* Left: player portrait(s) */}
      <div className="relative flex min-h-0 flex-col overflow-hidden rounded-3xl bg-black/35">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="relative h-full min-h-0 px-2 pb-3 pt-1">
          {dual ? (
            <div className="flex h-full items-end justify-center gap-3">
              <div className="flex h-full min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1">
                  <PlayerPhoto player={players[0]} compact />
                </div>
                <PlayerNameBlock player={players[0]} compact />
              </div>
              <span
                className="pb-24 text-[26px] font-black tracking-widest text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to bottom,#00FF87,#00FFFF)",
                  WebkitBackgroundClip: "text",
                }}
              >
                VS
              </span>
              <div className="flex h-full min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1">
                  <PlayerPhoto player={players[1]} compact />
                </div>
                <PlayerNameBlock player={players[1]} compact />
              </div>
            </div>
          ) : (
            <SinglePlayerColumn player={players[0]} />
          )}
        </div>
      </div>

      {/* Right: prompt + stat table + fixtures */}
      <div className="flex h-full min-h-0 flex-col pb-3">
        <div className="shrink-0">
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

        <div className="mt-4 min-h-0 flex-1">
          <SocialCardPlayerStatTable stats={stats} fill />
        </div>

        {showFixtures ? (
          <div className="shrink-0 pt-3">
            <SocialCardFixtureStrip fixtures={fixtures} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
