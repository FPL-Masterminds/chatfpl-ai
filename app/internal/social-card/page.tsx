import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SocialCardCanvas } from "@/components/social-card-canvas";
import { getSocialCardData, parseSocialCardSlot } from "@/lib/social-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Card",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function SocialCardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const slot = parseSocialCardSlot(params.slot);
  const card = await getSocialCardData(slot);
  if (!card) notFound();

  return <SocialCardCanvas card={card} />;
}
