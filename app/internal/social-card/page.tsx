import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SocialCardCanvas } from "@/components/social-card-canvas";
import { auth } from "@/lib/auth";
import { isSiteOwner } from "@/lib/god-mode";
import { isSocialCardTokenValid } from "@/lib/social-card-token";
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
  searchParams: Promise<{ token?: string; slot?: string; hub?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const ownerPreview = isSiteOwner(session?.user?.email);
  if (!ownerPreview && !isSocialCardTokenValid(params.token)) notFound();

  const slot = parseSocialCardSlot(params.slot);
  const tokenCapture = isSocialCardTokenValid(params.token);
  const card = await getSocialCardData(slot, params.hub, {
    recordPick: tokenCapture && !ownerPreview,
  });
  if (!card) notFound();

  return <SocialCardCanvas card={card} />;
}
