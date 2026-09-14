import Image from "next/image";
import type { SocialCardPlayer } from "@/lib/social-card";

const GREEN = "#00FF87";
const CYAN = "#00FFFF";
const PILL_COLOR = "#00FF85";

/** Same proportions as fpl-player-hero / player-carousel, scaled for 1080 canvas. */
const SCALE = 1.55;
const CARD_W = Math.round(220 * SCALE);
const CARD_H = Math.round(310 * SCALE);
const PHOTO_W = Math.round(130 * SCALE);
const PHOTO_BOTTOM = Math.round(148 * SCALE);

const DUAL_SCALE = 1.05;
const DUAL_CARD_W = Math.round(220 * DUAL_SCALE);
const DUAL_CARD_H = Math.round(310 * DUAL_SCALE);
const DUAL_PHOTO_W = Math.round(130 * DUAL_SCALE);
const DUAL_PHOTO_BOTTOM = Math.round(148 * DUAL_SCALE);

function badgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

function PlayerPhoto({
  src,
  alt,
  width,
  glow = true,
}: {
  src: string;
  alt: string;
  width: number;
  glow?: boolean;
}) {
  return (
    <>
      <div
        className="mx-auto rounded-full"
        style={{
          width: Math.round(width * 0.54),
          height: 12,
          marginBottom: -6,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 80%)",
          filter: "blur(4px)",
        }}
      />
      <Image
        src={src}
        alt={alt}
        width={width}
        height={Math.round(width * 1.28)}
        className="mx-auto block h-auto w-full object-contain"
        style={{
          filter: glow
            ? "drop-shadow(0 8px 20px rgba(0,255,133,0.25))"
            : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
        }}
        unoptimized
      />
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
          boxShadow: glow ? "0 0 8px 2px rgba(255,255,255,0.35)" : undefined,
        }}
      />
    </>
  );
}

export function SocialCardPlayerHero({
  player,
  highlightStats,
}: {
  player: SocialCardPlayer;
  highlightStats?: { label: string; value: string; accent?: boolean }[];
}) {
  return (
    <div className="relative mx-auto" style={{ width: CARD_W, height: CARD_H }}>
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ bottom: PHOTO_BOTTOM, width: PHOTO_W }}
      >
        <PlayerPhoto src={player.photoUrl} alt={player.displayName} width={PHOTO_W} />
      </div>

      <div
        className="absolute inset-0 overflow-hidden rounded-[20px]"
        style={{
          background: "linear-gradient(145deg, rgba(0,20,16,0.95) 0%, rgba(0,10,20,0.98) 100%)",
          boxShadow:
            "0 0 40px rgba(0,255,133,0.15), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,133,0.06) 0%, transparent 65%)",
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent)" }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: PILL_COLOR, background: `${PILL_COLOR}18`, border: `1px solid ${PILL_COLOR}40` }}
            >
              {player.position}
            </span>
            <Image
              src={badgeUrl(player.teamCode)}
              alt={player.teamShort}
              width={28}
              height={28}
              className="object-contain opacity-90"
              unoptimized
            />
          </div>

          <p className="text-[17px] font-bold leading-[1.1] tracking-tight text-white">
            {player.displayName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-white/45">{player.price}</p>

          {highlightStats && highlightStats.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {highlightStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md px-1.5 py-2 text-center"
                  style={{ background: "#1A1A1A" }}
                >
                  <p
                    className="text-[15px] font-bold tabular-nums leading-none"
                    style={{ color: s.accent ? GREEN : "rgba(255,255,255,0.92)" }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-white/70">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        style={{
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

/** Dual layout: scaled-down carousel card per player. */
export function SocialCardPlayerPhoto({
  player,
}: {
  player: SocialCardPlayer;
}) {
  return (
    <div className="relative mx-auto" style={{ width: DUAL_CARD_W, height: DUAL_CARD_H }}>
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ bottom: DUAL_PHOTO_BOTTOM, width: DUAL_PHOTO_W }}
      >
        <PlayerPhoto src={player.photoUrl} alt={player.displayName} width={DUAL_PHOTO_W} />
      </div>

      <div
        className="absolute inset-0 overflow-hidden rounded-[20px]"
        style={{
          background: "linear-gradient(145deg, rgba(0,20,16,0.95) 0%, rgba(0,10,20,0.98) 100%)",
          boxShadow: "0 0 32px rgba(0,255,133,0.12), 0 16px 32px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(to right, ${GREEN}, ${CYAN})` }} />
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent)" }}
        >
          <p className="text-[13px] font-bold leading-tight tracking-tight text-white">
            {player.displayName}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-white/45">{player.price}</p>
        </div>
      </div>
    </div>
  );
}
