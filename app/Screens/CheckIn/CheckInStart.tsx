import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../../../FirebaseConfig';
import { useAuth } from '../../../context/Auth';
import { markParticipantReady, startCheckIn, subscribeToCheckIn, updateCheckInStatus } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInStart() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { reservation } = route.params as { reservation: Reservation };
    
    const [loading, setLoading] = useState(false);
    const [checkInId, setCheckInId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean>(false);
    const [isReady, setIsReady] = useState(false);
    const [otherPartyReady, setOtherPartyReady] = useState(false);
    const [bothReady, setBothReady] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [vehicleCoordinates, setVehicleCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [meetingCoordinates, setMeetingCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    
    const isOwner = user?.uid === reservation.arrendadorId;

    useEffect(() => {
        initializeLocation();
        requestLocationPermission();
        initializeCheckIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeLocation = async () => {
        // 1. Get Vehicle Location (always needed as fallback or for non-delivery)
        let vCoords = null;
        try {
            const vehicleDoc = await getDoc(doc(db, 'vehicles', reservation.vehicleId));
            if (vehicleDoc.exists()) {
                const data = vehicleDoc.data();
                if (data.coordinates) {
                    vCoords = data.coordinates;
                    setVehicleCoordinates(vCoords);
                }
            }
        } catch (error) {
            console.error('Error fetching vehicle location:', error);
        }

        // 2. Determine Meeting Point
        if (reservation.isDelivery && reservation.deliveryAddress) {
            try {
                const geocoded = await Location.geocodeAsync(reservation.deliveryAddress);
                if (geocoded.length > 0) {
                    setMeetingCoordinates({
                        latitude: geocoded[0].latitude,
                        longitude: geocoded[0].longitude
                    });
                } else {
                    // Fallback if geocoding fails
                    setMeetingCoordinates(vCoords);
                }
            } catch (error) {
                console.error('Error geocoding delivery address:', error);
                setMeetingCoordinates(vCoords);
            }
        } else {
            setMeetingCoordinates(vCoords);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationPermission(true);
                getCurrentLocation();
            } else {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos tu ubicación para verificar que estás cerca del vehículo.',
                    [{ text: 'Entendido' }]
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const userCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            
            setUserLocation(userCoords);
            
            // Calculate distance to meeting point if we have coordinates
            if (meetingCoordinates) {
                const dist = calculateDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    meetingCoordinates.latitude,
                    meetingCoordinates.longitude
                );
                setDistance(dist);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distancia en km
    };

    const initializeCheckIn = async () => {
        try {
            setLoading(true);
            // Create or get existing check-in document
            const newCheckInId = await startCheckIn(
                reservation.id,
                reservation.vehicleId,
                reservation.userId,
                reservation.arrendadorId
            );
            
            setCheckInId(newCheckInId);
            
            // Subscribe to real-time updates
            const unsubscribe = subscribeToCheckIn(newCheckInId, (checkIn) => {
                if (checkIn) {
                    if (isOwner) {
                        setIsReady(checkIn.ownerReady);
                        setOtherPartyReady(checkIn.renterReady);
                    } else {
                        setIsReady(checkIn.renterReady);
                        setOtherPartyReady(checkIn.ownerReady);
                    }
                    
                    // Check if both are ready
                    if (checkIn.ownerReady && checkIn.renterReady && !bothReady) {
                        setBothReady(true);
                        handleBothReady(newCheckInId);
                    }
                }
            });
            
            return () => unsubscribe();
        } catch (error) {
            console.error('Error initializing check-in:', error);
            Alert.alert('Error', 'No se pudo iniciar el proceso de check-in.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReady = async () => {
        if (!checkInId) return;
        
        // Verify distance (within 500m)
        if (distance && distance > 0.5) {
            Alert.alert(
                'Ubicación incorrecta',
                `Estás a ${distance.toFixed(2)} km del vehículo. Debes estar dentro de 500 metros para iniciar el check-in.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        try {
            setLoading(true);
            
            const locationData = userLocation ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                accuracy: 10, // meters
            } : undefined;

            await markParticipantReady(checkInId, user!.uid, isOwner, locationData);
            setIsReady(true);
            
        } catch (error) {
            console.error('Error marking ready:', error);
            Alert.alert('Error', 'No se pudo confirmar tu disponibilidad.');
        } finally {
            setLoading(false);
        }
    };

    const handleBothReady = async (id: string) => {
        try {
            await updateCheckInStatus(id, 'in-progress');
            
            // Navigate to photos screen after 2 seconds
            setTimeout(() => {
                navigation.replace('CheckInPhotos', { 
                    reservation, 
                    checkInId: id 
                });
            }, 2000);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const isWithinRange = distance !== null && distance <= 0.5; // 500 meters

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Iniciar Check-in</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Vehicle Info */}
                <View style={styles.vehicleCard}>
                    <Ionicons name="car-sport" size={32} color="#0B729D" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleName}>
                            {reservation.vehicleSnapshot?.marca} {reservation.vehicleSnapshot?.modelo}
                        </Text>
                        <Text style={styles.vehicleYear}>{reservation.vehicleSnapshot?.anio}</Text>
                    </View>
                </View>

                {/* Location Info (Delivery or Pickup) */}
                <View style={styles.locationInfoCard}>
                    <View style={styles.locationHeader}>
                        <Ionicons 
                            name={reservation.isDelivery ? "navigate-circle" : "location"} 
                            size={24} 
                            color="#0B729D" 
                        />
                        <Text style={styles.locationTitle}>
                            {reservation.isDelivery ? 'Punto de Entrega (Delivery)' : 'Punto de Recogida'}
                        </Text>
                    </View>
                    <Text style={styles.locationAddress}>
                        {reservation.isDelivery 
                            ? reservation.deliveryAddress 
                            : (reservation.pickupLocation || 'Ubicación del vehículo')}
                    </Text>
                    {reservation.isDelivery && (
                        <View style={styles.deliveryBadge}>
                            <Text style={styles.deliveryBadgeText}>El anfitrión te entregará el auto aquí</Text>
                        </View>
                    )}
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    {meetingCoordinates ? (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={{
                                latitude: meetingCoordinates.latitude,
                                longitude: meetingCoordinates.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                        >
                            <Marker
                                coordinate={meetingCoordinates}
                                title={reservation.isDelivery ? "Punto de Entrega" : "Vehículo"}
                                description={reservation.isDelivery ? reservation.deliveryAddress : reservation.vehicleSnapshot?.modelo}
                                pinColor={reservation.isDelivery ? "orange" : "red"}
                            />
                            <Circle
                                center={meetingCoordinates}
                                radius={500} // 500 meters allowed radius
                                fillColor="rgba(11, 114, 157, 0.1)"
                                strokeColor="rgba(11, 114, 157, 0.5)"
                            />
                            {userLocation && (
                                <Marker
                                    coordinate={userLocation}
                                    title="Tú"
                                    pinColor="blue"
                                />
                            )}
                        </MapView>
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.mapPlaceholderText}>Ubicación no disponible</Text>
                        </View>
                    )}
                </View>

                {/* Distance info */}
                {distance !== null && (
                    <View style={[styles.distanceCard, isWithinRange ? styles.distanceOk : styles.distanceFar]}>
                        <Ionicons 
                            name={isWithinRange ? "checkmark-circle" : "alert-circle"} 
                            size={24} 
                            color={isWithinRange ? "#16A34A" : "#DC2626"} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.distanceText, { color: isWithinRange ? "#16A34A" : "#DC2626" }]}>
                                {isWithinRange 
                                    ? `Estás cerca del vehículo (${(distance * 1000).toFixed(0)}m)`
                                    : `Estás lejos del vehículo (${distance.toFixed(2)} km)`
                                }
                            </Text>
                            {!isWithinRange && (
                                <Text style={styles.distanceSubtext}>
                                    Debes estar dentro de 500 metros para iniciar el check-in
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>¿Cómo funciona el Check-in?</Text>
                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Ambas partes deben estar presentes y dentro de 500m del vehículo</Text>
                    </View>
                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Toma 8 fotos del vehículo desde diferentes ángulos</Text>
                    </View>
                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>Completa el checklist de condiciones del vehículo</Text>
                    </View>
                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>4</Text>
                        </View>
                        <Text style={styles.stepText}>Ambos firman digitalmente para confirmar</Text>
                    </View>
                </View>

                {/* Status cards */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusTitle}>Estado de participantes</Text>
                    
                    <View style={[styles.statusCard, isReady && styles.statusCardReady]}>
                        <Ionicons 
                            name={isReady ? "checkmark-circle" : "time-outline"} 
                            size={32} 
                            color={isReady ? "#16A34A" : "#F59E0B"} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusCardTitle}>
                                {isOwner ? 'Tú (Anfitrión)' : 'Tú (Arrendatario)'}
                            </Text>
                            <Text style={styles.statusCardSubtitle}>
                                {isReady ? 'Listo para empezar' : 'Esperando confirmación'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statusCard, otherPartyReady && styles.statusCardReady]}>
                        <Ionicons 
                            name={otherPartyReady ? "checkmark-circle" : "time-outline"} 
                            size={32} 
                            color={otherPartyReady ? "#16A34A" : "#F59E0B"} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusCardTitle}>
                                {isOwner ? 'Arrendatario' : 'Anfitrión'}
                            </Text>
                            <Text style={styles.statusCardSubtitle}>
                                {otherPartyReady ? 'Listo para empezar' : 'Esperando confirmación'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Success message */}
                {bothReady && (
                    <View style={styles.successCard}>
                        <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                        <Text style={styles.successText}>¡Ambos están listos!</Text>
                        <Text style={styles.successSubtext}>Redirigiendo a tomar fotos...</Text>
                        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 12 }} />
                    </View>
                )}
            </ScrollView>

            {/* Bottom action button */}
            {!bothReady && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity 
                        style={{ marginBottom: 12, alignItems: 'center', padding: 8 }}
                        onPress={() => {
                            if (checkInId) {
                                navigation.replace('CheckInPhotos', { 
                                    reservation, 
                                    checkInId 
                                });
                            } else {
                                Alert.alert('Espera', 'Inicializando check-in...');
                            }
                        }}
                    >
                        <Text style={{ color: '#6B7280', textDecorationLine: 'underline', fontSize: 14 }}>
                            Saltar validación (Solo prueba)
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.readyButton,
                            isReady && styles.readyButtonDisabled,
                            (!isWithinRange || !locationPermission) && styles.readyButtonDisabled
                        ]}
                        onPress={handleMarkReady}
                        disabled={isReady || loading || !isWithinRange || !locationPermission}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                                <Text style={styles.readyButtonText}>
                                    {isReady ? 'Esperando a la otra parte...' : 'Estoy listo para empezar'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        gap: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    vehicleName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    vehicleYear: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    locationInfoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    locationAddress: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    deliveryBadge: {
        marginTop: 8,
        backgroundColor: '#F0F9FF',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    deliveryBadgeText: {
        fontSize: 12,
        color: '#0B729D',
        fontWeight: '600',
    },
    mapContainer: {
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    mapPlaceholderText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
    distanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 16,
    },
    distanceOk: {
        backgroundColor: '#DCFCE7',
    },
    distanceFar: {
        backgroundColor: '#FEE2E2',
    },
    distanceText: {
        fontSize: 15,
        fontWeight: '600',
    },
    distanceSubtext: {
        fontSize: 13,
        color: '#7F1D1D',
        marginTop: 2,
    },
    instructionsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0B729D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    statusContainer: {
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    statusCardReady: {
        borderColor: '#16A34A',
        backgroundColor: '#F0FDF4',
    },
    statusCardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    statusCardSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    successCard: {
        backgroundColor: '#F0FDF4',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#16A34A',
    },
    successText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#16A34A',
        marginTop: 12,
    },
    successSubtext: {
        fontSize: 14,
        color: '#166534',
        marginTop: 4,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    readyButton: {
        flexDirection: 'row',
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    readyButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    readyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
