import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleDeliveryOptionsProps {
  flexibleHours?: boolean;
  deliveryHours?: {
    start: string;
    end: string;
  };
  airportDelivery?: boolean;
  airportFee?: number;
}

export default function VehicleDeliveryOptions({ 
  flexibleHours, 
  deliveryHours, 
  airportDelivery,
  airportFee 
}: VehicleDeliveryOptionsProps) {
  // Si no hay opciones de entrega, no mostrar nada
  if (!flexibleHours && !deliveryHours && !airportDelivery) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Opciones de Entrega</Text>
        
        {flexibleHours !== undefined && (
          <View style={styles.optionRow}>
            <View style={[styles.iconContainer, { backgroundColor: flexibleHours ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons 
                name={flexibleHours ? "time" : "time-outline"} 
                size={20} 
                color={flexibleHours ? '#16A34A' : '#DC2626'} 
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Horarios flexibles</Text>
              <Text style={[styles.optionValue, { color: flexibleHours ? '#16A34A' : '#6B7280' }]}>
                {flexibleHours ? 'Disponible 24/7' : 'Horarios específicos'}
              </Text>
            </View>
          </View>
        )}
        
        {!flexibleHours && deliveryHours && (
          <View style={styles.optionRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="alarm-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Horario de entrega</Text>
              <Text style={styles.optionValue}>
                {deliveryHours.start} - {deliveryHours.end}
              </Text>
            </View>
          </View>
        )}
        
        {airportDelivery !== undefined && (
          <View style={styles.optionRow}>
            <View style={[styles.iconContainer, { backgroundColor: airportDelivery ? '#EFF6FF' : '#F3F4F6' }]}>
              <Ionicons 
                name="airplane" 
                size={20} 
                color={airportDelivery ? '#0B729D' : '#9CA3AF'} 
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Entrega en aeropuerto</Text>
              <View style={styles.airportInfo}>
                <Text style={[styles.optionValue, { color: airportDelivery ? '#0B729D' : '#6B7280' }]}>
                  {airportDelivery ? 'Disponible' : 'No disponible'}
                </Text>
                {airportDelivery && airportFee && airportFee > 0 && (
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeText}>+${airportFee}</Text>
                  </View>
                )}
              </View>
            </View>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  optionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  airportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeBadge: {
    backgroundColor: '#0B729D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
});
