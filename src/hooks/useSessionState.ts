'use client';

import React, { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

/**
 * A hook that works like useState but persists the value in sessionStorage.
 * Survives page refreshes, back/forward navigation, and language switches in the same session.
 */
export function useSessionState<T>(key: string, defaultValue: T | (() => T)) {
  // Initialize from sessionStorage immediately if available (client-side only)
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error loading session state for ${key}:`, e);
    }
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : (defaultValue as T);
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialRender = useRef(true);

  // 1. Sync if key changes
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

  return [state, setState, isLoaded] as [T, Dispatch<SetStateAction<T>>, boolean];
}
