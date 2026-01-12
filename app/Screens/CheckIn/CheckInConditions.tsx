import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Firebaseauth, storage } from '../../FirebaseConfig';
import { saveCheckInConditions } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInConditions() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, checkInId } = route.params as { reservation: Reservation; checkInId: string };
    
    const [odometer, setOdometer] = useState('');
    const [fuelLevel, setFuelLevel] = useState(50);
    const [fuelGaugePhoto, setFuelGaugePhoto] = useState<string | null>(null);
    const [exteriorCleanliness, setExteriorCleanliness] = useState(5);
    const [interiorCleanliness, setInteriorCleanliness] = useState(5);
    const [smells, setSmells] = useState(false);
    const [tiresCondition, setTiresCondition] = useState(5);
    const [lightsWorking, setLightsWorking] = useState(true);
    const [documentsPresent, setDocumentsPresent] = useState(true);
    const [saving, setSaving] = useState(false);

    const getRatingLabel = (value: number): string => {
        if (value === 1) return 'Muy malo';
        if (value === 2) return 'Malo';
        if (value === 3) return 'Regular';
        if (value === 4) return 'Bueno';
        return 'Excelente';
    };

    const getRatingColor = (value: number): string => {
        if (value <= 2) return '#DC2626';
        if (value === 3) return '#F59E0B';
        return '#16A34A';
    };

    const handleTakeFuelPhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a la c�mara para verificar el combustible.');
            return;
        }

        // Compatibility: use MediaType if available, else fallback to deprecated MediaTypeOptions
        const mediaTypes: any = (ImagePicker as any).MediaType?.Images ?? 'images';
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes,
            quality: 0.7,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets[0].uri) {
            setFuelGaugePhoto(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        try {
            if (!Firebaseauth.currentUser) {
                throw new Error('User not authenticated');
            }
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `checkIns/${checkInId}/fuel_${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleContinue = async () => {
        // Validate odometer
        if (!odometer || parseInt(odometer) <= 0) {
            Alert.alert('Error', 'Por favor ingresa el kilometraje actual del veh�culo.');
            return;
        }

        if (!fuelGaugePhoto) {
            Alert.alert('Foto requerida', 'Por favor toma una foto del medidor de combustible.');
            return;
        }

        try {
            setSaving(true);
            
            const fuelPhotoUrl = await uploadImage(fuelGaugePhoto);

            const conditions = {
                odometer: parseInt(odometer),
                fuelLevel,
                fuelGaugePhoto: fuelPhotoUrl,
                exteriorCleanliness,
                interiorCleanliness,
                smells,
                tiresCondition,
                lightsWorking,
                documentsPresent,
            };

            await saveCheckInConditions(checkInId, conditions);
            
            // Navigate to damage report screen
            navigation.replace('CheckInDamageReport', { 
                reservation, 
                checkInId 
            });
            
        } catch (error) {
            console.error('Error saving conditions:', error);
            Alert.alert('Error', 'No se pudieron guardar las condiciones. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.headerTitle}>Condiciones del Vehículo</Text>
                    <Text style={styles.headerSubtitle}>Paso 3 de 5</Text>
                </View>
                <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>3/5</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Ionicons name="clipboard-outline" size={24} color="#0B729D" />
                    <Text style={styles.instructionsText}>
                        Completa el checklist para registrar el estado actual del veh�culo.
                    </Text>
                </View>

                {/* Vehicle info */}
                <View style={styles.vehicleCard}>
                    <Text style={styles.vehicleName}>
                        {reservation.vehicleSnapshot?.marca} {reservation.vehicleSnapshot?.modelo}
                    </Text>
                    <Text style={styles.vehicleYear}>{reservation.vehicleSnapshot?.anio}</Text>
                </View>

                {/* Odometer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kilometraje actual</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="speedometer-outline" size={24} color="#757575" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 45000"
                            keyboardType="numeric"
                            value={odometer}
                            onChangeText={setOdometer}
                        />
                        <Text style={styles.inputSuffix}>km</Text>
                    </View>
                </View>

                {/* Fuel level */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nivel de combustible</Text>
                        <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                            <Text style={[styles.badgeText, { color: '#1E40AF' }]}>{fuelLevel}%</Text>
                        </View>
                    </View>
                    <View style={styles.sliderContainer}>
                        <View style={styles.fuelIndicator}>
                            <Ionicons name="water-outline" size={24} color="#0B729D" />
                            <View style={styles.fuelBar}>
                                <View style={[styles.fuelFill, { width: `${fuelLevel}%` }]} />
                            </View>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            value={fuelLevel}
                            onValueChange={setFuelLevel}
                            minimumTrackTintColor="#0B729D"
                            maximumTrackTintColor="#E0E0E0"
                            thumbTintColor="#0B729D"
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabel}>Vac�o</Text>
                            <Text style={styles.sliderLabel}>1/4</Text>
                            <Text style={styles.sliderLabel}>1/2</Text>
                            <Text style={styles.sliderLabel}>3/4</Text>
                            <Text style={styles.sliderLabel}>Lleno</Text>
                        </View>
                        
                        <TouchableOpacity style={styles.photoButton} onPress={handleTakeFuelPhoto}>
                            {fuelGaugePhoto ? (
                                <Image source={{ uri: fuelGaugePhoto }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={24} color="#0B729D" />
                                    <Text style={styles.photoText}>Foto del medidor</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Exterior cleanliness */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Limpieza exterior</Text>
                        <View style={[styles.badge, { backgroundColor: getRatingColor(exteriorCleanliness) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getRatingColor(exteriorCleanliness) }]}>
                                {getRatingLabel(exteriorCleanliness)}
                            </Text>
                        </View>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        step={1}
                        value={exteriorCleanliness}
                        onValueChange={setExteriorCleanliness}
                        minimumTrackTintColor={getRatingColor(exteriorCleanliness)}
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor={getRatingColor(exteriorCleanliness)}
                    />
                    <View style={styles.ratingDots}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <View
                                key={val}
                                style={[
                                    styles.ratingDot,
                                    val <= exteriorCleanliness && { backgroundColor: getRatingColor(exteriorCleanliness) }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Interior cleanliness */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Limpieza interior</Text>
                        <View style={[styles.badge, { backgroundColor: getRatingColor(interiorCleanliness) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getRatingColor(interiorCleanliness) }]}>
                                {getRatingLabel(interiorCleanliness)}
                            </Text>
                        </View>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        step={1}
                        value={interiorCleanliness}
                        onValueChange={setInteriorCleanliness}
                        minimumTrackTintColor={getRatingColor(interiorCleanliness)}
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor={getRatingColor(interiorCleanliness)}
                    />
                    <View style={styles.ratingDots}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <View
                                key={val}
                                style={[
                                    styles.ratingDot,
                                    val <= interiorCleanliness && { backgroundColor: getRatingColor(interiorCleanliness) }
                                ]}
                            />
                        ))}
                    </View>
                    
                    <TouchableOpacity
                        style={[styles.toggleCard, { marginTop: 16 }]}
                        onPress={() => setSmells(!smells)}
                    >
                        <View style={styles.toggleLeft}>
                            <Ionicons 
                                name="rose-outline" 
                                size={24} 
                                color={!smells ? '#16A34A' : '#DC2626'} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleTitle}>Olores extra�os</Text>
                                <Text style={styles.toggleSubtitle}>
                                    {smells ? 'Se detectan malos olores (cigarrillo, humedad, etc.)' : 'Sin olores detectados'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, smells && styles.toggleActiveRed]}>
                            <View style={[styles.toggleThumb, smells && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Tires condition */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Estado de llantas y presi�n</Text>
                        <View style={[styles.badge, { backgroundColor: getRatingColor(tiresCondition) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getRatingColor(tiresCondition) }]}>
                                {getRatingLabel(tiresCondition)}
                            </Text>
                        </View>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        step={1}
                        value={tiresCondition}
                        onValueChange={setTiresCondition}
                        minimumTrackTintColor={getRatingColor(tiresCondition)}
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor={getRatingColor(tiresCondition)}
                    />
                    <View style={styles.ratingDots}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <View
                                key={val}
                                style={[
                                    styles.ratingDot,
                                    val <= tiresCondition && { backgroundColor: getRatingColor(tiresCondition) }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Toggles section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Verificaciones</Text>
                    
                    <TouchableOpacity
                        style={styles.toggleCard}
                        onPress={() => setLightsWorking(!lightsWorking)}
                    >
                        <View style={styles.toggleLeft}>
                            <Ionicons 
                                name="bulb-outline" 
                                size={24} 
                                color={lightsWorking ? '#16A34A' : '#DC2626'} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleTitle}>Luces funcionando</Text>
                                <Text style={styles.toggleSubtitle}>Delanteras, traseras e intermitentes</Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, lightsWorking && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, lightsWorking && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toggleCard}
                        onPress={() => setDocumentsPresent(!documentsPresent)}
                    >
                        <View style={styles.toggleLeft}>
                            <Ionicons 
                                name="document-text-outline" 
                                size={24} 
                                color={documentsPresent ? '#16A34A' : '#DC2626'} 
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleTitle}>Documentos presentes</Text>
                                <Text style={styles.toggleSubtitle}>Tarjeta de circulaci�n y p�liza</Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, documentsPresent && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, documentsPresent && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom action button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={{ marginBottom: 12, alignItems: 'center', padding: 8 }}
                    onPress={() => {
                        Alert.alert(
                            'Modo Desarrollo',
                            'Guardando condiciones con datos simulados...',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'Saltar',
                                    onPress: async () => {
                                        try {
                                            setSaving(true);
                                            const mockConditions = {
                                                odometer: 50000,
                                                fuelLevel: 75,
                                                fuelGaugePhoto: 'https://via.placeholder.com/300',
                                                exteriorCleanliness: 5,
                                                interiorCleanliness: 5,
                                                smells: false,
                                                tiresCondition: 5,
                                                lightsWorking: true,
                                                documentsPresent: true,
                                            };
                                            await saveCheckInConditions(checkInId, mockConditions);
                                            navigation.navigate('CheckInDamageReport', { 
                                                reservation, 
                                                checkInId 
                                            });
                                        } catch (error) {
                                            Alert.alert('Error', 'No se pudieron guardar las condiciones.');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={{ color: '#757575', textDecorationLine: 'underline', fontSize: 14 }}>
                        [DEV] Saltar condiciones
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.continueButton, (!odometer || !fuelGaugePhoto) && { opacity: 0.6 }]}
                    onPress={handleContinue}
                    disabled={saving || !odometer || !fuelGaugePhoto}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continuar al reporte de da�os</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
        fontWeight: '700',
        color: '#333333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    progressCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0B729D',
    },
    content: {
        flex: 1,
    },
    instructionsCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 16,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    instructionsText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
    vehicleCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333333',
    },
    vehicleYear: {
        fontSize: 14,
        color: '#757575',
        marginTop: 2,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
        fontWeight: '600',
    },
    inputSuffix: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '600',
    },
    sliderContainer: {
        gap: 8,
    },
    fuelIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    fuelBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fuelFill: {
        height: '100%',
        backgroundColor: '#0B729D',
        borderRadius: 4,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderLabel: {
        fontSize: 11,
        color: '#757575',
    },
    ratingDots: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    ratingDot: {
        width: 40,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
    },
    toggleSubtitle: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    toggle: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E0E0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: '#16A34A',
    },
    toggleActiveRed: {
        backgroundColor: '#DC2626',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
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
        borderTopColor: '#FAFAFA',
    },
    continueButton: {
        flexDirection: 'row',
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    photoPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    photoText: {
        color: '#0B729D',
        fontWeight: '600',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
    },
});
