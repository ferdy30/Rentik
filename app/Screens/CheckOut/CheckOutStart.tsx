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
import { startCheckOut } from '../../services/checkOut';
import { Reservation } from '../../services/reservations';
import { typography } from '../../constants/typography';

export default function CheckOutStart() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { reservation } = route.params as { reservation: Reservation };
    
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [returnCoordinates, setReturnCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    
    useEffect(() => {
        initializeLocation();
        requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeLocation = async () => {
        console.log('=== Initializing Return Location ===');
        console.log('Is Delivery:', reservation.isDelivery);
        console.log('Return Coordinates:', reservation.returnCoordinates);
        console.log('Pickup Coordinates:', reservation.pickupCoordinates);
        
        // ? NUEVA L�GICA: Usar coordenadas guardadas en la reserva
        let returnPoint = null;

        // 1. Prioridad: Usar returnCoordinates si existe en la reserva
        if (reservation.returnCoordinates) {
            returnPoint = reservation.returnCoordinates;
            console.log('? Using saved return coordinates:', returnPoint);
        }
        // 2. Fallback: En modo delivery, el retorno puede ser:
        //    - El mismo lugar de entrega (si returnCoordinates no existe)
        //    - O el punto de pickup original
        else if (reservation.isDelivery) {
            if (reservation.deliveryCoordinates) {
                returnPoint = reservation.deliveryCoordinates;
                console.log('?? Using delivery coordinates as return point:', returnPoint);
            } else if (reservation.pickupCoordinates) {
                returnPoint = reservation.pickupCoordinates;
                console.log('?? Using pickup coordinates as return point:', returnPoint);
            }
        }
        // 3. Si fue pickup normal, retornar al mismo lugar
        else if (reservation.pickupCoordinates) {
            returnPoint = reservation.pickupCoordinates;
            console.log('? Using pickup coordinates for return:', returnPoint);
        }
        // 4. �ltimo recurso: buscar coordenadas del veh�culo (solo para reservas antiguas)
        else {
            console.log('?? No coordinates saved, fetching vehicle location...');
            try {
                const vehicleDoc = await getDoc(doc(db, 'vehicles', reservation.vehicleId));
                if (vehicleDoc.exists()) {
                    const data = vehicleDoc.data();
                    if (data.coordinates) {
                        returnPoint = data.coordinates;
                        console.log('? Using vehicle coordinates:', returnPoint);
                    }
                }
            } catch (error) {
                console.error('? Error fetching vehicle location:', error);
            }
        }

        if (returnPoint) {
            setReturnCoordinates(returnPoint);
            console.log('? Return point set successfully');
        } else {
            console.error('? Could not determine return point');
            Alert.alert(
                'Error de ubicaci�n',
                'No se pudo determinar el punto de devoluci�n. Por favor contacta con el host.',
                [{ text: 'Entendido' }]
            );
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                getCurrentLocation();
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
            
            if (returnCoordinates) {
                const dist = calculateDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    returnCoordinates.latitude,
                    returnCoordinates.longitude
                );
                setDistance(dist);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; 
    };

    const handleStartReturn = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            // Start check-out process in Firestore
            const checkOutId = await startCheckOut(
                reservation.id,
                reservation.vehicleId,
                user.uid,
                reservation.arrendadorId
            );
            
            // Navigate to photos
            navigation.replace('CheckOutPhotos', { 
                reservation, 
                checkOutId 
            });
        } catch (error) {
            console.error('Error starting check-out:', error);
            Alert.alert('Error', 'No se pudo iniciar el proceso. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleDevSkip = () => {
        navigation.replace('CheckOutPhotos', { 
            reservation, 
            checkOutId: 'DEV_SKIP_' + Date.now() 
        });
    };

    const isWithinRange = distance !== null && distance <= 0.5; // 500 meters

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Finalizar Viaje</Text>
                <TouchableOpacity 
                    onPress={handleDevSkip} 
                    style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 }}
                >
                    <Text style={{ color: 'white', fontSize: 10, fontFamily: typography.fonts.bold }}>SKIP</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Vehicle Info Card */}
                <View style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                        <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: '#EFF6FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Ionicons name="car-sport" size={24} color="#0B729D" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleName}>
                                {reservation.vehicleSnapshot?.marca} {reservation.vehicleSnapshot?.modelo}
                            </Text>
                            <Text style={styles.vehicleYear}>{reservation.vehicleSnapshot?.anio}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: '#FEF3C7',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name="flag" size={28} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>Punto de Devoluci�n</Text>
                        <Text style={styles.cardText}>
                            Dir�gete al punto acordado para iniciar la devoluci�n del veh�culo
                        </Text>
                    </View>
                </View>

                <View style={styles.mapContainer}>
                    {returnCoordinates ? (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={{
                                latitude: returnCoordinates.latitude,
                                longitude: returnCoordinates.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                        >
                            <Marker
                                coordinate={returnCoordinates}
                                title="Punto de Devoluci�n"
                                pinColor="red"
                            />
                            <Circle
                                center={returnCoordinates}
                                radius={500}
                                fillColor="rgba(220, 38, 38, 0.1)"
                                strokeColor="rgba(220, 38, 38, 0.5)"
                            />
                            {userLocation && (
                                <Marker
                                    coordinate={userLocation}
                                    title="T�"
                                    pinColor="blue"
                                />
                            )}
                        </MapView>
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <Text>Cargando ubicaci�n...</Text>
                        </View>
                    )}
                </View>

                {distance !== null && (
                    <View style={[styles.distanceCard, isWithinRange ? styles.distanceOk : styles.distanceFar]}>
                        <Ionicons 
                            name={isWithinRange ? "checkmark-circle" : "alert-circle"} 
                            size={24} 
                            color={isWithinRange ? "#16A34A" : "#DC2626"} 
                        />
                        <Text style={[styles.distanceText, { color: isWithinRange ? "#16A34A" : "#DC2626" }]}>
                            {isWithinRange 
                                ? "Est�s en el punto de devoluci�n"
                                : `Est�s a ${(distance).toFixed(2)} km del punto de entrega`
                            }
                        </Text>
                    </View>
                )}

                <View style={styles.stepsCard}>
                    <Text style={styles.stepsTitle}>?? Proceso de Devoluci�n</Text>
                    
                    <View style={styles.step}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNum}>1</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>Ubicaci�n</Text>
                            <Text style={styles.stepDesc}>Estaciona en un lugar seguro cerca del punto acordado</Text>
                        </View>
                        <Ionicons name="location" size={20} color="#6B7280" />
                    </View>
                    
                    <View style={styles.stepDivider} />
                    
                    <View style={styles.step}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNum}>2</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>Fotograf�as</Text>
                            <Text style={styles.stepDesc}>Documenta el estado final del veh�culo</Text>
                        </View>
                        <Ionicons name="camera" size={20} color="#6B7280" />
                    </View>
                    
                    <View style={styles.stepDivider} />
                    
                    <View style={styles.step}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNum}>3</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>Condiciones</Text>
                            <Text style={styles.stepDesc}>Reporta nivel de combustible y kilometraje</Text>
                        </View>
                        <Ionicons name="speedometer" size={20} color="#6B7280" />
                    </View>
                    
                    <View style={styles.stepDivider} />
                    
                    <View style={styles.step}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNum}>4</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>Finalizaci�n</Text>
                            <Text style={styles.stepDesc}>Entrega las llaves al propietario</Text>
                        </View>
                        <Ionicons name="key" size={20} color="#6B7280" />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={handleStartReturn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="flag" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Comenzar Devoluci�n</Text>
                        </>
                    )}
                </TouchableOpacity>
                
                {!isWithinRange && (
                    <View style={styles.warningCard}>
                        <Ionicons name="information-circle" size={18} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Est�s lejos del punto. Puedes continuar de todas formas.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
        borderBottomColor: '#FAFAFA',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: '#333333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        gap: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: '#333333',
    },
    cardText: {
        fontSize: 14,
        color: '#757575',
        marginTop: 4,
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#E0E0E0',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    distanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
    },
    vehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vehicleName: {
        fontSize: 18,
        fontFamily: typography.fonts.extraBold,
        color: '#111827',
    },
    vehicleYear: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    stepsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    stepsTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.extraBold,
        color: '#111827',
        marginBottom: 20,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#BFDBFE',
    },
    stepNum: {
        fontSize: 16,
        fontFamily: typography.fonts.extraBold,
        color: '#0B729D',
    },
    stepTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: '#111827',
        marginBottom: 2,
    },
    stepDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    stepDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
        marginLeft: 52,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#FAFAFA',
    },
    button: {
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontFamily: typography.fonts.extraBold,
        fontSize: 16,
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 10,
        marginTop: 12,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        fontFamily: typography.fonts.semiBold,
    },
});
