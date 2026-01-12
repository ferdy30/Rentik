import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  tips: string[];
  warning?: string;
}

interface InteractiveGuideProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  currentStep: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'start',
    title: 'Ubicación y Encuentro',
    description: 'Verifica que estés en el lugar correcto para el check-in',
    icon: 'location',
    tips: [
      'Activa el GPS para mejor precisión',
      'Confirma la dirección con el arrendador',
      'Llega 5-10 minutos antes de la hora acordada',
    ],
    warning: 'Ambas partes deben estar presentes en el mismo lugar',
  },
  {
    id: 'photos',
    title: 'Fotografías del Vehículo',
    description: 'Documenta el estado actual del vehículo con fotos claras',
    icon: 'camera',
    tips: [
      'Toma fotos con buena iluminación',
      'Captura todos los ángulos requeridos',
      'Enfoca en daños existentes',
      'Asegúrate que las fotos no estén borrosas',
    ],
    warning: 'Las fotos son evidencia legal del estado del vehículo',
  },
  {
    id: 'conditions',
    title: 'Condiciones del Vehículo',
    description: 'Registra el kilometraje, combustible y estado general',
    icon: 'clipboard',
    tips: [
      'Verifica el odómetro y toma foto',
      'Confirma nivel de combustible con foto',
      'Revisa limpieza interior y exterior',
      'Prueba luces y funciones básicas',
    ],
  },
  {
    id: 'damages',
    title: 'Reporte de Daños',
    description: 'Documenta cualquier daño visible en el vehículo',
    icon: 'warning',
    tips: [
      'Revisa daños previos reportados',
      'Fotografía cualquier daño nuevo',
      'Sé específico en la ubicación del daño',
      'Indica la severidad correctamente',
    ],
    warning: 'Reporta TODOS los daños para evitar responsabilidades futuras',
  },
  {
    id: 'keys',
    title: 'Entrega de Llaves',
    description: 'Confirma la recepción de llaves y accesorios',
    icon: 'key',
    tips: [
      'Cuenta todas las llaves recibidas',
      'Prueba que funcionan correctamente',
      'Verifica control remoto y alarma',
      'Confirma accesorios incluidos',
    ],
  },
  {
    id: 'signature',
    title: 'Firma Digital',
    description: 'Firma para confirmar que todo es correcto',
    icon: 'create',
    tips: [
      'Revisa todos los datos antes de firmar',
      'Firma de forma clara y legible',
      'Conserva una copia del check-in',
    ],
    warning: 'Tu firma confirma que aceptas el estado documentado',
  },
  {
    id: 'complete',
    title: '¡Check-In Completo!',
    description: 'Has completado exitosamente el proceso de check-in',
    icon: 'checkmark-done-circle',
    tips: [
      'Recibirás una copia del check-in por email',
      'Puedes consultar los detalles en cualquier momento',
      'Disfruta tu viaje con responsabilidad',
    ],
  },
];

export default function InteractiveGuide({
  visible,
  onClose,
  onComplete,
  currentStep,
}: InteractiveGuideProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const currentStepData = GUIDE_STEPS[activeStepIndex];

  const handleNext = () => {
    if (activeStepIndex < GUIDE_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const progress = ((activeStepIndex + 1) / GUIDE_STEPS.length) * 100;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guía de Check-In</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Paso {activeStepIndex + 1} de {GUIDE_STEPS.length}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={currentStepData.icon as any} size={48} color="#0B729D" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>

          {/* Warning */}
          {currentStepData.warning && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>{currentStepData.warning}</Text>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Consejos Útiles</Text>
            {currentStepData.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Step indicators */}
          <View style={styles.stepsIndicator}>
            {GUIDE_STEPS.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepDot,
                  index === activeStepIndex && styles.stepDotActive,
                  index < activeStepIndex && styles.stepDotCompleted,
                ]}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={activeStepIndex === 0}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={activeStepIndex === 0 ? '#9CA3AF' : '#0B729D'}
            />
            <Text
              style={[
                styles.buttonText,
                styles.buttonTextSecondary,
                activeStepIndex === 0 && styles.buttonTextDisabled,
              ]}
            >
              Anterior
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={[styles.button, styles.buttonPrimary]}>
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
              {activeStepIndex === GUIDE_STEPS.length - 1 ? 'Entendido' : 'Siguiente'}
            </Text>
            {activeStepIndex !== GUIDE_STEPS.length - 1 && (
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0B729D',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B729D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: '#0B729D',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: '#0B729D',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
    marginRight: 6,
  },
  buttonTextSecondary: {
    color: '#0B729D',
    marginLeft: 6,
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
});
