import Link from "next/link"
import { FPL_TEAM_ID_CHAT_BANNER, FPL_TEAM_ID_SETTINGS_URL } from "@/lib/chat-team-id-guidance"

export function ChatTeamIdBanner() {
  return (
    <div className="mb-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3">
      <p className="text-xs leading-relaxed text-white/80">
        {FPL_TEAM_ID_CHAT_BANNER}{" "}
        <Link
          href="/admin"
          className="font-semibold text-[#00FF87] underline underline-offset-2 hover:text-emerald-300"
        >
          Open Settings
        </Link>
        {" "}
        <span className="text-white/45">({FPL_TEAM_ID_SETTINGS_URL.replace("https://www.", "")})</span>
      </p>
    </div>
  )
}
