/** Matches the card panels in why-chatfpl.tsx ("The Edge" section). */
export function SocialCardFooter({
  tag,
  title,
  paragraph,
}: {
  tag: string;
  title: string;
  paragraph: string;
}) {
  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: "linear-gradient(90deg,#00FF87,#00FFFF,#00FF87)" }}
    >
      <div
        className="rounded-2xl px-6 py-4"
        style={{
          background: "linear-gradient(145deg,rgba(0,15,10,0.97),rgba(0,8,18,0.99))",
        }}
      >
        <span
          className="mb-2.5 inline-block rounded-full px-3.5 py-1.5 text-[14px] font-bold uppercase tracking-[0.2em]"
          style={{
            background: "rgba(0,255,135,0.1)",
            color: "#00FF87",
            border: "1px solid rgba(0,255,135,0.25)",
          }}
        >
          {tag}
        </span>

        <h3 className="mb-2 text-[34px] font-bold leading-tight text-white">{title}</h3>
        <p className="text-[30px] font-medium leading-snug text-white/80">{paragraph}</p>
      </div>
    </div>
  );
}
