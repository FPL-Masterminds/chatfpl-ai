# Nov26 Update Engine: Decision Framework for ChatFPL

Working document for adding a "how to think" layer to ChatFPL answers, based on the reasoning in three SmartPlay articles (August 2026):

- Part 1: Stop copying the champion (six disciplines)
- Part 2: The elite manager's playbook (transfers, hits, captaincy, chips)
- Part 3: FPL is a skill game (evidence, survivorship traps, risk modes)

We work through this one step at a time. Each step has a status, a "done when" check, and nothing moves to production until Step 10.

**Current focus (5 Nov 2026):** Step 2 + Step 3. Build the new dev system prompt in git, fix chip context + DEFCON text, paste into ChatFPL DEV, test on devchat. Early-promote the two bug fixes to production if tests pass.

---

## What the current Dify system prompt changes

The Dify system prompt already contains a **REASONING FRAMEWORK**, and several parts of it point the model in the opposite direction to the articles. If we only injected new rules from code, the model would get two conflicting sets of instructions (system prompt says one thing, the message says another) and behave inconsistently. So the Dify prompt has to be part of this work.

### Section-by-section verdict

| Dify section | Current rule | Conflict with the articles | Verdict |
|---|---|---|---|
| Identity + photos | Expert assistant, always use PhotoURL | None | **Keep** |
| Captaincy | Safe = highest xP + ownership > 40% + good fixture. Differential = form > 7.0 + ownership < 20% | Hard ownership thresholds instead of risk mode. Form-led differential (short-term form is noise). Low ownership treated as a reason in itself | **Rewrite** |
| Transfers | Prioritise form > 6.0, good fixtures, "price rises likely" | Form-first, price-chasing. No forced sells, no "roll vs move", no minutes-first, no opportunity cost. Never considers doing nothing | **Rewrite** |
| Pre-season unlimited transfers | GW1 deadline logic | None. Factual and correct | **Keep as is** |
| Standard rules | 1 FT per GW, bank up to 5, -4 per extra | None. Confirms the 5-transfer cap from the articles | **Keep** |
| Player comparisons | Order: Form, Fixtures (5), Price, PPG, Ownership | Minutes missing entirely. Form ranked first | **Rewrite** (minutes and role first, routes to points, horizon) |
| Differentials | Ownership < 10%, form > 6.0, price < £8.0m, minutes > 200 | 200 minutes is too weak a minutes test. Form-led. Needs projection behind it | **Rewrite** (keep filters as a starting pool, add minutes security and projection) |
| General GW insights | Prioritise injury news, fixture swings, form spikes, price changes | Form spikes and price changes promoted to top signals | **Soften** (keep injuries and fixture swings, demote form spikes and price changes) |
| Formatting | Photos, concise, bullets, "clear sections", hyphens, British English | "Clear sections" can push long, structured answers on simple questions | **Minor edit** (sections only when the answer needs them) |
| Personal team data | Use USER'S FPL TEAM when present | None. This is what risk mode and roll-vs-move will build on | **Keep, extend** (mention risk mode and free transfers once Step 4 lands) |
| DEFCON | `defensive_contribution` = matches where bonus earned. Per 90 "above ~0.7" = reliable | **Factually wrong.** Live API (GW9): top defenders show DC of about 105 and DC90 of about 11. These are action counts, not matches. The chat route code already says this correctly, so the system prompt and code contradict each other in production today | **Fix** (Step 2, flagged for production too) |
| Chips | Not mentioned in the system prompt | Live API confirms two full chip sets (all four chips in GW1-19 and again in GW20-38). The code that builds "Chips Still Available" treats Free Hit, Bench Boost and Triple Captain as once per season | **Add** chip rules and fix the code (Step 2) |

### What this means for the plan

1. **We need a separate Dify app for devchat.** `/devchat` and `/api/chat` both use `DIFY_API_KEY`, so they share one Dify app and one system prompt. To test a rewritten system prompt safely, devchat needs its own copy of the app with its own key. This was optional before. Now it's Step 0.
2. **The framework lives in two layers, not one:**
   - **System prompt (Dify dev app):** the static "how to think" rules. Core principles plus short playbooks replace the old REASONING FRAMEWORK sections.
   - **Code (devchat route):** the per-request parts the system prompt can't know: detected question type, the user's risk mode, free transfers, chips per half, rank trend.
3. **Two production bugs surfaced** (DEFCON definition, chip availability). They're real errors in live answers today. We fix and test them on devchat first, but they're good candidates to promote early, ahead of the full framework (see Step 2).

---

## Ground rules

1. **Development only.** Code changes go into `/devchat` (`app/api/devchat/route.ts`) and new shared lib files that only devchat imports. The `/devchat` page and API are owner-only (403 for everyone else).
2. **Production Dify app is not touched** until Step 10. All system prompt work happens in a duplicate Dify app used only by devchat.
3. **Everything in git.** The Dify system prompt lives in the Dify dashboard, not the repo. We keep a copy of both the production and dev prompts in the repo so every change is reviewable and reversible.
4. **Our own words.** The articles are a competitor's content. We encode the general FPL principles as our own rules. No pasted article text, no SmartPlay branding, no quoting named managers in prompts or answers.
5. **Our rules, not theirs.** Any game-rule fact (free transfer cap, chip sets, chip expiry, DEFCON scoring) is checked against the live FPL API before it is encoded.
6. **Existing guards stay.** `formatSquadOwnershipGuard`, `enforceSquadOwnershipOnAnswer`, data integrity rules, no em-dashes, photo rules, GW1 unlimited transfer logic. The framework sits on top of these and never weakens them.
7. **Shape reasoning, not length.** The framework changes how the model decides. Answers stay short. No reciting checklists to the user.

---

## How it fits together

```
User question
   |
   v
[1] Question type detection (code)     -> transfer / hit / captaincy / chip / comparison / differential / squad review / general / casual
   |
   v
[2] User context (code, Team ID)       -> rank, rank trend, free transfers, bank, chips left per half, risk mode
   |
   v
[3] Message assembly (devchat route)
       - Live FPL data (existing)
       - Squad ownership guard (existing)
       - DECISION CONTEXT block (new): question type, risk mode, free transfers, chip window
   |
   v
Dify DEV app (new copy)
   System prompt = current prompt with REASONING FRAMEWORK rewritten
                   (core principles + playbooks + fixed DEFCON + chip rules)
   |
   v
Answer -> existing output guards (ownership, photos, em-dash strip)
```

---

## Step 0: Set up a Dify dev app and snapshot the prompts

**Status:** Done (4 Nov 2026, commit `00e6e0d`)

- [x] Dify app duplicated as "ChatFPL DEV"
- [x] Dev API key created
- [x] `DIFY_DEV_API_KEY` added to Vercel (Production)
- [x] `/devchat` uses `DIFY_DEV_API_KEY`, falls back to `DIFY_API_KEY`. If an old conversation's Dify ID isn't found in the dev app, devchat starts a fresh Dify conversation instead of erroring
- [x] `docs/dify/system-prompt-prod.md` and `docs/dify/system-prompt-dev.md` saved
- [x] Fresh devchat conversation ("Who should I captain this week?") appears in ChatFPL DEV logs, not production
- [x] Dev app runs gpt-5.4-mini, same as production

### Baseline answer (current prompt, GW10)

The first dev test is a useful "before" example for Step 7. Asked "Who should I captain this week?", the bot:

- Recommended **Ezri Konsa (Arsenal DEF, £4.8m)** as first-choice captain because he leads xPNext at 9.2 with "elite form" at 9.2.
- Offered Gabriel (xPNext 8.2, form 8.2) and Haaland (xPNext 7.2, form 7.2, 79% owned) as alternatives.
- Konsa's photo was broken (see parking lot).

Checked against the live API: **xPNext equals form exactly for all three players.** FPL's own xPNext is built largely from recent form, so it is not an independent projection. A prompt that says "rank by xPNext" is effectively saying "rank by form", which is the short-term signal the articles warn against. Captaining a £4.8m defender on six good weeks is the textbook case. This changes Step 1 (see 1c).

**Note:** `/devchat` and `/chat` share the same conversation list. A conversation started in devchat is linked to the dev app, so continue it in devchat, not `/chat`.

---

## Step 1: Distil the articles into rules

**Status:** Approved (5 Nov 2026). Includes 1a, 1b, 1c (xPNext vs form), 1d.

**Decisions locked in:**

- Default risk mode: **Balanced**
- Assumed risk mode: **always one line in the answer** (revisit after eval if noisy)
- Principles: **approved as written** (no soften/strengthen changes)
- Early promote: **DEFCON + chip fixes to production after devchat test**, if they look good (no need to wait for full framework)

These replace the CAPTAINCY, TRANSFER, PLAYER COMPARISONS, DIFFERENTIALS and GENERAL GAMEWEEK INSIGHTS sections of the Dify REASONING FRAMEWORK (in the dev prompt only). Photo rules stay attached to each section exactly as now.

### 1a. Core principles (top of the REASONING FRAMEWORK)

```text
DECISION PRINCIPLES (apply to all advice):
- Judge every recommendation on the information available now, not on last gameweek's result.
- One or two gameweeks of form is noise unless something structural changed: role, minutes,
  penalty or set-piece duty, or team setup. Long-run underlying numbers (xG, xA, xGI, minutes)
  outrank a short hot streak.
- Minutes first. A player must be likely to start and play 70-90 minutes before ceiling, fixtures
  or price matter. Check Status, Fitness% and Minutes before recommending anyone.
- Prefer players with more than one route to points (goals, assists, clean sheets, defensive
  contributions, set pieces, penalties, bonus).
- Evaluate transfers over the next 3-6 gameweeks, not the next match.
- Never recommend a move whose only justification is a recent haul or a recent blank.
- Doing nothing (rolling the transfer) is a valid recommendation when no sell is forced and no buy
  is clearly better.
- Price rises are a minor tie-breaker, never the main reason for a transfer. Waiting for team news
  is usually worth more than beating a price change.
- Explain why the call makes sense in two or three short reasons. The reasoning matters more than
  the name.
- Use the DECISION CONTEXT block (when present) for the user's risk mode, free transfers and chip window.
```

### 1b. Playbooks (replace the old sections)

**Captaincy** (replaces the ownership > 40% / form > 7.0 rules)

```text
CAPTAINCY DECISIONS:
1. Rank options by xPNext after adjusting for minutes and rotation risk.
2. Factor penalty and set-piece duty, the opponent's defensive quality, and home/away.
3. Apply the risk mode from DECISION CONTEXT (default Balanced):
   - Protect: highest-projected heavily owned option unless there is a real minutes or role concern.
   - Balanced: highest projection; ownership only breaks ties.
   - Chase: a lower-owned captain only if the projection gap is small or the ceiling is clearly higher.
     Low ownership alone is never the reason.
4. Give a clear first choice plus 1-2 alternatives, with the reason each one ranks where it does.
5. Say in one line which risk mode you assumed.
- ALWAYS include player photos for each option.
```

**Transfers** (replaces form > 6.0 / price rises likely)

```text
TRANSFER SUGGESTIONS (work through in order, do not recite the steps):
1. Forced sells first: injured, suspended, lost role, or blank with no reason to hold.
2. High-confidence buys: secure minutes, good fixtures over the next 3-6 GWs, strong team context,
   clear route to points.
3. Compare every move against rolling the transfer. Ask what an extra free transfer unlocks next week.
   If rolling is best, say so plainly.
4. Opportunity cost: is the move sideways? Does it block a future premium? Does it create a
   benching headache between two similar players?
5. Only then use the risk mode to break remaining ties.
- "He blanked twice" is not a sell reason. "Role changed, minutes shrinking, fixtures turn" is.
- Max 3 players from one team. Always mention budget impact.
- When suggesting buys, offer 2-3 options at different price points.
- ALWAYS include player photos for each suggestion.
```

**Hits (-4)** (new section)

```text
HITS (-4):
A hit is a price, not a sin. Recommend it only when the expected gain over 2-4 GWs clearly beats
4 points with room for error.
Supports a hit: player out is injured/suspended/dropped; player in is a genuine captaincy option;
one move fixes several problems (fixtures, structure, chip path).
Argues against: the real motive is last week's score; incoming minutes are not secure; the move
will likely be reversed within two weeks; it burns a transfer or chip route worth more.
State which side of the test the move falls on.
```

**Player comparisons** (replaces Form, Fixtures, Price, PPG, Ownership order)

```text
PLAYER COMPARISONS - compare in this order:
1. Availability and minutes security (Status, Fitness%, Minutes, role).
2. Underlying output over the season (xGI, xG, xA, DC90 for DEF/MID) and routes to points.
3. Fixtures over the next 3-6 GWs.
4. Price and what the price difference buys elsewhere in the squad.
5. Recent form and ownership as context only.
- Give a clear recommendation with reasoning.
- ALWAYS include player photos for players being compared.
```

**Differentials** (keeps the filters as a starting pool, adds substance)

```text
DIFFERENTIALS / HIDDEN GEMS:
- Starting pool: Ownership < 10%, Price < £8.0m.
- Must have secure minutes (regular starter, not just 200+ minutes) and a projection that holds up
  (xPNext, xGI) - low ownership alone is not a reason.
- Form is supporting evidence, not the filter.
- Focus on upcoming fixture swings over 3-6 GWs.
- Highlight 3-4 specific players max.
- ALWAYS include player photos for each differential.
```

**Chips** (new section)

```text
CHIPS:
- There are two full chip sets: Wildcard, Free Hit, Bench Boost and Triple Captain for GW1-19,
  and a fresh set for GW20-38. First-half chips expire at the GW19 deadline and do not carry over.
- Use "Chips Still Available" in USER'S FPL TEAM as the source of truth for what the user has.
- Wildcard: for a structural expected-points problem or a fixture swing that needs a reshape.
  Never after one bad week.
- Free Hit: when one gameweek's schedule is so distorted that a one-week squad clearly beats the real one.
- Triple Captain: premium with strong fixture and high minutes confidence. Take a strong opportunity
  when it appears rather than saving into a corner.
- Bench Boost: only when the bench is naturally playable. Do not advise building an expensive bench
  just for the chip.
- Plan to use expiring chips on real opportunities before the deadline, not dump them in the last week.
```

**Squad review / structure** (new section)

```text
SQUAD REVIEW:
- GK: low opportunity cost usually wins. Rotation pairs only if the saving is real.
- DEF: favour multiple routes (attacking returns, set pieces, clean-sheet odds, defensive
  contributions). Expensive defenders must justify more than clean sheets.
- MID: prioritise penalties, set pieces, advanced roles, 90-minute security, strong team attacks.
- FWD: penalties, minutes and team chance quality dominate. A mid-priced forward beats a premium when
  the premium's price weakens the rest of the squad too much.
- Bench: neither dead nor expensive. Match bench strength to rotation risk and chip plans.
- Start with forced problems (injuries, lost roles), then structural weaknesses, then nice-to-haves.
```

**General gameweek insights** (softened)

```text
GENERAL GAMEWEEK INSIGHTS:
- Focus on 6-8 key players across different positions.
- Prioritise: injury and availability news, role and minutes changes, fixture swings.
- Treat form spikes and price changes as secondary - mention them only when something
  structural explains them.
- ALWAYS include player photos for key players mentioned.
```

**Formatting** (one small edit)

- Change "Structure answers with clear sections" to: "Use sections only when the answer covers several topics. Short questions get short answers."

### 1c. xPNext vs form (approved, merge into 1a and captaincy when writing Step 3)

- Add to core principles: xPNext is FPL's short-horizon estimate and leans heavily on recent form. Treat it as one input, not the answer. Check it against season-long xGI (or DC90 for defensive picks), minutes and role before ranking anyone.
- Captaincy step 1: Shortlist by xPNext, then rank by season-long attacking threat (xGI, xG, shots role, penalties), minutes security and fixture. A defender or low-threat player topping xPNext on a short streak needs a structural reason (set pieces, penalties, new role) to be first choice.
- Comparisons and differentials: when xPNext and season xGI disagree, say so and explain which you trust and why.

### 1d. Things we deliberately leave out

- Champion and Hall of Fame names, interview anecdotes, and the academic research summary. Good for a blog, not useful for a prompt.
- "Never transfer within 24 hours of a rank drop". The bot can't see when a user is on tilt. We keep the underlying rule instead (don't move on results alone).
- Detailed price-change strategy. Covered by one principle line.

**Done when:** ~~You've read 1a, 1b, 1c and 1d and either approved them or marked changes.~~ Done 5 Nov 2026.

---

## Step 2: Verify game-rule facts and fix the two live bugs

**Status:** Partly verified (checked live API at GW9, 4 Nov 2026)

| Fact | Source | Result |
|---|---|---|
| Free transfers bank up to 5 | Current Dify prompt (STANDARD RULES) | Already in production prompt. Keep |
| Two full chip sets, first set expires GW19 | `bootstrap-static` `chips` | **Confirmed.** Wildcard, Free Hit, Bench Boost, Triple Captain each have windows 1(or 2)-19 and 20-38 |
| `defensive_contribution` meaning | `bootstrap-static` elements | **Confirmed it's an action count**, not matches earned. Top DEF at GW9: DC about 105, DC90 about 11 |
| DEFCON thresholds (DEF CBIT 10+, MID CBIT + recoveries 12+) | Dify prompt + chat route | To confirm still correct this season |
| "Bonus system tweak this season" (from articles) | FPL announcements | Not encoding unless confirmed |

### Bug 1: DEFCON definition in the Dify prompt (live in production)

The Dify prompt says `defensive_contribution` is "matches where the player earned the DEFCON bonus" and that per 90 "above ~0.7" means reliable. Both are wrong. The chat route's FIELD EXPLANATIONS say it's an action count with DC90 typically 5-16, which matches the API. The model currently gets both definitions.

Fix in the dev prompt: rewrite the DEFCON section to match the API and the route text (DC = defensive actions, DC90 = actions per 90, reliability judged against the 10 / 12 per-match thresholds, never call DC "matches earned"). Also align field names with the pipe data (`DC`, `DC90`, `CBIT`).

### Bug 2: Chip availability in team context (live in production)

`lib/chat-fpl-team-context.ts` and the inline Team ID block in the devchat route count wildcards up to 2, but treat Free Hit, Bench Boost and Triple Captain as once per season. Under the two-set rules, a user who used Bench Boost in GW5 still has one for GW20-38, but we tell the model it's gone.

Fix (devchat first): compute availability per half using the `chips` windows from `bootstrap-static` and `history.chips[].event`. Output something like:

```text
Chips (GW1-19 set, expires GW19 deadline, 10 GWs left): Wildcard, Free Hit, Triple Captain available. Bench Boost used GW5.
Chips (GW20-38 set): all four available from GW20.
```

**Recommendation:** these two bugs are worth promoting to production on their own once tested on devchat, rather than waiting for the full framework. Your call (see open questions).

**Done when:** Remaining facts confirmed, both bugs fixed on devchat and checked against a real Team ID.

---

## Step 3: Write the dev system prompt

**Status:** Not started

1. In `docs/dify/system-prompt-dev.md`, replace the REASONING FRAMEWORK sections with Step 1 (as approved), keep the untouched sections word for word, and apply the DEFCON fix from Step 2.
2. Paste it into the Dify dev app.
3. Commit the file so the diff against `system-prompt-prod.md` shows exactly what changed.

**Done when:** Dev app runs the new prompt, and the prod vs dev diff is reviewed.

---

## Step 4: Add user context the frameworks need

**Status:** Not started

Most of this is already fetched when a Team ID is linked (`entry`, `picks`, `history`). We add:

| Field | Source | Status |
|---|---|---|
| Overall rank | `entry.summary_overall_rank` | Already in context |
| Rank trend (last 3-5 GWs) | `history.current[].overall_rank` | New |
| Free transfers available now | Derived from `history.current[].event_transfers`, chip weeks and the 5 cap | New. FPL API doesn't return it directly, so we compute it |
| Bank | `entry.last_deadline_bank` | Already in context |
| Chips per half | Step 2 fix | Step 2 |
| Hits taken recently | `history.current[].event_transfers_cost` | New |
| GWs left before first-half chips expire | Current GW vs 19 | New |

**Risk mode:**

- Default is **Balanced**.
- If the user says "protecting my lead", "chasing", "need a differential", "mini-league rival" and similar, we set the mode from their wording.
- Phase 2 (optional): suggest a mode from rank trend or season stage, but never silently. The model states what it assumed.
- Mini-league position needs a league ID we don't currently store. Out of scope for now. The user can just tell us.

Output goes into a short **DECISION CONTEXT** block in the message (see Step 6).

**Done when:** Devchat context includes rank trend, computed free transfers, recent hits, per-half chips and risk mode, verified against a real Team ID.

---

## Step 5: Question type detection

**Status:** Not started

With the playbooks now in the system prompt, detection doesn't need to inject large blocks. It just tells the model which playbook applies and helps pick risk mode. New file, for example `lib/chat-decision-intent.ts`:

| Type | Example triggers |
|---|---|
| `transfer` | "who should I bring in", "sell X?", "replace", "upgrade" |
| `hit` | "-4", "take a hit", "minus 4", "worth a hit" |
| `captaincy` | "captain", "armband", "(C)" |
| `chip` | "wildcard", "free hit", "bench boost", "triple captain", "chip" |
| `comparison` | "X or Y", "X vs Y", "compare" |
| `differential` | "differential", "hidden gem", "punt", "low owned" |
| `squad_review` | "rate my team", "review my squad", "team structure" |
| `general` | Other FPL questions (stat lookups etc.) |
| `casual` | Reuse `chat-conversational.ts`. No decision context at all |

Rules:

- Keyword and pattern based. No extra AI call, no added latency.
- A message can have up to two types (for example "take a -4 to bring in Salah as captain" = hit + captaincy).
- Unit tests using the question set from Step 7.

**Done when:** Classifier exists with tests and gives the expected type for every question in the Step 7 set.

---

## Step 6: Wire into `/devchat` only

**Status:** Not started

In `app/api/devchat/route.ts`:

1. Use `DIFY_DEV_API_KEY` (from Step 0).
2. Add a short DECISION CONTEXT block to the message, after live data and the squad ownership guard:

```text
DECISION CONTEXT:
Question type: hit, captaincy
Risk mode: Balanced (default - user did not specify)
Free transfers available: 2 (bank cap 5)
Recent hits: -4 in GW8
First-half chips expire in 10 GWs: Wildcard, Free Hit, Triple Captain still available
Apply the matching playbook from your instructions. Do not list the playbook steps in your answer.
```

3. Keep the builder in a new file (for example `lib/chat-decision-context.ts`) so production can import it later with no copy-paste.
4. Optional toggle (query param or owner setting) to switch back to the production Dify app for side-by-side comparison.

**Done when:** Devchat answers use the new prompt and context, production `/api/chat` is untouched (verified by diff), and the toggle works.

---

## Step 7: Test question set (before and after)

**Status:** Not started

About 20 realistic questions, each run against the production prompt and the dev prompt. Stored in the repo (for example `docs/nov26-engine-eval.md`) with both answers side by side.

1. "Should I take a -4 to bring in [in-form player] for [blanking player]?"
2. "[Player] has blanked twice. Should I sell?"
3. "[Player] scored a hat-trick. Should I buy him?"
4. "Who should I captain this week?" (no Team ID)
5. "Who should I captain? I'm protecting a mini-league lead."
6. "Who should I captain? I need to catch up 80 points."
7. "Should I roll my transfer?"
8. "Is it time to wildcard?" (after one bad week)
9. "Is it time to wildcard?" (with injuries and a fixture swing)
10. "When should I use my triple captain?"
11. "Should I bench boost this week?" (weak bench)
12. "Rate my team." (Team ID linked)
13. "[Premium A] or [Premium B]?"
14. "Is [cheap defender] worth it?"
15. "Should I get [player] before his price rises?"
16. "I took a big hit and lost rank, what now?"
17. "Best differential for this gameweek?"
18. "Who are the best DEFCON defenders?" (checks Bug 1 fix)
19. "What chips do I have left?" (Team ID with a chip used, checks Bug 2 fix)
20. Casual message (for example "thanks mate"): no decision context.
21. Pure stat lookup ("How many goals has Haaland scored?"): short answer, no playbook.

**What we judge each answer on:**

- Uses the right reasoning (minutes, horizon, forced sells, hit test, risk mode).
- States assumed risk mode when relevant.
- Recommends rolling when that's genuinely best.
- No form-chasing or price-chasing as the main reason.
- DEFCON and chip facts correct.
- Still correct on data, ownership, prices and photos.
- Not longer or preachier than before.

**Done when:** You've reviewed both columns and are happy the dev answers are better.

---

## Step 8: Tune

**Status:** Not started

Adjust prompt wording, trim anything the model recites back, fix question-type misses found in Step 7. Re-run only the questions that failed. Every prompt change goes through `docs/dify/system-prompt-dev.md` first.

**Done when:** No open issues from the eval.

---

## Step 9: Soak on devchat

**Status:** Not started

Use devchat for normal questions for a few days. Note anything odd in the soak log at the bottom of this file.

**Done when:** A few days of normal use with no regressions.

---

## Step 10: Promote to production

**Status:** Not started

1. Copy `docs/dify/system-prompt-dev.md` into the production Dify app. Update `docs/dify/system-prompt-prod.md` to match.
2. Import `lib/chat-decision-context.ts` and the question type classifier into `app/api/chat/route.ts`.
3. Apply the Step 2 chip fix and Step 4 context to the shared `lib/chat-fpl-team-context.ts`.
4. Commit, push, run the production chat status check.
5. Spot-check five questions from the eval set on `https://www.chatfpl.ai`.

**Rollback:** paste `system-prompt-prod.md` (previous version from git) back into the production Dify app and revert the route commit.

**Done when:** Live on production with status Online and spot-checks passing.

---

## Open questions for you

1. Default risk mode: **Balanced** - agreed.
2. Assumed mode line: **always** for now, revisit after Step 7 eval.
3. Dify dev app: **done** (Step 0).
4. Early promote DEFCON + chips: **yes, after devchat test passes**.
5. Principles: **approved, no changes**.
6. Step 1 (1a-1c): **approved**.

---

## Parking lot (found along the way, not part of the framework)

- **Missing PL headshots (post photo day signings, 4 Nov 2026).** Players signed after the Premier League photo shoot often have no image on the `premierleague25` CDN (403 or broken img). Example: Ezri Konsa at Arsenal in devchat captain test. Expected limitation, not a Nov26 framework blocker. Optional later: silhouette fallback when CDN fails, or verified overrides in `lib/fpl-headshot-overrides.ts` for high-traffic names. Struijk-style wrong-face overrides stay separate from "no image at all."

---

## Soak log

_(empty)_
