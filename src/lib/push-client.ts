'use client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    return reg;
  } catch (err) {
    console.error('[Push Client Error] Service Worker registration failed:', err);
    return null;
  }
}

export async function getPushSubscriptionStatus(): Promise<{
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { isSupported: false, permission: 'unsupported', isSubscribed: false };
  }

  const permission = Notification.permission;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { isSupported: true, permission, isSubscribed: false };
    const sub = await reg.pushManager.getSubscription();
    return { isSupported: true, permission, isSubscribed: Boolean(sub) };
  } catch {
    return { isSupported: true, permission, isSubscribed: false };
  }
}

export async function subscribeUserToPush(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Web Push tidak didukung pada browser ini.' };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey || vapidPublicKey.includes('PLACEHOLDER')) {
    return { success: false, error: 'VAPID public key belum dikonfigurasi pada environment.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      return {
        success: false,
        error: 'Notifikasi diblokir oleh browser. Silakan aktifkan permission melalui pengaturan browser.',
      };
    }
    if (permission !== 'granted') {
      return { success: false, error: 'Izin notifikasi tidak diberikan.' };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'Gagal meregistrasi Service Worker.' };
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Gagal menyimpan push subscription di server.' };
    }

    return { success: true, message: 'Notifikasi perangkat berhasil diaktifkan!' };
  } catch (err: any) {
    console.error('[Push Client Error] Subscription exception:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan saat mengaktifkan notifikasi.' };
  }
}

export async function unsubscribeUserFromPush(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { success: false, error: 'Service worker tidak tersedia.' };
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { success: true };

    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    }

    return { success: true, message: 'Notifikasi perangkat telah dinonaktifkan.' };
  } catch (err: any) {
    console.error('[Push Client Error] Unsubscribe exception:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan saat menonaktifkan notifikasi.' };
  }
}
