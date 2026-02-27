import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../FirebaseConfig";

// Cómo manejar notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos y guarda el Expo Push Token en Firestore.
 * Llamar después de que el usuario inició sesión.
 */
export async function registerForPushNotificationsAsync(
  userId: string,
): Promise<string | null> {
  // Android: crear canal de notificaciones
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Rentik",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0B729D",
    });
  }

  // Verificar/solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[Notifications] Permiso denegado");
    return null;
  }

  try {
    // El projectId de EAS es necesario en SDK 49+
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    // Guardar token en Firestore
    await updateDoc(doc(db, "users", userId), { expoPushToken: token });
    console.log("[Notifications] Token registrado:", token);
    return token;
  } catch (error) {
    // En Expo Go (modo desarrollo) puede fallar — no es crítico
    console.warn("[Notifications] No se pudo obtener el token:", error);
    return null;
  }
}

/** Escucha notificaciones recibidas mientras la app está abierta */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/** Escucha cuando el usuario toca una notificación */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
