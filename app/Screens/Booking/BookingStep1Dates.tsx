import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { checkAvailability, getVehicleReservations, Reservation } from '../../services/reservations';

export default function BookingStep1Dates() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle } = route.params;

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // +1 day
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        const loadReservations = async () => {
            if (vehicle.id) {
                const res = await getVehicleReservations(vehicle.id);
                setReservations(res);
            }
        };
        loadReservations();
    }, [vehicle.id]);

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(false);
        if (selectedDate) {
            const isAvailable = checkAvailability(selectedDate, endDate, reservations);
            if (!isAvailable) {
                Alert.alert('Fechas no disponibles', 'Las fechas seleccionadas coinciden con una reserva existente.');
                return;
            }
            setStartDate(selectedDate);
            if (selectedDate > endDate) {
                setEndDate(new Date(selectedDate.getTime() + 86400000));
            }
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(false);
        if (selectedDate) {
            const isAvailable = checkAvailability(startDate, selectedDate, reservations);
            if (!isAvailable) {
                Alert.alert('Fechas no disponibles', 'Las fechas seleccionadas coinciden con una reserva existente.');
                return;
            }
            setEndDate(selectedDate);
        }
    };

    const handleNext = () => {
        const isAvailable = checkAvailability(startDate, endDate, reservations);
        if (!isAvailable) {
             Alert.alert('Error', 'Las fechas seleccionadas no están disponibles.');
             return;
        }
        navigation.navigate('BookingStep2Location' as never, { 
            vehicle, 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
        } as never);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Elige las fechas</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Selecciona cuándo quieres viajar</Text>

                <View style={styles.datesContainer}>
                    <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
                        <Text style={styles.dateLabel}>Inicio</Text>
                        <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <View style={styles.arrowContainer}>
                        <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                    </View>
                    <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
                        <Text style={styles.dateLabel}>Fin</Text>
                        <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onStartDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onEndDateChange}
                        minimumDate={startDate}
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
    datesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#F9FAFB',
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateBox: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    arrowContainer: {
        paddingHorizontal: 8,
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
