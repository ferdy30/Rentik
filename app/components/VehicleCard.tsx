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
              {vehicle.ubicacion}
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    height: 140,
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
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 16,
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#374151',
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  reviewCount: {
    fontSize: 10,
    color: '#B45309',
  },
  year: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B729D',
  },
  priceUnit: {
    fontSize: 10,
    color: '#6B7280',
  },
});

export default VehicleCard;
