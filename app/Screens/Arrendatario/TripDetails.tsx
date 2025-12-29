import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../../../FirebaseConfig';
import { useAuth } from '../../../context/Auth';
import TripTimeline from '../../components/TripTimeline';
import { createChatIfNotExists } from '../../services/chat';
import { Reservation } from '../../services/reservations';
import { scheduleReservationReminders } from '../../utils/tripNotifications';

export default function TripDetails() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { reservation } = route.params as { reservation: Reservation };
    const [loadingChat, setLoadingChat] = useState(false);
    const [showTimeline, setShowTimeline] = useState(true);
    const [hostInfo, setHostInfo] = useState<any>(null);
    const [loadingHost, setLoadingHost] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: '#FEF9C3', text: '#854D0E' };
            case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'completed': return { bg: '#DCFCE7', text: '#166534' };
            case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
            case 'denied': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const statusColors = getStatusColor(reservation.status);

    // Programar notificaciones automáticas para reservas confirmadas
    useEffect(() => {
        if (reservation.status === 'confirmed') {
            scheduleReservationReminders(reservation).catch(error => {
                console.error('[TripDetails] Error scheduling reminders:', error);
            });
        }
    }, [reservation.id, reservation.status]);

    useEffect(() => {
        const fetchHostInfo = async () => {
            if (!reservation.arrendadorId) return;
            
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
    }, [reservation.arrendadorId]);

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

    const getTimeRemaining = () => {
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
    };

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

    const getTimelineSteps = () => {
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
                completed: reservation.checkIn?.completed || false,
                active: reservation.status === 'confirmed' && startDate && startDate <= now,
                icon: 'key',
            },
            {
                title: 'Viaje en curso',
                date: startDate,
                completed: reservation.status === 'completed',
                active: reservation.checkIn?.completed && reservation.status === 'confirmed',
                icon: 'car-sport',
            },
            {
                title: 'Check-out',
                date: endDate,
                completed: reservation.checkOut?.completed || false,
                active: reservation.status === 'confirmed' && endDate && endDate <= now,
                icon: 'exit',
            },
        ];

        return steps;
    };

    const timelineSteps = useMemo(() => getTimelineSteps(), [reservation.startDate, reservation.endDate, reservation.status, reservation.checkIn, reservation.checkOut, reservation.createdAt]);

    const timeRemainingInfo = useMemo(() => getTimeRemaining(), [reservation.startDate, reservation.endDate, reservation.status]);

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
                        <View style={styles.vehicleOverlay}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                                    {reservation.status === 'pending' && '⏳ Pendiente'}
                                    {reservation.status === 'confirmed' && '✅ Confirmada'}
                                    {reservation.status === 'completed' && '🎉 Completada'}
                                    {reservation.status === 'cancelled' && '❌ Cancelada'}
                                    {reservation.status === 'denied' && '🚫 Denegada'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.vehicleInfoCard}>
                            <View style={styles.vehicleMainInfo}>
                                <Text style={styles.vehicleBrandText}>{reservation.vehicleSnapshot?.marca}</Text>
                                <Text style={styles.vehicleModelText}>
                                    {reservation.vehicleSnapshot?.modelo}
                                </Text>
                                <Text style={styles.vehicleYearText}>{reservation.vehicleSnapshot?.anio}</Text>
                            </View>
                            <View style={styles.reservationIdBox}>
                                <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                                <Text style={styles.reservationIdText}>ID: {reservation.id.slice(0, 8).toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                  </View>
                </View>

                {/* Host Info */}
                {!loadingHost && hostInfo && (
                    <View style={styles.sectionWithPadding}>
                        <View style={styles.hostCard}>
                            <View style={styles.hostCardHeader}>
                                <View style={styles.hostHeaderLeft}>
                                    <View style={styles.hostIconCircle}>
                                        <Ionicons name="person-circle" size={22} color="#0B729D" />
                                    </View>
                                    <Text style={styles.hostCardTitle}>Tu Anfitrión</Text>
                                </View>
                                <View style={styles.superHostBadge}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={styles.superHostText}>Anfitrión</Text>
                                </View>
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
                                    <View style={styles.hostStatItem}>
                                        <Ionicons name="star" size={15} color="#F59E0B" />
                                        <Text style={styles.hostStatText}>{hostInfo.rating.toFixed(1)}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.hostStatItem}>
                                        <Ionicons name="car-sport-outline" size={15} color="#0B729D" />
                                        <Text style={styles.hostStatText}>{hostInfo.completedTrips} viajes</Text>
                                    </View>
                                </View>
                                <View style={styles.hostMemberInfo}>
                                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                                    <Text style={styles.hostMemberSince}>
                                        Miembro desde {hostInfo.memberSince.getFullYear()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.hostActions}>
                            <TouchableOpacity 
                                style={styles.hostActionButtonSecondary}
                                onPress={handleChat}
                                disabled={loadingChat}
                            >
                                {loadingChat ? (
                                    <ActivityIndicator size="small" color="#0B729D" />
                                ) : (
                                    <>
                                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0B729D" />
                                        <Text style={styles.hostActionTextSecondary}>Mensaje</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {hostInfo.telefono && (
                                <TouchableOpacity 
                                    style={styles.hostActionButtonPrimary}
                                    onPress={() => Linking.openURL(`tel:${hostInfo.telefono}`)}
                                >
                                    <Ionicons name="call-outline" size={20} color="#fff" />
                                    <Text style={styles.hostActionTextPrimary}>Llamar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        </View>
                    </View>
                )}

                {/* Timeline Visual - show for confirmed and later statuses */}
                {reservation.status !== 'pending' && reservation.status !== 'denied' && reservation.status !== 'cancelled' && (
                    <View style={styles.sectionWithPadding}>
                        <TripTimeline currentStatus={reservation.status} isRenter={true} />
                    </View>
                )}

                {/* Trip Info */}
                <View style={styles.sectionWithPadding}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={24} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Información del viaje</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Fechas</Text>
                            <Text style={styles.infoValue}>
                                {formatFriendlyDate(reservation.startDate.toDate())} - {formatFriendlyDate(reservation.endDate.toDate())}
                            </Text>
                            <Text style={styles.infoSubtext}>
                                {reservation.startDate.toDate().toLocaleDateString('es-ES', { weekday: 'long' })} al {reservation.endDate.toDate().toLocaleDateString('es-ES', { weekday: 'long' })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="time-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Horario</Text>
                            <Text style={styles.infoValue}>
                                {formatTime(reservation.pickupTime)} - {formatTime(reservation.returnTime)}
                            </Text>
                            {reservation.pickupTime && (() => {
                                const pickupDate = new Date(reservation.pickupTime);
                                const returnDate = new Date(reservation.returnTime);
                                const duration = (returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60);
                                return (
                                    <Text style={styles.infoSubtext}>
                                        Duración total: {Math.floor(duration / 24)}d {Math.floor(duration % 24)}h
                                    </Text>
                                );
                            })()}
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons 
                                name={reservation.isDelivery ? "car-sport-outline" : "location-outline"} 
                                size={20} 
                                color="#0B729D" 
                            />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>
                                {reservation.isDelivery ? 'Dirección de entrega' : 'Ubicación de recogida'}
                            </Text>
                            <Text style={styles.infoValue}>
                                {reservation.isDelivery 
                                    ? reservation.deliveryAddress 
                                    : (reservation.pickupLocation || 'Ubicación no disponible')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Extras */}
                {reservation.extras && (
                    <View style={styles.sectionWithPadding}>
                        <Text style={styles.sectionTitle}>Extras contratados</Text>
                        {reservation.extras.insurance && (
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color="#0B729D" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Seguro</Text>
                                    <Text style={styles.infoValue}>Seguro Premium</Text>
                                </View>
                            </View>
                        )}
                        {reservation.extras.babySeat && (
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="happy-outline" size={20} color="#0B729D" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Accesorio</Text>
                                    <Text style={styles.infoValue}>Silla de bebé</Text>
                                </View>
                            </View>
                        )}
                        {reservation.extras.gps && (
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="navigate-outline" size={20} color="#0B729D" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Accesorio</Text>
                                    <Text style={styles.infoValue}>GPS Navegador</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Price Breakdown */}
                {reservation.priceBreakdown && (
                    <View style={styles.sectionWithPadding}>
                        <View style={styles.priceHeader}>
                            <Ionicons name="receipt-outline" size={20} color="#0B729D" />
                            <Text style={styles.sectionTitle}>Resumen de pago</Text>
                        </View>
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <View style={styles.priceLabel}>
                                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                                    <Text style={styles.priceLabelText}>Renta ({reservation.priceBreakdown.days} días × ${reservation.priceBreakdown.pricePerDay})</Text>
                                </View>
                                <Text style={styles.priceValue}>${(reservation.priceBreakdown.pricePerDay * reservation.priceBreakdown.days).toFixed(2)}</Text>
                            </View>
                            {reservation.priceBreakdown.extrasTotal > 0 && (
                                <View style={styles.priceRow}>
                                    <View style={styles.priceLabel}>
                                        <Ionicons name="add-circle-outline" size={16} color="#6B7280" />
                                        <Text style={styles.priceLabelText}>Extras</Text>
                                    </View>
                                    <Text style={styles.priceValue}>${reservation.priceBreakdown.extrasTotal.toFixed(2)}</Text>
                                </View>
                            )}
                            {reservation.priceBreakdown.deliveryFee > 0 && (
                                <View style={styles.priceRow}>
                                    <View style={styles.priceLabel}>
                                        <Ionicons name="car-sport-outline" size={16} color="#6B7280" />
                                        <Text style={styles.priceLabelText}>Delivery</Text>
                                    </View>
                                    <Text style={styles.priceValue}>${reservation.priceBreakdown.deliveryFee.toFixed(2)}</Text>
                                </View>
                            )}
                            <View style={styles.priceRow}>
                                <View style={styles.priceLabel}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
                                    <Text style={styles.priceLabelText}>Tarifa de servicio</Text>
                                </View>
                                <Text style={styles.priceValue}>${reservation.priceBreakdown.serviceFee.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceTotalRow}>
                                <Text style={styles.priceTotalLabel}>Total pagado</Text>
                                <View style={styles.priceTotalBadge}>
                                    <Text style={styles.priceTotalValue}>${reservation.priceBreakdown.total.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Important Info Section */}
                <View style={styles.sectionWithPadding}>
                    <View style={styles.importantHeader}>
                        <Ionicons name="information-circle" size={20} color="#0B729D" />
                        <Text style={styles.sectionTitle}>Información importante</Text>
                    </View>

                    {/* Cancellation Policy */}
                    <View style={styles.policyCard}>
                        <View style={styles.policyHeader}>
                            <Ionicons name="calendar-outline" size={18} color="#DC2626" />
                            <Text style={styles.policyTitle}>Política de cancelación</Text>
                        </View>
                        <Text style={styles.policyText}>
                            Cancelación gratuita hasta 48 horas antes del inicio. Cancelaciones con menos de 48h tienen una penalización del 20% del total.
                        </Text>
                        {reservation.status === 'confirmed' && (() => {
                            const startDate = reservation.startDate?.toDate();
                            if (!startDate) return null;
                            const hoursUntilStart = (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                            const canCancelFree = hoursUntilStart > 48;
                            return (
                                <View style={[styles.policyBadge, { backgroundColor: canCancelFree ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <Ionicons 
                                        name={canCancelFree ? "checkmark-circle" : "alert-circle"} 
                                        size={14} 
                                        color={canCancelFree ? '#166534' : '#991B1B'} 
                                    />
                                    <Text style={[styles.policyBadgeText, { color: canCancelFree ? '#166534' : '#991B1B' }]}>
                                        {canCancelFree ? 'Cancelación gratuita disponible' : 'Cancelación con penalización'}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>

                    {/* Mileage */}
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="speedometer-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Kilometraje incluido</Text>
                            <Text style={styles.infoValue}>
                                {reservation.priceBreakdown?.days ? `${reservation.priceBreakdown.days * 200} km` : 'Ilimitado'}
                            </Text>
                            <Text style={styles.infoSubtext}>
                                Costo adicional: $0.15 por km extra
                            </Text>
                        </View>
                    </View>

                    {/* Fuel */}
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="water-outline" size={20} color="#0B729D" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Combustible</Text>
                            <Text style={styles.infoValue}>Tanque lleno al recoger y devolver</Text>
                            <Text style={styles.infoSubtext}>
                                El vehículo debe devolverse con el mismo nivel de combustible
                            </Text>
                        </View>
                    </View>

                    {/* Required Documents */}
                    <View style={styles.documentsCard}>
                        <View style={styles.documentsHeader}>
                            <Ionicons name="document-text" size={18} color="#0B729D" />
                            <Text style={styles.documentsTitle}>Documentos requeridos</Text>
                        </View>
                        <View style={styles.documentsList}>
                            <View style={styles.documentItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.documentText}>Licencia de conducir vigente</Text>
                            </View>
                            <View style={styles.documentItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.documentText}>DUI o pasaporte</Text>
                            </View>
                            <View style={styles.documentItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.documentText}>Tarjeta de crédito o débito</Text>
                            </View>
                            <View style={styles.documentItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.documentText}>Comprobante de reserva (digital)</Text>
                            </View>
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

            {/* Action Buttons */}
            {reservation.status === 'confirmed' && (() => {
                const startDate = reservation.startDate?.toDate();
                const endDate = reservation.endDate?.toDate();
                const now = new Date();
                
                const msUntilStart = startDate ? startDate.getTime() - now.getTime() : 999999999;
                const msUntilEnd = endDate ? endDate.getTime() - now.getTime() : -1;
                const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
                const hoursUntilEnd = msUntilEnd / (1000 * 60 * 60);
                
                // Check-in disponible si:
                // - Faltan menos de 24h Y más de -2h (ventana de tolerancia de 26h), O
                // - El viaje ya empezó pero no ha terminado
                const canCheckIn = (
                    (hoursUntilStart <= 24 && hoursUntilStart > -2) ||
                    (hoursUntilStart <= 0 && hoursUntilEnd > 0)
                );
                
                let buttonText = 'Preparar Check-in';
                let statusBanner = null;
                
                if (!canCheckIn) {
                    if (hoursUntilStart > 24) {
                        const days = Math.ceil(hoursUntilStart / 24);
                        buttonText = `Disponible en ${days} día${days > 1 ? 's' : ''}`;
                    } else if (hoursUntilEnd <= 0) {
                        buttonText = 'Viaje finalizado';
                    } else {
                        buttonText = 'Ventana expirada';
                    }
                } else if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
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
                                onPress={() => navigation.navigate('CheckInPreparation', { reservation, isArrendador: false })}
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
        padding: 20,
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
    vehicleModelText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    vehicleYearText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    reservationIdBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    reservationIdText: {
        fontSize: 12,
        color: '#0369A1',
        fontWeight: '700',
        letterSpacing: 0.5,
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    hostHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    hostIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    superHostBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    superHostText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hostCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    hostContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 16,
    },
    hostImageContainer: {
        position: 'relative',
    },
    hostImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        borderWidth: 3,
        borderColor: '#fff',
    },
    hostImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    hostVerifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    hostStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
    },
    hostStatText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    hostMemberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hostMemberSince: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
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