import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildChatAlerts } from "@/lib/chat-alerts"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ enabled: false, alerts: [] })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { fpl_team_id: true, chat_alerts_enabled: true },
    })

    if (!user?.chat_alerts_enabled) {
      return NextResponse.json({ enabled: false, alerts: [] })
    }

    const alerts = await buildChatAlerts(user.fpl_team_id ?? null)
    return NextResponse.json({ enabled: true, alerts })
  } catch (err) {
    console.error("chat alerts fetch failed", err)
    return NextResponse.json({ enabled: true, alerts: [] })
  }
}
