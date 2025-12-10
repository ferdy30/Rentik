import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Firebaseauth, storage } from '../../../FirebaseConfig';
import { addDamageReport, CheckInReport, subscribeToCheckIn } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInDamageReport() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, checkInId } = route.params as { reservation: Reservation; checkInId: string };

    const [checkIn, setCheckIn] = useState<CheckInReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New Damage Form State
    const [damageLocation, setDamageLocation] = useState('Frente');
    const [damageType, setDamageType] = useState<'scratch' | 'dent' | 'stain' | 'crack' | 'other'>('scratch');
    const [damageSeverity, setDamageSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
    const [damageNotes, setDamageNotes] = useState('');
    const [damagePhoto, setDamagePhoto] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToCheckIn(checkInId, (data) => {
            setCheckIn(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [checkInId]);

    const handleTakeDamagePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para reportar daños.');
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
            setDamagePhoto(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        try {
            if (!Firebaseauth.currentUser) {
                throw new Error('User not authenticated');
            }
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `damages/${checkInId}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleSaveDamage = async () => {
        if (!damagePhoto) {
            Alert.alert('Foto requerida', 'Por favor toma una foto del daño.');
            return;
        }
        if (!damageNotes.trim()) {
            Alert.alert('Descripción requerida', 'Por favor describe el daño.');
            return;
        }

        setSubmitting(true);
        try {
            const photoUrl = await uploadImage(damagePhoto);
            
            const newDamage = {
                id: Date.now().toString(),
                location: damageLocation,
                type: damageType,
                severity: damageSeverity,
                photo: photoUrl,
                notes: damageNotes
            };

            await addDamageReport(checkInId, newDamage);
            
            setModalVisible(false);
            resetForm();
            Alert.alert('Éxito', 'Daño reportado correctamente');
        } catch (error) {
            console.error('Error saving damage:', error);
            Alert.alert('Error', 'No se pudo guardar el reporte de daño.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setDamageLocation('Frente');
        setDamageType('scratch');
        setDamageSeverity('minor');
        setDamageNotes('');
        setDamagePhoto(null);
    };

    const handleContinue = () => {
        navigation.navigate('CheckInKeys', { reservation, checkInId });
    };

    const renderDamageItem = ({ item }: { item: CheckInReport['damages'][0] }) => (
        <View style={styles.damageCard}>
            {item.photo && (
                <Image source={{ uri: item.photo }} style={styles.damageImage} />
            )}
            <View style={styles.damageInfo}>
                <View style={styles.damageHeader}>
                    <Text style={styles.damageLocation}>{item.location}</Text>
                    <View style={[styles.severityBadge, 
                        item.severity === 'minor' ? styles.bgGreen : 
                        item.severity === 'moderate' ? styles.bgYellow : styles.bgRed
                    ]}>
                        <Text style={styles.severityText}>
                            {item.severity === 'minor' ? 'Leve' : 
                             item.severity === 'moderate' ? 'Moderado' : 'Grave'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.damageType}>
                    {item.type === 'scratch' ? 'Rayón' :
                     item.type === 'dent' ? 'Abolladura' :
                     item.type === 'stain' ? 'Mancha' :
                     item.type === 'crack' ? 'Grieta' : 'Otro'}
                </Text>
                <Text style={styles.damageNotes}>{item.notes}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0B729D" />
                <Text style={styles.loadingText}>Cargando reportes...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reporte de Daños</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#0B729D" />
                    <Text style={styles.infoText}>
                        Reporta cualquier daño existente en el vehículo. Si no hay daños nuevos, puedes continuar.
                    </Text>
                </View>

                <FlatList
                    data={checkIn?.damages || []}
                    renderItem={renderDamageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                            <Text style={styles.emptyText}>Sin daños reportados</Text>
                            <Text style={styles.emptySubtext}>El vehículo parece estar en perfectas condiciones</Text>
                        </View>
                    }
                />

                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Reportar Daño</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Continuar a Llaves</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Add Damage Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nuevo Reporte</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Ubicación</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                            {['Frente', 'Atrás', 'Izquierda', 'Derecha', 'Techo', 'Interior', 'Llantas'].map((loc) => (
                                <TouchableOpacity
                                    key={loc}
                                    style={[styles.chip, damageLocation === loc && styles.chipSelected]}
                                    onPress={() => setDamageLocation(loc)}
                                >
                                    <Text style={[styles.chipText, damageLocation === loc && styles.chipTextSelected]}>
                                        {loc}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Tipo de Daño</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                            {[
                                { id: 'scratch', label: 'Rayón' },
                                { id: 'dent', label: 'Abolladura' },
                                { id: 'stain', label: 'Mancha' },
                                { id: 'crack', label: 'Grieta' },
                                { id: 'other', label: 'Otro' }
                            ].map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[styles.chip, damageType === type.id && styles.chipSelected]}
                                    onPress={() => setDamageType(type.id as any)}
                                >
                                    <Text style={[styles.chipText, damageType === type.id && styles.chipTextSelected]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>Severidad</Text>
                        <View style={styles.severityContainer}>
                            {[
                                { id: 'minor', label: 'Leve', color: '#10B981' },
                                { id: 'moderate', label: 'Moderado', color: '#F59E0B' },
                                { id: 'severe', label: 'Grave', color: '#EF4444' }
                            ].map((sev) => (
                                <TouchableOpacity
                                    key={sev.id}
                                    style={[
                                        styles.severityButton, 
                                        damageSeverity === sev.id && { backgroundColor: sev.color, borderColor: sev.color }
                                    ]}
                                    onPress={() => setDamageSeverity(sev.id as any)}
                                >
                                    <Text style={[
                                        styles.severityButtonText,
                                        damageSeverity === sev.id && { color: '#fff' }
                                    ]}>
                                        {sev.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Foto del Daño</Text>
                        <TouchableOpacity style={styles.photoButton} onPress={handleTakeDamagePhoto}>
                            {damagePhoto ? (
                                <Image source={{ uri: damagePhoto }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                                    <Text style={styles.photoPlaceholderText}>Tomar Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Notas</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe el daño..."
                            multiline
                            numberOfLines={3}
                            value={damageNotes}
                            onChangeText={setDamageNotes}
                        />

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                            style={[styles.saveButton, submitting && styles.buttonDisabled]} 
                            onPress={handleSaveDamage}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Guardar Reporte</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
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
    content: {
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        padding: 16,
        margin: 20,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: '#0C4A6E',
        fontSize: 14,
        lineHeight: 20,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    damageCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    damageImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    damageInfo: {
        flex: 1,
        marginLeft: 12,
    },
    damageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    damageLocation: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    bgGreen: { backgroundColor: '#D1FAE5' },
    bgYellow: { backgroundColor: '#FEF3C7' },
    bgRed: { backgroundColor: '#FEE2E2' },
    severityText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    damageType: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    damageNotes: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4B5563',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    continueButton: {
        flexDirection: 'row',
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0B729D',
    },
    chipText: {
        color: '#4B5563',
        fontSize: 14,
    },
    chipTextSelected: {
        color: '#0B729D',
        fontWeight: '600',
    },
    severityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    severityButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    severityButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    photoButton: {
        height: 200,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photoPlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    photoPlaceholderText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        textAlignVertical: 'top',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
