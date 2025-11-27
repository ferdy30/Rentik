import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../FirebaseConfig';

export interface VehicleData {
  id?: string;
  arrendadorId: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  tipo: string;
  transmision: string;
  combustible: string;
  pasajeros: number;
  puertas: number;
  color: string;
  caracteristicas: string[];
  precio: number;
  descripcion: string;
  ubicacion: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
  photos: {
    front: string;
    sideLeft: string;
    sideRight: string;
    interior: string;
  };
  createdAt: Date;
  rating: number;
  trips: number;
  status: 'active' | 'inactive' | 'rented';
}

/**
 * Sube una imagen a Firebase Storage y retorna la URL de descarga
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // Validar que la URI no esté vacía
    if (!uri || uri.trim() === '') {
      throw new Error('URI de imagen inválida');
    }

    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`Error al cargar imagen: ${response.status}`);
    }

    const blob = await response.blob();
    
    // Validar tamaño de imagen (máximo 5MB)
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('La imagen es muy grande. El tamaño máximo es 5MB');
    }

    // Validar tipo de archivo
    if (!blob.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Error al subir la imagen');
  }
};

/**
 * Guarda un nuevo vehículo en Firestore
 */
export const addVehicle = async (vehicleData: Omit<VehicleData, 'id' | 'createdAt' | 'rating' | 'trips' | 'status'>, userId: string) => {
  try {
    // Validaciones básicas
    if (!userId || userId.trim() === '') {
      throw new Error('Usuario inválido');
    }

    if (!vehicleData.precio || vehicleData.precio < 5 || vehicleData.precio > 500) {
      throw new Error('Precio inválido (debe estar entre $5 y $500)');
    }

    if (!vehicleData.descripcion || vehicleData.descripcion.length < 20) {
      throw new Error('La descripción es muy corta');
    }

    // 1. Subir fotos en paralelo
    const timestamp = Date.now();
    const photoPromises = Object.entries(vehicleData.photos).map(async ([key, uri]) => {
      if (uri) {
        const path = `vehicles/${userId}/${timestamp}/${key}.jpg`;
        const url = await uploadImage(uri, path);
        return { key, url };
      }
      return null;
    });

    const results = await Promise.all(photoPromises);
    
    const photoUrls: any = {};
    results.forEach(result => {
      if (result) {
        photoUrls[result.key] = result.url;
      }
    });

    // 2. Guardar datos en Firestore
    const newVehicle = {
      ...vehicleData,
      photos: photoUrls,
      arrendadorId: userId,
      createdAt: new Date(),
      rating: 0,
      trips: 0,
      status: 'active',
    };

    const docRef = await addDoc(collection(db, 'vehicles'), newVehicle);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

/**
 * Obtiene los vehículos de un arrendador específico
 */
export const getVehiclesByOwner = async (userId: string): Promise<VehicleData[]> => {
  try {
    const q = query(collection(db, 'vehicles'), where('arrendadorId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleData));
  } catch (error) {
    console.error('Error fetching owner vehicles:', error);
    throw error;
  }
};

/**
 * Obtiene todos los vehículos disponibles con paginación (para arrendatarios)
 */
export const getAllVehicles = async (limitCount: number = 20): Promise<VehicleData[]> => {
  try {
    const q = query(
      collection(db, 'vehicles'), 
      where('status', '==', 'active'),
      // orderBy('createdAt', 'desc'), // Agregar cuando se cree el índice en Firestore
      // limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleData));
  } catch (error) {
    console.error('Error fetching all vehicles:', error);
    throw error;
  }
};

/**
 * Elimina un vehículo de Firestore
 */
export const deleteVehicle = async (vehicleId: string) => {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

/**
 * Actualiza un vehículo en Firestore
 */
export const updateVehicle = async (vehicleId: string, data: Partial<VehicleData>) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, data);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

/**
 * Suscribe a los cambios en los vehículos de un arrendador
 */
export const subscribeToOwnerVehicles = (userId: string, onUpdate: (vehicles: VehicleData[]) => void, onError: (error: any) => void) => {
  const q = query(collection(db, 'vehicles'), where('arrendadorId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleData));
    onUpdate(vehicles);
  }, onError);
};
