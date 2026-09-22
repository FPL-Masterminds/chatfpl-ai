# ChatFPL Pinterest (IFTTT + existing Twitter pipeline)

Pinterest uses the **same daily image** as X. No new Apps Script project and **no extra ScreenshotOne captures**.

| Step | What |
|------|------|
| **ChatFPL.ai** (Twitter) | ScreenshotOne → `ChatFPL_Screenshots` on Drive → IFTTT → X |
| **Pinterest** (this doc) | IFTTT watches **the same folder** → Create pin |

Instagram stays on Buffer (`chatfpl-instagram-buffer`). Do not route Pinterest through Buffer unless you want a second manual channel.

## Why Pinterest (plain English)

People search Google and Pinterest for FPL tips, captain picks, and fixture graphics. **Parasite SEO** means publishing useful visuals on a site that already has strong search presence (Pinterest) so your pins (and sometimes the pin pages) show up in results, with a **link back** to ChatFPL. You are not replacing your own site; you are adding another front door that points to `https://www.chatfpl.ai`.

Pinterest is especially good for evergreen FPL topics: injuries, fixtures, differentials, captain picks.

## Before you start

1. [Pinterest](https://www.pinterest.com/) account (Business is recommended for analytics; not required for IFTTT).
2. Create **one board** for ChatFPL, e.g. `Fantasy Premier League / ChatFPL`.
3. [IFTTT](https://ifttt.com) with Pinterest connected (same account you use for X).

Free IFTTT checks Drive about **once per hour**; Pro checks about every **5 minutes**. Pinterest allows about **25 pins/day** on free IFTTT.

## Create the Applet

1. [Connect Google Drive and Pinterest on IFTTT](https://ifttt.com/connect/google_drive/pinterest) (or **Create** → **Applet**).
2. **If** → Google Drive → **New photo in your folder**
   - Folder path: the folder your Twitter script uses, usually **`ChatFPL_Screenshots`** (same Google account as Apps Script).
3. **Then** → Pinterest → **Create pin**
   - **Board**: your ChatFPL board
   - **Image URL**: choose the ingredient **Photo url** / `photo_url` from the trigger (IFTTT exposes a public image URL; do not paste a Drive preview link by hand).
   - **Source URL**: `https://www.chatfpl.ai?utm_source=pinterest&utm_medium=ifttt&utm_campaign=daily_social`
   - **Title** (example): `Fantasy Premier League picks and data | ChatFPL`
   - **Description** (example): `Live FPL captain picks, injuries, fixtures, and transfer trends. Free AI help for your squad at ChatFPL.ai`

4. Turn the Applet **On**.

## Test

1. In Apps Script (Twitter project), run **`postSlot1`** once (or wait for the 09:00 London trigger).
2. Confirm a new PNG appears in `ChatFPL_Screenshots`.
3. Within up to an hour (or 5 minutes on Pro), check the board for a new pin.
4. Open the pin and confirm the outbound link goes to ChatFPL.

If the pin fails:

| Symptom | Likely fix |
|---------|------------|
| No pin, X still works | Pinterest not connected on IFTTT, wrong folder path, or Applet off |
| Pin without image | Image URL must be the trigger **Photo url**, not a copied browser link |
| Duplicate pins | Only one Applet on this folder; remove extra Drive → Pinterest applets |

## Cost and limits

- **ScreenshotOne**: unchanged (still one capture per day for X).
- **IFTTT**: second Applet on the same trigger event (X + Pinterest from one file).
- **Posting volume**: one pin per day is well within Pinterest/IFTTT limits.

## Optional upgrades (later)

| Goal | Approach |
|------|----------|
| Link each pin to a **hub page** (injuries, captains, etc.) | Pinterest API v5 from Apps Script, or a second daily capture with `hub=` in the social-card URL |
| **Taller** images (Pinterest prefers ~2:3) | New social-card layout + ScreenshotOne size; separate capture |
| Different **time** than X | Copy `chatfpl-twitter/Code.gs` into a new project, folder `ChatFPL_Pinterest`, own trigger |

For most traffic with least work, the single Applet on `ChatFPL_Screenshots` is enough.

## Related repo paths

- Twitter script: `scripts/google-apps-script/chatfpl-twitter/Code.gs`
- Instagram (Buffer): `scripts/google-apps-script/chatfpl-instagram-buffer/`
