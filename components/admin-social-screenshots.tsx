"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface SocialScreenshotSlotConfig {
  slot: string;
  label: string;
  hub: string;
  hubLabel: string;
  pageUrl: string;
  screenshotOneUrl: string;
  previewPath: string;
}

interface SocialScreenshotAdminConfig {
  dateKey: string;
  captureToken: string;
  captureTokenConfigured: boolean;
  screenshotOneAccessKey: string;
  screenshotOneConfigured: boolean;
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

  return (
    <div className="space-y-5">
      <DarkCard>
        <SectionLabel>Owner only</SectionLabel>
        <h2 className="text-xl font-bold text-white">Social Screenshots</h2>
        <p className="mt-2 text-sm text-white/55">
          Capture URLs for ScreenshotOne and Google Apps Script. Internal pages require your capture token.
          Customers without the token get a 404.
        </p>
        <p className="mt-2 text-xs text-white/40">Rotation date (UTC): {config.dateKey}</p>
        <p className="mt-1 text-xs text-white/40">{config.rotationNote}</p>
      </DarkCard>

      {(!config.captureTokenConfigured || !config.screenshotOneConfigured) && (
        <DarkCard className="border-amber-400/30 bg-amber-400/[0.06]">
          <SectionLabel>Action required</SectionLabel>
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
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <DarkCard>
          <SectionLabel>Capture token</SectionLabel>
          <p className="mb-3 text-xs text-white/45">Append as <code>token=</code> on every internal social-card URL.</p>
          <div className="flex items-start gap-2">
            <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
              {config.captureTokenConfigured ? config.captureToken : "Not configured"}
            </code>
            {config.captureTokenConfigured ? (
              <button
                type="button"
                onClick={() => handleCopy("token", config.captureToken)}
                className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
              >
                {copiedKey === "token" ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>
        </DarkCard>

        <DarkCard>
          <SectionLabel>ScreenshotOne access key</SectionLabel>
          <p className="mb-3 text-xs text-white/45">Server-side only. Shown here for your Apps Script setup.</p>
          <div className="flex items-start gap-2">
            <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
              {config.screenshotOneConfigured ? config.screenshotOneAccessKey : "Not configured"}
            </code>
            {config.screenshotOneConfigured ? (
              <button
                type="button"
                onClick={() => handleCopy("access-key", config.screenshotOneAccessKey)}
                className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
              >
                {copiedKey === "access-key" ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>
        </DarkCard>
      </div>

      <DarkCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionLabel>Today&apos;s three slots</SectionLabel>
          <button
            type="button"
            onClick={fetchConfig}
            className="text-xs font-semibold text-[#00FF87] hover:text-[#00FFFF]"
          >
            Refresh
          </button>
        </div>
        <p className="mb-4 text-xs text-white/45">
          Suggested trigger times: {config.postTimes.join(", ")} (Europe/London in Apps Script project settings).
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
                <span className="text-sm text-white/70">Today: {slot.hubLabel}</span>
                <Link
                  href={slot.previewPath}
                  target="_blank"
                  className="text-xs font-semibold text-[#00FFFF] hover:underline"
                >
                  Preview card
                </Link>
              </div>

              <div>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/45">Page URL (ScreenshotOne)</p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
                    {slot.pageUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(`page-${slot.slot}`, slot.pageUrl)}
                    className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
                  >
                    {copiedKey === `page-${slot.slot}` ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {slot.screenshotOneUrl ? (
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-white/45">ScreenshotOne API URL</p>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80">
                      {slot.screenshotOneUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(`api-${slot.slot}`, slot.screenshotOneUrl)}
                      className="shrink-0 rounded-full border border-[#00FF87]/40 px-3 py-2 text-xs font-semibold text-[#00FF87] hover:bg-[#00FF87]/10"
                    >
                      {copiedKey === `api-${slot.slot}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </DarkCard>

      <DarkCard>
        <SectionLabel>Hub preview URLs (testing only)</SectionLabel>
        <p className="mb-3 text-xs text-white/45">
          Force a specific hub design. Live tweets should use slot URLs only so rotation stays automatic.
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
