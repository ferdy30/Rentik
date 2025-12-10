/**
 * Notification service
 * Currently disabled - notifications are not supported in Expo Go on Android (SDK 53+)
 * Use a Development Build to enable push notifications
 */

export async function registerForPushNotificationsAsync() {
  // Notifications disabled for Expo Go compatibility
  return null;
}

export async function schedulePushNotification(title: string, body: string, data: any = {}) {
  // Notifications disabled for Expo Go compatibility
}

export async function scheduleReminderNotification(title: string, body: string, seconds: number) {
  // Notifications disabled for Expo Go compatibility
}
