import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LazyMapView as MapView, LazyMarker as Marker, PROVIDER_GOOGLE } from '../../components/LazyMap';
import { db } from '../../FirebaseConfig';
import TripTimeline from '../../components/TripTimeline';
import { useAuth } from '../../context/Auth';
import { createChatIfNotExists } from '../../services/chat';
import { Reservation } from '../../services/reservations';
import { scheduleReservationReminders } from '../../utils/tripNotifications';

export default function TripDetails() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const params = route.params as { reservation: Reservation } | undefined;
    const initialReservation = params?.reservation;
    
    // ✅ FIX: Mover todos los useState ANTES del early return
    const [reservation, setReservation] = useState<Reservation | null>(initialReservation || null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [showTimeline, setShowTimeline] = useState(true);
    const [hostInfo, setHostInfo] = useState<any>(null);
    const [loadingHost, setLoadingHost] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    // ✅ FIX: Función helper para detectar si el check-in está completo
    const isCheckInCompleted = useCallback(() => {
        if (!reservation) return false;
        
        const hasCompletedFlag = reservation.checkIn?.completed === true;
        const isInProgress = reservation.status === 'in-progress';
        
        return hasCompletedFlag || isInProgress;
    }, [reservation]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: '#FEF9C3', text: '#854D0E' };
            case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'in-progress': return { bg: '#D1FAE5', text: '#065F46' };
            case 'completed': return { bg: '#DCFCE7', text: '#166534' };
            case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
            case 'denied': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const statusColors = reservation ? getStatusColor(reservation.status) : { bg: '#F3F4F6', text: '#374151' };

    // Suscribirse a cambios en la reserva en tiempo real
    useFocusEffect(
        useCallback(() => {
            const reservationId = initialReservation?.id;
            if (!reservationId) return;
            
            // Refetch fresh data when screen gains focus (important after check-in)
            const fetchFreshReservation = async () => {
                try {
                    const reservationSnap = await getDoc(doc(db, 'reservations', reservationId));
                    if (reservationSnap.exists()) {
                        const freshData = { id: reservationSnap.id, ...reservationSnap.data() } as Reservation;
                        setReservation(freshData);
                    }
                } catch (error) {
                    console.error('[TripDetails] Error fetching fresh reservation:', error);
                }
            };
            
            fetchFreshReservation();
            
            // Also maintain real-time listener
            const reservationRef = doc(db, 'reservations', reservationId);
            const unsubscribe = onSnapshot(reservationRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const updatedReservation = { id: docSnap.id, ...data } as Reservation;
                    setReservation(updatedReservation);
                }
            }, (error) => {
                console.error('[TripDetails] Error listening to reservation:', error);
            });

            return () => unsubscribe();
        }, [initialReservation?.id])
    );

    // Programar notificaciones automáticas para reservas confirmadas
    useEffect(() => {
        if (reservation && reservation.status === 'confirmed') {
            scheduleReservationReminders(reservation).catch(error => {
                console.error('[TripDetails] Error scheduling reminders:', error);
            });
        }
    }, [reservation?.id, reservation?.status]);

    useEffect(() => {
        const fetchHostInfo = async () => {
            if (!reservation?.arrendadorId) return;
            
            try {
                const hostDoc = await getDoc(doc(db, 'users', reservation.arrendadorId));
                if (hostDoc.exists()) {
                    const data = hostDoc.data();
                    
                    // Handle createdAt - it might be a Timestamp or undefined
                    let memberSince = new Date();
                    if (data.createdAt) {
                        try {
                            memberSince = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        } catch (e) {
                            memberSince = new Date();
                        }
                    }
                    
                    setHostInfo({
                        nombre: data.nombre || 'Anfitrión',
                        photoURL: data.photoURL || null,
                        rating: data.rating || 4.8,
                        completedTrips: data.completedTrips || 0,
                        memberSince,
                        telefono: data.telefono,
                    });
                }
            } catch (error) {
                console.error('Error fetching host info:', error);
            } finally {
                setLoadingHost(false);
            }
        };

        fetchHostInfo();
    }, [reservation?.arrendadorId]);

    const getTimeRemaining = useCallback(() => {
        if (!reservation) return null;
        const startDate = reservation.startDate?.toDate();
        const endDate = reservation.endDate?.toDate();
        const now = new Date();

        if (!startDate || !endDate) return null;

        if (reservation.status === 'completed') {
            return {
                type: 'completed',
                message: 'Viaje completado',
                icon: 'checkmark-circle',
                color: '#10B981'
            };
        }

        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart > 0) {
            const days = Math.floor(hoursUntilStart / 24);
            const hours = Math.floor(hoursUntilStart % 24);
            return {
                type: 'upcoming',
                message: days > 0 ? `Faltan ${days}d ${hours}h` : `Faltan ${hours} horas`,
                icon: 'time',
                color: '#F59E0B'
            };
        }

        if (hoursUntilEnd > 0) {
            const days = Math.floor(hoursUntilEnd / 24);
            const hours = Math.floor(hoursUntilEnd % 24);
            return {
                type: 'active',
                message: days > 0 ? `${days}d ${hours}h restantes` : `${hours} horas restantes`,
                icon: 'car-sport',
                color: '#0B729D'
            };
        }

        return {
            type: 'ended',
            message: 'Viaje finalizado',
            icon: 'flag',
            color: '#6B7280'
        };
    }, [reservation]);

    // ✅ Definir funciones helpers que usan reservation
    const getTimelineSteps = useCallback(() => {
        if (!reservation) return [];
        const startDate = reservation.startDate?.toDate();
        const endDate = reservation.endDate?.toDate();
        const now = new Date();
        
        const steps = [
            {
                title: 'Reserva confirmada',
                date: reservation.createdAt?.toDate(),
                completed: true,
                icon: 'checkmark-circle',
            },
            {
                title: 'Check-in',
                date: startDate,
                completed: isCheckInCompleted(),
                active: reservation.status === 'confirmed' && startDate && startDate <= now,
                icon: 'key',
            },
            {
                title: 'Viaje en curso',
                date: startDate,
                completed: reservation.status === 'completed',
                active: isCheckInCompleted() && reservation.status !== 'completed',
                icon: 'car-sport',
            },
            {
                title: 'Check-out',
                date: endDate,
                completed: false, // ✅ FIX: Removed checkOut property that doesn't exist
                active: reservation.status === 'confirmed' && endDate && endDate <= now,
                icon: 'exit',
            },
        ];

        return steps;
    }, [reservation, isCheckInCompleted]);

    const timelineSteps = useMemo(() => getTimelineSteps(), [getTimelineSteps]);

    const timeRemainingInfo = useMemo(() => {
        if (!reservation) return null;
        return getTimeRemaining();
    }, [reservation, getTimeRemaining]);

    // ✅ AHORA el early return viene DESPUÉS de todos los hooks
    if (!reservation) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Error: No se encontró la información del viaje.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
                     <Text style={{ color: '#0B729D' }}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'time';
            case 'confirmed': return 'checkmark-circle';
            case 'completed': return 'trophy';
            case 'cancelled': return 'close-circle';
            case 'denied': return 'ban';
            default: return 'information-circle';
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'pending': return '⏳ Reserva pendiente';
            case 'confirmed': return '✅ Reserva confirmada';
            case 'in-progress': return '🚗 Viaje en curso';
            case 'completed': return '🎉 Viaje completado';
            case 'cancelled': return '❌ Reserva cancelada';
            case 'denied': return '🚫 Reserva denegada';
            default: return 'Estado desconocido';
        }
    };

    const getStatusSubtitle = (status: string, res: Reservation) => {
        const startDate = res.startDate?.toDate();
        const now = new Date();
        const daysUntil = startDate ? Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        switch (status) {
            case 'pending': return 'Esperando confirmación del anfitrión';
            case 'confirmed': return daysUntil > 0 ? `Tu viaje comienza en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}` : 'Tu viaje está listo para comenzar';
            case 'in-progress': return '¡Disfruta el camino!';
            case 'completed': return '¡Gracias por usar Rentik!';
            case 'cancelled': return res.cancelReason || 'La reserva fue cancelada';
            case 'denied': return res.denialReason || 'El anfitrión no pudo aceptar tu reserva';
            default: return '';
        }
    };

    const formatFriendlyDate = (date: Date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays === -1) return 'Ayer';
        if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // New Design for header status
    const getStatusStyle = () => {
        if (!reservation) return { bg: '#F3F4F6', color: '#374151', icon: 'information-circle' };
        
        switch (reservation.status) {
            case 'pending':
                return { bg: '#FEF9C3', color: '#854D0E', icon: 'time', message: 'Solicitud enviada' };
            case 'confirmed':
                return { bg: '#DBEAFE', color: '#1E40AF', icon: 'checkmark-circle', message: 'Reserva confirmada' };
            case 'in-progress':
                return { bg: '#D1FAE5', color: '#065F46', icon: 'car-sport', message: 'Viaje activo' };
            case 'completed':
                return { bg: '#DCFCE7', color: '#166534', icon: 'trophy', message: 'Viaje finalizado' };
            case 'cancelled':
                return { bg: '#FEE2E2', color: '#991B1B', icon: 'close-circle', message: 'Cancelada' };
            case 'denied':
                return { bg: '#FEE2E2', color: '#991B1B', icon: 'ban', message: 'Rechazada' };
            default:
                return { bg: '#F3F4F6', color: '#374151', icon: 'help-circle', message: 'Desconocido' };
        }
    };

    const statusStyle = getStatusStyle();

    const handleCallEmergency = () => {
        Alert.alert(
            '🚨 Emergencia',
            '¿Qué tipo de ayuda necesitas?',
            [
                {
                    text: '911 - Emergencia',
                    onPress: () => Linking.openURL('tel:911'),
                    style: 'destructive'
                },
                {
                    text: 'Asistencia vial',
                    onPress: () => {
                        // Número de asistencia vial de ejemplo
                        Linking.openURL('tel:22220000');
                    }
                },
                {
                    text: 'Contactar anfitrión',
                    onPress: () => {
                        if (hostInfo?.telefono) {
                            Linking.openURL(`tel:${hostInfo.telefono}`);
                        } else {
                            Alert.alert('Error', 'Teléfono del anfitrión no disponible');
                        }
                    }
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    const handleAddToCalendar = () => {
        const startDate = reservation.startDate?.toDate();
        const endDate = reservation.endDate?.toDate();
        
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Fechas no disponibles');
            return;
        }

        const title = `Rentik: ${reservation.vehicleSnapshot?.marca} ${reservation.vehicleSnapshot?.modelo}`;
        const location = reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation;
        const details = `Reserva ID: ${reservation.id}\nVehículo: ${reservation.vehicleSnapshot?.marca} ${reservation.vehicleSnapshot?.modelo}\nTotal: $${reservation.totalPrice}`;
        
        // Format dates for calendar (YYYYMMDDTHHMMSS)
        const formatCalendarDate = (date: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
        };

        const startFormatted = formatCalendarDate(startDate);
        const endFormatted = formatCalendarDate(endDate);

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location || '')}`;
        
        Linking.openURL(calendarUrl);
    };

    const handleShareDetails = async () => {
        try {
            const startDate = reservation.startDate?.toDate();
            const endDate = reservation.endDate?.toDate();
            
            const message = `🚗 Detalles de mi Reserva Rentik\n\n` +
                `Vehículo: ${reservation.vehicleSnapshot?.marca} ${reservation.vehicleSnapshot?.modelo} ${reservation.vehicleSnapshot?.anio}\n` +
                `Fechas: ${startDate?.toLocaleDateString('es-ES')} - ${endDate?.toLocaleDateString('es-ES')}\n` +
                `Horario: ${formatTime(reservation.pickupTime)} - ${formatTime(reservation.returnTime)}\n` +
                `Ubicación: ${reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation}\n` +
                `Total: $${reservation.totalPrice.toFixed(2)}\n` +
                `ID: ${reservation.id.slice(0, 8).toUpperCase()}\n\n` +
                `Estado: ${reservation.status.toUpperCase()}`;

            await Share.share({
                message,
                title: 'Detalles de Reserva Rentik'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleReportProblem = () => {
        Alert.alert(
            'Reportar problema',
            '¿Qué tipo de problema deseas reportar?',
            [
                {
                    text: 'Problema con el vehículo',
                    onPress: () => {
                        Alert.alert(
                            'Reportar problema',
                            'Tu reporte ha sido enviado. Un agente de soporte se comunicará contigo pronto.',
                            [{ text: 'OK' }]
                        );
                    }
                },
                {
                    text: 'Problema con la reserva',
                    onPress: () => {
                        Alert.alert(
                            'Reportar problema',
                            'Tu reporte ha sido enviado. Un agente de soporte se comunicará contigo pronto.',
                            [{ text: 'OK' }]
                        );
                    }
                },
                {
                    text: 'Contactar soporte',
                    onPress: () => {
                        // Email o teléfono de soporte
                        Linking.openURL('mailto:soporte@rentik.com?subject=Problema con reserva ' + reservation.id.slice(0, 8));
                    }
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    const handleChat = async () => {
        if (!user || loadingChat) return;
        
        if (!reservation.arrendadorId) {
            Alert.alert('Error', 'No se pudo identificar al anfitrión de esta reserva.');
            return;
        }

        setLoadingChat(true);
        try {
            // Fetch user names from Firestore
            const renterDoc = await getDoc(doc(db, 'users', user.uid));
            const hostDoc = await getDoc(doc(db, 'users', reservation.arrendadorId));
            
            const renterName = renterDoc.exists() ? (renterDoc.data().nombre || 'Usuario') : 'Usuario';
            const hostName = hostDoc.exists() ? (hostDoc.data().nombre || 'Anfitrión') : 'Anfitrión';
            
            const participantNames = {
                [user.uid]: renterName,
                [reservation.arrendadorId]: hostName
            };

            const chatId = await createChatIfNotExists(
                reservation.id,
                [user.uid, reservation.arrendadorId],
                {
                    marca: reservation.vehicleSnapshot?.marca || '',
                    modelo: reservation.vehicleSnapshot?.modelo || '',
                    imagen: reservation.vehicleSnapshot?.imagen || ''
                },
                participantNames
            );

            navigation.navigate('ChatRoom', {
                reservationId: reservation.id,
                participants: [user.uid, reservation.arrendadorId],
                vehicleInfo: {
                    marca: reservation.vehicleSnapshot?.marca || '',
                    modelo: reservation.vehicleSnapshot?.modelo || '',
                    imagen: reservation.vehicleSnapshot?.imagen || ''
                }
            });
        } catch (error: any) {
            console.error('Error opening chat:', error);
            
            if (error.code === 'permission-denied') {
                Alert.alert('Acceso denegado', 'No tienes permiso para acceder a este chat.');
            } else if (error.code === 'unavailable') {
                Alert.alert('Sin conexión', 'Verifica tu conexión a internet e intenta de nuevo.');
            } else {
                Alert.alert('Error', 'No se pudo abrir el chat. Intenta de nuevo.');
            }
        } finally {
            setLoadingChat(false);
        }
    };

    const handleCheckIn = () => {
        // Verificar que la reserva esté confirmada
        if (reservation.status !== 'confirmed') {
            Alert.alert('Error', 'Solo puedes hacer check-in en reservas confirmadas.');
            return;
        }

        // Verificar que el check-in esté dentro de la ventana permitida (24h antes hasta hora de inicio)
        const startDate = reservation.startDate?.toDate();
        const now = new Date();
        
        if (!startDate) {
            Alert.alert('Error', 'Fecha de inicio no disponible.');
            return;
        }

        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilStart > 24) {
            const daysUntil = Math.ceil(hoursUntilStart / 24);
            Alert.alert(
                'Check-in no disponible', 
                `El check-in estará disponible 24 horas antes de tu reserva.\n\nPuedes hacer check-in en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}.`
            );
            return;
        }

        if (hoursUntilStart < 0) {
            Alert.alert('Error', 'El periodo de check-in ha expirado.');
            return;
        }
        
        navigation.navigate('CheckInStart', { reservation });
    };

    const handleRepeatBooking = () => {
        if (!reservation.vehicleSnapshot) {
            Alert.alert('Error', 'Información del vehículo no disponible.');
            return;
        }

        Alert.alert(
            'Repetir reserva',
            '¿Quieres reservar este vehículo nuevamente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Continuar',
                    onPress: () => {
                        setLoadingAction(true);
                        // Navigate to vehicle details with the same vehicle
                        const vehicle = {
                            id: reservation.vehicleId,
                            marca: reservation.vehicleSnapshot.marca,
                            modelo: reservation.vehicleSnapshot.modelo,
                            anio: reservation.vehicleSnapshot.anio,
                            precio: reservation.vehicleSnapshot.precio,
                            imagen: reservation.vehicleSnapshot.imagen,
                            propietarioId: reservation.arrendadorId,
                        };
                        navigation.navigate('Details', { vehicle });
                        setTimeout(() => setLoadingAction(false), 500);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles del Viaje</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* Status Header - New Design */}
                <View style={[styles.statusHeader, { backgroundColor: statusStyle.bg }]}>
                    <View style={[styles.statusIconContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                        <Ionicons name={statusStyle.icon} size={24} color={statusStyle.color} />
                    </View>
                    <View style={styles.statusContent}>
                        <Text style={[styles.statusTitle, { color: statusStyle.color }]}>
                            {statusStyle.message}
                        </Text>
                        <Text style={[styles.statusSubtitle, { color: statusStyle.color, opacity: 0.8 }]}>
                            {getStatusSubtitle(reservation.status, reservation)}
                        </Text>
                    </View>
                </View>

                {/* Vehículo Card */}
                <View style={styles.section}>
                  <View style={styles.vehicleSection}>
                    <View style={styles.vehicleImageContainer}>
                        <Image 
                            source={{ uri: reservation.vehicleSnapshot?.imagen }} 
                            style={styles.vehicleImage}
                            contentFit="cover"
                            transition={200}
                        />

                        <View style={styles.vehicleInfoOverlay}>
                            <View>
                                <Text style={styles.vehicleBrandTextOverlay}>{reservation.vehicleSnapshot?.marca}</Text>
                                <Text style={styles.vehicleModelTextOverlay}>{reservation.vehicleSnapshot?.modelo} {reservation.vehicleSnapshot?.anio}</Text>
                            </View>
                            <View style={styles.reservationIdBoxOverlay}>
                                <Text style={styles.reservationIdTextOverlay}>ID: {reservation.id.slice(0, 8).toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                  </View>
                </View>

                {/* Quick Actions Bar */}
                {(reservation.status === 'confirmed' || reservation.status === 'in-progress') && (
                    <View style={styles.quickActionsBar}>
                        <TouchableOpacity style={styles.quickActionButton} onPress={handleChat}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                                <Ionicons name="chatbubbles" size={24} color="#0B729D" />
                            </View>
                            <Text style={styles.quickActionLabel}>Chat</Text>
                        </TouchableOpacity>

                         <TouchableOpacity style={styles.quickActionButton} onPress={() => {
                            if (hostInfo?.telefono) Linking.openURL(`tel:${hostInfo.telefono}`);
                        }}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="call" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.quickActionLabel}>Llamar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickActionButton} onPress={handleCallEmergency}>
                             <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="warning" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.quickActionLabel}>SOS</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Host Info */}
                {!loadingHost && hostInfo && (
                    <View style={styles.sectionWithPadding}>
                        <View style={styles.hostCard}>
                            <View style={styles.hostCardHeader}>
                                <Ionicons name="person-circle-outline" size={20} color="#0B729D" />
                                <Text style={styles.hostCardTitle}>Tu Anfitrión</Text>
                            </View>
                            <View style={styles.hostContent}>
                            <View style={styles.hostImageContainer}>
                                {hostInfo.photoURL ? (
                                    <Image 
                                        source={{ uri: hostInfo.photoURL }} 
                                        style={styles.hostImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                ) : (
                                    <View style={styles.hostImagePlaceholder}>
                                        <Ionicons name="person" size={36} color="#9CA3AF" />
                                    </View>
                                )}
                                <View style={styles.hostVerifiedBadge}>
                                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                                </View>
                            </View>
                            <View style={styles.hostDetails}>
                                <Text style={styles.hostName}>{hostInfo.nombre}</Text>
                                <View style={styles.hostStats}>
                                    <View style={styles.hostStatBadge}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text style={styles.hostStatText}>{hostInfo.rating.toFixed(1)}</Text>
                                    </View>
                                    <View style={styles.hostStatBadge}>
                                        <Ionicons name="car-sport" size={14} color="#6B7280" />
                                        <Text style={styles.hostStatText}>{hostInfo.completedTrips} viajes</Text>
                                    </View>
                                </View>
                                <View style={styles.hostVerificationContainer}>
                                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                                    <Text style={styles.hostVerificationText}>Usuario Verificado</Text>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.hostContactSection}>
                            <TouchableOpacity 
                                style={styles.hostContactButton}
                                onPress={handleChat}
                                disabled={loadingChat}
                            >
                                <View style={styles.hostContactIconCircle}>
                                    {loadingChat ? (
                                        <ActivityIndicator size="small" color="#0B729D" />
                                    ) : (
                                        <Ionicons name="mail" size={18} color="#0B729D" />
                                    )}
                                </View>
                                <View style={styles.hostContactTextWrapper}>
                                    <Text style={styles.hostContactLabel}>Mensaje</Text>
                                    <Text style={styles.hostContactValue}>Enviar mensaje</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                            
                            {hostInfo.telefono && (
                                <TouchableOpacity 
                                    style={styles.hostContactButton}
                                    onPress={() => Linking.openURL(`tel:${hostInfo.telefono}`)}
                                >
                                    <View style={styles.hostContactIconCircle}>
                                        <Ionicons name="call" size={18} color="#0B729D" />
                                    </View>
                                    <View style={styles.hostContactTextWrapper}>
                                        <Text style={styles.hostContactLabel}>Teléfono</Text>
                                        <Text style={styles.hostContactValue}>{hostInfo.telefono}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                        </View>
                    </View>
                )}

                {/* Active Trip Actions - only for in-progress */}
                {reservation.status === 'in-progress' && (() => {
                    const endDate = reservation.endDate?.toDate();
                    const now = new Date();
                    const hoursRemaining = endDate ? (endDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;
                    const daysRemaining = Math.floor(hoursRemaining / 24);
                    const hoursRemainingMod = Math.floor(hoursRemaining % 24);
                    
                    return (
                        <View style={styles.sectionWithPadding}>
                            <View style={styles.activeTripCard}>
                                <View style={styles.activeTripHeader}>
                                    <View style={styles.activeTripIconCircle}>
                                        <Ionicons name="car-sport" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.activeTripHeaderText}>
                                        <Text style={styles.activeTripTitle}>¡Viaje en curso!</Text>
                                        <Text style={styles.activeTripSubtitle}>
                                            {daysRemaining > 0 ? `${daysRemaining}d ${hoursRemainingMod}h restantes` : `${Math.floor(hoursRemaining)}h restantes`}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.activeTripActions}>
                                    <TouchableOpacity 
                                        style={styles.activeTripActionButton}
                                        onPress={() => {
                                            const location = reservation.isDelivery 
                                                ? reservation.deliveryAddress 
                                                : reservation.pickupLocation;
                                            const url = Platform.select({
                                                ios: `maps://app?daddr=${encodeURIComponent(location || '')}`,
                                                android: `google.navigation:q=${encodeURIComponent(location || '')}`,
                                            });
                                            if (url) Linking.openURL(url);
                                        }}
                                    >
                                        <Ionicons name="navigate" size={20} color="#0B729D" />
                                        <Text style={styles.activeTripActionText}>Navegación</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.activeTripActionButton}
                                        onPress={handleChat}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={20} color="#0B729D" />
                                        <Text style={styles.activeTripActionText}>Chat</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.activeTripActionButton, styles.activeTripActionEmergency]}
                                        onPress={handleCallEmergency}
                                    >
                                        <Ionicons name="warning" size={20} color="#EF4444" />
                                        <Text style={[styles.activeTripActionText, { color: '#EF4444' }]}>SOS</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.activeTripInfo}>
                                    <View style={styles.activeTripInfoRow}>
                                        <Ionicons name="location" size={16} color="#6B7280" />
                                        <Text style={styles.activeTripInfoText} numberOfLines={1}>
                                            Devolución: {reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation}
                                        </Text>
                                    </View>
                                    <View style={styles.activeTripInfoRow}>
                                        <Ionicons name="time" size={16} color="#6B7280" />
                                        <Text style={styles.activeTripInfoText}>
                                            Hora límite: {formatTime(reservation.returnTime)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })()}

                {/* Timeline Visual - show for confirmed and later statuses */}
                {reservation.status !== 'pending' && reservation.status !== 'denied' && reservation.status !== 'cancelled' && (
                    <View style={styles.sectionWithPadding}>
                        <TripTimeline 
                            currentStatus={reservation.status} 
                            isRenter={true}
                            checkInCompleted={reservation.checkIn?.completed || reservation.status === 'in-progress' || reservation.status === 'completed'}
                            checkOutCompleted={reservation.checkOut?.completed || reservation.status === 'completed'}
                        />
                    </View>
                )}

                {/* Trip Info - Redesigned */}
                <View style={styles.sectionWithPadding}>
                    <Text style={styles.sectionTitleMain}>Información del viaje</Text>
                    
                    <View style={styles.infoCardsGrid}>
                        {/* Dates Card */}
                        <View style={styles.infoCardCompact}>
                            <View style={styles.infoCardIconCircle}>
                                <Ionicons name="calendar" size={20} color="#0B729D" />
                            </View>
                            <View style={styles.infoCardContent}>
                                <Text style={styles.infoCardLabel}>Fechas</Text>
                                <Text style={styles.infoCardValue}>
                                    {formatFriendlyDate(reservation.startDate.toDate())}
                                </Text>
                                <Text style={styles.infoCardSubValue}>
                                    hasta {formatFriendlyDate(reservation.endDate.toDate())}
                                </Text>
                            </View>
                        </View>

                        {/* Time Card */}
                        <View style={styles.infoCardCompact}>
                            <View style={styles.infoCardIconCircle}>
                                <Ionicons name="time" size={20} color="#0B729D" />
                            </View>
                            <View style={styles.infoCardContent}>
                                <Text style={styles.infoCardLabel}>Horario</Text>
                                <Text style={styles.infoCardValue}>
                                    {formatTime(reservation.pickupTime)}
                                </Text>
                                <Text style={styles.infoCardSubValue}>
                                    a {formatTime(reservation.returnTime)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Location Card */}
                    <View style={styles.locationFullCard}>
                        <View style={styles.locationCardHeader}>
                            <View style={[styles.infoCardIconCircle, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons 
                                    name={reservation.isDelivery ? "car-sport" : "location"} 
                                    size={22} 
                                    color="#0B729D" 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.locationCardTitle}>
                                    {reservation.isDelivery ? 'Entrega a domicilio' : 'Punto de recogida'}
                                </Text>
                                <Text style={styles.locationCardAddress}>
                                    {reservation.isDelivery 
                                        ? reservation.deliveryAddress 
                                        : (reservation.pickupLocation || 'Ubicación no disponible')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Extras - Redesigned */}
                {reservation.extras && (
                    <View style={styles.sectionWithPadding}>
                        <Text style={styles.sectionTitleMain}>Extras contratados</Text>
                        <View style={styles.extrasGrid}>
                            {reservation.extras.insurance && (
                                <View style={styles.extraChip}>
                                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                                    <Text style={styles.extraChipText}>Seguro Premium</Text>
                                </View>
                            )}
                            {reservation.extras.babySeat && (
                                <View style={styles.extraChip}>
                                    <Ionicons name="happy" size={18} color="#F59E0B" />
                                    <Text style={styles.extraChipText}>Silla de bebé</Text>
                                </View>
                            )}
                            {reservation.extras.gps && (
                                <View style={styles.extraChip}>
                                    <Ionicons name="navigate" size={18} color="#3B82F6" />
                                    <Text style={styles.extraChipText}>GPS</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Price Breakdown - Redesigned */}
                {reservation.priceBreakdown && (
                    <View style={styles.sectionWithPadding}>
                        <Text style={styles.sectionTitleMain}>Resumen de pago</Text>
                        <View style={styles.priceCardNew}>
                            <View style={styles.priceItemRow}>
                                <Text style={styles.priceItemLabel}>Renta del vehículo</Text>
                                <Text style={styles.priceItemValue}>${(reservation.priceBreakdown.pricePerDay * reservation.priceBreakdown.days).toFixed(2)}</Text>
                            </View>
                            <Text style={styles.priceItemDetail}>{reservation.priceBreakdown.days} días × ${reservation.priceBreakdown.pricePerDay}/día</Text>
                            
                            {reservation.priceBreakdown.extrasTotal > 0 && (
                                <>
                                    <View style={styles.priceDividerLight} />
                                    <View style={styles.priceItemRow}>
                                        <Text style={styles.priceItemLabel}>Extras</Text>
                                        <Text style={styles.priceItemValue}>${reservation.priceBreakdown.extrasTotal.toFixed(2)}</Text>
                                    </View>
                                </>
                            )}
                            
                            {reservation.priceBreakdown.deliveryFee > 0 && (
                                <>
                                    <View style={styles.priceDividerLight} />
                                    <View style={styles.priceItemRow}>
                                        <Text style={styles.priceItemLabel}>Entrega a domicilio</Text>
                                        <Text style={styles.priceItemValue}>${reservation.priceBreakdown.deliveryFee.toFixed(2)}</Text>
                                    </View>
                                </>
                            )}
                            
                            <View style={styles.priceDividerLight} />
                            <View style={styles.priceItemRow}>
                                <Text style={styles.priceItemLabel}>Tarifa de servicio</Text>
                                <Text style={styles.priceItemValue}>${reservation.priceBreakdown.serviceFee.toFixed(2)}</Text>
                            </View>
                            
                            <View style={styles.priceDividerBold} />
                            
                            <View style={styles.priceTotalRowNew}>
                                <View>
                                    <Text style={styles.priceTotalLabelNew}>Total pagado</Text>
                                    <Text style={styles.pricePaymentMethod}>Pagado con tarjeta</Text>
                                </View>
                                <Text style={styles.priceTotalValueNew}>${reservation.priceBreakdown.total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Important Info Section - Redesigned */}
                <View style={styles.sectionWithPadding}>
                    <Text style={styles.sectionTitleMain}>Información importante</Text>

                    {/* Cancellation Policy */}
                    <View style={styles.infoCardAlert}>
                        <View style={styles.infoCardAlertHeader}>
                            <Ionicons name="calendar" size={18} color="#DC2626" />
                            <Text style={styles.infoCardAlertTitle}>Política de cancelación</Text>
                        </View>
                        <Text style={styles.infoCardAlertText}>
                            Cancelación gratuita hasta 48 horas antes del inicio. Cancelaciones con menos de 48h tienen una penalización del 20% del total.
                        </Text>
                        {reservation.status === 'confirmed' && (() => {
                            const startDate = reservation.startDate?.toDate();
                            if (!startDate) return null;
                            const hoursUntilStart = (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                            const canCancelFree = hoursUntilStart > 48;
                            return (
                                <View style={[styles.alertBadge, { backgroundColor: canCancelFree ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <Ionicons 
                                        name={canCancelFree ? "checkmark-circle" : "alert-circle"} 
                                        size={14} 
                                        color={canCancelFree ? '#166534' : '#991B1B'} 
                                    />
                                    <Text style={[styles.alertBadgeText, { color: canCancelFree ? '#166534' : '#991B1B' }]}>
                                        {canCancelFree ? 'Cancelación gratuita disponible' : 'Cancelación con penalización'}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>

                    {/* Key Info Grid */}
                    <View style={styles.keyInfoGrid}>
                        <View style={styles.keyInfoItem}>
                            <Ionicons name="speedometer" size={20} color="#0B729D" />
                            <Text style={styles.keyInfoLabel}>Kilometraje</Text>
                            <Text style={styles.keyInfoValue}>
                                {reservation.priceBreakdown?.days ? `${reservation.priceBreakdown.days * 200} km` : 'Ilimitado'}
                            </Text>
                            <Text style={styles.keyInfoSubtext}>+$0.15/km extra</Text>
                        </View>

                        <View style={styles.keyInfoItem}>
                            <Ionicons name="water" size={20} color="#0B729D" />
                            <Text style={styles.keyInfoLabel}>Combustible</Text>
                            <Text style={styles.keyInfoValue}>Tanque lleno</Text>
                            <Text style={styles.keyInfoSubtext}>Recoger y devolver</Text>
                        </View>
                    </View>

                    {/* Required Documents */}
                    <View style={styles.documentsCardNew}>
                        <View style={styles.documentsHeaderNew}>
                            <Ionicons name="document-text" size={20} color="#0B729D" />
                            <Text style={styles.documentsCardTitle}>Documentos requeridos</Text>
                        </View>
                        <View style={styles.documentsListNew}>
                            {['Licencia de conducir vigente', 'DUI o pasaporte', 'Tarjeta de crédito/débito', 'Comprobante de reserva'].map((doc, index) => (
                                <View key={index} style={styles.documentItemNew}>
                                    <View style={styles.documentCheckCircle}>
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    </View>
                                    <Text style={styles.documentTextNew}>{doc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Map */}
                <View style={styles.mapSection}>
                    <View style={styles.mapHeader}>
                        <Ionicons name="location" size={20} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Ubicación de recogida</Text>
                    </View>
                    
                    {/* Location Address Card */}
                    <View style={styles.locationCard}>
                        <View style={styles.locationIconWrapper}>
                            <Ionicons name="location" size={24} color="#0B729D" />
                        </View>
                        <View style={styles.locationTextWrapper}>
                            <Text style={styles.locationTitle}>
                                {reservation.isDelivery ? 'Dirección de entrega' : 'Punto de recogida'}
                            </Text>
                            <Text style={styles.locationAddress}>
                                {reservation.isDelivery 
                                    ? reservation.deliveryAddress 
                                    : (reservation.pickupLocation || 'San Salvador, El Salvador')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.mapContainer}>
                        {(reservation.pickupCoordinates || reservation.deliveryCoords) ? (
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    latitude: (reservation.pickupCoordinates || reservation.deliveryCoords).latitude,
                                    longitude: (reservation.pickupCoordinates || reservation.deliveryCoords).longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                scrollEnabled={true}
                                zoomEnabled={true}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: (reservation.pickupCoordinates || reservation.deliveryCoords).latitude,
                                        longitude: (reservation.pickupCoordinates || reservation.deliveryCoords).longitude
                                    }}
                                    title={reservation.isDelivery ? "Punto de entrega" : "Punto de recogida"}
                                    description={reservation.isDelivery ? reservation.deliveryAddress : reservation.pickupLocation}
                                >
                                    <View style={styles.customMarker}>
                                        <Ionicons name="location" size={40} color="#0B729D" />
                                    </View>
                                </Marker>
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Ionicons name="map-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.mapPlaceholderTitle}>Mapa no disponible</Text>
                                <Text style={styles.mapPlaceholderSubtitle}>
                                    Usa la dirección de arriba para ubicarte
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.directionsActions}>
                        {(reservation.pickupCoordinates || reservation.deliveryCoords) ? (
                            <>
                                <TouchableOpacity 
                                    style={styles.directionsButton} 
                                    onPress={() => {
                                        const coords = reservation.pickupCoordinates || reservation.deliveryCoords;
                                        Linking.openURL(
                                            `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
                                        );
                                    }}
                                >
                                    <Ionicons name="navigate" size={18} color="#fff" />
                                    <Text style={styles.directionsButtonText}>Cómo llegar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.directionsButtonSecondary}
                                    onPress={() => {
                                        const coords = reservation.pickupCoordinates || reservation.deliveryCoords;
                                        Linking.openURL(
                                            `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
                                        );
                                    }}
                                >
                                    <Ionicons name="location-outline" size={18} color="#0B729D" />
                                    <Text style={styles.directionsButtonSecondaryText}>Ver en mapa</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity 
                                style={styles.directionsButton} 
                                onPress={() => {
                                    const address = reservation.isDelivery 
                                        ? reservation.deliveryAddress 
                                        : (reservation.pickupLocation || 'San Salvador, El Salvador');
                                    Linking.openURL(
                                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                                    );
                                }}
                            >
                                <Ionicons name="search" size={18} color="#fff" />
                                <Text style={styles.directionsButtonText}>Buscar en Google Maps</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Emergency */}
                <TouchableOpacity style={styles.emergencyButton} onPress={handleCallEmergency}>
                    <Ionicons name="warning-outline" size={24} color="#EF4444" />
                    <Text style={styles.emergencyText}>Llamar a emergencias</Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Pending Status - Waiting for confirmation */}
            {reservation.status === 'pending' && (
                <View style={styles.actionBar}>
                    <View style={[styles.checkInBanner, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="hourglass-outline" size={18} color="#F59E0B" />
                        <Text style={[styles.checkInBannerText, { color: '#92400E' }]}>
                            ⏳ Esperando confirmación del anfitrión
                        </Text>
                    </View>
                </View>
            )}

            {/* Cancelled/Denied Status */}
            {(reservation.status === 'cancelled' || reservation.status === 'denied') && (
                <View style={styles.actionBar}>
                    <View style={[styles.checkInBanner, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="close-circle" size={18} color="#DC2626" />
                        <Text style={[styles.checkInBannerText, { color: '#991B1B' }]}>
                            {reservation.status === 'cancelled' ? '❌ Reserva cancelada' : '🚫 Reserva rechazada'}
                        </Text>
                    </View>
                    {reservation.status === 'denied' && reservation.denialReason && (
                        <View style={[styles.checkInBanner, { backgroundColor: '#FEF9C3', marginTop: 8 }]}>
                            <Ionicons name="information-circle" size={16} color="#92400E" />
                            <Text style={[styles.checkInBannerText, { color: '#78350F', fontSize: 13 }]}>
                                Motivo: {reservation.denialReason}
                            </Text>
                        </View>
                    )}
                </View>
            )}

      {(reservation.status === 'confirmed' || reservation.status === 'in-progress') && (() => {
                const startDate = reservation.startDate?.toDate();
                const endDate = reservation.endDate?.toDate();
                const now = new Date();
                
                const msUntilStart = startDate ? startDate.getTime() - now.getTime() : 999999999;
                const msUntilEnd = endDate ? endDate.getTime() - now.getTime() : -1;
                const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
                const hoursUntilEnd = msUntilEnd / (1000 * 60 * 60);

                // ✅ FIX: Si el check-in ya se completó (ambos firmaron), mostrar panel de viaje activo
                if (isCheckInCompleted()) {
                    return (
                        <View style={[styles.actionBar, { flexDirection: 'column', gap: 10, height: 'auto', paddingTop: 10 }]}>
                            <View style={[styles.checkInBanner, { backgroundColor: '#DCFCE7', marginBottom: 0, width: '100%' }]}>
                                <Ionicons name="car-sport" size={18} color="#166534" />
                                <Text style={[styles.checkInBannerText, { color: '#166534' }]}>
                                    Viaje en curso • ¡Disfruta el camino!
                                </Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity 
                                    style={[styles.checkInButton, { backgroundColor: '#3B82F6', flex: 1 }]}
                                    onPress={() => navigation.navigate('CheckInComplete', { 
                                        reservation, 
                                        checkInId: reservation.checkIn?.id 
                                    })}
                                >
                                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                                    <Text style={styles.checkInButtonText}>Ver Check-in</Text>
                                </TouchableOpacity>

                                {/* Check-out button */}
                                <TouchableOpacity 
                                    style={[styles.checkInButton, { backgroundColor: '#DC2626', flex: 1 }]}
                                    onPress={() => {
                                        // Navigate to checkout when ready
                                        navigation.navigate('CheckOutStart', { reservation });
                                    }}
                                >
                                    <Ionicons name="exit-outline" size={20} color="#fff" />
                                    <Text style={styles.checkInButtonText}>Check-out</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }
                
                // Resto de la lógica anterior para Iniciar Check-in...
                const canCheckIn = (
                    (hoursUntilStart <= 24 && hoursUntilStart > -2) ||
                    (hoursUntilStart <= 0 && hoursUntilEnd > 0)
                );
                
                let buttonText = 'Preparar Check-in';
                let statusBanner = null;
                let onPressAction = () => navigation.navigate('CheckInPreparation', { reservation, isArrendador: false });
                
                // ✅ FIX: Verificar si hay check-in iniciado pero no completado
                if (reservation.checkIn && !isCheckInCompleted()) {
                    buttonText = 'Continuar Check-in';
                    onPressAction = () => navigation.navigate('CheckInStart', { reservation });
                } else if (!canCheckIn) {
                     // ... reuse logic ...
                    if (hoursUntilStart > 24) {
                        const days = Math.ceil(hoursUntilStart / 24);
                        buttonText = `Disponible en ${days} día${days > 1 ? 's' : ''}`;
                    } else if (hoursUntilEnd <= 0) {
                        buttonText = 'Viaje finalizado';
                    } else {
                        buttonText = 'Ventana expirada';
                    }
                } else if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
                    // ... reuse logic ...
                    const hours = Math.floor(hoursUntilStart);
                    const minutes = Math.floor((hoursUntilStart % 1) * 60);
                    statusBanner = (
                        <View style={styles.checkInBanner}>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                            <Text style={styles.checkInBannerText}>
                                Check-in disponible • {hours}h {minutes}min para el inicio
                            </Text>
                        </View>
                    );
                } else if (hoursUntilStart <= 0 && hoursUntilEnd > 0) {
                    // ... reuse logic ...
                    statusBanner = (
                        <View style={[styles.checkInBanner, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <Text style={[styles.checkInBannerText, { color: '#166534' }]}>
                                ¡Tu viaje está activo! Hora de hacer check-in
                            </Text>
                        </View>
                    );
                }

                return (
                    <>
                        {statusBanner}
                        <View style={styles.actionBar}>
                            <TouchableOpacity 
                                style={[styles.checkInButton, !canCheckIn && styles.buttonDisabled]} 
                                onPress={onPressAction}
                                disabled={!canCheckIn}
                            >
                                <Ionicons name="qr-code-outline" size={20} color="#fff" />
                                <Text style={styles.checkInButtonText}>{buttonText}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );
            })()}

            {reservation.status === 'completed' && (
                <View style={styles.actionBar}>
                    <TouchableOpacity 
                        style={[styles.primaryButton, loadingAction && styles.buttonDisabled]} 
                        onPress={handleRepeatBooking}
                        disabled={loadingAction}
                    >
                        {loadingAction ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="repeat-outline" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Repetir reserva</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
    menuButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    helpButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 0,
    },
    sectionWithPadding: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    vehicleSection: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginHorizontal: 16,
        marginTop: 16,
    },
    vehicleCard: {
        position: 'relative',
        borderRadius: 0,
        overflow: 'hidden',
    },
    vehicleImageContainer: {
        position: 'relative',
    },
    imageWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
    vehicleImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#F3F4F6',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
    },
    vehicleOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    vehicleInfoCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    vehicleMainInfo: {
        marginBottom: 12,
    },
    vehicleBrandText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 16,
        gap: 16,
    },
    statusIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    vehicleInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',  // Gradient effect simulation
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    vehicleBrandTextOverlay: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    vehicleModelTextOverlay: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    reservationIdBoxOverlay: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    reservationIdTextOverlay: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    quickActionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 8,
    },
    quickActionButton: {
        alignItems: 'center',
        gap: 8,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    sectionWithPadding: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    hostCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    hostCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    hostCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    hostContent: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 16,
    },
    hostImageContainer: {
        position: 'relative',
    },
    hostImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F3F4F6',
        borderWidth: 3,
        borderColor: '#fff',
    },
    hostImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    hostVerifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 2,
    },
    hostDetails: {
        flex: 1,
    },
    hostName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    hostStats: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    hostStatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    hostStatText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    hostVerificationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    hostVerificationText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    hostContactSection: {
        padding: 16,
        gap: 12,
    },
    hostContactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
    },
    hostContactIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostContactTextWrapper: {
        flex: 1,
    },
    hostContactLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2,
    },
    hostContactValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    checkInBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#FDE68A',
    },
    checkInBannerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
        flex: 1,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 34,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    checkInButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#16A34A',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    checkInButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#0B729D',
    },
    secondaryButtonText: {
        color: '#0B729D',
        fontWeight: '700',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    sectionTitleMain: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    infoCardsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    infoCardCompact: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    infoCardIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    infoCardContent: {
        gap: 2,
    },
    infoCardLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCardValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginTop: 2,
    },
    infoCardSubValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    locationFullCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    locationCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationCardTitle: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    locationCardAddress: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 20,
    },
    extrasGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    extraChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    extraChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    priceCardNew: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    priceItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priceItemLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    priceItemValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    priceItemDetail: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12,
        fontWeight: '500',
    },
    priceDividerLight: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    priceDividerBold: {
        height: 1,
        backgroundColor: '#D1D5DB',
        marginVertical: 16,
    },
    priceTotalRowNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceTotalLabelNew: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    pricePaymentMethod: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    priceTotalValueNew: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0B729D',
        letterSpacing: -0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
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
    infoSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    importantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    infoCardAlert: {
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    infoCardAlertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    infoCardAlertTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    infoCardAlertText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 12,
        fontWeight: '500',
    },
    alertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    alertBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    keyInfoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    keyInfoItem: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    keyInfoLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 8,
        textAlign: 'center',
    },
    keyInfoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginTop: 4,
        textAlign: 'center',
    },
    keyInfoSubtext: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        textAlign: 'center',
        fontWeight: '500',
    },
    documentsCardNew: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    documentsHeaderNew: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    documentsCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    documentsListNew: {
        gap: 12,
    },
    documentItemNew: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    documentCheckCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentTextNew: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
    },
    policyCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    policyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    policyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    policyText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    policyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    policyBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    documentsCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    documentsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    documentsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    documentsList: {
        gap: 10,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    documentText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    mapSection: {
        padding: 20,
        backgroundColor: '#fff',
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    locationIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0B729D',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    locationTextWrapper: {
        flex: 1,
    },
    locationTitle: {
        fontSize: 12,
        color: '#0369A1',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationAddress: {
        fontSize: 15,
        color: '#075985',
        fontWeight: '600',
        lineHeight: 20,
    },
    mapContainer: {
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    mapPlaceholderTitle: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '700',
    },
    mapPlaceholderSubtitle: {
        marginTop: 6,
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    mapPlaceholderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    directionsActions: {
        flexDirection: 'row',
        gap: 12,
    },
    directionsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: '#0B729D',
        borderRadius: 12,
        gap: 8,
    },
    directionsButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    directionsButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    directionsButtonSecondaryText: {
        color: '#0B729D',
        fontWeight: '600',
        fontSize: 14,
    },
    directionsText: {
        color: '#0B729D',
        fontWeight: '600',
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 20,
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        gap: 8,
    },
    emergencyText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    timelineSection: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F9FAFB',
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineIconContainer: {
        alignItems: 'center',
        marginRight: 16,
        zIndex: 1,
    },
    timelineIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    timelineIconCompleted: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    timelineIconActive: {
        backgroundColor: '#0B729D',
        borderColor: '#0B729D',
    },
    timelineLine: {
        width: 3,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 6,
        marginLeft: 1,
    },
    timelineLineCompleted: {
        backgroundColor: '#10B981',
    },
    timelineCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 6,
    },
    timelineCardCompleted: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    timelineCardActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    timelineCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6B7280',
        flex: 1,
    },
    timelineTitleCompleted: {
        color: '#059669',
    },
    timelineTitleActive: {
        color: '#0B729D',
    },
    completedBadge: {
        backgroundColor: '#10B981',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0B729D',
    },
    activeBadgeText: {
        color: '#0B729D',
        fontSize: 10,
        fontWeight: '600',
    },
    timelineDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    priceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    priceCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    // Active Trip Styles
    activeTripCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#86EFAC',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    activeTripHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    activeTripIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTripHeaderText: {
        flex: 1,
    },
    activeTripTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 2,
    },
    activeTripSubtitle: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
    },
    activeTripActions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    activeTripActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#BFDBFE',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activeTripActionEmergency: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    activeTripActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0B729D',
    },
    activeTripInfo: {
        gap: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#A7F3D0',
    },
    activeTripInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeTripInfoText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
        flex: 1,
    },
    priceLabelText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    priceTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    priceTotalBadge: {
        backgroundColor: '#0B729D',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    priceTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    hostActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12,
    },
    hostActionButtonPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#0B729D',
        borderRadius: 12,
        gap: 8,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    hostActionTextPrimary: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    hostActionButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    hostActionTextSecondary: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0B729D',
    },
});