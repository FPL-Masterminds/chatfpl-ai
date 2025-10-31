import { Header } from "@/components/header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function PlaybookPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 
              className="mb-6 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>The </span>
              <span style={{ color: '#00FFFF' }}>Play</span>
              <span style={{ color: '#00FF86' }}>book</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              How to Get the Best from ChatFPL AI
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#4B5563' }}>
              The Playbook is your quick-start guide to getting smarter, faster answers from ChatFPL AI.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              Think of it as your training ground for asking clear, focused questions that bring back winning insights.
            </p>
          </section>

          {/* Accordion Sections */}
          <Accordion type="single" collapsible className="space-y-4">
            
            {/* Why Question Quality Matters */}
            <AccordionItem value="item-1" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                ❓ Why Does Question Quality Matter?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>ChatFPL AI analyses real-time Fantasy Premier League data for over 700 players every gameweek.</p>
                <p>If your question is too broad - like "Who's good this week?" - the system has to search everything and may time out or return vague results.</p>
                <p>If you're specific, the AI can zero in on the players, price ranges, and fixtures that actually matter to you.</p>
              </AccordionContent>
            </AccordionItem>

            {/* How to Ask Questions */}
            <AccordionItem value="item-2" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                ⚙️ How Should I Ask Questions?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-4">
                <p>Keep it focused, short, and goal-driven.</p>
                <p className="font-semibold">Here's the golden rule: one topic per question.</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="pb-3 pr-4 text-left font-semibold">❌ Too broad</th>
                        <th className="pb-3 text-left font-semibold">✅ Works better</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 pr-4">"Who are all the good players this week?"</td>
                        <td className="py-3">"Who are three differential forwards for GW12?"</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-3 pr-4">"Tell me about transfers"</td>
                        <td className="py-3">"Who should I transfer in for Saka before GW13?"</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">"Compare ten midfielders"</td>
                        <td className="py-3">"Compare Bowen, Mbeumo, and Diaby for GW14."</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 1. Captaincy */}
            <AccordionItem value="item-3" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🎯 1. Ask About Captaincy
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Use words like <strong>captain</strong>, <strong>armband</strong>, or <strong>leader</strong>.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Who's the safest captain for GW15?"</p>
                  <p>✅ "Best differential captain under 25% ownership?"</p>
                  <p>❌ "Who should I pick?" (too vague)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Differentials */}
            <AccordionItem value="item-4" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                💎 2. Find Hidden Gems and Differentials
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Use words like <strong>differential</strong>, <strong>low ownership</strong>, or <strong>under the radar</strong>.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Top 3 midfield differentials for GW16?"</p>
                  <p>✅ "Low-owned defenders with good fixtures?"</p>
                  <p>❌ "Any surprises?" (unclear intent)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Budget */}
            <AccordionItem value="item-5" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                💰 3. Ask by Budget or Price
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Mention your price range directly - it makes results instant.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Best defenders under £4.5m?"</p>
                  <p>✅ "Premium midfielders worth over £10m?"</p>
                  <p>❌ "Who's cheap?" (too general)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Transfers */}
            <AccordionItem value="item-6" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🔄 4. Get Transfer Suggestions
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Use words like <strong>transfer</strong>, <strong>replace</strong>, or <strong>bring in</strong>.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Who should I transfer in for an injured Watkins?"</p>
                  <p>✅ "Top transfer targets under £7.5m for GW17?"</p>
                  <p>❌ "Who's good to buy?" (no context)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Position */}
            <AccordionItem value="item-7" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                ⚽ 5. Focus by Position
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Mention a specific role - goalkeeper, defender, midfielder, or forward.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Best budget goalkeepers for save points?"</p>
                  <p>✅ "Which midfielders are in top form?"</p>
                  <p>❌ "Who's scoring?" (too broad)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Compare */}
            <AccordionItem value="item-8" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🔍 6. Compare Players (2-4 Max)
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Limit comparisons to two to four names - that's where the AI shines.</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Haaland vs Isak for captaincy?"</p>
                  <p>✅ "Palmer or Mbeumo for next three fixtures?"</p>
                  <p>❌ "Compare 10 players" (too slow, too wide)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 7. Combine Details */}
            <AccordionItem value="item-9" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🧩 7. Combine Details for Precision
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Mix filters for elite-level results:</p>
                <div className="space-y-2 pl-4">
                  <p>"Budget defenders with green fixtures under £5.0m"</p>
                  <p>"Premium captain options for the next double gameweek"</p>
                  <p>"Under-the-radar forwards with good xG in last 3 matches"</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 8. Gameweeks */}
            <AccordionItem value="item-10" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🕐 8. Be Specific About Gameweeks
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>Gameweek numbers sharpen context instantly:</p>
                <div className="space-y-2 pl-4">
                  <p>✅ "Who to captain in GW19?"</p>
                  <p>✅ "Best transfer targets for GW20-23 fixtures?"</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 9. What to Avoid */}
            <AccordionItem value="item-11" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                ⚠️ 9. What to Avoid
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <div className="space-y-2 pl-4">
                  <p>❌ Asking for all players or every stat</p>
                  <p>❌ Pasting long player lists</p>
                  <p>❌ Open-ended questions like "Give me expert insights"</p>
                </div>
                <p>These overload the system and lead to slower or incomplete replies.</p>
              </AccordionContent>
            </AccordionItem>

            {/* 10. Best Practices */}
            <AccordionItem value="item-12" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                💡 10. Quick Recap: Best Practices
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                <ul className="space-y-2 pl-4 list-disc list-inside">
                  <li>Be specific - name positions, prices, or gameweeks</li>
                  <li>Ask one clear question at a time</li>
                  <li>Compare no more than 3-4 players</li>
                  <li>Use keywords like captain, transfer, differential, budget</li>
                  <li>Avoid "everything" or "all players" type questions</li>
                  <li>Expect concise, data-based answers, not long essays</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Example Questions */}
            <AccordionItem value="item-13" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                ✅ Example Questions That Work Perfectly
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                <div className="space-y-2 pl-4">
                  <p>"Best captain pick for GW22?"</p>
                  <p>"3 differentials under £7m with good fixtures?"</p>
                  <p>"Who to replace Saka with if injured?"</p>
                  <p>"Compare Haaland vs Nunez for next 5 gameweeks."</p>
                  <p>"Best cheap defenders with strong fixture runs?"</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Summary */}
            <AccordionItem value="item-14" className="rounded-lg border border-border bg-white px-6 shadow-sm">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                🏆 Summary
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3">
                <p>The more specific, targeted, and explicit your question, the better ChatFPL AI can perform.</p>
                <p>Treat it like your personal analyst - ask clear tactical questions, and it'll give you the sharpest, data-backed answers every time.</p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </main>
    </div>
  )
}
