import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { colors } from '../../constants/colors';
import { fetchPlaceDetailsById, fetchPlacesAutocomplete } from '../../services/places';

// Paso adicional: Dirección (con mapa + Google Places via Cloud Functions)
export default function RegistroAddress({ route, navigation }: any) {
  const prevData = route.params || {};

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const [region, setRegion] = useState<Region>({
    latitude: 13.69294, // San Salvador fallback
    longitude: -89.21819,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [marker, setMarker] = useState({ latitude: region.latitude, longitude: region.longitude });
  const [selectedPlace, setSelectedPlace] = useState<null | {
    placeId: string;
    formattedAddress: string;
    components: any[];
  }>(null);

  // Referencia al mapa para animateToRegion
  const mapRef = React.useRef<MapView>(null);

  // Comentado: dejar que el marcador sea independiente de la región
  // para permitir drag del marcador sin que el mapa lo recentre
  // useEffect(() => {
  //   if (!selectedPlace) {
  //     setMarker({ latitude: region.latitude, longitude: region.longitude });
  //   }
  // }, [region.latitude, region.longitude, selectedPlace]);

  const fetchAutocomplete = async (text: string) => {
    if (!text.trim()) {
      setPredictions([]);
      return;
    }
    try {
      setLoading(true);
      console.log('[PLACES] Buscando:', text);
      const results = await fetchPlacesAutocomplete(text);
      console.log('[PLACES] Resultados:', results.length);
      setPredictions(results);
    } catch (e) {
      console.warn('[PLACES] autocomplete error', e);
      setPredictions([]);
      Alert.alert('Error', 'No se pudo buscar la dirección. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setLoading(true);
      console.log('[PLACES] Obteniendo detalles para:', placeId);
      const result = await fetchPlaceDetailsById(placeId);
      
      if (!result || !result.geometry?.location) {
        Alert.alert('Dirección', 'No pudimos obtener los detalles de la dirección.');
        return null;
      }
      
      const { lat, lng } = result.geometry.location;
      
      // Actualizar región y marcador con animación
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01, // Zoom más cercano al seleccionar
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarker({ latitude: lat, longitude: lng });
      
      setSelectedPlace({
        placeId,
        formattedAddress: result.formatted_address,
        components: result.address_components || [],
      });

      // Retornar las coordenadas para animar el mapa
      return { lat, lng };
    } catch (e) {
      console.warn('[PLACES] details error', e);
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
        Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicación sin permisos.');
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

      // Opcional: hacer geocoding inverso para obtener la dirección
      setQuery('Mi ubicación actual');
    } catch (error) {
      console.warn('[LOCATION] error', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLoading(false);
    }
  };

  const parseComponents = (components: any[]) => {
    const byType = (t: string) => components.find((c) => c.types?.includes(t))?.long_name || '';
    const locality = byType('locality') || byType('sublocality') || byType('administrative_area_level_2');
    return {
      line1: `${byType('route') || ''} ${byType('street_number') || ''}`.trim(),
      line2: byType('sublocality') || '',
      city: locality,
      state: byType('administrative_area_level_1') || '',
      postalCode: byType('postal_code') || '',
      country: byType('country') || '',
    };
  };

  const handleSelectPrediction = async (p: any) => {
    setQuery(p.description);
    setPredictions([]);
    const coords = await fetchPlaceDetails(p.place_id);
    
    // Animar el mapa a la nueva ubicación con las coordenadas correctas
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

  const handleConfirm = () => {
    const address = {
      formatted: selectedPlace?.formattedAddress || query,
      placeId: selectedPlace?.placeId || null,
      ...parseComponents(selectedPlace?.components || []),
      location: { latitude: marker.latitude, longitude: marker.longitude },
    };
    navigation.navigate('RegistroStep3', {
      ...prevData,
      address,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.background.gradientStart, colors.background.gradientEnd]}
        locations={[0.05, 0.82]}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Ionicons name="location-outline" size={48} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Tu dirección</Text>
            <Text style={styles.subtitle}>Búsca tu dirección y ajústala en el mapa</Text>
          </View>

          {/* Botón destacado: Usar ubicación actual */}
          <TouchableOpacity 
            style={styles.currentLocationBtn} 
            onPress={handleGetCurrentLocation}
            disabled={loading}
          >
            <Ionicons name="navigate-circle" size={24} color="#fff" />
            <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
            {loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o busca manualmente</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Buscador */}
          <View style={styles.card}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Ej: Col. Escalón, San Salvador"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  fetchAutocomplete(t);
                }}
              />
            </View>
            {predictions.length > 0 && (
              <View style={{ maxHeight: 200, marginTop: 8 }}>
                {predictions.map((item) => (
                  <TouchableOpacity 
                    key={item.place_id} 
                    style={styles.predictionItem} 
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <Ionicons name="location" size={18} color={colors.primary} />
                    <Text style={styles.predictionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Mapa */}
          <View style={[styles.card, { overflow: 'hidden' }]}> 
            <MapView
              ref={mapRef}
              style={{ height: 240, width: '100%' }}
              region={region}
              onRegionChangeComplete={setRegion}
            >
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => {
                  setMarker(e.nativeEvent.coordinate);
                  // Limpiar selectedPlace cuando el usuario arrastra manualmente
                  setSelectedPlace(null);
                }}
              />
            </MapView>
            <Text style={[styles.infoText, { marginTop: 8 }]}>
              {selectedPlace 
                ? `📍 ${selectedPlace.formattedAddress}`
                : 'Arrastra el pin para ajustar la ubicación exacta'
              }
            </Text>
          </View>

          {/* Confirmar */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
            <Text style={styles.primaryText}>Confirmar dirección</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  backButton: { position: 'absolute', left: 0, top: 10, padding: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 6 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  currentLocationBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    paddingHorizontal: 20,
    borderRadius: 14, 
    marginBottom: 16,
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    elevation: 4 
  },
  currentLocationText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
    marginLeft: 8
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.3)' 
  },
  dividerText: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 13, 
    marginHorizontal: 12,
    fontWeight: '500'
  },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#111827' },
  locationButton: { padding: 4 },
  predictionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  predictionText: { color: '#111827' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10 },
  infoText: { color: '#374151', fontSize: 12 },
  primaryBtn: { height: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
