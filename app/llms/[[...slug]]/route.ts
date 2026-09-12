import { getLlmHubMarkdown, markdownResponse } from "@/lib/llm-hubs"

export const runtime = "nodejs"
export const revalidate = 3600

type RouteParams = { slug?: string[] }

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> },
) {
  const { slug } = await context.params
  const slugPath = (slug ?? []).join("/")
  if (!slugPath || !slugPath.endsWith(".md")) {
    return new Response("Not found", { status: 404 })
  }

  const body = await getLlmHubMarkdown(slugPath)
  if (!body) {
    return new Response("Not found", { status: 404 })
  }

  return markdownResponse(body)
}
