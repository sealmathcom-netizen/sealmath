'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * A hook that works like useState but persists the value in sessionStorage.
 * Survives page refreshes, back/forward navigation, and language switches in the same session.
 */
export function useSessionState<T>(key: string, defaultValue: T) {
  // Initialize with defaultValue. We'll load from sessionStorage in useEffect to avoid SSR hydration mismatch.
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialRender = useRef(true);

  // 1. Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error(`Error loading session state for ${key}:`, e);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // 2. Save to sessionStorage whenever state changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    try {
      if (state === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) {
      console.error(`Error saving session state for ${key}:`, e);
    }
  }, [key, state]);

  return [state, setState, isLoaded] as const;
}
