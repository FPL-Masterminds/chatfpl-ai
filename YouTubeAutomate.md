# YouTube automation plan (draft)

Status: planning only. Not implemented.

Context: ChatFPL already automates X and Instagram with live FPL data, HTML social cards (1080×1080), ScreenshotOne captures, and Google Apps Script distribution. This doc captures a possible extension to YouTube (MP4, voice, upload).

## Core idea

You have already proved the hard part of the loop: **live FPL data → deterministic render → automated publish**. YouTube is the same idea with a **time dimension** (frames + audio) and a **different distributor** (YouTube Data API instead of IFTTT/Buffer).

**Yes, it is possible.** It is also a step up in engineering, cost, and editorial judgment. Treat it as a **second product line**, not a tweak to the screenshot pipeline.

## What you have today vs what YouTube needs

| Today (X / IG) | YouTube version |
|----------------|-----------------|
| One HTML frame (1080×1080) | Same design language, but **motion** (charts count up, fixtures slide in, player photo parallax, etc.) |
| ScreenshotOne = "camera" | **Remotion** (or similar) = "camera + recorder" → **MP4** |
| 1 image / post | **15–60s** (or longer) with **script + voice + music** |
| Apps Script + Drive + IFTTT/Buffer | **Node job** (Vercel is a poor fit for long encodes; use CI, Fly, Railway, or a small VPS) + **YouTube upload** |
| Caption is static | **Title, description, chapters, tags** (LLM) + optional **ElevenLabs** narration |

Existing `getSocialCardData()` / hub rotation / GW logic is reusable as **the data layer**. The **render layer** and **ops layer** are new.

## Realistic stack

### Rendering (pick one primary path)

1. **Remotion** (React + timeline, MP4 export)  
   Best fit if you stay in **Next/React**. Reuse tokens, layouts, and FPL types. Define compositions (`CaptainPickGW6`, `TransferTrend`, etc.), pass props from the same APIs as social cards, render on a worker with `npx remotion render`.

2. **FFmpeg + image sequence**  
   Generate N PNGs (headless Chrome or existing card HTML) and stitch with FFmpeg. Fine for Ken Burns on a card; weak for complex UI motion.

3. **WebGL / Three.js**  
   Optional hero shots; usually combined with Remotion, not instead of it.

### Audio

- **ElevenLabs** (or similar) for a consistent "ChatFPL voice" reading a script from card copy + stats.
- Script from **LLM** with a strict template (length, GW cite, one CTA).

### Upload

- **YouTube Data API v3** (`videos.insert` + resumable upload). OAuth as channel owner; refresh token in secrets. Prefer **Node render worker** over Apps Script for large files.

### Orchestration

- Cron (GitHub Actions, Vercel Cron triggering a worker, Cloud Scheduler) → **one video per day per format**, aligned with social discipline.

## End-to-end pipeline (conceptual)

```
FPL + ChatFPL APIs
  → Video brief JSON
  → LLM script + metadata
  → ElevenLabs WAV
  → Remotion render MP4 (mux audio, loudness)
  → YouTube upload
  → Log (+ optional owner review)
```

**Brief JSON** is the contract: `{ gw, hub, players, stats, headline, durationTarget, voiceId }`. Same idea as `SocialCardData`, plus `scenes[]`.

## Phased journey

### Phase 0 – Decide format (1–2 days)

Pick **one** repeatable show, not ten:

- e.g. "GW6 captain shortlist in 45 seconds" or "One differential, one reason."
- Shorts (9:16) vs square (1:1) vs landscape (16:9). Many FPL automations start with **Shorts** or **under 90s landscape**.

### Phase 1 – Proof without YouTube (1–2 weeks)

- One Remotion composition fed by the **same data** as slot-1 social card.
- Render **locally** to MP4. No upload. Judge: is it watchable?

### Phase 2 – Audio (~1 week)

- Template script from card `paragraph` + stats.
- ElevenLabs → set Remotion `durationInFrames` from WAV length.

### Phase 3 – Worker + cron (1–2 weeks)

- Docker or Node on a small VM: `fetch brief → render → upload`.
- Store renders in R2/S3; idempotent `video_id` per `{date, hub}`.

### Phase 4 – YouTube + governance (ongoing)

- OAuth, default privacy **unlisted** first, playlist per series.
- Human approve first N uploads, then auto if quality holds.

### Phase 5 – Scale formats

- Only after one format works: H2H, injuries, etc.

## Costs (order of magnitude)

- **Remotion**: OSS; cost = compute (FFmpeg time per video).
- **ElevenLabs**: characters/month; ~one short/day usually fits a modest plan.
- **LLM**: cheap if templated.
- **YouTube API**: quota is fine for **one upload/day**; bulk needs planning.
- **ScreenshotOne**: not for video; Remotion replaces it for YouTube.

## Risks

1. **Quality**: Slideshow + robot voice FPL channels are common. Edge = data + design; motion must feel intentional.
2. **Copyright**: Player photos, badges, PL marks. Same as site/cards, higher visibility on video.
3. **Factual drift**: GW rules must match social cards (`resolveSocialCardGameweek` policy).
4. **YouTube repetitive content**: Vary hooks and structure.
5. **Ops**: Failed renders, upload retries, A/V length mismatch. Need health logs like chat production checks.

## Is WebGL required?

**No** for v1. Start with **Remotion + existing visual system**. Add WebGL only for a signature motion if needed.

## Suggested place in ChatFPL repo (later)

- `lib/video-brief.ts` – scene props from hub builders.
- `remotion/` – compositions.
- `scripts/render-daily-short.mjs` or scheduled GitHub Action.
- Owner preview at `/devvideo` (like https://www.chatfpl.ai/devemails) before auto-upload.

Keep **Apps Script for social images only**; video encoding on **Node + worker**.

## Summary

| Question | Answer |
|----------|--------|
| Possible? | Yes. |
| Same difficulty as X/IG? | No. Roughly 3–5× moving parts. |
| Right next step? | One Remotion short, one hub, manual MP4, no API. If you would not watch it, do not automate yet. |

## Open decisions (when we pick this up)

- Target: **Shorts**, **60s landscape**, or **8–12 min GW preview**?
- Aspect ratio and single v1 episode structure reusing slot-1 hub rotation.
- Voice brand (ElevenLabs voice id) and music licensing.
- Unlisted vs public for first 30 uploads.
