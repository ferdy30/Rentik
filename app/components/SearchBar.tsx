import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterPress: () => void;
  selectedFilters: string[];
  filterChips: string[];
  onChipPress: (chip: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterPress,
  selectedFilters,
  filterChips,
  onChipPress,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.container}>
      {/* Hero search input */}
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={22} color="#0B729D" />
        <TextInput
          style={styles.searchInput}
          placeholder="Busca por marca, modelo..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleSearch}
        />
        <View style={styles.divider} />
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={22} color="#0B729D" />
          {selectedFilters.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter chips - Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScrollView}
        contentContainerStyle={styles.chipsContainer}
      >
        {filterChips.map((chip) => {
          const isSelected = selectedFilters.includes(chip);
          return (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onChipPress(chip)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#032B3C',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  filterButton: {
    position: 'relative',
    padding: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  chipsScrollView: {
    marginTop: 16,
    marginHorizontal: -20, 
    paddingHorizontal: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20, 
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#0B729D',
    borderColor: '#0B729D',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
