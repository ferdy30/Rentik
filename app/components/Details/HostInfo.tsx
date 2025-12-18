import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface HostInfoProps {
  name: string;
  joinedDate: string;
  photoURL?: string;
  rating?: number;
  completedTrips?: number;
}

export default function HostInfo({ name, joinedDate, photoURL, rating, completedTrips }: HostInfoProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Tu anfitrión</Text>
      <View style={styles.hostCard}>
        <View style={styles.hostHeader}>
          <View style={styles.hostAvatar}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%', borderRadius: 35 }} />
            ) : (
              <Text style={styles.hostInitials}>{name.charAt(0)}</Text>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>{name}</Text>
            <Text style={styles.hostJoined}>{joinedDate}</Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          {typeof rating === 'number' && rating > 0 && (
            <View style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Ionicons name="star" size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Calificación</Text>
              </View>
            </View>
          )}
          {typeof completedTrips === 'number' && (
            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="car-sport" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.statValue}>{completedTrips}</Text>
                <Text style={styles.statLabel}>{completedTrips === 1 ? 'Viaje' : 'Viajes'}</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.responseInfo}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.responseText}>Responde en menos de 1 hora</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  hostCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hostAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B7280',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  hostJoined: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  responseText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
