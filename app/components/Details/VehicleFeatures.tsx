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
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#0B729D" />
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
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
});
