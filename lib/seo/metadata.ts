import type { Metadata } from "next"

export const SITE_URL = "https://www.chatfpl.ai"
export const SITE_NAME = "ChatFPL AI"
export const DEFAULT_OG_IMAGE = `${SITE_URL}/ChatFPL_AI_Logo.png`
export const DEFAULT_FPL_DESCRIPTION =
  "Live Fantasy Premier League analysis, expected points, and fixture context from ChatFPL AI."

type PageMetadataInput = {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`
  const fullTitle = title.includes("ChatFPL") ? title : `${title} | ChatFPL AI`

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}

export function fallbackPageMetadata(title: string, path: string): Metadata {
  return buildPageMetadata({
    title,
    description: DEFAULT_FPL_DESCRIPTION,
    path,
  })
}
