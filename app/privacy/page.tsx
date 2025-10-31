import { Header } from "@/components/header"

export default function PrivacyPage() {
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
              <span style={{ color: 'white' }}>Privacy </span>
              <span style={{ color: '#00FFFF' }}>Policy</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg font-semibold" style={{ color: '#4B5563' }}>
              How we protect and handle your data
            </p>
          </div>
          <div className="prose prose-invert max-w-none space-y-6 text-foreground">
            <p className="text-lg text-muted-foreground">Last updated: January 2025</p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              <p className="leading-relaxed text-muted-foreground">
                We collect information you provide directly to us, including your name, email address, and payment
                information when you create an account or subscribe to our service. We also collect information about
                your usage of the service, including your chat messages and interaction patterns.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="leading-relaxed text-muted-foreground">
                We use the information we collect to provide, maintain, and improve our service, process your
                transactions, send you technical notices and support messages, and respond to your comments and
                questions. We may also use your chat data to improve our AI models and service quality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Information Sharing</h2>
              <p className="leading-relaxed text-muted-foreground">
                We do not sell your personal information. We may share your information with third-party service
                providers who perform services on our behalf, such as payment processing and analytics. We may also
                share information when required by law or to protect our rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
              <p className="leading-relaxed text-muted-foreground">
                We take reasonable measures to protect your information from unauthorized access, use, or disclosure.
                However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Data Retention</h2>
              <p className="leading-relaxed text-muted-foreground">
                We retain your account information for as long as your account is active or as needed to provide you
                services. We will retain and use your information as necessary to comply with legal obligations, resolve
                disputes, and enforce our agreements.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
              <p className="leading-relaxed text-muted-foreground">
                You have the right to access, update, or delete your personal information at any time through your
                account settings. You may also request a copy of your data or ask us to delete your account entirely.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Cookies and Tracking</h2>
              <p className="leading-relaxed text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                sent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Third-Party Services</h2>
              <p className="leading-relaxed text-muted-foreground">
                Our service may contain links to third-party websites or services. We are not responsible for the
                privacy practices of these third parties. We encourage you to read their privacy policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Children's Privacy</h2>
              <p className="leading-relaxed text-muted-foreground">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If you are a parent or guardian and believe your child has provided
                us with personal information, please contact us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Changes to Privacy Policy</h2>
              <p className="leading-relaxed text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
