import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
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
import { getVehicleReservations, Reservation } from '../../services/reservations';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function BookingStep1Dates() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle } = route.params;

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectingStart, setSelectingStart] = useState(true);

    useEffect(() => {
        const loadReservations = async () => {
            if (vehicle.id) {
                const res = await getVehicleReservations(vehicle.id);
                setReservations(res);
            }
        };
        loadReservations();
    }, [vehicle.id]);

    // Generate calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    // Check if a date is blocked by a reservation
    const isDateBlocked = (date: Date) => {
        const dateStr = date.toDateString();
        return reservations.some(res => {
            const resStart = new Date(res.startDate);
            const resEnd = new Date(res.endDate);
            const checkDate = new Date(dateStr);
            return checkDate >= resStart && checkDate <= resEnd;
        });
    };

    // Check if date is in the past
    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // Check if date is selected
    const isDateSelected = (date: Date) => {
        if (!startDate && !endDate) return false;
        const dateStr = date.toDateString();
        if (startDate && dateStr === startDate.toDateString()) return true;
        if (endDate && dateStr === endDate.toDateString()) return true;
        return false;
    };

    // Check if date is in range
    const isDateInRange = (date: Date) => {
        if (!startDate || !endDate) return false;
        return date > startDate && date < endDate;
    };

    // Check if range has blocked dates
    const checkRangeAvailability = (start: Date, end: Date): boolean => {
        const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        for (let i = 0; i <= daysBetween; i++) {
            const checkDate = new Date(start);
            checkDate.setDate(start.getDate() + i);
            if (isDateBlocked(checkDate)) {
                return false;
            }
        }
        return true;
    };

    // Handle date selection
    const handleDatePress = (date: Date) => {
        if (isPastDate(date)) {
            Alert.alert('Fecha no disponible', 'No puedes seleccionar fechas pasadas.');
            return;
        }

        if (isDateBlocked(date)) {
            Alert.alert('Fecha ocupada', 'Esta fecha ya está reservada por otro usuario.');
            return;
        }

        if (selectingStart) {
            // Selecting start date
            setStartDate(date);
            setEndDate(null);
            setSelectingStart(false);
        } else {
            // Selecting end date
            if (date <= startDate!) {
                // If clicked before start date, reset and make it the new start
                setStartDate(date);
                setEndDate(null);
                setSelectingStart(false);
                return;
            }

            // Check if range is available
            if (!checkRangeAvailability(startDate!, date)) {
                Alert.alert(
                    'Rango no disponible',
                    'Hay fechas ocupadas en este rango. Por favor elige otras fechas o selecciona un rango más corto.',
                    [
                        { text: 'Elegir otras fechas', onPress: () => {
                            setStartDate(null);
                            setEndDate(null);
                            setSelectingStart(true);
                        }},
                        { text: 'OK', style: 'cancel' }
                    ]
                );
                return;
            }

            setEndDate(date);
        }
    };

    // Allow resetting dates
    const handleResetDates = () => {
        Alert.alert(
            'Cambiar fechas',
            '¿Quieres elegir nuevas fechas?',
            [
                {
                    text: 'Cambiar inicio',
                    onPress: () => {
                        setStartDate(null);
                        setEndDate(null);
                        setSelectingStart(true);
                    }
                },
                {
                    text: 'Cambiar fin',
                    onPress: () => {
                        setEndDate(null);
                        setSelectingStart(false);
                    }
                },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const handleNext = () => {
        if (!startDate || !endDate) {
            Alert.alert('Selecciona fechas', 'Por favor selecciona la fecha de inicio y fin.');
            return;
        }

        // Final validation before proceeding
        if (!checkRangeAvailability(startDate, endDate)) {
            Alert.alert(
                'Fechas no disponibles',
                'Las fechas que seleccionaste ya no están disponibles. Por favor elige otras fechas.',
                [
                    { text: 'Elegir otras', onPress: () => {
                        setStartDate(null);
                        setEndDate(null);
                        setSelectingStart(true);
                    }}
                ]
            );
            return;
        }

        const days = getDurationInDays();
        if (days < 1) {
            Alert.alert('Duración mínima', 'La reserva debe ser de al menos 1 día.');
            return;
        }

        navigation.navigate('BookingStep2Location' as never, { 
            vehicle, 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
        } as never);
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    };

    const getDurationInDays = () => {
        if (!startDate || !endDate) return 0;
        return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getSuggestedDuration = () => {
        const days = getDurationInDays();
        if (days === 0) return 'Selecciona tus fechas';
        if (days === 1) return '1 día - Ideal para prueba rápida';
        if (days >= 2 && days <= 3) return `${days} días - Escapada corta`;
        if (days >= 4 && days <= 7) return `${days} días - Viaje semanal (10% desc.)`;
        if (days >= 8 && days <= 14) return `${days} días - Aventura extendida (15% desc.)`;
        if (days >= 15 && days <= 30) return `${days} días - Estadía larga (20% desc.)`;
        return `${days} días - Alquiler mensual (25% desc.)`;
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
                <Text style={styles.subtitle}>
                    {selectingStart 
                        ? 'Selecciona la fecha de recogida' 
                        : 'Ahora selecciona la fecha de devolución'}
                </Text>

                {/* Selected dates summary */}
                <View style={styles.datesContainer}>
                    <TouchableOpacity 
                        style={[styles.dateCard, selectingStart && styles.activeCard]} 
                        onPress={() => {
                            setSelectingStart(true);
                            if (startDate && endDate) {
                                // Allow changing start date
                                setStartDate(null);
                                setEndDate(null);
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-outline" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Fecha de inicio</Text>
                            <Text style={styles.dateValue}>
                                {startDate 
                                    ? startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                                    : 'Seleccionar'}
                            </Text>
                        </View>
                        {startDate ? (
                            <TouchableOpacity onPress={handleResetDates} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        ) : (
                            selectingStart && <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                        )}
                    </TouchableOpacity>

                    <View style={styles.connectorLine} />

                    <TouchableOpacity 
                        style={[styles.dateCard, !selectingStart && styles.activeCard, !startDate && styles.disabledCard]} 
                        onPress={() => {
                            if (startDate) {
                                setSelectingStart(false);
                                if (endDate) {
                                    // Allow changing end date
                                    setEndDate(null);
                                }
                            }
                        }}
                        activeOpacity={0.8}
                        disabled={!startDate}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar" size={24} color={startDate ? "#0B729D" : "#9CA3AF"} />
                        </View>
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Fecha de fin</Text>
                            <Text style={styles.dateValue}>
                                {endDate 
                                    ? endDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                                    : 'Seleccionar'}
                            </Text>
                        </View>
                        {!selectingStart && <Ionicons name="checkmark-circle" size={20} color="#0B729D" />}
                    </TouchableOpacity>
                </View>

                {/* Duration suggestion and availability check */}
                {startDate && endDate && (
                    <View style={styles.durationBox}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.durationText}>{getSuggestedDuration()}</Text>
                            <Text style={styles.durationSubtext}>Fechas disponibles ✓</Text>
                        </View>
                    </View>
                )}
                
                {startDate && !endDate && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#0B729D" />
                        <Text style={styles.infoText}>
                            Ahora selecciona la fecha de devolución en el calendario
                        </Text>
                    </View>
                )}

                {/* Calendar header */}
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
                        <Ionicons name="chevron-forward" size={24} color="#111827" />
                    </TouchableOpacity>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map(day => (
                        <View key={day} style={styles.weekdayCell}>
                            <Text style={styles.weekdayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                    {calendarDays.map((date, index) => {
                        if (!date) {
                            return <View key={`empty-${index}`} style={styles.dayCell} />;
                        }

                        const isBlocked = isDateBlocked(date);
                        const isPast = isPastDate(date);
                        const isSelected = isDateSelected(date);
                        const inRange = isDateInRange(date);
                        const isDisabled = isPast || isBlocked;

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCell,
                                    isSelected && styles.selectedDay,
                                    inRange && styles.rangeDay,
                                    isDisabled && styles.disabledDay,
                                ]}
                                onPress={() => handleDatePress(date)}
                                disabled={isDisabled}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.dayText,
                                    isSelected && styles.selectedDayText,
                                    inRange && styles.rangeDayText,
                                    isDisabled && styles.disabledDayText,
                                ]}>
                                    {date.getDate()}
                                </Text>
                                {isBlocked && (
                                    <View style={styles.blockedIndicator}>
                                        <Ionicons name="close" size={12} color="#EF4444" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#0B729D' }]} />
                        <Text style={styles.legendText}>Seleccionado</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#DBEAFE' }]} />
                        <Text style={styles.legendText}>En rango</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' }]} />
                        <Text style={styles.legendText}>No disponible</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#0B729D" />
                    <Text style={styles.infoText}>
                        Las fechas en rojo están ocupadas por otras reservas. Duración mínima: 1 día.
                    </Text>
                </View>

                <View style={{ height: 20 }} />
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
    disabledCard: {
        opacity: 0.5,
    },
    durationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    durationText: {
        fontSize: 14,
        color: '#065F46',
        fontWeight: '600',
    },
    durationSubtext: {
        fontSize: 12,
        color: '#059669',
        marginTop: 2,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 32,
        marginBottom: 20,
    },
    monthButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    weekdaysRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekdayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        position: 'relative',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    selectedDay: {
        backgroundColor: '#0B729D',
        borderRadius: 12,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '700',
    },
    rangeDay: {
        backgroundColor: '#DBEAFE',
        borderRadius: 0,
    },
    rangeDayText: {
        color: '#0B729D',
    },
    disabledDay: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        opacity: 0.6,
    },
    disabledDayText: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    blockedIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 24,
        paddingHorizontal: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
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
