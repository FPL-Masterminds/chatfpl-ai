import Image from "next/image";
import type { SocialCardPlayer, SocialCardStat } from "@/lib/social-card";

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

function PlayerPortrait({ player, compact = false }: { player: SocialCardPlayer; compact?: boolean }) {
  const maxH = compact ? 280 : 400;

  return (
    <div className={`flex flex-col items-center ${compact ? "flex-1" : "h-full w-full"}`}>
      <div
        className="relative flex flex-1 items-end justify-center w-full"
        style={{ minHeight: compact ? 220 : 360 }}
      >
        <Image
          src={player.photoUrl}
          alt={player.displayName}
          width={compact ? 160 : 280}
          height={Math.round((compact ? 160 : 280) * 1.28)}
          className="h-auto w-auto object-contain object-bottom"
          style={{ maxHeight: maxH, filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.55))" }}
          unoptimized
        />
        <div
          className="pointer-events-none absolute bottom-0 left-6 right-6"
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
          }}
        />
      </div>
      <div className="mt-4 text-center px-2">
        <p className={`font-bold leading-tight text-white ${compact ? "text-[15px]" : "text-[20px]"}`}>
          {player.displayName}
        </p>
        <p className={`mt-1 text-white/50 ${compact ? "text-[11px]" : "text-[14px]"}`}>
          {player.teamShort} · {player.position} · {player.price}
        </p>
      </div>
    </div>
  );
}

function StatBoxes({ stats }: { stats: SocialCardStat[] }) {
  const cols = stats.length <= 4 ? 2 : 3;

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl px-3 py-2.5"
          style={{ background: "linear-gradient(135deg,#00ff85,#02efff)" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "#00190D" }}>
            {stat.label}
          </p>
          <p className="mt-0.5 text-[15px] font-bold leading-tight" style={{ color: "rgba(0,0,0,0.88)" }}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SocialCardSplitPane({
  players,
  dual,
  prompt,
  stats,
}: {
  players: SocialCardPlayer[];
  dual: boolean;
  prompt: string;
  stats: SocialCardStat[];
}) {
  return (
    <div className="flex gap-5" style={{ height: 500 }}>
      {/* Left: player portrait(s) */}
      <div className="relative flex w-[46%] flex-col overflow-hidden rounded-3xl bg-black/35">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col px-4 pb-6 pt-4">
          {dual ? (
            <div className="flex h-full items-end justify-center gap-3">
              <PlayerPortrait player={players[0]} compact />
              <span
                className="pb-24 text-[22px] font-black tracking-widest text-transparent bg-clip-text"
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

      {/* Right: prompt + stat boxes */}
      <div className="flex w-[54%] flex-col justify-between py-1">
        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(0,255,135,0.1)",
              color: "#00FF87",
              border: "1px solid rgba(0,255,135,0.25)",
            }}
          >
            Ask ChatFPL AI
          </span>
          <p className="mt-4 text-[22px] font-medium leading-snug text-white">{prompt}</p>
        </div>

        <StatBoxes stats={stats} />

        {!dual && players[0] && (
          <div className="flex items-center gap-3 border-t border-white/8 pt-4">
            <Image
              src={badgeUrl(players[0].teamCode)}
              alt={players[0].teamShort}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
            <div>
              <p className="text-[15px] font-bold leading-tight text-white">{players[0].displayName}</p>
              <p className="text-[13px] text-white/40">{players[0].teamShort}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
