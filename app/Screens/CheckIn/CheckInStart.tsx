import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from "../../FirebaseConfig";
import { useAuth } from "../../context/Auth";
import {
    markParticipantReady,
    startCheckIn,
    subscribeToCheckIn,
    updateCheckInStatus,
} from "../../services/checkIn";
import { Reservation } from "../../services/reservations";
import { logger } from "../../utils/logger";

export default function CheckInStart() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const params = route.params as { reservation: Reservation } | undefined;
  const reservation = params?.reservation;

  // ✅ ALL hooks MUST be called before any conditional return (React Rules of Hooks)
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [otherPartyReady, setOtherPartyReady] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [vehicleCoordinates, setVehicleCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [meetingCoordinates, setMeetingCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [otherPartyLocation, setOtherPartyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Refs para evitar navegaciones múltiples y llamadas duplicadas
  const hasNavigatedRef = useRef(false);
  const checkInUnsubscribeRef = useRef<(() => void) | null>(null);
  const hasInitializedCheckInRef = useRef(false);

  // ✅ Refetch Reservation to ensure fresh state (especially checkIn status)
  const [freshReservation, setFreshReservation] = useState<Reservation | null>(
    null,
  );
  // Ref for map - must be declared with all other hooks
  const mapRef = React.useRef<MapView>(null);

  // Use reservation from params directly — arrendadorId never changes between param
  // and freshReservation, so this is safe and avoids the "false owner" race during load.
  const isOwner =
    user?.uid === (freshReservation?.arrendadorId ?? reservation?.arrendadorId);

  // Early return AFTER all hooks (Rules of Hooks compliant)
  if (!reservation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: Datos de reserva no encontrados.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text style={{ color: "blue" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    if (!reservation?.id) return;
    let isMounted = true;
    const fetchReservation = async () => {
      try {
        const docSnap = await getDoc(doc(db, "reservations", reservation.id));
        if (docSnap.exists() && isMounted) {
          setFreshReservation({
            id: docSnap.id,
            ...docSnap.data(),
          } as Reservation);
        }
      } catch (e: any) {
        logger.error("Failed to fetch reservation", { error: e.message });
      }
    };
    fetchReservation();
    return () => {
      isMounted = false;
    };
  }, [reservation?.id]);

  useEffect(() => {
    if (!reservation) return;
    initializeLocation();
    requestLocationPermission();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        logger.info("Location subscription cleanup");
      }
      if (checkInUnsubscribeRef.current) {
        checkInUnsubscribeRef.current();
        logger.info("CheckIn listener cleanup");
        checkInUnsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for check-in initialization
  useEffect(() => {
    if (
      !hasInitializedCheckInRef.current &&
      freshReservation &&
      freshReservation.id
    ) {
      hasInitializedCheckInRef.current = true;
      logger.info("Initializing check-in for reservation", {
        reservationId: freshReservation.id,
      });
      initializeCheckIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshReservation]);

  // Effect to fit map and recalculate distance when coordinates change
  useEffect(() => {
    if (userLocation && meetingCoordinates && mapRef.current) {
      // Wrap in try-catch to prevent Android crashes
      try {
        // Add delay to ensure map is fully mounted on Android
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                {
                  latitude: meetingCoordinates.latitude,
                  longitude: meetingCoordinates.longitude,
                },
              ],
              {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              },
            );
          }
        }, 300);
      } catch (error: any) {
        logger.warn("Failed to fit map coordinates", { error: error.message });
      }
    }

    // Recalculate distance whenever coordinates change
    if (userLocation && meetingCoordinates) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        meetingCoordinates.latitude,
        meetingCoordinates.longitude,
      );
      setDistance(dist);
    }
  }, [userLocation, meetingCoordinates]);

  // Effect to set meeting point based on role
  useEffect(() => {
    if (isOwner && userLocation) {
      // Para el HOST: Su ubicación ES el punto de encuentro (vehículo)
      setVehicleCoordinates(userLocation);
      setMeetingCoordinates(userLocation);
    } else if (!isOwner && otherPartyLocation) {
      // Para el RENTER: Si el Host ya llegó (tiene ubicación), ese es el punto de encuentro REAL
      setMeetingCoordinates(otherPartyLocation);
    }
  }, [isOwner, userLocation, otherPartyLocation]);

  const initializeLocation = async () => {
    // Solo geocodificar si NO es el host (para viajeros)
    if (isOwner) {
      // El host no necesita inicializar nada aquí
      // Su ubicación será el punto de encuentro (se establece en el useEffect)
      return;
    }

    // Si ya tenemos la ubicación del Host (porque estamos retomando el check-in), usar esa
    if (otherPartyLocation) {
      setMeetingCoordinates(otherPartyLocation);
      return;
    }

    // PRIORIDAD 1: Usar coordenadas guardadas directamente (más eficiente y confiable)
    let meetingPoint = null;

    if (reservation.isDelivery) {
      // Para DELIVERY: usar deliveryCoordinates o pickupCoordinates
      meetingPoint =
        reservation.deliveryCoordinates || reservation.pickupCoordinates;

      if (meetingPoint) {
        logger.info("Using delivery coordinates for check-in", {
          coordinates: meetingPoint,
        });
      }
    } else {
      // Para PICKUP normal: usar pickupCoordinates guardadas del vehículo
      meetingPoint = reservation.pickupCoordinates;

      if (meetingPoint) {
        logger.info("Using pickup coordinates for check-in", {
          coordinates: meetingPoint,
        });
      }
    }

    // Si tenemos coordenadas, usarlas directamente
    if (meetingPoint) {
      setMeetingCoordinates(meetingPoint);
      setVehicleCoordinates(meetingPoint);
      return;
    }

    // PRIORIDAD 2: Fallback a geocoding solo si NO hay coordenadas guardadas
    const targetAddress = reservation.isDelivery
      ? reservation.deliveryAddress
      : reservation.pickupLocation || "";

    if (targetAddress) {
      logger.info("No coordinates found, attempting geocoding", {
        address: targetAddress,
      });

      try {
        const geocoded = await Location.geocodeAsync(targetAddress);
        if (geocoded.length > 0) {
          const coords = {
            latitude: geocoded[0].latitude,
            longitude: geocoded[0].longitude,
          };
          setMeetingCoordinates(coords);
          setVehicleCoordinates(coords);
          logger.info("Geocoding successful", { coordinates: coords });
        } else {
          logger.warn("Geocoding failed for address", {
            address: targetAddress,
          });
        }
      } catch (error: any) {
        logger.error("Error geocoding address", { error: error.message });
      }
    } else {
      logger.error("No coordinates or address available for check-in location");
      Alert.alert(
        "Error de ubicación",
        "No se pudo determinar el punto de encuentro. Por favor contacta al host.",
        [{ text: "Entendido" }],
      );
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:").catch(() =>
        Linking.openURL("App-prefs:Privacy&path=LOCATION"),
      );
    } else {
      Linking.openSettings();
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        startLocationTracking();
      } else {
        Alert.alert(
          "Permiso de ubicación requerido",
          "Necesitamos tu ubicación para verificar que estás cerca del vehículo. Ve a Configuración para activarlo.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Configuración", onPress: openLocationSettings },
          ],
        );
      }
    } catch (error: any) {
      logger.error("Error requesting location permission", {
        error: error.message,
      });
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get initial position quickly
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Android optimization
      });
      updateUserLocation(current);

      // Start watching
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          updateUserLocation(location);
        },
      );
      setLocationSubscription(sub);
    } catch (error: any) {
      logger.error("Error starting location tracking", {
        error: error.message,
      });

      // ERR_LOCATION_SETTINGS_UNSATISFIED → GPS off on Android
      const isGpsOff =
        error.code === "ERR_LOCATION_SETTINGS_UNSATISFIED" ||
        error.message?.includes("GPS") ||
        error.message?.includes("location settings");

      if (isGpsOff && Platform.OS === "android") {
        Alert.alert(
          "GPS desactivado",
          "Activa el GPS para que podamos registrar tu ubicación.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Activar GPS", onPress: openLocationSettings },
          ],
        );
      } else {
        const msg =
          Platform.OS === "android"
            ? "No se pudo obtener tu ubicación. Verifica que los permisos y el GPS estén activos."
            : "No se pudo obtener tu ubicación. Verifica que el GPS esté activado.";
        Alert.alert("Error de ubicación", msg, [
          { text: "Cancelar", style: "cancel" },
          { text: "Configuración", onPress: openLocationSettings },
        ]);
      }
    }
  };

  const updateUserLocation = (location: Location.LocationObject) => {
    const userCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setUserLocation(userCoords);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  // ✅ Handler centralizado para actualizaciones de check-in
  const handleCheckInUpdate = (checkIn: any, currentCheckInId: string) => {
    // Evitar procesar si ya navegamos
    if (hasNavigatedRef.current) {
      return;
    }

    if (checkIn) {
      // Update local states
      if (isOwner) {
        setIsReady(checkIn.ownerReady);
        setOtherPartyReady(checkIn.renterReady);
        if (checkIn.renterLocation) {
          setOtherPartyLocation(checkIn.renterLocation);
        }
      } else {
        setIsReady(checkIn.renterReady);
        setOtherPartyReady(checkIn.ownerReady);
        if (checkIn.ownerLocation) {
          setOtherPartyLocation(checkIn.ownerLocation);
        }
      }

      // Mark initialization as done once we have data
      setInitializing(false);

      // Check if both are ready
      const bothAreReady = checkIn.ownerReady && checkIn.renterReady;

      if (bothAreReady && checkIn.status === "pending") {
        setBothReady(true);
        handleBothReady(currentCheckInId);
      } else if (
        checkIn.status === "in-progress" ||
        checkIn.status === "completed"
      ) {
        // ✅ NAVEGACIÓN INTELIGENTE: Determinar dónde continuar basado en progreso
        const userRole = isOwner ? "owner" : "renter";
        const userHasSigned = checkIn.signatures?.[userRole];
        const bothSigned =
          checkIn.signatures?.renter && checkIn.signatures?.owner;
        const hasPhotos =
          checkIn.photos && Object.keys(checkIn.photos).length >= 8;
        const hasConditions = checkIn.conditions !== undefined;
        const hasKeys = checkIn.keys !== undefined;

        setBothReady(true);
        hasNavigatedRef.current = true;

        // Desuscribir antes de navegar
        if (checkInUnsubscribeRef.current) {
          checkInUnsubscribeRef.current();
          checkInUnsubscribeRef.current = null;
        }

        // Determinar siguiente pantalla según progreso
        let nextScreen = "CheckInPhotos";

        if (checkIn.status === "completed" && bothSigned) {
          // ✅ Check-in COMPLETAMENTE finalizado (ambos firmaron)
          nextScreen = "CheckInComplete";
          logger.info("Check-in completed, navigating to CheckInComplete");
        } else if (userHasSigned && !bothSigned) {
          // ✅ Usuario ya firmó, pero el otro NO - quedarse en CheckInSignature mostrando espera
          nextScreen = "CheckInSignature";
          logger.info("User signed, waiting for other party");
        } else if (hasPhotos && hasConditions && hasKeys && !userHasSigned) {
          // ✅ Todo listo pero usuario AÚN NO firma
          nextScreen = "CheckInSignature";
          logger.info("Ready for user signature");
        } else if (hasPhotos && hasConditions) {
          // Faltan llaves
          nextScreen = "CheckInKeys";
          logger.info("Need keys handover");
        } else if (hasPhotos) {
          // Faltan condiciones y daños
          nextScreen = "CheckInConditions";
          logger.info("Need conditions check");
        } else {
          // Faltan fotos (inicio del flujo)
          nextScreen = "CheckInPhotos";
          logger.info("Starting from photos");
        }

        // Safely navigate with minimal data to avoid Android crashes with large objects
        try {
          navigation.replace(nextScreen as any, {
            reservation: {
              id: reservation.id,
              vehicleId: reservation.vehicleId,
              userId: reservation.userId,
              arrendadorId: reservation.arrendadorId,
              isDelivery: reservation.isDelivery,
              deliveryAddress: reservation.deliveryAddress,
              deliveryCoordinates: reservation.deliveryCoordinates,
              pickupCoordinates: reservation.pickupCoordinates,
              pickupLocation: reservation.pickupLocation,
              vehicleSnapshot: reservation.vehicleSnapshot,
            },
            checkInId: currentCheckInId,
          });
        } catch (navError: any) {
          logger.error("Navigation error", { error: navError.message });
          Alert.alert(
            "Error",
            "Hubo un problema al continuar. Por favor intenta de nuevo.",
          );
        }
      }
    }
  };

  const initializeCheckIn = async () => {
    try {
      setLoading(true);

      // Validate critical IDs
      if (!freshReservation.userId || !freshReservation.arrendadorId) {
        Alert.alert(
          "Error",
          "Datos de reservación incompletos (Falta ID de usuario/arrendador).",
        );
        setLoading(false);
        return;
      }

      // ✅ PRIMERO: Verificar si la reservación YA tiene un check-in ID (usando freshReservation)
      if (freshReservation.checkIn?.id) {
        setCheckInId(freshReservation.checkIn.id);

        // Suscribirse al check-in existente
        const unsubscribe = subscribeToCheckIn(
          freshReservation.checkIn.id,
          (checkIn) =>
            handleCheckInUpdate(checkIn, freshReservation.checkIn!.id!),
        );
        checkInUnsubscribeRef.current = unsubscribe;
        setLoading(false);
        return;
      }

      // ✅ SEGUNDO: Solo crear/obtener si NO existe
      const newCheckInId = await startCheckIn(
        freshReservation.id,
        freshReservation.vehicleId,
        freshReservation.userId,
        freshReservation.arrendadorId,
      );

      setCheckInId(newCheckInId);

      // Subscribe to real-time updates
      const unsubscribe = subscribeToCheckIn(newCheckInId, (checkIn) =>
        handleCheckInUpdate(checkIn, newCheckInId),
      );

      // Guardar la función de desuscripción
      checkInUnsubscribeRef.current = unsubscribe;
    } catch (error: any) {
      logger.error("Error initializing check-in", { error: error.message });
      Alert.alert("Error", "No se pudo iniciar el proceso de check-in.");
      setInitializing(false); // Stop loading on error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!checkInId) return;

    try {
      setLoading(true);

      // 1. Obtener ubicación actual fresca
      // El usuario solicitó solo tomar las dos ubicaciones sin validación estricta de distancia
      let locationData: any = undefined;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // Forzar alta precisión para asegurar que tenemos el dato real
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          setUserLocation(location.coords);
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 10,
          };
        } else {
          // Si no da permiso, intentamos usar la última conocida o fallamos suave
          console.warn("[CheckInStart] Location permission not granted");
          if (userLocation) {
            locationData = {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              accuracy: 10,
            };
          }
        }
      } catch (locError: any) {
        logger.error("Error refreshing location", { error: locError.message });
        // Si falla obtener, usamos la que tengamos en estado
        if (userLocation) {
          locationData = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            accuracy: 10,
          };
        }
      }

      // Validar que tenemos ubicación
      if (!locationData) {
        Alert.alert(
          "Ubicación necesaria",
          "Para seguridad del proceso, necesitamos registrar tu ubicación al iniciar el check-in. Por favor verifica tus permisos de ubicación.",
        );
        return;
      }

      // 2. Marcar como listo directamente (sin checks de distancia)
      await markParticipantReady(checkInId, user!.uid, isOwner, locationData);
      setIsReady(true);
    } catch (error: any) {
      logger.error("Error marking ready", { error: error.message });
      Alert.alert("Error", "No se pudo confirmar tu disponibilidad.");
    } finally {
      setLoading(false);
    }
  };

  // Función eliminada: performMarkReady (integrada en handleMarkReady)

  const handleBothReady = async (id: string) => {
    // Evitar llamadas múltiples
    if (hasNavigatedRef.current) {
      logger.info("Already handling navigation, skipping");
      return;
    }

    hasNavigatedRef.current = true;
    logger.info("handleBothReady called", { checkInId: id });

    try {
      // Only update if still pending to avoid race conditions
      await updateCheckInStatus(id, "in-progress");
    } catch (error: any) {
      logger.error("Error updating check-in status", { error: error.message });
      // Continue to navigate even if update fails
    }

    // Desuscribir antes de navegar
    if (checkInUnsubscribeRef.current) {
      checkInUnsubscribeRef.current();
      checkInUnsubscribeRef.current = null;
    }

    // Navigate immediately with minimal data (sin setTimeout innecesario)
    try {
      navigation.replace("CheckInPhotos", {
        reservation: {
          id: reservation.id,
          vehicleId: reservation.vehicleId,
          userId: reservation.userId,
          arrendadorId: reservation.arrendadorId,
          isDelivery: reservation.isDelivery,
          deliveryAddress: reservation.deliveryAddress,
          deliveryCoordinates: reservation.deliveryCoordinates,
          pickupCoordinates: reservation.pickupCoordinates,
          pickupLocation: reservation.pickupLocation,
          vehicleSnapshot: reservation.vehicleSnapshot,
        },
        checkInId: id,
      });
    } catch (navError: any) {
      logger.error("Navigation error in handleBothReady", {
        error: navError.message,
      });
      hasNavigatedRef.current = false; // Reset to allow retry
      Alert.alert(
        "Error",
        "Hubo un problema al continuar. Por favor intenta de nuevo.",
      );
    }
  };

  const isWithinRange = distance !== null && distance <= 0.5; // 500 meters

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0B729D" />
        <Text style={{ marginTop: 20, color: "#6B7280" }}>
          Cargando Check-in...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Iniciar Check-in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Vehicle Info */}
        <View style={styles.vehicleCard}>
          <Ionicons name="car-sport" size={32} color="#0B729D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>
              {reservation.vehicleSnapshot?.marca}{" "}
              {reservation.vehicleSnapshot?.modelo}
            </Text>
            <Text style={styles.vehicleYear}>
              {reservation.vehicleSnapshot?.anio}
            </Text>
          </View>
        </View>

        {/* Location Info (Delivery or Pickup) */}
        <View style={styles.locationInfoCard}>
          <View style={styles.locationHeader}>
            <Ionicons
              name={reservation.isDelivery ? "navigate-circle" : "location"}
              size={24}
              color="#0B729D"
            />
            <Text style={styles.locationTitle}>
              {reservation.isDelivery
                ? "Punto de Entrega (Delivery)"
                : "Punto de Recogida"}
            </Text>
          </View>
          <Text style={styles.locationAddress}>
            {reservation.isDelivery
              ? reservation.deliveryAddress
              : reservation.pickupLocation || "Ubicación del vehículo"}
          </Text>
          {reservation.isDelivery && (
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryBadgeText}>
                El anfitrión te entregará el auto aquí
              </Text>
            </View>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {meetingCoordinates ? (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: meetingCoordinates.latitude,
                  longitude: meetingCoordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={false}
                showsMyLocationButton={true}
              >
                {/* Para HOST: Mostrar solo su ubicación y la del viajero */}
                {/* Para VIAJERO: Mostrar punto de encuentro y su ubicación */}

                {/* Tu ubicación */}
                {userLocation && (
                  <Marker
                    coordinate={userLocation}
                    title={
                      isOwner ? "Tú (Anfitrión con Vehículo)" : "Tú (Viajero)"
                    }
                    description={
                      isOwner
                        ? "Tu ubicación es donde está el vehículo"
                        : "Tu ubicación actual"
                    }
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons name="person" size={30} color="#0B729D" />
                    </View>
                  </Marker>
                )}

                {/* Ubicación de la otra parte (en tiempo real) */}
                {otherPartyLocation && (
                  <Marker
                    coordinate={otherPartyLocation}
                    title={isOwner ? "Viajero" : "Anfitrión (Vehículo)"}
                    description={
                      isOwner
                        ? "Ubicación del viajero"
                        : "Ubicación del anfitrión con el vehículo"
                    }
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons
                        name={isOwner ? "walk" : "car"}
                        size={30}
                        color="#16A34A"
                      />
                    </View>
                  </Marker>
                )}

                {/* Círculo de proximidad alrededor del punto de encuentro */}
                {meetingCoordinates && (
                  <Circle
                    center={meetingCoordinates}
                    radius={500}
                    fillColor="rgba(11, 114, 157, 0.1)"
                    strokeColor="rgba(11, 114, 157, 0.5)"
                  />
                )}
              </MapView>
              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={startLocationTracking}
              >
                <Ionicons name="refresh" size={20} color="#0B729D" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerLocationButton}
                onPress={() => {
                  if (userLocation && mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    });
                  } else {
                    Alert.alert(
                      "Ubicación no disponible",
                      "Aún no tenemos tu ubicación actual.",
                    );
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#0B729D" />
              </TouchableOpacity>

              {/* Cómo llegar — opens native navigation app */}
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => {
                  if (!meetingCoordinates) return;
                  const { latitude, longitude } = meetingCoordinates;
                  Alert.alert("Cómo llegar", "¿Con qué app deseas navegar?", [
                    {
                      text: "Google Maps",
                      onPress: () =>
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
                        ),
                    },
                    {
                      text: "Waze",
                      onPress: () =>
                        Linking.openURL(
                          `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
                        ),
                    },
                    { text: "Cancelar", style: "cancel" },
                  ]);
                }}
              >
                <Ionicons name="navigate" size={20} color="#0B729D" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color="#9CA3AF" />
              <Text style={styles.mapPlaceholderText}>
                Ubicación no disponible
              </Text>
            </View>
          )}
        </View>

        {/* Distance info */}
        {distance !== null && (
          <View
            style={[
              styles.distanceCard,
              isWithinRange ? styles.distanceOk : styles.distanceFar,
            ]}
          >
            <Ionicons
              name={isWithinRange ? "checkmark-circle" : "alert-circle"}
              size={24}
              color={isWithinRange ? "#16A34A" : "#DC2626"}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.distanceText,
                  { color: isWithinRange ? "#16A34A" : "#DC2626" },
                ]}
              >
                {isWithinRange
                  ? `Estás cerca del punto de encuentro (${(distance * 1000).toFixed(0)}m)`
                  : `Estás a ${distance.toFixed(2)} km del punto de encuentro`}
              </Text>
              {!isWithinRange && !isOwner && (
                <Text style={styles.distanceSubtext}>
                  Debes estar dentro de 500 metros para iniciar el check-in
                </Text>
              )}
              {!isWithinRange && isOwner && (
                <Text style={styles.distanceSubtext}>
                  Como anfitrión, tu ubicación define el punto de encuentro.
                </Text>
              )}
              {otherPartyLocation && (
                <Text
                  style={[
                    styles.distanceSubtext,
                    { color: "#059669", marginTop: 4 },
                  ]}
                >
                  ✓ {isOwner ? "El viajero" : "El anfitrión"} está en el lugar
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>
            ¿Cómo funciona el Check-in?
          </Text>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              {isOwner
                ? "Como anfitrión, tú defines el punto de encuentro con tu ubicación"
                : "Dirígete al punto de encuentro donde está el anfitrión con el vehículo"}
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Toma 8 fotos del vehículo desde diferentes ángulos
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Completa el checklist de condiciones del vehículo
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>
              Ambos firman digitalmente para confirmar
            </Text>
          </View>
        </View>

        {/* Status cards */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Estado de participantes</Text>

          <View style={[styles.statusCard, isReady && styles.statusCardReady]}>
            <Ionicons
              name={isReady ? "checkmark-circle" : "time-outline"}
              size={32}
              color={isReady ? "#16A34A" : "#F59E0B"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusCardTitle}>
                {isOwner ? "Tú (Anfitrión)" : "Tú (Viajero)"}
              </Text>
              <Text style={styles.statusCardSubtitle}>
                {isReady ? "Listo para empezar" : "Esperando confirmación"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusCard,
              otherPartyReady && styles.statusCardReady,
            ]}
          >
            <Ionicons
              name={otherPartyReady ? "checkmark-circle" : "time-outline"}
              size={32}
              color={otherPartyReady ? "#16A34A" : "#F59E0B"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusCardTitle}>
                {isOwner ? "Viajero" : "Anfitrión"}
              </Text>
              <Text style={styles.statusCardSubtitle}>
                {otherPartyReady
                  ? "Listo para empezar"
                  : "Esperando confirmación"}
              </Text>
            </View>
          </View>
        </View>

        {/* Success message */}
        {bothReady && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            <Text style={styles.successText}>¡Ambos están listos!</Text>
            <Text style={styles.successSubtext}>
              Redirigiendo a tomar fotos...
            </Text>
            <ActivityIndicator
              size="large"
              color="#16A34A"
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom action button */}
      {!bothReady && (
        <View style={styles.bottomBar}>
          {/* Debug button - hidden for production excellence */}
          {/* <TouchableOpacity 
                        style={{ marginBottom: 12, alignItems: 'center', padding: 8 }}
                        onPress={() => {
                            if (checkInId) {
                                navigation.replace('CheckInPhotos', { 
                                    reservation, 
                                    checkInId 
                                });
                            } else {
                                Alert.alert('Espera', 'Inicializando check-in...');
                            }
                        }}
                    >
                        <Text style={{ color: '#6B7280', textDecorationLine: 'underline', fontSize: 14 }}>
                            Saltar validación (Solo prueba)
                        </Text>
                    </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.readyButton,
              isReady && styles.readyButtonDisabled,
              (!locationPermission || (!isOwner && !isWithinRange)) &&
                styles.readyButtonDisabled,
            ]}
            onPress={handleMarkReady}
            disabled={
              isReady ||
              loading ||
              !locationPermission ||
              (!isOwner && !isWithinRange)
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    isReady ? "hourglass-outline" : "checkmark-circle-outline"
                  }
                  size={24}
                  color="#fff"
                />
                <Text style={styles.readyButtonText}>
                  {isReady
                    ? "Esperando a que la otra parte confirme..."
                    : "Estoy listo para empezar"}
                </Text>
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
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleName: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  vehicleYear: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  locationInfoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  locationAddress: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  deliveryBadge: {
    marginTop: 8,
    backgroundColor: "#F0F9FF",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  deliveryBadgeText: {
    fontSize: 12,
    color: "#0B729D",
    fontFamily: "Poppins-SemiBold",
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  mapPlaceholderText: {
    color: "#6B7280",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  distanceOk: {
    backgroundColor: "#DCFCE7",
  },
  distanceFar: {
    backgroundColor: "#FEE2E2",
  },
  distanceText: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  distanceSubtext: {
    fontSize: 13,
    color: "#7F1D1D",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  instructionsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0B729D",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  statusCardReady: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  statusCardTitle: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  statusCardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  successCard: {
    backgroundColor: "#F0FDF4",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  successText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#16A34A",
    marginTop: 12,
  },
  successSubtext: {
    fontSize: 14,
    color: "#166534",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  readyButton: {
    flexDirection: "row",
    backgroundColor: "#0B729D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  readyButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  refreshLocationButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  centerLocationButton: {
    position: "absolute",
    top: 56,
    right: 12,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  directionsButton: {
    position: "absolute",
    top: 100,
    right: 12,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  markerContainer: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#0B729D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
