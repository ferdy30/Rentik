import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleAdditionalInfoProps {
  color?: string;
  kilometraje?: number;
  condicion?: string;
  mileageLimit?: string;
  dailyKm?: number;
}

export default function VehicleAdditionalInfo({ 
  color, 
  kilometraje, 
  condicion, 
  mileageLimit,
  dailyKm 
}: VehicleAdditionalInfoProps) {
  // Si no hay ningún dato, no renderizar nada
  if (!color && !kilometraje && !condicion && mileageLimit !== 'limited') {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Información Adicional</Text>
        
        {color && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="color-palette" size={20} color="#6B7280" />
            </View>
            <Text style={styles.label}>Color</Text>
            <Text style={styles.value}>{color}</Text>
          </View>
        )}
        
        {kilometraje !== undefined && kilometraje !== null && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="speedometer" size={20} color="#6B7280" />
            </View>
            <Text style={styles.label}>Kilometraje</Text>
            <Text style={styles.value}>{kilometraje.toLocaleString()} km</Text>
          </View>
        )}
        
        {condicion && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={20} color="#6B7280" />
            </View>
            <Text style={styles.label}>Condición</Text>
            <Text style={styles.value}>{condicion}</Text>
          </View>
        )}
        
        {mileageLimit === 'limited' && dailyKm && (
          <View style={[styles.infoRow, styles.warningRow]}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.label}>Límite diario</Text>
            <Text style={[styles.value, styles.warningValue]}>{dailyKm} km/día</Text>
          </View>
        )}
      </View>
      <View style={styles.divider} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  warningRow: {
    borderBottomWidth: 0,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  warningValue: {
    color: '#F59E0B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
});
