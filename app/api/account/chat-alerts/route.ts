import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: { chat_alerts_enabled?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (typeof body.chat_alerts_enabled !== "boolean") {
    return NextResponse.json(
      { error: "chat_alerts_enabled must be a boolean" },
      { status: 400 },
    )
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: { chat_alerts_enabled: body.chat_alerts_enabled },
      select: { chat_alerts_enabled: true },
    })
    return NextResponse.json({ chat_alerts_enabled: updated.chat_alerts_enabled })
  } catch (err) {
    console.error("chat-alerts preference update failed", err)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
