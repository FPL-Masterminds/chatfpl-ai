import Image from "next/image";
import type { SocialCardPlayer } from "@/lib/social-card";

const GREEN = "#00FF87";
const CYAN = "#00FFFF";

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

export function SocialCardPlayerHero({
  player,
  size = "large",
  highlightStats,
}: {
  player: SocialCardPlayer;
  size?: "large" | "medium";
  highlightStats?: { label: string; value: string; accent?: boolean }[];
}) {
  const cardW = size === "large" ? 300 : 210;
  const cardH = size === "large" ? 340 : 250;
  const photoW = size === "large" ? 220 : 150;

  return (
    <div className="relative mx-auto" style={{ width: cardW, height: cardH + photoW * 0.45 }}>
      {/* Photo */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ bottom: cardH - 30, width: photoW }}
      >
        <div
          className="mx-auto rounded-full"
          style={{
            width: photoW * 0.55,
            height: 14,
            marginBottom: -6,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 80%)",
            filter: "blur(4px)",
          }}
        />
        <Image
          src={player.photoUrl}
          alt={player.displayName}
          width={photoW}
          height={Math.round(photoW * 1.25)}
          className="mx-auto h-auto w-full object-contain"
          style={{ filter: "drop-shadow(0 20px 40px rgba(0,255,133,0.35))" }}
          unoptimized
        />
        <div
          style={{
            height: 2,
            width: "100%",
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.75) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 70%, transparent)",
            boxShadow: "0 0 12px 3px rgba(255,255,255,0.35)",
          }}
        />
      </div>

      {/* Card */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden rounded-[24px]"
        style={{
          height: cardH,
          background: "linear-gradient(145deg, rgba(0,20,16,0.96) 0%, rgba(0,10,20,0.98) 100%)",
          boxShadow: "0 0 56px rgba(0,255,133,0.2), 0 28px 56px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ height: 4, background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 25%, rgba(0,255,133,0.1) 0%, transparent 65%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-24">
          <div className="flex items-center justify-between">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: GREEN, background: `${GREEN}18`, border: `1px solid ${GREEN}44` }}
            >
              {player.position}
            </span>
            <Image
              src={badgeUrl(player.teamCode)}
              alt={player.teamShort}
              width={size === "large" ? 40 : 32}
              height={size === "large" ? 40 : 32}
              className="object-contain"
              unoptimized
            />
          </div>

          <p
            className="mt-3 font-bold leading-[1.05] tracking-tight text-white"
            style={{ fontSize: size === "large" ? 32 : 22 }}
          >
            {player.displayName}
          </p>
          <p className="mt-1 text-[15px] font-medium text-white/50">{player.price}</p>

          {highlightStats && highlightStats.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {highlightStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md px-2 py-2 text-center"
                  style={{ background: "#1A1A1A" }}
                >
                  <p
                    className="text-[18px] font-bold tabular-nums leading-none"
                    style={{ color: s.accent ? GREEN : "rgba(255,255,255,0.92)" }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-white/70">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Glow border */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 rounded-[24px]"
        style={{
          height: cardH,
          padding: 1,
          background: `linear-gradient(135deg, ${GREEN}, rgba(255,255,255,0.1), ${CYAN}, ${GREEN})`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          zIndex: 5,
        }}
      />
    </div>
  );
}
