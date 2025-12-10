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
    const { vehicle, startDate, endDate, pickupLocation, returnLocation, pickupTime, returnTime, isDelivery, deliveryAddress, deliveryCoords, deliveryCost = 0, deliveryDistance = '' } = route.params;
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [extras, setExtras] = useState({
        babySeat: false,
        insurance: false,
        gps: false
    });

    const EXTRAS_PRICES = {
        babySeat: 10, // Flat fee
        insurance: 15, // Per day
        gps: 5 // Per day
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const pTime = new Date(pickupTime);
    const rTime = new Date(returnTime);

    const calculateTotal = () => {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays > 0 ? diffDays : 1;
        
        const rentalCost = days * vehicle.precio;
        
        let extrasTotal = 0;
        if (extras.babySeat) extrasTotal += EXTRAS_PRICES.babySeat;
        if (extras.insurance) extrasTotal += EXTRAS_PRICES.insurance * days;
        if (extras.gps) extrasTotal += EXTRAS_PRICES.gps * days;

        const deliveryFee = isDelivery ? deliveryCost : 0;

        const subtotal = rentalCost + extrasTotal + deliveryFee;
        const serviceFee = subtotal * 0.10; // 10% fee
        const total = subtotal + serviceFee;

        return { days, rentalCost, extrasTotal, deliveryFee, serviceFee, total };
    };

    const { days, rentalCost, extrasTotal, deliveryFee, serviceFee, total } = calculateTotal();

    const handleConfirm = async () => {
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para reservar.');
            return;
        }

        try {
            setLoading(true);

            // Log vehicle data for debugging
            console.log('🚗 Vehicle Data Debug:', {
                id: vehicle.id,
                marca: vehicle.marca,
                modelo: vehicle.modelo,
                arrendadorId: vehicle.arrendadorId,
                propietarioId: vehicle.propietarioId,
                allKeys: Object.keys(vehicle)
            });

            // 1. Check availability again (concurrency check)
            const existingReservations = await getVehicleReservations(vehicle.id);
            const isAvailable = checkAvailability(start, end, existingReservations);

            if (!isAvailable) {
                Alert.alert('No disponible', 'Lo sentimos, estas fechas ya no están disponibles. Por favor selecciona otras.');
                return;
            }

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Validate arrendadorId
            const arrendadorId = vehicle.arrendadorId || vehicle.propietarioId;
            if (!arrendadorId) {
                console.error('Vehicle data:', vehicle);
                Alert.alert('Error', 'No se pudo identificar al propietario del vehículo. Por favor contacta soporte.');
                return;
            }

            // Build reservation object, only including optional fields if they have values
            const reservationData: any = {
                vehicleId: vehicle.id,
                userId: user.uid,
                arrendadorId: arrendadorId,
                startDate: Timestamp.fromDate(start),
                endDate: Timestamp.fromDate(end),
                status: 'pending',
                totalPrice: total,
                pickupLocation,
                returnLocation,
                pickupTime: pTime.toISOString(),
                returnTime: rTime.toISOString(),
                isDelivery,
                vehicleSnapshot: {
                    marca: vehicle.marca,
                    modelo: vehicle.modelo,
                    anio: vehicle.anio,
                    imagen: vehicle.imagenes?.[0] || vehicle.imagen
                },
                extras,
                priceBreakdown: {
                    days,
                    pricePerDay: vehicle.precio,
                    deliveryFee,
                    extrasTotal,
                    serviceFee,
                    subtotal: rentalCost + extrasTotal + deliveryFee,
                    total
                }
            };

            // Only add optional fields if they exist
            if (deliveryAddress) {
                reservationData.deliveryAddress = deliveryAddress;
            }
            if (deliveryCoords) {
                reservationData.deliveryCoords = deliveryCoords;
            }
            if (message) {
                reservationData.messageToHost = message;
            }

            // Log reservation data before creating
            console.log('📝 Creating reservation with data:', {
                ...reservationData,
                startDate: 'Timestamp',
                endDate: 'Timestamp'
            });

            await createReservation(reservationData);

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
                {/* Step Indicators */}
                <View style={styles.stepIndicators}>
                    <View style={styles.stepIndicatorComplete}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={styles.stepIndicatorLine} />
                    <View style={styles.stepIndicatorComplete}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={styles.stepIndicatorLine} />
                    <View style={styles.stepIndicatorComplete}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={styles.stepIndicatorLine} />
                    <View style={styles.stepIndicatorActive}>
                        <Text style={styles.stepIndicatorNumber}>4</Text>
                    </View>
                </View>

                <Text style={styles.stepTitle}>Paso 4 de 4</Text>
                <Text style={styles.title}>Confirmar y enviar</Text>
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
                            <Ionicons name={isDelivery ? "car-outline" : "location-outline"} size={20} color="#0B729D" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>{isDelivery ? 'Entrega (Delivery)' : 'Ubicación de recogida'}</Text>
                            <Text style={styles.detailValue} numberOfLines={2}>
                                {isDelivery ? deliveryAddress : pickupLocation}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Extras */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Extras opcionales</Text>
                    <Text style={styles.sectionSubtitle}>Mejora tu experiencia de viaje</Text>
                    
                    <TouchableOpacity 
                        style={[styles.extraRow, extras.insurance && styles.extraRowSelected]} 
                        onPress={() => setExtras({...extras, insurance: !extras.insurance})}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.extraIcon, { backgroundColor: extras.insurance ? '#DBEAFE' : '#F3F4F6' }]}>
                            <Ionicons name="shield-checkmark" size={24} color={extras.insurance ? "#0B729D" : "#9CA3AF"} />
                        </View>
                        <View style={styles.extraInfo}>
                            <View style={styles.extraHeader}>
                                <Text style={styles.extraTitle}>Seguro Premium</Text>
                                {extras.insurance && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>Popular</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.extraDesc}>Cobertura total contra daños y robo</Text>
                            <Text style={styles.extraPrice}>${EXTRAS_PRICES.insurance}/día</Text>
                        </View>
                        <View style={[styles.checkbox, extras.insurance && styles.checkboxSelected]}>
                            {extras.insurance && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.extraRow, extras.babySeat && styles.extraRowSelected]} 
                        onPress={() => setExtras({...extras, babySeat: !extras.babySeat})}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.extraIcon, { backgroundColor: extras.babySeat ? '#DBEAFE' : '#F3F4F6' }]}>
                            <Ionicons name="person" size={24} color={extras.babySeat ? "#0B729D" : "#9CA3AF"} />
                        </View>
                        <View style={styles.extraInfo}>
                            <Text style={styles.extraTitle}>Silla de bebé</Text>
                            <Text style={styles.extraDesc}>Para niños de 0 a 4 años</Text>
                            <Text style={styles.extraPrice}>${EXTRAS_PRICES.babySeat} (pago único)</Text>
                        </View>
                        <View style={[styles.checkbox, extras.babySeat && styles.checkboxSelected]}>
                            {extras.babySeat && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.extraRow, extras.gps && styles.extraRowSelected]} 
                        onPress={() => setExtras({...extras, gps: !extras.gps})}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.extraIcon, { backgroundColor: extras.gps ? '#DBEAFE' : '#F3F4F6' }]}>
                            <Ionicons name="navigate" size={24} color={extras.gps ? "#0B729D" : "#9CA3AF"} />
                        </View>
                        <View style={styles.extraInfo}>
                            <Text style={styles.extraTitle}>GPS Navegador</Text>
                            <Text style={styles.extraDesc}>Mapas actualizados y tráfico en tiempo real</Text>
                            <Text style={styles.extraPrice}>${EXTRAS_PRICES.gps}/día</Text>
                        </View>
                        <View style={[styles.checkbox, extras.gps && styles.checkboxSelected]}>
                            {extras.gps && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                    </TouchableOpacity>
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

                {/* Cancellation Policy */}
                <View style={styles.policySection}>
                    <View style={styles.policySectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                        <Text style={styles.policyTitle}>Política de cancelación</Text>
                    </View>
                    <View style={styles.policyContent}>
                        <View style={styles.policyItem}>
                            <View style={styles.policyIconBadge}>
                                <Ionicons name="time-outline" size={16} color="#10B981" />
                            </View>
                            <View style={styles.policyText}>
                                <Text style={styles.policyLabel}>Cancelación gratuita</Text>
                                <Text style={styles.policyDescription}>
                                    Hasta 48 horas antes de la recogida
                                </Text>
                            </View>
                        </View>
                        <View style={styles.policyItem}>
                            <View style={styles.policyIconBadge}>
                                <Ionicons name="cash-outline" size={16} color="#F59E0B" />
                            </View>
                            <View style={styles.policyText}>
                                <Text style={styles.policyLabel}>Reembolso parcial (50%)</Text>
                                <Text style={styles.policyDescription}>
                                    Entre 24-48 horas antes
                                </Text>
                            </View>
                        </View>
                        <View style={styles.policyItem}>
                            <View style={styles.policyIconBadge}>
                                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                            </View>
                            <View style={styles.policyText}>
                                <Text style={styles.policyLabel}>Sin reembolso</Text>
                                <Text style={styles.policyDescription}>
                                    Menos de 24 horas antes o no show
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.policyNote}>
                        <Ionicons name="information-circle" size={16} color="#6B7280" />
                        <Text style={styles.policyNoteText}>
                            El reembolso se procesa en 5-7 días hábiles
                        </Text>
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={styles.priceSection}>
                    <View style={styles.priceSectionHeader}>
                        <Ionicons name="calculator-outline" size={22} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Detalles del precio</Text>
                    </View>
                    
                    <View style={styles.priceBreakdownCard}>
                        <View style={styles.priceRow}>
                            <View style={styles.priceRowLeft}>
                                <Text style={styles.priceLabel}>${vehicle.precio} × {days} día{days > 1 ? 's' : ''}</Text>
                                <Text style={styles.priceSubtext}>Renta base</Text>
                            </View>
                            <Text style={styles.priceValue}>${rentalCost.toFixed(2)}</Text>
                        </View>

                        {extrasTotal > 0 && (
                            <View style={styles.priceRow}>
                                <View style={styles.priceRowLeft}>
                                    <Text style={styles.priceLabel}>Extras</Text>
                                    <Text style={styles.priceSubtext}>
                                        {[
                                            extras.insurance && 'Seguro',
                                            extras.babySeat && 'Silla bebé',
                                            extras.gps && 'GPS'
                                        ].filter(Boolean).join(', ')}
                                    </Text>
                                </View>
                                <Text style={styles.priceValue}>${extrasTotal.toFixed(2)}</Text>
                            </View>
                        )}

                        {isDelivery && (
                            <View style={styles.priceRow}>
                                <View style={styles.priceRowLeft}>
                                    <Text style={styles.priceLabel}>Delivery</Text>
                                    <Text style={styles.priceSubtext}>
                                        {deliveryDistance ? `${deliveryDistance} - Entrega y recogida` : 'Entrega a domicilio'}
                                    </Text>
                                </View>
                                <Text style={styles.priceValue}>${deliveryFee.toFixed(2)}</Text>
                            </View>
                        )}
                        
                        <View style={styles.priceRow}>
                            <View style={styles.priceRowLeft}>
                                <Text style={styles.priceLabel}>Servicio Rentik</Text>
                                <Text style={styles.priceSubtext}>10% del subtotal</Text>
                            </View>
                            <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <View>
                                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                                <Text style={styles.totalSubtext}>Pago seguro con Stripe</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Method Section */}
                <View style={styles.paymentSection}>
                    <View style={styles.paymentHeader}>
                        <Ionicons name="card-outline" size={22} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Método de pago</Text>
                        <View style={styles.secureBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                            <Text style={styles.secureBadgeText}>Seguro</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.paymentMethod}>
                        <View style={styles.paymentMethodLeft}>
                            <View style={styles.paymentIconContainer}>
                                <Ionicons name="card" size={24} color="#0B729D" />
                            </View>
                            <View>
                                <Text style={styles.paymentMethodTitle}>Tarjeta de crédito/débito</Text>
                                <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, American Express</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.paymentFeatures}>
                        <View style={styles.paymentFeature}>
                            <Ionicons name="lock-closed" size={16} color="#10B981" />
                            <Text style={styles.paymentFeatureText}>Encriptación SSL 256-bit</Text>
                        </View>
                        <View style={styles.paymentFeature}>
                            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                            <Text style={styles.paymentFeatureText}>Certificado PCI DSS</Text>
                        </View>
                        <View style={styles.paymentFeature}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.paymentFeatureText}>Protección del comprador</Text>
                        </View>
                    </View>

                    <View style={styles.paymentLogos}>
                        <View style={styles.paymentLogo}>
                            <Text style={styles.paymentLogoText}>VISA</Text>
                        </View>
                        <View style={styles.paymentLogo}>
                            <Text style={styles.paymentLogoText}>MC</Text>
                        </View>
                        <View style={styles.paymentLogo}>
                            <Text style={styles.paymentLogoText}>AMEX</Text>
                        </View>
                        <View style={styles.paymentLogo}>
                            <Text style={styles.paymentLogoText}>Stripe</Text>
                        </View>
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
                            <Text style={styles.confirmButtonText}>Confirmar y enviar</Text>
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
    stepIndicatorNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    stepIndicatorLine: {
        width: 40,
        height: 2,
        backgroundColor: '#10B981',
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
    policySection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    policySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    policyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    policyContent: {
        gap: 16,
    },
    policyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    policyIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    policyText: {
        flex: 1,
    },
    policyLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    policyDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    policyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    policyNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
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
        marginBottom: 24,
    },
    priceSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    priceBreakdownCard: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceRowLeft: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    priceSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
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
        paddingTop: 4,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    totalValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0B729D',
        textAlign: 'right',
    },
    totalSubtext: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        textAlign: 'right',
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
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: -8,
        marginBottom: 16,
    },
    paymentSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    paymentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    secureBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0B729D',
        marginBottom: 16,
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentMethodTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    paymentMethodSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    paymentFeatures: {
        gap: 10,
        marginBottom: 16,
    },
    paymentFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentFeatureText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    paymentLogos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    paymentLogo: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    paymentLogoText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    extraRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    extraRowSelected: {
        borderColor: '#0B729D',
        backgroundColor: '#F0F9FF',
    },
    extraIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    extraInfo: {
        flex: 1,
    },
    extraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    extraTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    popularBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#F59E0B',
    },
    extraDesc: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
        lineHeight: 18,
    },
    extraPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B729D',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    checkboxSelected: {
        backgroundColor: '#0B729D',
        borderColor: '#0B729D',
    },
});
