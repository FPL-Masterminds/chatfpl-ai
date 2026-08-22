import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Unsubscribed — ChatFPL.ai",
  description: "You've been unsubscribed from ChatFPL AI product emails.",
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid + green glow, matching the verify-email page */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,255,135,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl p-[1px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,255,135,0.35) 0%, rgba(0,207,255,0.15) 50%, rgba(0,255,135,0.1) 100%)",
        }}
      >
        <div className="bg-[#080808] rounded-2xl overflow-hidden">
          <div className="flex justify-center pt-8 pb-4">
            <Link href="/">
              <Image
                src="/ChatFPL_AI_Logo.png"
                alt="ChatFPL AI"
                width={40}
                height={40}
                className="h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          <div className="px-8 pb-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-white">
              You&apos;re unsubscribed
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              We won&apos;t send you any more product or marketing emails from
              ChatFPL AI. Account emails (verification, password resets,
              billing) are unaffected and will still come through.
            </p>
            <div className="pt-2 space-y-2">
              <Link
                href="/admin"
                className="block rounded-full px-6 py-2.5 text-sm font-semibold text-black"
                style={{
                  background: "linear-gradient(to right,#00FF87,#00CFFF)",
                }}
              >
                Change your mind? Manage email preferences
              </Link>
              <Link
                href="/"
                className="block rounded-full px-6 py-2 text-sm font-semibold text-[#00FF87] border border-[#00FF87]/40 hover:bg-[#00FF87]/10"
              >
                Back to ChatFPL AI
              </Link>
            </div>
            <p className="text-[11px] text-white/40">
              The &quot;Manage email preferences&quot; button takes you to your
              account (log in first if you aren&apos;t already) where you can
              flip a single toggle to opt back in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
