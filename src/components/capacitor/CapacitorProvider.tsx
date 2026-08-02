'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WifiOff, RefreshCw } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/loading';

import { isAndroidCapacitorNative } from '@/hooks/useCapacitorPlatform';

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Helper to show temporary toast notification for back button double tap
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  useEffect(() => {
    let lastBackPress = 0;
    let removeNetworkListener: (() => void) | undefined;
    let removeBackButtonListener: (() => void) | undefined;

    // Attach Android Native CSS class to root body if running in Android Capacitor APK
    if (typeof document !== 'undefined' && isAndroidCapacitorNative()) {
      document.body.classList.add('is-android-native');
      document.documentElement.classList.add('is-android-native');
    }

    const initCapacitor = async () => {
      try {
        // @ts-ignore
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        // Status Bar Configuration
        // @ts-ignore
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        await StatusBar.setBackgroundColor({ color: '#0f172a' }).catch(() => {});

        // Splash Screen Hide
        // @ts-ignore
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide().catch(() => {});

        // Network Status Listener
        // @ts-ignore
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        const netListener = await Network.addListener('networkStatusChange', (status: any) => {
          setIsOnline(status.connected);
        });
        removeNetworkListener = () => netListener.remove();

        // Hardware Back Button Listener
        // @ts-ignore
        const { App } = await import('@capacitor/app');
        const backListener = await App.addListener('backButton', () => {
          const rootPages = ['/', '/dashboard', '/login', '/register'];
          const isRoot = rootPages.includes(window.location.pathname);

          if (!isRoot && window.history.length > 1) {
            window.history.back();
          } else {
            const now = Date.now();
            if (now - lastBackPress < 2000) {
              App.exitApp();
            } else {
              lastBackPress = now;
              showToast('Tekan sekali lagi untuk keluar.');
            }
          }
        });
        removeBackButtonListener = () => backListener.remove();
      } catch (err) {
        // Fallback for web browser environment
      }
    };

    initCapacitor();

    // Standard Web Offline Listener Fallback
    const handleWebOnline = () => setIsOnline(true);
    const handleWebOffline = () => setIsOnline(false);

    window.addEventListener('online', handleWebOnline);
    window.addEventListener('offline', handleWebOffline);

    return () => {
      window.removeEventListener('online', handleWebOnline);
      window.removeEventListener('offline', handleWebOffline);
      if (removeNetworkListener) removeNetworkListener();
      if (removeBackButtonListener) removeBackButtonListener();
    };
  }, []);

  const handleRetryConnection = async () => {
    setIsCheckingConnection(true);
    try {
      // @ts-ignore
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    } catch {
      setIsOnline(navigator.onLine);
    } finally {
      setTimeout(() => {
        setIsCheckingConnection(false);
      }, 500);
    }
  };

  return (
    <>
      {!isOnline ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#0f172a',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'hsla(350, 90%, 55%, 0.15)',
              border: '1px solid hsla(350, 90%, 55%, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              color: 'hsl(350, 95%, 75%)',
            }}
          >
            <WifiOff size={38} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#f8fafc' }}>
            Tidak Ada Koneksi Internet
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '340px', lineHeight: 1.5, margin: '0 0 2rem' }}>
            Koneksi internet Anda terputus. Harap periksa jaringan Wi-Fi atau data seluler Anda lalu coba lagi.
          </p>

          <button
            onClick={handleRetryConnection}
            disabled={isCheckingConnection}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--secondary, #38bdf8) 0%, var(--primary, #818cf8) 100%)',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              cursor: isCheckingConnection ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            }}
          >
            {isCheckingConnection ? (
              <>
                <InlineSpinner size={16} color="#ffffff" />
                Memeriksa Koneksi...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Coba Lagi
              </>
            )}
          </button>
        </div>
      ) : (
        children
      )}

      {/* Double Tap Back Button Exit Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '0.6rem 1.2rem',
            borderRadius: '100px',
            fontSize: '0.82rem',
            fontWeight: 600,
            zIndex: 999999,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
