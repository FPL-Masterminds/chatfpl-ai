import type { CSSProperties } from "react";
import type { SocialCardTableCol, SocialCardTableRow } from "@/lib/social-card";

const WIN_STYLE: CSSProperties = {
  backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function cellWins(
  col: SocialCardTableCol,
  row: SocialCardTableRow,
  other: SocialCardTableRow,
): boolean {
  const a = row.nums[col.key];
  const b = other.nums[col.key];
  if (typeof a !== "number" || typeof b !== "number" || a === b) return false;
  return col.higherIsBetter ? a > b : a < b;
}

export function SocialCardStatTable({
  cols,
  rows,
}: {
  cols: SocialCardTableCol[];
  rows: SocialCardTableRow[];
}) {
  if (rows.length < 2) return null;
  const [rowA, rowB] = rows;

  return (
    <div
      className="w-full overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(0,255,135,0.22)", background: "rgba(0,255,135,0.03)" }}
    >
      <table className="w-full table-fixed text-center">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <th
              className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65"
              style={{ width: "18%" }}
            >
              Player
            </th>
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-1 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[rowA, rowB].map((row, rowIdx) => {
            const other = rowIdx === 0 ? rowB : rowA;
            return (
              <tr
                key={row.code}
                style={{
                  borderBottom: rowIdx === 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                }}
              >
                <td className="px-2 py-2.5">
                  <p className="text-[15px] font-bold leading-tight text-white">{row.webName}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {row.position} · {row.club}
                  </p>
                </td>
                {cols.map((col) => {
                  const wins = cellWins(col, row, other);
                  const value = row.display[col.key] ?? "";
                  return (
                    <td key={col.key} className="px-1 py-2.5">
                      <span
                        className="text-[15px] font-bold tabular-nums"
                        style={wins ? WIN_STYLE : { color: "rgba(255,255,255,0.88)" }}
                      >
                        {value}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
