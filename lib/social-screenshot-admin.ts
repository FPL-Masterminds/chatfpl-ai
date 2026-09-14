import {
  getSocialCardCaptureToken,
  isSocialCardCaptureTokenValid,
} from "@/lib/social-card-token";
import { hubForSlot, type SocialCardSlot, type SocialHubType } from "@/lib/social-card";

const HUB_LABELS: Record<SocialHubType, string> = {
  captains: "Captain Picks",
  differentials: "Differentials",
  comparisons: "Head to Head",
  injuries: "Injuries",
  transfer_trends: "Transfer Market Trends",
  fixtures: "Fixture Difficulty",
  defcon: "DEFCON",
};

function siteOrigin(): string {
  return (process.env.NEXTAUTH_URL ?? "https://www.chatfpl.ai").replace(/\/$/, "");
}

export function getScreenshotOneAccessKey(): string {
  return process.env.SCREENSHOTONE_ACCESS_KEY?.trim() ?? "";
}

export { getSocialCardCaptureToken, isSocialCardCaptureTokenValid };

export function buildSocialCardPageUrl(
  slot: SocialCardSlot,
  token: string,
  hub?: SocialHubType,
): string {
  const params = new URLSearchParams({ slot, token });
  if (hub) params.set("hub", hub);
  return `${siteOrigin()}/internal/social-card?${params.toString()}`;
}

export function buildScreenshotOneApiUrl(pageUrl: string, accessKey: string): string {
  const params = [
    `access_key=${encodeURIComponent(accessKey)}`,
    `url=${encodeURIComponent(pageUrl)}`,
    "format=png",
    "selector=%23social-card-canvas",
    "delay=3",
    "block_ads=true",
    "block_cookie_banners=true",
    "block_trackers=true",
  ];
  return `https://api.screenshotone.com/take?${params.join("&")}`;
}

export interface SocialScreenshotSlotConfig {
  slot: SocialCardSlot;
  label: string;
  hub: SocialHubType;
  hubLabel: string;
  pageUrl: string;
  screenshotOneUrl: string;
  previewPath: string;
}

export interface SocialScreenshotAdminConfig {
  dateKey: string;
  captureToken: string;
  captureTokenConfigured: boolean;
  screenshotOneAccessKey: string;
  screenshotOneConfigured: boolean;
  slots: SocialScreenshotSlotConfig[];
  postTimes: string[];
  rotationNote: string;
}

export function getSocialScreenshotAdminConfig(dateKey?: string): SocialScreenshotAdminConfig {
  const today = dateKey ?? new Date().toISOString().slice(0, 10);
  const captureToken = getSocialCardCaptureToken();
  const accessKey = getScreenshotOneAccessKey();
  const captureTokenConfigured = captureToken.length > 0;
  const screenshotOneConfigured = accessKey.length > 0;

  const slots: SocialScreenshotSlotConfig[] = (["1", "2", "3"] as SocialCardSlot[]).map((slot, index) => {
    const hub = hubForSlot(today, slot);
    const pageUrl = captureTokenConfigured
      ? buildSocialCardPageUrl(slot, captureToken)
      : `${siteOrigin()}/internal/social-card?slot=${slot}`;

    return {
      slot,
      label: `Slot ${slot}`,
      hub,
      hubLabel: HUB_LABELS[hub],
      pageUrl,
      screenshotOneUrl: screenshotOneConfigured
        ? buildScreenshotOneApiUrl(pageUrl, accessKey)
        : "",
      previewPath: captureTokenConfigured
        ? `/internal/social-card?slot=${slot}&token=${encodeURIComponent(captureToken)}`
        : `/internal/social-card?slot=${slot}`,
    };
  });

  return {
    dateKey: today,
    captureToken,
    captureTokenConfigured,
    screenshotOneAccessKey: accessKey,
    screenshotOneConfigured,
    slots,
    postTimes: ["09:00", "14:00", "19:00"],
    rotationNote:
      "Three tweets per day. ChatFPL rotates which hub each slot shows. All seven hubs are covered over the week.",
  };
}
