import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleSpecsProps {
  transmision: string;
  combustible: string;
  pasajeros: number;
  puertas: number;
}

export default function VehicleSpecs({ transmision, combustible, pasajeros, puertas }: VehicleSpecsProps) {
  // Valores por defecto para evitar undefined/null
  const safeTransmision = transmision || 'Automático';
  const safeCombustible = combustible || 'Gasolina';
  const safePasajeros = pasajeros || 5;
  const safePuertas = puertas || 4;
  
  return (
    <View style={styles.specsGrid}>
      <View style={styles.specCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="speedometer-outline" size={20} color="#2563EB" />
        </View>
        <Text style={styles.specLabel}>Transmisión</Text>
        <Text style={styles.specValue}>{safeTransmision}</Text>
      </View>
      <View style={styles.specCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="water-outline" size={20} color="#F59E0B" />
        </View>
        <Text style={styles.specLabel}>Combustible</Text>
        <Text style={styles.specValue}>{safeCombustible}</Text>
      </View>
      <View style={styles.specCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="people-outline" size={20} color="#10B981" />
        </View>
        <Text style={styles.specLabel}>Pasajeros</Text>
        <Text style={styles.specValue}>{safePasajeros}</Text>
      </View>
      <View style={styles.specCard}>
        <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
          <Ionicons name="car-sport-outline" size={20} color="#EC4899" />
        </View>
        <Text style={styles.specLabel}>Puertas</Text>
        <Text style={styles.specValue}>{safePuertas}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});
