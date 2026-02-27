import {
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    runTransaction,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { logger } from "../utils/logger";

export interface CheckInReport {
  id?: string;
  reservationId: string;
  vehicleId: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  startedAt: Date | null;
  completedAt: Date | null;

  // #10 Reversión de check-in
  revertedAt?: Date;
  revertReason?: string;

  // #20 Check-in abandonado
  cancelledAt?: Date;
  cancelReason?: string;

  // #28 Error tracking
  errors?: {
    timestamp: Date;
    step: string;
    message: string;
    code?: string;
  }[];

  // Participants
  renterId: string;
  ownerId: string;
  renterReady: boolean;
  ownerReady: boolean;

  // Location verification
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ownerLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  renterLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };

  // Photos (8 required)
  photos: {
    front?: string;
    left?: string;
    back?: string;
    right?: string;
    interiorFront?: string;
    interiorBack?: string;
    dashboard?: string;
    fuelLevel?: string;
  };

  // Conditions
  conditions?: {
    odometer: number;
    fuelLevel: number; // 0-100%
    fuelGaugePhoto?: string;
    exteriorCleanliness: number; // 1-5
    interiorCleanliness: number; // 1-5
    smells?: boolean;
    tiresCondition: number; // 1-5
    lightsWorking: boolean;
    documentsPresent: boolean;
    // #34 Validación kilometraje
    odometerValidation?: {
      isValid: boolean;
      expectedRange?: { min: number; max: number };
      warning?: string;
    };
  };

  // Damages reported
  damages: {
    id: string;
    location: string;
    type: "scratch" | "dent" | "stain" | "crack" | "other";
    severity: "minor" | "moderate" | "severe";
    photo?: string;
    notes: string;
  }[];

  // Signatures
  signatures?: {
    renter?: string;
    owner?: string;
  };

  // Keys
  keys?: {
    count: number;
    working: boolean;
    handoverCode?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Iniciar un nuevo proceso de check-in
 */
export const startCheckIn = async (
  reservationId: string,
  vehicleId: string,
  renterId: string,
  ownerId: string
): Promise<string> => {
  // 1. Check for ORPHANED check-ins first (Backup Check) before entering transaction
  // This handles cases where a check-in exists but isn't linked.
  try {
    const q = query(
      collection(db, "checkIns"),
      where("reservationId", "==", reservationId),
      where("status", "in", ["pending", "in-progress", "completed"])
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const existingCheckInId = existingDoc.id;
      const existingData = existingDoc.data();

      console.log("[startCheckIn] Found existing check-in:", existingCheckInId);

      // Link it just in case
      await updateDoc(doc(db, "reservations", reservationId), {
        "checkIn.id": existingCheckInId,
        "checkIn.completed": existingData.status === "completed",
      });
      return existingCheckInId;
    }
  } catch (queryError: any) {
    // If index is missing, Firestore will throw an error with a link to create it
    if (
      queryError.code === "failed-precondition" ||
      queryError.message?.includes("index")
    ) {
      console.error(
        "❌ FIRESTORE INDEX MISSING - Check console for link to create index"
      );
      console.error(
        "Required index: checkIns collection with fields: reservationId, status"
      );
      console.error("Error:", queryError.message);
      // Continue to transaction - will create new check-in
    } else {
      throw queryError;
    }
  }

  // 2. Use Transaction for Creation/Linking to prevent Race Conditions
  return await runTransaction(db, async (transaction) => {
    const reservationRef = doc(db, "reservations", reservationId);
    const reservationSnap = await transaction.get(reservationRef);

    if (!reservationSnap.exists()) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    const reservationData = reservationSnap.data();

    // If Reservation already linked, return it
    if (reservationData.checkIn?.id) {
      return reservationData.checkIn.id;
    }

    // If not linked, Create New
    const newCheckInRef = doc(collection(db, "checkIns"));

    const checkInData: Partial<CheckInReport> = {
      reservationId,
      vehicleId,
      renterId,
      ownerId,
      status: "pending",
      startedAt: null,
      completedAt: null,
      renterReady: false,
      ownerReady: false,
      photos: {},
      damages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transaction.set(newCheckInRef, checkInData);

    transaction.update(reservationRef, {
      "checkIn.id": newCheckInRef.id,
      "checkIn.completed": false,
      "checkIn.startedAt": new Date(),
    });

    return newCheckInRef.id;
  });
};

/**
 * Marcar que un participante está listo
 */
export const markParticipantReady = async (
  checkInId: string,
  userId: string,
  isOwner: boolean,
  location?: { latitude: number; longitude: number; accuracy: number }
): Promise<void> => {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (isOwner) {
    updateData.ownerReady = true;
    if (location) {
      updateData.ownerLocation = location;
    }
  } else {
    updateData.renterReady = true;
    if (location) {
      updateData.renterLocation = location;
    }
  }

  if (location) {
    updateData.location = location; // Keep legacy field for backward compatibility
  }

  await updateDoc(doc(db, "checkIns", checkInId), updateData);
};

/**
 * Actualizar el estado del check-in cuando ambos están listos
 */
export const updateCheckInStatus = async (
  checkInId: string,
  status: "in-progress" | "completed"
): Promise<void> => {
  console.log(
    `[updateCheckInStatus] 🔄 CALLED with checkInId: ${checkInId}, status: ${status}`
  );

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "in-progress") {
    updateData.startedAt = new Date();
  } else if (status === "completed") {
    updateData.completed = true;
    updateData.completedAt = new Date();
  }

  try {
    // Update check-in document
    console.log("[updateCheckInStatus] 📝 Updating checkIn document...");
    await updateDoc(doc(db, "checkIns", checkInId), updateData);
    console.log(
      "[updateCheckInStatus] ✅ CheckIn document updated successfully"
    );

    // Get check-in to find reservation
    const checkInDoc = await getDoc(doc(db, "checkIns", checkInId));
    if (!checkInDoc.exists()) {
      console.error("[updateCheckInStatus] ❌ Check-in document not found");
      return;
    }

    const reservationId = checkInDoc.data().reservationId;
    console.log(
      `[updateCheckInStatus] 📋 Found reservationId: ${reservationId}`
    );
    const reservationRef = doc(db, "reservations", reservationId);

    // Update reservation based on status
    if (status === "in-progress") {
      // When check-in starts, just update the reference
      await updateDoc(reservationRef, {
        "checkIn.id": checkInId,
        "checkIn.startedAt": new Date(),
      });
      console.log("[updateCheckInStatus] ✅ Check-in marked as in-progress");
    } else if (status === "completed") {
      // When check-in completes, update both checkIn.completed AND reservation.status
      console.log(
        "[updateCheckInStatus] 📝 Updating reservation with completed status..."
      );
      await updateDoc(reservationRef, {
        "checkIn.completed": true,
        "checkIn.status": "completed", // ⬅️ UPDATE: Also update checkIn.status
        "checkIn.completedAt": new Date(), // ⬅️ UPDATE: Set completedAt timestamp
        "checkIn.id": checkInId,
        status: "in-progress", // ⬅️ THIS IS THE KEY FIX!
        updatedAt: new Date(),
      });

      console.log(
        "[updateCheckInStatus] ✅ Check-in completed & reservation status updated to in-progress"
      );

      // Verify the update worked
      console.log("[updateCheckInStatus] 🔍 Verifying update...");
      const verifyDoc = await getDoc(reservationRef);
      if (verifyDoc.exists()) {
        const data = verifyDoc.data();
        console.log(
          "[updateCheckInStatus] 🔍 Verification - reservation.status:",
          data.status
        );
        console.log(
          "[updateCheckInStatus] 🔍 Verification - checkIn.completed:",
          data.checkIn?.completed
        );
        console.log(
          "[updateCheckInStatus] 🔍 Verification - checkIn.status:",
          data.checkIn?.status
        );
        console.log(
          "[updateCheckInStatus] 🔍 Verification - checkIn.completedAt:",
          data.checkIn?.completedAt
        );
      }
    }
  } catch (error) {
    console.error("[updateCheckInStatus] ❌ ERROR:", error);
    throw error;
  }
};

/**
 * Suscribirse a cambios en tiempo real del check-in
 */
export const subscribeToCheckIn = (
  checkInId: string,
  onUpdate: (checkIn: any) => void,
  onError?: (error: Error) => void
) => {
  const checkInRef = doc(db, "checkIns", checkInId);

  return onSnapshot(
    checkInRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({ id: docSnap.id, ...data });
      }
    },
    (error) => {
      console.error("[subscribeToCheckIn] Error:", error);
      if (onError) onError(error as Error);
    }
  );
};

/**
 * Obtener un check-in por ID
 */
export const getCheckIn = async (
  checkInId: string
): Promise<CheckInReport | null> => {
  const docSnap = await getDoc(doc(db, "checkIns", checkInId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as CheckInReport;
  }
  return null;
};

/**
 * Obtener check-in por reservationId
 */
export const getCheckInByReservation = async (
  reservationId: string
): Promise<CheckInReport | null> => {
  const q = query(
    collection(db, "checkIns"),
    where("reservationId", "==", reservationId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docData = querySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as CheckInReport;
  }
  return null;
};

/**
 * Guardar fotos del check-in
 * Uses dot notation to safely update specific photos
 */
export const saveCheckInPhotos = async (
  checkInId: string,
  photos: Partial<CheckInReport["photos"]>
): Promise<void> => {
  const updatePayload: any = { updatedAt: new Date() };

  Object.entries(photos).forEach(([key, value]) => {
    if (value) {
      updatePayload[`photos.${key}`] = value;
    }
  });

  await updateDoc(doc(db, "checkIns", checkInId), updatePayload);
};

/**
 * Guardar condiciones del vehículo
 * Uses dot notation for safety
 */
export const saveCheckInConditions = async (
  checkInId: string,
  conditions: Partial<CheckInReport["conditions"]>
): Promise<void> => {
  const updatePayload: any = { updatedAt: new Date() };

  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined) {
      updatePayload[`conditions.${key}`] = value;
    }
  });

  await updateDoc(doc(db, "checkIns", checkInId), updatePayload);
};

/**
 * Agregar un daño reportado
 * Atomic update using arrayUnion
 */
export const addDamageReport = async (
  checkInId: string,
  damage: CheckInReport["damages"][0]
): Promise<void> => {
  await updateDoc(doc(db, "checkIns", checkInId), {
    damages: arrayUnion(damage),
    updatedAt: new Date(),
  });
};

/**
 * Guardar firmas
 */
export const saveCheckInSignatures = async (
  checkInId: string,
  signatures: CheckInReport["signatures"]
): Promise<void> => {
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Safe update using dot notation to prevent overwriting
  if (signatures?.owner) {
    updateData["signatures.owner"] = signatures.owner;
  }
  if (signatures?.renter) {
    updateData["signatures.renter"] = signatures.renter;
  }

  await updateDoc(doc(db, "checkIns", checkInId), updateData);
};

/**
 * Guardar información de entrega de llaves
 */
export const saveCheckInKeys = async (
  checkInId: string,
  keys: CheckInReport["keys"]
): Promise<void> => {
  await updateDoc(doc(db, "checkIns", checkInId), {
    keys,
    updatedAt: new Date(),
  });
};

/**
 * #10 Revertir check-in (permite reiniciar el proceso)
 */
export const revertCheckIn = async (
  checkInId: string,
  reason?: string
): Promise<void> => {
  logger.log("[checkIn.ts] revertCheckIn called:", { checkInId, reason });

  const checkIn = await getCheckIn(checkInId);
  if (!checkIn) {
    throw new Error("Check-in no encontrado");
  }

  // Solo se puede revertir si está en progreso o completado
  if (checkIn.status === "pending") {
    throw new Error("El check-in no ha iniciado aún");
  }

  const updateData: any = {
    status: "pending",
    startedAt: null,
    completedAt: null,
    renterReady: false,
    ownerReady: false,
    // Mantener fotos y datos ya capturados para evitar perderlos
    revertedAt: new Date(),
    revertReason: reason || "Proceso reiniciado",
    updatedAt: new Date(),
  };

  await updateDoc(doc(db, "checkIns", checkInId), updateData);
};

/**
 * #20 Cancelar check-in abandonado (timeout)
 */
export const cancelAbandonedCheckIn = async (
  checkInId: string,
  reason?: string
): Promise<void> => {
  const updateData: any = {
    status: "cancelled" as any,
    cancelledAt: new Date(),
    cancelReason: reason || "Proceso abandonado por timeout",
    updatedAt: new Date(),
  };

  await updateDoc(doc(db, "checkIns", checkInId), updateData);
};

/**
 * #8 Generar código de llaves seguro
 */
export const generateSecureKeyCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluye O, I, 0, 1 para evitar confusión
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * #8 Verificar código de llaves
 */
export const verifyKeyCode = async (
  checkInId: string,
  code: string
): Promise<boolean> => {
  const checkIn = await getCheckIn(checkInId);
  if (!checkIn || !checkIn.keys?.handoverCode) {
    return false;
  }
  return checkIn.keys.handoverCode.toUpperCase() === code.toUpperCase();
};

/**
 * #28 Registrar error en el check-in
 */
export const logCheckInError = async (
  checkInId: string,
  step: string,
  message: string,
  code?: string
): Promise<void> => {
  logger.error("[checkIn.ts] Error logged:", {
    checkInId,
    step,
    message,
    code,
  });

  const checkIn = await getCheckIn(checkInId);
  if (!checkIn) {
    logger.error("[checkIn.ts] Cannot log error: Check-in not found");
    return;
  }

  const errors = checkIn.errors || [];
  errors.push({
    timestamp: new Date(),
    step,
    message,
    code,
  });

  await updateDoc(doc(db, "checkIns", checkInId), {
    errors,
    updatedAt: new Date(),
  });
};

/**
 * #34 Validar kilometraje del vehículo
 */
export const validateOdometer = async (
  vehicleId: string,
  currentOdometer: number
): Promise<{
  isValid: boolean;
  expectedRange?: { min: number; max: number };
  warning?: string;
}> => {
  try {
    // Obtener el kilometraje registrado del vehículo
    const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
    if (!vehicleDoc.exists()) {
      return { isValid: false, warning: "Vehículo no encontrado" };
    }

    const vehicleData = vehicleDoc.data();
    const registeredOdometer = vehicleData.odometer || vehicleData.mileage || 0;

    // El kilometraje actual debe ser mayor o igual al registrado
    if (currentOdometer < registeredOdometer) {
      return {
        isValid: false,
        expectedRange: {
          min: registeredOdometer,
          max: registeredOdometer + 50000,
        },
        warning: `El kilometraje ingresado (${currentOdometer} km) es menor al registrado (${registeredOdometer} km). Verifica el odómetro.`,
      };
    }

    // Validar que no sea un incremento irreal (más de 50,000 km desde el registro)
    const maxRealisticIncrease = 50000;
    if (currentOdometer > registeredOdometer + maxRealisticIncrease) {
      return {
        isValid: false,
        expectedRange: {
          min: registeredOdometer,
          max: registeredOdometer + maxRealisticIncrease,
        },
        warning: `El kilometraje ingresado (${currentOdometer} km) parece muy alto. El último registro fue ${registeredOdometer} km.`,
      };
    }

    // Validación exitosa
    return {
      isValid: true,
      expectedRange: {
        min: registeredOdometer,
        max: registeredOdometer + maxRealisticIncrease,
      },
    };
  } catch (error) {
    logger.error("[checkIn.ts] Error validating odometer:", error);
    return {
      isValid: false,
      warning: "Error al validar el kilometraje",
    };
  }
};

/**
 * Limpiar check-ins duplicados para una reservación
 * Mantiene solo el check-in que está en la reservación
 */
export const cleanupDuplicateCheckIns = async (
  reservationId: string
): Promise<void> => {
  try {
    // Obtener el check-in correcto de la reservación
    const reservationSnap = await getDoc(
      doc(db, "reservations", reservationId)
    );
    if (!reservationSnap.exists()) {
      return;
    }

    const correctCheckInId = reservationSnap.data().checkIn?.id;
    if (!correctCheckInId) {
      return;
    }

    // Buscar todos los check-ins para esta reservación
    const q = query(
      collection(db, "checkIns"),
      where("reservationId", "==", reservationId)
    );

    const querySnapshot = await getDocs(q);

    // Eliminar los que no sean el correcto
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== correctCheckInId) {
        deletePromises.push(deleteDoc(doc(db, "checkIns", docSnap.id)));
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    logger.error("[checkIn.ts] Error cleaning up duplicate check-ins:", error);
  }
};
