import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../../FirebaseConfig';
import { useAuth } from '../../../context/Auth';
import { createChatIfNotExists } from '../../services/chat';
import { getOwnerReservations, Reservation, updateReservationStatus } from '../../services/reservations';

export default function ReservasScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state for denial
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleChat = async (reservation: Reservation) => {
    if (!user) return;

    try {
        // Fetch user names from Firestore
        const hostDoc = await getDoc(doc(db, 'users', user.uid));
        const renterDoc = await getDoc(doc(db, 'users', reservation.userId));
        
        const hostName = hostDoc.exists() ? (hostDoc.data().nombre || 'Anfitrión') : 'Anfitrión';
        const renterName = renterDoc.exists() ? (renterDoc.data().nombre || 'Cliente') : 'Cliente';
        
        const participantNames = {
            [user.uid]: hostName,
            [reservation.userId]: renterName
        };

        await createChatIfNotExists(
            reservation.id,
            [user.uid, reservation.userId],
            {
                marca: reservation.vehicleSnapshot?.marca || '',
                modelo: reservation.vehicleSnapshot?.modelo || '',
                imagen: reservation.vehicleSnapshot?.imagen || ''
            },
            participantNames
        );
        navigation.navigate('ChatRoom', {
            reservationId: reservation.id,
            participants: [user.uid, reservation.userId],
            vehicleInfo: {
                marca: reservation.vehicleSnapshot?.marca || '',
                modelo: reservation.vehicleSnapshot?.modelo || '',
                imagen: reservation.vehicleSnapshot?.imagen || ''
            }
        });
    } catch (error) {
        console.error('Error opening chat:', error);
        Alert.alert('Error', 'No se pudo abrir el chat');
    }
  };

  const fetchReservations = async () => {
    if (!user) return;
    try {
      const data = await getOwnerReservations(user.uid);
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
      case 'confirmed': return { label: 'Confirmada', color: '#DBEAFE', textColor: '#1E40AF' };
      case 'completed': return { label: 'Completada', color: '#DCFCE7', textColor: '#166534' };
      case 'cancelled': return { label: 'Cancelada', color: '#FEE2E2', textColor: '#991B1B' };
      case 'denied': return { label: 'Rechazada', color: '#FEE2E2', textColor: '#991B1B' };
      default: return { label: status, color: '#F3F4F6', textColor: '#374151' };
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setProcessingId(id);
      await updateReservationStatus(id, 'confirmed');
      Alert.alert('Éxito', 'Reserva confirmada correctamente');
      fetchReservations();
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la reserva');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDenyPress = (id: string) => {
    setSelectedReservationId(id);
    setDenialReason('');
    setModalVisible(true);
  };

  const submitDenial = async () => {
    if (!selectedReservationId || !denialReason.trim()) {
      Alert.alert('Error', 'Por favor ingresa un motivo');
      return;
    }

    try {
      setProcessingId(selectedReservationId);
      await updateReservationStatus(selectedReservationId, 'denied', denialReason);
      setModalVisible(false);
      Alert.alert('Éxito', 'Reserva rechazada');
      fetchReservations();
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la reserva');
    } finally {
      setProcessingId(null);
      setSelectedReservationId(null);
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
        <Text style={styles.headerTitle}>Reservas</Text>
      </View>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reservations.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>No tienes reservas aún.</Text>
          </View>
        ) : (
          reservations.map((r) => {
            const statusInfo = getStatusInfo(r.status);
            const vehicleName = r.vehicleSnapshot 
              ? `${r.vehicleSnapshot.marca} ${r.vehicleSnapshot.modelo}`
              : 'Vehículo';

            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{vehicleName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.text}>
                    {formatDate(r.startDate)} - {formatDate(r.endDate)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Ionicons name="cash-outline" size={16} color="#6B7280" />
                  <Text style={styles.text}>Total: ${r.totalPrice.toFixed(2)}</Text>
                </View>

                {r.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#4CAF50' }]}
                      onPress={() => handleConfirm(r.id)}
                      disabled={processingId === r.id}
                    >
                      <Text style={styles.buttonText}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#F44336' }]}
                      onPress={() => handleDenyPress(r.id)}
                      disabled={processingId === r.id}
                    >
                      <Text style={styles.buttonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#0B729D', width: 40, paddingHorizontal: 0 }]}
                      onPress={() => handleChat(r)}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {r.status === 'confirmed' && (
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#0B729D', flex: 1 }]}
                      onPress={() => handleChat(r)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>Chat con cliente</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#2196F3', marginTop: 12 }]}
                  onPress={() => handleChat(r)}
                >
                  <Text style={styles.buttonText}>Chatear</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal for denial reason */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Motivo de rechazo</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ingresa el motivo aquí"
              value={denialReason}
              onChangeText={setDenialReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#F44336' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#4CAF50' }]}
                onPress={submitDenial}
                disabled={!denialReason.trim() || processingId !== null}
              >
                <Text style={styles.buttonText}>Enviar motivo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#032B3C',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#4B5563',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  textInput: {
    height: 100,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
