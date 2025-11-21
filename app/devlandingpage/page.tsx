import Link from "next/link"
import Image from "next/image"
import { DevHeader } from "@/components/dev-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  MessageSquare,
  Zap,
  Target,
  Users,
  Check,
  Star
} from "lucide-react"

export const metadata = {
  title: "Dev Landing Page - ChatFPL AI",
  description: "Test landing page for new design",
}

export default function DevLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1A0E24]">
      <DevHeader />

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-[#1A0E24]"
      >
        {/* Animated Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#37003c]/40 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00ff85]/20 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#05f0ff]/20 blur-[100px]"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Headline & CTA */}
            <div className="text-center lg:text-left space-y-8">
              <h1 className="text-balance font-bold leading-[1.1] tracking-tighter text-white" style={{ fontSize: '60px' }}>
                Chat with your{" "}
                <span 
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #00ff85, #02efff, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Fantasy Premier League AI Assistant
                </span>
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Ask live FPL questions. Get instant AI answers powered by real stats 
                and natural conversation. Dominate your mini-league with data-driven insights.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/signup"
                  className="px-8 py-4 rounded-full bg-[#00ff85] text-[#1a0e24] font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,133,0.5)]"
                  style={{
                    boxShadow: '0 0 20px rgba(0,255,133,0.3)'
                  }}
                >
                  Start Free Trial
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:bg-white/10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  View Features
                </Link>
              </div>
              
              <p className="text-sm text-gray-500">
                No credit card required • Instant access
              </p>
            </div>

            {/* Right Column - Glass Chat Interface */}
            <div className="relative">
              {/* Floating Badge */}
              <div 
                className="absolute -top-5 right-0 sm:-right-5 px-4 py-2 rounded-lg text-sm font-bold text-[#00ff85] animate-bounce z-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,255,133,0.3)',
                  boxShadow: '0 0 15px rgba(0,255,133,0.2)'
                }}
              >
                Live Stats ⚡
              </div>

              {/* Chat Window */}
              <div 
                className="relative rounded-2xl shadow-2xl overflow-hidden transition-transform duration-500 hover:rotate-1"
                style={{
                  background: '#1E1525',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Header */}
                <div 
                  className="bg-white/5 border-b p-4 flex items-center justify-between"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">AI Analysis Mode</div>
                </div>

                {/* Chat Body */}
                <div className="p-6 h-[440px] sm:h-[400px] mb-6 sm:mb-0 flex flex-col gap-4" style={{ background: '#1E1525' }}>
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div 
                      className="p-4 rounded-2xl rounded-tr-none max-w-[80%] shadow-lg text-[#1a0e24] font-semibold"
                      style={{
                        backgroundImage: 'linear-gradient(to bottom right, #00ff85, #10b981)'
                      }}
                    >
                      How many bonus points has Jack Grealish won?
                    </div>
                    <div 
                      className="ml-3 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
                      style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <Users className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="flex justify-start mt-4">
                    <div 
                      className="mr-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        backgroundImage: 'linear-gradient(to bottom right, #9333ea, #6366f1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div 
                      className="p-4 rounded-2xl rounded-tl-none max-w-[80%] text-gray-100 shadow-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Player Card */}
                        <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 bg-black">
                          {/* Background Layer */}
                          <Image
                            src="/club_backgrounds/bg_Everton.png"
                            alt="Player Stats"
                            fill
                            className="object-cover object-center opacity-80"
                            style={{ objectFit: 'cover', zIndex: 1 }}
                          />
                          
                          {/* Player Image Layer - Positioned Right */}
                          <div className="absolute inset-0 flex items-end justify-end" style={{ zIndex: 2 }}>
                            <div className="relative h-full w-20 sm:w-28">
                              <Image
                                src="/player_images/jack_grealish.png"
                                alt="Jack Grealish"
                                fill
                                className="object-contain object-bottom"
                                style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
                              />
                            </div>
                          </div>
                          
                          {/* Gradient Overlay Layer */}
                          <div 
                            className="absolute inset-0"
                            style={{
                              backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                              zIndex: 3
                            }}
                          />
                          
                          {/* Text Layer - Positioned Left */}
                          <div className="absolute inset-0 flex items-end p-3" style={{ zIndex: 4 }}>
                            <span className="text-white">
                              <span className="font-bold" style={{ fontFamily: "'Futura Maxi CG', sans-serif" }}>Jack Grealish</span>
                              <span style={{ fontFamily: "'Myriad Pro', sans-serif" }}> | MID</span>
                            </span>
                          </div>
                        </div>
                        <p className="leading-relaxed text-sm pb-2">
                          Jack Grealish has an expected points (xP) of 5.4 for the next gameweek against Fulham. His creativity stats are in the top 5% of midfielders over the last 3 matches.
                          <span className="animate-pulse inline-block w-1.5 h-4 bg-[#00ff85] ml-1 align-middle"></span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div 
                  className="p-4 border-t bg-white/5"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask about transfers, stats, or fixtures..."
                      className="w-full bg-black/30 rounded-xl py-3 px-4 pr-12 text-sm text-gray-200 focus:outline-none transition-colors"
                      style={{ 
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      disabled
                    />
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-[#00ff85] rounded-lg text-[#1a0e24] transition-colors hover:bg-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section id="examples" className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Ask </span>
              <span style={{ color: '#A855F7' }}>ChatFPL AI</span>
            </h2>
            <p className="text-lg text-gray-300">
              Get instant, data-driven answers to any FPL question. Here are some examples of what 
              our power users are asking right now.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {/* Question Card 1 - Mohamed Salah */}
            <Link href="/mohamed-salah-statistics" className="group block">
              <div className="border border-gray-700 rounded-lg bg-[#1A1329] p-4 flex items-center gap-4 transition-all hover:border-[#00FF87]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00FF87]/10 shrink-0">
                  <TrendingUp className="h-6 w-6 text-[#00FF87]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">STATS</span>
                    <span className="text-xs text-gray-600">• Player Research</span>
                  </div>
                  <h3 className="text-base font-normal text-white group-hover:text-[#00FF87] transition-colors">
                    "Give me some live statistics about Mohamed Salah this season."
                  </h3>
                </div>
                <button className="px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold hover:bg-[#00FF87] hover:text-[#1A0E24] transition-all duration-300">
                  View Answer →
                </button>
              </div>
            </Link>

            {/* Question Card 2 - Erling Haaland */}
            <Link href="/erling-haaland-price-worth-it" className="group block">
              <div className="border border-gray-700 rounded-lg bg-[#1A1329] p-4 flex items-center gap-4 transition-all hover:border-[#00FF87]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 shrink-0">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">PRICE</span>
                    <span className="text-xs text-gray-600">• Price Analysis</span>
                  </div>
                  <h3 className="text-base font-normal text-white group-hover:text-[#00FF87] transition-colors">
                    "Is Erling Haaland worth his price this season given current form?"
                  </h3>
                </div>
                <button className="px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold hover:bg-[#00FF87] hover:text-[#1A0E24] transition-all duration-300">
                  View Answer →
                </button>
              </div>
            </Link>

            {/* Question Card 3 - Jack Grealish */}
            <Link href="/jack-grealish-everton-fixtures" className="group block">
              <div className="border border-gray-700 rounded-lg bg-[#1A1329] p-4 flex items-center gap-4 transition-all hover:border-[#00FF87]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">STRATEGY</span>
                    <span className="text-xs text-gray-600">• Fixtures</span>
                  </div>
                  <h3 className="text-base font-normal text-white group-hover:text-[#00FF87] transition-colors">
                    "Which teams have the best fixture run over the next 6 gameweeks?"
                  </h3>
                </div>
                <button className="px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold hover:bg-[#00FF87] hover:text-[#1A0E24] transition-all duration-300">
                  View Answer →
                </button>
              </div>
            </Link>

            {/* Question Card 4 - Antoine Semenyo */}
            <Link href="/antoine-semenyo-budget-midfielder" className="group block">
              <div className="border border-gray-700 rounded-lg bg-[#1A1329] p-4 flex items-center gap-4 transition-all hover:border-[#00FF87]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 shrink-0">
                  <ArrowRight className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">TRANSFERS</span>
                    <span className="text-xs text-gray-600">• Transfer Advice</span>
                  </div>
                  <h3 className="text-base font-normal text-white group-hover:text-[#00FF87] transition-colors">
                    "Is Antoine Semenyo a good budget midfield option?"
                  </h3>
                </div>
                <button className="px-4 py-2 rounded-full bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/50 text-sm font-semibold hover:bg-[#00FF87] hover:text-[#1A0E24] transition-all duration-300">
                  View Answer →
                </button>
              </div>
            </Link>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90">
              <Link href="/signup">Start your 5-message free trial today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Everything You Need For </span>
              <span style={{ color: '#00FF87' }}>FPL Success</span>
            </h2>
            <p className="text-lg text-gray-300">
              Powered by real-time data and AI intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#00FF87]">
                    <Image
                      src="/placeholder.jpg"
                      alt="Live Data"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#00FF87]/20">
                      <Zap className="h-8 w-8 text-[#00FF87]" />
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">Live Data</h3>
                <p className="mb-4 text-sm text-[#00FF87] font-semibold">
                  Give me some live data on Erling Haaland
                </p>
                <p className="text-sm text-gray-400">
                  Connects to the official FPL API for real-time stats, fixtures, and player performance data.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#A855F7]">
                    <Image
                      src="/placeholder.jpg"
                      alt="Expert Knowledge"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#A855F7]/20">
                      <Target className="h-8 w-8 text-[#A855F7]" />
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">Expert Knowledge</h3>
                <p className="mb-4 text-sm text-[#00FF87] font-semibold">
                  Who should I captain: Haaland or Salah?
                </p>
                <p className="text-sm text-gray-400">
                  Enhanced with FPL rules, strategy guides, and expert insights to give you the best advice.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#00FFFF]">
                    <Image
                      src="/placeholder.jpg"
                      alt="Natural Chat"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#00FFFF]/20">
                      <MessageSquare className="h-8 w-8 text-[#00FFFF]" />
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">Natural Chat</h3>
                <p className="mb-4 text-sm text-[#00FF87] font-semibold">
                  Should I take a hit for a double gameweek?
                </p>
                <p className="text-sm text-gray-400">
                  Ask anything from 'Who to captain' to 'Compare Salah vs Son' in plain English.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>What </span>
              <span style={{ color: '#00FFFF' }}>Users Say</span>
            </h2>
            <p className="text-lg text-gray-300">
              Real feedback from FPL managers using ChatFPL AI
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src="/placeholder.jpg"
                      alt="Ryan Anderson"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">Ryan Anderson</h4>
                <Badge className="mb-3 bg-[#00FF87] text-gray-900 text-xs">PREMIUM SUBSCRIBER</Badge>
                <p className="text-sm italic text-gray-300">
                  "I asked ChatFPL AI for a detailed player comparison between Haaland and Joao Pedro. 
                  It gave me expected goals, form trends, and fixture difficulty - exactly what I needed."
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src="/placeholder.jpg"
                      alt="Oliver Hughes"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">Oliver Hughes</h4>
                <Badge className="mb-3 bg-[#00FFFF] text-gray-900 text-xs">CONTENT CREATOR</Badge>
                <p className="text-sm italic text-gray-300">
                  "I use ChatFPL AI to write my FPL YouTube scripts. It analyses the data and helps me 
                  create engaging content about captain picks and differentials in minutes."
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src="/placeholder.jpg"
                      alt="Daniel Brown"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
                <h4 className="mb-1 font-semibold text-white">Daniel Brown</h4>
                <Badge className="mb-3 bg-[#A855F7] text-white text-xs">ELITE SUBSCRIBER</Badge>
                <p className="text-sm italic text-gray-300">
                  "Every gameweek I ask for transfer suggestions based on my team. ChatFPL AI considers 
                  fixtures, form, and my budget to give me 3-4 solid options with reasoning."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-b border-gray-800 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Simple </span>
              <span style={{ color: '#00FF87' }}>Transparent </span>
              <span style={{ color: '#A855F7' }}>Pricing</span>
            </h2>
            <p className="text-lg text-gray-300">
              Choose the plan that fits your FPL ambitions
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Free Trial */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Free Trial</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  Perfect for trying out ChatFPL AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">5 free messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Limited support</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-700 text-white hover:bg-gray-600" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium - Most Popular */}
            <Card className="relative border-[#00FF87] bg-[#1A1329] shadow-xl shadow-[#00FF87]/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#00FF87] text-gray-900 font-bold px-4 py-1">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-white">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£19.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  For serious FPL managers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">100 messages per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Priority support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Strategy Engine</span>
                  </div>
                </div>
                <Button className="w-full bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90" asChild>
                  <Link href="/signup">Subscribe</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Elite */}
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Elite</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£49.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-400">
                  For elite FPL competitors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">500 messages per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Live FPL data access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Priority support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Early access to new features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#00FF87]" />
                    <span className="text-sm text-gray-300">Team Analysis Report</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-700 text-white hover:bg-gray-600" asChild>
                  <Link href="/signup">Subscribe</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-4xl font-bold uppercase lg:text-5xl"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Frequently </span>
              <span style={{ color: '#00FFFF' }}>Asked Questions</span>
            </h2>
            <p className="text-lg text-gray-300">
              Everything you need to know about ChatFPL AI
            </p>
          </div>

          <div className="space-y-4">
            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-lg text-white">What is ChatFPL AI?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  ChatFPL AI is an intelligent assistant designed to help Fantasy Premier League managers make 
                  better decisions using real-time data and advanced analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Can I try it for free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! You get 5 free messages to test ChatFPL AI with no credit card required. Perfect for 
                  experiencing the power of AI-driven FPL insights before subscribing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-lg text-white">How do I earn extra messages on the Free plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Free users can earn bonus messages by sharing ChatFPL AI on social media or leaving a review. 
                  Each action rewards you with additional messages to keep using the platform.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-[#1A1329]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Is the FPL data updated in real-time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! ChatFPL AI connects directly to the official Fantasy Premier League API, ensuring you 
                  always have access to the latest player stats, fixtures, and form data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

