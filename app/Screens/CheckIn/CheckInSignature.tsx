import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import { useAuth } from '../../../context/Auth';
import { CheckInReport, saveCheckInSignatures, subscribeToCheckIn, updateCheckInStatus } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInSignature() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user, userData } = useAuth();
    const { reservation, checkInId } = route.params as { reservation: Reservation; checkInId: string };

    const [checkIn, setCheckIn] = useState<CheckInReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const ref = useRef<any>(null);

    useEffect(() => {
        const unsubscribe = subscribeToCheckIn(checkInId, (data) => {
            setCheckIn(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [checkInId]);

    const handleSignature = async (signature: string) => {
        if (!user || !checkIn) return;

        setSaving(true);
        try {
            const isRenter = user.uid === checkIn.renterId;

            const newSignatures = {
                ...checkIn.signatures,
                [isRenter ? 'renter' : 'owner']: signature
            };

            await saveCheckInSignatures(checkInId, newSignatures);

            // If both signed (or just the current user if remote flow), complete check-in
            // For now, let's assume if the current user signs, they are done with their part.
            // But the check-in status should only be 'completed' if both have signed OR if it's a self-check-in flow.
            // Let's just save signature and move to complete screen.
            
            // If this is the start of the trip (status pending/in-progress), we might want to mark it as 'in-progress' (active trip)
            // if it's not already.
            
            if (checkIn.status === 'pending') {
                await updateCheckInStatus(checkInId, 'in-progress');
            }

            // Navegar al resumen de Check-in primero (pantalla de confirmación)
            navigation.navigate('CheckInComplete', { reservation, checkInId });
        } catch (error) {
            console.error('Error saving signature:', error);
            Alert.alert('Error', 'No se pudo guardar la firma.');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        ref.current?.clearSignature();
    };

    const handleConfirm = () => {
        ref.current?.readSignature();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0B729D" />
            </View>
        );
    }

    const isRenter = user?.uid === checkIn?.renterId;
    const roleName = isRenter ? 'Arrendatario' : 'Arrendador';
    const alreadySigned = isRenter ? checkIn?.signatures?.renter : checkIn?.signatures?.owner;

    if (alreadySigned) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                    <Text style={styles.successTitle}>¡Firma Registrada!</Text>
                    <Text style={styles.successText}>Ya has firmado este check-in.</Text>
                    <TouchableOpacity 
                        style={styles.continueButton}
                        onPress={() => navigation.navigate('CheckInComplete', { reservation, checkInId })}
                    >
                        <Text style={styles.continueButtonText}>Ver Resumen</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Firma de Conformidad</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.instructions}>
                    Por favor firma a continuación para confirmar que has revisado el estado del vehículo y aceptas las condiciones reportadas.
                </Text>
                
                <View style={styles.signatureBox}>
                    <SignatureScreen
                        ref={ref}
                        onOK={handleSignature}
                        webStyle={`
                            .m-signature-pad { box-shadow: none; border: none; } 
                            .m-signature-pad--body { border: none; }
                            .m-signature-pad--footer { display: none; margin: 0px; }
                            body,html { width: 100%; height: 100%; }
                        `}
                        backgroundColor="#F9FAFB"
                        penColor="#000000"
                    />
                </View>
                
                <Text style={styles.signerLabel}>Firmando como: {roleName}</Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Borrar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.confirmButton, saving && styles.buttonDisabled]} 
                    onPress={handleConfirm}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirmar Firma</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        padding: 20,
    },
    instructions: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 20,
        lineHeight: 20,
    },
    signatureBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    signerLabel: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        flexDirection: 'row',
        gap: 12,
    },
    clearButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#0B729D',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    continueButton: {
        backgroundColor: '#0B729D',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
