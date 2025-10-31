import { Header } from "@/components/header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Brain, Zap, Users } from "lucide-react"

export default function AboutPage() {
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
              <span style={{ color: 'white' }}>About Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: '#4B5563' }}>
              Your AI-powered Fantasy Premier League assistant - built by managers, for managers.
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-16">
            <p className="text-lg leading-relaxed text-center" style={{ color: '#4B5563' }}>
              ChatFPL AI helps Fantasy Premier League players make sharper, faster, and more informed decisions.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-center" style={{ color: '#4B5563' }}>
              It blends <strong>real-time FPL data</strong> with <strong>advanced AI insights</strong> to deliver instant, personalized advice that keeps you one step ahead of the competition.
            </p>
          </section>

          {/* AI Meets FPL Section */}
          <section className="mb-16">
            <h2 
              className="mb-4 text-center text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>AI </span>
              <span style={{ color: '#00FFFF' }}>Meets </span>
              <span style={{ color: '#00FF86' }}>FPL</span>
            </h2>
            <p className="mb-8 text-center text-lg font-semibold" style={{ color: '#4B5563' }}>
              Engineered for Insight
            </p>
            <p className="mb-4 text-lg leading-relaxed" style={{ color: '#4B5563' }}>
              We created ChatFPL AI so every manager - casual or seasoned - can access the kind of tactical insight and data-driven analysis that was once only available to experts. We combine the power of artificial intelligence with real-time FPL data to provide instant, personalized advice that helps you climb the rankings.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h3 className="mb-8 text-center text-3xl font-bold" style={{ color: '#2E0032' }}>
              How It Works
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0, 255, 134, 0.1)' }}>
                    <Database className="h-6 w-6" style={{ color: '#00FF86' }} />
                  </div>
                  <CardTitle>Live Data Feed</CardTitle>
                  <CardDescription>
                    We connect directly to up-to-the-minute player statistics, fixture difficulty, player availability, performance and transfer trends.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0, 255, 134, 0.1)' }}>
                    <Brain className="h-6 w-6" style={{ color: '#00FF86' }} />
                  </div>
                  <CardTitle>AI-Driven Insights</CardTitle>
                  <CardDescription>
                    Our AI generates context-rich, actionable recommendations - not just numbers.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0, 255, 134, 0.1)' }}>
                    <Zap className="h-6 w-6" style={{ color: '#00FF86' }} />
                  </div>
                  <CardTitle>Instant Answers</CardTitle>
                  <CardDescription>
                    Ask anything in plain English and get an instant response. No spreadsheets, no scraping, just straight-to-the-point analysis.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0, 255, 134, 0.1)' }}>
                    <Users className="h-6 w-6" style={{ color: '#00FF86' }} />
                  </div>
                  <CardTitle>Community-Built</CardTitle>
                  <CardDescription>
                    Created by FPL obsessives who live the game every week. ChatFPL AI evolves through feedback, strategy discussions, and real-world testing from the community itself.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Why ChatFPL AI Section */}
          <section>
            <h2 
              className="mb-4 text-center text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Why Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI?</span>
            </h2>
            <p className="mb-6 text-center text-lg font-semibold" style={{ color: '#4B5563' }}>
              Fantasy Premier League changes fast
            </p>
            <p className="mb-4 text-lg leading-relaxed" style={{ color: '#4B5563' }}>
              Fixtures shift, players explode, data evolves. ChatFPL AI gives you the power to react in seconds, not hours, using real insights, not guesswork.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: '#4B5563' }}>
              Whether you're setting your captain, planning transfers, or analysing upcoming fixtures, ChatFPL AI is your always-on tactical partner, built to help you climb the ranks and enjoy the game even more.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
