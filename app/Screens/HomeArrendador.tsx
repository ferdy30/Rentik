import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/Auth';
import { Firebaseauth } from '../../FirebaseConfig';
import { deleteVehicle, getVehiclesByOwner, VehicleData } from '../services/vehicles';

interface RouterProps {
  navigation: any;
}

function MisAutosScreen({ navigation }: RouterProps) {
  const [cars, setCars] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userData } = useAuth();
  // Stripe: check chargesEnabled for payment verification
  const stripeVerified = Boolean(userData?.stripe?.chargesEnabled);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadVehicles();
      }
    }, [user])
  );

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const vehicles = await getVehiclesByOwner(user!.uid);
      setCars(vehicles);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar tus vehículos');
    } finally {
      setLoading(false);
    }
  };

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
              await loadVehicles();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el vehículo');
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
        <Text style={styles.headerTitle}>Mis Vehículos</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Firebaseauth.signOut()}
        >
          <Ionicons name="log-out-outline" size={24} color="#0B729D" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>HOME ARRENDADOR</Text>

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
          <ActivityIndicator size="large" color="#0B729D" style={{ marginTop: 40 }} />
        ) : cars.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
            <Text style={styles.emptySubtext}>
              Agrega tu primer vehículo para comenzar a ganar dinero
            </Text>
          </View>
        ) : (
          <View style={styles.carsList}>
            {cars.map((car) => (
              <View key={car.id} style={styles.carCard}>
                <Image 
                  source={{ uri: car.photos?.front || 'https://via.placeholder.com/150' }} 
                  style={styles.carImage} 
                />
                <View style={styles.carInfo}>
                  <View style={styles.carHeader}>
                    <Text style={styles.carTitle}>{car.marca} {car.modelo} {car.anio}</Text>
                    <View style={[styles.statusBadge, car.status === 'active' ? styles.statusActive : styles.statusRented]}>
                      <Text style={[styles.statusText, car.status === 'active' ? styles.statusTextActive : styles.statusTextRented]}>
                        {car.status === 'active' ? 'Disponible' : 'Rentado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.carPlate}>{car.placa}</Text>
                  <View style={styles.carStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Precio</Text>
                      <Text style={styles.statValue}>${car.precio}/día</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Viajes</Text>
                      <Text style={styles.statValue}>{car.trips || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Rating</Text>
                      <Text style={styles.statValue}>⭐ {car.rating || 0}</Text>
                    </View>
                  </View>
                  <View style={styles.carActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditCar(car)}
                    >
                      <Ionicons name="create-outline" size={20} color="#4B5563" />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteCar(car.id!)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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

function ReservasScreen() {
  const reservations = [
    { id: 'r1', cliente: 'Carlos M.', auto: 'Corolla 2020', fecha: '12-14 Nov', estado: 'Confirmada' },
    { id: 'r2', cliente: 'Ana P.', auto: 'Civic 2019', fecha: '20-22 Nov', estado: 'Pendiente' },
  ];
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservas</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {reservations.map((r) => (
          <View key={r.id} style={styles.carCard}>
            <View style={styles.carHeader}>
              <Text style={styles.carTitle}>{r.auto}</Text>
              <View style={[styles.statusBadge, r.estado === 'Confirmada' ? styles.statusAvailable : styles.statusRented]}>
                <Text style={styles.statusText}>{r.estado}</Text>
              </View>
            </View>
            <Text style={styles.carDetails}>Cliente: {r.cliente}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.statText}>{r.fecha}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function IngresosScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ingresos</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '700' }}>Este mes</Text>
            <Text style={{ color: '#032B3C', fontSize: 20, fontWeight: '800', marginTop: 4 }}>$1,980.00</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '700' }}>Reservas</Text>
            <Text style={{ color: '#032B3C', fontSize: 20, fontWeight: '800', marginTop: 4 }}>24</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16 }}>
          <Text style={{ color: '#032B3C', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Últimos 6 meses</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 }}>
            {[30, 55, 20, 70, 45, 60].map((h, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 22, borderRadius: 8, backgroundColor: '#0B729D', height: 20 + h }} />
                <Text style={{ fontSize: 10, color: '#6B7280' }}>{['May','Jun','Jul','Ago','Sep','Oct'][i]}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PerfilScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>
      <View style={[styles.content, { gap: 12 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16 }}>
          <Text style={{ color: '#032B3C', fontSize: 16, fontWeight: '700' }}>Próximamente</Text>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>Aquí podrás editar tu perfil, preferencias y datos de pago.</Text>
        </View>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function HomeArrendador() {
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
          if (route.name === 'Mis autos') iconName = focused ? 'car' : 'car-outline';
          if (route.name === 'Reservas') iconName = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Ingresos') iconName = focused ? 'cash' : 'cash-outline';
          if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Mis autos" component={MisAutosScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Ingresos" component={IngresosScreen} />
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0B729D',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    marginBottom: 16,
  },
  bannerTitle: { color: '#92400E', fontWeight: '700' },
  bannerText: { color: '#B45309', fontSize: 12 },
  bannerCta: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#D97706', borderRadius: 8 },
  bannerCtaText: { color: '#fff', fontWeight: '700' },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#032B3C',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  carsList: {
    gap: 15,
    paddingBottom: 100,
  },
  carCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  carInfo: {
    padding: 16,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusAvailable: { // Kept for other screens if needed
    backgroundColor: '#D1FAE5',
  },
  statusRented: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextRented: {
    color: '#991B1B',
  },
  carPlate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  carStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#032B3C',
  },
  // Kept for compatibility with other screens
  carDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  carPrice: {
    fontSize: 16,
    color: '#0B729D',
    fontWeight: '600',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // End compatibility
  carActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 5,
    backgroundColor: '#F3F4F6',
  },
  editButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionButtonText: { // Compatibility
    fontSize: 14,
    fontWeight: '600',
    color: '#032B3C',
  },
  deleteButtonText: { // Compatibility
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 90, // Adjusted for tab bar
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