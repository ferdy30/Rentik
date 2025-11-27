import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
      for (const reservation of data) {
        if (!profiles[reservation.userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', reservation.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[reservation.userId] = {
                nombre: userData.nombre || 'Usuario',
                email: userData.email || '',
                photoURL: userData.photoURL,
                telefono: userData.telefono,
                createdAt: userData.createdAt,
                completedTrips: userData.completedTrips || 0,
                rating: userData.rating || 0,
              };
            }
          } catch (_error) {
            console.error('Error loading user profile:', _error);
          }
        }
      }
      setUserProfiles(profiles);
    } catch (_error) {
      console.error(_error);
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
              await deleteReservation(reservationId);
              Alert.alert('Eliminada', 'Reserva eliminada correctamente');
              fetchReservations();
            } catch (error) {
              console.error('Error deleting reservation:', error);
              Alert.alert('Error', 'No se pudo eliminar la reserva');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
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
          reservations.filter(r => !r.archived).map((r) => {
            const statusInfo = getStatusInfo(r.status);
            const vehicleName = r.vehicleSnapshot 
              ? `${r.vehicleSnapshot.marca} ${r.vehicleSnapshot.modelo}`
              : 'Vehículo';
            const renterProfile = userProfiles[r.userId];
            const memberSince = renterProfile?.createdAt 
              ? (renterProfile.createdAt.toDate ? new Date(renterProfile.createdAt.toDate()).getFullYear() : null)
              : null;

            return (
              <View key={r.id} style={styles.card}>
                {/* Header con vehículo y estado */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{vehicleName}</Text>
                    <Text style={styles.cardSubtitle}>
                      {formatDate(r.startDate)} - {formatDate(r.endDate)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                {/* Perfil del Arrendatario */}
                <View style={styles.renterSection}>
                  <Text style={styles.sectionTitle}>Solicitado por</Text>
                  <View style={styles.renterProfile}>
                    <View style={styles.avatar}>
                      {renterProfile?.photoURL ? (
                        <Image 
                          source={{ uri: renterProfile.photoURL }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {renterProfile?.nombre?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.renterInfo}>
                      <Text style={styles.renterName}>{renterProfile?.nombre || 'Usuario'}</Text>
                      <View style={styles.renterMeta}>
                        {renterProfile?.rating ? (
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.ratingText}>{renterProfile.rating.toFixed(1)}</Text>
                          </View>
                        ) : null}
                        {renterProfile?.completedTrips !== undefined && (
                          <Text style={styles.tripsText}>
                            {renterProfile.completedTrips} {renterProfile.completedTrips === 1 ? 'viaje' : 'viajes'}
                          </Text>
                        )}
                        {memberSince && (
                          <Text style={styles.memberSince}>Miembro desde {memberSince}</Text>
                        )}
                      </View>
                      {renterProfile?.telefono && (
                        <View style={styles.contactRow}>
                          <Ionicons name="call-outline" size={14} color="#0B729D" />
                          <Text style={styles.contactText}>{renterProfile.telefono}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Mensaje del arrendatario */}
                {r.messageToHost && (
                  <View style={styles.messageSection}>
                    <View style={styles.messageHeader}>
                      <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                      <Text style={styles.messageTitle}>Mensaje del arrendatario</Text>
                    </View>
                    <Text style={styles.messageText}>{r.messageToHost}</Text>
                  </View>
                )}
                
                <View style={styles.divider} />
                
                {/* Detalles de la reserva */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {r.pickupLocation || 'Por confirmar'}
                    </Text>
                  </View>
                  {r.pickupTime && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        Recogida: {r.pickupTime}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#16A34A" />
                    <Text style={[styles.detailText, { fontWeight: '700', color: '#16A34A' }]}>
                      Total: ${r.totalPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Acciones */}
                {r.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleConfirm(r.id)}
                      disabled={processingId === r.id}
                    >
                      {processingId === r.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Aceptar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.denyButton]}
                      onPress={() => handleDenyPress(r.id)}
                      disabled={processingId === r.id}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.chatButton]}
                      onPress={() => handleChat(r)}
                      disabled={loadingChat === r.id}
                    >
                      {loadingChat === r.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="chatbubble" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                
                {r.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.chatButtonFull]}
                    onPress={() => handleChat(r)}
                    disabled={loadingChat === r.id}
                  >
                    {loadingChat === r.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="chatbubble" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Chatear con {renterProfile?.nombre || 'cliente'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {(r.status === 'completed' || r.status === 'cancelled' || r.status === 'denied') && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleChat(r)}
                    disabled={loadingChat === r.id}
                  >
                    {loadingChat === r.id ? (
                      <ActivityIndicator size="small" color="#0B729D" />
                    ) : (
                      <>
                        <Ionicons name="eye" size={18} color="#0B729D" />
                        <Text style={[styles.buttonText, { color: '#0B729D' }]}>Ver detalles</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {(r.status === 'cancelled' || r.status === 'denied') && (
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
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: '#F3F4F6',
                        borderRadius: 8,
                        gap: 6
                      }}
                      onPress={() => handleArchiveReservation(r.id)}
                      disabled={deletingId === r.id}
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
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: '#FEE2E2',
                        borderRadius: 8,
                        gap: 6
                      }}
                      onPress={() => handleDeleteReservation(r.id, vehicleName)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? (
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
