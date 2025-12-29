import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Clipboard,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Reservation } from '../services/reservations';
import { calculateDaysBetween, formatDate, isPast } from '../utils/date';

interface UserProfile {
  nombre: string;
  email: string;
  photoURL?: string;
  telefono?: string;
  createdAt?: any;
  completedTrips?: number;
  rating?: number;
}

interface ReservationCardProps {
  reservation: Reservation;
  userProfile?: UserProfile;
  onConfirm?: () => void;
  onDeny?: () => void;
  onChat?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onViewDetails?: () => void;
  onCheckIn?: () => void;
  isProcessing?: boolean;
  isLoadingChat?: boolean;
  isDeleting?: boolean;
}

export default function ReservationCard({
  reservation,
  userProfile,
  onConfirm,
  onDeny,
  onChat,
  onDelete,
  onArchive,
  onViewDetails,
  onCheckIn,
  isProcessing,
  isLoadingChat,
  isDeleting,
}: ReservationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [countdown, setCountdown] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Vehicle info
  const vehicleName = reservation.vehicleSnapshot
    ? `${reservation.vehicleSnapshot.marca} ${reservation.vehicleSnapshot.modelo}`
    : 'Vehículo';
  const vehicleImage = reservation.vehicleSnapshot?.imagen || null;

  // Status config
  const getStatusConfig = () => {
    switch (reservation.status) {
      case 'pending':
        return { label: 'Pendiente', color: '#FEF9C3', textColor: '#854D0E', icon: 'time' };
      case 'confirmed':
        return { label: 'Confirmada', color: '#DBEAFE', textColor: '#1E40AF', icon: 'checkmark-circle' };
      case 'completed':
        return { label: 'Completada', color: '#DCFCE7', textColor: '#166534', icon: 'checkmark-done-circle' };
      case 'cancelled':
        return { label: 'Cancelada', color: '#FEE2E2', textColor: '#991B1B', icon: 'close-circle' };
      case 'denied':
        return { label: 'Rechazada', color: '#FEE2E2', textColor: '#991B1B', icon: 'ban' };
      default:
        return { label: reservation.status, color: '#F3F4F6', textColor: '#374151', icon: 'information-circle' };
    }
  };

  const statusInfo = getStatusConfig();

  // Time calculations
  const now = new Date();
  const startDate = reservation.startDate.toDate();
  const endDate = reservation.endDate.toDate();
  const days = calculateDaysBetween(startDate, endDate);
  
  // Check if new (less than 24 hours)
  const createdAt = reservation.createdAt?.toDate() || startDate;
  const isNew = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) <= 24;

  // Format delivery and return times - use pickupTime/returnTime if available
  const formatTimeFromISO = (isoString?: string, fallbackDate?: Date): string => {
    if (isoString) {
      return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (fallbackDate) {
      return fallbackDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return '00:00';
  };

  const deliveryTime = formatTimeFromISO(reservation.pickupTime, startDate);
  const returnTime = formatTimeFromISO(reservation.returnTime, endDate);
  const deliveryDate = formatDate(startDate);
  const returnDate = formatDate(endDate);
  const isUpcoming = !isPast(startDate);
  
  // Calculate hours/days until start
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilStart = Math.ceil(hoursUntilStart / 24);
  const isStartingSoon = isUpcoming && hoursUntilStart <= 24 && hoursUntilStart > 0;
  const isUrgent = isUpcoming && daysUntilStart <= 3 && daysUntilStart > 0;

  // Pulse animation for new badge
  useEffect(() => {
    if (isNew && reservation.status === 'pending') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isNew, reservation.status]);

  // Countdown en tiempo real
  useEffect(() => {
    if (!isStartingSoon || reservation.status !== 'confirmed') return;
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = startDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('¡Ahora!');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${minutes}m`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [isStartingSoon, startDate, reservation.status]);

  // Price breakdown
  const priceBreakdown = reservation.priceBreakdown;

  // Vehicle images for gallery
  const vehicleImages = reservation.vehicleSnapshot?.imagen 
    ? [reservation.vehicleSnapshot.imagen]
    : [];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleCall = () => {
    if (userProfile?.telefono) {
      Linking.openURL(`tel:${userProfile.telefono}`);
    }
  };

  const handleWhatsApp = () => {
    if (userProfile?.telefono) {
      const phone = userProfile.telefono.replace(/[^0-9]/g, '');
      const message = `Hola ${userProfile.nombre}, te contacto por la reserva del ${vehicleName}`;
      Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      Clipboard.setString(address);
      Alert.alert('✓ Copiado', 'Dirección copiada al portapapeles');
    }
  };

  // Coordenadas y dirección reutilizables
  const coords = reservation.deliveryCoords || reservation.pickupCoords;
  const address = reservation.deliveryAddress || reservation.pickupLocation || 'Ubicación';

  const handleNavigationOptions = () => {
    if (!coords) return;
    const { latitude, longitude } = coords;

    Alert.alert(
      '🗺️ Navegar con',
      'Selecciona tu aplicación preferida',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?q=${latitude},${longitude}`,
              android: `google.navigation:q=${latitude},${longitude}`
            });
            Linking.openURL(url || `https://maps.google.com/?q=${latitude},${longitude}`);
          }
        },
        {
          text: 'Waze',
          onPress: () => {
            Linking.openURL(`waze://?ll=${latitude},${longitude}&navigate=yes`);
          }
        },
        Platform.OS === 'ios' && {
          text: 'Apple Maps',
          onPress: () => {
            Linking.openURL(`maps://app?daddr=${latitude},${longitude}`);
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ].filter(Boolean) as any
    );
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Hero Image Section */}
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.imageContainer}>
          {vehicleImage ? (
            <>
              <Image
                source={{ uri: vehicleImage }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.imageGradient} />
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="car-sport" size={48} color="#9CA3AF" />
            </View>
          )}
          
          {/* Status Badge on Image */}
          <View style={[styles.statusBadgeOverlay, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.textColor} />
            <Text style={[styles.statusTextOverlay, { color: statusInfo.textColor }]}>{statusInfo.label}</Text>
          </View>

          {/* New Badge */}
          {isNew && reservation.status === 'pending' && (
            <Animated.View style={[styles.newBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text style={styles.newBadgeText}>NUEVA</Text>
            </Animated.View>
          )}

          {/* Urgent/Soon Badge con Countdown */}
          {isStartingSoon && reservation.status === 'confirmed' && (
            <View style={styles.urgentBadge}>
              <Ionicons name="alarm" size={14} color="#fff" />
              <Text style={styles.urgentBadgeText}>
                {countdown || '¡Empieza hoy!'}
              </Text>
            </View>
          )}
          {isUrgent && reservation.status === 'confirmed' && !isStartingSoon && (
            <View style={styles.soonBadge}>
              <Ionicons name="time" size={14} color="#fff" />
              <Text style={styles.soonBadgeText}>{`En ${daysUntilStart} días`}</Text>
            </View>
          )}

          {/* Vehicle Title on Image */}
          <View style={styles.vehicleInfoOverlay}>
            <Text style={styles.vehicleNameOverlay} numberOfLines={1}>{vehicleName}</Text>
            <View style={styles.dateRowOverlay}>
              <Ionicons name="calendar-outline" size={14} color="#fff" />
              <Text style={styles.dateTextOverlay}>
                {formatDate(startDate)} - {formatDate(endDate)}
              </Text>
              <Text style={styles.daysTextOverlay}>
                {`• ${days} ${days === 1 ? 'día' : 'días'}`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Renter Profile */}
        <View style={styles.renterSection}>
          <View style={styles.renterRow}>
            <View style={styles.avatarContainer}>
              {userProfile?.photoURL ? (
                <Image
                  source={{ uri: userProfile.photoURL }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userProfile?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {/* Verification badge */}
              {userProfile && userProfile.completedTrips && userProfile.completedTrips > 0 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.renterInfo}>
              <View style={styles.renterNameRow}>
                <Text style={styles.renterName}>{userProfile?.nombre || 'Usuario'}</Text>
              </View>
              <View style={styles.renterMeta}>
                {userProfile?.rating && userProfile.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{userProfile.rating.toFixed(1)}</Text>
                  </View>
                )}
                {userProfile?.completedTrips !== undefined && (
                  <Text style={styles.tripsText}>
                    {`${userProfile.completedTrips} ${userProfile.completedTrips === 1 ? 'viaje' : 'viajes'}`}
                  </Text>
                )}
              </View>
            </View>
            {userProfile?.telefono && (
              <TouchableOpacity style={styles.phoneButton} onPress={handleCall}>
                <Ionicons name="call" size={18} color="#0B729D" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Message from Renter */}
        {reservation.messageToHost && (
          <View style={styles.messageSection}>
            <View style={styles.messageHeader}>
              <View style={styles.messageIconCircle}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#0B729D" />
              </View>
              <Text style={styles.messageTitle}>Mensaje del arrendatario</Text>
            </View>
            <Text style={styles.messageText} numberOfLines={expanded ? undefined : 3}>
              {reservation.messageToHost}
            </Text>
            {reservation.messageToHost.length > 100 && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMoreText}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Extras */}
        {reservation.extras && Object.values(reservation.extras).some(v => v) && (
          <View style={styles.extrasSection}>
            <Text style={styles.extrasLabel}>Extras incluidos</Text>
            <View style={styles.extrasChips}>
              {reservation.extras.babySeat && (
                <View style={styles.extraChip}>
                  <Ionicons name="person-outline" size={12} color="#0B729D" />
                  <Text style={styles.extraChipText}>Silla bebé</Text>
                </View>
              )}
              {reservation.extras.insurance && (
                <View style={styles.extraChip}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#0B729D" />
                  <Text style={styles.extraChipText}>Seguro</Text>
                </View>
              )}
              {reservation.extras.gps && (
                <View style={styles.extraChip}>
                  <Ionicons name="navigate-outline" size={12} color="#0B729D" />
                  <Text style={styles.extraChipText}>GPS</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Price Section */}
        <TouchableOpacity
          style={styles.priceSection}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.priceLabel}>Total a recibir</Text>
              <Text style={styles.priceAmount}>{`$${reservation.totalPrice.toFixed(2)}`}</Text>
            </View>
            <View style={styles.expandButton}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#16A34A"
              />
            </View>
          </View>
          {expanded && priceBreakdown && (
            <View style={styles.priceBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {`${priceBreakdown.days} días × $${priceBreakdown.pricePerDay}`}
                </Text>
                <Text style={styles.breakdownValue}>
                  {`$${(priceBreakdown.days * priceBreakdown.pricePerDay).toFixed(2)}`}
                </Text>
              </View>
              {priceBreakdown.deliveryFee && priceBreakdown.deliveryFee > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Tarifa de entrega</Text>
                  <Text style={styles.breakdownValue}>{`$${priceBreakdown.deliveryFee.toFixed(2)}`}</Text>
                </View>
              )}
              {priceBreakdown.extrasTotal && priceBreakdown.extrasTotal > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Extras</Text>
                  <Text style={styles.breakdownValue}>{`$${priceBreakdown.extrasTotal.toFixed(2)}`}</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownTotalLabel}>Total</Text>
                <Text style={styles.breakdownTotalValue}>{`$${reservation.totalPrice.toFixed(2)}`}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions Section */}
        {reservation.status === 'pending' && (
          <View style={styles.actionsSection}>
            {/* Quick Actions for Pending */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.denyQuickButton]}
                onPress={onDeny}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                    <Text style={styles.denyQuickButtonText}>Rechazar</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, styles.acceptQuickButton]}
                onPress={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.acceptQuickButtonText}>Aceptar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {/* View More Button */}
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.actionButton, styles.viewMoreButton]}
                onPress={onViewDetails}
                disabled={isProcessing}
              >
                <Ionicons name="eye" size={20} color="#0B729D" />
                <Text style={[styles.actionButtonText, { color: '#0B729D' }]}>Ver detalles completos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {reservation.status === 'confirmed' && (
          <View style={styles.actionsSection}>
            {/* Countdown/Status Info */}
            {isStartingSoon ? (
              <View style={styles.upcomingAlert}>
                <Ionicons name="alarm" size={20} color="#F59E0B" />
                <Text style={styles.upcomingAlertText}>
                  {countdown ? `Comienza en ${countdown}` : '¡Comienza pronto!'}
                </Text>
              </View>
            ) : (
              <View style={styles.upcomingInfo}>
                <Ionicons name="calendar-outline" size={18} color="#0B729D" />
                <Text style={styles.upcomingInfoText}>
                  Comienza {formatDate(startDate)}
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.quickActionsRow}>
              {onChat && (
                <TouchableOpacity
                  style={[styles.quickActionButton, styles.chatQuickButton]}
                  onPress={onChat}
                  disabled={isLoadingChat}
                >
                  {isLoadingChat ? (
                    <ActivityIndicator size="small" color="#0B729D" />
                  ) : (
                    <>
                      <Ionicons name="chatbubbles" size={20} color="#0B729D" />
                      <Text style={styles.chatQuickButtonText}>Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.actionButton, styles.viewMoreButton]}
                onPress={onViewDetails}
              >
                <Ionicons name="eye" size={20} color="#0B729D" />
                <Text style={[styles.actionButtonText, { color: '#0B729D' }]}>Ver detalles completos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {['completed', 'cancelled', 'denied'].includes(reservation.status) && (
          <>
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.actionButton, styles.viewDetailsButton]}
                onPress={onViewDetails}
              >
                <Ionicons name="eye-outline" size={20} color="#0B729D" />
                <Text style={[styles.actionButtonText, { color: '#0B729D' }]}>Ver detalles</Text>
              </TouchableOpacity>
            )}
            {(reservation.status === 'cancelled' || reservation.status === 'denied') && (onArchive || onDelete) && (
              <View style={styles.secondaryActions}>
                {onArchive && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onArchive}
                    disabled={isDeleting}
                  >
                    <Ionicons name="archive-outline" size={18} color="#6B7280" />
                    <Text style={styles.secondaryButtonText}>Archivar</Text>
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: '#FEE2E2' }]}
                    onPress={onDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                        <Text style={[styles.secondaryButtonText, { color: '#DC2626' }]}>Eliminar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextOverlay: {
    fontSize: 12,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    position: 'absolute',
    top: 56,
    left: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  soonBadge: {
    position: 'absolute',
    top: 56,
    left: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  vehicleInfoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  vehicleNameOverlay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  dateRowOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTextOverlay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  daysTextOverlay: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  contentSection: {
    padding: 16,
  },
  renterSection: {
    marginBottom: 16,
  },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B729D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  renterInfo: {
    flex: 1,
  },
  renterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  renterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  renterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  tripsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B729D',
    marginTop: 6,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  // Map section styles
  mapSection: {
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mapTapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapTapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B729D',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Times section styles
  timesSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeIconContainer: {
    marginBottom: 10,
  },
  timeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContent: {
    gap: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B729D',
  },
  extrasSection: {
    marginBottom: 16,
  },
  extrasLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  extrasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  extraChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B729D',
  },
  priceSection: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16A34A',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#166534',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 10,
    marginTop: 6,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  actionsSection: {
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  denyQuickButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  denyQuickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptQuickButton: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  acceptQuickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  checkInQuickButton: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkInQuickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  chatQuickButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B729D',
  },
  chatQuickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B729D',
  },
  upcomingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  upcomingAlertText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  upcomingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  upcomingInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  checkInButton: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
  viewMoreButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0B729D',
  },
  chatButtonFull: {
    flex: 1,
    backgroundColor: '#0B729D',
  },
  viewDetailsButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0B729D',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});
