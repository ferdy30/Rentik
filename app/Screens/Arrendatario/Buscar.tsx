import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import EmptyState from '../../components/EmptyState';
import FilterModal, { type FilterOptions } from '../../components/FilterModal';
import SearchBar from '../../components/SearchBar';
import VehicleCard from '../../components/VehicleCard';
import VehicleCardSkeleton from '../../components/VehicleCardSkeleton';
import { Vehicle } from '../../constants/vehicles';
import { getAllVehicles } from '../../services/vehicles';
import { styles } from './styles';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'airport', label: 'Aeropuerto', icon: 'airplane-outline' },
  { id: 'near_me', label: 'Cerca de mí', icon: 'location-outline' },
  { id: 'top_rated', label: 'Más buscados', icon: 'star-outline' },
];

const PROMOTIONS = [
  { id: '1', title: '20% OFF', subtitle: 'En tu primera renta', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' },
  { id: '2', title: 'Viaja Seguro', subtitle: 'Seguro incluido', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80' },
  { id: '3', title: 'Fin de Semana', subtitle: 'Ofertas especiales', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80' },
];

export default function BuscarScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    priceRange: [0, 100],
    vehicleTypes: [],
    transmision: [],
    fuelTypes: [],
    yearRange: [2015, 2025],
    features: [],
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAllVehicles();
      const mappedVehicles: Vehicle[] = data.map(v => ({
        id: v.id!,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        precio: v.precio,
        ubicacion: v.ubicacion,
        imagen: v.photos?.front || 'https://via.placeholder.com/400',
        imagenes: v.photos ? [v.photos.front, v.photos.sideLeft, v.photos.sideRight, v.photos.interior].filter(Boolean) : [],
        rating: v.rating || 0,
        reviewCount: v.trips || 0,
        transmision: v.transmision as any,
        combustible: v.combustible as any,
        pasajeros: v.pasajeros,
        puertas: v.puertas,
        tipo: v.tipo as any,
        caracteristicas: [], // TODO: Add features to VehicleData
        badges: v.status === 'active' ? ['Verificado'] : [],
        disponible: v.status === 'active',
        propietarioId: v.arrendadorId,
      }));
      setVehicles(mappedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtering logic
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        vehicle.marca.toLowerCase().includes(query) ||
        vehicle.modelo.toLowerCase().includes(query) ||
        vehicle.ubicacion.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'airport') {
        if (!vehicle.ubicacion.toLowerCase().includes('aeropuerto')) return false;
      }
      if (selectedCategory === 'near_me') {
        // Mock logic: In a real app, calculate distance from user location
        // For demo, we'll show vehicles in 'San Salvador'
        if (!vehicle.ubicacion.toLowerCase().includes('san salvador')) return false;
      }
      if (selectedCategory === 'top_rated') {
        if (vehicle.rating < 4.5) return false;
      }
    }

    // Advanced filters
    if (vehicle.precio < advancedFilters.priceRange[0] || vehicle.precio > advancedFilters.priceRange[1]) {
      return false;
    }
    if (advancedFilters.vehicleTypes.length > 0 && !advancedFilters.vehicleTypes.includes(vehicle.tipo)) {
      return false;
    }
    if (advancedFilters.transmision.length > 0 && !advancedFilters.transmision.includes(vehicle.transmision)) {
      return false;
    }
    if (advancedFilters.fuelTypes.length > 0 && !advancedFilters.fuelTypes.includes(vehicle.combustible)) {
      return false;
    }
    if (vehicle.anio < advancedFilters.yearRange[0] || vehicle.anio > advancedFilters.yearRange[1]) {
      return false;
    }
    if (advancedFilters.features.length > 0) {
      const hasAllFeatures = advancedFilters.features.every((feat) => vehicle.caracteristicas.includes(feat));
      if (!hasAllFeatures) return false;
    }

    return true;
  });

  const recommended = filteredVehicles.filter(
    (v) => v.badges?.includes('Más rentado') || v.rating >= 4.8
  ).slice(0, 4);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehicles();
  }, []);

  const handleFavoritePress = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
  };

  const activeFilterCount =
    advancedFilters.vehicleTypes.length +
    advancedFilters.transmision.length +
    advancedFilters.fuelTypes.length +
    advancedFilters.features.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rentik</Text>
          <Text style={styles.appName}>Buscar</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'map-outline' : 'list-outline'} 
            size={24} 
            color="#0B729D" 
          />
        </TouchableOpacity>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        onFilterPress={() => setFilterModalVisible(true)}
        selectedFilters={activeFilterCount > 0 ? [String(activeFilterCount)] : []}
        filterChips={[]} // Removed old chips
        onChipPress={() => {}}
      />

      {/* Categories - Chips */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={18} 
                color={selectedCategory === cat.id ? '#fff' : '#6B7280'} 
              />
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* Promotions Carousel */}
          {!searchQuery && (
            <View style={styles.promoContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoList}>
                {PROMOTIONS.map((promo) => (
                  <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
                    <Image source={{ uri: promo.image }} style={styles.promoImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.promoGradient}
                    />
                    <View style={styles.promoContent}>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.grid}>
              {[1, 2, 3, 4].map((i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </View>
          ) : filteredVehicles.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No encontramos resultados"
              message="Intenta ajustar tus filtros o buscar otra cosa"
              actionLabel="Limpiar filtros"
              onActionPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setAdvancedFilters({
                  priceRange: [0, 100],
                  vehicleTypes: [],
                  transmision: [],
                  fuelTypes: [],
                  yearRange: [2015, 2025],
                  features: [],
                });
              }}
            />
          ) : (
            <>
              {/* Recommended Section - Only show if no search/filter active */}
              {recommended.length > 0 && !searchQuery && selectedCategory === 'all' && (
                <>
                  <Text style={styles.sectionTitle}>Recomendados para ti</Text>
                  <View style={styles.grid}>
                    {recommended.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        style={{ width: '48%' }}
                        onPress={() =>
                          navigation.getParent()?.navigate('Details', { vehicle })
                        }
                        onFavoritePress={handleFavoritePress}
                        isFavorite={favorites.includes(vehicle.id)}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* All Vehicles Section */}
              <Text style={styles.sectionTitle}>
                {searchQuery || selectedCategory !== 'all' ? `Resultados (${filteredVehicles.length})` : 'Vehículos disponibles'}
              </Text>
              <View style={styles.grid}>
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    style={{ width: '48%' }}
                    onPress={() =>
                      navigation.getParent()?.navigate('Details', { vehicle })
                    }
                    onFavoritePress={handleFavoritePress}
                    isFavorite={favorites.includes(vehicle.id)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>

      <Modal visible={viewMode === 'map'} animationType="slide" onRequestClose={() => setViewMode('list')}>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 13.6929,
              longitude: -89.2182,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {filteredVehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                coordinate={{
                  latitude: 13.6929 + (Math.random() * 0.02 - 0.01), // Mock coords if missing
                  longitude: -89.2182 + (Math.random() * 0.02 - 0.01),
                }}
                onCalloutPress={() => navigation.getParent()?.navigate('Details', { vehicle })}
              >
                <View style={{
                  backgroundColor: '#fff',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 4,
                }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#032B3C' }}>${vehicle.precio}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          
          <TouchableOpacity 
            style={{
                position: 'absolute',
                bottom: 40,
                alignSelf: 'center',
                backgroundColor: '#032B3C',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 30,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6,
            }}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Ver Lista</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={advancedFilters}
      />
    </View>
  );
}
