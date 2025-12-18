import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { fetchPlaceDetailsById, fetchPlacesAutocomplete } from '../../services/places';
import { getDeliveryDetails } from '../../utils/distance';

const DEFAULT_REGION = {
    latitude: 13.6929,
    longitude: -89.2182,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export default function BookingStep2Location() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate } = route.params;
    const mapRef = useRef<MapView>(null);
    
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
    const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [deliveryDistance, setDeliveryDistance] = useState('');

    const handleUseCurrentLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para usar esta función.');
                setIsLocating(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            // Reverse geocoding to get address
            const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (addresses.length > 0) {
                const addr = addresses[0];
                const formattedAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
                setDeliveryAddress(formattedAddress);
            } else {
                setDeliveryAddress(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
            }

            setDeliveryCoords({ latitude, longitude });
            
            // Calculate delivery cost if vehicle has coordinates
            if (vehicle.coordinates) {
                const deliveryDetails = getDeliveryDetails(
                    vehicle.coordinates,
                    { latitude, longitude }
                );
                setDeliveryCost(deliveryDetails.cost);
                setDeliveryDistance(deliveryDetails.distanceText);
            }
            
            setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

            // Animate map to location
            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
        } finally {
            setIsLocating(false);
        }
    };

    const handleMapPress = (event: any) => {
        if (deliveryType === 'delivery') {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            setDeliveryCoords({ latitude, longitude });
            setDeliveryAddress(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
            setShowSuggestions(false);
            
            // Calculate delivery cost if vehicle has coordinates
            if (vehicle.coordinates) {
                const deliveryDetails = getDeliveryDetails(
                    vehicle.coordinates,
                    { latitude, longitude }
                );
                setDeliveryCost(deliveryDetails.cost);
                setDeliveryDistance(deliveryDetails.distanceText);
            }
        }
    };

    // Debounce for autocomplete
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (deliveryAddress.length >= 3 && !deliveryCoords) {
                setIsLoadingSuggestions(true);
                try {
                    const suggestions = await fetchPlacesAutocomplete(deliveryAddress);
                    setPlaceSuggestions(suggestions);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setPlaceSuggestions([]);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                setPlaceSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [deliveryAddress, deliveryCoords]);

    const handleSelectPlace = async (place: any) => {
        try {
            setIsLoadingSuggestions(true);
            setShowSuggestions(false);
            
            const details = await fetchPlaceDetailsById(place.place_id);
            const { lat, lng } = details.geometry.location;
            
            setDeliveryAddress(place.description);
            setDeliveryCoords({ latitude: lat, longitude: lng });
            
            // Calculate delivery cost if vehicle has coordinates
            if (vehicle.coordinates) {
                const deliveryDetails = getDeliveryDetails(
                    vehicle.coordinates,
                    { latitude: lat, longitude: lng }
                );
                setDeliveryCost(deliveryDetails.cost);
                setDeliveryDistance(deliveryDetails.distanceText);
            }
            
            const newRegion = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            
            setMapRegion(newRegion);

            // Force map update with timeout
            setTimeout(() => {
                mapRef.current?.animateToRegion(newRegion, 1000);
            }, 100);
        } catch (error) {
            console.error('Error selecting place:', error);
            Alert.alert('Error', 'No se pudieron obtener los detalles de este lugar.');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleNext = () => {
        if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
            Alert.alert('Dirección requerida', 'Por favor ingresa o selecciona una dirección de entrega.');
            return;
        }

        navigation.navigate('BookingStep3Time' as never, { 
            vehicle, 
            startDate, 
            endDate,
            pickupLocation: deliveryType === 'delivery' ? deliveryAddress : vehicle.ubicacion,
            returnLocation: deliveryType === 'delivery' ? deliveryAddress : vehicle.ubicacion,
            isDelivery: deliveryType === 'delivery',
            deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
            deliveryCoords: deliveryType === 'delivery' ? deliveryCoords : undefined,
            deliveryCost: deliveryType === 'delivery' ? deliveryCost : 0,
            deliveryDistance: deliveryType === 'delivery' ? deliveryDistance : ''
        } as never);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: '50%' }]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    style={styles.content} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Step Indicators */}
                    <View style={styles.stepIndicators}>
                        <View style={styles.stepIndicatorComplete}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                        <View style={styles.stepIndicatorLine} />
                        <View style={styles.stepIndicatorActive}>
                            <Text style={styles.stepIndicatorNumber}>2</Text>
                        </View>
                        <View style={styles.stepIndicatorLineInactive} />
                        <View style={styles.stepIndicatorInactive}>
                            <Text style={styles.stepIndicatorNumberInactive}>3</Text>
                        </View>
                        <View style={styles.stepIndicatorLineInactive} />
                        <View style={styles.stepIndicatorInactive}>
                            <Text style={styles.stepIndicatorNumberInactive}>4</Text>
                        </View>
                    </View>

                    <Text style={styles.stepTitle}>Paso 2 de 4</Text>
                    <Text style={styles.title}>Ubicación</Text>
                    <Text style={styles.subtitle}>¿Cómo deseas recibir el auto?</Text>

                    {/* Toggle Switch */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity 
                            style={[styles.toggleOption, deliveryType === 'pickup' && styles.toggleOptionActive]}
                            onPress={() => setDeliveryType('pickup')}
                        >
                            <Ionicons 
                                name="location" 
                                size={20} 
                                color={deliveryType === 'pickup' ? '#fff' : '#6B7280'} 
                            />
                            <Text style={[styles.toggleText, deliveryType === 'pickup' && styles.toggleTextActive]}>
                                Recoger
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleOption, deliveryType === 'delivery' && styles.toggleOptionActive]}
                            onPress={() => setDeliveryType('delivery')}
                        >
                            <Ionicons 
                                name="car" 
                                size={20} 
                                color={deliveryType === 'delivery' ? '#fff' : '#6B7280'} 
                            />
                            <Text style={[styles.toggleText, deliveryType === 'delivery' && styles.toggleTextActive]}>
                                Delivery
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {deliveryType === 'pickup' ? (
                        <>
                            <View style={styles.mapContainer}>
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={styles.map}
                                    initialRegion={DEFAULT_REGION}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Marker
                                        coordinate={{ latitude: 13.6929, longitude: -89.2182 }}
                                        title={vehicle.ubicacion}
                                    >
                                        <View style={styles.customMarker}>
                                            <Ionicons name="car" size={24} color="#0B729D" />
                                        </View>
                                    </Marker>
                                </MapView>
                            </View>

                            <View style={styles.locationCard}>
                                <View style={styles.locationRow}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="location" size={24} color="#0B729D" />
                                    </View>
                                    <View style={styles.locationInfo}>
                                        <Text style={styles.locationLabel}>Lugar de recogida</Text>
                                        <Text style={styles.locationValue}>{vehicle.ubicacion}</Text>
                                    </View>
                                </View>

                                {/* Navigation Buttons */}
                                <View style={styles.navigationButtons}>
                                    <TouchableOpacity 
                                        style={styles.navButton}
                                        onPress={() => {
                                            Alert.alert(
                                                'Cómo llegar',
                                                '¿Con qué app deseas navegar?',
                                                [
                                                    {
                                                        text: 'Google Maps',
                                                        onPress: () => {
                                                            const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicle.ubicacion)}`;
                                                            Linking.openURL(gmapsUrl);
                                                        }
                                                    },
                                                    {
                                                        text: 'Waze',
                                                        onPress: () => {
                                                            const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(vehicle.ubicacion)}`;
                                                            Linking.openURL(wazeUrl);
                                                        }
                                                    },
                                                    {
                                                        text: 'Cancelar',
                                                        style: 'cancel'
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Ionicons name="navigate" size={20} color="#0B729D" />
                                        <Text style={styles.navButtonText}>Cómo llegar</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#0B729D" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ height: 20 }} />
                        </>
                    ) : (
                        <View style={styles.deliveryContainer}>
                            <View style={styles.deliveryInfoCard}>
                                <Ionicons name="information-circle" size={20} color="#0B729D" />
                                <Text style={styles.deliveryInfoText}>
                                    El anfitrión te llevará el auto a tu ubicación
                                </Text>
                            </View>

                            {/* Map for Delivery */}
                            <View style={styles.mapContainer}>
                                <MapView
                                    ref={mapRef}
                                    provider={PROVIDER_GOOGLE}
                                    style={styles.map}
                                    region={mapRegion}
                                    onPress={handleMapPress}
                                >
                                    {deliveryCoords && (
                                        <Marker
                                            coordinate={deliveryCoords}
                                            draggable
                                            onDragEnd={(e) => {
                                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                                setDeliveryCoords({ latitude, longitude });
                                                setDeliveryAddress(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
                                            }}
                                        >
                                            <View style={styles.deliveryMarker}>
                                                <Ionicons name="location" size={32} color="#EF4444" />
                                            </View>
                                        </Marker>
                                    )}
                                </MapView>
                                <View style={styles.mapInstructions}>
                                    <Ionicons name="hand-left-outline" size={16} color="#6B7280" />
                                    <Text style={styles.mapInstructionsText}>
                                        Toca el mapa para seleccionar ubicación
                                    </Text>
                                </View>
                            </View>

                            {/* Current Location Button */}
                            <TouchableOpacity 
                                style={styles.currentLocationButton}
                                onPress={handleUseCurrentLocation}
                                disabled={isLocating}
                            >
                                {isLocating ? (
                                    <ActivityIndicator size="small" color="#0B729D" />
                                ) : (
                                    <Ionicons name="locate" size={20} color="#0B729D" />
                                )}
                                <Text style={styles.currentLocationText}>
                                    {isLocating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>O ingresa la dirección manualmente</Text>
                            
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Buscar dirección..."
                                        placeholderTextColor="#9CA3AF"
                                        value={deliveryAddress}
                                        onChangeText={(text) => {
                                            setDeliveryAddress(text);
                                            // Clear coords when manually typing
                                            setDeliveryCoords(null);
                                        }}
                                        onFocus={() => {
                                            if (placeSuggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                    />
                                    {isLoadingSuggestions && (
                                        <ActivityIndicator size="small" color="#0B729D" />
                                    )}
                                </View>

                                {/* Suggestions List */}
                                {showSuggestions && placeSuggestions.length > 0 && (
                                    <ScrollView 
                                        style={styles.suggestionsContainer}
                                        nestedScrollEnabled
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {placeSuggestions.map((place, index) => (
                                            <TouchableOpacity
                                                key={place.place_id || index}
                                                style={styles.suggestionItem}
                                                onPress={() => handleSelectPlace(place)}
                                            >
                                                <Ionicons name="location-outline" size={20} color="#0B729D" />
                                                <View style={styles.suggestionTextContainer}>
                                                    <Text style={styles.suggestionMainText}>
                                                        {place.structured_formatting?.main_text || place.description}
                                                    </Text>
                                                    {place.structured_formatting?.secondary_text && (
                                                        <Text style={styles.suggestionSecondaryText}>
                                                            {place.structured_formatting.secondary_text}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Delivery Cost Display */}
                            {deliveryCoords && deliveryCost > 0 && (
                                <View style={styles.deliveryCostCard}>
                                    <View style={styles.deliveryCostHeader}>
                                        <View style={styles.deliveryIconCircle}>
                                            <Ionicons name="car-outline" size={20} color="#0B729D" />
                                        </View>
                                        <View style={styles.deliveryCostHeaderText}>
                                            <Text style={styles.deliveryCostTitle}>Detalles de entrega</Text>
                                            <Text style={styles.deliveryCostSubtitle}>El anfitrión llevará el auto a ti</Text>
                                        </View>
                                    </View>
                                    <View style={styles.deliveryCostDetailsGrid}>
                                        <View style={styles.deliveryCostDetailCard}>
                                            <Ionicons name="navigate-circle-outline" size={24} color="#3B82F6" />
                                            <Text style={styles.deliveryCostDetailLabel}>Distancia</Text>
                                            <Text style={styles.deliveryCostDetailValue}>{deliveryDistance}</Text>
                                        </View>
                                        <View style={styles.deliveryCostDetailCard}>
                                            <Ionicons name="time-outline" size={24} color="#F59E0B" />
                                            <Text style={styles.deliveryCostDetailLabel}>Tiempo est.</Text>
                                            <Text style={styles.deliveryCostDetailValue}>~{Math.ceil(parseFloat(deliveryDistance) / 40 * 60)} min</Text>
                                        </View>
                                        <View style={styles.deliveryCostDetailCard}>
                                            <Ionicons name="cash-outline" size={24} color="#10B981" />
                                            <Text style={styles.deliveryCostDetailLabel}>Tarifa</Text>
                                            <Text style={styles.deliveryCostDetailValuePrice}>${deliveryCost}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.deliveryCostInfo}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.deliveryCostInfoText}>
                                            Incluye entrega y recogida del vehículo
                                        </Text>
                                    </View>
                                </View>
                            )}
                            
                            <View style={{ height: 200 }} />
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[
                            styles.nextButton, 
                            (deliveryType === 'delivery' && !deliveryAddress.trim()) && styles.disabledButton
                        ]} 
                        onPress={handleNext}
                        disabled={deliveryType === 'delivery' && !deliveryAddress.trim()}
                    >
                        <Text style={styles.nextButtonText}>Continuar</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    stepIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    stepIndicatorComplete: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorActive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0B729D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorInactive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    stepIndicatorNumberInactive: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    stepIndicatorLine: {
        width: 40,
        height: 2,
        backgroundColor: '#10B981',
    },
    stepIndicatorLineInactive: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
    },
    progressBarContainer: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0B729D',
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    toggleOptionActive: {
        backgroundColor: '#0B729D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#fff',
    },
    mapContainer: {
        height: 250,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    customMarker: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    deliveryMarker: {
        alignItems: 'center',
    },
    mapInstructions: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapInstructionsText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    locationCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    locationValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    navigationButtons: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        padding: 14,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    navButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0B729D',
        flex: 1,
        textAlign: 'center',
    },
    deliveryContainer: {
        gap: 16,
    },
    deliveryInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    deliveryInfoText: {
        flex: 1,
        fontSize: 14,
        color: '#0B729D',
        lineHeight: 20,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: 16,
        gap: 8,
    },
    currentLocationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        position: 'relative',
        zIndex: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
    },
    suggestionsContainer: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    suggestionSecondaryText: {
        fontSize: 13,
        color: '#6B7280',
    },
    deliveryCostCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    deliveryCostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    deliveryIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    deliveryCostHeaderText: {
        flex: 1,
    },
    deliveryCostTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    deliveryCostSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    deliveryCostDetailsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    deliveryCostDetailCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    deliveryCostDetailLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 6,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    deliveryCostDetailValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '700',
    },
    deliveryCostDetailValuePrice: {
        fontSize: 17,
        color: '#10B981',
        fontWeight: '800',
    },
    deliveryCostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    deliveryCostInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#065F46',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    nextButton: {
        backgroundColor: '#0B729D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
