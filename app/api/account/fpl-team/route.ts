import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const raw = body.fpl_team_id;

    // Accept null/empty to clear the saved ID
    if (raw === null || raw === "" || raw === undefined) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { fpl_team_id: null },
      });
      return NextResponse.json({ fpl_team_id: null });
    }

    const teamId = parseInt(String(raw), 10);

    if (isNaN(teamId) || teamId <= 0) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Validate against the FPL public API
    const fplRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/`,
      { headers: { "User-Agent": "ChatFPL/1.0" }, next: { revalidate: 0 } }
    );

    if (!fplRes.ok) {
      return NextResponse.json(
        { error: "Team not found. Please check your FPL Team ID." },
        { status: 404 }
      );
    }

    const fplData = await fplRes.json();
    const teamName: string = fplData.name ?? "";
    const managerName: string =
      `${fplData.player_first_name ?? ""} ${fplData.player_last_name ?? ""}`.trim();

    await prisma.user.update({
      where: { email: session.user.email },
      data: { fpl_team_id: teamId },
    });

    return NextResponse.json({ fpl_team_id: teamId, team_name: teamName, manager_name: managerName });
  } catch (error) {
    console.error("FPL team save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
