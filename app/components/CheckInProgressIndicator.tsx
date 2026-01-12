import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CheckInStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

interface CheckInProgressIndicatorProps {
  currentStep: number; // 0-7
  steps?: CheckInStep[];
}

const DEFAULT_STEPS = [
  { id: 'start', title: 'Inicio', icon: 'location' },
  { id: 'photos', title: 'Fotos', icon: 'camera' },
  { id: 'conditions', title: 'Condiciones', icon: 'checkmark-circle' },
  { id: 'damages', title: 'Daños', icon: 'alert-circle' },
  { id: 'keys', title: 'Llaves', icon: 'key' },
  { id: 'signature', title: 'Firma', icon: 'create' },
  { id: 'complete', title: 'Completo', icon: 'checkmark-done' },
];

export default function CheckInProgressIndicator({ currentStep, steps }: CheckInProgressIndicatorProps) {
  const totalSteps = steps?.length || DEFAULT_STEPS.length;
  const progress = ((currentStep) / (totalSteps - 1)) * 100;

  return (
    <View style={styles.container}>
      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}% Completado
        </Text>
      </View>

      {/* Indicadores de pasos */}
      <View style={styles.stepsContainer}>
        {DEFAULT_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              {/* Línea de conexión */}
              {index > 0 && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted ? styles.stepLineCompleted : styles.stepLinePending,
                  ]}
                />
              )}

              {/* Círculo del paso */}
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isCurrent && styles.stepCircleCurrent,
                  isPending && styles.stepCirclePending,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon as any}
                    size={16}
                    color={isCurrent ? '#0B729D' : '#9CA3AF'}
                  />
                )}
              </View>

              {/* Título del paso */}
              <Text
                style={[
                  styles.stepTitle,
                  isCompleted && styles.stepTitleCompleted,
                  isCurrent && styles.stepTitleCurrent,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '-50%',
    right: '50%',
    height: 2,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepLinePending: {
    backgroundColor: '#E5E7EB',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#fff',
    borderColor: '#0B729D',
    borderWidth: 3,
  },
  stepCirclePending: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  stepTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepTitleCompleted: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepTitleCurrent: {
    color: '#0B729D',
    fontWeight: '700',
  },
});
