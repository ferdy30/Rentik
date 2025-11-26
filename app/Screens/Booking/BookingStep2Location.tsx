import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
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
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ubicación</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Confirma los puntos de encuentro</Text>

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
                    <View style={styles.divider} />
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
                    <Text style={styles.nextButtonText}>Siguiente</Text>
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
    subtitle: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 24,
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    locationCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
        paddingBottom: 34,
    },
    nextButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
