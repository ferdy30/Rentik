import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../../../FirebaseConfig';
import TripTimeline from '../../components/TripTimeline';
import { Reservation, updateReservationStatus } from '../../services/reservations';
import { formatDate } from '../../utils/date';
import { scheduleReservationReminders } from '../../utils/tripNotifications';

type ReservationDetailsRouteProp = RouteProp<{ ReservationDetails: { reservation: Reservation } }, 'ReservationDetails'>;

interface UserProfile {
  nombre: string;
  apellido?: string;
  email: string;
  photoURL?: string;
  telefono?: string;
  createdAt?: any;
  completedTrips?: number;
  rating?: number;
  verified?: {
    email?: boolean;
    phone?: boolean;
    license?: boolean;
    identity?: boolean;
  };
}

export default function ReservationDetails() {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<ReservationDetailsRouteProp>();
  const { reservation } = route.params;

  const [renterProfile, setRenterProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modal para rechazar
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Denial reason templates
  const denialTemplates = [
    { id: 'unavailable', label: 'Vehículo no disponible', reason: 'El vehículo no está disponible para esas fechas.' },
    { id: 'booked', label: 'Ya reservado', reason: 'Ya tengo otra reserva confirmada en esas fechas.' },
    { id: 'maintenance', label: 'En mantenimiento', reason: 'El vehículo estará en mantenimiento durante ese período.' },
    { id: 'profile', label: 'Perfil incompleto', reason: 'El perfil del arrendatario no cumple con mis requisitos.' },
    { id: 'custom', label: 'Otro motivo', reason: '' },
  ];

  const loadRenterProfile = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', reservation.userId));
      if (userDoc.exists()) {
        setRenterProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading renter profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, [reservation.userId]);

  // Obtener coordenadas independientemente del formato usado
  const getCoordinates = () => {
    return reservation.pickupCoordinates || reservation.pickupCoords || reservation.deliveryCoords || null;
  };

  useEffect(() => {
    loadRenterProfile();
  }, [loadRenterProfile]);

  const handleAccept = () => {
    Alert.alert(
      'Confirmar Reserva',
      '¿Estás seguro de que quieres aceptar esta reserva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setProcessing(true);
            try {
              await updateReservationStatus(reservation.id, 'confirmed');
              
              // Programar notificaciones de recordatorio
              const updatedReservation = { ...reservation, status: 'confirmed' as const };
              await scheduleReservationReminders(updatedReservation);
              
              Alert.alert(
                'Reserva Confirmada',
                'La reserva ha sido confirmada. El arrendatario recibirá recordatorios automáticos.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo confirmar la reserva');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeny = async () => {
    const finalReason = selectedTemplate === 'custom' 
      ? denialReason.trim()
      : denialTemplates.find(t => t.id === selectedTemplate)?.reason || denialReason.trim();
      
    if (!finalReason) {
      Alert.alert('Razón Requerida', 'Por favor selecciona o escribe una razón para rechazar esta reserva.');
      return;
    }

    setProcessing(true);
    try {
      await updateReservationStatus(reservation.id, 'denied', finalReason);
      setShowDenyModal(false);
      setDenialReason('');
      setSelectedTemplate(null);
      Alert.alert(
        'Reserva Rechazada',
        'La reserva ha sido rechazada. El arrendatario recibirá una notificación.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo rechazar la reserva');
    } finally {
      setProcessing(false);
    }
  };

  const calculateDays = () => {
    const start = reservation.startDate.toDate();
    const end = reservation.endDate.toDate();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
      confirmed: { label: 'Confirmada', color: '#10B981', bg: '#D1FAE5' },
      active: { label: 'En Curso', color: '#3B82F6', bg: '#DBEAFE' },
      completed: { label: 'Completada', color: '#6B7280', bg: '#F3F4F6' },
      cancelled: { label: 'Cancelada', color: '#EF4444', bg: '#FEE2E2' },
      denied: { label: 'Rechazada', color: '#DC2626', bg: '#FEE2E2' },
    };
    const config = statusConfig[reservation.status as keyof typeof statusConfig];
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const getVerificationStatus = () => {
    if (!renterProfile?.verified) return null;
    const { email, phone, license, identity } = renterProfile.verified;
    const verifiedCount = [email, phone, license, identity].filter(Boolean).length;
    return (
      <View style={styles.verificationContainer}>
        <Ionicons 
          name={verifiedCount >= 3 ? "shield-checkmark" : "shield-outline"} 
          size={20} 
          color={verifiedCount >= 3 ? "#10B981" : "#F59E0B"} 
        />
        <Text style={styles.verificationText}>
          {verifiedCount >= 3 ? 'Usuario Verificado' : `${verifiedCount}/4 verificaciones`}
        </Text>
      </View>
    );
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B729D" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vehículo Card */}
        <View style={styles.vehicleSection}>
          <View style={styles.vehicleImageContainer}>
            <Image 
              source={{ uri: reservation.vehicleSnapshot?.imagen || 'https://via.placeholder.com/400' }}
              style={styles.vehicleImage}
              contentFit="cover"
            />
            <View style={styles.vehicleOverlay}>
              {getStatusBadge()}
            </View>
            <View style={styles.vehicleInfoCard}>
              <View style={styles.vehicleMainInfo}>
                <Text style={styles.vehicleBrandText}>{reservation.vehicleSnapshot?.marca}</Text>
                <Text style={styles.vehicleModelText}>{reservation.vehicleSnapshot?.modelo}</Text>
                <Text style={styles.vehicleYearText}>{reservation.vehicleSnapshot?.anio}</Text>
              </View>
              <View style={styles.reservationIdBox}>
                <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                <Text style={styles.reservationIdText}>ID: {reservation.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Datos del Arrendatario */}
        <View style={styles.section}>
          <View style={styles.renterCard}>
            <View style={styles.renterCardHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#0B729D" />
              <Text style={styles.renterCardHeaderTitle}>Tu Arrendatario</Text>
            </View>
            <View style={styles.renterHeader}>
              <View style={styles.avatarContainer}>
                {renterProfile?.photoURL ? (
                  <Image source={{ uri: renterProfile.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#9CA3AF" />
                  </View>
                )}
                {renterProfile && renterProfile.completedTrips > 0 && (
                  <View style={styles.verifiedBadgeIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </View>
              
              <View style={styles.renterInfo}>
                <Text style={styles.renterCardTitle}>Tu arrendatario</Text>
                <Text style={styles.renterName}>
                  {renterProfile?.nombre} {renterProfile?.apellido || ''}
                </Text>
                <View style={styles.renterStats}>
                  <View style={styles.statBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.statText}>
                      {renterProfile?.rating ? renterProfile.rating.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Ionicons name="car-sport" size={14} color="#6B7280" />
                    <Text style={styles.statText}>
                      {renterProfile?.completedTrips || 0} viajes
                    </Text>
                  </View>
                </View>
                {getVerificationStatus()}
              </View>
            </View>

            <View style={styles.contactSection}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => renterProfile?.email && Linking.openURL(`mailto:${renterProfile.email}`)}
              >
                <View style={styles.contactIconCircle}>
                  <Ionicons name="mail" size={18} color="#0B729D" />
                </View>
                <View style={styles.contactTextWrapper}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{renterProfile?.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              {renterProfile?.telefono && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`tel:${renterProfile.telefono}`)}
                >
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="call" size={18} color="#0B729D" />
                  </View>
                  <View style={styles.contactTextWrapper}>
                    <Text style={styles.contactLabel}>Teléfono</Text>
                    <Text style={styles.contactValue}>{renterProfile.telefono}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {reservation.messageToHost && (
              <View style={styles.messageSection}>
                <View style={styles.messageHeader}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#0B729D" />
                  <Text style={styles.messageLabel}>Mensaje del arrendatario</Text>
                </View>
                <Text style={styles.messageText}>{reservation.messageToHost}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Fechas y Detalles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Viaje</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#0B729D" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha de inicio</Text>
                <Text style={styles.detailValue}>{formatDate(reservation.startDate.toDate())}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#0B729D" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha de devolución</Text>
                <Text style={styles.detailValue}>{formatDate(reservation.endDate.toDate())}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={20} color="#0B729D" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duración</Text>
                <Text style={styles.detailValue}>{calculateDays()} días</Text>
              </View>
            </View>

            {reservation.pickupLocation && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location-outline" size={20} color="#0B729D" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ubicación de recogida</Text>
                  <Text style={styles.detailValue}>{reservation.pickupLocation}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Map Section */}
        {(reservation.pickupLocation || reservation.deliveryAddress) && (
          <View style={styles.section}>
            <View style={styles.mapHeader}>
              <Ionicons name="location" size={20} color="#0B729D" />
              <Text style={styles.sectionTitle}>
                {reservation.isDelivery ? 'Ubicación de entrega' : 'Ubicación de recogida'}
              </Text>
            </View>
            
            <View style={styles.locationCard}>
              <View style={styles.locationIconWrapper}>
                <Ionicons name="location" size={24} color="#0B729D" />
              </View>
              <View style={styles.locationTextWrapper}>
                <Text style={styles.locationTitle}>
                  {reservation.isDelivery ? 'Dirección de entrega' : 'Punto de recogida'}
                </Text>
                <Text style={styles.locationAddress}>
                  {reservation.isDelivery 
                    ? reservation.deliveryAddress 
                    : (reservation.pickupLocation || 'San Salvador, El Salvador')}
                </Text>
              </View>
            </View>

            <View style={styles.mapContainer}>
              {getCoordinates() ? (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: getCoordinates()!.latitude,
                    longitude: getCoordinates()!.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: getCoordinates()!.latitude,
                      longitude: getCoordinates()!.longitude
                    }}
                    title={reservation.isDelivery ? "Punto de entrega" : "Punto de recogida"}
                    description={reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation}
                  >
                    <View style={styles.customMarker}>
                      <Ionicons name="location" size={40} color="#0B729D" />
                    </View>
                  </Marker>
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.mapPlaceholderTitle}>Mapa no disponible</Text>
                  <Text style={styles.mapPlaceholderSubtitle}>
                    Usa la dirección de arriba para ubicarte
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.directionsActions}>
              {getCoordinates() ? (
                <>
                  <TouchableOpacity 
                    style={styles.directionsButton} 
                    onPress={() => {
                      const coords = getCoordinates();
                      if (coords) {
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
                        );
                      }
                    }}
                  >
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.directionsButtonText}>Cómo llegar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.directionsButtonSecondary}
                    onPress={() => {
                      const coords = getCoordinates();
                      if (coords) {
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
                        );
                      }
                    }}
                  >
                    <Ionicons name="location-outline" size={18} color="#0B729D" />
                    <Text style={styles.directionsButtonSecondaryText}>Ver en mapa</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.directionsButton} 
                  onPress={() => {
                    const address = reservation.isDelivery 
                      ? reservation.deliveryAddress 
                      : (reservation.pickupLocation || 'San Salvador, El Salvador');
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                    );
                  }}
                >
                  <Ionicons name="search" size={18} color="#fff" />
                  <Text style={styles.directionsButtonText}>Buscar en Google Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Timeline Visual - show for confirmed and later statuses */}
        {reservation.status !== 'pending' && reservation.status !== 'denied' && reservation.status !== 'cancelled' && (
          <View style={styles.section}>
            <TripTimeline currentStatus={reservation.status} isRenter={false} />
          </View>
        )}

        {/* Precio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de Precio</Text>
          <View style={styles.priceCard}>
            {reservation.priceBreakdown ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    ${reservation.priceBreakdown.pricePerDay} × {reservation.priceBreakdown.days} días
                  </Text>
                  <Text style={styles.priceValue}>
                    ${reservation.priceBreakdown.subtotal.toFixed(2)}
                  </Text>
                </View>
                {reservation.priceBreakdown.deliveryFee > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tarifa de entrega</Text>
                    <Text style={styles.priceValue}>
                      ${reservation.priceBreakdown.deliveryFee.toFixed(2)}
                    </Text>
                  </View>
                )}
                {reservation.priceBreakdown.serviceFee > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Comisión de servicio</Text>
                    <Text style={styles.priceValue}>
                      ${reservation.priceBreakdown.serviceFee.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.divider} />
              </>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${reservation.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Razón de rechazo si aplica */}
        {reservation.denialReason && (
          <View style={styles.section}>
            <View style={styles.denialCard}>
              <Ionicons name="information-circle" size={20} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.denialTitle}>Razón del rechazo</Text>
                <Text style={styles.denialReason}>{reservation.denialReason}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons (solo si está pendiente) */}
      {reservation.status === 'pending' && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.denyButton}
            onPress={() => setShowDenyModal(true)}
            disabled={processing}
          >
            <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.denyButtonText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={handleAccept}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons para reservas confirmadas */}
      {reservation.status === 'confirmed' && (() => {
        const startDate = reservation.startDate?.toDate();
        const now = new Date();
        const hoursUntilStart = startDate ? (startDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 999;
        const canCheckIn = hoursUntilStart <= 24 && hoursUntilStart >= 0;
        const daysUntil = Math.ceil(hoursUntilStart / 24);

        return (
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.checkInButton, !canCheckIn && styles.buttonDisabled]}
              onPress={() => navigation.navigate('CheckInPreparation', { reservation, isArrendador: true })}
              disabled={!canCheckIn}
            >
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.checkInButtonText}>
                {canCheckIn ? 'Preparar Check-in' : `Check-in en ${daysUntil}d`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Modal de Rechazo */}
      <Modal
        visible={showDenyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDenyModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalOverlay}
            onPress={() => setShowDenyModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rechazar Reserva</Text>
                <TouchableOpacity onPress={() => setShowDenyModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalLabel}>
                  Selecciona el motivo de rechazo:
                </Text>

                {/* Template Options */}
                <View style={styles.templatesContainer}>
                  {denialTemplates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateOption,
                        selectedTemplate === template.id && styles.templateOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedTemplate(template.id);
                        if (template.id !== 'custom') {
                          setDenialReason(template.reason);
                        } else {
                          setDenialReason('');
                        }
                      }}
                    >
                      <View style={[
                        styles.templateRadio,
                        selectedTemplate === template.id && styles.templateRadioSelected
                      ]}>
                        {selectedTemplate === template.id && (
                          <View style={styles.templateRadioInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.templateLabel,
                        selectedTemplate === template.id && styles.templateLabelSelected
                      ]}>
                        {template.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Input - only show if "Otro motivo" is selected */}
                {selectedTemplate === 'custom' && (
                  <>
                    <Text style={styles.modalLabel}>
                      Describe el motivo:
                    </Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Escribe aquí el motivo..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      value={denialReason}
                      onChangeText={setDenialReason}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowDenyModal(false)}
                  disabled={processing}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={handleDeny}
                  disabled={processing || !selectedTemplate || (selectedTemplate === 'custom' && !denialReason.trim())}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Rechazar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  vehicleOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  vehicleInfoCard: {
    padding: 20,
    backgroundColor: '#fff',
  },
  vehicleMainInfo: {
    marginBottom: 12,
  },
  vehicleBrandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vehicleModelText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleYearText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  reservationIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  reservationIdText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  vehicleSection: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginHorizontal: 16,
    marginTop: 16,
  },
  vehicleImageContainer: {
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  vehicleImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
  },
  vehicleOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  vehicleInfoCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  vehicleMainInfo: {
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  renterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  renterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  renterCardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  renterHeader: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  verifiedBadgeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  renterCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  renterInfo: {
    flex: 1,
  },
  renterName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  renterStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#D1D5DB',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  contactSection: {
    padding: 16,
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextWrapper: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  messageSection: {
    padding: 16,
    paddingTop: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0B729D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  contactInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  mapPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  mapPlaceholderSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  directionsActions: {
    flexDirection: 'row',
    gap: 10,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#0B729D',
    borderRadius: 12,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  directionsButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0B729D',
  },
  directionsButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B729D',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B729D',
  },
  denialCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  denialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  denialReason: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  denyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0B729D',
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  templatesContainer: {
    gap: 10,
    marginBottom: 20,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  templateOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  templateRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateRadioSelected: {
    borderColor: '#0B729D',
  },
  templateRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B729D',
  },
  templateLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  templateLabelSelected: {
    fontWeight: '700',
    color: '#0B729D',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
