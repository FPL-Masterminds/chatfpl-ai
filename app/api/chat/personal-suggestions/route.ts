import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildHitTransferSuggestionPrompt } from "@/lib/chat-personal-suggestion-prompt";

export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ hitTransferPrompt: null });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { fpl_team_id: true },
    });

    const teamId = user?.fpl_team_id;
    if (!teamId) {
      return NextResponse.json({ hitTransferPrompt: null });
    }

    const bootstrapRes = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      { next: { revalidate: 900 } },
    );
    if (!bootstrapRes.ok) {
      return NextResponse.json({ hitTransferPrompt: null });
    }

    const bootstrap = await bootstrapRes.json();
    const elements = bootstrap.elements ?? [];
    const events: Array<{ id: number; is_current?: boolean; finished?: boolean }> =
      bootstrap.events ?? [];
    const currentEvent =
      events.find((e) => e.is_current)?.id ??
      events.find((e) => !e.finished)?.id ??
      events[events.length - 1]?.id ??
      1;

    const picksRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`,
      { next: { revalidate: 300 } },
    );
    if (!picksRes.ok) {
      return NextResponse.json({ hitTransferPrompt: null });
    }

    const picksData = await picksRes.json();
    const squadIds = new Set<number>(
      (picksData.picks ?? []).map((p: { element: number }) => p.element),
    );
    if (squadIds.size === 0) {
      return NextResponse.json({ hitTransferPrompt: null });
    }

    const hitTransferPrompt = buildHitTransferSuggestionPrompt(squadIds, elements);
    return NextResponse.json({ hitTransferPrompt });
  } catch {
    return NextResponse.json({ hitTransferPrompt: null });
  }
}
