import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../../../FirebaseConfig';
import { useAuth } from '../../../context/Auth';
import { createChatIfNotExists } from '../../services/chat';
import { Reservation } from '../../services/reservations';

export default function TripDetails() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { reservation } = route.params as { reservation: Reservation };
    const [loadingChat, setLoadingChat] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: '#FEF9C3', text: '#854D0E' };
            case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'completed': return { bg: '#DCFCE7', text: '#166534' };
            case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
            case 'denied': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const statusColors = getStatusColor(reservation.status);

    const handleCallEmergency = () => {
        Alert.alert('Emergencia', 'Llamando al 911...');
    };

    const handleChat = async () => {
        if (!user || loadingChat) return;
        
        if (!reservation.arrendadorId) {
            Alert.alert('Error', 'No se pudo identificar al anfitrión de esta reserva.');
            return;
        }

        setLoadingChat(true);
        try {
            // Fetch user names from Firestore
            const renterDoc = await getDoc(doc(db, 'users', user.uid));
            const hostDoc = await getDoc(doc(db, 'users', reservation.arrendadorId));
            
            const renterName = renterDoc.exists() ? (renterDoc.data().nombre || 'Usuario') : 'Usuario';
            const hostName = hostDoc.exists() ? (hostDoc.data().nombre || 'Anfitrión') : 'Anfitrión';
            
            const participantNames = {
                [user.uid]: renterName,
                [reservation.arrendadorId]: hostName
            };

            const chatId = await createChatIfNotExists(
                reservation.id,
                [user.uid, reservation.arrendadorId],
                {
                    marca: reservation.vehicleSnapshot?.marca || '',
                    modelo: reservation.vehicleSnapshot?.modelo || '',
                    imagen: reservation.vehicleSnapshot?.imagen || ''
                },
                participantNames
            );

            navigation.navigate('ChatRoom', {
                reservationId: reservation.id,
                participants: [user.uid, reservation.arrendadorId],
                vehicleInfo: {
                    marca: reservation.vehicleSnapshot?.marca || '',
                    modelo: reservation.vehicleSnapshot?.modelo || '',
                    imagen: reservation.vehicleSnapshot?.imagen || ''
                }
            });
        } catch (error: any) {
            console.error('Error opening chat:', error);
            
            if (error.code === 'permission-denied') {
                Alert.alert('Acceso denegado', 'No tienes permiso para acceder a este chat.');
            } else if (error.code === 'unavailable') {
                Alert.alert('Sin conexión', 'Verifica tu conexión a internet e intenta de nuevo.');
            } else {
                Alert.alert('Error', 'No se pudo abrir el chat. Intenta de nuevo.');
            }
        } finally {
            setLoadingChat(false);
        }
    };

    const handleCheckIn = () => {
        Alert.alert('Check-in', 'Iniciando inspección del vehículo...');
        // navigation.navigate('CheckInInspection', { reservationId: reservation.id });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles del Viaje</Text>
                <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert('Ayuda', 'Contactar soporte')}>
                    <Ionicons name="help-circle-outline" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusColors.bg }]}>
                    <Ionicons name="information-circle" size={20} color={statusColors.text} />
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                        Estado: {reservation.status.toUpperCase()}
                    </Text>
                </View>

                {/* Vehicle Card */}
                <View style={styles.vehicleCard}>
                    <Image 
                        source={{ uri: reservation.vehicleSnapshot?.imagen }} 
                        style={styles.vehicleImage}
                        contentFit="cover"
                    />
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleBrand}>{reservation.vehicleSnapshot?.marca}</Text>
                        <Text style={styles.vehicleModel}>
                            {reservation.vehicleSnapshot?.modelo} {reservation.vehicleSnapshot?.anio}
                        </Text>
                        <Text style={styles.reservationId}>ID: {reservation.id.slice(0, 8)}</Text>
                    </View>
                </View>

                {/* Action Buttons (Dynamic based on status) */}
                {reservation.status === 'confirmed' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleCheckIn}>
                            <Ionicons name="qr-code-outline" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Iniciar Check-in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.secondaryButton, loadingChat && styles.buttonDisabled]} 
                            onPress={handleChat}
                            disabled={loadingChat}
                        >
                            {loadingChat ? (
                                <ActivityIndicator size="small" color="#0B729D" />
                            ) : (
                                <>
                                    <Ionicons name="chatbubble-outline" size={20} color="#0B729D" />
                                    <Text style={styles.secondaryButtonText}>Chat con anfitrión</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Trip Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del viaje</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Fechas</Text>
                            <Text style={styles.infoValue}>
                                {reservation.startDate.toDate().toLocaleDateString()} - {reservation.endDate.toDate().toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="time-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Horario</Text>
                            <Text style={styles.infoValue}>
                                {reservation.pickupTime ? new Date(reservation.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} - 
                                {reservation.returnTime ? new Date(reservation.returnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="location-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Ubicación de recogida</Text>
                            <Text style={styles.infoValue}>{reservation.pickupLocation || 'Ubicación no disponible'}</Text>
                        </View>
                    </View>
                </View>

                {/* Map */}
                <View style={styles.mapSection}>
                    <Text style={styles.sectionTitle}>Ubicación</Text>
                    <View style={styles.mapContainer}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={{
                                latitude: 13.6929, // TODO: Use real coords
                                longitude: -89.2182,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            scrollEnabled={false}
                        >
                            <Marker
                                coordinate={{ latitude: 13.6929, longitude: -89.2182 }}
                                title="Punto de encuentro"
                            />
                        </MapView>
                    </View>
                    <TouchableOpacity style={styles.directionsButton} onPress={() => Linking.openURL('https://maps.google.com')}>
                        <Text style={styles.directionsText}>Cómo llegar</Text>
                        <Ionicons name="arrow-forward" size={16} color="#0B729D" />
                    </TouchableOpacity>
                </View>

                {/* Emergency */}
                <TouchableOpacity style={styles.emergencyButton} onPress={handleCallEmergency}>
                    <Ionicons name="warning-outline" size={24} color="#EF4444" />
                    <Text style={styles.emergencyText}>Llamar a emergencias</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    helpButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    vehicleCard: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    vehicleImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#F3F4F6',
    },
    vehicleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    vehicleBrand: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    vehicleModel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    reservationId: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#0B729D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#F0F9FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#0B729D',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F9FAFB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    mapSection: {
        padding: 20,
    },
    mapContainer: {
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        gap: 8,
    },
    directionsText: {
        color: '#0B729D',
        fontWeight: '600',
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 20,
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        gap: 8,
    },
    emergencyText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});