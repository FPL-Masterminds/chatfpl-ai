"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface SocialScreenshotSlotLive {
  headline: string;
  playerNames: string[];
  gw: number;
  layout: "single" | "dual";
  cardReady: boolean;
  error?: string;
}

interface SocialScreenshotSlotConfig {
  slot: string;
  label: string;
  hub: string;
  hubLabel: string;
  pageUrl: string;
  screenshotOneUrl: string;
  previewPath: string;
  postTime: string;
  live: SocialScreenshotSlotLive;
}

interface SocialScriptProperty {
  key: string;
  source: string;
  value: string;
  configured: boolean;
  hint?: string;
}

interface SocialPipelineConfig {
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

interface SocialScreenshotAdminConfig {
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

function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 mb-3">{children}</p>;
}

function CopyField({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy,
  emptyLabel = "Not configured",
}: {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  emptyLabel?: string;
}) {
  const canCopy = value.length > 0;

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/45">{label}</p>
      <div className="flex items-start gap-2">
        <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
          {canCopy ? value : emptyLabel}
        </code>
        {canCopy ? (
          <button
            type="button"
            onClick={() => onCopy(copyKey, value)}
            className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
          >
            {copiedKey === copyKey ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function AdminSocialScreenshots() {
  const [config, setConfig] = useState<SocialScreenshotAdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/social-screenshots");
      if (!response.ok) throw new Error("Failed to load social screenshot config");
      setConfig(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleCopy = async (key: string, value: string) => {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  if (loading) {
    return (
      <DarkCard>
        <p className="text-sm text-white/50">Loading social screenshot config...</p>
      </DarkCard>
    );
  }

  if (error || !config) {
    return (
      <DarkCard>
        <p className="text-sm text-red-300">{error || "No config available"}</p>
      </DarkCard>
    );
  }

  const missingVercel = !config.captureTokenConfigured || !config.screenshotOneConfigured;

  return (
    <div className="space-y-5">
      <DarkCard>
        <SectionLabel>Owner only</SectionLabel>
        <h2 className="text-xl font-bold text-white">Social Screenshots</h2>
        <p className="mt-2 text-sm text-white/55">
          Manage today&apos;s card rotation, copy URLs for ScreenshotOne and Apps Script, and track the
          X and Instagram pipelines from one place.
        </p>
        <p className="mt-2 text-xs text-white/40">Rotation date (UTC): {config.dateKey}</p>
        <p className="mt-1 text-xs text-white/40">{config.rotationNote}</p>
      </DarkCard>

      {missingVercel ? (
        <DarkCard className="border-amber-400/30 bg-amber-400/[0.06]">
          <SectionLabel>Action required (Vercel)</SectionLabel>
          <ul className="space-y-2 text-sm text-amber-100/90">
            {!config.captureTokenConfigured ? (
              <li>
                Set <code className="text-amber-200">SOCIAL_CARD_TOKEN</code> in Vercel env vars
                (any long random string). Redeploy after saving.
              </li>
            ) : null}
            {!config.screenshotOneConfigured ? (
              <li>
                Set <code className="text-amber-200">SCREENSHOTONE_ACCESS_KEY</code> in Vercel env vars.
                Redeploy after saving.
              </li>
            ) : null}
          </ul>
        </DarkCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {config.pipelines.map((pipeline) => (
          <DarkCard key={pipeline.id}>
            <SectionLabel>{pipeline.name} pipeline</SectionLabel>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-white">{pipeline.appsScriptProject}</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                {pipeline.account}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/55">{pipeline.flow}</p>
            <dl className="mt-4 space-y-2 text-xs text-white/50">
              <div>
                <dt className="text-white/35">Drive folder</dt>
                <dd className="font-mono text-white/75">{pipeline.driveFolder}</dd>
              </div>
              <div>
                <dt className="text-white/35">Destination</dt>
                <dd>{pipeline.destination}</dd>
              </div>
              <div>
                <dt className="text-white/35">Schedule (Europe/London)</dt>
                <dd>{pipeline.schedule.join(", ")}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/45">
                Apps Script properties
              </p>
              <div className="space-y-3">
                {pipeline.scriptProperties.map((property) => (
                  <div key={`${pipeline.id}-${property.key}`}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <code className="text-xs text-[#00FFFF]">{property.key}</code>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          property.configured
                            ? "bg-[#00FF87]/15 text-[#00FF87]"
                            : "bg-amber-400/15 text-amber-200"
                        }`}
                      >
                        {property.configured ? "Ready to copy" : "Missing"}
                      </span>
                    </div>
                    {property.configured ? (
                      <div className="flex items-start gap-2">
                        <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
                          {property.value}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${pipeline.id}-${property.key}`, property.value)
                          }
                          className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
                        >
                          {copiedKey === `${pipeline.id}-${property.key}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">{property.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/45">Run in Apps Script</p>
              <div className="flex flex-wrap gap-2">
                {pipeline.functions.map((fn) => (
                  <code
                    key={fn}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70"
                  >
                    {fn}()
                  </code>
                ))}
              </div>
            </div>

            <ul className="mt-4 space-y-1 text-xs text-white/45">
              {pipeline.setupNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </DarkCard>
        ))}
      </div>

      <DarkCard>
        <SectionLabel>Instagram caption</SectionLabel>
        <p className="mb-3 text-xs text-white/45">Used by ChatFPL Instagram Apps Script when queuing Buffer posts.</p>
        <CopyField
          label="Caption"
          value={config.instagramCaption}
          copyKey="instagram-caption"
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />
      </DarkCard>

      <div className="grid gap-5 md:grid-cols-2">
        <DarkCard>
          <SectionLabel>Capture token</SectionLabel>
          <p className="mb-3 text-xs text-white/45">Append as <code>token=</code> on every internal social-card URL.</p>
          <CopyField
            label="SOCIAL_CARD_TOKEN"
            value={config.captureTokenConfigured ? config.captureToken : ""}
            copyKey="token"
            copiedKey={copiedKey}
            onCopy={handleCopy}
          />
        </DarkCard>

        <DarkCard>
          <SectionLabel>ScreenshotOne access key</SectionLabel>
          <p className="mb-3 text-xs text-white/45">Shared by both Apps Script projects.</p>
          <CopyField
            label="SCREENSHOTONE_ACCESS_KEY"
            value={config.screenshotOneConfigured ? config.screenshotOneAccessKey : ""}
            copyKey="access-key"
            copiedKey={copiedKey}
            onCopy={handleCopy}
          />
        </DarkCard>
      </div>

      <DarkCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionLabel>Today&apos;s live cards</SectionLabel>
          <button
            type="button"
            onClick={fetchConfig}
            className="text-xs font-semibold text-[#00FF87] hover:text-[#00FFFF]"
          >
            Refresh
          </button>
        </div>
        <p className="mb-4 text-xs text-white/45">
          What each slot will capture at {config.postTimes.join(", ")} (Europe/London). Refresh after
          data updates or before checking Apps Script runs.
        </p>

        <div className="space-y-4">
          {config.slots.map((slot) => (
            <div
              key={slot.slot}
              className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#00FF87]/15 px-3 py-1 text-xs font-bold text-[#00FF87]">
                  {slot.label}
                </span>
                <span className="text-xs text-white/45">{slot.postTime}</span>
                <span className="text-sm text-white/70">{slot.hubLabel}</span>
                <Link
                  href={slot.previewPath}
                  target="_blank"
                  className="text-xs font-semibold text-[#00FFFF] hover:underline"
                >
                  Preview card
                </Link>
              </div>

              {slot.live.cardReady ? (
                <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm">
                  <p className="font-semibold text-white">{slot.live.headline}</p>
                  <p className="mt-1 text-xs text-white/50">
                    GW{slot.live.gw} · {slot.live.layout} · {slot.live.playerNames.join(" vs ")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-200/90">
                  {slot.live.error || "Card data not available"}
                </p>
              )}

              <CopyField
                label="Page URL (ScreenshotOne)"
                value={slot.pageUrl}
                copyKey={`page-${slot.slot}`}
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />

              {slot.screenshotOneUrl ? (
                <CopyField
                  label="ScreenshotOne API URL"
                  value={slot.screenshotOneUrl}
                  copyKey={`api-${slot.slot}`}
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
              ) : null}
            </div>
          ))}
        </div>
      </DarkCard>

      <DarkCard>
        <SectionLabel>Quick links</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-[#00FF87]/40 hover:text-[#00FF87]"
          >
            Google Apps Script
          </a>
          <a
            href="https://publish.buffer.com/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-[#00FF87]/40 hover:text-[#00FF87]"
          >
            Buffer API settings
          </a>
          <a
            href="https://publish.buffer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-[#00FF87]/40 hover:text-[#00FF87]"
          >
            Buffer Publish queue
          </a>
          <a
            href="https://ifttt.com/my_applets"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-[#00FF87]/40 hover:text-[#00FF87]"
          >
            IFTTT applets (X only)
          </a>
        </div>
      </DarkCard>

      <DarkCard>
        <SectionLabel>Hub preview URLs (testing only)</SectionLabel>
        <p className="mb-3 text-xs text-white/45">
          Force a specific hub design. Live posts should use slot URLs only so rotation stays automatic.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "captains",
            "differentials",
            "comparisons",
            "injuries",
            "transfer_trends",
            "fixtures",
            "defcon",
          ].map((hub) => (
            <Link
              key={hub}
              href={
                config.captureTokenConfigured
                  ? `/internal/social-card?slot=1&hub=${hub}&token=${encodeURIComponent(config.captureToken)}`
                  : `/internal/social-card?slot=1&hub=${hub}`
              }
              target="_blank"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-[#00FF87]/40 hover:text-[#00FF87]"
            >
              {hub.replace("_", " ")}
            </Link>
          ))}
        </div>
      </DarkCard>
    </div>
  );
}
