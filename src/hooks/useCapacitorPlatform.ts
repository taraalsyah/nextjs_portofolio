'use client';

import { useState, useEffect } from 'react';

/**
 * Synchronous & robust check for Capacitor Android APK runtime environment.
 * Checks native window.Capacitor bridge object, platform getters, and userAgent.
 */
export function isAndroidCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;

  const win = window as any;

  // 1. Check window.Capacitor native object injected by Android WebView bridge
  if (win.Capacitor) {
    if (typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof win.Capacitor.getPlatform === 'function' && win.Capacitor.getPlatform() === 'android') {
      return true;
    }
    if (win.Capacitor.platform === 'android' || win.Capacitor.isNative) {
      return true;
    }
  }

  // 2. Check User Agent injected by Capacitor WebView
  if (navigator.userAgent && /Capacitor|capacitor/i.test(navigator.userAgent)) {
    return true;
  }

  return false;
}

/**
 * React hook to detect if application is running inside Android Capacitor APK.
 * Returns true if running in Android APK, false on standard web browser.
 */
export function useIsNativePlatform(): boolean {
  const [isNative, setIsNative] = useState<boolean>(() => {
    return isAndroidCapacitorNative();
  });

  useEffect(() => {
    // Initial check
    if (isAndroidCapacitorNative()) {
      setIsNative(true);
      return;
    }

    // Dynamic import check fallback
    async function checkPlatform() {
      try {
        // @ts-ignore
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor) {
          if (typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
            setIsNative(true);
            return;
          }
          if (typeof Capacitor.getPlatform === 'function' && Capacitor.getPlatform() === 'android') {
            setIsNative(true);
            return;
          }
        }
      } catch (err) {
        // Ignored fallback
      }
    }

    checkPlatform();
  }, []);

  return isNative;
}
