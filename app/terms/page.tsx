import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">Terms of Service</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-foreground">
            <p className="text-lg text-muted-foreground">Last updated: January 2025</p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                By accessing and using ChatFPL.ai, you accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL.ai provides an AI-powered chatbot service that offers Fantasy Premier League advice, insights,
                and recommendations based on official FPL data and expert knowledge. The service is available through
                various subscription tiers with different usage limits.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
              <p className="leading-relaxed text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account. You agree to notify us immediately of any unauthorized use of
                your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Subscription and Payment</h2>
              <p className="leading-relaxed text-muted-foreground">
                Paid subscriptions are billed on a monthly basis. You may cancel your subscription at any time, and you
                will continue to have access until the end of your billing period. All fees are non-refundable except as
                required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Usage Limits</h2>
              <p className="leading-relaxed text-muted-foreground">
                Each subscription tier has specific message limits per day. Free accounts are limited to 5 messages per
                day, Pro accounts to 50 messages per day, and Elite accounts have unlimited messages. Limits reset daily
                at midnight UTC.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Acceptable Use</h2>
              <p className="leading-relaxed text-muted-foreground">
                You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or
                impair the service. You may not attempt to gain unauthorized access to any part of the service or its
                related systems.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Disclaimer of Warranties</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL.ai is provided "as is" without warranties of any kind. We do not guarantee the accuracy,
                completeness, or usefulness of any information provided by the AI. Fantasy Premier League decisions are
                ultimately your responsibility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Changes to Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via
                email or through the service. Your continued use of the service after such modifications constitutes
                acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Contact Information</h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
