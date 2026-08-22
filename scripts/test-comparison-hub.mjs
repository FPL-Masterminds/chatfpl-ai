import { config as loadEnv } from "dotenv";
loadEnv();

const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; ChatFPL/1.0)" },
});
const b = await res.json();
console.log(`bootstrap elements: ${b.elements?.length ?? 0}`);
const anyMids = (b.elements ?? []).some((p) => (p.minutes ?? 0) >= 1000);
console.log(`anyMidseason: ${anyMids}`);

// Replicate filterEligiblePlayers logic
function isEligiblePlayer(p) {
  const mins = p.minutes ?? 0;
  const sel  = parseFloat(p.selected_by_percent ?? "0");
  return (mins >= 1000 && sel >= 1.0) || mins >= 1500;
}
function filterEligiblePlayers(elements) {
  const anyMidseason = elements.some((p) => (p.minutes ?? 0) >= 1000);
  if (anyMidseason) return elements.filter(isEligiblePlayer);
  return elements.filter((p) => {
    if (isEligiblePlayer(p)) return true;
    const sel    = parseFloat(p.selected_by_percent ?? "0");
    const ep     = parseFloat(p.ep_next ?? "0");
    const status = p.status ?? "a";
    if (status !== "a") return false;
    return sel >= 2.0 || ep >= 4.0;
  });
}

const filtered = filterEligiblePlayers(b.elements ?? []);
console.log(`filtered eligible: ${filtered.length}`);
const byPos = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const p of filtered) byPos[p.element_type]++;
console.log(`  GKP ${byPos[1]}, DEF ${byPos[2]}, MID ${byPos[3]}, FWD ${byPos[4]}`);

// Simulate top10 by ownership for each outfield position (comparison hub logic)
for (const posId of [2, 3, 4]) {
  const top10 = filtered
    .filter((p) => p.element_type === posId && (p.chance_of_playing_next_round ?? 100) > 0)
    .sort((a, b) => parseFloat(b.selected_by_percent ?? "0") - parseFloat(a.selected_by_percent ?? "0"))
    .slice(0, 10);
  console.log(`pos ${posId} top10: ${top10.length} players, top: ${top10.slice(0, 3).map((p) => `${p.web_name} (${p.selected_by_percent}%)`).join(", ")}`);
}
