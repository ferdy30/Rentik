import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TimelineStep {
  id: string;
  label: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
}

interface TripTimelineProps {
  currentStatus: string;
  isRenter?: boolean; // true for arrendatario, false for arrendador
  checkInCompleted?: boolean; // Si el check-in fue completado
  checkOutCompleted?: boolean; // Si el check-out fue completado
}

export default function TripTimeline({ 
  currentStatus, 
  isRenter = true,
  checkInCompleted = false,
  checkOutCompleted = false
}: TripTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    // Determinar el progreso basado en el estado real
    let currentStep = 0;
    
    // 0: pending -> 1: confirmed -> 2: check-in -> 3: in-progress -> 4: check-out -> 5: completed
    if (currentStatus === 'pending') {
      currentStep = 0;
    } else if (currentStatus === 'confirmed' && !checkInCompleted) {
      currentStep = 1;
    } else if ((currentStatus === 'confirmed' && checkInCompleted) || currentStatus === 'in-progress') {
      if (!checkInCompleted) {
        currentStep = 2; // Esperando check-in
      } else if (!checkOutCompleted) {
        currentStep = 3; // Viaje en curso
      } else {
        currentStep = 4; // Check-out completado, esperando finalización
      }
    } else if (currentStatus === 'completed') {
      currentStep = 5;
    } else if (currentStatus === 'cancelled' || currentStatus === 'denied') {
      // Para reservas canceladas o denegadas, mostrar solo el primer paso
      currentStep = 0;
    }

    const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
      if (currentStatus === 'cancelled' || currentStatus === 'denied') {
        return stepIndex === 0 ? 'current' : 'upcoming';
      }
      if (stepIndex < currentStep) return 'completed';
      if (stepIndex === currentStep) return 'current';
      return 'upcoming';
    };

    return [
      {
        id: 'pending',
        label: isRenter ? 'Solicitado' : 'Solicitud recibida',
        icon: 'time-outline',
        status: getStepStatus(0),
        description: currentStatus === 'pending' ? 'Esperando confirmación' : undefined,
      },
      {
        id: 'confirmed',
        label: 'Reserva confirmada',
        icon: 'checkmark-circle-outline',
        status: getStepStatus(1),
        description: currentStep === 1 ? 'Esperando fecha de inicio' : undefined,
      },
      {
        id: 'check-in',
        label: 'Check-in realizado',
        icon: 'key-outline',
        status: getStepStatus(2),
        description: currentStep === 2 ? 'Inspección del vehículo' : undefined,
      },
      {
        id: 'in-progress',
        label: 'Viaje en curso',
        icon: 'car-sport-outline',
        status: getStepStatus(3),
        description: currentStep === 3 ? '¡Disfruta tu viaje!' : undefined,
      },
      {
        id: 'check-out',
        label: 'Check-out',
        icon: 'log-out-outline',
        status: getStepStatus(4),
        description: currentStep === 4 ? 'Devolución del vehículo' : undefined,
      },
      {
        id: 'completed',
        label: 'Completado',
        icon: 'flag-outline',
        status: getStepStatus(5),
        description: currentStep === 5 ? '¡Viaje exitoso!' : undefined,
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
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.status === 'current' && styles.stepLabelCurrent,
                      step.status === 'completed' && styles.stepLabelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.description && step.status === 'current' && (
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  )}
                </View>
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
  labelContainer: {
    flex: 1,
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
  stepDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  connectingLine: {
    width: 2,
    height: 24,
    marginLeft: 17,
    marginTop: -4,
    marginBottom: -4,
  },
});
