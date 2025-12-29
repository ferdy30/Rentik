import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reservation } from '../services/reservations';

// Configurar el comportamiento de notificaciones
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Solicitar permisos para notificaciones
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission denied');
            return false;
        }

        // Para Android, configurar canal de notificaciones
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('trip-updates', {
                name: 'Actualizaciones de Viaje',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#0B729D',
                sound: 'default',
            });
        }

        return true;
    } catch (error) {
        console.error('[Notifications] Error requesting permissions:', error);
        return false;
    }
}

/**
 * Programar notificaciones de recordatorio para una reserva
 */
export async function scheduleReservationReminders(reservation: Reservation): Promise<void> {
    try {
        // Verificar permisos
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.log('[Notifications] No permission, skipping schedule');
            return;
        }

        const startDate = reservation.startDate?.toDate();
        if (!startDate) return;

        const now = new Date();
        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Cancelar notificaciones previas para esta reserva
        await cancelReservationReminders(reservation.id);

        const vehicleName = `${reservation.vehicleSnapshot?.marca} ${reservation.vehicleSnapshot?.modelo}`;
        const notifications: {
            trigger: Date;
            title: string;
            body: string;
            data: any;
        }[] = [];

        // Notificación 24h antes - Recordatorio de preparación
        if (hoursUntilStart > 24) {
            const reminder24h = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
            notifications.push({
                trigger: reminder24h,
                title: '¡Prepárate para tu viaje! 🚗',
                body: `Tu reserva de ${vehicleName} comienza mañana. Ya puedes hacer el check-in.`,
                data: {
                    reservationId: reservation.id,
                    type: 'check-in-available',
                    screen: 'TripDetails',
                },
            });
        }

        // Notificación 2h antes - Recordatorio urgente
        if (hoursUntilStart > 2) {
            const reminder2h = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
            notifications.push({
                trigger: reminder2h,
                title: 'Check-in en 2 horas ⏰',
                body: `No olvides hacer el check-in de tu ${vehicleName} antes de recogerlo.`,
                data: {
                    reservationId: reservation.id,
                    type: 'check-in-reminder',
                    screen: 'CheckInPreparation',
                },
            });
        }

        // Notificación 30min antes - Recordatorio final
        if (hoursUntilStart > 0.5) {
            const reminder30min = new Date(startDate.getTime() - 30 * 60 * 1000);
            notifications.push({
                trigger: reminder30min,
                title: '¡Es hora de recoger tu vehículo! 🎉',
                body: `Tu reserva comienza en 30 minutos. Recuerda tus documentos.`,
                data: {
                    reservationId: reservation.id,
                    type: 'pickup-time',
                    screen: 'TripDetails',
                },
            });
        }

        // Programar todas las notificaciones
        for (const notification of notifications) {
            // Solo programar si la fecha es futura
            if (notification.trigger > now) {
                await Notifications.scheduleNotificationAsync({
                    identifier: `reservation-${reservation.id}-${notification.data.type}`,
                    content: {
                        title: notification.title,
                        body: notification.body,
                        data: notification.data,
                        sound: 'default',
                        badge: 1,
                        ...(Platform.OS === 'android' && {
                            channelId: 'trip-updates',
                        }),
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: notification.trigger,
                    },
                });

                console.log(`[Notifications] Scheduled: ${notification.title} for ${notification.trigger.toLocaleString()}`);
            }
        }
    } catch (error) {
        console.error('[Notifications] Error scheduling reminders:', error);
    }
}

/**
 * Cancelar recordatorios para una reserva específica
 */
export async function cancelReservationReminders(reservationId: string): Promise<void> {
    try {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        
        // Cancelar todas las notificaciones relacionadas con esta reserva
        for (const notification of scheduledNotifications) {
            if (notification.identifier.includes(reservationId)) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                console.log(`[Notifications] Cancelled: ${notification.identifier}`);
            }
        }
    } catch (error) {
        console.error('[Notifications] Error cancelling reminders:', error);
    }
}

/**
 * Notificación inmediata - Para cambios de estado
 */
export async function sendImmediateNotification(
    title: string,
    body: string,
    data?: any
): Promise<void> {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: 'default',
                ...(Platform.OS === 'android' && {
                    channelId: 'trip-updates',
                }),
            },
            trigger: null, // Inmediato
        });

        console.log(`[Notifications] Sent immediate: ${title}`);
    } catch (error) {
        console.error('[Notifications] Error sending immediate notification:', error);
    }
}

/**
 * Limpiar todas las notificaciones de la app
 */
export async function clearAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.dismissAllNotificationsAsync();
        console.log('[Notifications] All notifications cleared');
    } catch (error) {
        console.error('[Notifications] Error clearing notifications:', error);
    }
}

/**
 * Obtener notificaciones programadas
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
        return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('[Notifications] Error getting scheduled notifications:', error);
        return [];
    }
}
