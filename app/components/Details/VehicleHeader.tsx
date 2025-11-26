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
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.brand}>{marca}</Text>
        <Text style={styles.model}>{modelo} {anio}</Text>
      </View>
      <View style={styles.ratingBox}>
        <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star} 
              name={star <= Math.round(rating) ? "star" : "star-outline"} 
              size={10} 
              color="#FBBF24" 
            />
          ))}
        </View>
        <Text style={styles.tripsCount}>({reviewCount} viajes)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  model: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  ratingBox: {
    alignItems: 'flex-end',
  },
  ratingScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 2,
  },
  tripsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
});
