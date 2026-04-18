import { NextResponse } from "next/server"

const STAT_DEFS = [
  {
    id: "transfers-in",
    title: "Most Transferred In",
    accent: "emerald",
    sort: (a: any, b: any) => b.transfers_in_event - a.transfers_in_event,
    value: (p: any) => `+${Number(p.transfers_in_event).toLocaleString()}`,
  },
  {
    id: "transfers-out",
    title: "Most Transferred Out",
    accent: "red",
    sort: (a: any, b: any) => b.transfers_out_event - a.transfers_out_event,
    value: (p: any) => `-${Number(p.transfers_out_event).toLocaleString()}`,
  },
  {
    id: "price-rises",
    title: "Biggest Price Rises",
    accent: "emerald",
    sort: (a: any, b: any) => b.cost_change_event - a.cost_change_event,
    value: (p: any) => `+£${(p.cost_change_event / 10).toFixed(1)}m`,
  },
  {
    id: "points",
    title: "Top Points Scorers",
    accent: "cyan",
    sort: (a: any, b: any) => b.total_points - a.total_points,
    value: (p: any) => `${p.total_points}pts`,
  },
  {
    id: "bonus",
    title: "Most Bonus Points",
    accent: "yellow",
    sort: (a: any, b: any) => b.bonus - a.bonus,
    value: (p: any) => `${p.bonus} bonus`,
  },
  {
    id: "selected",
    title: "Most Selected",
    accent: "purple",
    sort: (a: any, b: any) =>
      parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent),
    value: (p: any) => `${p.selected_by_percent}%`,
  },
]

export async function GET() {
  try {
    const fplRes = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { next: { revalidate: 300 } }
    )
    if (!fplRes.ok) throw new Error("FPL API error")
    const data = await fplRes.json()

    if (!data?.elements || !data?.teams) throw new Error("FPL API returned incomplete data")

    const nextGW =
      data.events?.find((e: any) => e.is_next) ||
      data.events?.find((e: any) => e.is_current)

    // Pick 2 random stat panels
    const shuffled = [...STAT_DEFS].sort(() => Math.random() - 0.5).slice(0, 2)

    const stats = shuffled.map((def) => ({
      id: def.id,
      title: def.title,
      accent: def.accent,
      players: [...data.elements]
        .filter((p: any) => def.id.includes("price") ? Math.abs(p.cost_change_event) > 0 : true)
        .sort(def.sort)
        .slice(0, 3)
        .map((p: any) => {
          const team = data.teams?.find((t: any) => t.id === p.team)
          return {
            name: p.web_name,
            team: team?.short_name || "",
            teamCode: team?.code || 0,
            value: def.value(p),
          }
        }),
    }))

    // Injury / availability news — shuffle so each page load gives a fresh order
    const injuries = data.elements
      .filter((p: any) => p.news && p.news.trim() !== "")
      .map((p: any) => {
        const team = data.teams?.find((t: any) => t.id === p.team)
        return {
          name: p.web_name,
          news: p.news,
          teamCode: team?.code || 0,
          team: team?.short_name || "",
        }
      })
      .sort(() => Math.random() - 0.5)

    return NextResponse.json({
      gameweek: nextGW?.name || "Upcoming Gameweek",
      deadline: nextGW?.deadline_time || null,
      stats,
      injuries,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to load FPL data" },
      { status: 500 }
    )
  }
}
