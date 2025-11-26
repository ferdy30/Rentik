import { Timestamp, collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

export interface AvailabilityData {
  id?: string;
  vehicleId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reservationId: string;
}

export interface Reservation {
  id: string;
  vehicleId: string;
  userId: string;
  arrendadorId: string; // New field
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'denied';
  totalPrice: number;
  createdAt: Timestamp;
  pickupLocation?: string;
  returnLocation?: string;
  pickupTime?: string;
  returnTime?: string;
  denialReason?: string;
  messageToHost?: string;
  vehicleSnapshot?: {
    marca: string;
    modelo: string;
    anio: number;
    imagen: string;
  };
}

export const getUserReservations = async (userId: string): Promise<Reservation[]> => {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });
    // Sort by date (newest first)
    return reservations.sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis());
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return [];
  }
};

export const getOwnerReservations = async (arrendadorId: string): Promise<Reservation[]> => {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('arrendadorId', '==', arrendadorId)
    );

    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });
    // Sort by date (newest first)
    return reservations.sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis());
  } catch (error) {
    console.error('Error fetching owner reservations:', error);
    return [];
  }
};

export const getVehicleReservations = async (vehicleId: string): Promise<Reservation[]> => {
  try {
    // Query the public availability collection instead of restricted reservations
    const q = query(
      collection(db, 'availability'),
      where('vehicleId', '==', vehicleId)
    );

    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      // Cast availability data to partial Reservation for compatibility
      reservations.push({ id: doc.id, ...doc.data() } as unknown as Reservation);
    });
    return reservations;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
};

export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt'>) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Create Reservation Document
    const reservationRef = doc(collection(db, 'reservations'));
    const reservationId = reservationRef.id;
    
    batch.set(reservationRef, {
      ...reservationData,
      createdAt: Timestamp.now(),
    });

    // 2. Create Availability Document
    const availabilityRef = doc(collection(db, 'availability'));
    batch.set(availabilityRef, {
      vehicleId: reservationData.vehicleId,
      startDate: reservationData.startDate,
      endDate: reservationData.endDate,
      reservationId: reservationId
    });

    await batch.commit();
    return reservationId;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const checkAvailability = (
  startDate: Date,
  endDate: Date,
  reservations: Reservation[]
): boolean => {
  // Normalize dates to start of day for comparison if needed, 
  // but usually exact timestamps are better if rentals are per day.
  // Assuming per-day rentals, we might want to check overlap.

  const start = startDate.getTime();
  const end = endDate.getTime();

  for (const res of reservations) {
    const resStart = res.startDate.toDate().getTime();
    const resEnd = res.endDate.toDate().getTime();

    // Check for overlap
    // Overlap exists if (StartA <= EndB) and (EndA >= StartB)
    if (start <= resEnd && end >= resStart) {
      return false; // Overlap found, not available
    }
  }

  return true;
};

export const updateReservationStatus = async (
  reservationId: string,
  status: 'confirmed' | 'denied' | 'cancelled' | 'completed',
  denialReason?: string
) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    const updateData: any = { status };
    
    if (status === 'denied' && denialReason) {
      updateData.denialReason = denialReason;
    }

    await updateDoc(reservationRef, updateData);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};
