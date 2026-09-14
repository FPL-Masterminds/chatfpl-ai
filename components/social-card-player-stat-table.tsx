import type { SocialCardStat } from "@/lib/social-card";

export function SocialCardPlayerStatTable({
  stats,
  compact = false,
}: {
  stats: SocialCardStat[];
  compact?: boolean;
}) {
  if (stats.length === 0) return null;

  const rowPy = compact ? "py-[9px]" : "py-[11px]";
  const valueSize = compact ? "text-[15px]" : "text-[16px]";

  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(0,255,135,0.22)", background: "rgba(0,255,135,0.03)" }}
    >
      <table className="w-full table-fixed">
        <tbody>
          {stats.map((stat, idx) => (
            <tr
              key={stat.label}
              style={{
                borderBottom:
                  idx < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              <td className={`px-3 ${rowPy} align-middle`} style={{ width: "58%" }}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
                  {stat.label}
                </span>
              </td>
              <td className={`px-3 ${rowPy} align-middle text-right`}>
                <span className={`${valueSize} font-bold tabular-nums text-white`}>{stat.value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
