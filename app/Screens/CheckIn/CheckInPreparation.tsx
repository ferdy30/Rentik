import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Reservation } from '../../services/reservations';

export default function CheckInPreparation() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservation } = route.params as { reservation: Reservation };

    const [checklist, setChecklist] = useState({
        license: false,
        id: false,
        payment: false,
        confirmation: false,
    });

    const isArrendador = route.params.isArrendador || false;

    const allChecked = Object.values(checklist).every(v => v);

    const handleToggleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleContinue = () => {
        if (!allChecked) {
            Alert.alert(
                'Documentos Incompletos',
                'Por favor confirma que tienes todos los documentos requeridos antes de continuar.',
                [{ text: 'Entendido' }]
            );
            return;
        }

        navigation.navigate('CheckInStart', { reservation });
    };

    const handleChat = () => {
        // Navigate to chat
        navigation.navigate('ChatRoom', {
            reservationId: reservation.id,
            participants: [reservation.userId, reservation.arrendadorId],
        });
    };

    const handleGetDirections = () => {
        const address = reservation.isDelivery 
            ? reservation.deliveryAddress 
            : (reservation.pickupLocation || '');
        
        const url = Platform.select({
            ios: `maps://app?daddr=${encodeURIComponent(address)}`,
            android: `google.navigation:q=${encodeURIComponent(address)}`,
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
            });
        }
    };

    const checklistItems = [
        {
            key: 'license' as const,
            icon: 'card-outline',
            title: 'Licencia de conducir vigente',
            description: 'Original, no vencida',
        },
        {
            key: 'id' as const,
            icon: 'person-outline',
            title: 'Identificación oficial',
            description: 'DUI, pasaporte o cédula',
        },
        {
            key: 'payment' as const,
            icon: 'wallet-outline',
            title: 'Método de pago',
            description: 'Tarjeta de crédito/débito',
        },
        {
            key: 'confirmation' as const,
            icon: 'document-text-outline',
            title: 'Comprobante de reserva',
            description: 'Ya lo tienes en la app',
        },
    ];

    const importantInfo = [
        {
            icon: 'time-outline',
            title: 'Duración estimada',
            value: '15-20 minutos',
            color: '#0B729D',
        },
        {
            icon: 'location-outline',
            title: reservation.isDelivery ? 'Punto de entrega' : 'Punto de recogida',
            value: reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation || 'Ver ubicación',
            color: '#10B981',
        },
        {
            icon: 'shield-checkmark-outline',
            title: 'Código de verificación',
            value: reservation.id.slice(0, 8).toUpperCase(),
            color: '#F59E0B',
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Preparación Check-In</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Vehicle Info */}
                <View style={styles.vehicleCard}>
                    {reservation.vehicleSnapshot?.imagen && (
                        <Image 
                            source={{ uri: reservation.vehicleSnapshot.imagen }}
                            style={styles.vehicleImage}
                            contentFit="cover"
                        />
                    )}
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>
                            {reservation.vehicleSnapshot?.marca} {reservation.vehicleSnapshot?.modelo}
                        </Text>
                        <Text style={styles.vehicleYear}>{reservation.vehicleSnapshot?.anio}</Text>
                    </View>
                </View>

                {/* Important Info */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={24} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Información importante</Text>
                    </View>
                    
                    {importantInfo.map((item, index) => (
                        <View key={index} style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{item.title}</Text>
                                <Text style={styles.infoValue}>{item.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Checklist */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="checkmark-done-circle" size={24} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Documentos requeridos</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Confirma que tienes estos documentos antes de continuar
                    </Text>

                    {checklistItems.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.checklistItem}
                            onPress={() => handleToggleCheck(item.key)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                checklist[item.key] && styles.checkboxChecked
                            ]}>
                                {checklist[item.key] && (
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                )}
                            </View>
                            <View style={styles.checklistIcon}>
                                <Ionicons name={item.icon as any} size={24} color="#0B729D" />
                            </View>
                            <View style={styles.checklistContent}>
                                <Text style={styles.checklistTitle}>{item.title}</Text>
                                <Text style={styles.checklistDescription}>{item.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb" size={24} color="#F59E0B" />
                        <Text style={styles.tipsTitle}>Tips para un check-in rápido</Text>
                    </View>
                    <View style={styles.tipsList}>
                        <View style={styles.tipItem}>
                            <View style={styles.tipBullet} />
                            <Text style={styles.tipText}>Llega 5-10 minutos antes de la hora acordada</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <View style={styles.tipBullet} />
                            <Text style={styles.tipText}>Revisa el nivel de combustible al inicio</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <View style={styles.tipBullet} />
                            <Text style={styles.tipText}>Toma fotos de cualquier daño existente</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <View style={styles.tipBullet} />
                            <Text style={styles.tipText}>Verifica que todos los accesorios estén presentes</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleChat}>
                        <Ionicons name="chatbubble-outline" size={20} color="#0B729D" />
                        <Text style={styles.quickActionText}>Chat con {isArrendador ? 'arrendatario' : 'anfitrión'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleGetDirections}>
                        <Ionicons name="navigate-outline" size={20} color="#0B729D" />
                        <Text style={styles.quickActionText}>Cómo llegar</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueButton, !allChecked && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!allChecked}
                >
                    <Text style={styles.continueButtonText}>
                        {allChecked ? 'Iniciar Check-In' : 'Completa el checklist'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
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
    vehicleCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    vehicleImage: {
        width: 100,
        height: 100,
        backgroundColor: '#F3F4F6',
    },
    vehicleInfo: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    vehicleName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    vehicleYear: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    checklistIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checklistContent: {
        flex: 1,
    },
    checklistTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    checklistDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    tipsCard: {
        backgroundColor: '#FFFBEB',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
    },
    tipsList: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 6,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#78350F',
        lineHeight: 20,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0B729D',
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0B729D',
        padding: 18,
        borderRadius: 12,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
