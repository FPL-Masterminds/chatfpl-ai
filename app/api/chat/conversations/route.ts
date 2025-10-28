import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all user conversations
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all user conversations ordered by most recent
    const conversations = await prisma.conversation.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// Delete a conversation
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        user_id: user.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete conversation (messages will cascade delete)
    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

