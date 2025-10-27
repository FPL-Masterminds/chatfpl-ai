import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ConditionalFooter } from "./conditional-footer"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChatFPL.ai - AI-Powered Fantasy Premier League Assistant",
  description:
    "Get instant AI-powered Fantasy Premier League advice. Chat with live FPL data and make smarter decisions.",
  generator: "v0.app",
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
