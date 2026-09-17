"use client"

type ChatToastDismissProps = {
  onDismiss: () => void
  label: string
}

/** 44px minimum touch target for mobile (WCAG / iOS HIG). */
export function ChatToastDismiss({ onDismiss, label }: ChatToastDismissProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
      }}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors active:bg-white/15 hover:bg-white/10 hover:text-white touch-manipulation"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.25">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  )
}
