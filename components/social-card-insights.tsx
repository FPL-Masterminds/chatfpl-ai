import type { SocialCardInsights as InsightsData } from "@/lib/social-card";

const GREEN = "#00FF87";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-[18px] w-[18px] shrink-0"
      style={{ color: GREEN }}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SocialCardInsights({ insights }: { insights: InsightsData }) {
  return (
    <div
      className="w-full rounded-2xl px-6 py-5"
      style={{
        border: "1px solid rgba(0,255,135,0.3)",
        background: "rgba(0,255,135,0.04)",
        borderLeft: `4px solid ${GREEN}`,
        boxShadow: "0 0 40px rgba(0,255,135,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="mb-3 text-[11px] font-black uppercase tracking-[0.24em]"
        style={{ color: GREEN }}
      >
        {insights.sectionTitle}
      </p>

      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest text-black"
          style={{ background: GREEN }}
        >
          {insights.badge}
        </span>
        <p className="min-w-0 flex-1 text-[17px] font-semibold leading-snug text-white">
          {insights.headline}
        </p>
      </div>

      <ul className="space-y-2.5">
        {insights.bullets.map((bullet) => (
          <li key={bullet.label} className="flex items-start gap-2.5">
            <CheckIcon />
            <p className="text-[16px] leading-snug text-white/85">
              <span className="font-bold text-white">{bullet.label}: </span>
              {bullet.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
