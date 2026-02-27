import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { Vehicle } from "../types/vehicle";
import FirebaseImage from "./FirebaseImage";

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onFavoritePress?: (id: string) => void;
  isFavorite?: boolean;
  style?: any;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onFavoritePress,
  isFavorite = false,
  style,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Optimization: Use useRef for Animated values to persist across re-renders without recreation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const images = useMemo(() => {
    const validImages =
      vehicle.imagenes && vehicle.imagenes.length > 0
        ? vehicle.imagenes.filter((img) => img && img.length > 0)
        : [];
    const result =
      validImages.length > 0
        ? validImages
        : [vehicle.imagen].filter((img) => img && img.length > 0);

    // Fallback a placeholder si no hay imágenes válidas
    return result.length > 0
      ? result
      : ["https://via.placeholder.com/400x300?text=No+Image"];
  }, [vehicle.imagenes, vehicle.imagen]);

  const handleScroll = useCallback((event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setImageIndex(roundIndex);
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
      >
        {/* Image with carousel */}
        <View style={styles.imageContainer}>
          {!imageLoaded && (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car-outline" size={32} color="#D1D5DB" />
            </View>
          )}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ width: "100%", height: "100%" }}
          >
            {images.map((img, index) => (
              <FirebaseImage
                key={index}
                uri={img}
                style={[styles.image, { width: cardWidth || "100%" }]}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
              />
            ))}
          </ScrollView>

          {/* Availability Badge */}
          <View
            style={[
              styles.availabilityBadge,
              { backgroundColor: vehicle.disponible ? "#10B981" : "#EF4444" },
            ]}
          >
            <View style={styles.statusDot} />
            <Text style={styles.availabilityText}>
              {vehicle.disponible ? "Disponible" : "No disponible"}
            </Text>
          </View>

          {/* Favorite button */}
          {onFavoritePress && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => onFavoritePress(vehicle.id)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#EF4444" : "#fff"}
              />
            </TouchableOpacity>
          )}

          {/* Badges */}
          {vehicle.badges && vehicle.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {vehicle.badges.slice(0, 2).map((badge) => (
                <View key={badge} style={[styles.badge, getBadgeStyle(badge)]}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Image dots indicator */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {vehicle.rating >= 4.8 && (
            <View style={styles.topRatedBadge}>
              <Ionicons name="trophy" size={10} color="#F59E0B" />
              <Text style={styles.topRatedText}>Top Rated</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={1}>
            {vehicle.marca} {vehicle.modelo}
          </Text>

          {/* Year and Specs Row */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="calendar-outline" size={13} color="#0B729D" />
              <Text style={styles.specText}>{vehicle.anio}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="settings-outline" size={13} color="#0B729D" />
              <Text style={styles.specText}>
                {vehicle.transmision === "Automático" ? "Auto" : "Manual"}
              </Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="flash-outline" size={13} color="#0B729D" />
              <Text style={styles.specText}>{vehicle.combustible}</Text>
            </View>
          </View>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>
                {(vehicle.rating ?? 0).toFixed(1)}
              </Text>
            </View>
            {vehicle.reviewCount > 0 && (
              <Text style={styles.reviewCount}>
                • {vehicle.reviewCount} reseñas
              </Text>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {vehicle.distanceText ? vehicle.distanceText : vehicle.ubicacion}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Price */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${vehicle.precio}</Text>
              <Text style={styles.priceUnit}>/día</Text>
            </View>
            <View style={styles.verMasButton}>
              <Text style={styles.verMasText}>Ver más</Text>
              <Ionicons name="arrow-forward" size={12} color="#0B729D" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getBadgeStyle = (badge: string) => {
  switch (badge) {
    case "Nuevo":
      return { backgroundColor: "#DBEAFE", borderColor: "#93C5FD" };
    case "Más rentado":
      return { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" };
    case "Descuento":
      return { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" };
    default:
      return { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",

    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  imageContainer: {
    height: 140,
    width: "100%",
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  image: {
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgesContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: -5,
    right: 0,
    flexDirection: "row",
    /* alignItems: 'center', */
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 16,
  },
  content: {
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
  },
  reviewCount: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  year: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    fontWeight: "500",
  },
  featuresRow: {
    display: "none",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 10,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B729D",
  },
  priceUnit: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  imagePlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  availabilityBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
    gap: 4,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  specText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  specDivider: {
    width: 1,
    height: 10,
    backgroundColor: "#E5E7EB",
  },
  topRatedBorder: {
    borderTopWidth: 2,
    borderTopColor: "#FBBF24",
  },
  topRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  topRatedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#F59E0B",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verMasButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: "#F0F9FF",
    borderRadius: 4,
  },
  verMasText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0B729D",
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(VehicleCard, (prevProps, nextProps) => {
  return (
    prevProps.vehicle.id === nextProps.vehicle.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.vehicle.disponible === nextProps.vehicle.disponible &&
    prevProps.vehicle.precio === nextProps.vehicle.precio
  );
});
