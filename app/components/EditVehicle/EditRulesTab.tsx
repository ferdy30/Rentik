import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Vehicle } from '../../types/vehicle';

interface EditRulesTabProps {
  vehicle: Vehicle;
  onSave: (data: Partial<Vehicle>) => Promise<void>;
}

const PROTECTION_PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Cobertura estándar incluida',
    deposit: 500,
    icon: 'shield-outline' as const,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Cobertura extendida con franquicia reducida',
    deposit: 300,
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'full',
    name: 'Full',
    description: 'Cobertura total sin franquicia',
    deposit: 100,
    icon: 'shield' as const,
  },
];

export default function EditRulesTab({ vehicle, onSave }: EditRulesTabProps) {
  const [formData, setFormData] = useState({
    allowPets: vehicle.rules?.allowPets ?? false,
    allowSmoking: vehicle.rules?.allowSmoking ?? false,
    allowLongTrips: vehicle.rules?.allowLongTrips ?? true,
    deposit: vehicle.deposit?.toString() || '500',
    advanceNotice: vehicle.advanceNotice?.toString() || '24',
    minTripDuration: vehicle.minTripDuration?.toString() || '1',
    maxTripDuration: vehicle.maxTripDuration?.toString() || '30',
    protectionPlan: vehicle.protectionPlan || 'basic',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const deposit = parseInt(formData.deposit);
    const advanceNotice = parseInt(formData.advanceNotice);
    const minTripDuration = parseInt(formData.minTripDuration);
    const maxTripDuration = parseInt(formData.maxTripDuration);

    // Validaciones
    if (isNaN(deposit) || deposit < 100) {
      Alert.alert('Error', 'El depósito debe ser al menos $100');
      return;
    }

    if (isNaN(advanceNotice) || advanceNotice < 1 || advanceNotice > 168) {
      Alert.alert('Error', 'El aviso previo debe estar entre 1 y 168 horas (7 días)');
      return;
    }

    if (isNaN(minTripDuration) || minTripDuration < 1) {
      Alert.alert('Error', 'La duración mínima debe ser al menos 1 día');
      return;
    }

    if (isNaN(maxTripDuration) || maxTripDuration < minTripDuration) {
      Alert.alert('Error', 'La duración máxima debe ser mayor que la mínima');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        rules: {
          allowPets: formData.allowPets,
          allowSmoking: formData.allowSmoking,
          allowLongTrips: formData.allowLongTrips,
        },
        deposit,
        advanceNotice,
        minTripDuration,
        maxTripDuration,
        protectionPlan: formData.protectionPlan as 'basic' | 'premium' | 'full',
      });
      Alert.alert('Éxito', 'Reglas actualizadas');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Reglas del Vehículo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reglas del Vehículo</Text>
        <Text style={styles.sectionSubtitle}>
          Define qué está permitido durante el viaje
        </Text>

        <View style={styles.ruleCard}>
          <View style={styles.ruleIcon}>
            <Ionicons name="paw" size={24} color={formData.allowPets ? '#10B981' : '#9CA3AF'} />
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Permitir Mascotas</Text>
            <Text style={styles.ruleDescription}>
              Los arrendatarios pueden viajar con mascotas
            </Text>
          </View>
          <Switch
            value={formData.allowPets}
            onValueChange={(value) => setFormData({ ...formData, allowPets: value })}
            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
            thumbColor={formData.allowPets ? '#10B981' : '#9CA3AF'}
          />
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleIcon}>
            <Ionicons
              name="ban"
              size={24}
              color={formData.allowSmoking ? '#EF4444' : '#9CA3AF'}
            />
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Permitir Fumar</Text>
            <Text style={styles.ruleDescription}>
              Se permite fumar dentro del vehículo
            </Text>
          </View>
          <Switch
            value={formData.allowSmoking}
            onValueChange={(value) => setFormData({ ...formData, allowSmoking: value })}
            trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
            thumbColor={formData.allowSmoking ? '#EF4444' : '#9CA3AF'}
          />
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleIcon}>
            <Ionicons
              name="compass"
              size={24}
              color={formData.allowLongTrips ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Viajes Largos</Text>
            <Text style={styles.ruleDescription}>
              Permitir viajes a otras ciudades o estados
            </Text>
          </View>
          <Switch
            value={formData.allowLongTrips}
            onValueChange={(value) => setFormData({ ...formData, allowLongTrips: value })}
            trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
            thumbColor={formData.allowLongTrips ? '#3B82F6' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Plan de Protección */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan de Protección</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona el nivel de cobertura y depósito requerido
        </Text>

        {PROTECTION_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              formData.protectionPlan === plan.id && styles.planCardActive,
            ]}
            onPress={() => setFormData({ ...formData, protectionPlan: plan.id })}
          >
            <View style={styles.planIcon}>
              <Ionicons
                name={plan.icon}
                size={28}
                color={formData.protectionPlan === plan.id ? '#0B729D' : '#6B7280'}
              />
            </View>
            <View style={styles.planContent}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
              <Text style={styles.planDeposit}>Depósito: ${plan.deposit}</Text>
            </View>
            <View style={styles.radioButton}>
              {formData.protectionPlan === plan.id && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Depósito Personalizado */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Depósito de Seguridad</Text>
        <Text style={styles.sectionSubtitle}>
          Monto retenido durante el viaje (reembolsable)
        </Text>
        
        <View style={styles.depositInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.depositInput}
            value={formData.deposit}
            onChangeText={(text) => setFormData({ ...formData, deposit: text })}
            keyboardType="number-pad"
            placeholder="500"
          />
        </View>
        <Text style={styles.helperText}>
          Recomendado: ${PROTECTION_PLANS.find(p => p.id === formData.protectionPlan)?.deposit || 500}
        </Text>
      </View>

      {/* Aviso Previo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aviso Previo</Text>
        <Text style={styles.sectionSubtitle}>
          Tiempo mínimo antes del inicio del viaje
        </Text>

        <View style={styles.noticeGrid}>
          {['1', '3', '6', '12', '24', '48'].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.noticeOption,
                formData.advanceNotice === hours && styles.noticeOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, advanceNotice: hours })}
            >
              <Text
                style={[
                  styles.noticeOptionText,
                  formData.advanceNotice === hours && styles.noticeOptionTextActive,
                ]}
              >
                {hours}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duración del Viaje */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duración del Viaje</Text>
        
        <View style={styles.durationRow}>
          <View style={styles.durationInput}>
            <Text style={styles.durationLabel}>Mínimo</Text>
            <View style={styles.durationInputContainer}>
              <TextInput
                style={styles.durationValue}
                value={formData.minTripDuration}
                onChangeText={(text) => setFormData({ ...formData, minTripDuration: text })}
                keyboardType="number-pad"
                placeholder="1"
              />
              <Text style={styles.durationUnit}>días</Text>
            </View>
          </View>

          <View style={styles.durationSeparator}>
            <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
          </View>

          <View style={styles.durationInput}>
            <Text style={styles.durationLabel}>Máximo</Text>
            <View style={styles.durationInputContainer}>
              <TextInput
                style={styles.durationValue}
                value={formData.maxTripDuration}
                onChangeText={(text) => setFormData({ ...formData, maxTripDuration: text })}
                keyboardType="number-pad"
                placeholder="30"
              />
              <Text style={styles.durationUnit}>días</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Las reglas claras ayudan a evitar malentendidos. Los arrendatarios pueden filtrar por estas preferencias.
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <Text style={styles.saveButtonText}>Guardando...</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  ruleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  ruleDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  planCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  planDeposit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B729D',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B729D',
  },
  depositInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B729D',
    marginRight: 8,
  },
  depositInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  noticeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noticeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  noticeOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  noticeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  noticeOptionTextActive: {
    color: '#0B729D',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationInput: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  durationValue: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  durationSeparator: {
    marginTop: 24,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0B729D',
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
