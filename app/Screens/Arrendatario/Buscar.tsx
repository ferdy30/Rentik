import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
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
import type { Coordinates } from '../../utils/distance';
import { addDistanceToItems, filterByRadius, sortByDistance } from '../../utils/distance';
import { styles } from './styles';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'airport', label: 'Aeropuerto', icon: 'airplane-outline' },
  { id: 'near_me', label: 'Cerca de mí', icon: 'location-outline' },
  { id: 'top_rated', label: 'Más buscados', icon: 'star-outline' },
];

const PROMOTIONS = [
  { id: '1', title: '20% OFF', subtitle: 'En tu primera renta', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' },
  { id: '2', title: 'Viaja Seguro', subtitle: 'Atención 24/7', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80' },
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
  // Pagination placeholders removed to avoid warnings; add when implementing
  // Pagination placeholders removed to avoid warnings; add when implementing
  // const VEHICLES_PER_PAGE = 10; // Pagination constant reserved for future use
  
  // Estados para ubicación GPS
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  // Loading indicator for GPS omitted to avoid warnings
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null); // null = sin filtro
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : 'denied');
      
      if (status === 'granted') {
        getUserLocation();
      } else {
        setLocationError('Necesitas activar los permisos de ubicación para ver resultados cercanos.');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission('denied');
      setLocationError('Ocurrió un problema al solicitar permisos de ubicación.');
    }
  }, []);

  // Solicitar permiso de ubicación al cargar
  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const getUserLocation = async () => {
    try {
      // start loading indicator
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationError(null);
    } catch (error) {
      console.error('Error getting user location:', error);
      setLocationError('No pudimos obtener tu ubicación. Activa los servicios de ubicación para ver resultados cercanos.');
    } finally {
      // stop loading indicator
    }
  };

  const loadVehicles = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        // Reset pagination when implemented
      }
      
      const data = await getAllVehicles();
      const mappedVehicles: Vehicle[] = data.map(v => ({
        id: v.id!,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        precio: v.precio,
        ubicacion: v.ubicacion,
        coordinates: v.coordinates, // Agregar coordenadas
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
      if (reset) {
        setVehicles(mappedVehicles);
      } else {
        setVehicles(mappedVehicles);
      }
      
      // hasMore handling removed until pagination is implemented
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
        // Filtrar solo vehículos que tengan coordenadas
        if (!vehicle.coordinates) return false;
        // Si no hay ubicación del usuario, no filtrar
        if (!userLocation) return true;
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

  // Agregar distancias y ordenar si hay ubicación del usuario
  let vehiclesWithDistance = filteredVehicles;
  
  if (userLocation) {
    // Aplicar filtro de radio si está seleccionado
    if (selectedRadius !== null) {
      vehiclesWithDistance = filterByRadius(
        vehiclesWithDistance,
        userLocation,
        selectedRadius,
        (vehicle) => vehicle.coordinates || null
      );
    }
    
    // Agregar información de distancia a cada vehículo
    vehiclesWithDistance = addDistanceToItems(
      vehiclesWithDistance,
      userLocation,
      (vehicle) => vehicle.coordinates || null
    );
    
    // Si está en modo "Cerca de mí", ordenar por distancia
    if (selectedCategory === 'near_me') {
      vehiclesWithDistance = sortByDistance(
        vehiclesWithDistance,
        userLocation,
        (vehicle) => vehicle.coordinates || null
      );
    }
  }

  const recommended = vehiclesWithDistance.filter(
    (v) => v.badges?.includes('Más rentado') || v.rating >= 4.8
  ).slice(0, 4);

  // loadMoreVehicles placeholder removed until pagination is implemented

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehicles(true);
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            style={[styles.viewToggle, { paddingHorizontal: 10, paddingVertical: 8 }]}
            onPress={requestLocationPermission}
          >
            <Ionicons
              name={locationPermission === 'granted' ? 'navigate' : 'location-outline'}
              size={22}
              color={locationPermission === 'granted' ? '#0B729D' : '#6B7280'}
            />
          </TouchableOpacity>
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
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        onFilterPress={() => setFilterModalVisible(true)}
        selectedFilters={activeFilterCount > 0 ? [String(activeFilterCount)] : []}
        filterChips={[]} // Removed old chips
        onChipPress={() => {}}
      />

      {locationError && (
        <View style={{
          marginHorizontal: 16,
          marginTop: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: '#FEF9C3',
          borderWidth: 1,
          borderColor: '#FDE68A',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={{ color: '#92400E', fontSize: 13, flex: 1 }}>{locationError}</Text>
          {locationPermission === 'denied' ? (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={{ color: '#92400E', fontWeight: '700' }}>Abrir ajustes</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={getUserLocation}>
              <Text style={{ color: '#92400E', fontWeight: '700' }}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
          
          {/* Filtros de radio - solo visible si hay ubicación */}
          {userLocation && viewMode === 'list' && (
            <>
              <View style={{ width: 1, height: 30, backgroundColor: '#E5E7EB', marginHorizontal: 8 }} />
              {[5, 10, 20, 50].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.categoryChip,
                    selectedRadius === radius && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedRadius(selectedRadius === radius ? null : radius)}
                >
                  <Ionicons 
                    name="location" 
                    size={16} 
                    color={selectedRadius === radius ? '#fff' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.categoryLabel,
                    selectedRadius === radius && styles.categoryLabelActive
                  ]}>
                    {radius}km
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
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
          ) : vehiclesWithDistance.length === 0 ? (
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
                {searchQuery || selectedCategory !== 'all' ? `Resultados (${vehiclesWithDistance.length})` : 'Vehículos disponibles'}
              </Text>
              <View style={styles.grid}>
                {vehiclesWithDistance.map((vehicle) => (
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
              latitude: userLocation?.latitude || 13.6929,
              longitude: userLocation?.longitude || -89.2182,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={locationPermission === 'granted'}
            showsMyLocationButton={locationPermission === 'granted'}
          >
            {vehiclesWithDistance
              .filter(vehicle => vehicle.coordinates) // Solo vehículos con coordenadas
              .map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  coordinate={{
                    latitude: vehicle.coordinates!.latitude,
                    longitude: vehicle.coordinates!.longitude,
                  }}
                  onPress={() => navigation.getParent()?.navigate('Details', { vehicle })}
                >
                  <View style={{
                    backgroundColor: '#0B729D',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>${vehicle.precio}</Text>
                    {vehicle.distanceText && (
                      <Text style={{ fontSize: 10, color: '#fff', marginTop: 2 }}>{vehicle.distanceText}</Text>
                    )}
                  </View>
                </Marker>
              ))}
          </MapView>
          {locationPermission !== 'granted' && (
            <View style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              backgroundColor: '#FEF9C3',
              borderColor: '#FDE68A',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <Ionicons name="warning-outline" size={18} color="#92400E" />
              <Text style={{ color: '#92400E', fontSize: 13, flex: 1 }}>
                Activa los permisos de ubicación para ver tu posición en el mapa.
              </Text>
              <TouchableOpacity onPress={() => Linking.openSettings()}>
                <Text style={{ color: '#92400E', fontWeight: '700' }}>Abrir ajustes</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Filtros de radio */}
          {userLocation && (
            <View style={{
              position: 'absolute',
              top: 60,
              left: 20,
              right: 20,
              flexDirection: 'row',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              {[5, 10, 20, 50].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={{
                    backgroundColor: selectedRadius === radius ? '#0B729D' : '#fff',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: selectedRadius === radius ? '#0B729D' : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                  onPress={() => setSelectedRadius(selectedRadius === radius ? null : radius)}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: selectedRadius === radius ? '#fff' : '#374151',
                  }}>
                    {radius}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Info badge */}
          <View style={{
            position: 'absolute',
            top: 60,
            right: 20,
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#032B3C' }}>
              {vehiclesWithDistance.filter(v => v.coordinates).length} vehículos
            </Text>
          </View>
          
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
