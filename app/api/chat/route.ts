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
      // Fetch both bootstrap data and fixtures
      const [fplResponse, fixturesResponse] = await Promise.all([
        fetch("https://fantasy.premierleague.com/api/bootstrap-static/"),
        fetch("https://fantasy.premierleague.com/api/fixtures/")
      ]);
      
      if (fplResponse.ok && fixturesResponse.ok) {
        const fplData = await fplResponse.json();
        const fixturesData = await fixturesResponse.json();
        
        // Extract key data
        const currentGameweek = fplData.events?.find((e: any) => e.is_current) || fplData.events?.[0];
        const nextGameweek = fplData.events?.find((e: any) => e.is_next);
        
        // Get ALL players first
        const allPlayers = fplData.elements?.map((p: any) => {
          const team = fplData.teams?.find((t: any) => t.id === p.team);
          const position = fplData.element_types?.find((pt: any) => pt.id === p.element_type);
          const photoCode = p.photo?.replace('.jpg', '').replace('.png', '') || p.code;
          const photoUrl = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${photoCode}.png`;
          return {
            formatted: `${p.web_name}|${p.first_name} ${p.second_name}|${team?.short_name}|${position?.singular_name_short}|£${(p.now_cost / 10).toFixed(1)}m|${p.total_points}pts|${p.form}form|${p.points_per_game}ppg|${p.selected_by_percent}%own|${p.status}|${p.chance_of_playing_next_round || 100}%fit|${photoUrl}`,
            rawData: p,
            team: team?.short_name,
            position: position?.singular_name_short
          };
        }) || [];

        // Smart filtering based on question keywords
        const messageLower = message.toLowerCase();
        let filteredPlayers = allPlayers;
        let filterNote = "";

        // Check for specific player names mentioned
        const mentionedPlayers = allPlayers.filter(p => 
          messageLower.includes(p.rawData.web_name.toLowerCase()) ||
          messageLower.includes(p.rawData.first_name.toLowerCase()) ||
          messageLower.includes(p.rawData.second_name.toLowerCase())
        );

        if (mentionedPlayers.length > 0 && mentionedPlayers.length <= 5) {
          // User asked about specific players - send those + top alternatives
          filteredPlayers = [
            ...mentionedPlayers,
            ...allPlayers
              .filter(p => !mentionedPlayers.includes(p))
              .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
              .slice(0, 100)
          ];
          filterNote = `Focused on mentioned players plus top alternatives`;
        }
        else if (messageLower.includes('differential') || messageLower.includes('under the radar') || messageLower.includes('hidden gem')) {
          // Differentials: Low ownership (<12%), decent form, playing regularly
          filteredPlayers = allPlayers.filter(p => 
            parseFloat(p.rawData.selected_by_percent) < 12 &&
            parseFloat(p.rawData.form) > 3.0 &&
            p.rawData.minutes > 200
          ).slice(0, 150);
          filterNote = `Showing players with <12% ownership, good form, and regular minutes`;
        }
        else if (messageLower.includes('premium') || messageLower.includes('expensive') || messageLower.includes('high price')) {
          // Premium players: £9.0m+
          filteredPlayers = allPlayers.filter(p => p.rawData.now_cost >= 90).slice(0, 100);
          filterNote = `Showing premium players (£9.0m+)`;
        }
        else if (messageLower.includes('budget') || messageLower.includes('cheap') || messageLower.includes('enabler')) {
          // Budget players: <£6.0m
          filteredPlayers = allPlayers.filter(p => p.rawData.now_cost < 60).slice(0, 150);
          filterNote = `Showing budget players (<£6.0m)`;
        }
        else if (messageLower.includes('captain')) {
          // Captain picks: High points, good form, playing regularly
          filteredPlayers = allPlayers
            .filter(p => p.rawData.total_points > 30 && parseFloat(p.rawData.form) > 4.0)
            .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
            .slice(0, 120);
          filterNote = `Showing top captaincy options based on points and form`;
        }
        else if (messageLower.includes('transfer') || messageLower.includes('who to get') || messageLower.includes('who should i bring in')) {
          // Transfer targets: Good form, decent points, available
          filteredPlayers = allPlayers
            .filter(p => 
              parseFloat(p.rawData.form) > 4.0 &&
              p.rawData.total_points > 20 &&
              p.rawData.status === 'a'
            )
            .sort((a, b) => parseFloat(b.rawData.form) - parseFloat(a.rawData.form))
            .slice(0, 150);
          filterNote = `Showing in-form transfer targets`;
        }
        else if (messageLower.match(/\b(gk|goalkeeper|keeper)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'GKP').slice(0, 80);
          filterNote = `Showing goalkeepers only`;
        }
        else if (messageLower.match(/\b(def|defender|defence|defense)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'DEF').slice(0, 120);
          filterNote = `Showing defenders only`;
        }
        else if (messageLower.match(/\b(mid|midfielder|midfield)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'MID').slice(0, 150);
          filterNote = `Showing midfielders only`;
        }
        else if (messageLower.match(/\b(fwd|forward|striker|attacker)\b/)) {
          filteredPlayers = allPlayers.filter(p => p.position === 'FWD').slice(0, 100);
          filterNote = `Showing forwards only`;
        }
        else {
          // General question: Send top 150 most relevant players
          filteredPlayers = allPlayers
            .filter(p => 
              p.rawData.total_points > 15 || 
              parseFloat(p.rawData.form) > 4.0 ||
              p.rawData.minutes > 300
            )
            .sort((a, b) => b.rawData.total_points - a.rawData.total_points)
            .slice(0, 150);
          filterNote = `Showing top 150 most relevant players (by points, form, and minutes)`;
        }

        // Get upcoming fixtures grouped by team (next 5 gameweeks)
        const currentGW = currentGameweek?.id || 1;
        const upcomingFixtures = fixturesData.filter((f: any) => 
          f.event >= currentGW && f.event <= currentGW + 4 && !f.finished
        );

        // Build fixture run for each team
        const teamFixtures: { [key: string]: string[] } = {};
        
        fplData.teams?.forEach((team: any) => {
          const teamCode = team.short_name;
          const fixtures = upcomingFixtures
            .filter((f: any) => f.team_h === team.id || f.team_a === team.id)
            .sort((a: any, b: any) => a.event - b.event)
            .slice(0, 5)
            .map((f: any) => {
              const isHome = f.team_h === team.id;
              const opponent = isHome 
                ? fplData.teams?.find((t: any) => t.id === f.team_a)
                : fplData.teams?.find((t: any) => t.id === f.team_h);
              const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
              return `${opponent?.short_name || 'TBC'}(${isHome ? 'H' : 'A'}-${difficulty})`;
            });
          
          teamFixtures[teamCode] = fixtures;
        });

        const fixtureRunsText = Object.entries(teamFixtures)
          .map(([team, fixtures]) => `${team}: ${fixtures.join(', ')}`)
          .join('\n');

        console.log('=== FIXTURE DATA DEBUG ===');
        console.log('Total fixtures fetched:', fixturesData.length);
        console.log('Current GW:', currentGW);
        console.log('Filtered fixtures count:', upcomingFixtures.length);
        console.log('Arsenal fixtures:', teamFixtures['ARS']);
        console.log('Fixture runs text length:', fixtureRunsText.length);
        console.log('=== END DEBUG ===');

        // Build context string with filtered players
        fplContext = `LIVE FPL DATA (Updated: ${new Date().toISOString()}):

CURRENT GAMEWEEK: ${currentGameweek?.name || "Unknown"} (ID: ${currentGameweek?.id})
- Deadline: ${currentGameweek?.deadline_time}
- Finished: ${currentGameweek?.finished ? "Yes" : "No"}

${nextGameweek ? `NEXT GAMEWEEK: ${nextGameweek.name} - Deadline: ${nextGameweek.deadline_time}` : ""}

TEAM FIXTURE RUNS (Next 5 Gameweeks) - Format: OPPONENT(H/A-Difficulty):
${fixtureRunsText}

FILTERED PLAYER DATA (${filteredPlayers.length} players - ${filterNote}):
Format: WebName|FullName|Team|Pos|Price|TotalPts|Form|PPG|Ownership|Status|Fitness|PhotoURL
${filteredPlayers.map(p => p.formatted).join("\n")}

TEAMS:
${fplData.teams?.map((t: any) => `${t.name} (${t.short_name})`).join(", ")}

FIXTURE DIFFICULTY: 1=Easy, 2=Favorable, 3=Medium, 4=Tough, 5=Very Difficult. H=Home, A=Away.
Use this live data to answer the user's question accurately. Check team fixtures before recommending players. All data is current as of today.`;
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

    console.log('=== DIFY PAYLOAD DEBUG ===');
    console.log('Enhanced message length:', enhancedMessage.length);
    console.log('FPL context length:', fplContext.length);
    console.log('First 500 chars of enhanced message:', enhancedMessage.substring(0, 500));
    console.log('=== END PAYLOAD DEBUG ===');

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
          console.error("=== DIFY ERROR ===");
          console.error("Status:", difyResponse.status);
          console.error("Error data:", JSON.stringify(errorData, null, 2));
          console.error("=== END DIFY ERROR ===");
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

