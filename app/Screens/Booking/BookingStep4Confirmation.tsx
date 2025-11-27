import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import { checkAvailability, createReservation, getVehicleReservations } from '../../services/reservations';

export default function BookingStep4Confirmation() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate, pickupLocation, returnLocation, pickupTime, returnTime } = route.params;
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const pTime = new Date(pickupTime);
    const rTime = new Date(returnTime);

    const calculateTotal = () => {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays > 0 ? diffDays : 1;
        
        const subtotal = days * vehicle.precio;
        const serviceFee = subtotal * 0.10; // 10% fee
        const total = subtotal + serviceFee;

        return { days, subtotal, serviceFee, total };
    };

    const { days, subtotal, serviceFee, total } = calculateTotal();

    const handleConfirm = async () => {
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para reservar.');
            return;
        }

        try {
            setLoading(true);

            // 1. Check availability again (concurrency check)
            const existingReservations = await getVehicleReservations(vehicle.id);
            const isAvailable = checkAvailability(start, end, existingReservations);

            if (!isAvailable) {
                Alert.alert('No disponible', 'Lo sentimos, estas fechas ya no están disponibles. Por favor selecciona otras.');
                return;
            }

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await createReservation({
                vehicleId: vehicle.id,
                userId: user.uid,
                arrendadorId: vehicle.arrendadorId || vehicle.propietarioId, // Ensure we capture the owner ID
                startDate: Timestamp.fromDate(start),
                endDate: Timestamp.fromDate(end),
                status: 'pending',
                totalPrice: total,
                pickupLocation,
                returnLocation,
                pickupTime: pTime.toISOString(),
                returnTime: rTime.toISOString(),
                messageToHost: message,
                vehicleSnapshot: {
                    marca: vehicle.marca,
                    modelo: vehicle.modelo,
                    anio: vehicle.anio,
                    imagen: vehicle.imagenes?.[0] || vehicle.imagen
                }
            });

            Alert.alert(
                '¡Solicitud Enviada!',
                'Tu solicitud de reserva ha sido enviada al arrendador. Te notificaremos cuando sea aceptada.',
                [
                    { 
                        text: 'Ir a mis viajes', 
                        onPress: () => (navigation as any).navigate('HomeArrendatario', { screen: 'Viajes' }) 
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear la reserva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: '100%' }]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepTitle}>Paso 4 de 4</Text>
                <Text style={styles.title}>Confirmar y pagar</Text>
                <Text style={styles.subtitle}>Revisa los detalles de tu reserva</Text>

                {/* Vehicle Summary Card */}
                <View style={styles.vehicleCard}>
                    <Image 
                        source={{ uri: vehicle.imagenes?.[0] || vehicle.imagen }} 
                        style={styles.vehicleImage}
                        contentFit="cover"
                    />
                    <View style={styles.vehicleInfo}>
                        <View>
                            <Text style={styles.vehicleBrand}>{vehicle.marca}</Text>
                            <Text style={styles.vehicleModel}>{vehicle.modelo} {vehicle.anio}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.ratingText}>{vehicle.rating || 'New'}</Text>
                        </View>
                    </View>
                </View>

                {/* Trip Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tu viaje</Text>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="calendar-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Fechas</Text>
                            <Text style={styles.detailValue}>
                                {start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.editLink}>Editar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="time-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Horario</Text>
                            <Text style={styles.detailValue}>
                                {pTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {rTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="location-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Ubicación</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{pickupLocation}</Text>
                        </View>
                    </View>
                </View>

                {/* Message to Host */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mensaje al anfitrión (opcional)</Text>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Hola, me gustaría rentar tu auto..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        value={message}
                        onChangeText={setMessage}
                        textAlignVertical="top"
                    />
                </View>

                {/* Price Breakdown */}
                <View style={styles.priceSection}>
                    <Text style={styles.sectionTitle}>Detalles del precio</Text>
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>${vehicle.precio} x {days} días</Text>
                        <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tarifa de servicio Rentik</Text>
                        <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total (USD)</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.confirmButton, loading && styles.disabledButton]} 
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.confirmButtonText}>Confirmar y pagar</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        backgroundColor: '#fff',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
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
    vehicleCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    vehicleImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
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
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    editLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
        textDecorationLine: 'underline',
    },
    messageInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
    },
    priceSection: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: '#4B5563',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0B729D',
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
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    confirmButton: {
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
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
