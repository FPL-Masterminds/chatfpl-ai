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

    // Fetch live FPL data
    let fplContext = "";
    try {
      const fplResponse = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
      if (fplResponse.ok) {
        const fplData = await fplResponse.json();
        
        // Extract key data
        const currentGameweek = fplData.events?.find((e: any) => e.is_current) || fplData.events?.[0];
        const nextGameweek = fplData.events?.find((e: any) => e.is_next);
        
        // Get ALL players and format efficiently with photo URLs
        const allPlayers = fplData.elements?.map((p: any) => {
          const team = fplData.teams?.find((t: any) => t.id === p.team);
          const position = fplData.element_types?.find((pt: any) => pt.id === p.element_type);
          const photoCode = p.photo?.replace('.jpg', '').replace('.png', '') || p.code;
          const photoUrl = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${photoCode}.png`;
          return `${p.web_name}|${p.first_name} ${p.second_name}|${team?.short_name}|${position?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.total_points}pts|${p.form}form|${p.points_per_game}ppg|${p.selected_by_percent}%own|${p.status}|${p.chance_of_playing_next_round || 100}%fit|${photoUrl}`;
        });

        // Build context string
        fplContext = `LIVE FPL DATA (Updated: ${new Date().toISOString()}):

CURRENT GAMEWEEK: ${currentGameweek?.name || "Unknown"} (ID: ${currentGameweek?.id})
- Deadline: ${currentGameweek?.deadline_time}
- Finished: ${currentGameweek?.finished ? "Yes" : "No"}

${nextGameweek ? `NEXT GAMEWEEK: ${nextGameweek.name} - Deadline: ${nextGameweek.deadline_time}` : ""}

ALL ${allPlayers?.length || 0} FPL PLAYERS (Format: WebName|FullName|Team|Pos|Price|TotalPts|Form|PPG|Ownership|Status|Fitness|PhotoURL):
${allPlayers?.join("\n")}

TEAMS:
${fplData.teams?.map((t: any) => `${t.name} (${t.short_name})`).join(", ")}

Use this live data to answer the user's question accurately. All player stats, prices, availability, and photo URLs are current as of today.`;
      }
    } catch (fplError) {
      console.error("FPL API fetch error:", fplError);
      // Continue without FPL data if fetch fails
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

                // Append FPL data and formatting instructions to the user's message
                const formattingInstructions = `FORMATTING RULES:
- Format your response with clear paragraphs separated by blank lines
- Use bullet points (•) for lists and multiple items
- Break up long blocks of text into readable sections
- Use line breaks between different topics or players
- Keep each paragraph focused and concise
- Make comparisons easy to read with clear formatting
- IMPORTANT: When mentioning a player, ALWAYS include their photo using this exact format: ![PlayerName](PhotoURL)
- The PhotoURL is provided in the player data above
- Example: "![Salah](https://resources.premierleague.com/premierleague25/photos/players/110x140/118748.png) Mohamed Salah is in great form..."

`;
                
                const enhancedMessage = fplContext 
                  ? `${fplContext}\n\n${formattingInstructions}\n---\n\nUser Question: ${message}`
                  : `${formattingInstructions}\n---\n\nUser Question: ${message}`;

    // Add 60 second timeout for Dify API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let difyData: any;
    
    try {
      const difyResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${difyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: enhancedMessage,
          response_mode: "blocking",
          conversation_id: conversationId || "",
          user: user.id,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!difyResponse.ok) {
        // Log technical error for debugging
        try {
          const errorData = await difyResponse.json();
          console.error("Dify API error:", difyResponse.status, errorData);
        } catch (e) {
          console.error("Failed to parse Dify error response");
        }
        
        // Return user-friendly message
        let userMessage = "I'm having trouble processing your question right now. Please try:\n\n• Asking a more specific question\n• Breaking complex questions into smaller parts\n• Waiting a moment and trying again\n\nIf the problem continues, please contact support.";
        
        return NextResponse.json(
          { error: userMessage },
          { status: 500 }
        );
      }

      difyData = await difyResponse.json();
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        console.error("Dify API timeout - request exceeded 60 seconds");
        return NextResponse.json(
          { error: "Your question is taking longer than expected. Please try:\n\n• Asking about fewer players at once\n• Breaking your question into smaller parts\n• Simplifying your request\n\nFor squad analysis, focus on 2-3 players at a time for best results." },
          { status: 504 }
        );
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }

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
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    // Professional, user-friendly error message
    const userMessage = "I'm having trouble answering your question right now. Please try:\n\n• Refreshing the page and asking again\n• Checking your internet connection\n• Simplifying your question\n\nIf the issue persists, please contact our support team.";
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

