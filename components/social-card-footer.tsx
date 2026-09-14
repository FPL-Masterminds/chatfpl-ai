import type { SocialCardSlot } from "@/lib/social-card";

/** Matches the card panels in why-chatfpl.tsx ("The Edge" section). */
export function SocialCardFooter({
  tag,
  title,
  paragraph,
  slot,
}: {
  tag: string;
  title: string;
  paragraph: string;
  slot: SocialCardSlot;
}) {
  const number = slot === "1" ? "01" : slot === "2" ? "02" : "03";

  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)" }}
    >
      <div
        className="rounded-2xl px-7 py-6"
        style={{
          background: "linear-gradient(145deg,rgba(0,15,10,0.97),rgba(0,8,18,0.99))",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "rgba(0,255,135,0.1)",
              color: "#00FF87",
              border: "1px solid rgba(0,255,135,0.25)",
            }}
          >
            {tag}
          </span>
          <span
            className="text-5xl font-black leading-none tabular-nums"
            style={{
              background: "linear-gradient(to right,#00FF87,#00FFFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.04em",
            }}
          >
            {number}
          </span>
        </div>

        <h3 className="mb-3 text-[22px] font-bold leading-tight text-white">{title}</h3>
        <p className="text-[17px] leading-relaxed text-white/55">{paragraph}</p>
      </div>
    </div>
  );
}
