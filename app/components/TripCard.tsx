import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { canDeleteTrip, getStatusConfig, shouldShowReason } from '../constants/tripStatus';
import { Reservation } from '../services/reservations';
import { calculateDaysBetween, formatDate, formatTimeUntil, isPast } from '../utils/date';

interface TripCardProps {
  reservation: Reservation;
  onPress: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isDeleting?: boolean;
  onQuickAction?: (action: 'chat' | 'navigate' | 'checkin') => void;
}

export default function TripCard({ 
  reservation, 
  onPress, 
  onDelete, 
  onArchive, 
  isDeleting,
  onQuickAction
}: TripCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Memoize expensive calculations
  const tripDetails = useMemo(() => {
    const startDate = reservation.startDate.toDate();
    const endDate = reservation.endDate.toDate();
    const now = new Date();
    const createdAt = reservation.createdAt?.toDate() || startDate;
    
    const days = calculateDaysBetween(startDate, endDate);
    const isUpcoming = !isPast(startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isStartingSoon = isUpcoming && hoursUntilStart <= 24 && hoursUntilStart > 0;
    const isNew = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) <= 24;
    
    const isActive = reservation.status === 'confirmed';
    const isPending = reservation.status === 'pending';
    const isCompleted = reservation.status === 'completed';
    
    const timeRemaining = isActive && isUpcoming ? formatTimeUntil(endDate) : null;
    
    // Calculate progress for active trips
    const tripProgress = isActive ? (() => {
      const total = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    })() : 0;
    
    return {
      days,
      isActive,
      isPending,
      isCompleted,
      isUpcoming,
      isStartingSoon,
      isNew,
      hoursUntilStart,
      timeRemaining,
      tripProgress,
      startDate,
      endDate,
    };
  }, [reservation.startDate, reservation.endDate, reservation.status, reservation.createdAt]);

  const statusInfo = getStatusConfig(reservation.status);
  const vehicleName = reservation.vehicleSnapshot 
    ? `${reservation.vehicleSnapshot.marca} ${reservation.vehicleSnapshot.modelo} ${reservation.vehicleSnapshot.anio}`
    : 'Vehículo';
  const showReason = shouldShowReason(reservation.status as any) && 
    (reservation.denialReason || reservation.cancellationReason);
  const showActions = canDeleteTrip(reservation.status as any);
  const vehicleImage = reservation.vehicleSnapshot?.imagen || null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
          {vehicleImage && (
            <>
              <Image
                source={{ uri: vehicleImage }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.imageGradient} />
            </>
          )}
          
          {/* Overlays on image */}
          <View style={styles.imageOverlay}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.textColor} />
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.label}
              </Text>
            </View>

            {/* New Badge */}
            {tripDetails.isNew && !tripDetails.isCompleted && (
              <View style={styles.newBadge}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.newBadgeText}>Nuevo</Text>
              </View>
            )}
          </View>

          {/* Price Highlight */}
          <View style={styles.priceOverlay}>
            <Text style={styles.priceAmount}>${reservation.totalPrice.toFixed(0)}</Text>
            <Text style={styles.priceLabel}>total • {tripDetails.days}d</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={1}>{vehicleName}</Text>
            
          {/* Starting Soon Alert */}
          {tripDetails.isStartingSoon && (
            <View style={styles.alertBanner}>
              <Ionicons name="alarm-outline" size={16} color="#DC2626" />
              <Text style={styles.alertText}>
                Comienza en {Math.floor(tripDetails.hoursUntilStart)}h
              </Text>
            </View>
          )}

          {/* Progress Bar for Active Trips */}
          {tripDetails.isActive && tripDetails.tripProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso del viaje</Text>
                <Text style={styles.progressPercentage}>{Math.floor(tripDetails.tripProgress)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${tripDetails.tripProgress}%` }]} />
              </View>
              {tripDetails.timeRemaining && (
                <Text style={styles.timeRemainingText}>
                  <Ionicons name="time-outline" size={12} color="#0B729D" /> {tripDetails.timeRemaining} restantes
                </Text>
              )}
            </View>
          )}

          {/* Timeline for Pending/Confirmed */}
          {(tripDetails.isPending || (tripDetails.isActive && !tripDetails.isUpcoming)) && (
            <View style={styles.timeline}>
              <View style={[styles.timelineStep, styles.timelineStepComplete]}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineText}>Solicitado</Text>
              </View>
              <View style={styles.timelineLine} />
              <View style={[styles.timelineStep, tripDetails.isActive && styles.timelineStepComplete]}>
                <View style={[styles.timelineDot, !tripDetails.isActive && styles.timelineDotInactive]} />
                <Text style={[styles.timelineText, !tripDetails.isActive && styles.timelineTextInactive]}>
                  {tripDetails.isActive ? 'En progreso' : 'Pendiente'}
                </Text>
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineStep}>
                <View style={styles.timelineDotInactive} />
                <Text style={styles.timelineTextInactive}>Completado</Text>
              </View>
            </View>
          )}
      
          {/* Dates */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={16} color="#0B729D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Fechas</Text>
              <Text style={styles.infoValue}>
                {formatDate(tripDetails.startDate, 'short')} - {formatDate(tripDetails.endDate, 'short')}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, reservation.isDelivery && styles.iconCircleHighlight]}>
              <Ionicons 
                name={reservation.isDelivery ? "car-sport" : "location"} 
                size={16} 
                color={reservation.isDelivery ? "#FFF" : "#0B729D"} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>
                {reservation.isDelivery ? 'Entrega a domicilio' : 'Punto de recogida'}
              </Text>
              <Text style={[styles.infoValue, reservation.isDelivery && styles.deliveryText]} numberOfLines={1}>
                {reservation.isDelivery 
                  ? reservation.deliveryAddress
                  : (reservation.pickupLocation || 'Por confirmar')}
              </Text>
            </View>
          </View>

          {/* Expandable Price Breakdown */}
          <TouchableOpacity 
            style={styles.priceBreakdownToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="receipt-outline" size={16} color="#0B729D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Desglose de precio</Text>
              <Text style={styles.priceHighlight}>
                ${reservation.totalPrice.toFixed(2)}
              </Text>
            </View>
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          {expanded && reservation.priceBreakdown && (
            <View style={styles.priceBreakdownContent}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Renta ({reservation.priceBreakdown.days}d × ${reservation.priceBreakdown.pricePerDay})</Text>
                <Text style={styles.breakdownValue}>${(reservation.priceBreakdown.days * reservation.priceBreakdown.pricePerDay).toFixed(2)}</Text>
              </View>
              {reservation.priceBreakdown.extrasTotal > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Extras</Text>
                  <Text style={styles.breakdownValue}>${reservation.priceBreakdown.extrasTotal.toFixed(2)}</Text>
                </View>
              )}
              {reservation.priceBreakdown.deliveryFee > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery</Text>
                  <Text style={styles.breakdownValue}>${reservation.priceBreakdown.deliveryFee.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Servicio Rentik</Text>
                <Text style={styles.breakdownValue}>${reservation.priceBreakdown.serviceFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownTotalLabel}>Total</Text>
                <Text style={styles.breakdownTotalValue}>${reservation.priceBreakdown.total.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Reason for cancellation/denial */}
        {showReason && (
          <View style={styles.reasonContainer}>
            <View style={styles.reasonHeader}>
              <Ionicons name="information-circle" size={16} color="#DC2626" />
              <Text style={styles.reasonTitle}>
                {reservation.status === 'denied' ? 'Motivo del rechazo:' : 'Motivo de cancelación:'}
              </Text>
            </View>
            <Text style={styles.reasonText}>
              {reservation.denialReason || reservation.cancellationReason}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Actions */}
      {(isActive || isPending) && onQuickAction && (
        <View style={styles.quickActionsContainer}>
          {/* Chat Action */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionPrimary]}
            onPress={() => onQuickAction('chat')}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble" size={18} color="#FFF" />
            <Text style={styles.quickActionPrimaryText}>Chat</Text>
          </TouchableOpacity>
          
          {/* Check-in/Navigate for active trips */}
          {isActive && isStartingSoon && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionHighlight]}
              onPress={() => onQuickAction('checkin')}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.quickActionHighlightText}>Check-in</Text>
            </TouchableOpacity>
          )}

          {isActive && !isStartingSoon && (
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={18} color="#0B729D" />
              <Text style={styles.quickActionText}>Más info</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Completed Trip - Review Prompt */}
      {isCompleted && (
        <View style={styles.reviewPrompt}>
          <Ionicons name="star-outline" size={20} color="#F59E0B" />
          <Text style={styles.reviewPromptText}>¿Cómo estuvo tu experiencia?</Text>
          <TouchableOpacity style={styles.reviewButton} activeOpacity={0.7}>
            <Text style={styles.reviewButtonText}>Calificar</Text>
            <Ionicons name="arrow-forward" size={14} color="#0B729D" />
          </TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      {showActions && (onArchive || onDelete) && (
        <View style={styles.actionsContainer}>
          {onArchive && (
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={onArchive}
              disabled={isDeleting}
            >
              <Ionicons name="archive-outline" size={18} color="#757575" />
              <Text style={styles.archiveButtonText}>Archivar</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
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
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: -2,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B729D',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B729D',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0B729D',
    borderRadius: 3,
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 4,
  },
  timelineStepComplete: {
    opacity: 1,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  timelineDotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  timelineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  timelineTextInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleHighlight: {
    backgroundColor: '#0B729D',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  deliveryText: {
    color: '#0B729D',
  },
  priceBreakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 4,
  },
  priceHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B729D',
  },
  priceBreakdownContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownTotal: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B729D',
  },
  reasonContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  reasonText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#0B729D',
  },
  quickActionPrimary: {
    backgroundColor: '#0B729D',
    borderWidth: 0,
  },
  quickActionHighlight: {
    backgroundColor: '#10B981',
    borderWidth: 0,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B729D',
  },
  quickActionPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  quickActionHighlightText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  reviewPromptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0B729D',
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B729D',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
    flexDirection: 'row',
    gap: 8,
  },
  archiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    gap: 6,
  },
  archiveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
