/**
 * Cloud Functions — Push Notifications para Rentik
 *
 * Triggers:
 * 1. onReservationCreated  → notifica al arrendador de nueva solicitud
 * 2. onReservationUpdated  → notifica al arrendatario del cambio de estado
 * 3. onNewChatMessage      → notifica al destinatario de nuevo mensaje
 */

import * as admin from "firebase-admin";
import * as functionsV1 from "firebase-functions/v1";
import * as https from "https";

// ---------- Helper: enviar via Expo Push API ----------

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
  badge?: number;
}

async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  const valid = messages.filter((m) => m.to?.startsWith("ExponentPushToken["));
  if (valid.length === 0) return;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(valid);
    const req = https.request(
      {
        hostname: "exp.host",
        path: "/--/api/v2/push/send",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          console.log("[Notifications] Expo response:", body.substring(0, 200));
          resolve();
        });
      },
    );
    req.on("error", (err) => {
      console.error("[Notifications] Error sending push:", err);
      resolve(); // No rechazamos para no fallar la function
    });
    req.write(payload);
    req.end();
  });
}

// ---------- Helper: obtener token de un usuario ----------

async function getToken(uid: string): Promise<string | null> {
  try {
    const snap = await admin.firestore().collection("users").doc(uid).get();
    return snap.data()?.expoPushToken ?? null;
  } catch {
    return null;
  }
}

// ---------- 1. Nueva reserva → avisa al arrendador ----------

export const onReservationCreated = functionsV1.firestore
  .document("reservations/{reservationId}")
  .onCreate(async (snap: functionsV1.firestore.QueryDocumentSnapshot) => {
    const res = snap.data();
    const ownerId: string | undefined = res?.arrendadorId;
    if (!ownerId) return;

    const token = await getToken(ownerId);
    if (!token) return;

    const marca = res?.vehicleBrand || res?.vehicleMarca || "tu vehículo";
    await sendExpoPush([
      {
        to: token,
        title: "¡Nueva solicitud de reserva! 🚗",
        body: `Alguien quiere alquilar ${marca}. Revisa la solicitud.`,
        data: { reservationId: snap.id, screen: "ReservationDetails" },
        sound: "default",
        badge: 1,
      },
    ]);
  });

// ---------- 2. Cambio de estado → avisa al arrendatario ----------

export const onReservationUpdated = functionsV1.firestore
  .document("reservations/{reservationId}")
  .onUpdate(
    async (
      change: functionsV1.Change<functionsV1.firestore.QueryDocumentSnapshot>,
    ) => {
      const before = change.before.data();
      const after = change.after.data();

      if (!after || before?.status === after.status) return;

      const renterId: string | undefined = after.userId;
      if (!renterId) return;

      const token = await getToken(renterId);
      if (!token) return;

      const messages: Record<string, { title: string; body: string }> = {
        confirmed: {
          title: "¡Reserva confirmada! ✅",
          body: "El propietario aceptó tu solicitud. Ya puedes ver los detalles.",
        },
        rejected: {
          title: "Solicitud rechazada",
          body: "El propietario no pudo aceptar tu solicitud en esta fecha.",
        },
        cancelled: {
          title: "Reserva cancelada",
          body: "Tu reserva ha sido cancelada.",
        },
        "in-progress": {
          title: "Check-in completado 🎉",
          body: "¡Tu viaje ha comenzado! Disfruta el recorrido.",
        },
        completed: {
          title: "Viaje completado",
          body: "¿Todo bien? No olvides calificar tu experiencia.",
        },
      };

      const msg = messages[after.status as string];
      if (!msg) return;

      await sendExpoPush([
        {
          to: token,
          ...msg,
          data: { reservationId: change.after.id, screen: "TripDetails" },
          sound: "default",
          badge: 1,
        },
      ]);
    },
  );

// ---------- 3. Nuevo mensaje de chat → avisa al destinatario ----------

export const onNewChatMessage = functionsV1.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(
    async (
      snap: functionsV1.firestore.QueryDocumentSnapshot,
      context: functionsV1.EventContext,
    ) => {
      const message = snap.data();
      const { chatId } = context.params;

      if (!message) return;

      const chatSnap = await admin
        .firestore()
        .collection("chats")
        .doc(chatId)
        .get();
      if (!chatSnap.exists) return;

      const participants: string[] = chatSnap.data()?.participants ?? [];
      const senderId: string = message.senderId;
      const recipientId = participants.find((p) => p !== senderId);
      if (!recipientId) return;

      const token = await getToken(recipientId);
      if (!token) return;

      const senderName: string = message.senderName || "Alguien";
      const text: string =
        (message.text as string)?.substring(0, 100) || "Nuevo mensaje";

      await sendExpoPush([
        {
          to: token,
          title: senderName,
          body: text,
          data: { chatId, screen: "ChatRoom" },
          sound: "default",
          badge: 1,
        },
      ]);
    },
  );
