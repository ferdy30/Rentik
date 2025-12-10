import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReservationEmptyStateProps {
  type: 'requests' | 'upcoming' | 'history';
  onAction?: () => void;
}

export default function ReservationEmptyState({ type, onAction }: ReservationEmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'requests':
        return {
          icon: 'notifications-outline' as const,
          iconColor: '#0B729D',
          iconBg: '#E0F2F7',
          title: 'Sin solicitudes pendientes',
          subtitle: 'Cuando recibas nuevas solicitudes de renta aparecerán aquí.',
          cta: 'Promocionar mis vehículos',
          showCTA: true,
        };
      case 'upcoming':
        return {
          icon: 'calendar-outline' as const,
          iconColor: '#16A34A',
          iconBg: '#DCFCE7',
          title: 'No hay reservas activas',
          subtitle: 'Tus próximas reservas confirmadas y en curso aparecerán aquí.',
          cta: null,
          showCTA: false,
        };
      case 'history':
        return {
          icon: 'time-outline' as const,
          iconColor: '#757575',
          iconBg: '#FAFAFA',
          title: 'Sin historial de reservas',
          subtitle: 'El historial de reservas completadas y canceladas aparecerá aquí.',
          cta: null,
          showCTA: false,
        };
      default:
        return {
          icon: 'help-circle-outline' as const,
          iconColor: '#757575',
          iconBg: '#FAFAFA',
          title: 'Sin reservas',
          subtitle: 'No hay reservas disponibles.',
          cta: null,
          showCTA: false,
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: content.iconBg }]}>
        <Ionicons name={content.icon} size={48} color={content.iconColor} />
      </View>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.subtitle}>{content.subtitle}</Text>
      
      {content.showCTA && content.cta && onAction && (
        <TouchableOpacity style={styles.ctaButton} onPress={onAction} activeOpacity={0.7}>
          <Ionicons name="megaphone-outline" size={18} color="#fff" />
          <Text style={styles.ctaText}>{content.cta}</Text>
        </TouchableOpacity>
      )}

      {type === 'requests' && (
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <View style={styles.tipIconCircle}>
              <Ionicons name="flash" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.tipText}>Responde rápido para aumentar reservas</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipIconCircle}>
              <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
            </View>
            <Text style={styles.tipText}>Revisa el perfil del arrendatario</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  tipsContainer: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  tipIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
});
