import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Sistema de caché simple con TTL (Time To Live)
 */
export class Cache {
  private static TTL = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Guarda datos en caché
   */
  static async set<T>(key: string, data: T, ttl: number = this.TTL): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now() + ttl
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Error guardando en caché:', error);
    }
  }

  /**
   * Obtiene datos del caché si no han expirado
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Verificar si el caché ha expirado
      if (Date.now() > cacheItem.timestamp) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Error leyendo caché:', error);
      return null;
    }
  }

  /**
   * Elimina un elemento del caché
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Error eliminando caché:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Error limpiando caché:', error);
    }
  }

  /**
   * Invalida cachés relacionados con vehículos
   */
  static async invalidateVehicleCache(): Promise<void> {
    try {
      await Promise.all([
        this.remove('cache_all_vehicles'),
        this.remove('cache_featured_vehicles'),
        this.remove('cache_nearby_vehicles')
      ]);
    } catch (error) {
      console.warn('Error invalidando caché de vehículos:', error);
    }
  }
}

// Claves de caché predefinidas
export const CACHE_KEYS = {
  ALL_VEHICLES: 'cache_all_vehicles',
  FEATURED_VEHICLES: 'cache_featured_vehicles',
  NEARBY_VEHICLES: 'cache_nearby_vehicles',
  USER_VEHICLES: (userId: string) => `cache_user_vehicles_${userId}`,
  VEHICLE_DETAILS: (vehicleId: string) => `cache_vehicle_${vehicleId}`
};
