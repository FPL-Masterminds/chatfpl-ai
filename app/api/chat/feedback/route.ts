import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_CONTENT_LENGTH = 50_000
const MAX_PROMPT_LENGTH = 10_000

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: {
    message_id?: unknown
    conversation_id?: unknown
    rating?: unknown
    assistant_content?: unknown
    user_prompt?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const messageId = typeof body.message_id === "string" ? body.message_id.trim() : ""
  const rating = body.rating === "positive" || body.rating === "negative" ? body.rating : null
  const assistantContent =
    typeof body.assistant_content === "string" ? body.assistant_content.trim() : ""
  const userPrompt =
    typeof body.user_prompt === "string" ? body.user_prompt.trim().slice(0, MAX_PROMPT_LENGTH) : null
  const conversationId =
    typeof body.conversation_id === "string" && body.conversation_id.trim()
      ? body.conversation_id.trim()
      : null

  if (!messageId) {
    return NextResponse.json({ error: "message_id is required" }, { status: 400 })
  }
  if (!rating) {
    return NextResponse.json({ error: "rating must be positive or negative" }, { status: 400 })
  }
  if (!assistantContent) {
    return NextResponse.json({ error: "assistant_content is required" }, { status: 400 })
  }
  if (assistantContent.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "assistant_content is too long" }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const row = await prisma.messageFeedback.upsert({
      where: {
        user_id_message_id: {
          user_id: user.id,
          message_id: messageId,
        },
      },
      create: {
        message_id: messageId,
        conversation_id: conversationId,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        rating,
        user_prompt: userPrompt,
        assistant_content: assistantContent,
      },
      update: {
        rating,
        conversation_id: conversationId,
        user_prompt: userPrompt,
        assistant_content: assistantContent,
        updated_at: new Date(),
      },
      select: { rating: true },
    })

    return NextResponse.json({ rating: row.rating })
  } catch (err) {
    console.error("message feedback failed", err)
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
