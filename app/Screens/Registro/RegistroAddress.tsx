import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LocationPicker from "../../components/LocationPicker";
import { colors } from "../../constants/colors";

// Paso adicional: Dirección (con mapa estándar)
export default function RegistroAddress({ route, navigation }: any) {
  const prevData = route.params || {};
  const [addressData, setAddressData] = useState<any>(null);

  const handleLocationSelected = (data: any) => {
    setAddressData(data);
  };

  const handleConfirm = () => {
    if (!addressData) {
      Alert.alert(
        "Dirección requerida",
        "Por favor selecciona tu dirección para continuar.",
      );
      return;
    }

    const address = {
      formatted: addressData.address,
      placeId: addressData.placeId,
      location: addressData.coordinates,
      // Usamos la dirección completa como primera línea si no tenemos desglose detallado
      line1: addressData.address,
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    };

    // Navegar al siguiente paso
    navigation.navigate("RegistroStep3", {
      ...prevData,
      address,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Paso 2 de 3</Text>
            <Ionicons
              name="location-outline"
              size={48}
              color={colors.primary}
              style={{ marginVertical: 8 }}
            />
            <Text style={styles.title}>Tu Dirección</Text>
            <Text style={styles.subtitle}>Para validar tu identidad</Text>
          </View>

          {/* Location Picker Component Reutilizable */}
          <View style={styles.pickerContainer}>
            <LocationPicker
              title="Busca tu dirección"
              subtitle="Usa el mapa o el buscador"
              onLocationSelected={handleLocationSelected}
            />
          </View>

          <View style={styles.footerSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !addressData && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!addressData}
          >
            <Text style={styles.primaryText}>Confirmar Dirección</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  progressDotDone: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  progressLineDone: {
    backgroundColor: colors.primary,
  },
  stepText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
  },
  pickerContainer: {
    flex: 1,
    minHeight: 400,
  },
  footerSpacer: {
    height: 100,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
