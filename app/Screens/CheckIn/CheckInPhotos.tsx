import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
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
import { Firebaseauth, storage } from '../../FirebaseConfig';
import { saveCheckInPhotos } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

interface PhotoSlot {
    key: keyof PhotosType;
    label: string;
    icon: string;
    description: string;
}

interface PhotosType {
    front?: string;
    left?: string;
    back?: string;
    right?: string;
    interiorFront?: string;
    interiorBack?: string;
    dashboard?: string;
    fuelLevel?: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
    { key: 'front', label: 'Frente', icon: 'car-outline', description: 'Vista frontal completa' },
    { key: 'left', label: 'Lado izquierdo', icon: 'car-outline', description: 'Lado del conductor' },
    { key: 'back', label: 'Parte trasera', icon: 'car-outline', description: 'Vista trasera completa' },
    { key: 'right', label: 'Lado derecho', icon: 'car-outline', description: 'Lado del copiloto' },
    { key: 'interiorFront', label: 'Interior (delante)', icon: 'albums-outline', description: 'Asientos delanteros' },
    { key: 'interiorBack', label: 'Interior (atrás)', icon: 'albums-outline', description: 'Asientos traseros' },
    { key: 'dashboard', label: 'Tablero/Kilometraje', icon: 'speedometer-outline', description: 'Odómetro visible' },
    { key: 'fuelLevel', label: 'Nivel de gasolina', icon: 'water-outline', description: 'Medidor de combustible' },
];

export default function CheckInPhotos() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, checkInId } = route.params as { reservation: Reservation; checkInId: string };
    
    const [photos, setPhotos] = useState<PhotosType>({});
    const [uploading, setUploading] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const requestCameraPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Necesitamos acceso a la cámara para tomar fotos del vehículo.',
                [{ text: 'Entendido' }]
            );
            return false;
        }
        return true;
    };

    const takePhoto = async (slot: PhotoSlot) => {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) return;

        try {
            // Compatibility: use MediaType if available, else fallback to deprecated MediaTypeOptions
            // Prefer new API; fall back to literal 'images' to avoid deprecation warnings
            const mediaTypes: any = (ImagePicker as any).MediaType?.Images ?? 'images';
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadPhoto(slot.key, result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
        }
    };

    const uploadPhoto = async (key: keyof PhotosType, uri: string) => {
        try {
            if (!Firebaseauth.currentUser) {
                Alert.alert('Error', 'No estás autenticado. Por favor inicia sesión nuevamente.');
                return;
            }
            console.log('Uploading photo as user:', Firebaseauth.currentUser.uid);
            setUploading(key);
            
            // Fetch the image
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Create storage reference
            const filename = `checkIns/${checkInId}/${key}_${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            
            // Upload
            await uploadBytes(storageRef, blob);
            
            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);
            
            // Update local state
            setPhotos(prev => ({ ...prev, [key]: downloadURL }));
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
        } finally {
            setUploading(null);
        }
    };

    const retakePhoto = (slot: PhotoSlot) => {
        Alert.alert(
            'Retomar foto',
            `¿Quieres retomar la foto de ${slot.label.toLowerCase()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Retomar', onPress: () => takePhoto(slot) }
            ]
        );
    };

    const handleContinue = async () => {
        // Check all photos are taken
        const missingPhotos = PHOTO_SLOTS.filter(slot => !photos[slot.key]);
        
        if (missingPhotos.length > 0) {
            Alert.alert(
                'Fotos incompletas',
                `Faltan ${missingPhotos.length} foto(s): ${missingPhotos.map(s => s.label).join(', ')}`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        try {
            setSaving(true);
            
            // Save photos to Firestore
            await saveCheckInPhotos(checkInId, photos);
            
            // Navigate to conditions screen
            navigation.navigate('CheckInConditions', { 
                reservation, 
                checkInId 
            });
            
        } catch (error) {
            console.error('Error saving photos:', error);
            Alert.alert('Error', 'No se pudieron guardar las fotos. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const completedCount = Object.keys(photos).length;
    const totalCount = PHOTO_SLOTS.length;
    const progress = (completedCount / totalCount) * 100;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Fotos del vehículo</Text>
                    <Text style={styles.headerSubtitle}>{completedCount} de {totalCount} completadas</Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Ionicons name="information-circle" size={24} color="#0B729D" />
                    <Text style={styles.instructionsText}>
                        Toma fotos claras de cada parte del vehículo. Estas fotos servirán como evidencia del estado actual.
                    </Text>
                </View>

                {/* Vehicle info */}
                <View style={styles.vehicleCard}>
                    <Text style={styles.vehicleName}>
                        {reservation.vehicleSnapshot?.marca} {reservation.vehicleSnapshot?.modelo}
                    </Text>
                    <Text style={styles.vehicleYear}>{reservation.vehicleSnapshot?.anio}</Text>
                </View>

                {/* Photo grid */}
                <View style={styles.photoGrid}>
                    {PHOTO_SLOTS.map((slot) => {
                        const photoUri = photos[slot.key];
                        const isUploading = uploading === slot.key;

                        return (
                            <View key={slot.key} style={styles.photoCard}>
                                <View style={styles.photoHeader}>
                                    <View style={styles.photoHeaderLeft}>
                                        <Ionicons name={slot.icon as any} size={20} color="#0B729D" />
                                        <View>
                                            <Text style={styles.photoLabel}>{slot.label}</Text>
                                            <Text style={styles.photoDescription}>{slot.description}</Text>
                                        </View>
                                    </View>
                                    {photoUri && (
                                        <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                                    )}
                                </View>

                                {/* Photo preview or placeholder */}
                                <TouchableOpacity
                                    style={styles.photoPreview}
                                    onPress={() => photoUri ? retakePhoto(slot) : takePhoto(slot)}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <View style={styles.photoPlaceholder}>
                                            <ActivityIndicator size="large" color="#0B729D" />
                                            <Text style={styles.uploadingText}>Subiendo...</Text>
                                        </View>
                                    ) : photoUri ? (
                                        <>
                                            <Image
                                                source={{ uri: photoUri }}
                                                style={styles.photoImage}
                                                contentFit="cover"
                                            />
                                            <View style={styles.retakeOverlay}>
                                                <Ionicons name="camera" size={24} color="#fff" />
                                                <Text style={styles.retakeText}>Retomar</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            <Ionicons name="camera" size={40} color="#9CA3AF" />
                                            <Text style={styles.placeholderText}>Tomar foto</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Tips section */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Consejos para mejores fotos</Text>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>Toma las fotos con buena iluminación</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>Asegúrate que no estén borrosas</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>Captura todo el ángulo solicitado</Text>
                    </View>
                    <View style={styles.tipRow}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>El kilometraje y gasolina deben ser legibles</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom action button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={{ marginBottom: 12, alignItems: 'center', padding: 8 }}
                    onPress={() => {
                        navigation.navigate('CheckInConditions', { 
                            reservation, 
                            checkInId 
                        });
                    }}
                >
                    <Text style={{ color: '#6B7280', textDecorationLine: 'underline', fontSize: 14 }}>
                        Saltar fotos (Solo prueba)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        completedCount < totalCount && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={completedCount < totalCount || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continuar al checklist</Text>
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
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0B729D',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0B729D',
        minWidth: 40,
        textAlign: 'right',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    instructionsCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 16,
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
        borderRadius: 12,
        marginBottom: 20,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    vehicleYear: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    photoGrid: {
        gap: 16,
    },
    photoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    photoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    photoHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    photoLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    photoDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    photoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    uploadingText: {
        fontSize: 14,
        color: '#0B729D',
        fontWeight: '500',
    },
    retakeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    retakeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    tipsCard: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 12,
    },
    tipRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    tipBullet: {
        fontSize: 14,
        color: '#92400E',
        marginRight: 8,
        fontWeight: '700',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#78350F',
        lineHeight: 18,
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
    continueButton: {
        flexDirection: 'row',
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
