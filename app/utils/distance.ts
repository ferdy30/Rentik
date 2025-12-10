/**
 * Utilidades para cálculo de distancias geográficas
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param coord1 Primera coordenada
 * @param coord2 Segunda coordenada
 * @returns Distancia en kilómetros
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radio de la Tierra en km
  
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
    Math.cos(lat1) * Math.cos(lat2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar al usuario
 * @param distance Distancia en kilómetros
 * @returns String formateado
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Ordena un array de items por distancia a una ubicación
 * @param items Array de items con coordenadas
 * @param userLocation Ubicación del usuario
 * @param getCoordinates Función para extraer coordenadas del item
 * @returns Array ordenado por distancia (más cercano primero)
 */
export function sortByDistance<T>(
  items: T[],
  userLocation: Coordinates,
  getCoordinates: (item: T) => Coordinates | null
): T[] {
  return items
    .map(item => ({
      item,
      distance: (() => {
        const coords = getCoordinates(item);
        if (!coords) return Infinity;
        return calculateDistance(userLocation, coords);
      })()
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ item }) => item);
}

/**
 * Filtra items dentro de un radio específico
 * @param items Array de items con coordenadas
 * @param userLocation Ubicación del usuario
 * @param radiusKm Radio en kilómetros
 * @param getCoordinates Función para extraer coordenadas del item
 * @returns Array filtrado
 */
export function filterByRadius<T>(
  items: T[],
  userLocation: Coordinates,
  radiusKm: number,
  getCoordinates: (item: T) => Coordinates | null
): T[] {
  return items.filter(item => {
    const coords = getCoordinates(item);
    if (!coords) return false;
    const distance = calculateDistance(userLocation, coords);
    return distance <= radiusKm;
  });
}

/**
 * Agrega distancia a cada item (útil para mostrar en UI)
 * @param items Array de items
 * @param userLocation Ubicación del usuario
 * @param getCoordinates Función para extraer coordenadas del item
 * @returns Array de items con distancia agregada
 */
export function addDistanceToItems<T>(
  items: T[],
  userLocation: Coordinates,
  getCoordinates: (item: T) => Coordinates | null
): (T & { distance?: number; distanceText?: string })[] {
  return items.map(item => {
    const coords = getCoordinates(item);
    if (!coords) {
      return { ...item, distance: undefined, distanceText: undefined };
    }
    const distance = calculateDistance(userLocation, coords);
    return {
      ...item,
      distance,
      distanceText: formatDistance(distance)
    };
  });
}

/**
 * Calcula el costo de delivery basado en la distancia
 * Estructura de precios:
 * - 0-5 km: $5
 * - 5-10 km: $10
 * - 10-20 km: $15
 * - 20-30 km: $20
 * - +30 km: $25
 * @param pickupLocation Coordenadas del punto de recogida
 * @param deliveryLocation Coordenadas de entrega
 * @returns Costo de delivery en dólares
 */
export function calculateDeliveryCost(
  pickupLocation: Coordinates,
  deliveryLocation: Coordinates
): number {
  const distance = calculateDistance(pickupLocation, deliveryLocation);
  
  if (distance <= 5) return 5;
  if (distance <= 10) return 10;
  if (distance <= 20) return 15;
  if (distance <= 30) return 20;
  return 25;
}

/**
 * Obtiene detalles del costo de delivery con distancia
 * @param pickupLocation Coordenadas del punto de recogida
 * @param deliveryLocation Coordenadas de entrega
 * @returns Objeto con distancia, costo y mensaje informativo
 */
export function getDeliveryDetails(
  pickupLocation: Coordinates,
  deliveryLocation: Coordinates
): {
  distance: number;
  distanceText: string;
  cost: number;
  message: string;
} {
  const distance = calculateDistance(pickupLocation, deliveryLocation);
  const cost = calculateDeliveryCost(pickupLocation, deliveryLocation);
  const distanceText = formatDistance(distance);
  
  let message = '';
  if (distance <= 5) {
    message = 'Zona cercana - Entrega rápida';
  } else if (distance <= 10) {
    message = 'Zona intermedia';
  } else if (distance <= 20) {
    message = 'Zona extendida';
  } else if (distance <= 30) {
    message = 'Zona lejana';
  } else {
    message = 'Zona muy lejana - Puede tomar más tiempo';
  }
  
  return {
    distance,
    distanceText,
    cost,
    message,
  };
}
