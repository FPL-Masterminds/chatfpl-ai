import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { StripeCheckoutButton } from "@/components/stripe-checkout-button"
import { Database, Brain, MessageSquare, Check, Star, User } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <HeroSection />

      {/* Example Questions Section */}
      <section className="bg-white py-24 border-b border-gray-100">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Ask Chat</span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>AI</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              Get instant, data-driven answers to any FPL question. Here are some examples you can try right now.
            </p>
          </div>

          {/* Questions Table */}
          <div className="mx-auto max-w-6xl">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Subject</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Question</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Row 1 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/mohamed_salah.png"
                          alt="Mohamed Salah"
                          width={40}
                          height={51}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Player Research
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Give me some live statistics about Mohamed Salah this season.
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/mohamed-salah-statistics">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/erling_haaland.png"
                          alt="Erling Haaland"
                          width={40}
                          height={51}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Price
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Is Erling Haaland worth his price this season?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/erling-haaland-price-worth-it">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/arsenal_emblem.png"
                          alt="Arsenal"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Player Research
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Which Arsenal defender should I bring in for the next 5 gameweeks?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/arsenal-defender-next-5-gameweeks">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Image 
                            src="/player_images/mohamed_salah.png"
                            alt="Mohamed Salah"
                            width={40}
                            height={51}
                          />
                          <Image 
                            src="/player_images/cole_palmer.png"
                            alt="Cole Palmer"
                            width={40}
                            height={51}
                            className="-ml-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Compare
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Should I transfer out Mohamed Salah for Cole Palmer?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/salah-vs-cole-palmer-transfer">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Fixtures
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Give me three differential midfielders under £7.5m with good fixtures
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/differential-midfielders-under-7-5m">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Form
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Which players are in the best form right now?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/best-form-players">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 7 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/jack_grealish.png"
                          alt="Jack Grealish"
                          width={40}
                          height={51}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Form / Fixtures
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Is Jack Grealish a good pick with Everton&apos;s upcoming fixtures?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/jack-grealish-everton-fixtures">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 8 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Rules
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        What happens if I take a points hit this week?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/points-hit-explained">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 9 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/antoine_semenyo.png"
                          alt="Antoine Semenyo"
                          width={40}
                          height={51}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Player Research
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Is Antoine Semenyo a good budget midfield option?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/antoine-semenyo-budget-midfielder">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 10 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/player_images/danny_welbeck.png"
                          alt="Danny Welbeck"
                          width={40}
                          height={51}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Points
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        How many points has Danny Welbeck scored in his last 5 games?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/danny-welbeck-last-5-games">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 11 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Fixtures
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Which teams have the best fixture run over the next 6 gameweeks?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/best-fixture-run-6-gameweeks">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 12 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Image 
                            src="/player_images/virgil.png"
                            alt="Virgil van Dijk"
                            width={40}
                            height={51}
                          />
                          <Image 
                            src="/player_images/gabriel.png"
                            alt="Gabriel"
                            width={40}
                            height={51}
                            className="-ml-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Compare
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Compare Virgil van Dijk with Gabriel for the next 5 games
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/van-dijk-vs-gabriel-comparison">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 13 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Expected Points
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Who has the highest expected points in the next gameweek?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/highest-expected-points-next-gameweek">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 14 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Player Research
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Best defenders under £4.5m with high clean sheet potential
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/best-defenders-under-4-5m">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 15 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Chip Advice
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        When is the best time to play my Bench Boost chip?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/bench-boost-chip-timing">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 16 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Image 
                            src="/player_images/erling_haaland.png"
                            alt="Erling Haaland"
                            width={40}
                            height={51}
                          />
                          <Image 
                            src="/player_images/joao_pedro.png"
                            alt="Joao Pedro"
                            width={40}
                            height={51}
                            className="-ml-2"
                          />
                          <Image 
                            src="/player_images/alexander_isak.png"
                            alt="Alexander Isak"
                            width={40}
                            height={51}
                            className="-ml-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Compare
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Haaland vs Joao Pedro vs Isak - who&apos;s the best forward pick?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/haaland-pedro-isak-comparison">View Answer</Link>
                        </Button>
                      </td>
                    </tr>

                    {/* Row 17 */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image 
                          src="/logo.png"
                          alt="ChatFPL AI"
                          width={40}
                          height={40}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          Transfers
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Who are the Top 10 most transferred in players this week?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          size="sm" 
                          className="bg-[#00FF87] text-gray-900 hover:bg-[#00FF87]/90 font-semibold"
                          asChild
                        >
                          <Link href="/top-10-most-transferred-in-players">View Answer</Link>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Main CTA */}
            <div className="mt-12 text-center">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">Start your 5-message free trial today</Link>
              </Button>
              <p className="mt-4 text-sm text-gray-600">
                No credit card required • Instant access • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Everything you need for </span>
              <span style={{ color: '#00FFFF' }}>FPL </span>
              <span style={{ color: '#00FF86' }}>success</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg font-semibold" style={{ color: '#4B5563' }}>
              Powered by real-time data and AI intelligence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 - Live Data */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Live_Data.png"
                    alt="Live Data"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Live Data
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  Real-time FPL Q&A
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connects to the official FPL API for real-time stats, fixtures, and player performance data.
                </p>
              </div>
            </Card>

            {/* Card 2 - Expert Knowledge */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Expert_Knowledge.png"
                    alt="Expert Knowledge"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Expert Knowledge
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  AI-powered FPL expertise
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enhanced with FPL rules, strategy guides, and expert insights to give you the best advice.
                </p>
              </div>
            </Card>

            {/* Card 3 - Natural Chat */}
            <Card className="border-0 bg-white shadow-md">
              <div className="p-6">
                <div className="aspect-[4/3] relative flex items-center justify-center rounded-lg overflow-hidden">
                  <Image 
                    src="/Natural_Chat.png"
                    alt="Natural Chat"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Natural Chat
                </h3>
                <p className="mb-3 text-sm font-semibold" style={{ color: '#4B5563' }}>
                  Conversational AI assistant
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask anything from "Who to captain?" to "Compare Salah vs Son" in plain English.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Simple </span>
              <span style={{ color: '#00FFFF' }}>transparent </span>
              <span style={{ color: '#00FF86' }}>pricing</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg font-semibold" style={{ color: '#4B5563' }}>
              Choose the plan that fits your FPL ambitions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Trial */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Free Trial</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£0</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">Perfect for trying out ChatFPL AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">5 free messages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FF86' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Limited support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full hover:opacity-90" 
                  style={{ backgroundColor: '#00FF86', color: '#2E0032' }}
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 bg-white shadow-lg" style={{ borderColor: '#2E0032' }}>
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: '#2E0032', color: '#FFFFFF' }}
              >
                Most Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Premium Subscription</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£19.99</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">For serious FPL managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">100 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#2E0032' }}>
                      <Check className="h-4 w-4" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <StripeCheckoutButton
                  plan="Premium"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: '#2E0032', color: '#FFFFFF' }}
                />
              </CardFooter>
            </Card>

            {/* Elite Plan */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Elite Subscription</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">£49.99</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4 text-base">For elite FPL competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">500 messages per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Live FPL data access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#00FFFF' }}>
                      <Check className="h-4 w-4" style={{ color: '#2E0032' }} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <StripeCheckoutButton
                  plan="Elite"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: '#00FFFF', color: '#2E0032' }}
                />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 
              className="mb-4 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '7px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Frequently </span>
              <span style={{ color: '#00FFFF' }}>asked </span>
              <span style={{ color: '#00FF86' }}>questions</span>
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg font-semibold" style={{ color: '#4B5563' }}>
              Everything you need to know about ChatFPL AI
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What is ChatFPL AI?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ChatFPL AI is your intelligent Fantasy Premier League assistant powered by artificial intelligence and real-time FPL data. Simply ask any question about players, transfers, captains, fixtures, or strategy, and receive instant, data-driven answers to help you make smarter FPL decisions and climb the rankings.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I try it for free?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Our Free plan includes 5 trial messages to experience ChatFPL AI with no credit card required. You can upgrade at any time or complete simple tasks to earn additional messages.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  How do I earn extra messages on the Free plan?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Free users can earn bonus messages by completing simple tasks like sharing ChatFPL AI on social media (X, Facebook, Reddit) or leaving a review. Each task rewards you with additional messages, up to a lifetime cap of 50 bonus messages. Visit your dashboard to see available rewards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What type of FPL questions can I ask?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  You can ask anything FPL-related: player statistics, captain picks, transfer advice, fixture analysis, differential suggestions, chip strategy, rule clarifications, price predictions, ownership trends, and much more. ChatFPL AI provides instant, data-driven answers backed by real-time Premier League data.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  How often is the FPL data updated?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ChatFPL AI uses live Fantasy Premier League data that updates continuously. Player prices update daily at 1:30 AM UK time, match statistics update within hours of the final whistle, and injury news is refreshed as official team announcements are made. You're always getting the most current information available.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Do unused messages roll over to the next month?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, unused messages do not carry over. Premium users receive 100 messages each month, and Elite users receive 500 messages per month. Your message allowance resets on your renewal date, so make sure to use your messages before they expire.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What happens if I run out of messages?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  If you've used all your messages for the current period, you can upgrade to a higher plan for more messages, or wait until your next renewal date when your allowance resets. Free users can also earn bonus messages by completing social sharing tasks.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  What's the difference between Premium and Elite?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Premium gives you 100 messages per month for £19.99, perfect for regular FPL managers who want consistent support throughout the season. Elite offers 500 messages per month for £49.99, ideal for dedicated players, content creators, or those managing multiple teams who need extensive research capabilities.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I cancel my subscription at any time?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! You can cancel your Premium or Elite subscription at any time from your account dashboard. Your access will continue until the end of your current billing period, and you won't be charged again. No cancellation fees or penalties.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I use ChatFPL AI during gameweeks?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! ChatFPL AI is available 24/7, including during live gameweeks. You can get last-minute captain advice before the deadline, check injury updates, analyse fixture swings, or plan your transfers for the following week. The AI is always ready when you need it.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Does ChatFPL AI guarantee I'll climb the rankings?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  While ChatFPL AI provides data-driven insights and analysis to support better decisions, FPL involves unpredictability that no tool can eliminate. We give you the information edge - form trends, expected stats, fixture analysis - but ultimately, player performance and your strategic decisions determine your rank.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-12" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Can I ask follow-up questions?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Each conversation with ChatFPL AI is contextual, meaning you can ask follow-up questions that build on previous answers. For example, after asking about Mohamed Salah's stats, you can immediately ask "Should I captain him?" or "Compare him with Son Heung-min." Each follow-up costs one message.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-13" className="rounded-lg border border-border bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  Is there a limit to how long my questions can be?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  While there's no strict character limit, we recommend keeping questions clear and concise for the best results. Instead of asking multiple questions in one message, break them into separate queries. For example, ask "Who should I captain?" first, then follow up with "What about transfers?" This helps the AI provide more focused, accurate responses.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  )
}
