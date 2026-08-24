"use client"

type SeasonStoryMessagePanelProps = {
  titleWhite: string
  titleGradient: string
  body: string
  action?: { label: string; onClick: () => void }
}

export function SeasonStoryMessagePanel({
  titleWhite,
  titleGradient,
  body,
  action,
}: SeasonStoryMessagePanelProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        padding: "1px",
        background:
          "linear-gradient(90deg,#00FF87,rgba(255,255,255,0.15),#00FFFF,rgba(255,255,255,0.15),#00FF87)",
        backgroundSize: "220% 220%",
        animation: "glow_scroll 4s linear infinite",
      }}
    >
      <div className="relative rounded-2xl bg-black px-6 py-10 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,135,0.10), transparent)",
          }}
        />
        <div className="relative max-w-md mx-auto">
          <h3 className="text-2xl font-bold tracking-tight leading-tight">
            <span className="text-white">{titleWhite}</span>
            {titleGradient ? (
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to right, #00ff85, #02efff)",
                  WebkitBackgroundClip: "text",
                }}
              >
                {titleGradient}
              </span>
            ) : null}
          </h3>
          <p className="text-sm text-white/55 mt-3 leading-relaxed">{body}</p>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
              style={{ background: "linear-gradient(to right, #00FF87, #00FFFF)" }}
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
