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
import { useAuth } from '../../../context/Auth';
import { db } from '../../../FirebaseConfig';
import ReservationCard from '../../components/ReservationCard';
import { createChatIfNotExists } from '../../services/chat';
import { archiveReservation, deleteReservation, getOwnerReservations, Reservation, updateReservationStatus } from '../../services/reservations';

interface UserProfile {
  nombre: string;
  email: string;
  photoURL?: string;
  telefono?: string;
  createdAt?: any;
  completedTrips?: number;
  rating?: number;
}

export default function ReservasScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'history'>('requests');
  
  // Modal state for denial
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // User profiles cache
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  const handleChat = async (reservation: Reservation) => {
    if (!user || loadingChat === reservation.id) return;

    setLoadingChat(reservation.id);
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
    } catch (error: any) {
        console.error('Error opening chat:', error);
        
        if (error.code === 'permission-denied') {
            Alert.alert('Acceso denegado', 'No tienes permiso para acceder a este chat.');
        } else if (error.code === 'unavailable') {
            Alert.alert('Sin conexión', 'Verifica tu conexión a internet e intenta de nuevo.');
        } else {
            Alert.alert('Error', 'No se pudo abrir el chat. Intenta de nuevo.');
        }
    } finally {
        setLoadingChat(null);
    }
  };

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getOwnerReservations(user.uid);
      setReservations(data);
      
      // Cargar información de los arrendatarios
      const profiles: Record<string, UserProfile> = {};
      const uniqueUserIds = [...new Set(data.map(r => r.userId))];
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[userId] = {
                nombre: userData.nombre || 'Usuario',
                email: userData.email || '',
                photoURL: userData.photoURL,
                telefono: userData.telefono,
                createdAt: userData.createdAt,
                completedTrips: userData.completedTrips || 0,
                rating: userData.rating || 0,
              };
            }
          } catch (error) {
            // Silently fail for individual profiles
          }
        })
      );
      
      setUserProfiles(profiles);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
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
    } catch {
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
    } catch {
      Alert.alert('Error', 'No se pudo rechazar la reserva');
    } finally {
      setProcessingId(null);
      setSelectedReservationId(null);
    }
  };

  const handleArchiveReservation = async (reservationId: string) => {
    try {
      setDeletingId(reservationId);
      await archiveReservation(reservationId);
      Alert.alert('Archivado', 'Reserva archivada correctamente');
      fetchReservations();
    } catch (error) {
      console.error('Error archiving reservation:', error);
      Alert.alert('Error', 'No se pudo archivar la reserva');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReservation = (reservationId: string, vehicleName: string) => {
    Alert.alert(
      'Eliminar reserva',
      `¿Estás seguro de eliminar esta reserva?\n\n${vehicleName}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(reservationId);
              console.log('Attempting to delete reservation:', reservationId);
              console.log('Current user:', user?.uid);
              await deleteReservation(reservationId);
              Alert.alert('Eliminada', 'Reserva eliminada correctamente');
              fetchReservations();
            } catch (error: any) {
              console.error('Error deleting reservation:', error);
              const errorMessage = error.message || 'No se pudo eliminar la reserva';
              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const getFilteredReservations = () => {
    return reservations.filter(r => {
      if (r.archived) return false;
      if (activeTab === 'requests') return r.status === 'pending';
      if (activeTab === 'upcoming') return r.status === 'confirmed';
      if (activeTab === 'history') return ['completed', 'cancelled', 'denied'].includes(r.status);
      return false;
    });
  };

  const filteredReservations = getFilteredReservations();

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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]} 
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Solicitudes</Text>
          {reservations.filter(r => r.status === 'pending' && !r.archived).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {reservations.filter(r => r.status === 'pending' && !r.archived).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 120, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredReservations.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons 
              name={
                activeTab === 'requests' ? "notifications-outline" : 
                activeTab === 'upcoming' ? "calendar-outline" : "time-outline"
              } 
              size={64} 
              color="#D1D5DB" 
            />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
              {activeTab === 'requests' ? 'No tienes solicitudes pendientes.' :
               activeTab === 'upcoming' ? 'No tienes reservas próximas.' :
               'No tienes historial de reservas.'}
            </Text>
          </View>
        ) : (
          filteredReservations.map((r) => {
            const renterProfile = userProfiles[r.userId];
            const vehicleName = r.vehicleSnapshot 
              ? `${r.vehicleSnapshot.marca} ${r.vehicleSnapshot.modelo}`
              : 'Vehículo';

            return (
              <ReservationCard
                key={r.id}
                reservation={r}
                userProfile={renterProfile}
                onConfirm={() => handleConfirm(r.id)}
                onDeny={() => handleDenyPress(r.id)}
                onChat={() => handleChat(r)}
                onCheckIn={() => navigation.navigate('CheckInStart', { reservation: r })}
                onViewDetails={() => handleChat(r)}
                onArchive={() => handleArchiveReservation(r.id)}
                onDelete={() => handleDeleteReservation(r.id, vehicleName)}
                isProcessing={processingId === r.id}
                isLoadingChat={loadingChat === r.id}
                isDeleting={deletingId === r.id}
              />
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
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#032B3C',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 16,
  },
  tab: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0B729D',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0B729D',
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  renterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  renterProfile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0B729D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  renterInfo: {
    flex: 1,
  },
  renterName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  renterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tripsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  memberSince: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#0B729D',
    fontWeight: '500',
  },
  messageSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  detailsSection: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  chatButton: {
    width: 48,
    backgroundColor: '#0B729D',
  },
  chatButtonFull: {
    width: '100%',
    backgroundColor: '#0B729D',
    marginTop: 16,
  },
  viewButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0B729D',
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
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
