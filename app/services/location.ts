import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: Date;
}

export interface LocationError {
  code: string;
  message: string;
}

/**
 * #30 Solicitar permisos de ubicación con mejor UX
 */
export const requestLocationPermission = async (): Promise<{
  granted: boolean;
  error?: LocationError;
}> => {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    if (existingStatus === 'granted') {
      return { granted: true };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      return { granted: true };
    }

    return {
      granted: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Se requieren permisos de ubicación para el check-in',
      },
    };
  } catch (error) {
    console.error('[LocationService] Error requesting permission:', error);
    return {
      granted: false,
      error: {
        code: 'PERMISSION_ERROR',
        message: 'Error al solicitar permisos de ubicación',
      },
    };
  }
};

/**
 * #30 Obtener ubicación actual con alta precisión
 */
export const getCurrentLocation = async (
  highAccuracy: boolean = true
): Promise<{ location?: LocationResult; error?: LocationError }> => {
  try {
    const { granted } = await requestLocationPermission();

    if (!granted) {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permisos de ubicación denegados',
        },
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: highAccuracy
        ? Location.Accuracy.BestForNavigation
        : Location.Accuracy.Balanced,
    });

    return {
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date(location.timestamp),
      },
    };
  } catch (error) {
    console.error('[LocationService] Error getting location:', error);
    return {
      error: {
        code: 'LOCATION_ERROR',
        message: 'No se pudo obtener la ubicación. Verifica tu GPS.',
      },
    };
  }
};

/**
 * #30 Obtener dirección legible desde coordenadas
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{ address?: string; error?: LocationError }> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const addr = addresses[0];
      const parts = [
        addr.street,
        addr.streetNumber,
        addr.district,
        addr.city,
        addr.region,
      ].filter(Boolean);

      return { address: parts.join(', ') };
    }

    return { address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
  } catch (error) {
    console.error('[LocationService] Error getting address:', error);
    return {
      error: {
        code: 'GEOCODING_ERROR',
        message: 'No se pudo obtener la dirección',
      },
    };
  }
};

/**
 * #30 Calcular distancia entre dos puntos (en metros)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * #30 Verificar si el usuario está cerca de la ubicación objetivo
 */
export const isNearLocation = (
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 100
): boolean => {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusMeters;
};

/**
 * #30 Formato de distancia legible
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * #30 Monitorear ubicación en tiempo real
 */
export const watchLocation = async (
  callback: (location: LocationResult) => void,
  errorCallback?: (error: LocationError) => void
): Promise<{ remove: () => void } | null> => {
  try {
    const { granted } = await requestLocationPermission();

    if (!granted) {
      errorCallback?.({
        code: 'PERMISSION_DENIED',
        message: 'Permisos de ubicación denegados',
      });
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // Actualizar cada 10 metros
        timeInterval: 5000, // O cada 5 segundos
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: new Date(location.timestamp),
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('[LocationService] Error watching location:', error);
    errorCallback?.({
      code: 'WATCH_ERROR',
      message: 'Error al monitorear ubicación',
    });
    return null;
  }
};

/**
 * #30 Validar precisión de ubicación
 */
export const validateLocationAccuracy = (
  accuracy: number,
  requiredAccuracy: number = 50
): { isValid: boolean; warning?: string } => {
  if (accuracy <= requiredAccuracy) {
    return { isValid: true };
  }

  if (accuracy <= requiredAccuracy * 2) {
    return {
      isValid: true,
      warning: `Precisión baja (${Math.round(accuracy)}m). Considera esperar a mejor señal GPS.`,
    };
  }

  return {
    isValid: false,
    warning: `Precisión insuficiente (${Math.round(accuracy)}m). Se requiere mejor señal GPS.`,
  };
};
