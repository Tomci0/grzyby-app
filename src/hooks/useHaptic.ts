"use client";

/**
 * Hook do delikatnej wibracji (haptic feedback).
 * Bezpiecznie sprawdza dostępność Vibration API.
 */
export function useHaptic() {
  const vibrate = (pattern: number | number[] = 15) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).vibrate(pattern);
      } catch {
        // API niedostępne — ignoruj
      }
    }
  };

  return {
    tap: () => vibrate(12),
    select: () => vibrate(18),
    success: () => vibrate([10, 50, 10]),
    error: () => vibrate([30, 20, 30]),
  };
}
