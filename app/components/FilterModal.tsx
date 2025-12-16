import { Ionicons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import React, { useState } from 'react';
import {
  Dimensions,
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

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48 - 32; // paddingHorizontal - extra padding

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [scrollEnabled, setScrollEnabled] = useState(true);

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

  const enableScroll = () => setScrollEnabled(true);
  const disableScroll = () => setScrollEnabled(false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#032B3C" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
          >
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Precio por día</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Mínimo</Text>
                  <Text style={styles.priceValue}>${filters.priceRange[0]}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Máximo</Text>
                  <Text style={styles.priceValue}>${filters.priceRange[1]}</Text>
                </View>
              </View>
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={[filters.priceRange[0], filters.priceRange[1]]}
                  sliderLength={SLIDER_WIDTH}
                  onValuesChange={(values) => setFilters({ ...filters, priceRange: [values[0], values[1]] })}
                  onValuesChangeStart={disableScroll}
                  onValuesChangeFinish={enableScroll}
                  min={0}
                  max={300}
                  step={5}
                  allowOverlap={false}
                  snapped
                  selectedStyle={{ backgroundColor: colors.primary }}
                  unselectedStyle={{ backgroundColor: '#E5E7EB' }}
                  containerStyle={{ height: 40 }}
                  trackStyle={{ height: 4 }}
                  markerStyle={{
                    backgroundColor: '#fff',
                    height: 24,
                    width: 24,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                />
              </View>
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
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={[filters.yearRange[0], filters.yearRange[1]]}
                  sliderLength={SLIDER_WIDTH}
                  onValuesChange={(values) => setFilters({ ...filters, yearRange: [values[0], values[1]] })}
                  onValuesChangeStart={disableScroll}
                  onValuesChangeFinish={enableScroll}
                  min={2010}
                  max={2025}
                  step={1}
                  allowOverlap={false}
                  snapped
                  selectedStyle={{ backgroundColor: colors.primary }}
                  unselectedStyle={{ backgroundColor: '#E5E7EB' }}
                  containerStyle={{ height: 40 }}
                  trackStyle={{ height: 4 }}
                  markerStyle={{
                    backgroundColor: '#fff',
                    height: 24,
                    width: 24,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                />
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
            
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Ver resultados</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#032B3C',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B3C',
    marginBottom: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  priceDivider: {
    width: 12,
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
    paddingBottom: 30,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
