import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      headers: { "User-Agent": "ChatFPL/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("FPL API unavailable");

    const data = await res.json();

    const teamMap: Record<number, string> = {};
    const teamCodeMap: Record<number, number> = {};
    (data.teams ?? []).forEach((t: any) => { teamMap[t.id] = t.name; teamCodeMap[t.id] = t.code; });

    const posMap: Record<number, string> = {};
    (data.element_types ?? []).forEach((pt: any) => { posMap[pt.id] = pt.singular_name_short; });

    // Top 6 by ownership — played 200+ mins, available, decent form
    const players = (data.elements ?? [])
      .filter((p: any) => p.minutes > 200 && p.status === "a")
      .sort((a: any, b: any) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 6)
      .map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.web_name,
        full_name: `${p.first_name} ${p.second_name}`,
        team: teamMap[p.team] ?? "",
        pos: posMap[p.element_type] ?? "",
        price: (p.now_cost / 10).toFixed(1),
        ownership: p.selected_by_percent,
        form: p.form,
        ep_next: p.ep_next,
        goals: p.goals_scored,
        assists: p.assists,
        total_points: p.total_points,
        photo_url: `https://resources.premierleague.com/premierleague25/photos/players/250x250/${p.code}.png`,
        photo_fallback: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${p.code}.png`,
        badge_url: `https://resources.premierleague.com/premierleague/badges/70/t${teamCodeMap[p.team]}.png`,
        news: p.news ?? "",
      }));

    return NextResponse.json({ players });
  } catch (err) {
    console.error("query-players error:", err);
    return NextResponse.json({ players: [] }, { status: 500 });
  }
}
