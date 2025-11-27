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
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import { useToast } from '../../../context/ToastContext';
import { archiveReservation, deleteReservation, getUserReservations, type Reservation } from '../../services/reservations';
import { styles } from './styles';

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export default function ViajesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserReservations(user.uid);
      setReservations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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
    if (filterType === 'all') return reservations;
    if (filterType === 'active') return reservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
    if (filterType === 'completed') return reservations.filter(r => r.status === 'completed');
    if (filterType === 'cancelled') return reservations.filter(r => r.status === 'cancelled' || r.status === 'denied');
    return reservations;
  }, [reservations, filterType]);

  const stats = useMemo(() => {
    return {
      total: reservations.length,
      active: reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled' || r.status === 'denied').length,
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
            } catch (error) {
              console.error('Error deleting reservation:', error);
              showToast('No se pudo eliminar el viaje', 'error');
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
    } catch (error) {
      console.error('Error archiving reservation:', error);
      showToast('No se pudo archivar el viaje', 'error');
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Viajes</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>{stats.total} viajes en total</Text>
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
            <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
              {reservations.length === 0 ? 'No tienes viajes registrados aún.' : 'No hay viajes en esta categoría.'}
            </Text>
          </View>
        ) : (
          filteredReservations.map((res) => {
            const statusInfo = getStatusInfo(res.status);
            const vehicleName = res.vehicleSnapshot 
              ? `${res.vehicleSnapshot.marca} ${res.vehicleSnapshot.modelo} ${res.vehicleSnapshot.anio}`
              : 'Vehículo';
            const showReason = (res.status === 'denied' || res.status === 'cancelled') && 
                               (res.denialReason || res.cancellationReason);

            return (
              <View key={res.id} style={styles.card}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('TripDetails', { reservation: res })}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{vehicleName}</Text>
                    <View style={[{ 
                      paddingVertical: 5, 
                      paddingHorizontal: 10, 
                      borderRadius: 999, 
                      backgroundColor: statusInfo.color,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 8
                    }]}>
                      <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.textColor} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: statusInfo.textColor }}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  
                  <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.cardDate}>
                      {formatDate(res.startDate)} - {formatDate(res.endDate)}
                    </Text>
                  </View>

                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {res.pickupLocation || 'Ubicación por definir'}
                    </Text>
                  </View>

                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      ${res.totalPrice.toFixed(2)}
                    </Text>
                  </View>

                  {showReason && (
                    <View style={{
                      marginTop: 12,
                      padding: 10,
                      backgroundColor: '#FEF2F2',
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: '#DC2626'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Ionicons name="information-circle" size={16} color="#DC2626" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B' }}>
                          {res.status === 'denied' ? 'Motivo del rechazo:' : 'Motivo de cancelación:'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 18 }}>
                        {res.denialReason || res.cancellationReason}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Action buttons for cancelled/denied */}
                {(res.status === 'cancelled' || res.status === 'denied') && (
                  <View style={{ 
                    marginTop: 12, 
                    paddingTop: 12, 
                    borderTopWidth: 1, 
                    borderTopColor: '#F3F4F6',
                    flexDirection: 'row',
                    gap: 8
                  }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: '#F3F4F6',
                        borderRadius: 8,
                        gap: 6
                      }}
                      onPress={() => handleArchiveReservation(res.id)}
                      disabled={deletingId === res.id}
                    >
                      <Ionicons name="archive-outline" size={18} color="#6B7280" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Archivar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: '#FEE2E2',
                        borderRadius: 8,
                        gap: 6
                      }}
                      onPress={() => handleDeleteReservation(res.id, vehicleName)}
                      disabled={deletingId === res.id}
                    >
                      {deletingId === res.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Eliminar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
