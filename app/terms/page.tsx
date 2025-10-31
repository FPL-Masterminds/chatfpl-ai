import { Header } from "@/components/header"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 
              className="mb-6 text-balance text-4xl font-bold uppercase"
              style={{ 
                fontFamily: "'Futura Maxi CG', sans-serif",
                WebkitTextStroke: '6px #2E0032',
                paintOrder: 'stroke fill'
              }}
            >
              <span style={{ color: 'white' }}>Terms </span>
              <span style={{ color: '#00FFFF' }}>Of </span>
              <span style={{ color: '#00FF86' }}>Service</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              The rules and guidelines for using ChatFPL AI
            </p>
          </div>
          <div className="prose prose-invert max-w-none space-y-6 text-foreground">
            <p className="text-lg text-muted-foreground">Last updated: January 2025</p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                By accessing and using ChatFPL AI.ai, you accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL AI.ai provides an AI-powered chatbot service that offers Fantasy Premier League advice, insights,
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
              <h2 className="text-2xl font-semibold text-foreground">6. Bonus Message Rewards Program</h2>
              <p className="leading-relaxed text-muted-foreground">
                Free tier users may earn bonus messages by participating in our rewards program, which includes social media sharing, submitting reviews, and referring friends. All reward claims are subject to manual verification by our team, except for referral rewards which are granted automatically when the referred user verifies their email.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                <strong>Reward Limits:</strong> Social rewards (X, Reddit, Facebook) can each be claimed once per account (5 messages each). Review rewards can be claimed once per account (5 or 10 messages depending on type). Referral rewards are limited to a maximum of 3 referrals per account (5 messages each). All users are subject to a lifetime cap of 50 bonus messages total, regardless of how the messages are earned. This cap ensures fair usage for all free tier users.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                <strong>Message Expiration:</strong> Bonus messages earned through the rewards program expire on your subscription renewal date. For Free tier users, this means all bonus messages must be used within your monthly billing cycle or they will be lost. Only your base plan allowance (5 trial messages for Free tier) will carry forward to the next cycle. Paid subscriptions (Premium, Elite, VIP) are not subject to message expiration and renew monthly with their full allowance.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                We reserve the right to deny or revoke reward messages at our sole discretion, including but not limited to cases where we determine that a review or social post contains negative, defamatory, or unhelpful content about our service. Rewards are intended to encourage genuine, positive engagement with ChatFPL AI.ai.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                By submitting a review or consenting to the use of your social media content, you grant ChatFPL AI.ai a non-exclusive, worldwide license to display your review, post content, username, and profile photo on our website and marketing materials. All reward claims must be made in good faith, and abuse of the rewards program may result in account suspension.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Acceptable Use</h2>
              <p className="leading-relaxed text-muted-foreground">
                You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or
                impair the service. You may not attempt to gain unauthorized access to any part of the service or its
                related systems.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL AI.ai is provided "as is" without warranties of any kind. We do not guarantee the accuracy,
                completeness, or usefulness of any information provided by the AI. Fantasy Premier League decisions are
                ultimately your responsibility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p className="leading-relaxed text-muted-foreground">
                ChatFPL AI.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via
                email or through the service. Your continued use of the service after such modifications constitutes
                acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Contact Information</h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
