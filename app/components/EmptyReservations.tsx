import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyReservationsProps {
  type: 'host' | 'renter';
  onAction?: () => void;
}

export default function EmptyReservations({ type, onAction }: EmptyReservationsProps) {
  const config = type === 'host' 
    ? {
        icon: 'car-sport-outline',
        title: 'No tienes solicitudes de reserva',
        subtitle: 'Las solicitudes que recibas aparecerán aquí',
        tips: [
          'Asegúrate de que tu vehículo tenga buenas fotos',
          'Mantén los precios competitivos',
          'Responde rápido a las solicitudes',
          'Completa toda la información del vehículo'
        ],
        actionText: 'Ver mis vehículos',
      }
    : {
        icon: 'map-outline',
        title: 'No tienes viajes reservados',
        subtitle: 'Explora vehículos disponibles y comienza tu aventura',
        tips: [
          'Busca por ubicación cercana para mejores precios',
          'Reserva con anticipación para más opciones',
          'Lee las reseñas de otros arrendatarios',
          'Verifica los requisitos del anfitrión'
        ],
        actionText: 'Explorar vehículos',
      };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon as any} size={80} color="#0B729D" />
      </View>
      
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Consejos:</Text>
        {config.tips.map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{config.actionText}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B729D',
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B729D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
