export function getSocialCardCaptureToken(): string {
  return process.env.SOCIAL_CARD_CAPTURE_TOKEN?.trim() ?? "";
}

export function isSocialCardCaptureTokenValid(token: string | undefined): boolean {
  const secret = getSocialCardCaptureToken();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return token === secret;
}
