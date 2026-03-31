export const revalidate = 3600

export async function GET() {
  const fallback = { fwd1: "Haaland", fwd2: "Watkins", mid1: "Palmer", mid2: "Mbeumo", mid3: "Saka" }

  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return Response.json(fallback)

    const data = await res.json()

    type Element = {
      web_name: string
      element_type: number
      total_points: number
      status: string
      chance_of_playing_next_round: number | null
    }

    const players: Element[] = data.elements ?? []

    function getTop(type: number, count: number): string[] {
      return players
        .filter(
          (p) =>
            p.element_type === type &&
            p.status !== "i" &&
            p.status !== "u" &&
            p.status !== "s" &&
            (p.chance_of_playing_next_round === null || p.chance_of_playing_next_round >= 50),
        )
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, count)
        .map((p) => p.web_name)
    }

    const fwds = getTop(4, 2)
    const mids = getTop(3, 3)

    return Response.json({
      fwd1: fwds[0] ?? fallback.fwd1,
      fwd2: fwds[1] ?? fallback.fwd2,
      mid1: mids[0] ?? fallback.mid1,
      mid2: mids[1] ?? fallback.mid2,
      mid3: mids[2] ?? fallback.mid3,
    })
  } catch {
    return Response.json(fallback)
  }
}
