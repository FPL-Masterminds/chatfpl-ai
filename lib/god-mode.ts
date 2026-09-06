export const GOD_MODE_EMAIL = "johnmcdermott1979@gmail.com"

/** Site owner only (johnmcdermott1979@gmail.com). Not VIP friends or role=admin drift. */
export function isSiteOwner(email: string | null | undefined): boolean {
  return email === GOD_MODE_EMAIL
}

/** @deprecated Prefer isSiteOwner for owner-only UI and APIs. */
export function isGodModeEmail(email: string | null | undefined): boolean {
  return isSiteOwner(email)
}
