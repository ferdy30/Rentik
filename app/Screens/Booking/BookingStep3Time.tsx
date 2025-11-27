import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function BookingStep3Time() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle, startDate, endDate, pickupLocation, returnLocation } = route.params;

    const [pickupTime, setPickupTime] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
    const [returnTime, setReturnTime] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
    const [showPickupPicker, setShowPickupPicker] = useState(false);
    const [showReturnPicker, setShowReturnPicker] = useState(false);

    const onPickupTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPickupPicker(false);
        }
        if (selectedDate) {
            setPickupTime(selectedDate);
        }
    };

    const onReturnTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowReturnPicker(false);
        }
        if (selectedDate) {
            setReturnTime(selectedDate);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleNext = () => {
        navigation.navigate('BookingStep4Confirmation' as never, { 
            vehicle, 
            startDate, 
            endDate,
            pickupLocation,
            returnLocation,
            pickupTime: pickupTime.toISOString(),
            returnTime: returnTime.toISOString()
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

            <View style={styles.content}>
                <Text style={styles.stepTitle}>Paso 3 de 4</Text>
                <Text style={styles.title}>Horario</Text>
                <Text style={styles.subtitle}>Selecciona la hora de entrega y devolución</Text>

                <View style={styles.timeContainer}>
                    <TouchableOpacity 
                        style={[styles.timeCard, showPickupPicker && styles.activeCard]} 
                        onPress={() => {
                            setShowPickupPicker(!showPickupPicker);
                            setShowReturnPicker(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="time-outline" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.timeInfo}>
                            <Text style={styles.timeLabel}>Hora de recogida</Text>
                            <Text style={styles.timeValue}>{formatTime(pickupTime)}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.timeCard, showReturnPicker && styles.activeCard]} 
                        onPress={() => {
                            setShowReturnPicker(!showReturnPicker);
                            setShowPickupPicker(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="time" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.timeInfo}>
                            <Text style={styles.timeLabel}>Hora de devolución</Text>
                            <Text style={styles.timeValue}>{formatTime(returnTime)}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0B729D" />
                    <Text style={styles.infoText}>
                        El horario de atención es de 8:00 AM a 8:00 PM.
                    </Text>
                </View>

                {showPickupPicker && (
                    <DateTimePicker
                        value={pickupTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onPickupTimeChange}
                    />
                )}

                {showReturnPicker && (
                    <DateTimePicker
                        value={returnTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onReturnTimeChange}
                    />
                )}
            </View>

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
        marginBottom: 32,
    },
    timeContainer: {
        gap: 16,
    },
    timeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    activeCard: {
        borderColor: '#0B729D',
        backgroundColor: '#F0F9FF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    timeInfo: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
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
