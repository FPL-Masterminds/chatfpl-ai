"use client";

import React from "react";
import type { ChatModelProfile } from "@/lib/chat-model-profile";
import { expandCbitForReaders } from "@/lib/chat-message-format";
import { isFplPlayerPhotoUrl } from "@/lib/fpl-player-photo";

const IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/;
const BULLET_RE = /^(\s*(?:•|-)\s*)/;
const BLOCK_GAP_CLASS = "gap-3.5";

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

const CHAT_PLAYER_PHOTO_HEIGHT_PX = {
  sm: 48.4,
  md: 67.76,
} as const;

const CHAT_PLAYER_NAME_PRICE_STYLE: React.CSSProperties = {
  fontSize: "17.6px",
  lineHeight: 1.375,
};

function splitContentLines(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <strong className="block font-bold leading-7 text-white">
      {children}
    </strong>
  );
}

function isStrippedSectionTitle(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 100 || t.length < 4) return false;
  if (/£[\d.]+m/i.test(t)) return false;
  if (BULLET_RE.test(t)) return false;
  if (/[.!?]\s/.test(t)) return false;
  if (/^I['']?m\s|^You\s|^The community/i.test(t)) return false;
  return true;
}

function stripLeadingInvalidImage(rest: string): { text: string; strippedInvalid: boolean } {
  const leadingImg = rest.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*/);
  if (!leadingImg) return { text: rest, strippedInvalid: false };
  if (isFplPlayerPhotoUrl(leadingImg[2])) return { text: rest, strippedInvalid: false };
  return {
    text: rest.slice(leadingImg[0].length).trim(),
    strippedInvalid: true,
  };
}

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

function renderRichInlineContent(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(...parseBold(text.slice(last, match.index), `${keyPrefix}-t-${idx}`));
    }
    const url = match[2];
    if (isFplPlayerPhotoUrl(url)) {
      nodes.push(
        <PlayerPhoto
          key={`${keyPrefix}-img-${idx}`}
          alt={match[1]}
          url={url}
          size="sm"
        />,
      );
    } else {
      nodes.push(match[0]);
    }
    last = match.index + match[0].length;
    idx += 1;
  }
  if (last < text.length) {
    nodes.push(...parseBold(text.slice(last), `${keyPrefix}-tail`));
  }
  if (!nodes.length) return parseBold(text, keyPrefix);
  return nodes;
}

function StructuredChatMessageLine({ line }: { line: string }) {
  if (!line.trim()) return null;

  const header = line.match(/^#{1,3}\s+(.+)$/);
  if (header) {
    return <SectionHeader>{header[1]}</SectionHeader>;
  }

  const bullet = line.match(BULLET_RE);
  const bulletPrefix = bullet?.[1] ?? "";
  let rest = bullet ? line.slice(bulletPrefix.length) : line;

  const { text: afterImageStrip, strippedInvalid } = stripLeadingInvalidImage(rest);
  if (strippedInvalid) {
    rest = afterImageStrip;
    if (isStrippedSectionTitle(rest)) {
      return <SectionHeader>{rest}</SectionHeader>;
    }
  }

  const leadingImg = rest.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*/);
  if (leadingImg && isFplPlayerPhotoUrl(leadingImg[2])) {
    const [, alt, url] = leadingImg;
    rest = rest.slice(leadingImg[0].length).trim();
    const namePrice = rest.match(/^(.+?)\s+-\s+(£[\d.]+m)\s*$/i);
    return (
      <div className="flex items-center gap-3">
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
    return (
      <div className="flex items-start gap-3">
        {bulletPrefix ? (
          <span className="shrink-0 text-white/85">{bulletPrefix.trim()}</span>
        ) : null}
        <div className="min-w-0 flex-1 leading-7 text-white/85 flex flex-wrap items-center gap-x-2 gap-y-1">
          {renderRichInlineContent(rest, "inline-multi")}
        </div>
      </div>
    );
  }

  if (IMG_RE.test(rest)) {
    return (
      <div className="leading-7 text-white/85 flex flex-wrap items-center gap-x-2 gap-y-1">
        {bulletPrefix}
        {renderRichInlineContent(rest, "img-line")}
      </div>
    );
  }

  return (
    <div className="leading-7 text-white/85">
      {bulletPrefix}
      {parseBold(rest, "plain")}
    </div>
  );
}

function renderLegacyLine(line: string, lineKey: string): React.ReactNode {
  if (IMG_RE.test(line)) {
    return (
      <div className="leading-7 text-white/85 flex flex-wrap items-center gap-x-2 gap-y-1">
        {renderRichInlineContent(line, lineKey)}
      </div>
    );
  }
  return (
    <div className="leading-7 text-white/85 whitespace-pre-wrap">
      {parseBold(line, lineKey)}
    </div>
  );
}

function LegacyChatMessageContent({ content }: { content: string }) {
  const lines = splitContentLines(content);
  return (
    <div className={`flex flex-col ${BLOCK_GAP_CLASS}`}>
      {lines.map((line, i) => (
        <div key={i}>{renderLegacyLine(line, `${i}`)}</div>
      ))}
    </div>
  );
}

function StructuredChatMessageContent({ content }: { content: string }) {
  const lines = splitContentLines(content);
  return (
    <div className={`flex flex-col ${BLOCK_GAP_CLASS}`}>
      {lines.map((line, i) => (
        <div key={i}>
          <StructuredChatMessageLine line={line} />
        </div>
      ))}
    </div>
  );
}

export function ChatMessageContent({
  content,
  profile = "legacy",
}: {
  content: string;
  profile?: ChatModelProfile;
}) {
  const readable = expandCbitForReaders(content);
  if (profile === "structured") {
    return <StructuredChatMessageContent content={readable} />;
  }
  return <LegacyChatMessageContent content={readable} />;
}
