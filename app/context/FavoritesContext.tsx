import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/Auth';
import {
    subscribeToUserFavorites,
    toggleFavorite as toggleFavoriteService,
    type Favorite
} from '../services/favorites';

interface FavoritesContextType {
  favorites: Favorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  toggleFavorite: (vehicleId: string, vehicleSnapshot?: any) => Promise<boolean>;
  isFavorite: (vehicleId: string) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    // Suscribirse a cambios en favoritos
    const unsubscribe = subscribeToUserFavorites(
      user.uid,
      (updatedFavorites) => {
        setFavorites(updatedFavorites);
        setFavoriteIds(new Set(updatedFavorites.map(f => f.vehicleId)));
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to favorites:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = async (vehicleId: string, vehicleSnapshot?: any): Promise<boolean> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const newStatus = await toggleFavoriteService(user.uid, vehicleId, vehicleSnapshot);
      return newStatus;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const isFavorite = (vehicleId: string): boolean => {
    return favoriteIds.has(vehicleId);
  };

  const value: FavoritesContextType = {
    favorites,
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
