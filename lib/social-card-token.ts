export function getSocialCardToken(): string {
  return process.env.SOCIAL_CARD_TOKEN?.trim() ?? "";
}

/** @deprecated Use getSocialCardToken */
export const getSocialCardCaptureToken = getSocialCardToken;

export function isSocialCardTokenValid(token: string | undefined): boolean {
  const secret = getSocialCardToken();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return token === secret;
}

/** @deprecated Use isSocialCardTokenValid */
export const isSocialCardCaptureTokenValid = isSocialCardTokenValid;
