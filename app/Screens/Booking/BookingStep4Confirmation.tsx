import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar y pagar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Vehicle Summary */}
                <View style={styles.vehicleCard}>
                    <Image 
                        source={{ uri: vehicle.imagen }} 
                        style={styles.vehicleImage} 
                        contentFit="cover"
                        transition={500}
                    />
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.brand}>{vehicle.marca} {vehicle.modelo}</Text>
                        <Text style={styles.year}>{vehicle.anio}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.rating}>{vehicle.rating.toFixed(1)}</Text>
                            <Text style={styles.reviews}>({vehicle.reviewCount} reseñas)</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Trip Details */}
                <Text style={styles.sectionTitle}>Tu viaje</Text>
                
                <View style={styles.detailRow}>
                    <View>
                        <Text style={styles.detailLabel}>Fechas</Text>
                        <Text style={styles.detailValue}>
                            {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('BookingStep1Dates' as never)}>
                        <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.detailRow}>
                    <View>
                        <Text style={styles.detailLabel}>Horario</Text>
                        <Text style={styles.detailValue}>
                            {pTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {rTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('BookingStep3Time' as never)}>
                        <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.detailRow}>
                    <View>
                        <Text style={styles.detailLabel}>Ubicación</Text>
                        <Text style={styles.detailValue}>{pickupLocation}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('BookingStep2Location' as never)}>
                        <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Message to Host */}
                <Text style={styles.sectionTitle}>Mensaje al anfitrión</Text>
                <Text style={styles.helperText}>Cuéntale un poco sobre tu viaje y por qué te interesa su auto.</Text>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Hola, me gustaría reservar tu auto para..."
                    multiline
                    numberOfLines={4}
                    value={message}
                    onChangeText={setMessage}
                    textAlignVertical="top"
                />

                <View style={styles.divider} />

                {/* Price Breakdown */}
                <Text style={styles.sectionTitle}>Detalle del precio</Text>
                <View style={styles.priceBreakdown}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>${vehicle.precio} x {days} días</Text>
                        <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tarifa de servicio (10%)</Text>
                        <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total (USD)</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Payment Method */}
                <Text style={styles.sectionTitle}>Método de pago</Text>
                <View style={styles.paymentCard}>
                    <View style={styles.paymentRow}>
                        <Ionicons name="card" size={24} color="#111827" />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentMethod}>Visa terminada en 4242</Text>
                            <Text style={styles.paymentExpiry}>Expira 12/28</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color="#0B729D" />
                    </View>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.confirmButton, loading && { opacity: 0.7 }]} 
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirmar y pagar</Text>
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
        paddingTop: 50,
        paddingBottom: 15,
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
        gap: 16,
        marginBottom: 24,
    },
    vehicleImage: {
        width: 100,
        height: 70,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    vehicleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    brand: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    year: {
        fontSize: 14,
        color: '#6B7280',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    rating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    reviews: {
        fontSize: 12,
        color: '#6B7280',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: '#6B7280',
    },
    editText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
        textDecorationLine: 'underline',
    },
    helperText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
        backgroundColor: '#F9FAFB',
    },
    priceBreakdown: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
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
        fontWeight: '600',
        color: '#111827',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    paymentCard: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentMethod: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    paymentExpiry: {
        fontSize: 12,
        color: '#6B7280',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
        paddingBottom: 34,
    },
    confirmButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
