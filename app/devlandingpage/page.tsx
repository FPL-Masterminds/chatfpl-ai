import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
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
    <div className="flex min-h-screen flex-col bg-[#0A0118]">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800 px-4 py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Headline & CTA */}
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-5xl font-bold leading-tight text-white lg:text-6xl">
                Chat with your{" "}
                <span className="text-[#00FFFF]">FPL</span>{" "}
                <span className="text-[#00FF87]">Assistant</span>
              </h1>
              <p className="mb-8 text-lg text-gray-300 lg:text-xl">
                Ask live FPL questions. Get instant AI answers powered by real stats 
                and natural conversation. Dominate your mini-league with data-driven insights.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button 
                  size="lg" 
                  asChild 
                  className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 text-lg px-8"
                >
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-gray-600 text-white hover:bg-gray-800 text-lg px-8"
                >
                  <Link href="#features">View Features</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                No credit card required • Instant access
              </p>
            </div>

            {/* Right Column - Chat Mockup */}
            <div className="relative">
              {/* Live Stats Badge */}
              <div className="absolute right-4 top-4 z-10 animate-bounce">
                <Badge className="bg-[#00FF87] text-gray-900 border-0 px-3 py-1 font-semibold">
                  <Zap className="mr-1 h-4 w-4" />
                  Live Stats
                </Badge>
              </div>

              {/* Chat Window */}
              <Card className="border-gray-700 bg-[#1A1329] shadow-2xl">
                <CardHeader className="border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-sm text-gray-400">AI Analysis Mode</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* User Question */}
                  <div className="flex items-start justify-end gap-3">
                    <div className="rounded-2xl rounded-tr-sm bg-[#00FF87] px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-900 font-medium">
                        How many bonus points has Jack Grealish won?
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* AI Response with Player Card */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2E0032]">
                      <Sparkles className="h-4 w-4 text-[#00FF87]" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Card className="border-gray-600 bg-[#0A0118]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                              <Image
                                src="/placeholder.jpg"
                                alt="Jack Grealish"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">Jack Grealish</h4>
                              <p className="text-sm text-gray-400">MID</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300">
                            Jack Grealish has an expected points (xP) of 5.4 for the 
                            next gameweek against Fulham. His creativity stats are in 
                            the top 5% of midfielders over the last 3 matches.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Input Box */}
              <div className="mt-4">
                <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1A1329] px-4 py-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500">Ask about transfers, stats, or fixtures...</span>
                  <Button size="sm" className="ml-auto bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Question Card 1 */}
            <Card className="border-gray-700 bg-[#1A1329] transition-all hover:border-[#00FF87]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF87]/10">
                    <TrendingUp className="h-5 w-5 text-[#00FF87]" />
                  </div>
                  <div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      STATS
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Player Research</p>
                  </div>
                </div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  "Give me some live statistics about Mohamed Salah this season."
                </h3>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-gray-600 text-[#00FF87] hover:bg-gray-800 hover:text-[#00FF87]"
                >
                  <Link href="/mohamed-salah-statistics">
                    View Answer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Question Card 2 */}
            <Card className="border-gray-700 bg-[#1A1329] transition-all hover:border-[#00FF87]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      PRICE
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Price Analysis</p>
                  </div>
                </div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  "Is Erling Haaland worth his price this season given current form?"
                </h3>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-gray-600 text-[#00FF87] hover:bg-gray-800 hover:text-[#00FF87]"
                >
                  <Link href="/erling-haaland-price-worth-it">
                    View Answer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Question Card 3 */}
            <Card className="border-gray-700 bg-[#1A1329] transition-all hover:border-[#00FF87]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      STRATEGY
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Fixtures</p>
                  </div>
                </div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  "Which teams have the best fixture run over the next 6 gameweeks?"
                </h3>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-gray-600 text-[#00FF87] hover:bg-gray-800 hover:text-[#00FF87]"
                >
                  <Link href="/best-fixtures-next-6-gameweeks">
                    View Answer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Question Card 4 */}
            <Card className="border-gray-700 bg-[#1A1329] transition-all hover:border-[#00FF87]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <ArrowRight className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      TRANSFERS
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Transfer Advice</p>
                  </div>
                </div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  "Should I transfer out Mohamed Salah for Cole Palmer?"
                </h3>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-gray-600 text-[#00FF87] hover:bg-gray-800 hover:text-[#00FF87]"
                >
                  <Link href="/salah-vs-cole-palmer-transfer">
                    View Answer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
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

