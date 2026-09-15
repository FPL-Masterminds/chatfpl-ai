/** Site-wide product CTA labels. Keep button copy limited to these phrases. */
export const CTA_ASK = "Ask ChatFPL AI"
export const CTA_TRY_FREE = "Try ChatFPL AI Free"
export const CTA_GET_STARTED = "Get Started"
export const CTA_SUBSCRIBE = "Subscribe"

export function resolveProductCta(
  isAuthenticated: boolean,
  chatQuery?: string,
): { label: string; href: string } {
  if (isAuthenticated) {
    const href = chatQuery
      ? `/chat?q=${encodeURIComponent(chatQuery)}`
      : "/chat"
    return { label: CTA_ASK, href }
  }

  return { label: CTA_TRY_FREE, href: "/signup" }
}
