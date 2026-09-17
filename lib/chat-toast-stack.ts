/** Vertical stack for bottom-right chat toasts (3rem base + 4.25rem per layer). */
export function chatToastBottomClass(stackIndex: number): string {
  if (stackIndex <= 0) return "bottom-3";
  if (stackIndex === 1) return "bottom-[7.25rem]";
  return "bottom-[14.5rem]";
}
