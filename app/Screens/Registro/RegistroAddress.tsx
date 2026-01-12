import { Ionicons } from '@expo/vector-icons';
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
import { LazyMapView as MapView, LazyMarker as Marker, type Region } from '../../components/LazyMap';
import { colors } from '../../constants/colors';
import { typography } from '../constants/typography';
import { fetchPlaceDetailsById, fetchPlacesAutocomplete } from '../../services/places';

// Paso adicional: Direcci�n (con mapa + Google Places via Cloud Functions)
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
      Alert.alert('Error', 'No se pudo buscar la direcci�n. Verifica tu conexi�n.');
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
        Alert.alert('Direcci�n', 'No pudimos obtener los detalles de la direcci�n.');
        return null;
      }
      
      const { lat, lng } = result.geometry.location;
      
      // Actualizar regi�n y marcador con animaci�n
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01, // Zoom m�s cercano al seleccionar
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
        Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicaci�n sin permisos.');
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

      // Opcional: hacer geocoding inverso para obtener la direcci�n
      setQuery('Mi ubicaci�n actual');
    } catch (error) {
      console.warn('[LOCATION] error', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicaci�n.');
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
    
    // Animar el mapa a la nueva ubicaci�n con las coordenadas correctas
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
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Paso 2 de 3</Text>
            <Ionicons name="location-outline" size={48} color={colors.primary} style={{ marginVertical: 8 }} />
            <Text style={styles.title}>Tu Direcci�n</Text>
            <Text style={styles.subtitle}>Para validar tu identidad</Text>
          </View>

          {/* Bot�n destacado: Usar ubicaci�n actual */}
          <TouchableOpacity 
            style={styles.currentLocationBtn} 
            onPress={handleGetCurrentLocation}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="navigate" size={24} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.currentLocationText}>Usar mi ubicaci�n actual</Text>
              <Text style={styles.currentLocationSubtext}>Detectar autom�ticamente</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            )}
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O ingresa manualmente</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Buscador */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Buscar direcci�n</Text>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color="#BDBDBD" />
              <TextInput
                style={styles.searchInput}
                placeholder="Ej: Col. Escal�n, San Salvador"
                placeholderTextColor="#BDBDBD"
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  fetchAutocomplete(t);
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); }}>
                  <Ionicons name="close-circle" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              )}
            </View>
            {predictions.length > 0 && (
              <View style={styles.predictionsContainer}>
                {predictions.map((item) => (
                  <TouchableOpacity 
                    key={item.place_id} 
                    style={styles.predictionItem} 
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <View style={styles.predictionIcon}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.predictionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Mapa */}
          <View style={styles.mapCard}> 
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Confirmar ubicaci�n</Text>
              <Text style={styles.mapSubtitle}>Arrastra el pin si es necesario</Text>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
              >
                <Marker
                  coordinate={marker}
                  draggable
                  onDragEnd={(e) => {
                    setMarker(e.nativeEvent.coordinate);
                    setSelectedPlace(null);
                  }}
                />
              </MapView>
              {/* Overlay de direcci�n seleccionada */}
              <View style={styles.addressOverlay}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.addressOverlayText} numberOfLines={1}>
                  {selectedPlace 
                    ? selectedPlace.formattedAddress
                    : 'Ubicaci�n seleccionada en el mapa'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Confirmar */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
            <Text style={styles.primaryText}>Confirmar Direcci�n</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  
  // Header & Progress
  header: { alignItems: 'center', marginBottom: 32 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 8, zIndex: 10 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },
  progressDotActive: { backgroundColor: colors.primary, transform: [{ scale: 1.2 }] },
  progressDotDone: { backgroundColor: colors.primary },
  progressLine: { width: 30, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  progressLineDone: { backgroundColor: colors.primary },
  
  stepText: { color: colors.primary, fontSize: 13, fontFamily: typography.fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: typography.fonts.bold, color: '#333333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#757575', marginTop: 4, textAlign: 'center' },

  // Current Location Button
  currentLocationBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  currentLocationText: { 
    color: '#333333', 
    fontSize: 16, 
    fontFamily: typography.fonts.semiBold,
  },
  currentLocationSubtext: {
    color: '#757575',
    fontSize: 12,
    marginTop: 2
  },

  // Divider
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#E0E0E0' 
  },
  dividerText: { 
    color: '#BDBDBD', 
    fontSize: 12, 
    marginHorizontal: 12,
    fontFamily: typography.fonts.medium,
    textTransform: 'uppercase'
  },

  // Search Card
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 0, 
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.semiBold,
    color: '#424242',
    marginBottom: 8
  },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FAFAFA',
    borderRadius: 12, 
    paddingHorizontal: 12, 
    height: 48
  },
  searchInput: { 
    flex: 1, 
    color: '#333333',
    fontSize: 15,
    marginLeft: 8
  },
  predictionsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
    paddingTop: 4
  },
  predictionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5' 
  },
  predictionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  predictionText: { 
    flex: 1,
    color: '#4B5563',
    fontSize: 14
  },

  // Map Card
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mapHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA'
  },
  mapTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#333333'
  },
  mapSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2
  },
  mapContainer: {
    height: 250,
    width: '100%',
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  addressOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  addressOverlayText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#424242',
    fontFamily: typography.fonts.medium
  },

  // Primary Button
  primaryBtn: { 
    flexDirection: 'row',
    height: 56, 
    borderRadius: 16, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6,
    marginBottom: 20
  },
  primaryText: { 
    color: '#fff', 
    fontSize: 16, 
    fontFamily: typography.fonts.bold,
    marginRight: 8
  },
});
