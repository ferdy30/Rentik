import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Firebaseauth } from '../../FirebaseConfig';
import {
    generateSecureKeyCode,
    getCheckIn,
    saveCheckInKeys,
    subscribeToCheckIn,
    verifyKeyCode
} from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInKeys() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const params = route.params as { reservation: Reservation; checkInId: string } | undefined;
    const reservation = params?.reservation;
    const checkInId = params?.checkInId;

    if (!reservation || !checkInId) {
         return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Error: Datos invalidos.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text>Volver</Text></TouchableOpacity>
            </View>
        );
    }

    const [keysCount, setKeysCount] = useState(1);
    const [keysWorking, setKeysWorking] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Estado del código
    const [handoverCode, setHandoverCode] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [ownerConfirmed, setOwnerConfirmed] = useState(false);
    const [renterConfirmed, setRenterConfirmed] = useState(false);
    
    const user = Firebaseauth.currentUser;
    const isOwner = user?.uid === reservation.arrendadorId;

    // Cargar datos existentes y suscribirse a cambios
    useEffect(() => {
        loadKeysData();
        
        const unsubscribe = subscribeToCheckIn(checkInId, (checkIn) => {
            if (checkIn?.keys) {
                setHandoverCode(checkIn.keys.handoverCode || '');
                setKeysCount(checkIn.keys.count);
                setKeysWorking(checkIn.keys.working);
                setOwnerConfirmed(checkIn.keys.ownerConfirmed || false);
                setRenterConfirmed(checkIn.keys.renterConfirmed || false);
            }
        });
        
        return () => unsubscribe();
    }, []);

    const loadKeysData = async () => {
        try {
            const checkIn = await getCheckIn(checkInId);
            if (checkIn?.keys) {
                // Si ya existe un código guardado, usarlo
                setHandoverCode(checkIn.keys.handoverCode || '');
                setKeysCount(checkIn.keys.count);
                setKeysWorking(checkIn.keys.working);
                setOwnerConfirmed(checkIn.keys.ownerConfirmed || false);
                setRenterConfirmed(checkIn.keys.renterConfirmed || false);
            } else if (isOwner) {
                // ✅ El propietario genera el código SEGURO al inicio SOLO si no existe
                const newCode = generateSecureKeyCode();
                setHandoverCode(newCode);
                
                // Guardar inmediatamente el código en Firestore para que el renter lo vea
                await saveCheckInKeys(checkInId, {
                    count: keysCount,
                    working: keysWorking,
                    handoverCode: newCode,
                    ownerConfirmed: false,
                    renterConfirmed: false
                });
                console.log('✅ Código seguro generado y guardado:', newCode);
            }
        } catch (error) {
            console.error('Error loading keys data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerConfirm = async () => {
        if (!handoverCode) {
            Alert.alert('Error', 'No se ha generado el código de entrega.');
            return;
        }

        try {
            setSaving(true);
            await saveCheckInKeys(checkInId, {
                count: keysCount,
                working: keysWorking,
                handoverCode,
                ownerConfirmed: true,
                renterConfirmed: false
            });
            
            // Haptic feedback
            const Haptics = await import('expo-haptics');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            Alert.alert(
                '✅ Código Generado',
                `Comparte el código ${handoverCode} con el viajero para validar la entrega de llaves.`,
                [{ text: 'Entendido' }]
            );
        } catch (error) {
            console.error('Error saving keys info:', error);
            Alert.alert('Error', 'No se pudo guardar la información de llaves.');
        } finally {
            setSaving(false);
        }
    };

    const handleRenterValidate = async () => {
        // ✅ Usar la función de verificación segura
        const isValid = await verifyKeyCode(checkInId, codeInput.trim());
        
        if (!isValid) {
            Alert.alert(
                'Código Incorrecto',
                'El código ingresado no coincide. Verifica con el anfitrión.',
                [{ text: 'Reintentar' }]
            );
            setCodeInput('');
            return;
        }

        try {
            setSaving(true);
            
            // Haptic feedback al validar correctamente
            const Haptics = await import('expo-haptics');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            await saveCheckInKeys(checkInId, {
                count: keysCount,
                working: keysWorking,
                handoverCode,
                ownerConfirmed,
                renterConfirmed: true
            });
            
            // Navigate directly after saving
            setSaving(false);
            navigation.replace('CheckInSignature', { reservation, checkInId });
        } catch (error) {
            console.error('Error validating code:', error);
            Alert.alert('Error', 'No se pudo validar el código.');
        } finally {
            setSaving(false);
        }
    };

    const handleOwnerContinue = () => {
        if (!ownerConfirmed) {
            Alert.alert('Pendiente', 'Debes confirmar la entrega de llaves primero.');
            return;
        }
        
        if (!renterConfirmed) {
            Alert.alert(
                'Esperando Validación',
                'El viajero aún no ha validado el código de entrega.',
                [{ text: 'Esperar' }]
            );
            return;
        }
        
        navigation.replace('CheckInSignature', { reservation, checkInId });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0B729D" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Entrega de Llaves</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="key-outline" size={64} color="#0B729D" />
                </View>
                
                <Text style={styles.title}>
                    {isOwner ? 'Generar Código' : 'Validar Código'}
                </Text>
                <Text style={styles.subtitle}>
                    {isOwner 
                        ? 'Genera un código para confirmar la entrega de llaves' 
                        : 'Ingresa el código que te proporcionó el anfitrión'}
                </Text>

                {/* Toggle de funcionamiento (ambos pueden verlo) */}
                <TouchableOpacity
                    style={styles.toggleCard}
                    onPress={() => !ownerConfirmed && setKeysWorking(!keysWorking)}
                    disabled={ownerConfirmed}
                >
                    <View style={styles.toggleLeft}>
                        <Ionicons 
                            name={keysWorking ? "checkmark-circle-outline" : "alert-circle-outline"} 
                            size={24} 
                            color={keysWorking ? '#16A34A' : '#DC2626'} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleTitle}>Funcionamiento correcto</Text>
                            <Text style={styles.toggleSubtitle}>
                                {keysWorking ? 'Abren y cierran correctamente' : 'Presentan problemas'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.toggle, keysWorking && styles.toggleActive]}>
                        <View style={[styles.toggleThumb, keysWorking && styles.toggleThumbActive]} />
                    </View>
                </TouchableOpacity>

                {/* Vista del PROPIETARIO - Mostrar c�digo */}
                {isOwner && (
                    <>
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>Código de Confirmación</Text>
                            <View style={styles.codeBoxContainer}>
                                {handoverCode.split('').map((char, index) => (
                                    <View key={index} style={styles.codeBox}>
                                        <Text style={styles.codeBoxText}>{char}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.codeHelp}>
                                {ownerConfirmed 
                                    ? '✅ Código compartido. Esperando validación del viajero.' 
                                    : '📱 Comparte este código con el viajero'}
                            </Text>
                        </View>

                        {ownerConfirmed && renterConfirmed && (
                            <View style={styles.statusCard}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                                <Text style={styles.statusText}>✅ Entrega Confirmada</Text>
                            </View>
                        )}

                        {ownerConfirmed && !renterConfirmed && (
                            <View style={[styles.statusCard, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="time-outline" size={32} color="#F59E0B" />
                                <Text style={[styles.statusText, { color: '#92400E' }]}>
                                    ⏳ Esperando validación
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Vista del VIAJERO - Ingresar código */}
                {!isOwner && (
                    <>
                        {!handoverCode ? (
                            <View style={[styles.statusCard, { backgroundColor: '#FEF3C7' }]}>
                                <ActivityIndicator size="large" color="#F59E0B" />
                                <Text style={[styles.statusText, { color: '#92400E' }]}>
                                    Esperando código del anfitrión...
                                </Text>
                                <Text style={styles.statusSubtext}>
                                    El anfitrión generará un código alfanumérico de 6 caracteres
                                </Text>
                            </View>
                        ) : !renterConfirmed ? (
                            <>
                                <View style={styles.codeDisplayCard}>
                                    <Text style={styles.codeDisplayLabel}>Código del anfitrión:</Text>
                                    <View style={styles.codeBoxContainer}>
                                        {handoverCode.split('').map((char, index) => (
                                            <View key={index} style={styles.codeBoxSmall}>
                                                <Text style={styles.codeBoxTextSmall}>{char}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Confirma el código ingresándolo</Text>
                                    <TextInput
                                        style={styles.codeInput}
                                        value={codeInput}
                                        onChangeText={(text) => setCodeInput(text.toUpperCase())}
                                        placeholder="ABC123"
                                        autoCapitalize="characters"
                                        maxLength={6}
                                        editable={!renterConfirmed}
                                    />
                                    <Text style={styles.inputHelp}>
                                        Escribe el código de arriba para confirmar
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.statusCard}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                                <Text style={styles.statusText}>✅ Código Validado</Text>
                                <Text style={styles.statusSubtext}>
                                    La entrega de llaves ha sido confirmada
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            <View style={styles.footer}>
                {isOwner ? (
                    <TouchableOpacity 
                        style={[
                            styles.continueButton, 
                            (saving || !keysWorking) && styles.buttonDisabled
                        ]} 
                        onPress={ownerConfirmed ? handleOwnerContinue : handleOwnerConfirm}
                        disabled={saving || !keysWorking}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.continueButtonText}>
                                {ownerConfirmed 
                                    ? (renterConfirmed ? 'Continuar a Firmar' : 'Esperando Validaci�n') 
                                    : 'Confirmar Entrega'}
                            </Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[
                            styles.continueButton, 
                            (saving || !handoverCode || codeInput.length !== 6 || renterConfirmed) && styles.buttonDisabled
                        ]} 
                        onPress={handleRenterValidate}
                        disabled={saving || !handoverCode || codeInput.length !== 6 || renterConfirmed}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.continueButtonText}>
                                {renterConfirmed ? 'Código Validado ✓' : 'Validar Código'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
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
        paddingVertical: 16,
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
        fontWeight: '700',
        color: '#333333',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginBottom: 32,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 12,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    counterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333333',
        minWidth: 40,
        textAlign: 'center',
    },
    toggleCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 32,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    toggleSubtitle: {
        fontSize: 14,
        color: '#757575',
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E0E0E0',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#10B981',
    },
    toggleThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{ translateX: 20 }],
    },
    codeContainer: {
        width: '100%',
        backgroundColor: '#FAFAFA',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    codeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeBoxContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    codeBox: {
        width: 48,
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0B729D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    codeBoxText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0B729D',
        letterSpacing: 0,
    },
    codeBoxSmall: {
        width: 40,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeBoxTextSmall: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E3A8A',
    },
    codeValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#333333',
        letterSpacing: 4,
        marginBottom: 8,
    },
    codeHelp: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 12,
        textAlign: 'center',
    },
    codeInput: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 8,
        textAlign: 'center',
        color: '#333333',
    },
    inputHelp: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },
    codeDisplayCard: {
        width: '100%',
        backgroundColor: '#DBEAFE',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    codeDisplayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 12,
    },
    statusCard: {
        width: '100%',
        backgroundColor: '#ECFDF5',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#065F46',
    },
    statusSubtext: {
        fontSize: 14,
        color: '#047857',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
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
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
