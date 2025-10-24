import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user with usage tracking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        usageTracking: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usage = user.usageTracking[0];

    // Check message limit
    if (usage && usage.messages_used >= usage.messages_limit) {
      return NextResponse.json(
        { error: "Message limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Call Dify API
    const difyApiKey = process.env.DIFY_API_KEY;
    const difyBaseUrl = process.env.DIFY_BASE_URL || "https://api.dify.ai/v1";

    if (!difyApiKey) {
      return NextResponse.json(
        { error: "Dify API key not configured" },
        { status: 500 }
      );
    }

    const difyResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: "blocking",
        conversation_id: conversationId || "",
        user: user.id,
      }),
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.json();
      console.error("Dify API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    const difyData = await difyResponse.json();

    // Increment usage
    await prisma.usageTracking.update({
      where: { id: usage.id },
      data: {
        messages_used: usage.messages_used + 1,
      },
    });

    // Save conversation and messages to database
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user_id: user.id,
          title: message.substring(0, 50), // First 50 chars as title
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Save AI response
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        role: "assistant",
        content: difyData.answer,
      },
    });

    return NextResponse.json({
      answer: difyData.answer,
      conversation_id: difyData.conversation_id || conversation.id,
      messages_used: usage.messages_used + 1,
      messages_limit: usage.messages_limit,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

