import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function triggerHaptic(type = 'light') {
  try {
    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    }
  } catch (e) {
    // Graceful fallback for web/non-capacitor browsers
  }
}
