import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';

interface FavoriteButtonProps {
  vehicleId: string;
  vehicleSnapshot?: {
    marca: string;
    modelo: string;
    anio: number;
    precio: number;
    imagen: string;
    ubicacion: string;
    rating: number;
    arrendadorId: string;
  };
  size?: number;
  style?: any;
  color?: string;
  activeColor?: string;
}

export default function FavoriteButton({
  vehicleId,
  vehicleSnapshot,
  size = 24,
  style,
  color = '#757575',
  activeColor = '#EF4444',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const isCurrentlyFavorite = isFavorite(vehicleId);

  const handleToggle = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newStatus = await toggleFavorite(vehicleId, vehicleSnapshot);

      if (newStatus) {
        showToast('Agregado a favoritos', 'success');
      } else {
        showToast('Removido de favoritos', 'info');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Error al actualizar favoritos', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleToggle}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : (
        <Ionicons
          name={isCurrentlyFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isCurrentlyFavorite ? activeColor : color}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
