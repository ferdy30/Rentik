import { addDoc, collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';

export interface CheckOutReport {
  id?: string;
  reservationId: string;
  vehicleId: string;
  status: 'pending' | 'in-progress' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  
  // Participants
  renterId: string;
  ownerId: string;
  
  // Location verification
  location?: {
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
  
  // Damages reported (New damages only)
  newDamages: {
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
  
  // Keys returned
  keysReturned: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Iniciar un nuevo proceso de check-out
 */
export const startCheckOut = async (
  reservationId: string,
  vehicleId: string,
  renterId: string,
  ownerId: string
): Promise<string> => {
  const checkOutData: Partial<CheckOutReport> = {
    reservationId,
    vehicleId,
    renterId,
    ownerId,
    status: 'pending',
    startedAt: new Date(), // Starts immediately when user clicks "Start Return"
    completedAt: null,
    photos: {},
    newDamages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'checkOuts'), checkOutData);
  return docRef.id;
};

/**
 * Obtener un check-out por ID
 */
export const getCheckOut = async (checkOutId: string): Promise<CheckOutReport | null> => {
  const docSnap = await getDoc(doc(db, 'checkOuts', checkOutId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as CheckOutReport;
  }
  return null;
};

/**
 * Suscribirse a cambios en tiempo real del check-out
 */
export const subscribeToCheckOut = (
  checkOutId: string,
  callback: (checkOut: CheckOutReport | null) => void
): (() => void) => {
  return onSnapshot(doc(db, 'checkOuts', checkOutId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as CheckOutReport);
    } else {
      callback(null);
    }
  });
};

/**
 * Guardar fotos del check-out
 */
export const saveCheckOutPhotos = async (
  checkOutId: string,
  photos: Partial<CheckOutReport['photos']>
): Promise<void> => {
  await updateDoc(doc(db, 'checkOuts', checkOutId), {
    photos,
    updatedAt: new Date(),
  });
};

/**
 * Guardar condiciones del vehículo al retorno
 */
export const saveCheckOutConditions = async (
  checkOutId: string,
  conditions: CheckOutReport['conditions']
): Promise<void> => {
  await updateDoc(doc(db, 'checkOuts', checkOutId), {
    conditions,
    updatedAt: new Date(),
  });
};

/**
 * Agregar un nuevo daño reportado
 */
export const addNewDamageReport = async (
  checkOutId: string,
  damage: CheckOutReport['newDamages'][0]
): Promise<void> => {
  const checkOut = await getCheckOut(checkOutId);
  if (checkOut) {
    const updatedDamages = [...checkOut.newDamages, damage];
    await updateDoc(doc(db, 'checkOuts', checkOutId), {
      newDamages: updatedDamages,
      updatedAt: new Date(),
    });
  }
};

/**
 * Guardar firmas de check-out
 */
export const saveCheckOutSignatures = async (
  checkOutId: string,
  signatures: CheckOutReport['signatures']
): Promise<void> => {
  await updateDoc(doc(db, 'checkOuts', checkOutId), {
    signatures,
    updatedAt: new Date(),
  });
};

/**
 * Finalizar check-out y actualizar la reservación a 'completed'
 */
export const completeCheckOut = async (
  checkOutId: string,
  reservationId: string
): Promise<void> => {
  // Actualizar el check-out
  await updateDoc(doc(db, 'checkOuts', checkOutId), {
    status: 'completed',
    completedAt: new Date(),
    keysReturned: true,
    updatedAt: new Date(),
  });

  // Actualizar la reservación a 'completed'
  await updateDoc(doc(db, 'reservations', reservationId), {
    status: 'completed',
    checkOut: {
      id: checkOutId,
      completed: true,
      completedAt: new Date(),
    },
    updatedAt: new Date(),
  });
};
