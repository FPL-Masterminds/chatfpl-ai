import type { TouchEvent as ReactTouchEvent } from "react";

type LongPressOpts = {
  onLongPress: (coords: { x: number; y: number }) => void;
  delayMs?: number;
};

export function createConversationLongPressHandlers(
  opts: LongPressOpts,
): {
  onTouchStart: (e: ReactTouchEvent) => void;
  onTouchMove: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let moved = false;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return {
    onTouchStart: (e) => {
      moved = false;
      const touch = e.touches[0];
      if (!touch) return;
      clear();
      timer = setTimeout(() => {
        if (!moved) {
          opts.onLongPress({ x: touch.clientX, y: touch.clientY });
        }
      }, opts.delayMs ?? 480);
    },
    onTouchMove: () => {
      moved = true;
      clear();
    },
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}

export function clampContextMenuPosition(x: number, y: number) {
  const margin = 12;
  const menuW = 180;
  const menuH = 100;
  const maxX = Math.max(margin, window.innerWidth - menuW - margin);
  const maxY = Math.max(margin, window.innerHeight - menuH - margin);
  return {
    x: Math.min(Math.max(x, margin), maxX),
    y: Math.min(Math.max(y, margin), maxY),
  };
}
