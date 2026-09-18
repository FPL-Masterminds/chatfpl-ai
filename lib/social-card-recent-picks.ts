import { prisma } from "@/lib/prisma";

export const SOCIAL_CARD_PLAYER_COOLDOWN_DAYS = 7;

export async function getRecentlyUsedPlayerCodes(
  days = SOCIAL_CARD_PLAYER_COOLDOWN_DAYS,
): Promise<Set<number>> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.socialCardRecentPick.findMany({
    where: { picked_at: { gte: since } },
    select: { player_code: true },
    distinct: ["player_code"],
  });

  return new Set(rows.map((row) => row.player_code));
}

export async function recordSocialCardPlayerPicks(codes: number[]): Promise<void> {
  const unique = [...new Set(codes.filter((c) => c > 0))];
  if (!unique.length) return;

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - SOCIAL_CARD_PLAYER_COOLDOWN_DAYS);

  await prisma.$transaction([
    prisma.socialCardRecentPick.createMany({
      data: unique.map((player_code) => ({ player_code })),
    }),
    prisma.socialCardRecentPick.deleteMany({
      where: { picked_at: { lt: cutoff } },
    }),
  ]);
}
