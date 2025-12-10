import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

export default function BookingStep3Time() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate, pickupLocation, returnLocation, isDelivery, deliveryAddress, deliveryCoords } = route.params;

    const [pickupHour, setPickupHour] = useState(10);
    const [returnHour, setReturnHour] = useState(10);

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const handleNext = () => {
        // Create ISO strings with exact hours
        const pickupDate = new Date(startDate);
        pickupDate.setHours(pickupHour, 0, 0, 0);
        
        const returnDate = new Date(endDate);
        returnDate.setHours(returnHour, 0, 0, 0);

        navigation.navigate('BookingStep4Confirmation' as never, { 
            vehicle, 
            startDate, 
            endDate,
            pickupLocation,
            returnLocation,
            pickupTime: pickupDate.toISOString(),
            returnTime: returnDate.toISOString(),
            isDelivery,
            deliveryAddress,
            deliveryCoords
        } as never);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: '75%' }]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Step Indicators */}
                <View style={styles.stepIndicators}>
                    <View style={styles.stepIndicatorComplete}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={styles.stepIndicatorLine} />
                    <View style={styles.stepIndicatorComplete}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={styles.stepIndicatorLine} />
                    <View style={styles.stepIndicatorActive}>
                        <Text style={styles.stepIndicatorNumber}>3</Text>
                    </View>
                    <View style={styles.stepIndicatorLineInactive} />
                    <View style={styles.stepIndicatorInactive}>
                        <Text style={styles.stepIndicatorNumberInactive}>4</Text>
                    </View>
                </View>

                <Text style={styles.stepTitle}>Paso 3 de 4</Text>
                <Text style={styles.title}>Horario</Text>
                <Text style={styles.subtitle}>Selecciona la hora de entrega y devolución</Text>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0B729D" />
                    <Text style={styles.infoText}>
                        Horario de atención: 8:00 AM - 8:00 PM
                    </Text>
                </View>

                {/* Pickup Time */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="log-in-outline" size={20} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Hora de recogida</Text>
                    </View>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.hoursScroll}
                    >
                        {HOURS.map((hour) => (
                            <TouchableOpacity
                                key={`pickup-${hour}`}
                                style={[
                                    styles.hourButton,
                                    pickupHour === hour && styles.hourButtonActive
                                ]}
                                onPress={() => setPickupHour(hour)}
                            >
                                <Text style={[
                                    styles.hourText,
                                    pickupHour === hour && styles.hourTextActive
                                ]}>
                                    {formatHour(hour)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Return Time */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="log-out-outline" size={20} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Hora de devolución</Text>
                    </View>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.hoursScroll}
                    >
                        {HOURS.map((hour) => (
                            <TouchableOpacity
                                key={`return-${hour}`}
                                style={[
                                    styles.hourButton,
                                    returnHour === hour && styles.hourButtonActive
                                ]}
                                onPress={() => setReturnHour(hour)}
                            >
                                <Text style={[
                                    styles.hourText,
                                    returnHour === hour && styles.hourTextActive
                                ]}>
                                    {formatHour(hour)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Continuar</Text>
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
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    stepIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    stepIndicatorComplete: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorActive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0B729D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorInactive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    stepIndicatorNumberInactive: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    stepIndicatorLine: {
        width: 40,
        height: 2,
        backgroundColor: '#10B981',
    },
    stepIndicatorLineInactive: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
    },
    progressBarContainer: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0B729D',
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0B729D',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 32,
        gap: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#0B729D',
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    hoursScroll: {
        gap: 12,
        paddingHorizontal: 4,
    },
    hourButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        minWidth: 100,
        alignItems: 'center',
    },
    hourButtonActive: {
        borderColor: '#0B729D',
        backgroundColor: '#0B729D',
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    hourText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
    },
    hourTextActive: {
        color: '#fff',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 'auto',
    },
    nextButton: {
        backgroundColor: '#0B729D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
