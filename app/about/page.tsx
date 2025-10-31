import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Brain, Zap, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">About ChatFPL AI.ai</h1>
            <p className="text-lg text-muted-foreground">
              Your AI-powered Fantasy Premier League assistant, built by FPL enthusiasts for FPL managers
            </p>
          </div>

          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground">Our Mission</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL AI.ai was created to help Fantasy Premier League managers make smarter, data-driven decisions. We
                combine the power of artificial intelligence with real-time FPL data to provide instant, personalized
                advice that helps you climb the rankings.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-semibold text-foreground">How It Works</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Database className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Real-Time Data</CardTitle>
                    <CardDescription>
                      We connect directly to the official Fantasy Premier League API to access live player stats,
                      fixtures, and performance data.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Brain className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>AI Intelligence</CardTitle>
                    <CardDescription>
                      Our AI is trained on FPL rules, strategy guides, and expert insights to provide accurate,
                      contextual advice.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Zap className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Instant Answers</CardTitle>
                    <CardDescription>
                      Ask questions in plain English and get immediate responses. No need to dig through spreadsheets or
                      multiple websites.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Community Driven</CardTitle>
                    <CardDescription>
                      Built by FPL managers who understand the game. We continuously improve based on user feedback and
                      community insights.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-semibold text-foreground">Why Choose ChatFPL AI.ai?</h2>
              <p className="leading-relaxed text-muted-foreground">
                Fantasy Premier League is complex, with hundreds of players, constantly changing fixtures, and endless
                statistics to analyze. ChatFPL AI.ai simplifies this by giving you a conversational interface to explore
                data, compare players, and get strategic advice tailored to your team.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Whether you're deciding on your captain, planning transfers, or analyzing upcoming fixtures, ChatFPL AI.ai
                is your 24/7 FPL assistant ready to help you make better decisions and enjoy the game more.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
