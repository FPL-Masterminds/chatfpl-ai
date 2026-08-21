import { NextResponse } from "next/server";

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      headers: { "User-Agent": "ChatFPL/1.0" },
      next: { revalidate: 900 },
    });

    if (!res.ok) throw new Error("FPL API unavailable");

    const data = await res.json();

    const teamMap: Record<number, string> = {};
    const teamCodeMap: Record<number, number> = {};
    (data.teams ?? []).forEach((t: any) => { teamMap[t.id] = t.name; teamCodeMap[t.id] = t.code; });

    const posMap: Record<number, string> = {};
    (data.element_types ?? []).forEach((pt: any) => { posMap[pt.id] = pt.singular_name_short; });

    // Base pool: available players. Historically we required minutes > 300
    // and total_points >= 40, but those thresholds kill the whole endpoint
    // in the first few weeks of a season when nobody has accumulated stats.
    const availableAll = (data.elements ?? []).filter(
      (p: any) =>
        p.status !== "u" &&
        p.status !== "s" &&
        parseFloat(p.selected_by_percent) >= 1.0
    );

    const anyMidseason = availableAll.some((p: any) => p.minutes > 500);

    const active = anyMidseason
      ? availableAll.filter((p: any) => p.minutes > 300 && p.total_points >= 40)
      : availableAll;

    const toPlayer = (p: any) => ({
      id: p.id,
      code: p.code,
      name: p.web_name,
      full_name: `${p.first_name} ${p.second_name}`,
      team: teamMap[p.team] ?? "",
      pos: posMap[p.element_type] ?? "",
      price: (p.now_cost / 10).toFixed(1),
      ownership: p.selected_by_percent,
      form: p.form,
      ep_next: p.ep_next ?? "0.0",
      goals: p.goals_scored,
      assists: p.assists,
      total_points: p.total_points,
      photo_url: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${p.code}.png`,
      photo_fallback: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${p.code}.png`,
      badge_url: `https://resources.premierleague.com/premierleague/badges/70/t${teamCodeMap[p.team]}.png`,
      news: p.news ?? "",
    });

    // Preseason ranker: use FPL's own ep_next projection and community ownership.
    const preRank = (p: any) =>
      parseFloat(p.ep_next || "0") * 20 + parseFloat(p.selected_by_percent || "0");

    const topForm = anyMidseason
      ? [...active].filter((p: any) => parseFloat(p.form) >= 6.0)
          .sort((a: any, b: any) => parseFloat(b.form) - parseFloat(a.form))
          .slice(0, 5)
      : [...active].sort((a: any, b: any) => preRank(b) - preRank(a)).slice(0, 5);

    const topPts = anyMidseason
      ? [...active].filter((p: any) => parseFloat(p.form) >= 4.5)
          .sort((a: any, b: any) => b.total_points - a.total_points)
          .slice(0, 5)
      : [...active]
          .sort((a: any, b: any) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
          .slice(0, 5);

    const differentials = [...active]
      .filter((p: any) => {
        const own = parseFloat(p.selected_by_percent);
        return own >= 2.0 && own < 20 && (anyMidseason ? parseFloat(p.form) >= 5.5 : parseFloat(p.ep_next || "0") >= 3.0);
      })
      .sort((a: any, b: any) =>
        anyMidseason ? parseFloat(b.form) - parseFloat(a.form) : preRank(b) - preRank(a)
      )
      .slice(0, 4);

    const risers = [...active]
      .filter((p: any) => p.cost_change_event > 0 && (anyMidseason ? parseFloat(p.form) >= 5.0 : true))
      .sort((a: any, b: any) => b.cost_change_event - a.cost_change_event)
      .slice(0, 3);

    // Merge pools, deduplicate, cap at 8
    const seen = new Set<number>();
    const merged: any[] = [];
    for (const p of [...topForm.slice(0,2), ...topPts.slice(0,2), ...differentials.slice(0,2), ...risers.slice(0,2), ...topForm, ...topPts]) {
      if (!seen.has(p.id) && merged.length < 8) {
        seen.add(p.id);
        merged.push(p);
      }
    }

    // Shuffle so order varies between requests
    for (let i = merged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }

    const players = merged.map(toPlayer);
    return NextResponse.json({ players });
  } catch (err) {
    console.error("query-players error:", err);
    return NextResponse.json({ players: [] }, { status: 500 });
  }
}
