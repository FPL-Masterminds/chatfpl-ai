import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildPageMetadata({
  title: "Log In",
  description:
    "Sign in to ChatFPL AI to access your FPL chat history, squad tools, and premium features.",
  path: "/login",
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="sr-only">Log in to ChatFPL AI</h1>
      {children}
    </>
  )
}
