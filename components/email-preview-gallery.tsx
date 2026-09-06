"use client"

import { useMemo, useState } from "react"
import type { EmailPreviewDefinition, EmailPreviewGroup } from "@/lib/email-content"

const GROUP_LABELS: Record<EmailPreviewGroup, string> = {
  user: "User transactional",
  admin: "Admin notifications",
  marketing: "Marketing",
}

type EmailPreviewGalleryProps = {
  previews: Array<
    EmailPreviewDefinition & {
      html: string
    }
  >
}

export function EmailPreviewGallery({ previews }: EmailPreviewGalleryProps) {
  const [selectedId, setSelectedId] = useState(previews[0]?.id ?? "")
  const selected = previews.find((preview) => preview.id === selectedId) ?? previews[0]

  const grouped = useMemo(() => {
    const map = new Map<EmailPreviewGroup, typeof previews>()
    for (const preview of previews) {
      const list = map.get(preview.group) ?? []
      list.push(preview)
      map.set(preview.group, list)
    }
    return map
  }, [previews])

  if (!selected) return null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-28 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-80">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest text-white/35">Email scenarios</p>
          <p className="mt-1 text-sm text-white/60">
            Private preview only. Sample data is used in links and names.
          </p>

          <div className="mt-5 space-y-5">
            {(["user", "admin", "marketing"] as EmailPreviewGroup[]).map((group) => {
              const items = grouped.get(group) ?? []
              if (!items.length) return null
              return (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#00FF87]/80">
                    {GROUP_LABELS[group]}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const active = item.id === selected.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                            active
                              ? "border-[#00FF87]/40 bg-[#00FF87]/10"
                              : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                          }`}
                        >
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-white/45">{item.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
            <div>
              <h1 className="text-xl font-semibold text-white">{selected.label}</h1>
              <p className="mt-1 text-sm text-white/55">{selected.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55">
                {selected.audience}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] ${
                  selected.respectsOptOut
                    ? "border-amber-400/30 text-amber-200/80"
                    : "border-cyan-400/30 text-cyan-200/80"
                }`}
              >
                {selected.respectsOptOut ? "Respects marketing opt-out" : "Transactional (always sent)"}
              </span>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-white/35">Subject</dt>
              <dd className="mt-1 font-medium text-white">{selected.subject}</dd>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-white/35">Unsubscribe footer</dt>
              <dd className="mt-1 text-white/75">
                {selected.includeUnsubscribe ? "Included (one-click token link)" : "Not included (internal email)"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#ececec]">
            <iframe
              title={`${selected.label} email preview`}
              srcDoc={selected.html}
              className="h-[720px] w-full bg-white"
              sandbox=""
            />
          </div>
        </div>
      </section>
    </div>
  )
}
