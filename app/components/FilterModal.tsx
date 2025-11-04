import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../constants/colors';
import { FEATURES, FUEL_TYPES, TRANSMISION_TYPES, VEHICLE_TYPES } from '../constants/vehicles';

export interface FilterOptions {
  priceRange: [number, number];
  vehicleTypes: string[];
  transmision: string[];
  fuelTypes: string[];
  yearRange: [number, number];
  features: string[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      priceRange: [0, 100],
      vehicleTypes: [],
      transmision: [],
      fuelTypes: [],
      yearRange: [2015, 2025],
      features: [],
    };
    setFilters(resetFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#032B3C" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Precio por día</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Mín</Text>
                  <Text style={styles.priceValue}>${filters.priceRange[0]}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Máx</Text>
                  <Text style={styles.priceValue}>${filters.priceRange[1]}</Text>
                </View>
              </View>
              <Text style={styles.hint}>Desliza para ajustar (próximamente)</Text>
            </View>

            {/* Vehicle Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de vehículo</Text>
              <View style={styles.optionsGrid}>
                {VEHICLE_TYPES.filter(t => t !== 'Todos').map((type) => {
                  const isSelected = filters.vehicleTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          vehicleTypes: toggleArrayItem(filters.vehicleTypes, type),
                        })
                      }
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Transmision */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transmisión</Text>
              <View style={styles.optionsGrid}>
                {TRANSMISION_TYPES.filter(t => t !== 'Todos').map((trans) => {
                  const isSelected = filters.transmision.includes(trans);
                  return (
                    <TouchableOpacity
                      key={trans}
                      style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          transmision: toggleArrayItem(filters.transmision, trans),
                        })
                      }
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {trans}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Combustible</Text>
              <View style={styles.optionsGrid}>
                {FUEL_TYPES.filter(f => f !== 'Todos').map((fuel) => {
                  const isSelected = filters.fuelTypes.includes(fuel);
                  return (
                    <TouchableOpacity
                      key={fuel}
                      style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          fuelTypes: toggleArrayItem(filters.fuelTypes, fuel),
                        })
                      }
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {fuel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Year Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Año del vehículo</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Desde</Text>
                  <Text style={styles.priceValue}>{filters.yearRange[0]}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Hasta</Text>
                  <Text style={styles.priceValue}>{filters.yearRange[1]}</Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Características</Text>
              <View style={styles.optionsGrid}>
                {FEATURES.map((feature) => {
                  const isSelected = filters.features.includes(feature);
                  return (
                    <TouchableOpacity
                      key={feature}
                      style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          features: toggleArrayItem(filters.features, feature),
                        })
                      }
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {feature}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#032B3C',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B3C',
    marginBottom: 12,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  priceDivider: {
    width: 12,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
