export type ClientRequestMeta = {
  ipAddress: string | null
  userAgent: string | null
}

export function getClientRequestMeta(request: Request): ClientRequestMeta {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnecting = request.headers.get("cf-connecting-ip")

  let ipAddress: string | null = null
  if (forwarded) {
    ipAddress = forwarded.split(",")[0]?.trim() || null
  } else if (realIp) {
    ipAddress = realIp.trim()
  } else if (cfConnecting) {
    ipAddress = cfConnecting.trim()
  }

  const userAgent = request.headers.get("user-agent")

  return {
    ipAddress,
    userAgent: userAgent?.slice(0, 512) ?? null,
  }
}
