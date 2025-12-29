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
import LocationPicker from '../LocationPicker';

interface EditPriceTabProps {
  vehicle: Vehicle;
  onSave: (data: Partial<Vehicle>) => Promise<void>;
}

export default function EditPriceTab({ vehicle, onSave }: EditPriceTabProps) {
  const [formData, setFormData] = useState({
    precio: vehicle.precio?.toString() || '',
    weeklyDiscount: vehicle.discounts?.weekly?.toString() || '0',
    monthlyDiscount: vehicle.discounts?.monthly?.toString() || '0',
    ubicacion: vehicle.ubicacion || '',
    coordinates: vehicle.coordinates || null,
    dailyKm: vehicle.dailyKm?.toString() || '',
    mileageLimit: vehicle.mileageLimit || 'unlimited',
  });

  const [saving, setSaving] = useState(false);

  const handleLocationSelected = (location: { address: string; coordinates: { latitude: number; longitude: number } }) => {
    setFormData({
      ...formData,
      ubicacion: location.address,
      coordinates: location.coordinates,
    });
  };

  const handleSave = async () => {
    const precio = parseFloat(formData.precio);
    const weeklyDiscount = parseInt(formData.weeklyDiscount);
    const monthlyDiscount = parseInt(formData.monthlyDiscount);
    const dailyKm = formData.dailyKm ? parseInt(formData.dailyKm) : undefined;

    // Validaciones
    if (isNaN(precio) || precio < 10) {
      Alert.alert('Error', 'El precio debe ser al menos $10');
      return;
    }

    if (isNaN(weeklyDiscount) || weeklyDiscount < 0 || weeklyDiscount > 50) {
      Alert.alert('Error', 'El descuento semanal debe estar entre 0% y 50%');
      return;
    }

    if (isNaN(monthlyDiscount) || monthlyDiscount < 0 || monthlyDiscount > 50) {
      Alert.alert('Error', 'El descuento mensual debe estar entre 0% y 50%');
      return;
    }

    if (!formData.ubicacion || !formData.coordinates) {
      Alert.alert('Ubicación Requerida', 'Por favor selecciona la ubicación del vehículo');
      return;
    }

    if (formData.mileageLimit === 'limited' && (!dailyKm || dailyKm < 50)) {
      Alert.alert('Error', 'Si limitas el kilometraje, debe ser al menos 50 km/día');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        precio,
        discounts: {
          weekly: weeklyDiscount,
          monthly: monthlyDiscount,
        },
        ubicacion: formData.ubicacion,
        coordinates: formData.coordinates,
        mileageLimit: formData.mileageLimit as 'unlimited' | 'limited',
        dailyKm: formData.mileageLimit === 'limited' ? dailyKm : undefined,
      });
      Alert.alert('Éxito', 'Precio y ubicación actualizados');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Precio Base */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Precio por Día</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={formData.precio}
            onChangeText={(text) => setFormData({ ...formData, precio: text })}
            keyboardType="decimal-pad"
            placeholder="50"
          />
          <Text style={styles.priceUnit}>/ día</Text>
        </View>
        <Text style={styles.helperText}>
          Precio sugerido basado en vehículos similares: $45-$65/día
        </Text>
      </View>

      {/* Descuentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descuentos</Text>
        <Text style={styles.sectionSubtitle}>
          Atrae reservas más largas ofreciendo descuentos
        </Text>

        <View style={styles.discountCard}>
          <View style={styles.discountHeader}>
            <Ionicons name="calendar-outline" size={20} color="#0B729D" />
            <Text style={styles.discountLabel}>Descuento Semanal (7+ días)</Text>
          </View>
          <View style={styles.discountInputContainer}>
            <TextInput
              style={styles.discountInput}
              value={formData.weeklyDiscount}
              onChangeText={(text) => setFormData({ ...formData, weeklyDiscount: text })}
              keyboardType="number-pad"
              placeholder="10"
              maxLength={2}
            />
            <Text style={styles.percentSymbol}>%</Text>
          </View>
        </View>

        <View style={styles.discountCard}>
          <View style={styles.discountHeader}>
            <Ionicons name="calendar" size={20} color="#0B729D" />
            <Text style={styles.discountLabel}>Descuento Mensual (28+ días)</Text>
          </View>
          <View style={styles.discountInputContainer}>
            <TextInput
              style={styles.discountInput}
              value={formData.monthlyDiscount}
              onChangeText={(text) => setFormData({ ...formData, monthlyDiscount: text })}
              keyboardType="number-pad"
              placeholder="20"
              maxLength={2}
            />
            <Text style={styles.percentSymbol}>%</Text>
          </View>
        </View>

        {/* Preview */}
        {(parseInt(formData.weeklyDiscount) > 0 || parseInt(formData.monthlyDiscount) > 0) && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Vista Previa de Precios</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>1 día:</Text>
              <Text style={styles.previewValue}>${formData.precio}</Text>
            </View>
            {parseInt(formData.weeklyDiscount) > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>7 días:</Text>
                <View style={styles.previewPriceContainer}>
                  <Text style={styles.previewOriginal}>
                    ${(parseFloat(formData.precio) * 7).toFixed(2)}
                  </Text>
                  <Text style={styles.previewDiscounted}>
                    ${(parseFloat(formData.precio) * 7 * (1 - parseInt(formData.weeklyDiscount) / 100)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            {parseInt(formData.monthlyDiscount) > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>30 días:</Text>
                <View style={styles.previewPriceContainer}>
                  <Text style={styles.previewOriginal}>
                    ${(parseFloat(formData.precio) * 30).toFixed(2)}
                  </Text>
                  <Text style={styles.previewDiscounted}>
                    ${(parseFloat(formData.precio) * 30 * (1 - parseInt(formData.monthlyDiscount) / 100)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Límite de Kilometraje */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Límite de Kilometraje</Text>
        
        <TouchableOpacity
          style={[
            styles.optionCard,
            formData.mileageLimit === 'unlimited' && styles.optionCardActive,
          ]}
          onPress={() => setFormData({ ...formData, mileageLimit: 'unlimited' })}
        >
          <View style={styles.radioButton}>
            {formData.mileageLimit === 'unlimited' && <View style={styles.radioButtonInner} />}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Kilometraje Ilimitado</Text>
            <Text style={styles.optionDescription}>Sin restricciones de distancia</Text>
          </View>
          <Ionicons name="infinite" size={24} color="#10B981" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            formData.mileageLimit === 'limited' && styles.optionCardActive,
          ]}
          onPress={() => setFormData({ ...formData, mileageLimit: 'limited' })}
        >
          <View style={styles.radioButton}>
            {formData.mileageLimit === 'limited' && <View style={styles.radioButtonInner} />}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Kilometraje Limitado</Text>
            <Text style={styles.optionDescription}>Establece un límite diario</Text>
          </View>
          <Ionicons name="speedometer" size={24} color="#F59E0B" />
        </TouchableOpacity>

        {formData.mileageLimit === 'limited' && (
          <View style={styles.kmInputCard}>
            <Text style={styles.kmLabel}>Kilómetros por día</Text>
            <View style={styles.kmInputContainer}>
              <TextInput
                style={styles.kmInput}
                value={formData.dailyKm}
                onChangeText={(text) => setFormData({ ...formData, dailyKm: text })}
                keyboardType="number-pad"
                placeholder="200"
              />
              <Text style={styles.kmUnit}>km/día</Text>
            </View>
            <Text style={styles.kmHelper}>
              Cargo extra: $0.50 por km adicional
            </Text>
          </View>
        )}
      </View>

      {/* Ubicación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación del Vehículo</Text>
        <LocationPicker
          onLocationSelected={handleLocationSelected}
          initialLocation={
            formData.ubicacion && formData.coordinates
              ? { address: formData.ubicacion, coordinates: formData.coordinates, placeId: '' }
              : undefined
          }
        />
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
  priceInputContainer: {
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
  priceInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  priceUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  discountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  discountInput: {
    width: 50,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  percentSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#047857',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  previewPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewOriginal: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  previewDiscounted: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  optionCard: {
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
  optionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
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
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  kmInputCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  kmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  kmInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  kmInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  kmUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  kmHelper: {
    fontSize: 12,
    color: '#B45309',
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
