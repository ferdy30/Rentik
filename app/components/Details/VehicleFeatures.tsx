import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleFeaturesProps {
  features: string[];
}

export default function VehicleFeatures({ features }: VehicleFeaturesProps) {
  const displayFeatures = features && features.length > 0 ? features : ['Bluetooth', 'A/C', 'USB', 'Cámara reversa'];

  return (
    <View>
      <Text style={styles.sectionTitle}>Características</Text>
      <View style={styles.featuresList}>
        {displayFeatures.map((feat: string, index: number) => (
          <View key={index} style={styles.featureChip}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  featureText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
  },
});
