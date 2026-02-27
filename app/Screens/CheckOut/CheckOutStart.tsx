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
import { startCheckOut } from "../../services/checkOut";
import { Reservation } from "../../services/reservations";
import { logger } from "../../utils/logger";

export default function CheckOutStart() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { reservation } = route.params as { reservation: Reservation };

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [returnCoordinates, setReturnCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const mapRef = useRef<MapView>(null);

  // Recalculate distance whenever either coordinate changes
  useEffect(() => {
    if (userLocation && returnCoordinates) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        returnCoordinates.latitude,
        returnCoordinates.longitude,
      );
      setDistance(dist);
    }
  }, [userLocation, returnCoordinates]);

  // Fit map to show both markers when both are available
  useEffect(() => {
    if (userLocation && returnCoordinates && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([userLocation, returnCoordinates], {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 400);
    }
  }, [userLocation, returnCoordinates]);

  // Cleanup location subscription on unmount
  useEffect(() => {
    return () => {
      locationSubscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    initializeLocation();
    requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeLocation = async () => {
    // ✅ NUEVA LÓGICA: Usar coordenadas guardadas en la reserva
    let returnPoint = null;

    // 1. Prioridad: Usar returnCoordinates si existe en la reserva
    if (reservation.returnCoordinates) {
      returnPoint = reservation.returnCoordinates;
      logger.info("Using returnCoordinates for checkout", {
        coordinates: returnPoint,
      });
    }
    // 2. Fallback: En modo delivery, el retorno es al mismo lugar de entrega
    else if (reservation.isDelivery) {
      returnPoint =
        reservation.deliveryCoordinates ||
        reservation.deliveryCoords ||
        reservation.pickupCoordinates;

      if (returnPoint) {
        logger.info("Using delivery coordinates for return", {
          coordinates: returnPoint,
          source: reservation.deliveryCoordinates
            ? "deliveryCoordinates"
            : reservation.deliveryCoords
              ? "deliveryCoords"
              : "pickupCoordinates",
        });
      }
    }
    // 3. Si fue pickup normal, retornar al mismo lugar
    else if (reservation.pickupCoordinates) {
      returnPoint = reservation.pickupCoordinates;
      logger.info("Using pickup coordinates for return", {
        coordinates: returnPoint,
      });
    }

    // 4. Último recurso: buscar coordenadas del vehículo (solo para reservas antiguas)
    else {
      logger.warn("No coordinates in reservation, fetching from vehicle");
      try {
        const vehicleDoc = await getDoc(
          doc(db, "vehicles", reservation.vehicleId),
        );
        if (vehicleDoc.exists()) {
          const data = vehicleDoc.data();
          if (data.coordinates) {
            returnPoint = data.coordinates;
            logger.info("Using vehicle coordinates as fallback", {
              coordinates: returnPoint,
            });
          }
        }
      } catch (error: any) {
        logger.error("Error fetching vehicle location", {
          error: error.message,
        });
      }
    }

    if (returnPoint) {
      setReturnCoordinates(returnPoint);
    } else {
      logger.error("Could not determine return point");
      Alert.alert(
        "Error de ubicación",
        "No se pudo determinar el punto de devolución. Por favor contacta con el host.",
        [{ text: "Entendido" }],
      );
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        startLocationTracking();
      } else {
        Alert.alert(
          "Permiso de ubicación requerido",
          "Necesitamos tu ubicación para verificar que estás en el punto de devolución.",
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

  const openLocationSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:").catch(() =>
        Linking.openURL("App-prefs:Privacy&path=LOCATION"),
      );
    } else {
      Linking.openSettings();
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get an initial position quickly
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      // Then watch continuously
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
      locationSubscriptionRef.current = sub;
    } catch (error: any) {
      logger.error("Error starting location tracking", {
        error: error.message,
      });

      const isGpsOff =
        error.code === "ERR_LOCATION_SETTINGS_UNSATISFIED" ||
        error.message?.includes("GPS") ||
        error.message?.includes("location settings");

      if (isGpsOff && Platform.OS === "android") {
        Alert.alert(
          "GPS desactivado",
          "Activa el GPS para registrar tu ubicación.",
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

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleStartReturn = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Start check-out process in Firestore
      const checkOutId = await startCheckOut(
        reservation.id,
        reservation.vehicleId,
        user.uid,
        reservation.arrendadorId,
      );

      // Navigate to photos
      navigation.replace("CheckOutPhotos", {
        reservation,
        checkOutId,
      });
    } catch (error: any) {
      logger.error("Error starting check-out", { error: error.message });
      Alert.alert("Error", "No se pudo iniciar el proceso. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const isWithinRange = distance !== null && distance <= 0.5; // 500 meters

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#EFF6FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="car-sport" size={24} color="#0B729D" />
            </View>
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
        </View>

        <View style={styles.infoCard}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#FEF3C7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="flag" size={28} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Punto de Devolución</Text>
            <Text style={styles.cardText}>
              Dirígete al punto acordado para iniciar la devolución del vehículo
            </Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {returnCoordinates ? (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: returnCoordinates.latitude,
                  longitude: returnCoordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsMyLocationButton={false}
              >
                {/* Return point marker */}
                <Marker
                  coordinate={returnCoordinates}
                  title="Punto de Devolución"
                >
                  <View style={styles.markerReturn}>
                    <Ionicons name="flag" size={22} color="#DC2626" />
                  </View>
                </Marker>

                <Circle
                  center={returnCoordinates}
                  radius={500}
                  fillColor="rgba(220, 38, 38, 0.1)"
                  strokeColor="rgba(220, 38, 38, 0.5)"
                />

                {/* User location marker */}
                {userLocation && (
                  <Marker coordinate={userLocation} title="Tú">
                    <View style={styles.markerUser}>
                      <Ionicons name="person" size={20} color="#0B729D" />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Refresh location */}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={startLocationTracking}
              >
                <Ionicons name="refresh" size={20} color="#0B729D" />
              </TouchableOpacity>

              {/* Center on user */}
              <TouchableOpacity
                style={[styles.mapButton, { top: 56 }]}
                onPress={() => {
                  if (userLocation) {
                    mapRef.current?.animateToRegion({
                      ...userLocation,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    });
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#0B729D" />
              </TouchableOpacity>

              {/* Cómo llegar */}
              <TouchableOpacity
                style={[styles.mapButton, { top: 100 }]}
                onPress={() => {
                  const { latitude, longitude } = returnCoordinates;
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
              <Ionicons name="map-outline" size={40} color="#9CA3AF" />
              <Text style={styles.mapPlaceholderText}>
                Cargando ubicación...
              </Text>
            </View>
          )}
        </View>

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
            <Text
              style={[
                styles.distanceText,
                { color: isWithinRange ? "#16A34A" : "#DC2626" },
              ]}
            >
              {isWithinRange
                ? "Estás en el punto de devolución"
                : `Estás a ${distance.toFixed(2)} km del punto de entrega`}
            </Text>
          </View>
        )}

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>📋 Proceso de Devolución</Text>

          <View style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Ubicación</Text>
              <Text style={styles.stepDesc}>
                Estaciona en un lugar seguro cerca del punto acordado
              </Text>
            </View>
            <Ionicons name="location" size={20} color="#6B7280" />
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Fotografías</Text>
              <Text style={styles.stepDesc}>
                Documenta el estado final del vehículo
              </Text>
            </View>
            <Ionicons name="camera" size={20} color="#6B7280" />
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Condiciones</Text>
              <Text style={styles.stepDesc}>
                Reporta nivel de combustible y kilometraje
              </Text>
            </View>
            <Ionicons name="speedometer" size={20} color="#6B7280" />
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>4</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Finalización</Text>
              <Text style={styles.stepDesc}>
                Entrega las llaves al propietario
              </Text>
            </View>
            <Ionicons name="key" size={20} color="#6B7280" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartReturn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flag" size={20} color="#fff" />
              <Text style={styles.buttonText}>Comenzar Devolución</Text>
            </>
          )}
        </TouchableOpacity>

        {!isWithinRange && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={18} color="#F59E0B" />
            <Text style={styles.warningText}>
              Estás lejos del punto. Puedes continuar de todas formas.
            </Text>
          </View>
        )}
      </View>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: "#6B7280",
  },
  mapButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  markerReturn: {
    backgroundColor: "#FEE2E2",
    padding: 8,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#DC2626",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerUser: {
    backgroundColor: "#EFF6FF",
    padding: 8,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#0B729D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  distanceOk: {
    backgroundColor: "#D1FAE5",
  },
  distanceFar: {
    backgroundColor: "#FEE2E2",
  },
  distanceText: {
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  vehicleName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  vehicleYear: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  stepsCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#93C5FD",
  },
  stepNum: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B729D",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 18,
    marginLeft: 58,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    backgroundColor: "#0B729D",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#0B729D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
    fontWeight: "600",
    lineHeight: 20,
  },
});
