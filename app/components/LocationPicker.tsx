import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import {
    fetchPlaceDetailsById,
    fetchPlacesAutocomplete,
} from "../services/places";

interface LocationData {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId: string;
}

interface LocationPickerProps {
  initialLocation?: LocationData;
  onLocationSelected: (location: LocationData) => void;
  title?: string;
  subtitle?: string;
}

export default function LocationPicker({
  initialLocation,
  onLocationSelected,
  title = "Ubicación",
  subtitle = "Busca o selecciona en el mapa",
}: LocationPickerProps) {
  const [query, setQuery] = useState(initialLocation?.address || "");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.coordinates.latitude || 13.69294,
    longitude: initialLocation?.coordinates.longitude || -89.21819,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // REMOVED: marker state is no longer needed with fixed pin approach

  const [selectedPlace, setSelectedPlace] = useState<{
    placeId: string;
    formattedAddress: string;
  } | null>(
    initialLocation
      ? {
          placeId: initialLocation.placeId,
          formattedAddress: initialLocation.address,
        }
      : null,
  );

  const mapRef = useRef<MapView>(null);
  const [isDragging, setIsDragging] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Efecto inicial
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  // Recargar si cambia la ubicación inicial desde fuera
  useEffect(() => {
    if (initialLocation) {
      setRegion((prev) => ({
        ...prev,
        latitude: initialLocation.coordinates.latitude,
        longitude: initialLocation.coordinates.longitude,
      }));
      setQuery(initialLocation.address);
    }
  }, [initialLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Activa la ubicación para encontrar tu dirección actual.",
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      // Actualizar mapa
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005, // Zoom más cercano al obtener ubicación actual
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      // No necesitamos setMarker con el pin fijo

      mapRef.current?.animateToRegion(newRegion, 1000);

      // Reverse geocoding
      await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.log("Error getting location", error);
      Alert.alert("Error", "No pudimos obtener tu ubicación.");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (addressResponse && addressResponse.length > 0) {
        const addr = addressResponse[0];
        // Construir dirección legible
        const formattedAddress = [
          addr.street,
          addr.streetNumber,
          addr.city,
          addr.region,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ");

        setQuery(formattedAddress);

        // Notificar al padre
        onLocationSelected({
          address: formattedAddress,
          coordinates: { latitude, longitude },
          placeId: `custom-${latitude}-${longitude}`, // ID temporal
        });
      }
    } catch (error) {
      console.log("Reverse geocode error", error);
    }
  };

  const onRegionChange = () => {
    if (!isDragging) setIsDragging(true);
  };

  const onRegionChangeComplete = async (newRegion: Region) => {
    setIsDragging(false);
    // Reverse geocode al soltar el mapa (centro)
    await reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const fetchAutocomplete = async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setPredictions([]);
      return;
    }

    try {
      setLoading(true);
      const results = await fetchPlacesAutocomplete(text);
      setPredictions(results);
    } catch (e) {
      console.warn("[LOCATION_PICKER] autocomplete error", e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setLoading(true);
      const result = await fetchPlaceDetailsById(placeId);

      if (!result || !result.geometry?.location) {
        Alert.alert(
          "Error",
          "No se pudieron obtener los detalles de la ubicación.",
        );
        return null;
      }

      // Validar que la dirección sea completa (no solo ciudad/país)
      const addressComponents = result.address_components || [];
      const hasStreet = addressComponents.some(
        (comp: any) =>
          comp.types.includes("street_number") || comp.types.includes("route"),
      );
      const hasLocality = addressComponents.some(
        (comp: any) =>
          comp.types.includes("locality") ||
          comp.types.includes("administrative_area_level_2"),
      );

      // Advertir si la dirección es muy genérica
      if (!hasStreet) {
        Alert.alert(
          "Dirección incompleta",
          "Esta ubicación es muy genérica. Para mejor precisión, selecciona una dirección con calle y número.",
          [
            { text: "Entiendo", style: "cancel" },
            { text: "Continuar igual", onPress: () => {} },
          ],
        );
      }

      // Validar que la ubicación esté en El Salvador (o región configurada)
      const country = addressComponents.find((comp: any) =>
        comp.types.includes("country"),
      );

      if (country && country.short_name !== "SV") {
        const confirmContinue = await new Promise((resolve) => {
          Alert.alert(
            "Ubicación fuera del país",
            `Esta ubicación está en ${country.long_name}. Solo operamos en El Salvador actualmente.`,
            [
              {
                text: "Cancelar",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Continuar", onPress: () => resolve(true) },
            ],
          );
        });

        if (!confirmContinue) {
          setLoading(false);
          return null;
        }
      }

      const { lat, lng } = result.geometry.location;

      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      // setMarker({ latitude: lat, longitude: lng }); // Ya no usamos marker state

      setSelectedPlace({
        placeId,
        formattedAddress: result.formatted_address,
      });

      // Notificar al padre con información completa
      onLocationSelected({
        address: result.formatted_address,
        coordinates: { latitude: lat, longitude: lng },
        placeId,
      });

      return { lat, lng };
    } catch (e) {
      console.warn("[LOCATION_PICKER] details error", e);
      Alert.alert("Error", "No se pudieron obtener los detalles del lugar.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a tu ubicación para esta función.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      // setMarker({ latitude, longitude });

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }

      // Hacer reverse geocoding para obtener la dirección
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (addresses.length > 0) {
          const addr = addresses[0];
          const formattedAddress =
            `${addr.street || ""} ${addr.name || ""}, ${addr.city || ""}, ${addr.region || ""}`.trim();
          setQuery(formattedAddress);

          onLocationSelected({
            address: formattedAddress,
            coordinates: { latitude, longitude },
            placeId: "", // No tenemos placeId con ubicación actual
          });
        }
      } catch (e) {
        console.warn("[LOCATION_PICKER] reverse geocoding error", e);
        setQuery("Mi ubicación actual");

        onLocationSelected({
          address: "Mi ubicación actual",
          coordinates: { latitude, longitude },
          placeId: "",
        });
      }
    } catch (error) {
      console.warn("[LOCATION_PICKER] error getting location", error);
      Alert.alert(
        "Error",
        "No se pudo obtener tu ubicación. Verifica que tengas GPS activado.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrediction = async (p: any) => {
    setQuery(p.description);
    setPredictions([]);

    const coords = await fetchPlaceDetails(p.place_id);

    if (coords && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500,
        );
      }, 100);
    }
  };

  // Removed handleMarkerDragEnd as we use fixed pin now

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar dirección..."
            value={query}
            onChangeText={(text) => {
              setQuery(text);

              if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
              }

              searchTimeout.current = setTimeout(() => {
                fetchAutocomplete(text);
              }, 500);
            }}
            placeholderTextColor="#9CA3AF"
          />
          {loading && <ActivityIndicator size="small" color="#0B729D" />}
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleGetCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="locate" size={20} color="#0B729D" />
        </TouchableOpacity>
      </View>

      {/* Predictions List */}
      {predictions.length > 0 && (
        <ScrollView
          style={styles.predictionsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {predictions.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.predictionItem}
              onPress={() => handleSelectPrediction(p)}
            >
              <Ionicons name="location-outline" size={20} color="#0B729D" />
              <View style={styles.predictionText}>
                <Text style={styles.predictionMain}>
                  {p.structured_formatting?.main_text}
                </Text>
                <Text style={styles.predictionSecondary}>
                  {p.structured_formatting?.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false} // We have a custom button
        />

        {/* Fixed Center Pin Overlay */}
        <View style={styles.fixedPinContainer} pointerEvents="none">
          <Ionicons
            name="location"
            size={42}
            color="#0B729D"
            style={{ marginTop: -42 }}
          />
        </View>

        {/* Loading Overlay when dragging */}
        {isDragging && (
          <View style={styles.draggingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.draggingText}>Ubicando...</Text>
          </View>
        )}

        {/* Helper Text */}
        <View style={styles.mapHelper}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#6B7280"
          />
          <Text style={styles.mapHelperText}>
            Mueve el mapa para ajustar la ubicación
          </Text>
        </View>
      </View>

      {/* Selected Address */}
      {selectedPlace && (
        <View style={styles.selectedAddress}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.selectedAddressText} numberOfLines={2}>
            {selectedPlace.formattedAddress}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  locationButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0B729D",
  },
  predictionsContainer: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 13,
    color: "#6B7280",
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapHelper: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHelperText: {
    fontSize: 12,
    color: "#6B7280",
  },
  selectedAddress: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
    fontWeight: "500",
  },
  fixedPinContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  draggingBadge: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(11, 114, 157, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  draggingText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
