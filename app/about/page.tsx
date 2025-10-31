import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

export default function AboutPage() {
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
              <span style={{ color: 'white' }}>About Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              Your AI-powered Fantasy Premier League assistant - built by managers, for managers.
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-16 space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              ChatFPL AI helps Fantasy Premier League players make sharper, faster, and more informed decisions. It blends <strong>real-time FPL data</strong> with <strong>advanced AI insights</strong> to deliver instant, personalized advice that keeps you one step ahead of the competition.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              We created ChatFPL AI so every manager - casual or seasoned - can access the kind of tactical insight and data-driven analysis that was once only available to experts. We combine the power of artificial intelligence with real-time FPL data to provide instant, personalized advice that helps you climb the rankings.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              Created by FPL obsessives who live the game every week. ChatFPL AI evolves through feedback, strategy discussions, and real-world testing from the community itself.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h3 
              className="mb-4 text-center text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>How </span>
              <span style={{ color: '#00FFFF' }}>It </span>
              <span style={{ color: '#00FF86' }}>Works</span>
            </h3>
            <p className="mb-8 text-center text-lg font-semibold" style={{ color: '#4B5563' }}>
              Real-time insights, powered by AI
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Live Data Feed Card */}
              <Card className="border-0 bg-white shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#00FF86' }}>
                    <Database className="h-8 w-8" style={{ color: '#2E0032' }} />
                  </div>
                  <CardTitle className="text-xl mb-2">Live Data Feed</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    We connect directly to up-to-the-minute player statistics, fixture difficulty, player availability, performance and transfer trends.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* AI-Driven Insights Card */}
              <Card className="border-0 bg-white shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#2E0032' }}>
                    <Image 
                      src="/AI-Driven Insights.png"
                      alt="AI-Driven Insights"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <CardTitle className="text-xl mb-2">AI-Driven Insights</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Our AI generates context-rich, actionable recommendations and insights for your FPL squad, not just raw numbers and figures.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Instant Answers Card */}
              <Card className="border-0 bg-white shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#00FFFF' }}>
                    <Image 
                      src="/Instant_Answers.png"
                      alt="Instant Answers"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <CardTitle className="text-xl mb-2">Instant Answers</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Ask anything in plain English and get an instant response. No spreadsheets, no scraping, just straight-to-the-point analysis.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Why ChatFPL AI Section */}
          <section className="mb-16">
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
            <p className="mb-4 text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              Fixtures shift, players explode, data evolves. ChatFPL AI gives you the power to react in seconds, not hours, using real insights, not guesswork.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
              Whether you're setting your captain, planning transfers, or analysing upcoming fixtures, ChatFPL AI is your always-on tactical partner, built to help you climb the ranks and enjoy the game even more.
            </p>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <p className="mb-6 text-lg font-semibold" style={{ color: '#4B5563' }}>
              Stop overthinking. Start winning. Let ChatFPL AI analyse your squad, fixtures, and form in seconds, so you make the right move every time.
            </p>
            <Link href="/signup">
              <Button 
                size="lg"
                className="font-semibold"
                style={{ 
                  backgroundColor: '#00FF86',
                  color: '#2E0032'
                }}
              >
                Start your 5-message free trial today
              </Button>
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
