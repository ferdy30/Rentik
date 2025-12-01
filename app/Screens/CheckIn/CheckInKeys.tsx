import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
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
import { saveCheckInKeys } from '../../services/checkIn';
import { Reservation } from '../../services/reservations';

export default function CheckInKeys() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, checkInId } = route.params as { reservation: Reservation; checkInId: string };

    const [keysCount, setKeysCount] = useState(1);
    const [keysWorking, setKeysWorking] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Generate a random 6-digit code for this session
    const [handoverCode] = useState(Math.floor(100000 + Math.random() * 900000).toString());

    const handleContinue = async () => {
        try {
            setSaving(true);
            
            await saveCheckInKeys(checkInId, {
                count: keysCount,
                working: keysWorking,
                handoverCode
            });
            
            navigation.navigate('CheckInSignature', { reservation, checkInId });
        } catch (error) {
            console.error('Error saving keys info:', error);
            Alert.alert('Error', 'No se pudo guardar la información de llaves.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Entrega de Llaves</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="key-outline" size={64} color="#0B729D" />
                </View>
                
                <Text style={styles.title}>Confirmación de Llaves</Text>
                <Text style={styles.subtitle}>
                    Verifica que las llaves funcionen correctamente.
                </Text>

                <TouchableOpacity
                    style={styles.toggleCard}
                    onPress={() => setKeysWorking(!keysWorking)}
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

                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Código de Confirmación</Text>
                    <Text style={styles.codeValue}>{handoverCode}</Text>
                    <Text style={styles.codeHelp}>Comparte este código para validar la entrega</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.continueButton, saving && styles.buttonDisabled]} 
                    onPress={handleContinue}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.continueButtonText}>Confirmar y Firmar</Text>
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
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
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
        borderColor: '#E5E7EB',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
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
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
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
        borderColor: '#E5E7EB',
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
        color: '#111827',
    },
    toggleSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E5E7EB',
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
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    codeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 4,
        marginBottom: 8,
    },
    codeHelp: {
        fontSize: 14,
        color: '#94A3B8',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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
