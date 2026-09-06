"use client"

import { IpadMockupCard } from "@/components/mockups/tablet-mockup-card"
import { ChatShowcase } from "@/components/chat-showcase"

export function ChatShowcaseIpadPreview() {
  return (
    <section className="relative px-4 pb-8 bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#00FF87]/70">Device preview</p>
          <h3 className="mt-2 text-2xl font-bold text-white">iPad landscape</h3>
          <p className="mt-2 text-sm text-white/55">
            Same live showcase mockup inside an iPad frame (landscape orientation).
          </p>
        </div>
        <div className="flex justify-center">
          <IpadMockupCard orientation="landscape" variant="spaceBlack" showCamera={false}>
            <ChatShowcase embedded />
          </IpadMockupCard>
        </div>
      </div>
    </section>
  )
}
