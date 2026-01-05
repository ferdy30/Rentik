import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
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
    
    const [otherPartyLocation, setOtherPartyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    
    const isOwner = user?.uid === reservation.arrendadorId;

    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    
    // Refs para evitar navegaciones múltiples
    const hasNavigatedRef = useRef(false);
    const checkInUnsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        initializeLocation();
        requestLocationPermission();
        initializeCheckIn();
        
        return () => {
            // Limpiar suscripción de ubicación
            if (locationSubscription) {
                locationSubscription.remove();
            }
            // Limpiar listener de check-in
            if (checkInUnsubscribeRef.current) {
                console.log('[CheckInStart] Cleaning up check-in listener');
                checkInUnsubscribeRef.current();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mapRef = React.useRef<MapView>(null);

    useEffect(() => {
        if (userLocation && meetingCoordinates && mapRef.current) {
            mapRef.current.fitToCoordinates([
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: meetingCoordinates.latitude, longitude: meetingCoordinates.longitude }
            ], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
        
        // Recalculate distance whenever coordinates change
        if (userLocation && meetingCoordinates) {
            const dist = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                meetingCoordinates.latitude,
                meetingCoordinates.longitude
            );
            setDistance(dist);
        }
    }, [userLocation, meetingCoordinates]);

    // Effect to set meeting point based on role
    useEffect(() => {
        if (isOwner && userLocation) {
            // Para el HOST: Su ubicación ES el punto de encuentro (vehículo)
            setVehicleCoordinates(userLocation);
            setMeetingCoordinates(userLocation);
        }
    }, [isOwner, userLocation]);

    const initializeLocation = async () => {
        // Solo geocodificar si NO es el host (para viajeros)
        if (isOwner) {
            // El host no necesita inicializar nada aquí
            // Su ubicación será el punto de encuentro (se establece en el useEffect)
            return;
        }

        // Para VIAJEROS: Determinar punto de encuentro desde dirección o vehículo
        const targetAddress = reservation.isDelivery 
            ? reservation.deliveryAddress 
            : (reservation.pickupLocation || '');

        if (targetAddress) {
            try {
                const geocoded = await Location.geocodeAsync(targetAddress);
                if (geocoded.length > 0) {
                    const coords = {
                        latitude: geocoded[0].latitude,
                        longitude: geocoded[0].longitude
                    };
                    setMeetingCoordinates(coords);
                    setVehicleCoordinates(coords);
                } else {
                    console.warn('Geocoding failed for address:', targetAddress);
                }
            } catch (error) {
                console.error('Error geocoding address:', error);
            }
        } else {
            // Fallback: intentar obtener coordenadas del vehículo
            try {
                const vehicleDoc = await getDoc(doc(db, 'vehicles', reservation.vehicleId));
                if (vehicleDoc.exists()) {
                    const data = vehicleDoc.data();
                    if (data.coordinates) {
                        setMeetingCoordinates(data.coordinates);
                        setVehicleCoordinates(data.coordinates);
                    }
                }
            } catch (error) {
                console.error('Error fetching vehicle location:', error);
            }
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationPermission(true);
                startLocationTracking();
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

    const startLocationTracking = async () => {
        try {
            // Get initial position quickly
            const current = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            updateUserLocation(current);

            // Start watching
            const sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 10, // Update every 10 meters
                },
                (location) => {
                    updateUserLocation(location);
                }
            );
            setLocationSubscription(sub);
        } catch (error) {
            console.error('Error starting location tracking:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación actual. Verifica que el GPS esté activado.');
        }
    };

    const updateUserLocation = (location: Location.LocationObject) => {
        const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
        
        setUserLocation(userCoords);
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
                // Evitar procesar si ya navegamos
                if (hasNavigatedRef.current) {
                    console.log('[CheckInStart] Already navigated, ignoring update');
                    return;
                }
                
                console.log('[CheckInStart] CheckIn update received:', {
                    ownerReady: checkIn?.ownerReady,
                    renterReady: checkIn?.renterReady,
                    status: checkIn?.status,
                    isOwner,
                });

                if (checkIn) {
                    // Update local states
                    if (isOwner) {
                        setIsReady(checkIn.ownerReady);
                        setOtherPartyReady(checkIn.renterReady);
                        if (checkIn.renterLocation) {
                            setOtherPartyLocation(checkIn.renterLocation);
                        }
                    } else {
                        setIsReady(checkIn.renterReady);
                        setOtherPartyReady(checkIn.ownerReady);
                        if (checkIn.ownerLocation) {
                            setOtherPartyLocation(checkIn.ownerLocation);
                        }
                    }
                    
                    // Check if both are ready
                    const bothAreReady = checkIn.ownerReady && checkIn.renterReady;
                    console.log('[CheckInStart] Both ready check:', bothAreReady, 'Status:', checkIn.status);
                    
                    if (bothAreReady && checkIn.status === 'pending') {
                        console.log('[CheckInStart] Both ready! Initiating navigation...');
                        setBothReady(true);
                        handleBothReady(newCheckInId);
                    } else if (checkIn.status === 'in-progress' || checkIn.status === 'completed') {
                         // If already in progress, just navigate (maybe user re-opened app)
                         console.log('[CheckInStart] Already in progress, navigating directly...');
                         setBothReady(true);
                         hasNavigatedRef.current = true;
                         
                         // Desuscribir antes de navegar
                         if (checkInUnsubscribeRef.current) {
                             checkInUnsubscribeRef.current();
                             checkInUnsubscribeRef.current = null;
                         }
                         
                         navigation.replace('CheckInPhotos', { 
                            reservation, 
                            checkInId: newCheckInId 
                        });
                    }
                }
            });
            
            // Guardar la función de desuscripción
            checkInUnsubscribeRef.current = unsubscribe;
        } catch (error) {
            console.error('Error initializing check-in:', error);
            Alert.alert('Error', 'No se pudo iniciar el proceso de check-in.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReady = async () => {
        if (!checkInId) return;
        
        // Rangos de proximidad más flexibles
        const PROXIMITY_PERFECT = 0.1;    // 100m - Verde (ideal)
        const PROXIMITY_GOOD = 0.3;       // 300m - Amarillo (bueno)
        const PROXIMITY_ACCEPTABLE = 0.5; // 500m - Naranja (aceptable)
        // >500m - Rojo (muy lejos)
        
        if (distance && distance > PROXIMITY_ACCEPTABLE) {
            // Muy lejos - ofrecer opciones
            Alert.alert(
                'Ubicación incorrecta',
                `Estás a ${distance.toFixed(2)} km del punto de encuentro.\n\n` +
                'Lo ideal es estar dentro de 500 metros, pero si estás seguro de estar en el lugar correcto, puedes continuar.',
                [
                    {
                        text: 'Ir a la ubicación',
                        onPress: () => {
                            const coords = meetingCoordinates || vehicleCoordinates;
                            if (coords) {
                                Linking.openURL(
                                    `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
                                );
                            }
                        }
                    },
                    {
                        text: 'Contactar',
                        onPress: async () => {
                            // Navegar al chat o llamar
                            navigation.navigate('ChatRoom', {
                                reservationId: reservation.id,
                                participants: [reservation.userId, reservation.arrendadorId],
                                vehicleInfo: {
                                    marca: reservation.vehicleSnapshot?.marca || '',
                                    modelo: reservation.vehicleSnapshot?.modelo || '',
                                    imagen: reservation.vehicleSnapshot?.imagen || ''
                                }
                            });
                        }
                    },
                    {
                        text: 'Continuar (Riesgo)',
                        style: 'destructive',
                        onPress: () => {
                            Alert.alert(
                                '¿Estás seguro?',
                                'Confirmar la ubicación incorrecta podría afectar reclamaciones de seguro futuras.',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { 
                                        text: 'Sí, continuar', 
                                        style: 'destructive',
                                        onPress: async () => await performMarkReady() 
                                    }
                                ]
                            );
                        }
                    }
                ]
            );
            return;
        }
        
        // Distancia aceptable pero no perfecta - advertir pero permitir
        if (distance && distance > PROXIMITY_GOOD && distance <= PROXIMITY_ACCEPTABLE) {
            Alert.alert(
                'Confirmar ubicación',
                `Estás a ${(distance * 1000).toFixed(0)} metros del punto de encuentro.\n\n` +
                '¿Confirmas que estás en el lugar correcto?',
                [
                    {
                        text: 'No, ir a la ubicación',
                        onPress: () => {
                            const coords = meetingCoordinates || vehicleCoordinates;
                            if (coords) {
                                Linking.openURL(
                                    `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
                                );
                            }
                        },
                        style: 'cancel'
                    },
                    {
                        text: 'Sí, continuar',
                        onPress: async () => {
                            await performMarkReady();
                        }
                    }
                ]
            );
            return;
        }
        
        // Si está en rango perfecto o bueno, continuar directamente
        await performMarkReady();
    };
    
    const performMarkReady = async () => {
        if (!checkInId) return;

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
        // Evitar llamadas múltiples
        if (hasNavigatedRef.current) {
            console.log('[CheckInStart] Already handling navigation, skipping');
            return;
        }
        
        hasNavigatedRef.current = true;
        console.log('[CheckInStart] handleBothReady called with id:', id);
        
        try {
            // Only update if still pending to avoid race conditions
            console.log('[CheckInStart] Updating status to in-progress...');
            await updateCheckInStatus(id, 'in-progress');
            console.log('[CheckInStart] Status updated successfully');
            
            // Desuscribir antes de navegar
            if (checkInUnsubscribeRef.current) {
                console.log('[CheckInStart] Unsubscribing before navigation');
                checkInUnsubscribeRef.current();
                checkInUnsubscribeRef.current = null;
            }
            
            // Navigate to photos screen
            // Use a slightly longer timeout to ensure UI feedback is seen
            console.log('[CheckInStart] Scheduling navigation in 1.5s...');
            setTimeout(() => {
                console.log('[CheckInStart] Navigating to CheckInPhotos...');
                navigation.replace('CheckInPhotos', { 
                    reservation, 
                    checkInId: id 
                });
            }, 1500);
        } catch (error) {
            console.error('[CheckInStart] Error updating status:', error);
            // Even if update fails (e.g. already updated), try to navigate
            console.log('[CheckInStart] Error occurred, navigating anyway...');
            
            // Desuscribir de todos modos
            if (checkInUnsubscribeRef.current) {
                checkInUnsubscribeRef.current();
                checkInUnsubscribeRef.current = null;
            }
            
            setTimeout(() => {
                console.log('[CheckInStart] Navigating to CheckInPhotos (fallback)...');
                navigation.replace('CheckInPhotos', { 
                    reservation, 
                    checkInId: id 
                });
            }, 1500);
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
                        <>
                            <MapView
                                ref={mapRef}
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    latitude: meetingCoordinates.latitude,
                                    longitude: meetingCoordinates.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                showsUserLocation={false}
                                showsMyLocationButton={true}
                            >
                                {/* Para HOST: Mostrar solo su ubicación y la del viajero */}
                                {/* Para VIAJERO: Mostrar punto de encuentro y su ubicación */}
                                
                                {/* Tu ubicación */}
                                {userLocation && (
                                    <Marker
                                        coordinate={userLocation}
                                        title={isOwner ? "Tú (Anfitrión con Vehículo)" : "Tú (Viajero)"}
                                        description={isOwner ? "Tu ubicación es donde está el vehículo" : "Tu ubicación actual"}
                                    >
                                        <View style={styles.markerContainer}>
                                            <Ionicons name="person" size={30} color="#0B729D" />
                                        </View>
                                    </Marker>
                                )}
                                
                                {/* Ubicación de la otra parte (en tiempo real) */}
                                {otherPartyLocation && (
                                    <Marker
                                        coordinate={otherPartyLocation}
                                        title={isOwner ? "Viajero" : "Anfitrión (Vehículo)"}
                                        description={isOwner ? "Ubicación del viajero" : "Ubicación del anfitrión con el vehículo"}
                                    >
                                        <View style={styles.markerContainer}>
                                            <Ionicons 
                                                name={isOwner ? "walk" : "car"} 
                                                size={30} 
                                                color="#16A34A" 
                                            />
                                        </View>
                                    </Marker>
                                )}

                                {/* Círculo de proximidad alrededor del punto de encuentro */}
                                {meetingCoordinates && (
                                    <Circle
                                        center={meetingCoordinates}
                                        radius={500}
                                        fillColor="rgba(11, 114, 157, 0.1)"
                                        strokeColor="rgba(11, 114, 157, 0.5)"
                                    />
                                )}
                            </MapView>
                            <TouchableOpacity 
                                style={styles.refreshLocationButton}
                                onPress={startLocationTracking}
                            >
                                <Ionicons name="refresh" size={20} color="#0B729D" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.centerLocationButton}
                                onPress={() => {
                                    if (userLocation && mapRef.current) {
                                        mapRef.current.animateToRegion({
                                            latitude: userLocation.latitude,
                                            longitude: userLocation.longitude,
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        });
                                    } else {
                                        Alert.alert('Ubicación no disponible', 'Aún no tenemos tu ubicación actual.');
                                    }
                                }}
                            >
                                <Ionicons name="locate" size={20} color="#0B729D" />
                            </TouchableOpacity>
                        </>
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
                                    ? `Estás cerca del punto de encuentro (${(distance * 1000).toFixed(0)}m)`
                                    : `Estás a ${distance.toFixed(2)} km del punto de encuentro`
                                }
                            </Text>
                            {!isWithinRange && !isOwner && (
                                <Text style={styles.distanceSubtext}>
                                    Debes estar dentro de 500 metros para iniciar el check-in
                                </Text>
                            )}
                            {!isWithinRange && isOwner && (
                                <Text style={styles.distanceSubtext}>
                                    Como anfitrión, tu ubicación define el punto de encuentro.
                                </Text>
                            )}
                            {otherPartyLocation && (
                                <Text style={[styles.distanceSubtext, { color: "#059669", marginTop: 4 }]}>
                                    ✓ {isOwner ? "El viajero" : "El anfitrión"} está en el lugar
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
                        <Text style={styles.stepText}>
                            {isOwner 
                                ? "Como anfitrión, tú defines el punto de encuentro con tu ubicación"
                                : "Dirígete al punto de encuentro donde está el anfitrión con el vehículo"}
                        </Text>
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
                                {isOwner ? 'Tú (Anfitrión)' : 'Tú (Viajero)'}
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
                                {isOwner ? 'Viajero' : 'Anfitrión'}
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
                    {/* Debug button - hidden for production excellence */}
                    {/* <TouchableOpacity 
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
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={[
                            styles.readyButton,
                            isReady && styles.readyButtonDisabled,
                            (!locationPermission || (!isOwner && !isWithinRange)) && styles.readyButtonDisabled
                        ]}
                        onPress={handleMarkReady}
                        disabled={isReady || loading || !locationPermission || (!isOwner && !isWithinRange)}
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
    refreshLocationButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    centerLocationButton: {
        position: 'absolute',
        top: 56,
        right: 12,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    markerContainer: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#0B729D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});
