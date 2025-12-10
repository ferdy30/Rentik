import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FilterType } from '../constants/tripStatus';

interface TripFiltersProps {
  activeFilter: FilterType;
  stats: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  onFilterChange: (filter: FilterType) => void;
}

interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, count, isActive, onPress }: FilterChipProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label} ({count})
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TripFilters({ activeFilter, stats, onFilterChange }: TripFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterChip
          label="Todos"
          count={stats.total}
          isActive={activeFilter === 'all'}
          onPress={() => onFilterChange('all')}
        />
        <FilterChip
          label="Activos"
          count={stats.active}
          isActive={activeFilter === 'active'}
          onPress={() => onFilterChange('active')}
        />
        <FilterChip
          label="Completados"
          count={stats.completed}
          isActive={activeFilter === 'completed'}
          onPress={() => onFilterChange('completed')}
        />
        <FilterChip
          label="Cancelados"
          count={stats.cancelled}
          isActive={activeFilter === 'cancelled'}
          onPress={() => onFilterChange('cancelled')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scrollContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#0B729D',
    borderColor: '#0B729D',
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  filterTextActive: {
    color: 'white',
  },
});
