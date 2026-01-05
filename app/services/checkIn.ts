import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

export interface CheckInReport {
  id?: string;
  reservationId: string;
  vehicleId: string;
  status: 'pending' | 'in-progress' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  
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
  };
  
  // Damages reported
  damages: {
    id: string;
    location: string;
    type: 'scratch' | 'dent' | 'stain' | 'crack' | 'other';
    severity: 'minor' | 'moderate' | 'severe';
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
    handoverCode: string;
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
  console.log('[checkIn.ts] startCheckIn called for reservation:', reservationId);
  
  // Verificar si ya existe un check-in para esta reservación
  const q = query(
    collection(db, 'checkIns'),
    where('reservationId', '==', reservationId),
    where('status', 'in', ['pending', 'in-progress'])
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Ya existe un check-in, devolver el ID existente
    const existingCheckInId = querySnapshot.docs[0].id;
    console.log('[checkIn.ts] Existing check-in found:', existingCheckInId);
    return existingCheckInId;
  }
  
  // No existe, crear uno nuevo
  console.log('[checkIn.ts] Creating new check-in document');
  const checkInData: Partial<CheckInReport> = {
    reservationId,
    vehicleId,
    renterId,
    ownerId,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    renterReady: false,
    ownerReady: false,
    photos: {},
    damages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'checkIns'), checkInData);
  console.log('[checkIn.ts] New check-in created:', docRef.id);
  return docRef.id;
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
  console.log('[checkIn.ts] markParticipantReady called:', { checkInId, userId, isOwner, hasLocation: !!location });
  
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

  console.log('[checkIn.ts] Updating document with:', updateData);
  await updateDoc(doc(db, 'checkIns', checkInId), updateData);
  console.log('[checkIn.ts] Participant marked ready successfully');
};

/**
 * Actualizar el estado del check-in cuando ambos están listos
 */
export const updateCheckInStatus = async (
  checkInId: string,
  status: 'in-progress' | 'completed'
): Promise<void> => {
  console.log('[checkIn.ts] updateCheckInStatus called:', { checkInId, status });
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'in-progress') {
    updateData.startedAt = new Date();
  } else if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  console.log('[checkIn.ts] Updating document with:', updateData);
  await updateDoc(doc(db, 'checkIns', checkInId), updateData);
  console.log('[checkIn.ts] Document updated successfully');
};

/**
 * Obtener un check-in por ID
 */
export const getCheckIn = async (checkInId: string): Promise<CheckInReport | null> => {
  const docSnap = await getDoc(doc(db, 'checkIns', checkInId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as CheckInReport;
  }
  return null;
};

/**
 * Obtener check-in por reservationId
 */
export const getCheckInByReservation = async (reservationId: string): Promise<CheckInReport | null> => {
  const querySnapshot = await getDoc(doc(db, 'checkIns', reservationId));
  if (querySnapshot.exists()) {
    return { id: querySnapshot.id, ...querySnapshot.data() } as CheckInReport;
  }
  return null;
};

/**
 * Suscribirse a cambios en tiempo real del check-in
 */
export const subscribeToCheckIn = (
  checkInId: string,
  callback: (checkIn: CheckInReport | null) => void
): (() => void) => {
  console.log('[checkIn.ts] subscribeToCheckIn: Setting up listener for', checkInId);
  
  return onSnapshot(doc(db, 'checkIns', checkInId), (docSnap) => {
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as CheckInReport;
      console.log('[checkIn.ts] subscribeToCheckIn: Document updated', {
        ownerReady: data.ownerReady,
        renterReady: data.renterReady,
        status: data.status
      });
      callback(data);
    } else {
      console.log('[checkIn.ts] subscribeToCheckIn: Document does not exist');
      callback(null);
    }
  });
};

/**
 * Guardar fotos del check-in
 */
export const saveCheckInPhotos = async (
  checkInId: string,
  photos: Partial<CheckInReport['photos']>
): Promise<void> => {
  await updateDoc(doc(db, 'checkIns', checkInId), {
    photos,
    updatedAt: new Date(),
  });
};

/**
 * Guardar condiciones del vehículo
 */
export const saveCheckInConditions = async (
  checkInId: string,
  conditions: CheckInReport['conditions']
): Promise<void> => {
  await updateDoc(doc(db, 'checkIns', checkInId), {
    conditions,
    updatedAt: new Date(),
  });
};

/**
 * Agregar un daño reportado
 */
export const addDamageReport = async (
  checkInId: string,
  damage: CheckInReport['damages'][0]
): Promise<void> => {
  const checkIn = await getCheckIn(checkInId);
  if (checkIn) {
    const updatedDamages = [...checkIn.damages, damage];
    await updateDoc(doc(db, 'checkIns', checkInId), {
      damages: updatedDamages,
      updatedAt: new Date(),
    });
  }
};

/**
 * Guardar firmas
 */
export const saveCheckInSignatures = async (
  checkInId: string,
  signatures: CheckInReport['signatures']
): Promise<void> => {
  await updateDoc(doc(db, 'checkIns', checkInId), {
    signatures,
    updatedAt: new Date(),
  });
};

/**
 * Guardar información de entrega de llaves
 */
export const saveCheckInKeys = async (
  checkInId: string,
  keys: CheckInReport['keys']
): Promise<void> => {
  await updateDoc(doc(db, 'checkIns', checkInId), {
    keys,
    updatedAt: new Date(),
  });
};
