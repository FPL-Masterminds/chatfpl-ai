import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ConditionalFooter } from "./conditional-footer"
import { Providers } from "./providers"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/metadata"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ChatFPL.ai - AI-Powered Fantasy Premier League Assistant",
    template: "%s | ChatFPL AI",
  },
  description:
    "Get instant AI-powered Fantasy Premier League advice. Chat with live FPL data and make smarter decisions.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <ConditionalFooter />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
