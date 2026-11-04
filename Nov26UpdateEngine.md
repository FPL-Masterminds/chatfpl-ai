# Nov26 Update Engine: Decision Framework for ChatFPL

Working document for adding a "how to think" layer to ChatFPL answers, based on the reasoning in three SmartPlay articles (August 2026):

- Part 1: Stop copying the champion (six disciplines)
- Part 2: The elite manager's playbook (transfers, hits, captaincy, chips)
- Part 3: FPL is a skill game (evidence, survivorship traps, risk modes)

We work through this one step at a time. Each step has a status, a "done when" check, and nothing moves to production until Step 9.

---

## Ground rules

1. **Development only.** All changes go into `/devchat` (`app/api/devchat/route.ts`). The `/devchat` page and API are owner-only (403 for everyone else).
2. **Do not edit the Dify system prompt.** `/devchat` and `/api/chat` share the same `DIFY_API_KEY`, so the same Dify app. A dashboard change would hit production instantly. Framework text is injected from code in the devchat route only.
3. **Our own words.** The articles are a competitor's content. We encode the general FPL principles as our own rules. No pasted article text, no SmartPlay branding, no quoting named managers in prompts or answers.
4. **Our rules, not theirs.** Any game-rule fact (free transfer cap, chip sets, chip expiry, DEFCON scoring) is checked against the live FPL API and our existing rules before it is encoded. The blog is not a source of truth for rules.
5. **Existing guards stay.** `formatSquadOwnershipGuard`, `enforceSquadOwnershipOnAnswer`, data integrity rules, no em-dashes, photo rules. The framework sits on top of these and never weakens them.
6. **Shape reasoning, not length.** The framework changes how the model decides. Answers stay short. No reciting checklists to the user.

---

## How it fits together

```
User question
   |
   v
[1] Intent detection (code)            -> transfer / hit / captaincy / chip / squad review / general
   |
   v
[2] User context (code, Team ID)       -> rank, rank trend, free transfers, bank, chips left, risk mode
   |
   v
[3] Prompt assembly (devchat route)
       - Live FPL data (existing)
       - Squad ownership guard (existing)
       - Core principles block (new, always on for FPL questions)
       - One matching playbook (new, only the relevant one)
       - User context + assumed risk mode (new)
   |
   v
Dify (unchanged app)  ->  answer  ->  existing output guards
```

---

## Step 1: Distil the articles into rules

**Status:** Draft below, awaiting your review

The articles become two things: a short set of always-on principles, and a playbook per question type. Written as instructions to the model, in our words.

### 1a. Core principles (always on for FPL advice questions)

```text
DECISION PRINCIPLES:
- Judge every recommendation on the information available now, not on last gameweek's result.
- One or two gameweeks of form is noise unless something structural changed: role, minutes,
  penalty or set-piece duty, or team setup. Long-run underlying numbers outrank a short hot streak.
- Minutes first. A player must be likely to start and play 70-90 minutes before ceiling, fixtures
  or price matter.
- Prefer players with more than one route to points (goals, assists, clean sheets, defensive
  contributions, set pieces, penalties, bonus).
- Evaluate transfers over the next 3-6 gameweeks, not the next match.
- Never recommend a move whose only justification is a recent haul or a recent blank.
- Doing nothing (rolling the transfer) is a valid recommendation when no sell is forced and no buy
  is clearly better.
- Explain why the call makes sense in two or three short reasons. The reasoning matters more than
  the name.
```

### 1b. Playbooks (one injected per question)

**Transfers**

```text
TRANSFER FRAMEWORK (work through in order, do not recite to the user):
1. Forced sells first: injured, suspended, lost role, or blank with no reason to hold.
2. High-confidence buys: secure minutes, good fixtures over 3-6 GWs, strong team context,
   clear route to points.
3. Compare every move against rolling the transfer. Ask what an extra free transfer unlocks next week.
4. Opportunity cost: is the move sideways? Does it block a future premium? Does it create a
   benching headache between two similar players?
5. Only then use the user's risk mode to break remaining ties.
"He blanked twice" is not a sell reason. "Role changed, minutes shrinking, fixtures turn" is.
```

**Hits (-4)**

```text
HIT TEST:
A hit is a price, not a sin. Recommend it only when the expected gain over 2-4 GWs clearly beats
4 points with room for error.
Supports a hit: player out is injured/suspended/dropped; player in is a genuine captaincy option;
one move fixes several problems (fixtures, structure, chip path).
Argues against: the real motive is last week's score; incoming minutes are not secure; the move
will likely be reversed within two weeks; it burns a transfer or chip route worth more.
State which side of the test the move falls on.
```

**Captaincy**

```text
CAPTAINCY FRAMEWORK:
1. Rank options by xPNext after adjusting for minutes and rotation risk.
2. Factor penalty and set-piece duty, the opponent's defensive quality, and home/away.
3. Apply risk mode:
   - Protect: highest-projected heavily owned option unless there is a real minutes or role concern.
   - Balanced (default): highest projection; ownership only breaks ties.
   - Chase: a lower-owned captain only if the projection gap is small or the ceiling is clearly higher.
     Low ownership alone is never the reason.
4. Say in one line which mode you assumed.
```

**Chips**

```text
CHIP FRAMEWORK (use only the chip rules in the USER'S FPL TEAM / rules data, never from memory):
- Wildcard: for a structural expected-points problem or a fixture swing that needs a reshape.
  Never after one bad week.
- Free Hit: when one gameweek's schedule is so distorted that a one-week squad clearly beats the real one.
- Triple Captain: premium with strong fixture and high minutes confidence. Take the opportunity
  when it appears rather than saving into a corner.
- Bench Boost: only when the bench is naturally playable. Do not advise building an expensive bench
  just for the chip.
- If chips expire at a deadline, plan to use them on real opportunities before expiry rather than
  dumping them in the last week.
```

**Squad review / structure**

```text
SQUAD STRUCTURE:
- GK: low opportunity cost usually wins. Rotation pairs only if the saving is real.
- DEF: favour multiple routes (attacking returns, set pieces, clean-sheet odds, defensive
  contributions). Expensive defenders must justify more than clean sheets. Cheap nailed starters are
  valuable for budget and Bench Boost.
- MID: prioritise penalties, set pieces, advanced roles, 90-minute security, strong team attacks.
- FWD: penalties, minutes and team chance quality dominate. A mid-priced forward beats a premium when
  the premium's price weakens the rest of the squad too much.
- Bench: neither dead nor expensive. Match bench strength to rotation risk and chip plans.
```

### 1c. Things we deliberately leave out

- Champion and Hall of Fame names, interview anecdotes, and the academic research summary. Good for a blog, not useful for a prompt.
- "Never transfer within 24 hours of a rank drop". The bot can't see when a user is on tilt. We keep the underlying rule instead (don't move on results alone).
- Price-change strategy detail. Kept to one line: wait for team news unless a price change would block a move already decided.

**Done when:** You've read 1a, 1b and 1c and either approved them or marked changes.

---

## Step 2: Verify game-rule facts

**Status:** Not started

The articles make rule claims for 2026/27. Before any of these go into a prompt, we confirm them against the live FPL API (`bootstrap-static` chips list, `entry/{id}/history`) and existing code.

| Claim in articles | What we check | Notes |
|---|---|---|
| Up to 5 free transfers can be banked | FPL game rules / API | Affects "rolling is an active decision" |
| Two full chip sets, first set expires at GW19 deadline | `bootstrap-static` `chips` (`start_event` / `stop_event`) | `fpl_temp.json` already shows wildcard and free hit split 2-19 / 20-38 |
| Defensive contribution scoring thresholds | Existing DEFCON text in the chat prompt | Current prompt labels it "2025/26". Confirm still correct this season |
| Bonus system tweak this season | FPL announcements | Only mention if confirmed |

**Known existing issue to look at here:** `lib/chat-fpl-team-context.ts` (and the inline Team ID block in the devchat route) treats Free Hit, Bench Boost and Triple Captain as one-per-season, and wildcard as two. If every chip now comes in two halves, "Chips Still Available" can be wrong for users, which would undermine the chip playbook. Fix belongs in this step (devchat first).

**Done when:** Every row above is confirmed or corrected, and chip availability is computed per half-season in the devchat context.

---

## Step 3: Add user context the frameworks need

**Status:** Not started

The risk-mode and roll-vs-move logic only works if the model knows the user's situation. Most of this is already fetched when a Team ID is linked (`entry`, `picks`, `history`). We add:

| Field | Source | Status |
|---|---|---|
| Overall rank | `entry.summary_overall_rank` | Already in context |
| Rank trend (last 3-5 GWs) | `history.current[].overall_rank` | New |
| Free transfers available now | Derived from `history.current[].event_transfers` and transfer rules | New, must compute (FPL API doesn't return it directly) |
| Bank | `entry.last_deadline_bank` | Already in context |
| Chips available, per half | `history.chips` + chip windows from Step 2 | Fix in Step 2 |
| Hits taken recently | `history.current[].event_transfers_cost` | New |
| Gameweeks left in this chip half | Current GW vs expiry GW | New |

**Risk mode:**

- Default is **Balanced**, stated in the answer in one short line.
- If the user says "protecting my lead", "chasing", "need a differential", "mini-league rival", we switch mode from their wording.
- Phase 2 (optional): infer a suggestion from rank trend or GW number (for example, late season with a falling rank), but never silently. The model says what it assumed.
- Mini-league position needs a league ID we don't currently store. Out of scope for now. The user can just tell us.

**Done when:** Devchat context includes rank trend, computed free transfers, recent hits, per-half chips and a risk-mode line, verified against a real Team ID.

---

## Step 4: Intent detection

**Status:** Not started

A small, deterministic classifier in code (new file, for example `lib/chat-decision-intent.ts`) that maps the user's message to one intent:

| Intent | Example triggers |
|---|---|
| `transfer` | "who should I bring in", "sell X?", "replace", "upgrade" |
| `hit` | "-4", "take a hit", "minus 4", "worth a hit" |
| `captaincy` | "captain", "armband", "(C)", "triple captain" (also flags chip) |
| `chip` | "wildcard", "free hit", "bench boost", "triple captain", "chip" |
| `squad_review` | "rate my team", "review my squad", "team structure" |
| `general` | Everything else FPL related (stat lookups, comparisons): principles only, no playbook |
| `none` | Casual chat (reuse `chat-conversational.ts`): no framework at all |

Rules:

- Keyword and pattern based first. No extra LLM call, no added latency.
- A message can carry two intents (for example "take a -4 to bring in Salah as captain"). Cap at two playbooks.
- Unit tests for the classifier using the question set from Step 6.

**Done when:** Classifier exists with tests and gives the expected intent for every question in the Step 6 set.

---

## Step 5: Wire into `/devchat` only

**Status:** Not started

In `app/api/devchat/route.ts`, add a decision framework section to the assembled message:

1. Core principles block (Step 1a) for any intent except `none`.
2. Matching playbook(s) (Step 1b) from Step 4.
3. User context and assumed risk mode (Step 3).
4. One instruction: "Use the framework to decide. Do not list the framework steps in your answer."

Placement: after live data and the squad ownership guard, before formatting rules, so data integrity and ownership rules still win any conflict.

Kept in a new file (for example `lib/chat-decision-framework.ts`) so production can import the same thing later with no copy-paste.

Optional toggle: a query param or owner setting to switch the framework off in devchat, for side-by-side comparison.

**Done when:** Devchat answers use the framework, production `/api/chat` is untouched (verified by diff), and the toggle works.

---

## Step 6: Test question set (before and after)

**Status:** Not started

About 20 realistic questions, run on devchat with the framework off, then on. Stored in this repo (for example `docs/nov26-engine-eval.md`) with both answers side by side.

Draft list:

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
18. "Should I sell [injured player] or wait?"
19. Casual message (for example "thanks mate"): framework must not trigger.
20. Pure stat lookup (for example "How many goals has Haaland scored?"): principles only, no playbook, still short.

**What we judge each answer on:**

- Uses the right reasoning (minutes, horizon, forced sells, hit test, risk mode).
- States assumed risk mode when relevant.
- Recommends rolling when that's genuinely best.
- Still correct on data, ownership, prices and photos.
- Not longer or preachier than before.

**Done when:** You've reviewed both columns and are happy the "on" answers are better.

---

## Step 7: Tune

**Status:** Not started

Adjust wording, trim anything the model recites back, fix intent misses found in Step 6. Re-run only the questions that failed.

**Done when:** No open issues from the eval.

---

## Step 8: Soak on devchat

**Status:** Not started

Use devchat for normal questions for a few days. Note anything odd in a short log at the bottom of this file.

**Done when:** A few days of normal use with no regressions.

---

## Step 9: Promote to production

**Status:** Not started

1. Import the same `lib/chat-decision-framework.ts` and intent classifier into `app/api/chat/route.ts`.
2. Apply the Step 2 chip fix and Step 3 context to the shared `lib/chat-fpl-team-context.ts`.
3. Commit, push, run production chat status check.
4. Spot-check five questions from the eval set on `https://www.chatfpl.ai`.

**Done when:** Live on production with status Online and spot-checks passing.

---

## Open questions for you

1. Default risk mode when the user doesn't say: **Balanced** (proposed). Agree?
2. Should the answer always include the one-line "assumed mode" note, or only for captaincy and hits?
3. Do you want a separate Dify dev app (own API key) for devchat later, so we could test system prompt changes too? Not needed for this plan.
4. Any principles from the articles you disagree with or want stronger or softer?

---

## Soak log

_(empty)_
