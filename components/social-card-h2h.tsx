import Image from "next/image";
import type { SocialCardPlayer, SocialCardTableCol, SocialCardTableRow } from "@/lib/social-card";
import { SocialCardStatTable } from "@/components/social-card-stat-table";

const PL_PHOTO_W = 110;
const PL_PHOTO_H = 140;

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

function H2HPlayerColumn({ player }: { player: SocialCardPlayer }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div
        className="relative flex items-end justify-center overflow-hidden"
        style={{ height: 300 }}
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
          className="pointer-events-none absolute bottom-0 left-6 right-6"
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)",
          }}
        />
      </div>

      <div
        className="mx-auto mt-3 flex w-full max-w-[92%] items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-center"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Image
          src={badgeUrl(player.teamCode)}
          alt={player.teamShort}
          width={32}
          height={32}
          className="shrink-0 object-contain"
          unoptimized
        />
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight text-white">{player.displayName}</p>
          <p className="mt-0.5 text-[13px] text-white/50">
            {player.teamShort} · {player.position} · {player.price}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SocialCardHeadToHead({
  players,
  tableCols,
  tableRows,
}: {
  players: SocialCardPlayer[];
  tableCols: SocialCardTableCol[];
  tableRows: SocialCardTableRow[];
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full grid-cols-2 gap-8">
        <H2HPlayerColumn player={players[0]} />
        <H2HPlayerColumn player={players[1]} />
      </div>

      <SocialCardStatTable cols={tableCols} rows={tableRows} />
    </div>
  );
}
