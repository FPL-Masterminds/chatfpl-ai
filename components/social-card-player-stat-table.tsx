import type { SocialCardStat } from "@/lib/social-card";

export function SocialCardPlayerStatTable({
  stats,
  compact = false,
}: {
  stats: SocialCardStat[];
  compact?: boolean;
}) {
  if (stats.length === 0) return null;

  return (
    <div
      className="w-full rounded-2xl"
      style={{ border: "1px solid rgba(0,255,135,0.22)", background: "rgba(0,255,135,0.03)" }}
    >
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`flex shrink-0 items-center px-4 ${compact ? "min-h-[46px] py-2" : "min-h-[52px] py-3"}`}
          style={{
            borderBottom:
              idx < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
          }}
        >
          <span
            className={`min-w-0 flex-1 pr-3 font-bold uppercase leading-tight tracking-[0.06em] text-white/85 ${
              compact ? "text-[16px]" : "text-[18px]"
            }`}
          >
            {stat.label}
          </span>
          <span
            className={`shrink-0 font-bold leading-none tabular-nums text-white ${
              compact ? "text-[22px]" : "text-[26px]"
            }`}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
