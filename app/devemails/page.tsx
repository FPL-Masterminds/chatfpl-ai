import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DevHeader } from "@/components/dev-header"
import { EmailPreviewGallery } from "@/components/email-preview-gallery"
import { EMAIL_PREVIEW_DEFINITIONS, SAMPLE_PREVIEW } from "@/lib/email-content"
import { wrapEmailContent } from "@/lib/email-templates"
import { GOD_MODE_EMAIL, isGodModeEmail } from "@/lib/god-mode"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Email Templates",
  robots: { index: false, follow: false },
}

export default async function DevEmailsPage() {
  const session = await auth()
  if (!isGodModeEmail(session?.user?.email)) {
    redirect("/")
  }

  const previews = EMAIL_PREVIEW_DEFINITIONS.map((definition) => ({
    ...definition,
    html: wrapEmailContent(definition.buildBody(), {
      unsubscribeToken: definition.includeUnsubscribe ? SAMPLE_PREVIEW.unsubscribeToken : null,
    }),
  }))

  return (
    <div className="min-h-screen bg-black">
      <DevHeader />
      <EmailPreviewGallery previews={previews} />
      <p className="pb-8 text-center text-[11px] text-white/25">
        Private preview for {GOD_MODE_EMAIL} only. Not indexed.
      </p>
    </div>
  )
}
