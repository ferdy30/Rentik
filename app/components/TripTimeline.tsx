import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TimelineStep {
  id: string;
  label: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TripTimelineProps {
  currentStatus: string;
  isRenter?: boolean; // true for arrendatario, false for arrendador
}

export default function TripTimeline({ currentStatus, isRenter = true }: TripTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const statusOrder = ['pending', 'confirmed', 'check-in', 'active', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return [
      {
        id: 'pending',
        label: isRenter ? 'Solicitado' : 'Recibida',
        icon: 'time-outline',
        status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'upcoming',
      },
      {
        id: 'confirmed',
        label: 'Confirmada',
        icon: 'checkmark-circle-outline',
        status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming',
      },
      {
        id: 'check-in',
        label: 'Check-in',
        icon: 'key-outline',
        status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming',
      },
      {
        id: 'active',
        label: 'En curso',
        icon: 'car-sport-outline',
        status: currentIndex > 3 ? 'completed' : currentIndex === 3 ? 'current' : 'upcoming',
      },
      {
        id: 'completed',
        label: 'Completado',
        icon: 'flag-outline',
        status: currentIndex >= 4 ? 'completed' : 'upcoming',
      },
    ];
  };

  const steps = getSteps();

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#16A34A';
      case 'current':
        return '#0B729D';
      case 'upcoming':
        return '#D1D5DB';
      default:
        return '#D1D5DB';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progreso del viaje</Text>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const color = getStepColor(step.status);
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepRow}>
                {/* Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: color }]}>
                  {step.status === 'completed' ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : step.status === 'current' ? (
                    <View style={styles.currentDot} />
                  ) : (
                    <Ionicons name={step.icon as any} size={18} color="#fff" />
                  )}
                </View>

                {/* Label */}
                <Text
                  style={[
                    styles.stepLabel,
                    step.status === 'current' && styles.stepLabelCurrent,
                    step.status === 'completed' && styles.stepLabelCompleted,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line */}
              {!isLast && (
                <View
                  style={[
                    styles.connectingLine,
                    {
                      backgroundColor:
                        step.status === 'completed' ? '#16A34A' : '#E5E7EB',
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  stepContainer: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stepLabelCurrent: {
    fontWeight: '700',
    color: '#0B729D',
  },
  stepLabelCompleted: {
    fontWeight: '600',
    color: '#16A34A',
  },
  connectingLine: {
    width: 2,
    height: 24,
    marginLeft: 17,
    marginTop: -4,
    marginBottom: -4,
  },
});
