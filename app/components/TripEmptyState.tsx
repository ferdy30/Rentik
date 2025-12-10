import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TripEmptyStateProps {
  hasReservations: boolean;
  onSearchVehicles?: () => void;
}

export default function TripEmptyState({ hasReservations, onSearchVehicles }: TripEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="car-sport-outline" size={64} color="#0B729D" />
      </View>
      <Text style={styles.title}>
        {hasReservations 
          ? 'No hay viajes aquí' 
          : '¡Empieza tu aventura!'}
      </Text>
      <Text style={styles.subtitle}>
        {hasReservations 
          ? 'Prueba con otro filtro para ver más viajes.' 
          : 'Renta un vehículo y descubre nuevos lugares.'}
      </Text>
      {!hasReservations && onSearchVehicles && (
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={onSearchVehicles}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.ctaText}>Buscar Vehículos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B729D',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
