# ChatFPL Arabic translation: plan, restore point, and owner notes

**Status:** Planned (not yet built)  
**Restore tag:** `restore/pre-arabic-2026-09-12` on commit `b49d8fa`  
**Work branch:** `feature/arabic-i18n` (create before first code change)  
**Last updated:** 12 September 2026

---

## Executive summary

We will add Arabic as an **opt-in, URL-separated** experience at `https://www.chatfpl.ai/ar/...`, following [Google's multi-regional guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

**Phase 1 does not translate thousands of `/fpl/` pSEO pages.** It ships:

- Arabic marketing pages (`/ar`, `/ar/signup`, `/ar/login`)
- Arabic chat shell and **Arabic AI replies** when the user chose Arabic
- Language switcher (links between English and Arabic URLs, no IP auto-redirect)
- `hreflang` on paired pages only
- Kill switches so you can disable Arabic without redeploying code

The English site stays the default. Arabic is additive and isolated in its own route tree and files.

---

## Restore point (use this first if anything goes wrong)

### What was saved

| Item | Value |
|------|--------|
| Git tag | `restore/pre-arabic-2026-09-12` |
| Commit | `b49d8fac5ddbff962d5539b768265bc6f9b7e0b6` |
| Branch at tag | `main` |
| Tag message | Last known-good state before Arabic work |

### Level 1: Instant kill switch (no code change)

On Vercel, set environment variables:

```
NEXT_PUBLIC_ARABIC_ENABLED=false
ARABIC_CHAT_ENABLED=false
ARABIC_INDEXING_ENABLED=false
```

Redeploy (or wait for env propagation). All `/ar/*` routes return 404. English chat ignores locale. Indexing cron skips `/ar/` URLs.

**Use when:** Arabic is live but you want it off immediately.

### Level 2: Revert the feature branch (keep main clean)

If work is on `feature/arabic-i18n` and not merged:

```bash
git checkout main
git branch -D feature/arabic-i18n
```

Vercel keeps serving `main`. No Arabic code on production.

### Level 3: Full rollback to tagged commit

If Arabic was merged to `main` and you need the exact pre-Arabic codebase:

```bash
git checkout main
git reset --hard restore/pre-arabic-2026-09-12
git push origin main
```

**Warning:** This removes all commits after the tag on `main`. Only use if you accept losing other work merged after the tag.

Safer alternative (no history rewrite):

```bash
git checkout -b rollback/remove-arabic restore/pre-arabic-2026-09-12
git push origin rollback/remove-arabic
# Merge rollback branch via PR, or reset main locally then force-push only if you understand the risk
```

### Level 4: Surgical file removal

If you only want to strip Arabic without full reset, delete these paths after the build (see **File manifest** below):

- `app/ar/` (entire tree)
- `lib/i18n/`
- `components/i18n/`
- `app/sitemap-ar.ts` (if created)
- Revert the small English touch list in **Minimal English diffs**

Then set kill-switch env vars to `false` anyway.

### Verify rollback

1. `https://www.chatfpl.ai/` loads normally (English)
2. `https://www.chatfpl.ai/chat` works in English
3. `https://www.chatfpl.ai/ar` returns 404 (after kill switch) or is gone (after code removal)
4. Admin site stats sitemap total unchanged from pre-Arabic baseline
5. Send a test chat message: reply is English, player photos still work

---

## Design principles (isolation from English)

### 1. Separate URL tree

```
https://www.chatfpl.ai/          English (unchanged)
https://www.chatfpl.ai/ar/       Arabic home
https://www.chatfpl.ai/ar/signup
https://www.chatfpl.ai/ar/login
https://www.chatfpl.ai/ar/chat
```

No cookies-only language on marketing pages. Google can crawl `/ar/` as real URLs.

### 2. Separate code folders

| Area | Location | Touches English? |
|------|----------|------------------|
| Arabic pages | `app/ar/**` | No |
| Arabic layout (RTL, `lang=ar`) | `app/ar/layout.tsx` | No |
| Translation strings | `lib/i18n/locales/ar.ts` | No |
| Locale helpers + flags | `lib/i18n/config.ts` | No |
| Language switcher | `components/i18n/language-switcher.tsx` | Only adds a link |
| Arabic metadata / hreflang helper | `lib/i18n/hreflang.ts` | No |

### 3. Minimal English diffs (document every line)

These are the **only** shared files we plan to edit. Each change is small and behind flags where possible.

| File | Change | Risk |
|------|--------|------|
| `components/header.tsx` | Add `LanguageSwitcher` link (optional; can live only on `/ar` layout instead) | Low |
| `components/dev-header.tsx` | Same | Low |
| `app/api/chat/route.ts` | Read `locale` from body; append Arabic prompt block when `ar` | Medium |
| `app/api/devchat/route.ts` | Same | Low |
| `app/chat/page.tsx` | Pass `locale` from storage to API; optional UI strings | Medium |
| `app/sitemap.ts` | Add `/ar` to `excludedRoutes` so filesystem crawler does not auto-add Arabic | Low |
| `app/robots.ts` | Optional: disallow `/ar/` while in beta | Low |
| `vercel.json` | **No change planned** | None |
| `app/api/cron/index-urls/route.ts` | Filter out `/ar/` unless `ARABIC_INDEXING_ENABLED=true` | Low |

**We will not refactor English pages** to use a shared i18n framework in phase 1. English components stay as-is.

### 4. Feature flags (Vercel env)

| Variable | Default (phase 1) | Purpose |
|----------|-------------------|---------|
| `NEXT_PUBLIC_ARABIC_ENABLED` | `false` until you flip it | Gates `/ar/*` routes (404 when off) |
| `ARABIC_CHAT_ENABLED` | `false` until you flip it | Arabic replies in chat API |
| `ARABIC_INDEXING_ENABLED` | `false` always in phase 1 | Keeps Arabic URLs out of daily indexing cron |

You can enable Arabic for real users (`NEXT_PUBLIC_ARABIC_ENABLED=true`) while keeping indexing off until you trust the pages.

### 5. Shared runtime, not shared pages

- Same Next.js app, same Vercel project, same database, same Stripe, same Dify
- Arabic chat uses the **same** `/api/chat` endpoint with a `locale: "ar"` field
- No second deployment, no second Neon DB

Server load impact: negligible for phase 1 (a handful of static pages + same chat API with a longer system prompt). The expensive part is still Dify/LLM tokens, not serving `/ar/`.

---

## Sitemap and indexing cron (your 200/day question)

### How it works today

- `app/sitemap.ts` builds **one** sitemap at `https://www.chatfpl.ai/sitemap.xml`
- It includes thousands of English `/fpl/...` pSEO URLs (players, comparisons, DEFCON, etc.)
- Vercel cron `GET /api/cron/index-urls` runs daily at 08:00 UTC
- Cron reads **entire** `sitemap.xml`, skips already-submitted URLs, submits up to **200 per day** to Google Indexing API

### What we will do for Arabic (phase 1)

**Arabic URLs will NOT be added to the main sitemap by default.**

1. Add `/ar` to `excludedRoutes` in `app/sitemap.ts` so the filesystem crawler does not auto-discover `app/ar/**`
2. Create a **separate** `app/sitemap-ar.ts` (serves `https://www.chatfpl.ai/sitemap-ar.xml`) with only:
   - `/ar`
   - `/ar/signup`
   - `/ar/login`
   - `/ar/chat` (optional; may stay `noindex` if you prefer chat not in search)
3. Add `hreflang` alternates on English home + Arabic home pair (and signup/login pairs)
4. Update `app/robots.ts` to reference both sitemaps when Arabic is enabled:
   - `sitemap: https://www.chatfpl.ai/sitemap.xml`
   - `sitemap: https://www.chatfpl.ai/sitemap-ar.xml`
5. **Indexing cron:** add filter `if (url.includes('/ar/') && !ARABIC_INDEXING_ENABLED) skip`

**Result:** Your existing 200/day budget continues to work through the English pSEO queue exactly as today. Arabic pages are discoverable via `sitemap-ar.xml` and internal links, but they do not compete for the 200 indexing slots until you explicitly set `ARABIC_INDEXING_ENABLED=true`.

### Phase 2 (later, only if Arabic SEO proves itself)

- Translate top hub pages: `/ar/fpl/captains`, etc.
- Add those to `sitemap-ar.xml` only (still not duplicated into main sitemap)
- Consider a separate weekly indexing budget for Arabic (e.g. 20/day cap), not 200/day of English queue

### What we will NOT do in phase 1

- Duplicate 5,000+ player/comparison URLs in Arabic
- Double the main sitemap size
- Let the cron accidentally burn 200 slots/day on `/ar/` before English queue is caught up

---

## Implementation plan (phases)

### Phase 0: Safety (before any UI)

- [x] Tag `restore/pre-arabic-2026-09-12` on `main`
- [ ] Create branch `feature/arabic-i18n`
- [ ] Add `lib/i18n/config.ts` with feature flags
- [ ] Add middleware or `app/ar/layout.tsx` guard for `NEXT_PUBLIC_ARABIC_ENABLED`
- [ ] Add cron filter for `/ar/` URLs
- [ ] Add `/ar` to sitemap exclusions

### Phase 1: Arabic shell (marketing + switcher)

- [ ] `app/ar/layout.tsx`: `dir="rtl"`, `lang="ar"`, Arabic font stack (Noto Sans Arabic + fallbacks)
- [ ] `app/ar/page.tsx`: Arabic homepage (translated copy, same CTAs to `/ar/signup` and `/ar/chat`)
- [ ] `app/ar/signup/page.tsx` and `app/ar/login/page.tsx`: Arabic UI strings; forms post to same APIs
- [ ] `components/i18n/language-switcher.tsx`: English | العربية links (`/` ↔ `/ar/`)
- [ ] `lib/i18n/hreflang.ts` + metadata alternates on `/` and `/ar`
- [ ] `app/sitemap-ar.ts` (4-5 URLs max)
- [ ] `robots.ts` second sitemap entry (when enabled)

### Phase 2: Arabic chat

- [ ] `app/ar/chat/page.tsx`: reuse chat UI with `locale="ar"` prop (or thin wrapper around shared component)
- [ ] `app/chat/page.tsx`: read `chatfpl_locale` from localStorage; pass `locale` to `/api/chat`
- [ ] Language toggle on chat: sets storage + reloads or soft-switches
- [ ] `app/api/chat/route.ts`: when `locale === "ar"` and `ARABIC_CHAT_ENABLED`:
  - Reply in Modern Standard Arabic
  - Keep FPL player names, prices, and PhotoURLs from live data
  - Expand CBIT on first mention (same rule as English)
  - RTL-friendly formatting (no broken markdown images)
- [ ] `components/chat-message-content.tsx`: `dir="rtl"` when Arabic message detected or locale prop set
- [ ] Suggestion pills: Arabic prompt set in `lib/i18n/locales/ar-chat-prompts.ts`

### Phase 3: Polish and launch checklist

- [ ] Manual QA on mobile Safari + Chrome (RTL input, keyboard, scroll)
- [ ] Search Console: submit `sitemap-ar.xml` as separate property path (optional)
- [ ] Vercel Analytics: filter `/ar` routes to measure uptake
- [ ] You review Arabic marketing copy (native speaker or professional translator)
- [ ] Flip `NEXT_PUBLIC_ARABIC_ENABLED=true` on production
- [ ] Flip `ARABIC_CHAT_ENABLED=true` when chat QA passes
- [ ] Keep `ARABIC_INDEXING_ENABLED=false` for at least 2 weeks unless you choose otherwise

### Explicitly out of scope (phase 1)

- Translating `/fpl/*` pSEO pages
- Arabic Stripe Checkout UI (Stripe hosted page stays as Stripe renders it)
- Arabic email templates (Resend)
- Arabic terms/privacy (legal review needed)
- Arabic speech-to-text / text-to-speech (hooks are `en-GB` today)
- Auto-redirect by country or IP
- Google Translate widget

---

## File manifest (for surgical rollback)

### New files (safe to delete entirely)

```
app/ar/layout.tsx
app/ar/page.tsx
app/ar/signup/page.tsx
app/ar/login/page.tsx
app/ar/chat/page.tsx
app/sitemap-ar.ts
lib/i18n/config.ts
lib/i18n/hreflang.ts
lib/i18n/locales/ar.ts
lib/i18n/locales/ar-chat-prompts.ts
components/i18n/language-switcher.tsx
arabictranslation.md
```

### Modified files (revert via git)

```
app/sitemap.ts
app/robots.ts
app/api/chat/route.ts
app/api/devchat/route.ts
app/api/cron/index-urls/route.ts
app/chat/page.tsx
components/header.tsx          (only if switcher added here)
components/dev-header.tsx      (only if switcher added here)
components/chat-message-content.tsx  (only if RTL prop added)
lib/chat-message-format.ts     (only if Arabic CBIT copy needed)
```

---

## Confidence assessment (honest)

### High confidence

- Isolated `/ar` route tree with RTL layout
- Feature flags and 404 when disabled
- Language switcher linking real URLs (Google-compliant)
- Separate `sitemap-ar.xml` without touching English URL count
- Keeping indexing cron on English queue only
- Arabic chat via prompt injection + `locale` body field (same pattern as existing formatting rules)
- Git tag + branch restore procedure

### Medium confidence (needs careful QA)

- RTL chat UI (player photo rows, bullets, streaming text) without layout breaks
- Arabic suggestion pills feeling natural, not machine-translated
- Signup/login flows: Arabic labels but English validation errors from APIs unless we translate those too
- `hreflang` correctness on all paired pages (easy to get wrong; we will test in Search Console)

### Lower confidence / known limits

- **Legal:** Arabic terms and privacy should be professionally translated before you market heavily in Saudi/UAE
- **Model quality:** Dify will follow instructions, but Arabic football terminology varies by region (Egypt vs Gulf). Expect iteration on prompts.
- **Stripe:** Payment page language is Stripe's, not ours
- **Emails:** Password reset and verification emails stay English unless we add a separate project

### Can I say we will not mess up the English site?

**I can say the architecture is designed so English should not break**, because:

1. English pages are not refactored
2. Arabic is behind env flags
3. Sitemap and cron changes are additive filters, not rewrites
4. Chat API change is one optional field with English default when absent

**I cannot promise zero risk** on any production change. The highest-risk touch is `app/api/chat/route.ts`. Mitigation: default `locale` to `en`, test English chat after every Arabic commit, keep restore tag.

---

## Owner checklist: things easy to miss

### SEO and Google

- Submit `sitemap-ar.xml` in Search Console when Arabic goes live (separate from main sitemap)
- Use `hreflang` `x-default` pointing to English home
- Do not auto-redirect Arabic speakers away from English URLs
- Arabic queries need Arabic titles/descriptions on `/ar/` pages, not English meta on Arabic URLs

### Product and revenue

- Arabic users still pay in GBP via Stripe unless you add multi-currency later
- Support burden: Arabic questions in email/chat
- Refund and terms language: English terms still apply until Arabic legal pages exist

### Technical

- **Database:** No schema change required for phase 1
- **Dify costs:** Arabic replies may use slightly more tokens; monitor usage
- **Analytics:** Track `/ar` separately; do not assume Vercel country = language
- **Auth:** Sessions work across `/` and `/ar/`; locale is client preference, not account field (phase 1)

### Content

- Player names stay as FPL `web_name` (Latin script) in chat; that is correct for FPL
- Marketing copy should be human-reviewed Arabic, not raw GPT translation
- Cultural note: Gulf and Egypt share Arabic but vocabulary differs; Modern Standard Arabic is the safe default

### Operations

- **Pull the plug:** `NEXT_PUBLIC_ARABIC_ENABLED=false` on Vercel (fastest)
- **No extra Vercel cron** planned
- **No extra server load** beyond normal page views unless Arabic traffic spikes

### What success looks like (first 90 days)

- `/ar` pages indexed and receiving impressions in Search Console (Arabic queries)
- Arabic chat sessions with paid conversions (even a handful proves the funnel)
- English sitemap total and indexing cron behaviour unchanged
- No increase in English chat errors or empty replies

---

## Google doc alignment (summary)

From [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites):

| Google recommendation | Our approach |
|----------------------|--------------|
| Different URLs per language | `/` vs `/ar/` |
| `hreflang` annotations | On paired EN/AR pages only |
| Obvious page language | Full Arabic on `/ar/*`, full English on `/` |
| User can switch language | Switcher links, no auto-redirect |
| Avoid IP-based content | No geo redirect |
| Subdirectory on gTLD | `chatfpl.ai/ar/` |

---

## Next step

When you are ready to build:

1. Confirm this plan (or note changes)
2. We create `feature/arabic-i18n` from tagged `main`
3. Implement Phase 0 + 1 behind flags (`NEXT_PUBLIC_ARABIC_ENABLED=false` on production until you approve)
4. You test on preview URL
5. Enable flags one at a time on production

**Restore tag is already on GitHub after push:** `restore/pre-arabic-2026-09-12` at `b49d8fa`.
