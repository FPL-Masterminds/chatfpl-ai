import { NextResponse } from "next/server";
import { getChatModelLabel, getChatModelProfile } from "@/lib/chat-model-profile";

export async function GET() {
  return NextResponse.json({
    model: getChatModelLabel(),
    profile: getChatModelProfile(),
  });
}
