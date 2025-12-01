import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function BookingStep2Location() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate } = route.params;
    
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        // Simulate getting location
        setTimeout(() => {
            setDeliveryAddress('Colonia San Benito, Calle La Reforma #222');
            setIsLocating(false);
        }, 1000);
    };

    const handleNext = () => {
        navigation.navigate('BookingStep3Time' as never, { 
            vehicle, 
            startDate, 
            endDate,
            pickupLocation: deliveryType === 'delivery' ? deliveryAddress : vehicle.ubicacion,
            returnLocation: deliveryType === 'delivery' ? deliveryAddress : vehicle.ubicacion,
            isDelivery: deliveryType === 'delivery',
            deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined
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
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                                    initialRegion={{
                                        latitude: 13.6929, // Mock coords
                                        longitude: -89.2182,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                    scrollEnabled={false}
                                >
                                    <Marker
                                        coordinate={{ latitude: 13.6929, longitude: -89.2182 }}
                                        title={vehicle.ubicacion}
                                    />
                                </MapView>
                                <View style={styles.mapOverlay} />
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
                            </View>
                        </>
                    ) : (
                        <View style={styles.deliveryContainer}>
                            <View style={styles.deliveryInfoCard}>
                                <Ionicons name="information-circle" size={24} color="#0B729D" />
                                <Text style={styles.deliveryInfoText}>
                                    El anfitrión te llevará el auto a la ubicación que indiques.
                                </Text>
                            </View>

                            <Text style={styles.inputLabel}>Dirección de entrega</Text>
                            
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

                            <View style={styles.inputContainer}>
                                <Ionicons name="navigate-circle-outline" size={24} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Colonia Escalón, Calle Principal #123"
                                    placeholderTextColor="#9CA3AF"
                                    value={deliveryAddress}
                                    onChangeText={setDeliveryAddress}
                                    multiline
                                />
                            </View>
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
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
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
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 'auto',
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
