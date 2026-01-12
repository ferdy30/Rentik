import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/Auth';
import { useToast } from '../../context/ToastContext';
import { Firebaseauth } from '../../FirebaseConfig';
import VehicleCardSkeleton from '../../components/VehicleCardSkeleton';
import { ArrendadorStackParamList } from '../../navigation/ArrendadorStack';
import { deleteVehicle, subscribeToOwnerVehicles, VehicleData } from '../../services/vehicles';
import { RootStackParamList } from '../../types/navigation';

type MisAutosScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ArrendadorStackParamList>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterType = 'all' | 'active' | 'rented' | 'inactive';
type ViewMode = 'grid' | 'list';

export default function MisAutosScreen({ navigation }: MisAutosScreenProps) {
  const [cars, setCars] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const stripeVerified = Boolean(userData?.stripe?.chargesEnabled);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToOwnerVehicles(user.uid, (vehicles) => {
      setCars(vehicles);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error(error);
      showToast('No se pudieron cargar tus vehículos', 'error');
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, [user, showToast]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Real-time subscription will update automatically
  };

  // Filtrado y búsqueda
  const filteredCars = useMemo(() => {
    let filtered = cars;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(car => 
        car.marca.toLowerCase().includes(query) ||
        car.modelo.toLowerCase().includes(query) ||
        car.placa.toLowerCase().includes(query) ||
        car.anio.toString().includes(query)
      );
    }

    // Filtro por estado
    if (filterType !== 'all') {
      filtered = filtered.filter(car => {
        if (filterType === 'active') return car.status === 'active';
        if (filterType === 'rented') return car.status === 'rented';
        if (filterType === 'inactive') return car.status === 'inactive';
        return true;
      });
    }

    return filtered;
  }, [cars, searchQuery, filterType]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalEarnings = cars.reduce((sum, car) => sum + (car.precio * (car.trips || 0)), 0);
    const activeCount = cars.filter(c => c.status === 'active').length;
    const rentedCount = cars.filter(c => c.status === 'rented').length;
    const avgRating = cars.length > 0 
      ? cars.reduce((sum, car) => sum + (car.rating || 0), 0) / cars.length 
      : 0;

    return {
      total: cars.length,
      active: activeCount,
      rented: rentedCount,
      inactive: cars.length - activeCount - rentedCount,
      totalEarnings,
      avgRating: avgRating.toFixed(1),
    };
  }, [cars]);

  const handleAddCar = () => {
    if (!stripeVerified) {
      Alert.alert(
        'Completa tu verificación de Stripe',
        'Antes de publicar vehículos, verifica tu cuenta de Stripe para recibir pagos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Verificar ahora', onPress: () => navigation.navigate('PaymentSetup') },
        ]
      );
      return;
    }
    navigation.navigate('AddVehicleStep1Basic');
  };

  const handleCompleteStripeVerification = () => {
    navigation.navigate('PaymentSetup');
  };

  const handleEditCar = (car: VehicleData) => {
    navigation.navigate('EditVehicle', { vehicle: car });
  };

  const handleDeleteCar = (carId: string) => {
    Alert.alert(
      'Eliminar Vehículo',
      '¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteVehicle(carId);
              showToast('Vehículo eliminado correctamente', 'success');
              // No need to reload, onSnapshot will handle it
            } catch (error) {
              console.error(error);
              showToast('No se pudo eliminar el vehículo', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Vehículos</Text>
          <Text style={styles.headerSubtitle}>{stats.total} vehículos registrados</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} 
              size={22} 
              color="#0B729D" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Firebaseauth.signOut()}
          >
            <Ionicons name="log-out-outline" size={22} color="#0B729D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="car-sport" size={20} color="#4F46E5" />
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="key" size={20} color="#D97706" />
            <Text style={styles.statNumber}>{stats.rented}</Text>
            <Text style={styles.statLabel}>Rentados</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cash" size={20} color="#16A34A" />
            <Text style={styles.statNumber}>${stats.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Generados</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="star" size={20} color="#DC2626" />
            <Text style={styles.statNumber}>{stats.avgRating}</Text>
            <Text style={styles.statLabel}>Rating Prom.</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por marca, modelo o placa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              Todos ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'active' && styles.filterChipActive]}
            onPress={() => setFilterType('active')}
          >
            <Text style={[styles.filterText, filterType === 'active' && styles.filterTextActive]}>
              Disponibles ({stats.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'rented' && styles.filterChipActive]}
            onPress={() => setFilterType('rented')}
          >
            <Text style={[styles.filterText, filterType === 'rented' && styles.filterTextActive]}>
              Rentados ({stats.rented})
            </Text>
          </TouchableOpacity>
          {stats.inactive > 0 && (
            <TouchableOpacity
              style={[styles.filterChip, filterType === 'inactive' && styles.filterChipActive]}
              onPress={() => setFilterType('inactive')}
            >
              <Text style={[styles.filterText, filterType === 'inactive' && styles.filterTextActive]}>
                Inactivos ({stats.inactive})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {!stripeVerified && userData?.stripe?.detailsSubmitted && (
          <View style={[styles.bannerWarning, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
            <Ionicons name="time-outline" size={22} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: '#92400E' }]}>Verificación en proceso</Text>
              <Text style={[styles.bannerText, { color: '#78350F' }]}>
                Stripe está revisando tu información. Esto puede tomar entre unas horas y 1-2 días hábiles. Algunas funciones están limitadas mientras tanto.
              </Text>
            </View>
          </View>
        )}

        {!stripeVerified && !userData?.stripe?.detailsSubmitted && (
          <View style={styles.bannerWarning}>
            <Ionicons name="alert-circle-outline" size={22} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Verificación de Stripe pendiente</Text>
              <Text style={styles.bannerText}>
                Completa tu verificación de Stripe para comenzar a recibir pagos y publicar vehículos.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.bannerCta} 
              onPress={handleCompleteStripeVerification}
            >
              <Text style={styles.bannerCtaText}>Verificar</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={viewMode === 'grid' ? styles.gridList : styles.carsList}>
            {[1, 2, 3].map((i) => (
              <VehicleCardSkeleton key={i} style={{ width: viewMode === 'grid' ? '48%' : '100%' }} />
            ))}
          </View>
        ) : filteredCars.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={searchQuery ? "search-outline" : "car-outline"} size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron vehículos' : 'No tienes vehículos registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Intenta con otra búsqueda o cambia los filtros'
                : 'Agrega tu primer vehículo para comenzar a ganar dinero'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
              >
                <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.gridList : styles.carsList}>
            {filteredCars.map((car) => (
              <TouchableOpacity 
                key={car.id} 
                style={[styles.carCard, viewMode === 'grid' && styles.carCardGrid]}
                onPress={() => handleEditCar(car)}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: car.photos?.front || car.imagen || (car.imagenes && car.imagenes[0]) || 'https://via.placeholder.com/150' }} 
                  style={[styles.carImage, viewMode === 'grid' && styles.carImageGrid]} 
                />
                <View style={[styles.statusBadge, styles.statusBadgeAbsolute, car.status === 'active' ? styles.statusActive : styles.statusRented]}>
                  <Text style={[styles.statusText, car.status === 'active' ? styles.statusTextActive : styles.statusTextRented]}>
                    {car.status === 'active' ? '✓ Disponible' : '🔑 Rentado'}
                  </Text>
                </View>
                <View style={styles.carInfo}>
                  <View style={styles.carHeader}>
                    <Text style={[styles.carTitle, viewMode === 'grid' && styles.carTitleGrid]} numberOfLines={1}>
                      {car.marca} {car.modelo}
                    </Text>
                  </View>
                  <Text style={styles.carYear}>{car.anio}</Text>
                  <Text style={styles.carPlate}>{car.placa}</Text>
                  
                  {viewMode === 'list' && (
                    <>
                      <View style={styles.carStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="cash-outline" size={14} color="#6B7280" />
                          <Text style={styles.statValue}>${car.precio}/día</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="car-outline" size={14} color="#6B7280" />
                          <Text style={styles.statValue}>{car.trips || 0} viajes</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.statValue}>{car.rating || 0}</Text>
                        </View>
                      </View>
                      <View style={styles.carActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditCar(car)}
                        >
                          <Ionicons name="create-outline" size={18} color="#4B5563" />
                          <Text style={styles.actionText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.actionButtonDelete]}
                          onPress={() => handleDeleteCar(car.id!)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {viewMode === 'grid' && (
                    <View style={styles.gridStats}>
                      <Text style={styles.gridPrice}>${car.precio}/día</Text>
                      <View style={styles.gridRating}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.gridRatingText}>{car.rating || 0}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, !stripeVerified && { opacity: 0.5 }]} 
        onPress={handleAddCar}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#0B729D',
    borderColor: '#0B729D',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },
  bannerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  bannerTitle: { color: '#92400E', fontWeight: '700' },
  bannerText: { color: '#B45309', fontSize: 12 },
  bannerCta: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#D97706', borderRadius: 8 },
  bannerCtaText: { color: '#fff', fontWeight: '700' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0B729D',
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  carsList: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  carCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  carCardGrid: {
    width: '48%',
  },
  carImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  carImageGrid: {
    height: 120,
  },
  carInfo: {
    padding: 12,
  },
  carHeader: {
    marginBottom: 2,
  },
  carTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  carTitleGrid: {
    fontSize: 15,
  },
  carYear: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusRented: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextRented: {
    color: '#991B1B',
  },
  carPlate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  carStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  gridStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gridPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B729D',
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  carActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    backgroundColor: '#F3F4F6',
  },
  actionButtonDelete: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#0B729D',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
