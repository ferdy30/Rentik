import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import { getUserReservations, type Reservation } from '../../services/reservations';
import { styles } from './styles';

export default function ViajesScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', color: '#FEF9C3', textColor: '#854D0E' };
      case 'confirmed': return { label: 'Confirmado', color: '#DBEAFE', textColor: '#1E40AF' };
      case 'completed': return { label: 'Completado', color: '#DCFCE7', textColor: '#166534' };
      case 'cancelled': return { label: 'Cancelado', color: '#FEE2E2', textColor: '#991B1B' };
      case 'denied': return { label: 'Rechazado', color: '#FEE2E2', textColor: '#991B1B' };
      default: return { label: status, color: '#F3F4F6', textColor: '#374151' };
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
        <Text style={styles.headerTitle}>Mis Viajes</Text>
      </View>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ gap: 14, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reservations.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>No tienes viajes registrados aún.</Text>
          </View>
        ) : (
          reservations.map((res) => {
            const statusInfo = getStatusInfo(res.status);
            const vehicleName = res.vehicleSnapshot 
              ? `${res.vehicleSnapshot.marca} ${res.vehicleSnapshot.modelo} ${res.vehicleSnapshot.anio}`
              : 'Vehículo';

            return (
              <View key={res.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cardTitle}>{vehicleName}</Text>
                  <View style={[{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: statusInfo.color }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: statusInfo.textColor }}>{statusInfo.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
                    {formatDate(res.startDate)} - {formatDate(res.endDate)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
                    ${res.totalPrice.toFixed(2)}
                  </Text>
                </View>
                
                {res.status === 'denied' && res.denialReason && (
                  <View style={{ marginTop: 12, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B', marginBottom: 4 }}>Motivo del rechazo:</Text>
                    <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{res.denialReason}</Text>
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
