import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Vehicle } from '../../types/vehicle';
import { ColorPicker } from '../ColorPicker';

interface EditInfoTabProps {
  vehicle: Vehicle;
  onSave: (data: Partial<Vehicle>) => Promise<void>;
  hasActiveReservations: boolean;
}

const TRANSMISSION_OPTIONS = ['Manual', 'Automático'];
const FUEL_OPTIONS = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
const CONDITION_OPTIONS = ['Excelente', 'Muy Bueno', 'Bueno', 'Regular'];

const FEATURES_OPTIONS = [
  { id: 'ac', label: 'Aire Acondicionado', icon: 'snow-outline' },
  { id: 'leather', label: 'Asientos de Cuero', icon: 'shirt-outline' },
  { id: 'sunroof', label: 'Sunroof / Quemacocos', icon: 'sunny-outline' },
  { id: 'heating', label: 'Calefacción', icon: 'flame-outline' },
  { id: 'thirdRow', label: 'Tercera Fila de Asientos', icon: 'people-outline' },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline' },
  { id: 'gps', label: 'GPS / Navegación', icon: 'navigate-outline' },
  { id: 'carplay', label: 'Apple CarPlay', icon: 'logo-apple' },
  { id: 'android', label: 'Android Auto', icon: 'logo-android' },
  { id: 'usb', label: 'Entrada USB / Aux', icon: 'musical-notes-outline' },
  { id: 'keyless', label: 'Entrada sin Llave', icon: 'key-outline' },
  { id: 'camera', label: 'Cámara de Reversa', icon: 'camera-outline' },
  { id: 'sensors', label: 'Sensores de Estacionamiento', icon: 'radio-outline' },
  { id: '4x4', label: '4x4 / AWD', icon: 'car-sport-outline' },
];

export default function EditInfoTab({ vehicle, onSave, hasActiveReservations }: EditInfoTabProps) {
  const [formData, setFormData] = useState({
    transmision: vehicle.transmision,
    combustible: vehicle.combustible,
    pasajeros: vehicle.pasajeros?.toString() || '',
    puertas: vehicle.puertas?.toString() || '',
    color: vehicle.color || '',
    kilometraje: vehicle.kilometraje?.toString() || '',
    condicion: vehicle.condicion || 'Muy Bueno',
    caracteristicas: vehicle.caracteristicas || [],
    descripcion: vehicle.descripcion || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validaciones
    if (!formData.transmision || !formData.combustible) {
      Alert.alert('Campos Requeridos', 'Por favor completa transmisión y combustible');
      return;
    }

    const pasajeros = parseInt(formData.pasajeros);
    const puertas = parseInt(formData.puertas);
    const kilometraje = parseInt(formData.kilometraje);

    if (isNaN(pasajeros) || pasajeros < 1 || pasajeros > 15) {
      Alert.alert('Error', 'Número de pasajeros inválido (1-15)');
      return;
    }

    if (isNaN(puertas) || puertas < 2 || puertas > 5) {
      Alert.alert('Error', 'Número de puertas inválido (2-5)');
      return;
    }

    if (formData.descripcion && formData.descripcion.length < 20) {
      Alert.alert('Error', 'La descripción debe tener al menos 20 caracteres');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        transmision: formData.transmision,
        combustible: formData.combustible,
        pasajeros,
        puertas,
        color: formData.color,
        kilometraje,
        condicion: formData.condicion,
        caracteristicas: formData.caracteristicas,
        descripcion: formData.descripcion,
      });
      Alert.alert('Éxito', 'Información actualizada correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(feature)
        ? prev.caracteristicas.filter(f => f !== feature)
        : [...prev.caracteristicas, feature],
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Transmisión */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transmisión</Text>
        <View style={styles.optionsRow}>
          {TRANSMISSION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.transmision === option && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, transmision: option })}
            >
              <Text style={[
                styles.optionText,
                formData.transmision === option && styles.optionTextActive,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Combustible */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Combustible</Text>
        <View style={styles.optionsGrid}>
          {FUEL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.gridOption,
                formData.combustible === option && styles.gridOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, combustible: option })}
            >
              <Text style={[
                styles.gridOptionText,
                formData.combustible === option && styles.gridOptionTextActive,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Capacidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacidad</Text>
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pasajeros</Text>
            <TextInput
              style={styles.input}
              value={formData.pasajeros}
              onChangeText={(text) => setFormData({ ...formData, pasajeros: text })}
              keyboardType="number-pad"
              placeholder="5"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Puertas</Text>
            <TextInput
              style={styles.input}
              value={formData.puertas}
              onChangeText={(text) => setFormData({ ...formData, puertas: text })}
              keyboardType="number-pad"
              placeholder="4"
            />
          </View>
        </View>
      </View>

      {/* Color */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <ColorPicker
          selectedColor={formData.color}
          onSelectColor={(color) => setFormData({ ...formData, color })}
        />
      </View>

      {/* Kilometraje y Condición */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kilometraje</Text>
        <TextInput
          style={styles.textInput}
          value={formData.kilometraje}
          onChangeText={(text) => setFormData({ ...formData, kilometraje: text })}
          keyboardType="number-pad"
          placeholder="50000"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condición</Text>
        <View style={styles.optionsGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.gridOption,
                formData.condicion === option && styles.gridOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, condicion: option })}
            >
              <Text style={[
                styles.gridOptionText,
                formData.condicion === option && styles.gridOptionTextActive,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Características */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Características</Text>
        <Text style={styles.sectionSubtitle}>
          {formData.caracteristicas.length} seleccionadas
        </Text>
        <View style={styles.featuresGrid}>
          {FEATURES_OPTIONS.map((feature) => {
            const isSelected = formData.caracteristicas.includes(feature.label);
            return (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureCard,
                  isSelected && styles.featureCardActive,
                ]}
                onPress={() => toggleFeature(feature.label)}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color={isSelected ? '#0B729D' : '#6B7280'}
                />
                <Text style={[
                  styles.featureText,
                  isSelected && styles.featureTextActive,
                ]}>
                  {feature.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color="#0B729D" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <TextInput
          style={styles.textArea}
          value={formData.descripcion}
          onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
          placeholder="Describe tu vehículo..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {formData.descripcion.length} / 500 caracteres
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
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#0B729D',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  gridOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  gridOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  gridOptionTextActive: {
    color: '#0B729D',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  featureCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BAE6FD',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  featureTextActive: {
    color: '#0B729D',
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
