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
