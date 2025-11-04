import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/Auth';
import { Firebaseauth } from '../../FirebaseConfig';
import EmptyState from '../components/EmptyState';
import FilterModal, { type FilterOptions } from '../components/FilterModal';
import SearchBar from '../components/SearchBar';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import { MOCK_VEHICLES } from '../constants/vehicles';

const QUICK_FILTERS = ['Automático', 'SUV', 'Económico', 'Híbrido'];

function BuscarScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
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
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtering logic
  const filteredVehicles = MOCK_VEHICLES.filter((vehicle) => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        vehicle.marca.toLowerCase().includes(query) ||
        vehicle.modelo.toLowerCase().includes(query) ||
        vehicle.ubicacion.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Quick filter chips
    if (selectedChips.length > 0) {
      const matchesChip = selectedChips.some((chip) => {
        if (chip === 'Automático') return vehicle.transmision === 'Automático';
        if (chip === 'SUV') return vehicle.tipo === 'SUV';
        if (chip === 'Económico') return vehicle.precio <= 25;
        if (chip === 'Híbrido') return vehicle.combustible === 'Híbrido';
        return false;
      });
      if (!matchesChip) return false;
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
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleChipPress = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

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
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <SearchBar
        onSearch={setSearchQuery}
        onFilterPress={() => setFilterModalVisible(true)}
        selectedFilters={activeFilterCount > 0 ? [String(activeFilterCount)] : []}
        filterChips={QUICK_FILTERS}
        onChipPress={handleChipPress}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
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
              setSelectedChips([]);
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
            {/* Recommended Section */}
            {recommended.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recomendados para ti</Text>
                <View style={styles.grid}>
                  {recommended.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onPress={() =>
                        navigation.getParent()?.navigate('Details', { id: vehicle.id })
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
              {recommended.length > 0 ? 'Todos los vehículos' : 'Vehículos disponibles'}
            </Text>
            <View style={styles.grid}>
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() =>
                    navigation.getParent()?.navigate('Details', { id: vehicle.id })
                  }
                  onFavoritePress={handleFavoritePress}
                  isFavorite={favorites.includes(vehicle.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={advancedFilters}
      />
    </View>
  );
}

function ViajesScreen() {
  const trips = [
    { id: 't1', auto: 'Corolla 2020', fechas: '12-14 Nov', estado: 'En curso' },
    { id: 't2', auto: 'Civic 2019', fechas: '20-22 Nov', estado: 'Próximo' },
    { id: 't3', auto: 'Sentra 2021', fechas: '05-07 Dic', estado: 'Completado' },
  ];
  const badgeStyle = (estado: string) => {
    if (estado === 'En curso') return { backgroundColor: '#DBEAFE' };
    if (estado === 'Próximo') return { backgroundColor: '#FEF9C3' };
    return { backgroundColor: '#DCFCE7' };
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Viajes</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
        {trips.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{t.auto}</Text>
              <View style={[{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }, badgeStyle(t.estado)]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#032B3C' }}>{t.estado}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>{t.fechas}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ChatScreen() {
  const chats = [
    { id: 'c1', nombre: 'Carlos M.', ultimo: '¿A qué hora entrego?', unread: 2 },
    { id: 'c2', nombre: 'Ana P.', ultimo: 'Gracias!', unread: 0 },
  ];
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
        {chats.map(c => (
          <View key={c.id} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={20} color="#0B729D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{c.nombre}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{c.ultimo}</Text>
              </View>
              {c.unread > 0 && (
                <View style={{ minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{c.unread}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function PerfilScreen() {
  const { user, userData } = useAuth();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>
      <View style={[styles.content, { gap: 12 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={28} color="#0B729D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#032B3C' }}>{userData?.nombre} {userData?.apellido}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{user?.email}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
            <Text style={{ fontSize: 14, color: '#032B3C', fontWeight: '600' }}>Rol: {userData?.role ?? '—'}</Text>
          </View>
        </View>
        <TouchableOpacity style={{ backgroundColor: '#0B729D', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 50, flexDirection: 'row', gap: 8 }} onPress={() => Firebaseauth.signOut()}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0B729D',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Buscar') iconName = focused ? 'search' : 'search-outline';
          if (route.name === 'Viajes') iconName = focused ? 'briefcase' : 'briefcase-outline';
          if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Buscar" component={BuscarScreen} />
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0B729D',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B3C',
  },
});
