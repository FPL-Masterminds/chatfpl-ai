import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscriptions: { take: 1, orderBy: { id: "desc" } } },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plan = user.subscriptions[0]?.plan?.toLowerCase() || "free";
  if (!["premium", "elite", "vip", "admin"].includes(plan)) {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
  }

  if (!user.fpl_team_id) {
    return NextResponse.json({ error: "no_team_id" }, { status: 400 });
  }

  const teamId = user.fpl_team_id;
  const H = { "User-Agent": "ChatFPL/1.0" };

  try {
    const [bootstrapRes, entryRes, historyRes] = await Promise.all([
      fetch("https://fantasy.premierleague.com/api/bootstrap-static/", { headers: H }),
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`, { headers: H }),
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/history/`, { headers: H }),
    ]);

    if (!bootstrapRes.ok || !entryRes.ok) {
      return NextResponse.json({ error: "FPL API unavailable" }, { status: 502 });
    }

    const bootstrap = await bootstrapRes.json();
    const entry = await entryRes.json();
    const history = historyRes.ok ? await historyRes.json() : null;

    const currentGW = bootstrap.events?.find((e: any) => e.is_current) ?? bootstrap.events?.[bootstrap.events.length - 1];
    const currentGWId: number = currentGW?.id ?? 1;

    // Fetch current GW picks + first private league in parallel
    const privateLeague = (entry.leagues?.classic ?? []).find((l: any) => l.league_type === "x")
      ?? (entry.leagues?.classic ?? [])[0];

    const [picksRes, leagueRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentGWId}/picks/`, { headers: H }),
      privateLeague
        ? fetch(`https://fantasy.premierleague.com/api/leagues-classic/${privateLeague.id}/standings/?page_standings=1`, { headers: H })
        : Promise.resolve(null),
    ]);

    const picksData = picksRes.ok ? await picksRes.json() : null;
    const leagueData = leagueRes?.ok ? await leagueRes.json() : null;

    // Build lookup maps
    const elementMap: Record<number, any> = {};
    const teamMap: Record<number, any> = {};
    const posMap: Record<number, string> = {};
    (bootstrap.elements ?? []).forEach((p: any) => { elementMap[p.id] = p; });
    (bootstrap.teams ?? []).forEach((t: any) => { teamMap[t.id] = t; });
    (bootstrap.element_types ?? []).forEach((pt: any) => { posMap[pt.id] = pt.singular_name_short; });

    // Chip status — history endpoint is the reliable source
    const playedChips: any[] = history?.chips ?? [];
    const usedNames: string[] = playedChips.map((c: any) => c.name);
    const wildcardsUsed = usedNames.filter((n) => n === "wildcard").length;

    const chips = [
      { name: "Wildcard", key: "wildcard", available: wildcardsUsed < 2, event: playedChips.findLast?.((c: any) => c.name === "wildcard")?.event ?? null },
      { name: "Free Hit", key: "freehit", available: !usedNames.includes("freehit"), event: playedChips.find((c: any) => c.name === "freehit")?.event ?? null },
      { name: "Triple Cap", key: "3xc", available: !usedNames.includes("3xc"), event: playedChips.find((c: any) => c.name === "3xc")?.event ?? null },
      { name: "Bench Boost", key: "bboost", available: !usedNames.includes("bboost"), event: playedChips.find((c: any) => c.name === "bboost")?.event ?? null },
    ];

    // Squad
    const squad = (picksData?.picks ?? []).map((pick: any) => {
      const p = elementMap[pick.element];
      if (!p) return null;
      const t = teamMap[p.team];
      return {
        slot: pick.position,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier,
        name: p.web_name,
        team_short: t?.short_name ?? "",
        team_code: t?.code ?? 0,
        pos: posMap[p.element_type] ?? "",
        price: p.now_cost / 10,
        form: parseFloat(p.form ?? "0"),
        points: p.total_points,
        ep_next: parseFloat(p.ep_next ?? "0"),
        chance: p.chance_of_playing_next_round ?? 100,
        news: p.news ?? "",
        photo_url: `https://resources.premierleague.com/premierleague25/photos/players/110x140/p${p.code}.png`,
      };
    }).filter(Boolean);

    // GW-by-GW history with averages
    const gwHistory = (history?.current ?? []).map((gw: any) => {
      const ev = bootstrap.events?.find((e: any) => e.id === gw.event);
      return {
        gw: gw.event,
        pts: gw.points,
        avg: ev?.average_entry_score ?? 0,
        rank: gw.overall_rank,
      };
    });

    // Mini-league standings (top 20, user highlighted)
    const leagueStandings = (leagueData?.standings?.results ?? []).slice(0, 20).map((s: any) => ({
      rank: s.rank,
      last_rank: s.last_rank,
      manager: s.player_name,
      team: s.entry_name,
      entry_id: s.entry,
      gw_pts: s.event_total,
      total: s.total,
      is_user: s.entry === teamId,
    }));

    const h = picksData?.entry_history;

    return NextResponse.json({
      team_name: entry.name,
      manager_name: `${entry.player_first_name ?? ""} ${entry.player_last_name ?? ""}`.trim(),
      overall_points: entry.summary_overall_points ?? 0,
      overall_rank: entry.summary_overall_rank ?? 0,
      gw_points: h?.points ?? 0,
      gw_rank: h?.rank ?? null,
      team_value: (h?.value ?? entry.last_deadline_value ?? 0) / 10,
      bank: (h?.bank ?? entry.last_deadline_bank ?? 0) / 10,
      total_transfers: entry.last_deadline_total_transfers ?? 0,
      gw_transfers: h?.event_transfers ?? 0,
      gw_transfer_cost: h?.event_transfers_cost ?? 0,
      points_on_bench: h?.points_on_bench ?? 0,
      current_gw: currentGWId,
      current_gw_name: currentGW?.name ?? `Gameweek ${currentGWId}`,
      active_chip: picksData?.active_chip ?? null,
      chips,
      squad,
      gw_history: gwHistory,
      league_name: leagueData?.league?.name ?? null,
      league_standings: leagueStandings,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
