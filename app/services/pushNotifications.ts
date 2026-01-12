// TEMPORARILY DISABLED: expo-notifications removed from Expo Go SDK 53
// Use development build for push notifications
// import * as Notifications from 'expo-notifications';

// Configurar el comportamiento de las notificaciones
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
  trigger?: any; // Was: Notifications.NotificationTriggerInput
  channelId?: string;
}

/**
 * #40 Solicitar permisos de notificaciones push
 */
export const requestPushPermissions = async (): Promise<boolean> => {
  // TEMPORARILY DISABLED: expo-notifications removed from Expo Go SDK 53
  console.log('[PushNotifications] Disabled in Expo Go SDK 53 - use development build');
  return false;
  // try {
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();

  //   let finalStatus = existingStatus;

  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }

  //   if (finalStatus !== 'granted') {
  //     console.log('[PushNotifications] Permission not granted');
  //     return false;
  //   }

  //   // Configurar canal de Android
  //   if (Platform.OS === 'android') {
  //     await Notifications.setNotificationChannelAsync('check-in-reminders', {
  //       name: 'Recordatorios de Check-In',
  //       importance: Notifications.AndroidImportance.HIGH,
  //       vibrationPattern: [0, 250, 250, 250],
  //       lightColor: '#0B729D',
  //       sound: 'default',
  //     });

  //     await Notifications.setNotificationChannelAsync('trip-updates', {
  //       name: 'Actualizaciones de Viaje',
  //       importance: Notifications.AndroidImportance.MAX,
  //       vibrationPattern: [0, 500, 250, 500],
  //       lightColor: '#10B981',
  //       sound: 'default',
  //     });
  //   }

  //   return true;
  // } catch (error) {
  //   console.error('[PushNotifications] Error requesting permissions:', error);
  //   return false;
  // }
};

/**
 * #40 Programar recordatorio de check-in 24h antes
 */
export const scheduleCheckInReminder24h = async (
  reservationId: string,
  startDate: Date,
  vehicleName: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) return null;

    const triggerDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

    // No programar si la fecha ya pasó
    if (triggerDate < new Date()) {
      console.log('[PushNotifications] Trigger date in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Check-in disponible',
        body: `Ya puedes hacer check-in para tu ${vehicleName}. ¡Prepara tus documentos!`,
        data: {
          type: 'check-in-24h',
          reservationId,
          screen: 'TripDetails',
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log('[PushNotifications] 24h reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[PushNotifications] Error scheduling 24h reminder:', error);
    return null;
  }
};

/**
 * #40 Programar recordatorio de check-in 2h antes
 */
export const scheduleCheckInReminder2h = async (
  reservationId: string,
  startDate: Date,
  vehicleName: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) return null;

    const triggerDate = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);

    if (triggerDate < new Date()) {
      console.log('[PushNotifications] Trigger date in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Check-in en 2 horas',
        body: `No olvides hacer el check-in de tu ${vehicleName}. El tiempo se acerca.`,
        data: {
          type: 'check-in-2h',
          reservationId,
          screen: 'CheckInPreparation',
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log('[PushNotifications] 2h reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[PushNotifications] Error scheduling 2h reminder:', error);
    return null;
  }
};

/**
 * #40 Programar recordatorio de check-in 30min antes
 */
export const scheduleCheckInReminder30min = async (
  reservationId: string,
  startDate: Date,
  vehicleName: string,
  location: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) return null;

    const triggerDate = new Date(startDate.getTime() - 30 * 60 * 1000);

    if (triggerDate < new Date()) {
      console.log('[PushNotifications] Trigger date in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 ¡Es hora del check-in!',
        body: `Tu ${vehicleName} te espera en ${location}. Lleva tus documentos.`,
        data: {
          type: 'check-in-30min',
          reservationId,
          screen: 'CheckInStart',
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log('[PushNotifications] 30min reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[PushNotifications] Error scheduling 30min reminder:', error);
    return null;
  }
};

/**
 * #40 Programar todos los recordatorios de check-in
 */
export const scheduleAllCheckInReminders = async (
  reservationId: string,
  startDate: Date,
  vehicleName: string,
  location: string
): Promise<{ reminder24h?: string; reminder2h?: string; reminder30min?: string }> => {
  const ids: any = {};

  ids.reminder24h = await scheduleCheckInReminder24h(reservationId, startDate, vehicleName);
  ids.reminder2h = await scheduleCheckInReminder2h(reservationId, startDate, vehicleName);
  ids.reminder30min = await scheduleCheckInReminder30min(
    reservationId,
    startDate,
    vehicleName,
    location
  );

  return ids;
};

/**
 * #40 Cancelar recordatorio de check-in
 */
export const cancelCheckInReminder = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[PushNotifications] Reminder cancelled:', notificationId);
  } catch (error) {
    console.error('[PushNotifications] Error cancelling reminder:', error);
  }
};

/**
 * #40 Cancelar todos los recordatorios de check-in
 */
export const cancelAllCheckInReminders = async (
  reminderIds: { reminder24h?: string; reminder2h?: string; reminder30min?: string }
): Promise<void> => {
  const promises = [];

  if (reminderIds.reminder24h) {
    promises.push(cancelCheckInReminder(reminderIds.reminder24h));
  }
  if (reminderIds.reminder2h) {
    promises.push(cancelCheckInReminder(reminderIds.reminder2h));
  }
  if (reminderIds.reminder30min) {
    promises.push(cancelCheckInReminder(reminderIds.reminder30min));
  }

  await Promise.all(promises);
};

/**
 * #40 Enviar notificación inmediata
 */
export const sendImmediateNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<string> => {
  const hasPermission = await requestPushPermissions();
  if (!hasPermission) {
    throw new Error('No permission for notifications');
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Inmediata
  });
};

/**
 * #40 Notificación de check-in completado
 */
export const notifyCheckInCompleted = async (
  vehicleName: string,
  endDate: Date
): Promise<void> => {
  await sendImmediateNotification(
    '✅ Check-in completado',
    `El check-in de tu ${vehicleName} se completó exitosamente. ¡Disfruta tu viaje!`,
    { type: 'check-in-completed' }
  );
};

/**
 * #40 Notificación de recordatorio de check-out
 */
export const scheduleCheckOutReminder = async (
  reservationId: string,
  endDate: Date,
  vehicleName: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) return null;

    // 2 horas antes del check-out
    const triggerDate = new Date(endDate.getTime() - 2 * 60 * 60 * 1000);

    if (triggerDate < new Date()) {
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Prepara el check-out',
        body: `En 2 horas debes devolver tu ${vehicleName}. Recuerda llenar el tanque.`,
        data: {
          type: 'check-out-reminder',
          reservationId,
          screen: 'CheckOutStart',
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (error) {
    console.error('[PushNotifications] Error scheduling check-out reminder:', error);
    return null;
  }
};

/**
 * #40 Obtener notificaciones programadas
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * #40 Cancelar todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[PushNotifications] All notifications cancelled');
};
