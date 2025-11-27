import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Vehicle } from '../constants/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onFavoritePress?: (id: string) => void;
  isFavorite?: boolean;
  style?: any;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onFavoritePress,
  isFavorite = false,
  style,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const images = vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes : [vehicle.imagen];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setImageIndex(roundIndex);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={onPress} 
      activeOpacity={0.9}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
    >
      {/* Image with carousel */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: '100%', height: '100%' }}
        >
          {images.map((img, index) => (
            <Image 
              key={index}
              source={{ uri: img }} 
              style={[styles.image, { width: cardWidth || '100%' }]}
              contentFit="cover"
              transition={500}
            />
          ))}
        </ScrollView>
        
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
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{vehicle.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Year */}
        <Text style={styles.year}>{vehicle.anio}</Text>

        {/* Price and Location */}
        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${vehicle.precio}</Text>
            <Text style={styles.priceUnit}>/día</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {vehicle.distanceText ? `${vehicle.distanceText} • ` : ''}{vehicle.ubicacion}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getBadgeStyle = (badge: string) => {
  switch (badge) {
    case 'Nuevo':
      return { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' };
    case 'Más rentado':
      return { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' };
    case 'Descuento':
      return { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' };
    default:
      return { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewCount: {
    fontSize: 10,
    color: '#B45309',
  },
  year: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: '500',
  },
  featuresRow: {
    display: 'none',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B729D',
  },
  priceUnit: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default VehicleCard;
