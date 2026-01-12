import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { db } from '../../FirebaseConfig';
import { typography } from '../../constants/typography';
import { CheckInReport } from '../../services/checkIn';
import { CheckOutReport } from '../../services/checkOut';
import { Reservation } from '../../services/reservations';

export default function CheckOutReview() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { checkOutId, reservationId } = route.params as { checkOutId: string, reservationId: string };

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [checkIn, setCheckIn] = useState<CheckInReport | null>(null);
    const [checkOut, setCheckOut] = useState<CheckOutReport | null>(null);
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [signatureModalVisible, setSignatureModalVisible] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);

    const signatureRef = useRef<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // DEV SKIP HANDLING - Check this FIRST to avoid permission errors
            if (checkOutId.startsWith('DEV_SKIP_')) {
                console.log('DEV MODE: Using mock data for CheckOut Review');
                
                // Mock Reservation Data (since we might not have permission to fetch it)
                setReservation({
                    id: reservationId,
                    vehicleId: 'mock_vehicle_id',
                    userId: 'mock_user_id',
                    arrendadorId: 'mock_owner_id',
                    status: 'active',
                    totalPrice: 100,
                    startDate: new Date(),
                    endDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    vehicleSnapshot: {
                        marca: 'Toyota',
                        modelo: 'Corolla',
                        anio: 2022,
                        imagen: 'https://via.placeholder.com/300',
                        precioPorDia: 50,
                        tipo: 'Sedan',
                        transmision: 'Autom�tica',
                        combustible: 'Gasolina',
                        motor: '1.8',
                        pasajeros: 5,
                        puertas: 4
                    }
                } as any);

                setCheckOut({
                    id: checkOutId,
                    reservationId,
                    vehicleId: 'mock_vehicle_id',
                    renterId: 'mock_user_id',
                    ownerId: 'mock_owner_id',
                    status: 'in-progress',
                    startedAt: new Date(),
                    completedAt: null,
                    photos: {},
                    newDamages: [],
                    conditions: {
                        odometer: 50000,
                        fuelLevel: 100,
                        exteriorCleanliness: 5,
                        interiorCleanliness: 5,
                        tiresCondition: 5,
                        lightsWorking: true,
                        documentsPresent: true
                    },
                    keysReturned: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                setCheckIn({
                    id: 'mock_checkin',
                    reservationId,
                    vehicleId: 'mock_vehicle_id',
                    renterId: 'mock_user_id',
                    ownerId: 'mock_owner_id',
                    status: 'completed',
                    startedAt: new Date(),
                    completedAt: new Date(),
                    photos: {},
                    existingDamages: [],
                    conditions: {
                        odometer: 49800,
                        fuelLevel: 100,
                        exteriorCleanliness: 5,
                        interiorCleanliness: 5,
                        tiresCondition: 5,
                        lightsWorking: true,
                        documentsPresent: true
                    },
                    keysHandedOver: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                return;
            }

            // 1. Get Reservation
            const resDoc = await getDoc(doc(db, 'reservations', reservationId));
            if (!resDoc.exists()) throw new Error('Reserva no encontrada');
            setReservation({ id: resDoc.id, ...resDoc.data() } as Reservation);

            // 2. Get CheckOut
            const outDoc = await getDoc(doc(db, 'checkOuts', checkOutId));
            if (!outDoc.exists()) throw new Error('Check-out no encontrado');
            setCheckOut({ id: outDoc.id, ...outDoc.data() } as CheckOutReport);

            // 3. Get CheckIn (Query by reservationId)
            const q = query(collection(db, 'checkIns'), where('reservationId', '==', reservationId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Assuming the last one is the valid one if multiple exist
                const docData = querySnapshot.docs[0];
                setCheckIn({ id: docData.id, ...docData.data() } as CheckInReport);
            } else {
                console.warn('No Check-in found for this reservation');
            }

        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del check-out.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSignature = (signature: string) => {
        setSignature(signature);
        setSignatureModalVisible(false);
    };

    const handleClearSignature = () => {
        signatureRef.current?.clearSignature();
    };

    const handleConfirmSignature = () => {
        signatureRef.current?.readSignature();
    };

    const handleFinalize = async () => {
        if (!signature) {
            Alert.alert('Firma requerida', 'Por favor firma para confirmar el estado del veh�culo.');
            return;
        }

        setSubmitting(true);
        try {
            if (checkOutId.startsWith('DEV_SKIP_')) {
                // Mock finalize
                await new Promise(resolve => setTimeout(resolve, 1000));
                navigation.navigate('CheckOutComplete', { checkOutId, reservationId });
                return;
            }

            // CLOSE THE LOOP: Update CheckOut, Reservation, and Vehicle
            const batch = writeBatch(db);

            // 1. Update CheckOut
            const checkOutRef = doc(db, 'checkOuts', checkOutId);
            batch.update(checkOutRef, {
                'signatures.renter': signature,
                status: 'completed',
                updatedAt: new Date()
            });

            // 2. Update Reservation
            const reservationRef = doc(db, 'reservations', reservationId);
            batch.update(reservationRef, {
                status: 'completed',
                updatedAt: new Date()
            });

            await batch.commit();

            // Navigate to success/completion screen
            navigation.navigate('CheckOutComplete', { checkOutId, reservationId });

        } catch (error) {
            console.error('Error finalizing check-out:', error);
            Alert.alert('Error', 'No se pudo finalizar el proceso. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0B729D" />
                <Text style={styles.loadingText}>Cargando resumen...</Text>
            </View>
        );
    }

    if (!checkIn || !checkOut || !reservation) {
        return (
            <View style={styles.container}>
                <Text>Error al cargar datos.</Text>
            </View>
        );
    }

    const distanceDriven = (checkOut.conditions?.odometer || 0) - (checkIn.conditions?.odometer || 0);
    const fuelDiff = (checkOut.conditions?.fuelLevel || 0) - (checkIn.conditions?.fuelLevel || 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resumen y Firma</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Vehicle Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Veh�culo</Text>
                    <View style={styles.vehicleCard}>
                        <Image 
                            source={{ uri: reservation.vehicleSnapshot?.imagen }} 
                            style={styles.vehicleImage}
                            contentFit="cover"
                        />
                        <View>
                            <Text style={styles.vehicleBrand}>{reservation.vehicleSnapshot?.marca}</Text>
                            <Text style={styles.vehicleModel}>
                                {reservation.vehicleSnapshot?.modelo} {reservation.vehicleSnapshot?.anio}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Usage Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Uso del Veh�culo</Text>
                    
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Kilometraje Inicial</Text>
                            <Text style={styles.summaryValue}>{checkIn.conditions?.odometer} km</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Kilometraje Final</Text>
                            <Text style={styles.summaryValue}>{checkOut.conditions?.odometer} km</Text>
                        </View>
                    </View>
                    
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Distancia Recorrida</Text>
                        <Text style={styles.resultValue}>{distanceDriven} km</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Combustible Inicial</Text>
                            <Text style={styles.summaryValue}>{checkIn.conditions?.fuelLevel}%</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Combustible Final</Text>
                            <Text style={styles.summaryValue}>{checkOut.conditions?.fuelLevel}%</Text>
                        </View>
                    </View>

                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Diferencia</Text>
                        <Text style={[
                            styles.resultValue, 
                            { color: fuelDiff < 0 ? '#EF4444' : '#10B981' }
                        ]}>
                            {fuelDiff > 0 ? '+' : ''}{fuelDiff}%
                        </Text>
                    </View>
                </View>

                {/* Damages */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reporte de Da�os</Text>
                    {checkOut.newDamages && checkOut.newDamages.length > 0 ? (
                        checkOut.newDamages.map((damage, index) => (
                            <View key={index} style={styles.damageItem}>
                                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                <View style={styles.damageInfo}>
                                    <Text style={styles.damageType}>{damage.type.toUpperCase()} - {damage.severity}</Text>
                                    <Text style={styles.damageLocation}>{damage.location}</Text>
                                    {damage.notes ? <Text style={styles.damageNotes}>{damage.notes}</Text> : null}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noDamages}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            <Text style={styles.noDamagesText}>No se reportaron nuevos da�os</Text>
                        </View>
                    )}
                </View>

                {/* Signature */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Firma de Conformidad</Text>
                    <Text style={styles.disclaimer}>
                        Al firmar, confirmo que he devuelto el veh�culo en las condiciones descritas anteriormente y acepto los cargos adicionales que puedan aplicar por combustible faltante, exceso de kilometraje o da�os reportados.
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.signatureBox} 
                        onPress={() => setSignatureModalVisible(true)}
                    >
                        {signature ? (
                            <Image 
                                source={{ uri: signature }} 
                                style={styles.signatureImage} 
                                contentFit="contain"
                            />
                        ) : (
                            <View style={styles.signaturePlaceholder}>
                                <Ionicons name="pencil" size={32} color="#BDBDBD" />
                                <Text style={styles.signaturePlaceholderText}>Toca para firmar</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={{ marginBottom: 12, alignItems: 'center', padding: 8 }}
                    onPress={() => {
                        Alert.alert(
                            'Modo Desarrollo',
                            'Saltando firma y finalizando...',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { 
                                    text: 'Saltar', 
                                    onPress: async () => {
                                        // Mock signature for dev
                                        const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
                                        setSignature(mockSignature);
                                        
                                        // DEV SKIP HANDLING
                                        if (checkOutId.startsWith('DEV_SKIP_')) {
                                            setTimeout(() => {
                                                navigation.navigate('CheckOutComplete', { checkOutId, reservationId });
                                            }, 500);
                                            return;
                                        }

                                        // Use the proper handleFinalize after setting signature
                                        setTimeout(() => {
                                            handleFinalize();
                                        }, 300);
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={{ color: '#757575', textDecorationLine: 'underline', fontSize: 14 }}>
                        [DEV] Saltar firma
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.submitButton, (!signature || submitting) && styles.buttonDisabled]} 
                    onPress={handleFinalize}
                    disabled={!signature || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Confirmar y Finalizar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Signature Modal */}
            <Modal
                visible={signatureModalVisible}
                animationType="slide"
                onRequestClose={() => setSignatureModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Firma</Text>
                        <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333333" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.signatureCanvasContainer}>
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={handleSignature}
                            onEmpty={() => Alert.alert('Error', 'Por favor firma antes de guardar.')}
                            descriptionText="Firma aqu�"
                            clearText="Borrar"
                            confirmText="Guardar"
                            webStyle={`
                                .m-signature-pad--footer { display: none; margin: 0px; }
                                body,html { width: 100%; height: 100%; }
                            `} 
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalButtonSecondary} onPress={handleClearSignature}>
                            <Text style={styles.modalButtonSecondaryText}>Borrar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConfirmSignature}>
                            <Text style={styles.modalButtonPrimaryText}>Guardar Firma</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        marginTop: 12,
        color: '#757575',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
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
    },
    section: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F5F5F5',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: '#333333',
        marginBottom: 16,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
    },
    vehicleImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    vehicleBrand: {
        fontSize: 14,
        color: '#757575',
    },
    vehicleModel: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: '#333333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontFamily: typography.fonts.semiBold,
        color: '#333333',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        padding: 12,
        borderRadius: 8,
    },
    resultLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: '#424242',
    },
    resultValue: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: '#333333',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
    damageItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    damageInfo: {
        marginLeft: 12,
        flex: 1,
    },
    damageType: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: '#991B1B',
    },
    damageLocation: {
        fontSize: 14,
        color: '#7F1D1D',
        marginBottom: 4,
    },
    damageNotes: {
        fontSize: 12,
        color: '#991B1B',
        fontStyle: 'italic',
    },
    noDamages: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        gap: 12,
    },
    noDamagesText: {
        color: '#065F46',
        fontFamily: typography.fonts.semiBold,
    },
    disclaimer: {
        fontSize: 12,
        color: '#757575',
        lineHeight: 18,
        marginBottom: 16,
    },
    signatureBox: {
        height: 150,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        overflow: 'hidden',
    },
    signaturePlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    signaturePlaceholderText: {
        color: '#BDBDBD',
        fontFamily: typography.fonts.semiBold,
    },
    signatureImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#FAFAFA',
    },
    submitButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: typography.fonts.bold,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
    },
    signatureCanvasContainer: {
        flex: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#FAFAFA',
    },
    modalButtonPrimary: {
        flex: 1,
        backgroundColor: '#0B729D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        color: '#fff',
        fontFamily: typography.fonts.bold,
    },
    modalButtonSecondary: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        color: '#424242',
        fontFamily: typography.fonts.bold,
    },
});
