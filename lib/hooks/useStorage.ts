"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseJson, readRaw, subscribeStorage } from "../storage/stats";

const getServerSnapshot = () => null;

/**
 * Reads a JSON value from localStorage and re-renders when it changes.
 * The server snapshot is always `fallback`, so hydration never mismatches.
 */
export function useStoredJson<T>(key: string, fallback: T): T {
  const getSnapshot = useCallback(() => readRaw(key), [key]);
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  // `fallback` is expected to be a module-level constant.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => parseJson(raw, fallback), [raw]);
}

/** True after hydration on the client. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function noopSubscribe() {
  return () => {};
}

/** Subscribes to a CSS media query. Returns `false` during SSR. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
