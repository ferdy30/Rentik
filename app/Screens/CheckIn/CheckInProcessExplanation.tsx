import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Reservation } from '../../services/reservations';

export default function CheckInProcessExplanation() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation, isArrendador } = route.params as { reservation: Reservation, isArrendador: boolean };

    const steps = isArrendador ? [
        {
            icon: 'person-outline',
            title: '1. Encuentro con el viajero',
            description: 'Reúnete con el viajero en el punto acordado y verifica su identidad.',
        },
        {
            icon: 'camera-outline',
            title: '2. Registro del estado',
            description: 'Tomarás fotos del vehículo para documentar su estado actual (limpieza, daños, combustible).',
        },
        {
            icon: 'speedometer-outline',
            title: '3. Kilometraje y Combustible',
            description: 'Registra el kilometraje actual y el nivel de combustible.',
        },
        {
            icon: 'key-outline',
            title: '4. Entrega de llaves',
            description: 'Una vez firmado el contrato digital, entregarás las llaves al viajero.',
        }
    ] : [
        {
            icon: 'person-outline',
            title: '1. Encuentro con el anfitrión',
            description: 'Reúnete con el anfitrión en el punto acordado.',
        },
        {
            icon: 'camera-outline',
            title: '2. Inspección del vehículo',
            description: 'Revisa el vehículo junto con el anfitrión y toma fotos de cualquier daño existente.',
        },
        {
            icon: 'document-text-outline',
            title: '3. Firma del contrato',
            description: 'Revisa y firma el contrato de alquiler digitalmente en la app.',
        },
        {
            icon: 'key-outline',
            title: '4. Recibe las llaves',
            description: '¡Listo! Recibe las llaves y comienza tu viaje.',
        }
    ];

    const handleContinue = () => {
        navigation.navigate('CheckInStart', { reservation });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Proceso de Check-In</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.heroIconCircle}>
                        <Ionicons name="list-circle-outline" size={64} color="#0B729D" />
                    </View>
                    <Text style={styles.heroTitle}>
                        {isArrendador ? 'Entrega del vehículo' : 'Recepción del vehículo'}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Sigue estos pasos para asegurar un proceso seguro y transparente.
                    </Text>
                </View>

                <View style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <View style={styles.stepIconContainer}>
                                <View style={styles.stepLine} />
                                <View style={styles.stepIconCircle}>
                                    <Ionicons name={step.icon as any} size={20} color="#fff" />
                                </View>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDescription}>{step.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#0B729D" />
                    <Text style={styles.infoBoxText}>
                        El proceso toma aproximadamente 10-15 minutos. Asegúrate de tener buena conexión a internet.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Comenzar Check-In</Text>
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
    heroSection: {
        alignItems: 'center',
        padding: 32,
        paddingBottom: 40,
    },
    heroIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    stepsContainer: {
        paddingHorizontal: 24,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    stepIconContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 40,
    },
    stepLine: {
        position: 'absolute',
        top: 40,
        bottom: -40,
        width: 2,
        backgroundColor: '#E5E7EB',
        zIndex: -1,
    },
    stepIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0B729D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    stepContent: {
        flex: 1,
        paddingTop: 8,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        margin: 24,
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 14,
        color: '#0369A1',
        lineHeight: 20,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
