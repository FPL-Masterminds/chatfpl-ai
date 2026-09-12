import { buildLlmsTxt, markdownResponse } from "@/lib/llm-hubs"

export const runtime = "nodejs"
export const revalidate = 3600

export async function GET() {
  return markdownResponse(buildLlmsTxt())
}
