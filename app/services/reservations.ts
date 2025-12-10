import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../FirebaseConfig';

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
  isDelivery?: boolean;
  deliveryAddress?: string;
  deliveryCoords?: { latitude: number; longitude: number };
  pickupCoords?: { latitude: number; longitude: number };
  denialReason?: string;
    cancellationReason?: string;
  messageToHost?: string;
    updatedAt?: Timestamp;
    deniedAt?: Timestamp;
    cancelledAt?: Timestamp;
    archived?: boolean;
    archivedAt?: Timestamp;
  vehicleSnapshot?: {
    marca: string;
    modelo: string;
    anio: number;
    imagen: string;
  };
  extras?: {
    babySeat?: boolean;
    insurance?: boolean;
    gps?: boolean;
  };
  priceBreakdown?: {
    days: number;
    pricePerDay: number;
    deliveryFee: number;
    extrasTotal: number;
    serviceFee: number;
    subtotal: number;
    total: number;
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
  } catch (error: any) {
    throw new Error(error.message || 'Error al cargar las reservas');
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
  } catch (error: any) {
    throw new Error(error.message || 'Error al cargar las reservas');
  }
};

export const getVehicleReservations = async (vehicleId: string): Promise<Reservation[]> => {
  try {
    if (!vehicleId) {
      return [];
    }
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
  } catch (error: any) {
    throw new Error(error.message || 'Error al cargar disponibilidad del vehículo');
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
  } catch (error: any) {
    throw new Error(error.message || 'Error al crear la reserva');
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
  reason?: string
) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    const updateData: any = { 
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === 'denied' && reason) {
      updateData.denialReason = reason;
      updateData.deniedAt = serverTimestamp();
    }
    
    if (status === 'cancelled' && reason) {
      updateData.cancellationReason = reason;
      updateData.cancelledAt = serverTimestamp();
    }

    await updateDoc(reservationRef, updateData);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};

export const deleteReservation = async (reservationId: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    
    // Verify the reservation exists and user has permission
    const reservationSnap = await getDoc(reservationRef);
    if (!reservationSnap.exists()) {
      throw new Error('Reserva no encontrada');
    }
    
    const reservationData = reservationSnap.data();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    // Verify user is either the renter or the host
    if (reservationData.userId !== currentUser.uid && reservationData.arrendadorId !== currentUser.uid) {
      throw new Error('No tienes permisos para eliminar esta reserva');
    }
    
    await deleteDoc(reservationRef);
  } catch (error: any) {
    throw new Error(error.message || 'Error al eliminar la reserva');
  }
};

export const archiveReservation = async (reservationId: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      archived: true,
      archivedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Error al archivar la reserva');
  }
};
