import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/Auth';
import { useToast } from '../../context/ToastContext';
import TripCard from '../../components/TripCard';
import { archiveReservation, deleteReservation, getUserReservations, type Reservation } from '../../services/reservations';
import { styles } from './styles';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';
type SortType = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc';

export default function ViajesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserReservations(user.uid);
      setReservations(data);
    } catch (error) {
      showToast('Error al cargar reservas', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
      }, [fetchReservations])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // Aplicar filtro por estado
    if (filterType === 'active') filtered = filtered.filter(r => r.status === 'pending' || r.status === 'confirmed');
    else if (filterType === 'completed') filtered = filtered.filter(r => r.status === 'completed');
    else if (filterType === 'cancelled') filtered = filtered.filter(r => r.status === 'cancelled' || r.status === 'denied');

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const vehicleName = r.vehicleSnapshot 
          ? `${r.vehicleSnapshot.marca} ${r.vehicleSnapshot.modelo} ${r.vehicleSnapshot.anio}`.toLowerCase()
          : '';
        const location = (r.pickupLocation || r.deliveryAddress || '').toLowerCase();
        return vehicleName.includes(query) || location.includes(query);
      });
    }

    // Aplicar ordenamiento
    const sorted = [...filtered].sort((a, b) => {
      if (sortType === 'date-desc') {
        return (b.startDate?.toMillis() || 0) - (a.startDate?.toMillis() || 0);
      } else if (sortType === 'date-asc') {
        return (a.startDate?.toMillis() || 0) - (b.startDate?.toMillis() || 0);
      } else if (sortType === 'price-desc') {
        return b.totalPrice - a.totalPrice;
      } else if (sortType === 'price-asc') {
        return a.totalPrice - b.totalPrice;
      }
      return 0;
    });

    return sorted;
  }, [reservations, filterType, searchQuery, sortType]);

  const stats = useMemo(() => {
    const now = new Date();
    const activeReservations = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
    const upcomingTrips = activeReservations.filter(r => {
      const startDate = r.startDate?.toDate();
      if (!startDate) return false;
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    return {
      total: reservations.length,
      active: activeReservations.length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled' || r.status === 'denied').length,
      upcoming: upcomingTrips.length,
      totalSpent: reservations
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.totalPrice, 0),
    };
  }, [reservations]);

  const handleDeleteReservation = (reservationId: string, vehicleName: string) => {
    Alert.alert(
      'Eliminar viaje',
      `¿Estás seguro de eliminar este viaje?\n\n${vehicleName}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(reservationId);
              await deleteReservation(reservationId);
              showToast('Viaje eliminado correctamente', 'success');
              fetchReservations();
            } catch (error: any) {
              const errorMessage = error.message || 'No se pudo eliminar el viaje';
              showToast(errorMessage, 'error');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleArchiveReservation = async (reservationId: string) => {
    try {
      setDeletingId(reservationId);
      await archiveReservation(reservationId);
      showToast('Viaje archivado', 'success');
      fetchReservations();
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo archivar el viaje';
      showToast(errorMessage, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', color: '#FEF9C3', textColor: '#854D0E', icon: 'time-outline' };
      case 'confirmed': return { label: 'Confirmado', color: '#DBEAFE', textColor: '#1E40AF', icon: 'checkmark-circle' };
      case 'completed': return { label: 'Completado', color: '#DCFCE7', textColor: '#166534', icon: 'checkmark-done-circle' };
      case 'cancelled': return { label: 'Cancelado', color: '#FEE2E2', textColor: '#991B1B', icon: 'close-circle' };
      case 'denied': return { label: 'Rechazado', color: '#FEE2E2', textColor: '#991B1B', icon: 'ban' };
      default: return { label: status, color: '#F3F4F6', textColor: '#374151', icon: 'help-circle' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0B729D" />
      </View>
    );
  }

  const getSortIcon = () => {
    if (sortType === 'date-desc') return 'calendar';
    if (sortType === 'date-asc') return 'calendar-outline';
    if (sortType === 'price-desc') return 'cash';
    return 'cash-outline';
  };

  const cycleSortType = () => {
    const types: SortType[] = ['date-desc', 'date-asc', 'price-desc', 'price-asc'];
    const currentIndex = types.indexOf(sortType);
    const nextIndex = (currentIndex + 1) % types.length;
    setSortType(types[nextIndex]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Gestiona tus</Text>
          <Text style={styles.headerTitle}>Viajes</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0B729D' }}>{stats.total}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>viajes</Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: '#F0F9FF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
            onPress={cycleSortType}
          >
            <Ionicons name={getSortIcon() as any} size={16} color="#0B729D" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#0B729D' }}>Ordenar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Banner */}
      {stats.upcoming > 0 && (
        <View style={{
          marginHorizontal: 20,
          marginTop: 12,
          padding: 16,
          backgroundColor: '#DBEAFE',
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#0B729D',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time" size={20} color="#0B729D" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E40AF', flex: 1 }}>
              Tienes {stats.upcoming} {stats.upcoming === 1 ? 'viaje próximo' : 'viajes próximos'} esta semana
            </Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 46,
          borderWidth: 1,
          borderColor: searchQuery ? '#0B729D' : '#E5E7EB',
        }}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: '#111827',
            }}
            placeholder="Buscar por vehículo o ubicación..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
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
              Activos ({stats.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'completed' && styles.filterChipActive]}
            onPress={() => setFilterType('completed')}
          >
            <Text style={[styles.filterText, filterType === 'completed' && styles.filterTextActive]}>
              Completados ({stats.completed})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'cancelled' && styles.filterChipActive]}
            onPress={() => setFilterType('cancelled')}
          >
            <Text style={[styles.filterText, filterType === 'cancelled' && styles.filterTextActive]}>
              Cancelados ({stats.cancelled})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ gap: 14, paddingBottom: 100, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredReservations.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name={searchQuery ? 'search-outline' : 'car-sport-outline'} size={64} color="#D1D5DB" />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: '#374151' }}>
              {searchQuery ? 'Sin resultados' : reservations.length === 0 ? 'No tienes viajes' : 'Sin viajes aquí'}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 }}>
              {searchQuery ? 'Intenta con otra búsqueda' : reservations.length === 0 ? 'Comienza explorando vehículos disponibles' : 'Cambia el filtro para ver otros viajes'}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#0B729D', borderRadius: 8 }}
                onPress={() => setSearchQuery('')}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredReservations.map((res) => (
            <TripCard
              key={res.id}
              reservation={res}
              onPress={() => navigation.navigate('TripDetails', { reservation: res })}
              onDelete={() => {
                const vehicleName = res.vehicleSnapshot 
                  ? `${res.vehicleSnapshot.marca} ${res.vehicleSnapshot.modelo} ${res.vehicleSnapshot.anio}`
                  : 'este vehículo';
                handleDeleteReservation(res.id, vehicleName);
              }}
              onArchive={() => handleArchiveReservation(res.id)}
              isDeleting={deletingId === res.id}
              onQuickAction={(action) => {
                if (action === 'chat') {
                  navigation.navigate('ChatRoom', { 
                    reservationId: res.id,
                    participants: [res.userId, res.arrendadorId],
                    vehicleInfo: {
                        marca: res.vehicleSnapshot?.marca || '',
                        modelo: res.vehicleSnapshot?.modelo || '',
                        imagen: res.vehicleSnapshot?.imagen || ''
                    }
                  });
                } else if (action === 'navigate') {
                  // Navigate to location
                  showToast('Abriendo navegación...', 'info');
                } else if (action === 'checkin') {
                  const startDate = res.startDate?.toDate();
                  const daysUntil = startDate ? Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  if (daysUntil !== null && daysUntil <= 1) {
                    navigation.navigate('CheckInStart', { reservation: res });
                  } else {
                    showToast('El check-in estará disponible 24 horas antes del inicio', 'info');
                  }
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
