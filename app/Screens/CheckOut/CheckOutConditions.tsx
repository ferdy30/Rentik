import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography } from '../../constants/typography';
import { storage } from '../../FirebaseConfig';
import { addNewDamageReport, saveCheckOutConditions } from '../../services/checkOut';
import { Reservation } from '../../services/reservations';

export default function CheckOutConditions() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, checkOutId } = route.params as { reservation: Reservation; checkOutId: string };

    const [odometer, setOdometer] = useState('');
    const [fuelLevel, setFuelLevel] = useState('100');
    const [saving, setSaving] = useState(false);
    
    // Damage Reporting State
    const [modalVisible, setModalVisible] = useState(false);
    const [damages, setDamages] = useState<any[]>([]);
    const [damageLocation, setDamageLocation] = useState('Frente');
    const [damageType, setDamageType] = useState<'scratch' | 'dent' | 'stain' | 'crack' | 'other'>('scratch');
    const [damageSeverity, setDamageSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
    const [damageNotes, setDamageNotes] = useState('');
    const [damagePhoto, setDamagePhoto] = useState<string | null>(null);
    const [submittingDamage, setSubmittingDamage] = useState(false);

    const handleTakeDamagePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a la c�mara.');
            return;
        }

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
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `checkOuts/${checkOutId}/damages/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleSaveDamage = async () => {
        if (!damagePhoto) {
            Alert.alert('Foto requerida', 'Por favor toma una foto del da�o.');
            return;
        }
        if (!damageNotes.trim()) {
            Alert.alert('Descripci�n requerida', 'Por favor describe el da�o.');
            return;
        }

        setSubmittingDamage(true);
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

            await addNewDamageReport(checkOutId, newDamage);
            setDamages([...damages, newDamage]);
            
            setModalVisible(false);
            resetDamageForm();
            Alert.alert('�xito', 'Da�o reportado correctamente');
        } catch (error) {
            console.error('Error saving damage:', error);
            Alert.alert('Error', 'No se pudo guardar el reporte.');
        } finally {
            setSubmittingDamage(false);
        }
    };

    const resetDamageForm = () => {
        setDamageLocation('Frente');
        setDamageType('scratch');
        setDamageSeverity('minor');
        setDamageNotes('');
        setDamagePhoto(null);
    };

    const handleContinue = async () => {
        if (!odometer.trim()) {
            Alert.alert(
                'Faltan datos',
                '¿Deseas continuar sin ingresar el kilometraje?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Continuar sin datos', 
                        style: 'destructive',
                        onPress: () => skipToNextScreen()
                    }
                ]
            );
            return;
        }

        setSaving(true);
        try {
            await saveCheckOutConditions(checkOutId, {
                odometer: parseInt(odometer),
                fuelLevel: parseInt(fuelLevel),
                exteriorCleanliness: 0,
                interiorCleanliness: 0,
                tiresCondition: 0,
                lightsWorking: true,
                documentsPresent: true
            });

            navigation.navigate('CheckOutReview', { reservationId: reservation.id, checkOutId });
        } catch (error) {
            console.error('Error saving conditions:', error);
            Alert.alert('Error', 'No se pudo guardar la informaci�n.');
        } finally {
            setSaving(false);
        }
    };

    const skipToNextScreen = () => {
        // Skip with mock data for development
        navigation.navigate('CheckOutReview', { reservationId: reservation.id, checkOutId });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Estado del Veh�culo</Text>
                <TouchableOpacity 
                    onPress={skipToNextScreen} 
                    style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 }}
                >
                    <Text style={{ color: 'white', fontSize: 10, fontFamily: typography.fonts.bold }}>SKIP</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                    
                    {/* Odometer Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Kilometraje Final</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="speedometer-outline" size={24} color="#757575" />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 45050"
                                keyboardType="numeric"
                                value={odometer}
                                onChangeText={setOdometer}
                            />
                            <Text style={styles.unit}>km</Text>
                        </View>
                        <Text style={styles.helperText}>Ingresa el valor exacto que muestra el tablero.</Text>
                    </View>

                    {/* Fuel Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nivel de Gasolina</Text>
                        <View style={styles.fuelContainer}>
                            {['0', '25', '50', '75', '100'].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.fuelOption,
                                        fuelLevel === level && styles.fuelOptionSelected
                                    ]}
                                    onPress={() => setFuelLevel(level)}
                                >
                                    <Text style={[
                                        styles.fuelText,
                                        fuelLevel === level && styles.fuelTextSelected
                                    ]}>{level}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.helperText}>Selecciona el nivel aproximado de combustible.</Text>
                    </View>

                    {/* Damages Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Nuevos Da�os</Text>
                            <TouchableOpacity 
                                style={styles.addDamageButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="add" size={20} color="#0B729D" />
                                <Text style={styles.addDamageText}>Reportar</Text>
                            </TouchableOpacity>
                        </View>

                        {damages.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                                <Text style={styles.emptyText}>Sin nuevos da�os reportados</Text>
                                <Text style={styles.emptySubtext}>Si todo est� bien, puedes continuar.</Text>
                            </View>
                        ) : (
                            damages.map((d, index) => (
                                <View key={index} style={styles.damageItem}>
                                    <Image source={{ uri: d.photo }} style={styles.damageThumb} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.damageLocation}>{d.location} - {d.type}</Text>
                                        <Text style={styles.damageNotes}>{d.notes}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continuar</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
                
                {!odometer.trim() && (
                    <View style={{ 
                        marginTop: 12, 
                        backgroundColor: '#FEF3C7', 
                        padding: 10, 
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <Ionicons name="information-circle" size={18} color="#F59E0B" />
                        <Text style={{ flex: 1, fontSize: 12, color: '#92400E', fontFamily: typography.fonts.semiBold }}>
                            Puedes continuar sin completar todos los datos.
                        </Text>
                    </View>
                )}
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
                        <Text style={styles.modalTitle}>Reportar Nuevo Da�o</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Ubicaci�n</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                            {['Frente', 'Atr�s', 'Izquierda', 'Derecha', 'Techo', 'Interior', 'Llantas'].map((loc) => (
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

                        <Text style={styles.label}>Tipo</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                            {[
                                { id: 'scratch', label: 'Ray�n' },
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

                        <Text style={styles.label}>Foto</Text>
                        <TouchableOpacity style={styles.photoButton} onPress={handleTakeDamagePhoto}>
                            {damagePhoto ? (
                                <Image source={{ uri: damagePhoto }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#BDBDBD" />
                                    <Text style={styles.photoPlaceholderText}>Tomar Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Notas</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Describe el da�o..."
                            multiline
                            numberOfLines={3}
                            value={damageNotes}
                            onChangeText={setDamageNotes}
                        />
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                            style={[styles.saveButton, submittingDamage && styles.disabledButton]} 
                            onPress={handleSaveDamage}
                            disabled={submittingDamage}
                        >
                            {submittingDamage ? (
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
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: '#333333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: '#333333',
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BDBDBD',
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F5F5F5',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 16,
        color: '#333333',
    },
    unit: {
        fontSize: 16,
        color: '#757575',
        fontFamily: typography.fonts.medium,
    },
    helperText: {
        fontSize: 13,
        color: '#757575',
        marginTop: 8,
    },
    fuelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    fuelOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    fuelOptionSelected: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0B729D',
    },
    fuelText: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: '#4B5563',
    },
    fuelTextSelected: {
        color: '#0B729D',
    },
    addDamageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
    },
    addDamageText: {
        color: '#0B729D',
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: typography.fonts.semiBold,
        color: '#424242',
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#757575',
        marginTop: 4,
    },
    damageItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    damageThumb: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    damageLocation: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: '#333333',
    },
    damageNotes: {
        fontSize: 13,
        color: '#757575',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#FAFAFA',
    },
    continueButton: {
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: typography.fonts.bold,
    },
    disabledButton: {
        opacity: 0.7,
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
        borderBottomColor: '#FAFAFA',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: '#424242',
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
        backgroundColor: '#FAFAFA',
        marginRight: 8,
    },
    chipSelected: {
        backgroundColor: '#E0F2FE',
    },
    chipText: {
        color: '#4B5563',
    },
    chipTextSelected: {
        color: '#0B729D',
        fontFamily: typography.fonts.semiBold,
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
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    severityButtonText: {
        fontFamily: typography.fonts.medium,
        color: '#424242',
    },
    photoButton: {
        height: 150,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    photoPlaceholderText: {
        color: '#BDBDBD',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    textArea: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#FAFAFA',
    },
    saveButton: {
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontFamily: typography.fonts.semiBold,
    },
});
