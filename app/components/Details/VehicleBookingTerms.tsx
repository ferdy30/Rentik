import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VehicleBookingTermsProps {
  deposit?: number;
  advanceNotice?: number;
  minTripDuration?: number;
  maxTripDuration?: number;
  protectionPlan?: string;
}

export default function VehicleBookingTerms({ 
  deposit, 
  advanceNotice, 
  minTripDuration, 
  maxTripDuration,
  protectionPlan 
}: VehicleBookingTermsProps) {
  // Si no hay términos definidos, no mostrar nada
  if (!deposit && !advanceNotice && !minTripDuration && !protectionPlan) {
    return null;
  }

  const getProtectionPlanLabel = (plan?: string) => {
    switch(plan) {
      case 'basic': return 'Básico';
      case 'standard': return 'Estándar';
      case 'premium': return 'Premium';
      default: return 'Estándar';
    }
  };

  const getProtectionPlanColor = (plan?: string) => {
    switch(plan) {
      case 'basic': return '#10B981';
      case 'premium': return '#F59E0B';
      default: return '#0B729D';
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Términos de Reserva</Text>
        
        {deposit !== undefined && deposit > 0 && (
          <View style={styles.termRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
            </View>
            <View style={styles.termContent}>
              <Text style={styles.termLabel}>Depósito requerido</Text>
              <Text style={styles.termValue}>${deposit}</Text>
            </View>
          </View>
        )}
        
        {advanceNotice !== undefined && advanceNotice > 0 && (
          <View style={styles.termRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="time-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.termContent}>
              <Text style={styles.termLabel}>Aviso anticipado</Text>
              <Text style={styles.termValue}>{advanceNotice} horas</Text>
            </View>
          </View>
        )}
        
        {(minTripDuration !== undefined || maxTripDuration !== undefined) && (
          <View style={styles.termRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.termContent}>
              <Text style={styles.termLabel}>Duración del viaje</Text>
              <Text style={styles.termValue}>
                {minTripDuration && `Mín: ${minTripDuration} día${minTripDuration > 1 ? 's' : ''}`}
                {minTripDuration && maxTripDuration && ' • '}
                {maxTripDuration && `Máx: ${maxTripDuration} días`}
              </Text>
            </View>
          </View>
        )}
        
        {protectionPlan && (
          <View style={styles.termRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="umbrella-outline" size={20} color={getProtectionPlanColor(protectionPlan)} />
            </View>
            <View style={styles.termContent}>
              <Text style={styles.termLabel}>Plan de protección</Text>
              <Text style={[styles.termValue, { color: getProtectionPlanColor(protectionPlan) }]}>
                {getProtectionPlanLabel(protectionPlan)}
              </Text>
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
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  termContent: {
    flex: 1,
  },
  termLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  termValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
});
