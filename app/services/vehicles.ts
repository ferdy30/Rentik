import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Platform } from 'react-native';
import { db, storage } from '../FirebaseConfig';
import { Vehicle } from '../types/vehicle';
import { Cache, CACHE_KEYS } from '../utils/cache';

// Re-exportar para compatibilidad
export type VehicleData = Vehicle;

/**
 * Normaliza los datos del vehículo para asegurar compatibilidad entre versiones
 */
export const normalizeVehicleData = (id: string, data: any): Vehicle => {
  // 1. Normalizar fotos
  let photos = data.photos || {};
  
  // Si no tiene estructura de fotos nueva pero tiene imagen antigua
  if (!photos.front && data.imagen) {
    photos.front = data.imagen;
  }
  
  // Si tiene array de imagenes pero no fotos específicas
  if (data.imagenes && Array.isArray(data.imagenes)) {
    if (!photos.front && data.imagenes[0]) photos.front = data.imagenes[0];
    if (!photos.sideLeft && data.imagenes[1]) photos.sideLeft = data.imagenes[1];
    if (!photos.sideRight && data.imagenes[2]) photos.sideRight = data.imagenes[2];
    if (!photos.interior && data.imagenes[3]) photos.interior = data.imagenes[3];
  }

  // Asegurar que photos tenga todas las propiedades requeridas
  photos = {
    front: photos.front || '',
    sideLeft: photos.sideLeft || '',
    sideRight: photos.sideRight || '',
    interior: photos.interior || '',
    ...photos // Mantener otras propiedades si existen
  };

  return {
    id,
    arrendadorId: data.arrendadorId || '',
    // Info Básica
    marca: data.marca || '',
    modelo: data.modelo || '',
    anio: data.anio || new Date().getFullYear(),
    placa: data.placa || '',
    tipo: data.tipo || 'Sedán',
    transmision: data.transmision || 'Automático',
    combustible: data.combustible || 'Gasolina',
    // Specs
    pasajeros: data.pasajeros ?? 5,
    puertas: data.puertas ?? 4,
    color: data.color || 'Blanco',
    kilometraje: data.kilometraje ?? 0,
    condicion: data.condicion || 'Bueno',
    caracteristicas: Array.isArray(data.caracteristicas) ? data.caracteristicas : [],
    // Multimedia
    photos,
    imagen: data.imagen || photos.front || '',
    imagenes: Array.isArray(data.imagenes) ? data.imagenes : Object.values(photos).filter(Boolean),
    // Precio y Ubicación
    precio: typeof data.precio === 'number' ? data.precio : 0,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : '',
    ubicacion: typeof data.ubicacion === 'string' ? data.ubicacion : '',
    coordinates: data.coordinates || { latitude: 0, longitude: 0 },
    placeId: data.placeId || '',
    // Disponibilidad
    availableFrom: data.availableFrom || new Date().toISOString(),
    blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
    flexibleHours: typeof data.flexibleHours === 'boolean' ? data.flexibleHours : true,
    deliveryHours: data.deliveryHours || '',
    airportDelivery: typeof data.airportDelivery === 'boolean' ? data.airportDelivery : false,
    airportFee: typeof data.airportFee === 'number' ? data.airportFee : 0,
    mileageLimit: data.mileageLimit || 'unlimited',
    dailyKm: typeof data.dailyKm === 'number' ? data.dailyKm : null,
    advanceNotice: typeof data.advanceNotice === 'number' ? data.advanceNotice : 12,
    minTripDuration: typeof data.minTripDuration === 'number' ? data.minTripDuration : 1,
    maxTripDuration: typeof data.maxTripDuration === 'number' ? data.maxTripDuration : 30,
    rules: typeof data.rules === 'object' && data.rules !== null ? data.rules : {},
    discounts: typeof data.discounts === 'object' && data.discounts !== null ? data.discounts : {},
    deposit: typeof data.deposit === 'number' ? data.deposit : 0,
    protectionPlan: data.protectionPlan || 'standard',
    // Meta
    createdAt: data.createdAt || new Date().toISOString(),
    rating: typeof data.rating === 'number' ? data.rating : 0,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
    trips: typeof data.trips === 'number' ? data.trips : 0,
    status: data.status || 'active',
    disponible: typeof data.disponible === 'boolean' ? data.disponible : (data.disponible === 'true' ? true : (data.disponible === 'false' ? false : true)),
  };
};

/**
 * Sube una imagen a Firebase Storage y retorna la URL de descarga
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    if (!uri || uri.trim() === '') {
      throw new Error('URI de imagen inválida');
    }

    let blob: Blob;

    if (Platform.OS === 'ios') {
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`Error al cargar imagen: ${response.status}`);
        blob = await response.blob();
    } else {
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
    
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('La imagen es muy grande. El tamaño máximo es 10MB');
    }

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    
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
 * @param onProgress - Callback para reportar progreso de subida de fotos (current, total)
 */
export const addVehicle = async (
  vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'rating' | 'trips' | 'status' | 'reviewCount'>, 
  userId: string,
  onProgress?: (current: number, total: number) => void
) => {
  try {
    if (!userId) throw new Error('Usuario inválido');
    if (!vehicleData.precio || vehicleData.precio < 5) throw new Error('Precio inválido');

    // 1. Preparar lista de fotos a subir
    const timestamp = Date.now();
    const uploadedPhotos: { [key: string]: string } = {};
    const allPhotoUrls: string[] = [];
    
    // Crear lista de fotos a subir
    const photosToUpload: Array<{ key: string; uri: string }> = [];
    
    if (vehicleData.photos?.front) photosToUpload.push({ key: 'front', uri: vehicleData.photos.front });
    if (vehicleData.photos?.sideLeft) photosToUpload.push({ key: 'sideLeft', uri: vehicleData.photos.sideLeft });
    if (vehicleData.photos?.sideRight) photosToUpload.push({ key: 'sideRight', uri: vehicleData.photos.sideRight });
    if (vehicleData.photos?.interior) photosToUpload.push({ key: 'interior', uri: vehicleData.photos.interior });
    
    // Fotos adicionales
    Object.keys(vehicleData.photos || {}).forEach(key => {
        if (!['front', 'sideLeft', 'sideRight', 'interior'].includes(key) && vehicleData.photos[key]) {
            photosToUpload.push({ key, uri: vehicleData.photos[key] });
        }
    });

    const totalPhotos = photosToUpload.length;
    let uploadedCount = 0;

    // Subir fotos secuencialmente con reporte de progreso
    for (const { key, uri } of photosToUpload) {
        try {
            const path = `vehicles/${userId}/${timestamp}/${key}.jpg`;
            const url = await uploadImage(uri, path);
            uploadedPhotos[key] = url;
            allPhotoUrls.push(url);
            
            uploadedCount++;
            if (onProgress) {
                onProgress(uploadedCount, totalPhotos);
            }
        } catch (e) {
            console.error(`Error uploading ${key}:`, e);
            uploadedCount++;
            if (onProgress) {
                onProgress(uploadedCount, totalPhotos);
            }
        }
    }

    // 2. Guardar en Firestore
    const newVehicle = {
      ...vehicleData,
      photos: {
        front: uploadedPhotos.front || '',
        sideLeft: uploadedPhotos.sideLeft || '',
        sideRight: uploadedPhotos.sideRight || '',
        interior: uploadedPhotos.interior || '',
        ...uploadedPhotos // Incluir adicionales
      },
      imagenes: allPhotoUrls,
      imagen: uploadedPhotos.front || allPhotoUrls[0] || '',
      
      arrendadorId: userId,
      createdAt: new Date(),
      rating: 0,
      reviewCount: 0,
      trips: 0,
      status: 'active',
      disponible: true,
    };

    console.log('💾 Guardando en Firestore:', {
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      descripcion: newVehicle.descripcion,
      descripcionLength: newVehicle.descripcion?.length,
      caracteristicas: newVehicle.caracteristicas,
      caracteristicasLength: newVehicle.caracteristicas?.length,
      caracteristicasType: typeof newVehicle.caracteristicas,
      caracteristicasIsArray: Array.isArray(newVehicle.caracteristicas)
    });

    const docRef = await addDoc(collection(db, 'vehicles'), newVehicle);
    
    // Invalidar caché al agregar vehículo nuevo
    await Cache.invalidateVehicleCache();
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

/**
 * Obtiene los vehículos de un arrendador específico
 */
export const getVehiclesByOwner = async (userId: string): Promise<Vehicle[]> => {
  try {
    const q = query(collection(db, 'vehicles'), where('arrendadorId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => normalizeVehicleData(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching owner vehicles:', error);
    throw error;
  }
};

/**
 * Obtiene todos los vehículos disponibles (con caché)
 */
export const getAllVehicles = async (limitCount: number = 20, useCache: boolean = true): Promise<Vehicle[]> => {
  try {
    // Intentar obtener del caché primero
    if (useCache) {
      const cachedVehicles = await Cache.get<Vehicle[]>(CACHE_KEYS.ALL_VEHICLES);
      if (cachedVehicles) {
        console.log('✅ Vehículos cargados desde caché');
        return cachedVehicles;
      }
    }

    // Obtener TODOS los vehículos sin filtrar por status
    const q = query(collection(db, 'vehicles'));
    const querySnapshot = await getDocs(q);
    
    // Normalizar y filtrar vehículos
    const vehicles = querySnapshot.docs
      .map(doc => normalizeVehicleData(doc.id, doc.data()))
      .filter(vehicle => {
        // Mostrar vehículos que tengan status 'active' o 'available', o que tengan disponible=true
        return vehicle.status === 'active' || 
               vehicle.status === 'available' || 
               vehicle.disponible === true;
      });

    // Verificar disponibilidad en tiempo real basada en reservas activas
    const vehiclesWithRealAvailability = await Promise.all(
      vehicles.map(async (vehicle) => {
        try {
          // Buscar reservas activas para este vehículo
          const reservationsRef = collection(db, 'reservations');
          const activeReservationsQuery = query(
            reservationsRef,
            where('vehicleId', '==', vehicle.id),
            where('status', 'in', ['confirmed', 'in-progress'])
          );
          const reservationsSnapshot = await getDocs(activeReservationsQuery);
          
          // El vehículo está disponible si NO tiene reservas activas
          const hasActiveReservations = !reservationsSnapshot.empty;
          
          return {
            ...vehicle,
            disponible: !hasActiveReservations,
            // Mantener el status original pero actualizar disponible
          };
        } catch (error) {
          console.error(`Error checking availability for vehicle ${vehicle.id}:`, error);
          // En caso de error, mantener el estado original
          return vehicle;
        }
      })
    );

    // Guardar en caché por 5 minutos
    if (useCache) {
      await Cache.set(CACHE_KEYS.ALL_VEHICLES, vehiclesWithRealAvailability);
      console.log('💾 Vehículos guardados en caché');
    }

    return vehiclesWithRealAvailability;
  } catch (error) {
    console.error('Error fetching all vehicles:', error);
    throw error;
  }
};

/**
 * Elimina un vehículo
 */
export const deleteVehicle = async (vehicleId: string) => {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
    // Invalidar caché
    await Cache.invalidateVehicleCache();
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

/**
 * Actualiza un vehículo
 */
export const updateVehicle = async (vehicleId: string, data: Partial<Vehicle>) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, data);
    // Invalidar caché
    await Cache.invalidateVehicleCache();
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

/**
 * Actualiza las fotos de un vehículo
 * @param vehicleId - ID del vehículo
 * @param photos - Array de URIs de las nuevas fotos (locales o remotas)
 * @param deletedPhotos - Array de URLs de Firebase Storage para eliminar
 * @param userId - ID del usuario para el path de Storage
 */
export const updateVehiclePhotos = async (
  vehicleId: string,
  photos: string[],
  deletedPhotos: string[],
  userId: string
) => {
  try {
    // 1. Eliminar fotos de Firebase Storage
    if (deletedPhotos.length > 0) {
      await Promise.all(
        deletedPhotos.map(async (url) => {
          try {
            // Solo eliminar si es URL de Firebase Storage
            if (url.includes('firebasestorage.googleapis.com')) {
              const photoRef = ref(storage, url);
              await deleteObject(photoRef);
            }
          } catch (e) {
            console.warn('Error deleting photo:', url, e);
          }
        })
      );
    }

    // 2. Subir nuevas fotos (solo las que sean URIs locales)
    const timestamp = Date.now();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      // Si ya es URL de Firebase, mantenerla
      if (photo.startsWith('http')) {
        uploadedUrls.push(photo);
      } else {
        // Subir nueva foto
        try {
          const path = `vehicles/${userId}/${timestamp}/photo_${i}.jpg`;
          const url = await uploadImage(photo, path);
          uploadedUrls.push(url);
        } catch (e) {
          console.error('Error uploading photo:', e);
        }
      }
    }

    // 3. Actualizar documento en Firestore
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      imagenes: uploadedUrls,
      imagen: uploadedUrls[0] || '',
      photos: {
        front: uploadedUrls[0] || '',
        sideLeft: uploadedUrls[1] || '',
        sideRight: uploadedUrls[2] || '',
        interior: uploadedUrls[3] || '',
      },
    });
  } catch (error) {
    console.error('Error updating vehicle photos:', error);
    throw error;
  }
};

/**
 * Suscribe a los cambios en los vehículos de un arrendador
 */
export const subscribeToOwnerVehicles = (userId: string, onUpdate: (vehicles: Vehicle[]) => void, onError: (error: any) => void) => {
  const q = query(collection(db, 'vehicles'), where('arrendadorId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const vehicles = snapshot.docs.map(doc => normalizeVehicleData(doc.id, doc.data()));
    onUpdate(vehicles);
  }, onError);
};
