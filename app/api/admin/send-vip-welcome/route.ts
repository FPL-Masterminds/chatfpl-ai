import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { normalizeEmail } from "@/lib/email-utils"
import { isSiteOwner } from "@/lib/god-mode"
import { prisma } from "@/lib/prisma"
import { sendVipGrantEmail } from "@/lib/vip-grant-email"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (!isSiteOwner(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)
    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { subscriptions: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = targetUser.subscriptions[0]
    if (!subscription || subscription.plan !== "VIP") {
      return NextResponse.json(
        { error: "User is not on the VIP plan. Grant VIP first or check the email." },
        { status: 400 },
      )
    }

    const sendResult = await sendVipGrantEmail({
      to: targetUser.email,
      name: targetUser.name,
      unsubscribeToken: targetUser.unsubscribe_token,
    })

    if (!sendResult.ok) {
      return NextResponse.json({ error: sendResult.error }, { status: 500 })
    }

    return NextResponse.json({
      message: `VIP welcome email sent to ${targetUser.email}`,
    })
  } catch (error) {
    console.error("Send VIP welcome error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
