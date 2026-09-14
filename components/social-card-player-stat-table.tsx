import type { SocialCardStat } from "@/lib/social-card";

export function SocialCardPlayerStatTable({
  stats,
  fill = false,
}: {
  stats: SocialCardStat[];
  fill?: boolean;
}) {
  if (stats.length === 0) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl ${fill ? "flex h-full min-h-0 flex-col" : ""}`}
      style={{ border: "1px solid rgba(0,255,135,0.22)", background: "rgba(0,255,135,0.03)" }}
    >
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`flex items-center px-5 ${fill ? "min-h-0 flex-1" : "py-[15px]"}`}
          style={{
            borderBottom:
              idx < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
          }}
        >
          <span
            className="min-w-0 flex-1 pr-4 text-[20px] font-bold uppercase tracking-[0.06em] text-white/85"
          >
            {stat.label}
          </span>
          <span className="shrink-0 text-[30px] font-bold tabular-nums text-white">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
