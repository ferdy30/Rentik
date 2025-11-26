import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HostInfoProps {
  name: string;
  joinedDate: string;
}

export default function HostInfo({ name, joinedDate }: HostInfoProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Anfitrión</Text>
      <View style={styles.hostCard}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostInitials}>{name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.hostName}>{name}</Text>
          <Text style={styles.hostJoined}>{joinedDate}</Text>
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
