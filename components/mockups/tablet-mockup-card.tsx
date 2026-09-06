import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

const ipadFrameVariants = {
  spaceGray: {
    frame: "bg-gradient-to-b from-[#7a7a7f] to-[#525256]",
    button: "bg-[#3d3d41]",
  },
  spaceBlack: {
    frame: "bg-gradient-to-b from-[#45454a] to-[#232326]",
    button: "bg-[#141416]",
  },
  silver: {
    frame: "bg-gradient-to-b from-[#f4f4f6] to-[#dcdce0]",
    button: "bg-[#c9c9cd]",
  },
  starlight: {
    frame: "bg-gradient-to-b from-[#f4ecdc] to-[#e3d7bd]",
    button: "bg-[#cfc19f]",
  },
  blue: {
    frame: "bg-gradient-to-b from-[#b3d0e6] to-[#87afcf]",
    button: "bg-[#6c93b3]",
  },
  purple: {
    frame: "bg-gradient-to-b from-[#d0c0e0] to-[#ac99c5]",
    button: "bg-[#8f7aa8]",
  },
  pink: {
    frame: "bg-gradient-to-b from-[#f2d2d7] to-[#e1b1b9]",
    button: "bg-[#c88f98]",
  },
  yellow: {
    frame: "bg-gradient-to-b from-[#f6e29a] to-[#ecc95d]",
    button: "bg-[#d1ab3d]",
  },
} as const

export type IpadFrameVariant = keyof typeof ipadFrameVariants
export type IpadOrientation = "portrait" | "landscape"

const IPAD_PORTRAIT_ASPECT = 178.5 / 247.6
const IPAD_LANDSCAPE_ASPECT = 247.6 / 178.5

type IpadMockupCardProps = Readonly<
  ComponentPropsWithoutRef<"div"> & {
    variant?: IpadFrameVariant
    orientation?: IpadOrientation
    visibleRatio?: number
    showCamera?: boolean
  }
>

function IpadPortraitButtons({
  frame,
}: Readonly<{
  frame: (typeof ipadFrameVariants)[IpadFrameVariant]
}>) {
  return (
    <>
      <div
        className={cn(
          "absolute -top-[3px] left-[13%] h-[3px] w-[9%] rounded-t-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute -top-[3px] left-[24%] h-[3px] w-[9%] rounded-t-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute -top-[3px] right-[16%] h-[3px] w-[16%] rounded-t-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
    </>
  )
}

function IpadLandscapeButtons({
  frame,
}: Readonly<{
  frame: (typeof ipadFrameVariants)[IpadFrameVariant]
}>) {
  return (
    <>
      <div
        className={cn(
          "absolute top-[13%] -right-[3px] h-[9%] w-[3px] rounded-r-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute top-[24%] -right-[3px] h-[9%] w-[3px] rounded-r-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute bottom-[16%] -right-[3px] h-[16%] w-[3px] rounded-r-[2px]",
          frame.button,
        )}
        aria-hidden="true"
      />
    </>
  )
}

function IpadScreen({
  children,
  showCamera,
  orientation,
}: Readonly<{
  children: ReactNode
  showCamera: boolean
  orientation: IpadOrientation
}>) {
  const cameraClass =
    orientation === "landscape"
      ? "absolute top-1/2 left-[10px] z-20 flex h-[7px] w-[7px] -translate-y-1/2 items-center justify-center rounded-full bg-[#151517] ring-[3px] ring-black/5"
      : "absolute top-[10px] left-1/2 z-20 flex h-[7px] w-[7px] -translate-x-1/2 items-center justify-center rounded-full bg-[#151517] ring-[3px] ring-black/5"

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-black">
      <div className="absolute inset-[7px] overflow-hidden rounded-[1.5rem] bg-white">
        <div className="relative h-full w-full">{children}</div>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.06] to-white/0"
          aria-hidden="true"
        />

        {showCamera ? (
          <div className={cameraClass} aria-hidden="true">
            <div className="h-[2.5px] w-[2.5px] rounded-full bg-[#3a4a5c]" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const IpadMockupCard = forwardRef<HTMLDivElement, IpadMockupCardProps>(
  (
    {
      className,
      children,
      variant = "silver",
      orientation = "portrait",
      visibleRatio = 1,
      showCamera = true,
      style,
      ...props
    },
    ref,
  ) => {
    const frame = ipadFrameVariants[variant]
    const ratio = Math.min(1, Math.max(0, visibleRatio))
    const isCropped = ratio < 1
    const isLandscape = orientation === "landscape"
    const aspect = isLandscape ? IPAD_LANDSCAPE_ASPECT : IPAD_PORTRAIT_ASPECT

    const ipadFrameClassName = cn(
      "relative rounded-[2.1rem] p-[4px] shadow-2xl shadow-black/25 ring-1 ring-black/10",
      isLandscape ? "h-full w-full" : "w-[320px] md:w-[380px]",
      frame.frame,
    )

    const fullIpadFrameClassName = cn(ipadFrameClassName, !isLandscape && "aspect-[178.5/247.6]")

    const buttons = isLandscape ? (
      <IpadLandscapeButtons frame={frame} />
    ) : (
      <IpadPortraitButtons frame={frame} />
    )

    if (!isCropped) {
      return (
        <div
          ref={ref}
          data-slot="ipad-mockup-card"
          data-variant={variant}
          data-orientation={orientation}
          className={cn(
            isLandscape ? "w-[min(95vw,860px)]" : undefined,
            isLandscape && "aspect-[247.6/178.5]",
            className,
          )}
          style={style}
          {...props}
        >
          <div className={fullIpadFrameClassName}>
            {buttons}
            <IpadScreen showCamera={showCamera} orientation={orientation}>
              {children}
            </IpadScreen>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        data-slot="ipad-mockup-card"
        data-variant={variant}
        data-orientation={orientation}
        data-visible-ratio={ratio}
        className={cn(
          "relative overflow-hidden",
          isLandscape ? "w-[min(95vw,864px)]" : "w-[324px] md:w-[384px]",
          className,
        )}
        style={{
          aspectRatio: aspect / ratio,
          ...style,
        }}
        {...props}
      >
        <div className="absolute inset-0 right-[4px] left-[4px] overflow-hidden">
          <div
            className={cn(ipadFrameClassName, "w-full shrink-0")}
            style={{ height: `${100 / ratio}%` }}
          >
            <IpadScreen showCamera={showCamera} orientation={orientation}>
              {children}
            </IpadScreen>
          </div>
        </div>

        <div
          className="pointer-events-none absolute top-0 left-[4px] z-10 w-full shrink-0"
          style={{ height: `${100 / ratio}%` }}
        >
          {buttons}
        </div>
      </div>
    )
  },
)

IpadMockupCard.displayName = "IpadMockupCard"
