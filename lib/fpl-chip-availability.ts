/** FPL chip sets: full set GW1-19 and a fresh set GW20-38 (2025/26 rules). */

export type FplPlayedChip = { name: string; event: number };

const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
};

const H2_START_GW = 20;

function chipsPlayedInHalf(
  played: FplPlayedChip[],
  halfStart: number,
  halfEnd: number,
): FplPlayedChip[] {
  return played.filter((c) => {
    const ev = c.event ?? 0;
    return ev >= halfStart && ev <= halfEnd;
  });
}

function formatHalfChipLine(
  played: FplPlayedChip[],
  halfStart: number,
  halfEnd: number,
  halfLabel: string,
  currentGw: number,
): string {
  const halfPlayed = chipsPlayedInHalf(played, halfStart, halfEnd);
  const usedNames = halfPlayed.map((c) => c.name);
  const available: string[] = [];

  if (usedNames.filter((n) => n === "wildcard").length < 1) {
    available.push(CHIP_LABELS.wildcard);
  }
  for (const key of ["freehit", "bboost", "3xc"] as const) {
    if (!usedNames.includes(key)) available.push(CHIP_LABELS[key]);
  }

  const usedParts = halfPlayed.map(
    (c) => `${CHIP_LABELS[c.name] ?? c.name} (GW${c.event})`,
  );

  let line = `Chips (${halfLabel} set)`;
  if (currentGw >= halfStart && currentGw <= halfEnd) {
    const gwsLeft = Math.max(0, halfEnd - currentGw);
    line += `, ${gwsLeft} GW(s) left in this half`;
  }
  if (available.length) {
    line += `: ${available.join(", ")} available`;
  } else {
    line += `: all four used in this half`;
  }
  if (usedParts.length) {
    line += `. Used in this half: ${usedParts.join(", ")}`;
  }
  return line;
}

/** Text injected into USER'S FPL TEAM for chat routes. */
export function formatFplChipContextForChat(
  playedChips: FplPlayedChip[],
  currentGw: number,
): {
  chipsUsedSummary: string;
  chipsStillAvailableSummary: string;
  chipsByHalfBlock: string;
} {
  const played = (playedChips ?? []).filter(
    (c) => c?.name && Number.isFinite(c.event),
  );

  const chipsUsedSummary =
    played.length > 0
      ? played.map((c) => `${c.name} (GW${c.event})`).join(", ")
      : "None yet";

  const inFirstHalf = currentGw < H2_START_GW;
  const currentHalfStart = inFirstHalf ? 1 : H2_START_GW;
  const currentHalfEnd = inFirstHalf ? H2_START_GW - 1 : 38;
  const halfPlayed = chipsPlayedInHalf(played, currentHalfStart, currentHalfEnd);
  const usedInCurrentHalf = halfPlayed.map((c) => c.name);

  const availableNow: string[] = [];
  if (usedInCurrentHalf.filter((n) => n === "wildcard").length < 1) {
    availableNow.push("wildcard");
  }
  if (!usedInCurrentHalf.includes("freehit")) availableNow.push("freehit");
  if (!usedInCurrentHalf.includes("bboost")) availableNow.push("bboost (bench boost)");
  if (!usedInCurrentHalf.includes("3xc")) availableNow.push("3xc (triple captain)");

  const chipsStillAvailableSummary =
    availableNow.length > 0 ? availableNow.join(", ") : "All used in current half";

  const firstHalfLine = formatHalfChipLine(played, 1, H2_START_GW - 1, "GW1-19", currentGw);
  const secondHalfLine = formatHalfChipLine(
    played,
    H2_START_GW,
    38,
    "GW20-38",
    currentGw,
  );

  return {
    chipsUsedSummary,
    chipsStillAvailableSummary,
    chipsByHalfBlock: `${firstHalfLine}\n${secondHalfLine}`,
  };
}
