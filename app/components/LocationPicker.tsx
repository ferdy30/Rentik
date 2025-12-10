import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { fetchPlaceDetailsById, fetchPlacesAutocomplete } from '../services/places';

interface LocationData {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId: string;
}

interface LocationPickerProps {
  initialLocation?: LocationData;
  onLocationSelected: (location: LocationData) => void;
  title?: string;
  subtitle?: string;
}

export default function LocationPicker({
  initialLocation,
  onLocationSelected,
  title = 'Ubicación',
  subtitle = 'Busca o selecciona en el mapa'
}: LocationPickerProps) {
  const [query, setQuery] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.coordinates.latitude || 13.69294,
    longitude: initialLocation?.coordinates.longitude || -89.21819,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  
  const [marker, setMarker] = useState({
    latitude: initialLocation?.coordinates.latitude || region.latitude,
    longitude: initialLocation?.coordinates.longitude || region.longitude,
  });
  
  const [selectedPlace, setSelectedPlace] = useState<{
    placeId: string;
    formattedAddress: string;
  } | null>(initialLocation ? {
    placeId: initialLocation.placeId,
    formattedAddress: initialLocation.address,
  } : null);

  const mapRef = useRef<MapView>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Efecto para obtener ubicación inicial si no se provee
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Activa la ubicación para encontrar tu dirección actual.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      // Actualizar mapa
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setRegion(newRegion);
      setMarker({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 1000);

      // Reverse geocoding
      await reverseGeocode(latitude, longitude);

    } catch (error) {
      console.log('Error getting location', error);
      Alert.alert('Error', 'No pudimos obtener tu ubicación.');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse && addressResponse.length > 0) {
        const addr = addressResponse[0];
        // Construir dirección legible
        const formattedAddress = [
          addr.street,
          addr.streetNumber,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');

        setQuery(formattedAddress);
        
        // Notificar al padre
        onLocationSelected({
          address: formattedAddress,
          coordinates: { latitude, longitude },
          placeId: `custom-${latitude}-${longitude}` // ID temporal
        });
      }
    } catch (error) {
      console.log('Reverse geocode error', error);
    }
  };

  const onRegionChangeComplete = async (newRegion: Region) => {
    // Solo actualizar si fue por arrastre del usuario (podemos usar un flag o simplemente hacerlo siempre)
    // Actualizamos el marcador al centro
    setMarker({ latitude: newRegion.latitude, longitude: newRegion.longitude });
    
    // Opcional: Reverse geocode al soltar
    // await reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const fetchAutocomplete = async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setPredictions([]);
      return;
    }
    
    try {
      setLoading(true);
      const results = await fetchPlacesAutocomplete(text);
      setPredictions(results);
    } catch (e) {
      console.warn('[LOCATION_PICKER] autocomplete error', e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setLoading(true);
      const result = await fetchPlaceDetailsById(placeId);
      
      if (!result || !result.geometry?.location) {
        Alert.alert('Error', 'No se pudieron obtener los detalles de la ubicación.');
        return null;
      }
      
      const { lat, lng } = result.geometry.location;
      
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      setMarker({ latitude: lat, longitude: lng });
      
      setSelectedPlace({
        placeId,
        formattedAddress: result.formatted_address,
      });

      // Notificar al padre
      onLocationSelected({
        address: result.formatted_address,
        coordinates: { latitude: lat, longitude: lng },
        placeId,
      });

      return { lat, lng };
    } catch (e) {
      console.warn('[LOCATION_PICKER] details error', e);
      Alert.alert('Error', 'No se pudieron obtener los detalles del lugar.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para esta función.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      setMarker({ latitude, longitude });

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }

      // Hacer reverse geocoding para obtener la dirección
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addresses.length > 0) {
          const addr = addresses[0];
          const formattedAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
          setQuery(formattedAddress);
          
          onLocationSelected({
            address: formattedAddress,
            coordinates: { latitude, longitude },
            placeId: '', // No tenemos placeId con ubicación actual
          });
        }
      } catch (e) {
        console.warn('[LOCATION_PICKER] reverse geocoding error', e);
        setQuery('Mi ubicación actual');
        
        onLocationSelected({
          address: 'Mi ubicación actual',
          coordinates: { latitude, longitude },
          placeId: '',
        });
      }
    } catch (error) {
      console.warn('[LOCATION_PICKER] error getting location', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Verifica que tengas GPS activado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrediction = async (p: any) => {
    setQuery(p.description);
    setPredictions([]);
    
    const coords = await fetchPlaceDetails(p.place_id);
    
    if (coords && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      }, 100);
    }
  };

  const handleMarkerDragEnd = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    
    try {
      // Reverse geocoding al arrastrar
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const addr = addresses[0];
        const formattedAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        setQuery(formattedAddress);
        
        onLocationSelected({
          address: formattedAddress,
          coordinates: { latitude, longitude },
          placeId: '',
        });
      } else {
        // Fallback si no hay dirección
        onLocationSelected({
          address: query || 'Ubicación personalizada',
          coordinates: { latitude, longitude },
          placeId: selectedPlace?.placeId || '',
        });
      }
    } catch (error) {
      console.warn('Reverse geocode error on drag', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar dirección..."
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              fetchAutocomplete(text);
            }}
            placeholderTextColor="#9CA3AF"
          />
          {loading && <ActivityIndicator size="small" color="#0B729D" />}
        </View>

        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleGetCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="locate" size={20} color="#0B729D" />
        </TouchableOpacity>
      </View>

      {/* Predictions List */}
      {predictions.length > 0 && (
        <ScrollView style={styles.predictionsContainer} keyboardShouldPersistTaps="handled">
          {predictions.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.predictionItem}
              onPress={() => handleSelectPrediction(p)}
            >
              <Ionicons name="location-outline" size={20} color="#0B729D" />
              <View style={styles.predictionText}>
                <Text style={styles.predictionMain}>{p.structured_formatting?.main_text}</Text>
                <Text style={styles.predictionSecondary}>{p.structured_formatting?.secondary_text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
        >
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={handleMarkerDragEnd}
            title={selectedPlace?.formattedAddress || 'Ubicación seleccionada'}
          />
        </MapView>
        
        {/* Helper Text */}
        <View style={styles.mapHelper}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.mapHelperText}>Arrastra el pin para ajustar la ubicación</Text>
        </View>
      </View>

      {/* Selected Address */}
      {selectedPlace && (
        <View style={styles.selectedAddress}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.selectedAddressText} numberOfLines={2}>
            {selectedPlace.formattedAddress}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  locationButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0B729D',
  },
  predictionsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 13,
    color: '#6B7280',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapHelper: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHelperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
});
