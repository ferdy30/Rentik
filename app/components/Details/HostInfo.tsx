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
      <Text style={styles.sectionTitle}>Anfitrión</Text>
      <View style={styles.hostCard}>
        <View style={styles.hostAvatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={styles.hostInitials}>{name.charAt(0)}</Text>
          )}
        </View>
        <View>
          <Text style={styles.hostName}>{name}</Text>
          <Text style={styles.hostJoined}>{joinedDate}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            {typeof rating === 'number' && rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>⭐</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {typeof completedTrips === 'number' && (
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{completedTrips} {completedTrips === 1 ? 'viaje' : 'viajes'}</Text>
            )}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  hostJoined: {
    fontSize: 14,
    color: '#6B7280',
  },
});
