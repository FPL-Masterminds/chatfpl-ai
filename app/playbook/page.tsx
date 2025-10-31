import { Header } from "@/components/header"

export default function PlaybookPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 
              className="mb-6 text-balance text-5xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
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

          {/* Content */}
          <div className="space-y-12 text-sm leading-relaxed" style={{ color: '#4B5563' }}>
            
            {/* What is The Playbook */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                What is The Playbook?
              </h2>
              <p className="mb-4">
                The Playbook is your quick-start guide to getting smarter, faster answers from ChatFPL AI.
              </p>
              <p>
                Think of it as your training ground for asking clear, focused questions that bring back winning insights.
              </p>
            </section>

            {/* Why Question Quality Matters */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                ❓ Why Does Question Quality Matter?
              </h2>
              <p className="mb-4">
                ChatFPL AI analyses real-time Fantasy Premier League data for over 700 players every gameweek.
              </p>
              <p className="mb-4">
                If your question is too broad - like "Who's good this week?" - the system has to search everything and may time out or return vague results.
              </p>
              <p>
                If you're specific, the AI can zero in on the players, price ranges, and fixtures that actually matter to you.
              </p>
            </section>

            {/* How to Ask Questions */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                ⚙️ How Should I Ask Questions?
              </h2>
              <p className="mb-4">
                Keep it focused, short, and goal-driven.
              </p>
              <p className="mb-4 font-semibold">
                Here's the golden rule: one topic per question.
              </p>
              
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
            </section>

            {/* 1. Captaincy */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🎯 1. Ask About Captaincy
              </h2>
              <p className="mb-4">
                Use words like <strong>captain</strong>, <strong>armband</strong>, or <strong>leader</strong>.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Who's the safest captain for GW15?"</p>
                <p>✅ "Best differential captain under 25% ownership?"</p>
                <p>❌ "Who should I pick?" (too vague)</p>
              </div>
            </section>

            {/* 2. Differentials */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                💎 2. Find Hidden Gems and Differentials
              </h2>
              <p className="mb-4">
                Use words like <strong>differential</strong>, <strong>low ownership</strong>, or <strong>under the radar</strong>.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Top 3 midfield differentials for GW16?"</p>
                <p>✅ "Low-owned defenders with good fixtures?"</p>
                <p>❌ "Any surprises?" (unclear intent)</p>
              </div>
            </section>

            {/* 3. Budget */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                💰 3. Ask by Budget or Price
              </h2>
              <p className="mb-4">
                Mention your price range directly - it makes results instant.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Best defenders under £4.5m?"</p>
                <p>✅ "Premium midfielders worth over £10m?"</p>
                <p>❌ "Who's cheap?" (too general)</p>
              </div>
            </section>

            {/* 4. Transfers */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🔄 4. Get Transfer Suggestions
              </h2>
              <p className="mb-4">
                Use words like <strong>transfer</strong>, <strong>replace</strong>, or <strong>bring in</strong>.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Who should I transfer in for an injured Watkins?"</p>
                <p>✅ "Top transfer targets under £7.5m for GW17?"</p>
                <p>❌ "Who's good to buy?" (no context)</p>
              </div>
            </section>

            {/* 5. Position */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                ⚽ 5. Focus by Position
              </h2>
              <p className="mb-4">
                Mention a specific role - goalkeeper, defender, midfielder, or forward.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Best budget goalkeepers for save points?"</p>
                <p>✅ "Which midfielders are in top form?"</p>
                <p>❌ "Who's scoring?" (too broad)</p>
              </div>
            </section>

            {/* 6. Compare */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🔍 6. Compare Players (2-4 Max)
              </h2>
              <p className="mb-4">
                Limit comparisons to two to four names - that's where the AI shines.
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Haaland vs Isak for captaincy?"</p>
                <p>✅ "Palmer or Mbeumo for next three fixtures?"</p>
                <p>❌ "Compare 10 players" (too slow, too wide)</p>
              </div>
            </section>

            {/* 7. Combine Details */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🧩 7. Combine Details for Precision
              </h2>
              <p className="mb-4">
                Mix filters for elite-level results:
              </p>
              <div className="space-y-2 pl-4">
                <p>"Budget defenders with green fixtures under £5.0m"</p>
                <p>"Premium captain options for the next double gameweek"</p>
                <p>"Under-the-radar forwards with good xG in last 3 matches"</p>
              </div>
            </section>

            {/* 8. Gameweeks */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🕐 8. Be Specific About Gameweeks
              </h2>
              <p className="mb-4">
                Gameweek numbers sharpen context instantly:
              </p>
              <div className="space-y-2 pl-4">
                <p>✅ "Who to captain in GW19?"</p>
                <p>✅ "Best transfer targets for GW20-23 fixtures?"</p>
              </div>
            </section>

            {/* 9. What to Avoid */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                ⚠️ 9. What to Avoid
              </h2>
              <div className="space-y-2 pl-4">
                <p>❌ Asking for all players or every stat</p>
                <p>❌ Pasting long player lists</p>
                <p>❌ Open-ended questions like "Give me expert insights"</p>
              </div>
              <p className="mt-4">
                These overload the system and lead to slower or incomplete replies.
              </p>
            </section>

            {/* 10. Best Practices */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                💡 10. Quick Recap: Best Practices
              </h2>
              <ul className="space-y-2 pl-4 list-disc list-inside">
                <li>Be specific - name positions, prices, or gameweeks</li>
                <li>Ask one clear question at a time</li>
                <li>Compare no more than 3-4 players</li>
                <li>Use keywords like captain, transfer, differential, budget</li>
                <li>Avoid "everything" or "all players" type questions</li>
                <li>Expect concise, data-based answers, not long essays</li>
              </ul>
            </section>

            {/* Example Questions */}
            <section>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                ✅ Example Questions That Work Perfectly
              </h2>
              <div className="space-y-2 pl-4">
                <p>"Best captain pick for GW22?"</p>
                <p>"3 differentials under £7m with good fixtures?"</p>
                <p>"Who to replace Saka with if injured?"</p>
                <p>"Compare Haaland vs Nunez for next 5 gameweeks."</p>
                <p>"Best cheap defenders with strong fixture runs?"</p>
              </div>
            </section>

            {/* Summary */}
            <section className="border-t-2 pt-8" style={{ borderColor: '#00FF86' }}>
              <h2 className="mb-4 text-2xl font-bold" style={{ color: '#2E0032' }}>
                🏆 Summary
              </h2>
              <p className="mb-4">
                The more specific, targeted, and explicit your question, the better ChatFPL AI can perform.
              </p>
              <p>
                Treat it like your personal analyst - ask clear tactical questions, and it'll give you the sharpest, data-backed answers every time.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
