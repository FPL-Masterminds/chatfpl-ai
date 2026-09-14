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
  compact = false,
}: {
  cols: SocialCardTableCol[];
  rows: SocialCardTableRow[];
  compact?: boolean;
}) {
  const dual = rows.length > 1;
  const headCls = "px-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/70";
  const nameCls = "text-[14px] font-bold";
  const subCls = "text-[10px]";
  const statCls = "text-[13px] font-bold";
  const photoW = 44;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(0,255,135,0.2)", background: "rgba(0,255,135,0.03)" }}
    >
      <table className="w-full table-fixed">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {!compact && <th className={`text-center w-[56px] ${headCls}`}>Photo</th>}
            <th className={`text-center ${compact ? "w-[100px]" : "w-[110px]"} ${headCls}`}>Player</th>
            {cols.map((col) => (
              <th key={col.key} className={`text-center whitespace-nowrap ${headCls}`}>
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
              {!compact && (
                <td className="px-1 py-1.5 text-center" style={{ background: "#020a05" }}>
                  <div className="mx-auto flex flex-col items-center" style={{ width: photoW }}>
                    <Image
                      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${row.code}.png`}
                      alt={row.webName}
                      width={photoW}
                      height={Math.round(photoW * 1.25)}
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  </div>
                </td>
              )}
              <td className="px-1.5 py-1.5 text-center">
                <p className={`leading-tight text-white whitespace-nowrap ${nameCls}`}>
                  {row.webName}
                </p>
                <p className={`text-white/70 whitespace-nowrap ${subCls}`}>
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
                  <td key={col.key} className="px-1 py-1.5 text-center">
                    <span
                      className={`tabular-nums ${statCls}`}
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
