import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildPageMetadata({
  title: "Sign Up",
  description:
    "Create a free ChatFPL AI account to ask live Fantasy Premier League questions powered by real FPL data.",
  path: "/signup",
})

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="sr-only">Sign up for ChatFPL AI</h1>
      {children}
    </>
  )
}
