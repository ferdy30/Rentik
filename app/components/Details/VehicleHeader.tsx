import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleHeaderProps {
  marca: string;
  modelo: string;
  anio: number;
  rating: number;
  reviewCount: number;
}

export default function VehicleHeader({ marca, modelo, anio, rating, reviewCount }: VehicleHeaderProps) {
  const isTopRated = rating >= 4.8;
  
  return (
    <View>
      {isTopRated && (
        <View style={styles.topRatedBadge}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.topRatedText}>Top Rated</Text>
        </View>
      )}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>{marca}</Text>
          <Text style={styles.model}>{modelo} {anio}</Text>
        </View>
        <View style={styles.ratingBox}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.tripsCount}>{reviewCount} viajes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  topRatedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B729D',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  model: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 38,
  },
  ratingBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  tripsCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
