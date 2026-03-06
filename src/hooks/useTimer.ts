import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing a 1-second interval timer.
 * Properly cleans up on unmount and when isActive changes.
 */
export function useTimer(isActive: boolean): [number, () => void] {
  const [seconds, setSeconds] = useState(0);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return [seconds, reset];
}

/**
 * Hook for managing a setTimeout with proper cleanup.
 * Pass null as delay to disable the timeout.
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}
