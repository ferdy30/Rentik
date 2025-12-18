import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useToast } from '../../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import FilterModal, { type FilterOptions } from '../../components/FilterModal';
import VehicleCard from '../../components/VehicleCard';
import VehicleCardSkeleton from '../../components/VehicleCardSkeleton';
import { Vehicle } from '../../constants/vehicles';
import { useFavorites } from '../../context/FavoritesContext';
import { getAllVehicles } from '../../services/vehicles';
import type { Coordinates } from '../../utils/distance';
import { addDistanceToItems, filterByRadius, sortByDistance } from '../../utils/distance';
import { CARD_WIDTH, styles } from './styles';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'airport', label: 'Aeropuerto', icon: 'airplane-outline' },
  { id: 'near_me', label: 'Cerca de mí', icon: 'location-outline' },
  { id: 'top_rated', label: 'Más buscados', icon: 'star-outline' },
];

const PROMOTIONS = [
  { id: '1', title: 'Explora El Salvador', subtitle: 'Viaja con libertad', image: 'https://cdn.pixabay.com/photo/2020/03/27/22/06/santa-ana-4975147_1280.jpg' },
  { id: '2', title: 'Tu Aventura Espera', subtitle: 'Descubre nuevos destinos', image: 'https://cdn.pixabay.com/photo/2022/06/13/14/58/road-7260175_1280.jpg' },
  { id: '3', title: 'Viaja Seguro', subtitle: 'Atención 24/7 para ti', image: 'https://media.istockphoto.com/id/1469729479/es/foto/atardecer-en-la-playa.jpg?s=612x612&w=0&k=20&c=sk24uTMckudyN9oeLoNRUTjgWgMi6ymtpFpx6EcTCHA=' },
];

export default function BuscarScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Estados para ubicación GPS
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  // Loading indicator for GPS omitted to avoid warnings
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null); // null = sin filtro
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const promoScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const promoIndexRef = useRef(0);

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
    }, [loadVehicles])
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

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-play Carousel
  useEffect(() => {
    if (searchQuery || selectedCategory !== 'all') return;

    const interval = setInterval(() => {
      const nextIndex = (promoIndexRef.current + 1) % PROMOTIONS.length;
      const scrollWidth = Dimensions.get('window').width * 0.78 + 12;
      
      promoScrollRef.current?.scrollTo({ 
        x: nextIndex * scrollWidth, 
        animated: true 
      });
      
      promoIndexRef.current = nextIndex;
      setActivePromoIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [searchQuery, selectedCategory]);

  const handleCategoryPress = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(id);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const loadVehicles = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const data = await getAllVehicles();
      
      // Log first vehicle to debug
      if (data.length > 0) {
        console.log('🔍 Sample vehicle from Firestore:', {
          id: data[0].id,
          marca: data[0].marca,
          arrendadorId: data[0].arrendadorId,
          hasArrendadorId: !!data[0].arrendadorId
        });
      }
      
      const mappedVehicles: Vehicle[] = data.map(v => ({
        id: v.id!,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        precio: v.precio,
        ubicacion: v.ubicacion,
        coordinates: v.coordinates, // Agregar coordenadas
        airportDelivery: v.airportDelivery || false, // Campo de entrega en aeropuerto
        airportFee: v.airportFee || 0,
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
        arrendadorId: v.arrendadorId, // Add this field explicitly
      }));
      
      // Siempre reemplazar vehículos completos para evitar duplicados
      setVehicles(mappedVehicles);
      setLastUpdated(new Date());
      setHasMore(false); // Por ahora no hay paginación real desde backend
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showToast('Error al cargar vehículos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [showToast]);

  // Filtering logic
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Search query (usando debounced)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        vehicle.marca.toLowerCase().includes(query) ||
        vehicle.modelo.toLowerCase().includes(query) ||
        vehicle.ubicacion.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'airport') {
        // Mostrar vehículos que tienen entrega en aeropuerto habilitada
        // O que tienen "aeropuerto" en la ubicación como fallback
        if (!vehicle.airportDelivery && !vehicle.ubicacion.toLowerCase().includes('aeropuerto')) {
          return false;
        }
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
  }, [loadVehicles]);

  const handleFavoritePress = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      const isFav = isFavorite(id);
      toggleFavorite(id, vehicle);
      showToast(
        isFav ? 'Eliminado de favoritos' : '❤️ Agregado a favoritos',
        isFav ? 'info' : 'success',
        2000
      );
    }
  };

  const handleApplyFilters = async (filters: FilterOptions) => {
    setApplyingFilters(true);
    setAdvancedFilters(filters);
    await new Promise(resolve => setTimeout(resolve, 300));
    setApplyingFilters(false);
    
    const activeCount = 
      filters.vehicleTypes.length +
      filters.transmision.length +
      filters.fuelTypes.length +
      filters.features.length;
    
    if (activeCount > 0) {
      showToast(`Filtros aplicados (${activeCount})`, 'success', 2000);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('all');
    setSelectedRadius(null);
    setAdvancedFilters({
      priceRange: [0, 100],
      vehicleTypes: [],
      transmision: [],
      fuelTypes: [],
      yearRange: [2015, 2025],
      features: [],
    });
    showToast('Filtros limpiados', 'info', 2000);
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return '';
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return 'Actualizado hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Actualizado hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Actualizado hace ${hours}h`;
  };

  const activeFilterCount =
    advancedFilters.vehicleTypes.length +
    advancedFilters.transmision.length +
    advancedFilters.fuelTypes.length +
    advancedFilters.features.length;

  const hasAnyFilter = activeFilterCount > 0 || searchQuery || selectedCategory !== 'all' || selectedRadius !== null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 2 }}>
            Encuentra tu
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#0B729D', lineHeight: 38 }}>
            Vehículo ideal
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasAnyFilter && (
            <TouchableOpacity
              style={[styles.viewToggle, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
              onPress={clearAllFilters}
            >
              <Ionicons name="close-circle" size={20} color="#DC2626" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.viewToggle}
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
              size={22} 
              color="#0B729D" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchText}
              placeholder="Busca por marca, modelo..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color="#0B729D" />
            {activeFilterCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#DC2626',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Quick Filters Chips */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersContainer}>
            {advancedFilters.vehicleTypes.map(type => (
              <View key={type} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{type}</Text>
              </View>
            ))}
            {advancedFilters.transmision.map(trans => (
              <View key={trans} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{trans}</Text>
              </View>
            ))}
             {/* Add more if needed, or just a summary */}
          </View>
        )}
      </View>

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
              onPress={() => handleCategoryPress(cat.id)}
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
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B729D']} tintColor="#0B729D" />}
        >
          {/* Promotions Carousel */}
          {!searchQuery && selectedCategory === 'all' && (
            <View style={styles.promoContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8, paddingHorizontal: 16 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginTop: 0, marginLeft: 0, flex: 1, fontSize: 18 }]}>Viaja con Nosotros</Text>
                <Ionicons name="car-sport" size={20} color="#0B729D" />
              </View>
              <ScrollView 
                ref={promoScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.promoList}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { 
                    useNativeDriver: false,
                    listener: (event: any) => {
                      const offsetX = event.nativeEvent.contentOffset.x;
                      const scrollWidth = Dimensions.get('window').width * 0.78 + 12;
                      const index = Math.round(offsetX / scrollWidth);
                      if (index >= 0 && index < PROMOTIONS.length && index !== promoIndexRef.current) {
                        promoIndexRef.current = index;
                        setActivePromoIndex(index);
                      }
                    }
                  }
                )}
                scrollEventThrottle={16}
                pagingEnabled={true}
                snapToInterval={Dimensions.get('window').width * 0.78 + 12}
                decelerationRate="fast"
              >
                {PROMOTIONS.map((promo) => (
                  <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
                    <Image source={{ uri: promo.image }} style={styles.promoImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                      locations={[0, 0.5, 1]}
                      style={styles.promoGradient}
                    />
                    <View style={styles.promoContent}>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {PROMOTIONS.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.paginationDot, 
                      activePromoIndex === index && styles.paginationDotActive
                    ]} 
                  />
                ))}
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.grid}>
              {[1, 2, 3, 4].map((i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </View>
          ) : vehiclesWithDistance.length === 0 ? (
            <View style={{ paddingTop: 60 }}>
              <EmptyState
                icon="car-outline"
                title="Sin resultados"
                message="No encontramos vehículos que coincidan con tu búsqueda. Prueba con otros filtros."
                actionLabel="Limpiar filtros"
                onActionPress={clearAllFilters}
              />
            </View>
          ) : (
            <>
              {/* Recommended Section */}
              {recommended.length > 0 && !searchQuery && selectedCategory === 'all' && (
                <>
                  <Text style={styles.sectionTitle}>Recomendados para ti</Text>
                  <View style={styles.grid}>
                    {recommended.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        style={{ width: CARD_WIDTH }}
                        onPress={() =>
                          navigation.getParent()?.navigate('Details', { vehicle })
                        }
                        onFavoritePress={handleFavoritePress}
                        isFavorite={isFavorite(vehicle.id)}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* All Vehicles Title */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>
                    {searchQuery || selectedCategory !== 'all' ? `Resultados (${vehiclesWithDistance.length})` : 'Vehículos disponibles'}
                  </Text>
                  {applyingFilters && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#0B729D" />
                      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Filtrando...</Text>
                    </View>
                  )}
                </View>
                {lastUpdated && (
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12, marginLeft: 2 }}>
                    {getTimeSinceUpdate()}
                  </Text>
                )}
              </View>

              {/* Vehicles Grid */}
              <View style={styles.grid}>
                {vehiclesWithDistance.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    style={{ width: CARD_WIDTH }}
                    onPress={() =>
                      navigation.getParent()?.navigate('Details', { vehicle })
                    }
                    onFavoritePress={handleFavoritePress}
                    isFavorite={isFavorite(vehicle.id)}
                  />
                ))}
              </View>
              
              {/* Loading more indicator */}
              {loadingMore && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0B729D" />
                  <Text style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>Cargando más vehículos...</Text>
                </View>
              )}
              
              {/* End of results message */}
              {!hasMore && vehiclesWithDistance.length > 10 && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={{ marginTop: 8, fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                    Has visto todos los vehículos disponibles
                  </Text>
                </View>
              )}
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
                  tracksViewChanges={false} // Optimización de rendimiento
                >
                  {/* Wrapper con padding para evitar recortes en Android por sombras/elevation */}
                  <View style={{ padding: 6 }}>
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
                      elevation: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 60,
                    }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>${vehicle.precio}</Text>
                      {vehicle.distanceText && (
                        <Text style={{ fontSize: 10, color: '#fff', marginTop: 2 }}>{vehicle.distanceText}</Text>
                      )}
                    </View>
                  </View>
                  <Callout tooltip onPress={() => navigation.getParent()?.navigate('Details', { vehicle })}>
                    <View style={styles.calloutContainer}>
                      <Image source={{ uri: vehicle.imagen }} style={styles.calloutImage} />
                      <Text style={styles.calloutTitle} numberOfLines={1}>{vehicle.marca} {vehicle.modelo}</Text>
                      <Text style={styles.calloutPrice}>${vehicle.precio}/día</Text>
                      <View style={styles.calloutRating}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.calloutRatingText}>{vehicle.rating} ({vehicle.reviewCount})</Text>
                      </View>
                    </View>
                  </Callout>
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
