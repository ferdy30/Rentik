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
  return (
    <View style={styles.specsGrid}>
      <View style={styles.specItem}>
        <Ionicons name="speedometer-outline" size={24} color="#4B5563" />
        <Text style={styles.specLabel}>Transmisión</Text>
        <Text style={styles.specValue}>{transmision}</Text>
      </View>
      <View style={styles.specItem}>
        <Ionicons name="water-outline" size={24} color="#4B5563" />
        <Text style={styles.specLabel}>Combustible</Text>
        <Text style={styles.specValue}>{combustible}</Text>
      </View>
      <View style={styles.specItem}>
        <Ionicons name="people-outline" size={24} color="#4B5563" />
        <Text style={styles.specLabel}>Pasajeros</Text>
        <Text style={styles.specValue}>{pasajeros}</Text>
      </View>
      <View style={styles.specItem}>
        <Ionicons name="car-sport-outline" size={24} color="#4B5563" />
        <Text style={styles.specLabel}>Puertas</Text>
        <Text style={styles.specValue}>{puertas}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  specItem: {
    width: '45%',
    flexDirection: 'column',
    gap: 4,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
