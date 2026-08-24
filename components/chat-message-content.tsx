"use client";

import React from "react";
import type { ChatModelProfile } from "@/lib/chat-model-profile";

const IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/;

function parseBold(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <strong key={`${keyPrefix}-b-${idx++}`} className="font-semibold text-white">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  if (!nodes.length) return [text.replace(/\*\*/g, "")];
  return nodes;
}

const PLAYER_PHOTO_GLOW_STYLE: React.CSSProperties = {
  height: 1,
  width: "100%",
  background:
    "linear-gradient(to right, transparent, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent)",
  boxShadow: "0 0 6px 1px rgba(255,255,255,0.28)",
};

// Chat player headshots: another 10% on prior sizes (44px / 61.6px).
const CHAT_PLAYER_PHOTO_HEIGHT_PX = {
  sm: 48.4,
  md: 67.76,
} as const;

const CHAT_PLAYER_NAME_PRICE_STYLE: React.CSSProperties = {
  fontSize: "17.6px",
  lineHeight: 1.375,
};

function PlayerPhoto({
  alt,
  url,
  size = "md",
}: {
  alt: string;
  url: string;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex shrink-0 flex-col items-stretch leading-none">
      <img
        src={url}
        alt={alt}
        className="block w-auto object-contain object-bottom"
        style={{ height: CHAT_PLAYER_PHOTO_HEIGHT_PX[size] }}
      />
      <span style={PLAYER_PHOTO_GLOW_STYLE} aria-hidden />
    </span>
  );
}

function StructuredChatMessageLine({ line }: { line: string }) {
  if (!line.trim()) return null;

  const header = line.match(/^#{1,3}\s+(.+)$/);
  if (header) {
    return (
      <div className="mt-4 mb-1 text-sm font-bold uppercase tracking-wide text-[#00FF87] first:mt-0">
        {header[1]}
      </div>
    );
  }

  const bullet = line.match(/^(\s*•\s*)/);
  const bulletPrefix = bullet?.[1] ?? "";
  let rest = bullet ? line.slice(bulletPrefix.length) : line;

  const leadingImg = rest.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*/);
  if (leadingImg) {
    const [, alt, url] = leadingImg;
    rest = rest.slice(leadingImg[0].length).trim();
    const namePrice = rest.match(/^(.+?)\s+-\s+(£[\d.]+m)\s*$/i);
    return (
      <div className="my-2 flex items-center gap-3">
        {bulletPrefix ? (
          <span className="shrink-0 text-white/85">{bulletPrefix.trim()}</span>
        ) : null}
        <PlayerPhoto alt={alt} url={url} />
        <div className="min-w-0 flex-1 text-white/85" style={CHAT_PLAYER_NAME_PRICE_STYLE}>
          {namePrice ? (
            <span className="font-semibold text-white">
              {namePrice[1]} - {namePrice[2]}
            </span>
          ) : rest ? (
            parseBold(rest, "lead")
          ) : (
            <span className="font-semibold text-white">{alt}</span>
          )}
        </div>
      </div>
    );
  }

  const inlineImg = rest.match(IMG_RE);
  if (inlineImg && inlineImg.index !== undefined && inlineImg.index > 0) {
    const before = rest.slice(0, inlineImg.index);
    const after = rest.slice(inlineImg.index + inlineImg[0].length);
    const [, alt, url] = inlineImg;
    const combined = `${before}${after}`.replace(/\s+/g, " ").trim();
    return (
      <div className="my-2 flex items-start gap-3">
        <PlayerPhoto alt={alt} url={url} size="sm" />
        <div className="min-w-0 flex-1 leading-7 text-white/85">
          {bulletPrefix}
          {parseBold(combined, "inline")}
        </div>
      </div>
    );
  }

  if (IMG_RE.test(rest)) {
    const parts = rest.split(IMG_RE);
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0 && parts[i]) nodes.push(...parseBold(parts[i], `p-${i}`));
      else if (i % 3 === 1) {
        const url = parts[i + 1];
        if (url) {
          nodes.push(
            <PlayerPhoto key={`img-${i}`} alt={parts[i]} url={url} size="sm" />,
          );
        }
        i++;
      }
    }
    return (
      <span className="leading-7 text-white/85">
        {bulletPrefix}
        {nodes}
      </span>
    );
  }

  return (
    <span className="leading-7 text-white/85">
      {bulletPrefix}
      {parseBold(rest, "plain")}
    </span>
  );
}

function renderLegacyLine(line: string, lineKey: string): React.ReactNode {
  const parts = line.split(/!\[([^\]]*)\]\(([^)]+)\)/);
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0 && parts[i]) elements.push(parts[i]);
    else if (i % 3 === 1) {
      const alt = parts[i];
      const url = parts[i + 1];
      if (url) {
        elements.push(
          <PlayerPhoto key={`${lineKey}-img-${i}`} alt={alt} url={url} />,
        );
      }
      i++;
    }
  }
  return elements;
}

function LegacyChatMessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n\n").map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {para.split("\n").map((line, j, lines) => (
            <React.Fragment key={j}>
              {renderLegacyLine(line, `${i}-${j}`)}
              {j < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
}

function StructuredChatMessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n\n").map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {para.split("\n").map((line, j, lines) => (
            <React.Fragment key={j}>
              <StructuredChatMessageLine line={line} />
              {j < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
}

export function ChatMessageContent({
  content,
  profile = "legacy",
}: {
  content: string;
  profile?: ChatModelProfile;
}) {
  if (profile === "structured") {
    return <StructuredChatMessageContent content={content} />;
  }
  return <LegacyChatMessageContent content={content} />;
}
