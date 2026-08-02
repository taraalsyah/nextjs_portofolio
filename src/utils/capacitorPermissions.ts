export type PermissionType = 'camera' | 'storage' | 'notifications';

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

/**
 * Utility helper to handle Capacitor native permissions safely with web fallbacks.
 */
export async function checkAndRequestPermission(type: PermissionType): Promise<PermissionResult> {
  try {
    // @ts-ignore
    const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null }));
    if (!Capacitor || !Capacitor.isNativePlatform()) {
      // In web browser, standard permissions apply
      return { granted: true, message: 'Running on web platform' };
    }

    switch (type) {
      case 'notifications': {
        // @ts-ignore
        const { PushNotifications } = await import('@capacitor/push-notifications').catch(() => ({ PushNotifications: null }));
        if (PushNotifications) {
          const status = await PushNotifications.checkPermissions();
          if (status.receive === 'granted') {
            return { granted: true };
          }
          const request = await PushNotifications.requestPermissions();
          return { granted: request.receive === 'granted' };
        }
        return { granted: true };
      }

      case 'camera': {
        // @ts-ignore
        const { Camera } = await import('@capacitor/camera').catch(() => ({ Camera: null }));
        if (Camera) {
          const status = await Camera.checkPermissions();
          if (status.camera === 'granted') {
            return { granted: true };
          }
          const request = await Camera.requestPermissions();
          return { granted: request.camera === 'granted' };
        }
        return { granted: true };
      }

      case 'storage': {
        // Android permissions are declared in AndroidManifest.xml
        return { granted: true };
      }

      default:
        return { granted: true };
    }
  } catch (error) {
    console.warn(`Permission check for ${type} failed:`, error);
    return { granted: false, message: String(error) };
  }
}
