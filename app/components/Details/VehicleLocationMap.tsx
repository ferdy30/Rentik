import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

interface VehicleLocationMapProps {
  coordinates?: { latitude: number; longitude: number };
  ubicacion: string;
}

export default function VehicleLocationMap({ coordinates, ubicacion }: VehicleLocationMapProps) {
  if (!coordinates) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Ubicación de recogida</Text>
        <View style={styles.locationCard}>
          <Ionicons name="location-outline" size={24} color="#0B729D" />
          <Text style={styles.locationText}>{ubicacion}</Text>
        </View>
      </View>
    );
  }

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Ubicación de recogida</Text>
        <TouchableOpacity onPress={handleOpenMaps} style={styles.directionsButton}>
          <Ionicons name="navigate" size={16} color="#0B729D" />
          <Text style={styles.directionsText}>Abrir en Maps</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={coordinates}>
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
            </View>
          </Marker>
        </MapView>
        
        <View style={styles.locationOverlay}>
          <Ionicons name="location-outline" size={18} color="#374151" />
          <Text style={styles.locationText} numberOfLines={1}>{ubicacion}</Text>
        </View>
      </View>
      
      <Text style={styles.locationNote}>
        La ubicación exacta se compartirá después de la reserva
      </Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B729D',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B729D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  locationNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
