import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Database, Zap, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Give me some live statistics about Mohamed Salah this season | ChatFPL AI Demo",
  description: "See how ChatFPL AI delivers instant, comprehensive Fantasy Premier League insights about Mohamed Salah's season statistics, form, fixtures, and captaincy potential using real-time data.",
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b px-4 pt-24 pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/gradient_hero_bg.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="container relative mx-auto max-w-5xl">
          <div className="text-center">
            <h1 
              className="mb-6 text-balance font-bold leading-[1.1] tracking-tighter text-white"
              style={{ fontSize: '60px' }}
            >
              Give me some live statistics about Mohamed Salah this season
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold text-white">
              Watch how ChatFPL AI transforms a simple question into a complete, data-rich analysis in seconds
            </p>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="border-b bg-white px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>See Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI </span>
              <span style={{ color: 'white' }}>in Action</span>
            </h2>
            <p className="text-lg font-semibold" style={{ color: '#4B5563' }}>
              This video demonstrates the comprehensive answer ChatFPL AI provides for a single question
            </p>
          </div>
          
          {/* YouTube Video Placeholder - 9:16 Aspect Ratio */}
          <div className="mx-auto max-w-md">
            <div 
              className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 shadow-lg"
              style={{ paddingBottom: '177.78%' }} // 9:16 aspect ratio (16/9 = 1.7778)
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#00FF87]">
                    <svg className="h-10 w-10 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">YouTube Video Embed</p>
                  <p className="text-xs text-gray-500">Paste your YouTube embed code here</p>
                </div>
              </div>
              {/* 
                PASTE YOUR YOUTUBE EMBED CODE HERE
                Example:
                <iframe 
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/YOUR_VIDEO_ID" 
                  title="ChatFPL AI Demo - Mohamed Salah Statistics"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              */}
            </div>
          </div>
        </div>
      </section>

      {/* The Question Section */}
      <section className="border-b bg-gray-50 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>The </span>
              <span style={{ color: '#00FFFF' }}>Question</span>
            </h2>
            <p className="text-lg font-semibold" style={{ color: '#4B5563' }}>
              A simple, natural language query that any FPL manager might ask
            </p>
          </div>

          <Card className="mx-auto max-w-3xl border-[#00FF87] bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                "Give me some live statistics about Mohamed Salah this season."
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                No complex syntax. No technical jargon. Just a straightforward question in plain English.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Natural conversation</p>
                    <p className="text-sm text-gray-600">Ask questions the way you'd talk to a friend or coach</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Real-time context</p>
                    <p className="text-sm text-gray-600">ChatFPL AI understands you want current season data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Instant comprehension</p>
                    <p className="text-sm text-gray-600">No need to specify stats - the AI knows what's relevant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The Answer Section */}
      <section className="border-b bg-white px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>The </span>
              <span style={{ color: '#00FFFF' }}>Answer</span>
            </h2>
            <p className="text-lg font-semibold" style={{ color: '#4B5563' }}>
              A comprehensive, structured breakdown covering every aspect an FPL manager needs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Core Stats */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-5 w-5 text-[#00FF87]" />
                  Core Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-gray-900">£14.2m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-semibold text-gray-900">52</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minutes Played:</span>
                  <span className="font-semibold text-gray-900">894</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Form:</span>
                  <span className="font-semibold text-gray-900">6.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points per Game:</span>
                  <span className="font-semibold text-gray-900">5.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ownership:</span>
                  <span className="font-semibold text-gray-900">24.9%</span>
                </div>
              </CardContent>
            </Card>

            {/* Attacking Output */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="h-5 w-5 text-[#00FF87]" />
                  Attacking Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Goals:</span>
                  <span className="font-semibold text-gray-900">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assists:</span>
                  <span className="font-semibold text-gray-900">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clean Sheets:</span>
                  <span className="font-semibold text-gray-900">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus Points:</span>
                  <span className="font-semibold text-gray-900">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BPS Score:</span>
                  <span className="font-semibold text-gray-900">163</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ICT Index:</span>
                  <span className="font-semibold text-gray-900">79.1</span>
                </div>
              </CardContent>
            </Card>

            {/* Expected Points */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Database className="h-5 w-5 text-[#00FF87]" />
                  Expected Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">This Gameweek:</span>
                  <span className="font-semibold text-gray-900">6.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Gameweek:</span>
                  <span className="font-semibold text-gray-900">6.0</span>
                </div>
              </CardContent>
            </Card>

            {/* Fixtures */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <ArrowRight className="h-5 w-5 text-[#00FF87]" />
                  Upcoming Fixtures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">vs Manchester City (A)</span>
                  <Badge className="bg-[#2E0032] text-white">Difficulty 4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">vs Nottingham Forest (H)</span>
                  <Badge variant="default" className="bg-[#00FF87] text-gray-900">Difficulty 2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">vs West Ham United (A)</span>
                  <Badge variant="default" className="bg-[#00FF87] text-gray-900">Difficulty 2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">vs Sunderland (H)</span>
                  <Badge variant="default" className="bg-[#00FF87] text-gray-900">Difficulty 2</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Trend */}
          <Card className="mx-auto mt-6 max-w-3xl border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Transfer Trend This Gameweek</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-3xl font-bold text-[#00FF87]">11,500</p>
                  <p className="text-sm text-gray-600">Transfers In</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-3xl font-bold text-[#2E0032]">40,700</p>
                  <p className="text-sm text-gray-600">Transfers Out</p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Net selling pressure this week, but strong underlying metrics remain
              </p>
            </CardContent>
          </Card>

          {/* Captaincy Hint */}
          <Card className="mx-auto mt-6 max-w-3xl border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Captaincy Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Salah remains a premium asset with strong underlying metrics despite some selling pressure. 
                If you need a captain choice and already own him, you should still consider him for fixtures 
                after the City test.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-b bg-gray-50 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>How Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI </span>
              <span style={{ color: 'white' }}>Delivers This Answer</span>
            </h2>
            <p className="text-lg font-semibold" style={{ color: '#4B5563' }}>
              Behind the scenes, powerful technology works in milliseconds
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00FF87]">
                  <Database className="h-6 w-6 text-gray-900" />
                </div>
                <CardTitle className="text-xl text-gray-900">Live Data Connection</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                ChatFPL AI connects directly to the official Fantasy Premier League API, pulling real-time 
                statistics for over 700 players every gameweek. No delays, no manual updates.
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2E0032]">
                  <Zap className="h-6 w-6 text-[#00FF87]" />
                </div>
                <CardTitle className="text-xl text-gray-900">AI Processing</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Advanced language models interpret your question, understand context (current season, 
                player name, stat type), and structure a comprehensive response instantly.
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00FFFF]">
                  <TrendingUp className="h-6 w-6 text-gray-900" />
                </div>
                <CardTitle className="text-xl text-gray-900">Tactical Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                The AI doesn't just list numbers - it contextualises them with fixture difficulty, 
                transfer trends, and actionable insights like captaincy recommendations.
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 rounded-lg border-2 border-[#00FF87] bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-2xl font-bold text-gray-900">Why This Matters for FPL Managers</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-700">
                  <span className="font-semibold">Saves hours of research</span> - no more switching between 
                  multiple tabs and spreadsheets
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-700">
                  <span className="font-semibold">Always current</span> - data updates continuously, 
                  you never work with outdated information
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-700">
                  <span className="font-semibold">Comprehensive coverage</span> - every relevant stat, 
                  fixture, and trend in one answer
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF87]">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-700">
                  <span className="font-semibold">Actionable insights</span> - not just data, 
                  but what it means for your team decisions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 
            className="mb-4 text-4xl font-bold uppercase md:text-5xl"
            style={{ 
              fontFamily: "'Futura Maxi CG', sans-serif",
              WebkitTextStroke: '6px #2E0032',
              paintOrder: 'stroke fill'
            }}
          >
            <span style={{ color: 'white' }}>Ready to Ask Your </span>
            <span style={{ color: '#00FFFF' }}>Own </span>
            <span style={{ color: '#00FF86' }}>Questions</span>
            <span style={{ color: 'white' }}>?</span>
          </h2>
          <p className="mb-8 text-lg font-semibold" style={{ color: '#4B5563' }}>
            Get instant, data-driven FPL insights for any player, fixture, or strategy question. 
            Start with 5 free messages - no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/signup">Start your 5-message free trial today</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm" style={{ color: '#4B5563' }}>
            Join thousands of FPL managers using ChatFPL AI to gain a competitive edge
          </p>
        </div>
      </section>
    </div>
  )
}

