import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import type { Vehicle } from '../constants/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onFavoritePress?: (id: string) => void;
  isFavorite?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const [imageIndex] = useState(0);
  const images = vehicle.imagenes || [vehicle.imagen];

  const hasDiscount = Boolean(vehicle.precioOriginal && vehicle.precioOriginal > vehicle.precio);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image with carousel */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: images[imageIndex] }} 
          style={styles.image}
          defaultSource={require('../../assets/images/CarLogo.png')}
        />
        
        {/* Favorite button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onFavoritePress(vehicle.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#EF4444' : '#fff'}
            />
          </TouchableOpacity>
        )}

        {/* Badges */}
        {vehicle.badges && vehicle.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {vehicle.badges.slice(0, 2).map((badge) => (
              <View key={badge} style={[styles.badge, getBadgeStyle(badge)]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Image dots indicator */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
            {images.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and rating */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {vehicle.marca} {vehicle.modelo}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{vehicle.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Year */}
        <Text style={styles.year}>{vehicle.anio}</Text>

        {/* Features icons */}
        <View style={styles.featuresRow}>
          <View style={styles.feature}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.featureText}>{vehicle.pasajeros}</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons
              name={vehicle.transmision === 'Automático' ? 'settings-outline' : 'git-merge-outline'}
              size={14}
              color="#6B7280"
            />
            <Text style={styles.featureText}>
              {vehicle.transmision === 'Automático' ? 'Auto' : 'Manual'}
            </Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
            <Text style={styles.featureText}>{vehicle.combustible}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText}>{vehicle.ubicacion}</Text>
          {vehicle.distancia && (
            <Text style={styles.distanceText}>• {vehicle.distancia} km</Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${vehicle.precio}</Text>
            <Text style={styles.priceLabel}>/día</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>${vehicle.precioOriginal}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookButtonText}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getBadgeStyle = (badge: string) => {
  switch (badge) {
    case 'Nuevo':
      return { backgroundColor: '#DBEAFE' };
    case 'Más rentado':
      return { backgroundColor: '#FEF9C3' };
    case 'Descuento':
      return { backgroundColor: '#DCFCE7' };
    case 'Disponible hoy':
      return { backgroundColor: '#E0E7FF' };
    case 'Verificado':
      return { backgroundColor: '#D1FAE5' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
};

export default VehicleCard;

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#032B3C',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#032B3C',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#032B3C',
  },
  year: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featureText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
  },
  distanceText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
