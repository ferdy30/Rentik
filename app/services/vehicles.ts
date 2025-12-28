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
  imagen?: string;
  imagenes?: string[];
  createdAt: Date;
  rating: number;
  trips: number;
  status: 'active' | 'inactive' | 'rented';
}

import { Platform } from 'react-native';

/**
 * Sube una imagen a Firebase Storage y retorna la URL de descarga
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // Validar que la URI no esté vacía
    if (!uri || uri.trim() === '') {
      throw new Error('URI de imagen inválida');
    }

    let blob: Blob;

    if (Platform.OS === 'ios') {
        // En iOS, fetch funciona bien y es más nativo
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`Error al cargar imagen: ${response.status}`);
        blob = await response.blob();
    } else {
        // En Android, XMLHttpRequest es más robusto para URIs locales (file:// y content://)
        blob = await new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.error('XHR Error:', e);
                reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });
    }
    
    // Validar tamaño de imagen (máximo 10MB para ser seguros, aunque 5MB es buen límite)
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('La imagen es muy grande. El tamaño máximo es 10MB');
    }

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    
    // Cerrar el blob para liberar memoria
    // @ts-ignore
    if (blob.close) {
        // @ts-ignore
        blob.close();
    }

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

    // 1. Subir fotos en paralelo (incluir fotos adicionales)
    const timestamp = Date.now();
    
    // Objeto para mapear las URLs de las fotos obligatorias
    const uploadedPhotos: { [key: string]: string } = {};
    const allPhotoUrls: string[] = [];

    // Función auxiliar para subir y rastrear
    const uploadAndTrack = async (key: string, uri: string) => {
        if (!uri) return;
        try {
            const path = `vehicles/${userId}/${timestamp}/${key}.jpg`;
            const url = await uploadImage(uri, path);
            uploadedPhotos[key] = url;
            allPhotoUrls.push(url);
            return url;
        } catch (e) {
            console.error(`Error uploading ${key}:`, e);
            return null;
        }
    };

    const uploadPromises: Promise<any>[] = [];

    // Subir fotos obligatorias con sus claves específicas
    if (vehicleData.photos?.front) uploadPromises.push(uploadAndTrack('front', vehicleData.photos.front));
    if (vehicleData.photos?.sideLeft) uploadPromises.push(uploadAndTrack('sideLeft', vehicleData.photos.sideLeft));
    if (vehicleData.photos?.sideRight) uploadPromises.push(uploadAndTrack('sideRight', vehicleData.photos.sideRight));
    if (vehicleData.photos?.interior) uploadPromises.push(uploadAndTrack('interior', vehicleData.photos.interior));
    
    // Subir fotos adicionales
    const additionalPhotos = (vehicleData as any).additionalPhotos;
    if (additionalPhotos && Array.isArray(additionalPhotos)) {
        additionalPhotos.forEach((uri: string, index: number) => {
             uploadPromises.push(uploadAndTrack(`additional_${index}`, uri));
        });
    }

    await Promise.all(uploadPromises);

    console.log('🎉 Todas las fotos subidas:', allPhotoUrls.length, 'URLs');

    // 2. Guardar datos en Firestore
    const newVehicle = {
      marca: vehicleData.marca,
      modelo: vehicleData.modelo,
      anio: parseInt(vehicleData.anio),
      placa: vehicleData.placa,
      tipo: vehicleData.tipo,
      transmision: vehicleData.transmision,
      combustible: vehicleData.combustible,
      pasajeros: parseInt(vehicleData.pasajeros),
      puertas: parseInt(vehicleData.puertas),
      color: vehicleData.color,
      kilometraje: parseInt(vehicleData.kilometraje),
      condicion: vehicleData.condicion,
      caracteristicas: vehicleData.caracteristicas || [],
      
      precio: parseFloat(vehicleData.precio),
      descripcion: vehicleData.descripcion,
      ubicacion: vehicleData.ubicacion,
      coordinates: vehicleData.coordinates,
      placeId: vehicleData.placeId,
      
      availableFrom: vehicleData.availableFrom,
      blockedDates: vehicleData.blockedDates || [],
      
      flexibleHours: vehicleData.flexibleHours,
      deliveryHours: vehicleData.deliveryHours,
      airportDelivery: vehicleData.airportDelivery,
      airportFee: vehicleData.airportFee || 0,
      
      mileageLimit: vehicleData.mileageLimit || 'unlimited',
      dailyKm: vehicleData.dailyKm || null,
      advanceNotice: parseInt(vehicleData.advanceNotice || '12'),
      minTripDuration: parseInt(vehicleData.minTripDuration || '1'),
      maxTripDuration: parseInt(vehicleData.maxTripDuration || '30'),
      
      rules: vehicleData.rules || {},
      discounts: vehicleData.discounts || {},
      deposit: vehicleData.deposit,
      protectionPlan: vehicleData.protectionPlan || 'standard',
      
      photos: {
        front: uploadedPhotos.front || '',
        sideLeft: uploadedPhotos.sideLeft || '',
        sideRight: uploadedPhotos.sideRight || '',
        interior: uploadedPhotos.interior || '',
      },
      imagenes: allPhotoUrls,
      imagen: uploadedPhotos.front || allPhotoUrls[0] || '',
      
      arrendadorId: userId,
      createdAt: new Date(),
      rating: 0,
      reviewCount: 0,
      trips: 0,
      disponible: true,
      status: 'active',
    };

    console.log('💾 Guardando en Firestore:', {
      imagenes: newVehicle.imagenes,
      imagen: newVehicle.imagen,
      totalImagenes: newVehicle.imagenes.length
    });

    const docRef = await addDoc(collection(db, 'vehicles'), newVehicle);
    console.log('✅ Vehículo guardado con ID:', docRef.id);
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
