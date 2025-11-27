import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function BookingStep2Location() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate } = route.params;

    const handleNext = () => {
        navigation.navigate('BookingStep3Time' as never, { 
            vehicle, 
            startDate, 
            endDate,
            pickupLocation: vehicle.ubicacion,
            returnLocation: vehicle.ubicacion
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

            <View style={styles.content}>
                <Text style={styles.stepTitle}>Paso 2 de 4</Text>
                <Text style={styles.title}>Ubicación</Text>
                <Text style={styles.subtitle}>Confirma dónde recogerás y devolverás el auto</Text>

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
                    
                    <View style={styles.dividerContainer}>
                        <View style={styles.dashedLine} />
                    </View>

                    <View style={styles.locationRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flag" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Lugar de devolución</Text>
                            <Text style={styles.locationValue}>{vehicle.ubicacion}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
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
        backgroundColor: 'transparent', // Allow interaction if needed, or add gradient
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
    dividerContainer: {
        paddingLeft: 24,
        height: 32,
        justifyContent: 'center',
    },
    dashedLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
