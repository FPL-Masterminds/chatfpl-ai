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
              Your complete guide to mastering Fantasy Premier League with ChatFPL AI
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-16">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#4B5563' }}>
              Welcome to The Playbook - your comprehensive resource for getting the most out of ChatFPL AI and dominating your Fantasy Premier League mini-leagues.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              Whether you're new to FPL or a seasoned veteran, this guide will help you leverage AI-powered insights to make smarter decisions, faster.
            </p>
          </section>

          {/* Accordion FAQs */}
          <section>
            <h2 className="mb-8 text-3xl font-bold text-center" style={{ color: '#2E0032' }}>
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Getting Started with ChatFPL AI
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  To get started with ChatFPL AI, simply sign up for a free account and you'll receive 5 messages per day to explore the platform. Ask questions about players, transfers, captaincy choices, or strategy in plain English, and get instant AI-powered responses backed by real-time FPL data.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  How to ask effective questions
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  The more specific your question, the better the answer. Instead of asking "Who should I captain?", try "Should I captain Salah or Haaland this week based on fixtures and form?". Include context about your team budget, injuries, and strategy for more personalized recommendations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Understanding the data behind recommendations
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  ChatFPL AI analyzes live data from the official Fantasy Premier League API, including player statistics, fixtures, form, expected goals (xG), expected assists (xA), and transfer trends. Our AI combines this data with strategic insights to provide context-rich recommendations that go beyond raw numbers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Transfer strategy and planning
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Use ChatFPL AI to compare potential transfers by asking about multiple players' upcoming fixtures, form trajectories, and differential potential. Plan your transfers 2-3 gameweeks ahead by analyzing fixture swings and key dates. Remember to consider your overall team structure and budget when making decisions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Captaincy decisions week by week
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Captaincy can make or break your gameweek. Ask ChatFPL AI to compare your premium assets based on fixture difficulty, home/away form, and recent performance. Consider differentials during double gameweeks or when template picks have tough fixtures. Our AI will help you weigh the risks and rewards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Premium vs Budget options
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Building a balanced squad requires knowing when to invest in premiums and when to find budget gems. ChatFPL AI can help identify undervalued players in form, analyze whether premium assets justify their price tags, and suggest optimal team structures based on upcoming fixtures.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Fixture analysis and planning
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Fixtures are crucial to FPL success. Ask ChatFPL AI to analyze fixture difficulty over the next 5-6 gameweeks for players you're considering. Identify fixture swings where certain teams' schedules improve or worsen dramatically. Plan your transfers around these key periods to maximize points.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Double gameweeks and blank gameweeks
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Double and blank gameweeks require special planning. Use ChatFPL AI to identify which players will have doubles, analyze their fixture quality during those weeks, and plan your chips accordingly. We'll help you navigate these crucial periods where rank swings can be massive.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Chip strategy: When to use Wildcards, Bench Boost, and Triple Captain
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Chips can be season-defining when used correctly. ChatFPL AI can help you identify the optimal timing for each chip based on fixture schedules, double gameweeks, and your current team situation. Learn when to wildcard to navigate fixture swings, when to bench boost during doubles, and which gameweeks offer the best triple captain opportunities.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Differential picks and template avoidance
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Climbing the ranks sometimes requires calculated risks. Ask ChatFPL AI to identify differential options - players owned by less than 15% of managers who have strong underlying stats or favorable fixtures. Balance your template picks with differentials to create a unique edge while maintaining a solid foundation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </main>
    </div>
  )
}

