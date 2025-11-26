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
        setShowPickupPicker(false);
        if (selectedDate) {
            setPickupTime(selectedDate);
        }
    };

    const onReturnTimeChange = (event: any, selectedDate?: Date) => {
        setShowReturnPicker(false);
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
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Horario</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Selecciona la hora de entrega y devolución</Text>

                <View style={styles.timeContainer}>
                    <TouchableOpacity style={styles.timeBox} onPress={() => setShowPickupPicker(true)}>
                        <Text style={styles.timeLabel}>Hora de recogida</Text>
                        <Text style={styles.timeValue}>{formatTime(pickupTime)}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.timeBox} onPress={() => setShowReturnPicker(true)}>
                        <Text style={styles.timeLabel}>Hora de devolución</Text>
                        <Text style={styles.timeValue}>{formatTime(returnTime)}</Text>
                    </TouchableOpacity>
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
                    <Text style={styles.nextButtonText}>Siguiente</Text>
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
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
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
    subtitle: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 24,
    },
    timeContainer: {
        gap: 16,
    },
    timeBox: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    timeLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
        paddingBottom: 34,
    },
    nextButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
