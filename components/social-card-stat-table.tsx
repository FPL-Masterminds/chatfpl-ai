import Image from "next/image";
import type { CSSProperties } from "react";
import type { SocialCardTableCol, SocialCardTableRow } from "@/lib/social-card";

const WIN_STYLE: CSSProperties = {
  backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export function SocialCardStatTable({
  cols,
  rows,
}: {
  cols: SocialCardTableCol[];
  rows: SocialCardTableRow[];
}) {
  const dual = rows.length > 1;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.03)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <th className="px-2 py-2.5 text-center text-[8px] font-semibold uppercase tracking-[0.15em] text-white/70">
              Photo
            </th>
            <th className="px-2 py-2.5 text-center text-[8px] font-semibold uppercase tracking-[0.15em] text-white/70">
              Player
            </th>
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-1.5 py-2.5 text-center text-[8px] font-semibold uppercase tracking-[0.15em] text-white/70 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={`${row.code}-${rowIdx}`}
              style={{
                borderBottom:
                  dual && rowIdx === 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
              }}
            >
              <td className="px-2 py-2 text-center" style={{ background: "#020a05" }}>
                <div className="mx-auto flex flex-col items-center" style={{ width: 48 }}>
                  <Image
                    src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${row.code}.png`}
                    alt={row.webName}
                    width={48}
                    height={60}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                  <div
                    style={{
                      height: 1,
                      width: 48,
                      background:
                        "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
                      boxShadow: "0 0 8px 2px rgba(255,255,255,0.35)",
                    }}
                  />
                </div>
              </td>
              <td className="px-2 py-2 text-center">
                <p className="text-[13px] font-bold leading-tight text-white whitespace-nowrap">
                  {row.webName}
                </p>
                <p className="text-[9px] text-white/70 whitespace-nowrap">
                  {row.position} - {row.club}
                </p>
              </td>
              {cols.map((col) => {
                let wins = false;
                if (dual) {
                  const other = rows[rowIdx === 0 ? 1 : 0];
                  const valNum = row.nums[col.key] ?? 0;
                  const othNum = other.nums[col.key] ?? 0;
                  wins = col.higherIsBetter ? valNum > othNum : valNum < othNum;
                }
                return (
                  <td key={col.key} className="px-1.5 py-2 text-center">
                    <span
                      className="text-[12px] font-bold tabular-nums"
                      style={wins ? WIN_STYLE : { color: "rgba(255,255,255,0.85)" }}
                    >
                      {row.display[col.key] ?? ""}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
