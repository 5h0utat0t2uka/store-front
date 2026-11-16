"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMatchMedia(
  mediaQuery: string,
  initialState = false,
): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(mediaQuery);
      media.addEventListener("change", callback);
      return () => {
        media.removeEventListener("change", callback);
      };
    },
    [mediaQuery],
  );

  const getClientSnapshot = useCallback(
    () => window.matchMedia(mediaQuery).matches,
    [mediaQuery],
  );
  const getServerSnapshot = useCallback(() => initialState, [initialState]);

  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
