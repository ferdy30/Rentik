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
const POPULAR_HOURS = [9, 10, 14, 16]; // Recommended pickup/return times

export default function BookingStep3Time() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate, pickupLocation, returnLocation, isDelivery, deliveryAddress, deliveryCoords } = route.params;

    const [pickupHour, setPickupHour] = useState(10);
    const [returnHour, setReturnHour] = useState(10);
    const [pickupPeriod, setPickupPeriod] = useState<'AM' | 'PM'>('AM');
    const [returnPeriod, setReturnPeriod] = useState<'AM' | 'PM'>('AM');

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const get24Hour = (hour: number, period: 'AM' | 'PM') => {
        if (period === 'AM') {
            return hour === 12 ? 0 : hour;
        } else {
            return hour === 12 ? 12 : hour + 12;
        }
    };

    const getDisplayHour = (hour: number) => {
        return hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    };

    const handleQuickPickupTime = (time: string) => {
        if (time === 'morning') {
            setPickupHour(9);
            setPickupPeriod('AM');
        } else if (time === 'afternoon') {
            setPickupHour(2);
            setPickupPeriod('PM');
        } else if (time === 'evening') {
            setPickupHour(5);
            setPickupPeriod('PM');
        }
    };

    const handleNext = () => {
        // Create ISO strings with exact hours
        const final24PickupHour = get24Hour(pickupHour, pickupPeriod);
        const final24ReturnHour = get24Hour(returnHour, returnPeriod);
        
        const pickupDate = new Date(startDate);
        pickupDate.setHours(final24PickupHour, 0, 0, 0);
        
        const returnDate = new Date(endDate);
        returnDate.setHours(final24ReturnHour, 0, 0, 0);

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

                {/* Host availability info */}
                <View style={styles.availabilityBanner}>
                    <View style={styles.availabilityIcon}>
                        <Ionicons name="time-outline" size={20} color="#10B981" />
                    </View>
                    <View style={styles.availabilityText}>
                        <Text style={styles.availabilityTitle}>Horario de atención</Text>
                        <Text style={styles.availabilityHours}>8:00 AM - 8:00 PM</Text>
                    </View>
                </View>

                {/* Quick Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Horarios populares de recogida</Text>
                    <View style={styles.quickTimeContainer}>
                        <TouchableOpacity 
                            style={styles.quickTimeCard}
                            onPress={() => handleQuickPickupTime('morning')}
                        >
                            <Ionicons name="sunny-outline" size={24} color="#F59E0B" />
                            <Text style={styles.quickTimeLabel}>Mañana</Text>
                            <Text style={styles.quickTimeHour}>9:00 AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.quickTimeCard}
                            onPress={() => handleQuickPickupTime('afternoon')}
                        >
                            <Ionicons name="partly-sunny-outline" size={24} color="#3B82F6" />
                            <Text style={styles.quickTimeLabel}>Tarde</Text>
                            <Text style={styles.quickTimeHour}>2:00 PM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.quickTimeCard}
                            onPress={() => handleQuickPickupTime('evening')}
                        >
                            <Ionicons name="moon-outline" size={24} color="#6366F1" />
                            <Text style={styles.quickTimeLabel}>Noche</Text>
                            <Text style={styles.quickTimeHour}>5:00 PM</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pickup Time Detailed Selector */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="log-in-outline" size={22} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Hora de recogida</Text>
                    </View>
                    
                    <View style={styles.timePickerCard}>
                        {/* Hour Selector */}
                        <View style={styles.timePickerRow}>
                            <Text style={styles.timePickerLabel}>Hora</Text>
                            <View style={styles.hourButtonsContainer}>
                                {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((h, index) => (
                                    <TouchableOpacity
                                        key={`pickup-${h}-${index}`}
                                        style={[
                                            styles.hourButtonSmall,
                                            pickupHour === h && styles.hourButtonSmallActive
                                        ]}
                                        onPress={() => setPickupHour(h)}
                                    >
                                        <Text style={[
                                            styles.hourButtonSmallText,
                                            pickupHour === h && styles.hourButtonSmallTextActive
                                        ]}>
                                            {h}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* AM/PM Selector */}
                        <View style={styles.periodSelectorRow}>
                            <Text style={styles.timePickerLabel}>Período</Text>
                            <View style={styles.periodSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.periodButton,
                                        pickupPeriod === 'AM' && styles.periodButtonActive
                                    ]}
                                    onPress={() => setPickupPeriod('AM')}
                                >
                                    <Text style={[
                                        styles.periodButtonText,
                                        pickupPeriod === 'AM' && styles.periodButtonTextActive
                                    ]}>
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.periodButton,
                                        pickupPeriod === 'PM' && styles.periodButtonActive
                                    ]}
                                    onPress={() => setPickupPeriod('PM')}
                                >
                                    <Text style={[
                                        styles.periodButtonText,
                                        pickupPeriod === 'PM' && styles.periodButtonTextActive
                                    ]}>
                                        PM
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Selected Time Display */}
                        <View style={styles.selectedTimeDisplay}>
                            <Ionicons name="time" size={20} color="#0B729D" />
                            <Text style={styles.selectedTimeText}>
                                {pickupHour}:00 {pickupPeriod}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Return Time Selector */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="log-out-outline" size={22} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Hora de devolución</Text>
                    </View>
                    
                    <View style={styles.timePickerCard}>
                        {/* Hour Selector */}
                        <View style={styles.timePickerRow}>
                            <Text style={styles.timePickerLabel}>Hora</Text>
                            <View style={styles.hourButtonsContainer}>
                                {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((h, index) => (
                                    <TouchableOpacity
                                        key={`return-${h}-${index}`}
                                        style={[
                                            styles.hourButtonSmall,
                                            returnHour === h && styles.hourButtonSmallActive
                                        ]}
                                        onPress={() => setReturnHour(h)}
                                    >
                                        <Text style={[
                                            styles.hourButtonSmallText,
                                            returnHour === h && styles.hourButtonSmallTextActive
                                        ]}>
                                            {h}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* AM/PM Selector */}
                        <View style={styles.periodSelectorRow}>
                            <Text style={styles.timePickerLabel}>Período</Text>
                            <View style={styles.periodSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.periodButton,
                                        returnPeriod === 'AM' && styles.periodButtonActive
                                    ]}
                                    onPress={() => setReturnPeriod('AM')}
                                >
                                    <Text style={[
                                        styles.periodButtonText,
                                        returnPeriod === 'AM' && styles.periodButtonTextActive
                                    ]}>
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.periodButton,
                                        returnPeriod === 'PM' && styles.periodButtonActive
                                    ]}
                                    onPress={() => setReturnPeriod('PM')}
                                >
                                    <Text style={[
                                        styles.periodButtonText,
                                        returnPeriod === 'PM' && styles.periodButtonTextActive
                                    ]}>
                                        PM
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Selected Time Display */}
                        <View style={styles.selectedTimeDisplay}>
                            <Ionicons name="time" size={20} color="#0B729D" />
                            <Text style={styles.selectedTimeText}>
                                {returnHour}:00 {returnPeriod}
                            </Text>
                        </View>
                    </View>
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
    availabilityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    availabilityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    availabilityText: {
        flex: 1,
    },
    availabilityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#065F46',
        marginBottom: 2,
    },
    availabilityHours: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10B981',
    },
    sectionSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 12,
    },
    quickTimeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    quickTimeCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    quickTimeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 8,
        marginBottom: 4,
    },
    quickTimeHour: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    timePickerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    timePickerRow: {
        marginBottom: 16,
    },
    timePickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 10,
    },
    hourButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hourButtonSmall: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hourButtonSmallActive: {
        backgroundColor: '#0B729D',
        borderColor: '#0B729D',
    },
    hourButtonSmallText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    hourButtonSmallTextActive: {
        color: '#FFFFFF',
    },
    periodSelectorRow: {
        marginBottom: 16,
    },
    periodSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#0B729D',
        borderColor: '#0B729D',
    },
    periodButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    periodButtonTextActive: {
        color: '#FFFFFF',
    },
    selectedTimeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    selectedTimeText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0B729D',
        marginLeft: 8,
    },
});
