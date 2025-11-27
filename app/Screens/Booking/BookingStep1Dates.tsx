import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
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
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
        }
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
        if (Platform.OS === 'android') {
            setShowEndPicker(false);
        }
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
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: '25%' }]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepTitle}>Paso 1 de 4</Text>
                <Text style={styles.title}>Elige las fechas</Text>
                <Text style={styles.subtitle}>Selecciona cuándo quieres recoger y devolver el vehículo</Text>

                <View style={styles.datesContainer}>
                    <TouchableOpacity 
                        style={[styles.dateCard, showStartPicker && styles.activeCard]} 
                        onPress={() => {
                            setShowStartPicker(!showStartPicker);
                            setShowEndPicker(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-outline" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Fecha de inicio</Text>
                            <Text style={styles.dateValue}>
                                {startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.connectorLine} />

                    <TouchableOpacity 
                        style={[styles.dateCard, showEndPicker && styles.activeCard]} 
                        onPress={() => {
                            setShowEndPicker(!showEndPicker);
                            setShowStartPicker(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Fecha de fin</Text>
                            <Text style={styles.dateValue}>
                                {endDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0B729D" />
                    <Text style={styles.infoText}>
                        La duración mínima del alquiler es de 1 día.
                    </Text>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={new Date()}
                        onChange={onStartDateChange}
                        accentColor="#0B729D"
                    />
                )}

                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={startDate}
                        onChange={onEndDateChange}
                        accentColor="#0B729D"
                    />
                )}
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
        lineHeight: 24,
    },
    datesContainer: {
        gap: 16,
    },
    dateCard: {
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
    dateInfo: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textTransform: 'capitalize',
    },
    connectorLine: {
        position: 'absolute',
        left: 40,
        top: 64,
        bottom: 64,
        width: 2,
        backgroundColor: '#E5E7EB',
        zIndex: -1,
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
