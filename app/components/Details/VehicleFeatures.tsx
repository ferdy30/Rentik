import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleFeaturesProps {
  features: string[];
}

const getFeatureIcon = (feature: string): keyof typeof Ionicons.glyphMap => {
  const feat = feature.toLowerCase();
  if (feat.includes('aire') || feat.includes('ac')) return 'snow-outline';
  if (feat.includes('cuero') || feat.includes('asiento')) return 'shirt-outline';
  if (feat.includes('sunroof') || feat.includes('quemacocos')) return 'sunny-outline';
  if (feat.includes('calefact')) return 'flame-outline';
  if (feat.includes('tercera') || feat.includes('fila')) return 'people-outline';
  if (feat.includes('bluetooth')) return 'bluetooth-outline';
  if (feat.includes('gps') || feat.includes('navegación')) return 'navigate-outline';
  if (feat.includes('carplay') || feat.includes('apple')) return 'logo-apple';
  if (feat.includes('android')) return 'logo-android';
  if (feat.includes('usb') || feat.includes('aux')) return 'musical-notes-outline';
  if (feat.includes('llave') || feat.includes('keyless')) return 'key-outline';
  if (feat.includes('cámara') || feat.includes('camera')) return 'camera-outline';
  if (feat.includes('sensor')) return 'radio-outline';
  if (feat.includes('4x4') || feat.includes('awd')) return 'car-sport-outline';
  return 'checkmark-circle';
};

const getFeatureCategory = (feature: string): 'comfort' | 'tech' | 'safety' => {
  const feat = feature.toLowerCase();
  if (feat.includes('aire') || feat.includes('cuero') || feat.includes('sunroof') || feat.includes('calefact') || feat.includes('tercera')) return 'comfort';
  if (feat.includes('bluetooth') || feat.includes('gps') || feat.includes('carplay') || feat.includes('android') || feat.includes('usb') || feat.includes('llave')) return 'tech';
  return 'safety';
};

export default function VehicleFeatures({ features }: VehicleFeaturesProps) {
  if (!features || features.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={24} color="#9CA3AF" />
          <Text style={styles.emptyText}>Sin características especificadas</Text>
        </View>
      </View>
    );
  }

  const categorizedFeatures = {
    comfort: features.filter(f => getFeatureCategory(f) === 'comfort'),
    tech: features.filter(f => getFeatureCategory(f) === 'tech'),
    safety: features.filter(f => getFeatureCategory(f) === 'safety'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star-outline" size={24} color="#0B729D" />
        <Text style={styles.sectionTitle}>Características</Text>
      </View>

      {/* Grid de características */}
      <View style={styles.featuresGrid}>
        {features.map((feat: string, index: number) => {
          const category = getFeatureCategory(feat);
          return (
            <View 
              key={index} 
              style={[
                styles.featureCard,
                category === 'comfort' && styles.comfortCard,
                category === 'tech' && styles.techCard,
                category === 'safety' && styles.safetyCard,
              ]}
            >
              <View style={[
                styles.iconContainer,
                category === 'comfort' && styles.comfortIcon,
                category === 'tech' && styles.techIcon,
                category === 'safety' && styles.safetyIcon,
              ]}>
                <Ionicons 
                  name={getFeatureIcon(feat)} 
                  size={20} 
                  color={
                    category === 'comfort' ? '#0B729D' :
                    category === 'tech' ? '#8B5CF6' :
                    '#10B981'
                  }
                />
              </View>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          );
        })}
      </View>

      {/* Badge con total de características */}
      <View style={styles.badge}>
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
        <Text style={styles.badgeText}>{features.length} características incluidas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comfortCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  techCard: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  safetyCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comfortIcon: {
    backgroundColor: '#E0F2FE',
  },
  techIcon: {
    backgroundColor: '#EDE9FE',
  },
  safetyIcon: {
    backgroundColor: '#DCFCE7',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
