import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

export interface VehicleSnapshot {
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  imagen: string;
  ubicacion: string;
  rating?: number;
  arrendadorId: string;
}

export interface Favorite {
  id: string;
  userId: string;
  vehicleId: string;
  addedAt: Timestamp;
  vehicleSnapshot?: VehicleSnapshot;
}

/**
 * Genera el ID compuesto para el documento de favorito
 */
const getFavoriteId = (userId: string, vehicleId: string): string => {
  return `${userId}_${vehicleId}`;
};

/**
 * Agrega un vehículo a favoritos
 */
export const addToFavorites = async (
  userId: string,
  vehicleId: string,
  vehicleSnapshot?: VehicleSnapshot
): Promise<void> => {
  try {
    const favoriteId = getFavoriteId(userId, vehicleId);
    const favoriteRef = doc(db, 'favorites', favoriteId);

    await setDoc(favoriteRef, {
      userId,
      vehicleId,
      addedAt: Timestamp.now(),
      vehicleSnapshot: vehicleSnapshot || null,
    });

    // También actualizar el array en el documento del usuario
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(vehicleId),
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remueve un vehículo de favoritos
 */
export const removeFromFavorites = async (
  userId: string,
  vehicleId: string
): Promise<void> => {
  try {
    const favoriteId = getFavoriteId(userId, vehicleId);
    const favoriteRef = doc(db, 'favorites', favoriteId);

    await deleteDoc(favoriteRef);

    // También actualizar el array en el documento del usuario
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(vehicleId),
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Verifica si un vehículo está en favoritos
 */
export const isFavorite = async (
  userId: string,
  vehicleId: string
): Promise<boolean> => {
  try {
    const favoriteId = getFavoriteId(userId, vehicleId);
    const favoriteRef = doc(db, 'favorites', favoriteId);
    const favoriteSnap = await getDoc(favoriteRef);

    return favoriteSnap.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

/**
 * Obtiene todos los favoritos de un usuario
 */
export const getUserFavorites = async (userId: string): Promise<Favorite[]> => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const favorites: Favorite[] = [];
    querySnapshot.forEach((doc) => {
      favorites.push({
        id: doc.id,
        ...doc.data(),
      } as Favorite);
    });

    return favorites;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
};

/**
 * Suscripción en tiempo real a los favoritos del usuario
 */
export const subscribeToUserFavorites = (
  userId: string,
  onUpdate: (favorites: Favorite[]) => void,
  onError?: (error: Error) => void
) => {
  const favoritesRef = collection(db, 'favorites');
  const q = query(favoritesRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const favorites: Favorite[] = [];
      snapshot.forEach((doc) => {
        favorites.push({
          id: doc.id,
          ...doc.data(),
        } as Favorite);
      });
      onUpdate(favorites);
    },
    (error) => {
      console.error('Error in favorites subscription:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Toggle favorito (agrega o remueve según el estado actual)
 */
export const toggleFavorite = async (
  userId: string,
  vehicleId: string,
  vehicleSnapshot?: VehicleSnapshot
): Promise<boolean> => {
  try {
    const isCurrentlyFavorite = await isFavorite(userId, vehicleId);

    if (isCurrentlyFavorite) {
      await removeFromFavorites(userId, vehicleId);
      return false;
    } else {
      await addToFavorites(userId, vehicleId, vehicleSnapshot);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};
