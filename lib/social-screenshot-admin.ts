import { getSocialCardToken } from "@/lib/social-card-token";
import { getSocialCardData, hubForSlot, type SocialCardSlot, type SocialHubType } from "@/lib/social-card";

const HUB_LABELS: Record<SocialHubType, string> = {
  captains: "Captain Picks",
  differentials: "Differentials",
  comparisons: "Head to Head",
  injuries: "Injuries",
  transfer_trends: "Transfer Market Trends",
  fixtures: "Fixture Difficulty",
  defcon: "DEFCON",
};

const INSTAGRAM_CAPTION =
  "Fantasy Premier League insights powered by AI. chatfpl.ai";

function siteOrigin(): string {
  return (process.env.NEXTAUTH_URL ?? "https://www.chatfpl.ai").replace(/\/$/, "");
}

export function getScreenshotOneAccessKey(): string {
  return process.env.SCREENSHOTONE_ACCESS_KEY?.trim() ?? "";
}

function getBufferApiKey(): string {
  return process.env.BUFFER_API_KEY?.trim() ?? "";
}

function getBufferInstagramChannelId(): string {
  return process.env.BUFFER_INSTAGRAM_CHANNEL_ID?.trim() ?? "";
}

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

export type ScriptPropertySource =
  | "social_card_token"
  | "screenshotone"
  | "buffer_api"
  | "buffer_channel";

export interface SocialScriptProperty {
  key: string;
  source: ScriptPropertySource;
  value: string;
  configured: boolean;
  hint?: string;
}

export interface SocialPipelineConfig {
  id: "twitter" | "instagram";
  name: string;
  account: string;
  flow: string;
  appsScriptProject: string;
  driveFolder: string;
  destination: string;
  schedule: string[];
  scriptProperties: SocialScriptProperty[];
  functions: string[];
  setupNotes: string[];
}

export interface SocialScreenshotSlotLive {
  headline: string;
  playerNames: string[];
  gw: number;
  layout: "single" | "dual";
  cardReady: boolean;
  error?: string;
}

export interface SocialScreenshotSlotConfig {
  slot: SocialCardSlot;
  label: string;
  hub: SocialHubType;
  hubLabel: string;
  pageUrl: string;
  screenshotOneUrl: string;
  previewPath: string;
  postTime: string;
  live: SocialScreenshotSlotLive;
}

export interface SocialScreenshotAdminConfig {
  dateKey: string;
  captureToken: string;
  captureTokenConfigured: boolean;
  screenshotOneAccessKey: string;
  screenshotOneConfigured: boolean;
  bufferApiKey: string;
  bufferApiConfigured: boolean;
  bufferInstagramChannelId: string;
  bufferChannelConfigured: boolean;
  instagramCaption: string;
  pipelines: SocialPipelineConfig[];
  slots: SocialScreenshotSlotConfig[];
  postTimes: string[];
  rotationNote: string;
}

function scriptPropertyValue(
  source: ScriptPropertySource,
  values: {
    captureToken: string;
    accessKey: string;
    bufferApiKey: string;
    bufferChannelId: string;
  },
): { value: string; configured: boolean; hint?: string } {
  switch (source) {
    case "social_card_token":
      return {
        value: values.captureToken,
        configured: values.captureToken.length > 0,
        hint: "Vercel env SOCIAL_CARD_TOKEN",
      };
    case "screenshotone":
      return {
        value: values.accessKey,
        configured: values.accessKey.length > 0,
        hint: "Vercel env SCREENSHOTONE_ACCESS_KEY",
      };
    case "buffer_api":
      return {
        value: values.bufferApiKey,
        configured: values.bufferApiKey.length > 0,
        hint: "Buffer API key (Apps Script or optional Vercel BUFFER_API_KEY for copy here)",
      };
    case "buffer_channel":
      return {
        value: values.bufferChannelId,
        configured: values.bufferChannelId.length > 0,
        hint: "Run fetchBufferInstagramChannelId in ChatFPL Instagram project",
      };
    default:
      return { value: "", configured: false };
  }
}

function buildScriptProperties(
  keys: { key: string; source: ScriptPropertySource; hint?: string }[],
  values: {
    captureToken: string;
    accessKey: string;
    bufferApiKey: string;
    bufferChannelId: string;
  },
): SocialScriptProperty[] {
  return keys.map(({ key, source, hint }) => {
    const resolved = scriptPropertyValue(source, values);
    return {
      key,
      source,
      value: resolved.value,
      configured: resolved.configured,
      hint: hint ?? resolved.hint,
    };
  });
}

function buildPipelines(values: {
  captureToken: string;
  accessKey: string;
  bufferApiKey: string;
  bufferChannelId: string;
}): SocialPipelineConfig[] {
  const sharedProps = [
    { key: "SCREENSHOTONE_ACCESS_KEY", source: "screenshotone" as const },
    { key: "SOCIAL_CARD_TOKEN", source: "social_card_token" as const },
  ];

  return [
    {
      id: "twitter",
      name: "X (Twitter)",
      account: "@ChatFPL_AI",
      flow: "ScreenshotOne → Google Drive (ChatFPL_Screenshots) → IFTTT → X",
      appsScriptProject: "ChatFPL.ai",
      driveFolder: "ChatFPL_Screenshots",
      destination: "IFTTT applet watches Drive folder, posts to X",
      schedule: ["09:00", "14:00", "19:00"],
      scriptProperties: buildScriptProperties(sharedProps, values),
      functions: ["postSlot1", "postSlot2", "postSlot3", "setupStaggeredTriggers"],
      setupNotes: [
        "Keep this project separate from Instagram.",
        "Each slot saves a PNG to ChatFPL_Screenshots. IFTTT picks up new files.",
        "Use Europe/London timezone in Apps Script project settings.",
      ],
    },
    {
      id: "instagram",
      name: "Instagram",
      account: "@chatfpl_ai",
      flow: "ScreenshotOne → Buffer API queue → Instagram (Drive archive: ChatFPL_Instagram)",
      appsScriptProject: "ChatFPL Instagram",
      driveFolder: "ChatFPL_Instagram",
      destination: "Buffer Publish queue (ScreenshotOne URL, not Drive link)",
      schedule: ["09:00", "14:00", "19:00"],
      scriptProperties: buildScriptProperties(
        [
          ...sharedProps,
          { key: "BUFFER_API_KEY", source: "buffer_api" },
          {
            key: "BUFFER_INSTAGRAM_CHANNEL_ID",
            source: "buffer_channel",
          },
        ],
        values,
      ),
      functions: [
        "fetchBufferInstagramChannelId",
        "verifyBufferInstagramChannelId",
        "postSlot1",
        "postSlot2",
        "postSlot3",
        "setupStaggeredTriggers",
      ],
      setupNotes: [
        "Turn OFF the IFTTT Drive → Buffer Instagram applet (it fails without post type).",
        "Repo script: scripts/google-apps-script/chatfpl-instagram-buffer/Code.gs",
        "Buffer uses ScreenshotOne screenshot_url from the JSON response. Drive is backup only.",
        "Optional: add BUFFER_API_KEY and BUFFER_INSTAGRAM_CHANNEL_ID to Vercel so you can copy them here.",
      ],
    },
  ];
}

async function getSlotLiveSummary(slot: SocialCardSlot): Promise<SocialScreenshotSlotLive> {
  try {
    const card = await getSocialCardData(slot);
    if (!card) {
      return {
        headline: "",
        playerNames: [],
        gw: 0,
        layout: "single",
        cardReady: false,
        error: "No card data for this slot today",
      };
    }

    return {
      headline: `${card.heroWhite}${card.heroGradient}`.trim(),
      playerNames: card.players.map((player) => player.displayName),
      gw: card.gw,
      layout: card.layout,
      cardReady: true,
    };
  } catch (err) {
    return {
      headline: "",
      playerNames: [],
      gw: 0,
      layout: "single",
      cardReady: false,
      error: err instanceof Error ? err.message : "Failed to load card data",
    };
  }
}

export async function getSocialScreenshotAdminConfig(
  dateKey?: string,
): Promise<SocialScreenshotAdminConfig> {
  const today = dateKey ?? new Date().toISOString().slice(0, 10);
  const captureToken = getSocialCardToken();
  const accessKey = getScreenshotOneAccessKey();
  const bufferApiKey = getBufferApiKey();
  const bufferChannelId = getBufferInstagramChannelId();
  const captureTokenConfigured = captureToken.length > 0;
  const screenshotOneConfigured = accessKey.length > 0;
  const postTimes = ["09:00", "14:00", "19:00"];

  const propertyValues = {
    captureToken,
    accessKey,
    bufferApiKey,
    bufferChannelId,
  };

  const liveSummaries = await Promise.all(
    (["1", "2", "3"] as SocialCardSlot[]).map((slot) => getSlotLiveSummary(slot)),
  );

  const slots: SocialScreenshotSlotConfig[] = (["1", "2", "3"] as SocialCardSlot[]).map(
    (slot, index) => {
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
        postTime: postTimes[index] ?? postTimes[0],
        live: liveSummaries[index],
      };
    },
  );

  return {
    dateKey: today,
    captureToken,
    captureTokenConfigured,
    screenshotOneAccessKey: accessKey,
    screenshotOneConfigured,
    bufferApiKey,
    bufferApiConfigured: bufferApiKey.length > 0,
    bufferInstagramChannelId: bufferChannelId,
    bufferChannelConfigured: bufferChannelId.length > 0,
    instagramCaption: INSTAGRAM_CAPTION,
    pipelines: buildPipelines(propertyValues),
    slots,
    postTimes,
    rotationNote:
      "Three posts per day on X and Instagram. ChatFPL rotates which hub each slot shows. All seven hubs are covered over the week.",
  };
}
