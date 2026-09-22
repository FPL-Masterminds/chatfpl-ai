import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "scripts/google-apps-script/chatfpl-text-tweets/Code.gs",
  );
  const body = readFileSync(filePath, "utf8");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
