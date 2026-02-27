import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { typography } from "../../constants/typography";
import { Firebaseauth, storage } from "../../FirebaseConfig";
import { saveCheckOutPhotos } from "../../services/checkOut";
import { Reservation } from "../../services/reservations";
import { logger } from "../../utils/logger";

interface PhotoSlot {
  key: keyof PhotosType;
  label: string;
  icon: string;
  description: string;
}

interface PhotosType {
  front?: string;
  left?: string;
  back?: string;
  right?: string;
  interiorFront?: string;
  interiorBack?: string;
  dashboard?: string;
  fuelLevel?: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    key: "front",
    label: "Frente",
    icon: "car-outline",
    description: "Vista frontal completa",
  },
  {
    key: "left",
    label: "Lado izquierdo",
    icon: "car-outline",
    description: "Lado del conductor",
  },
  {
    key: "back",
    label: "Parte trasera",
    icon: "car-outline",
    description: "Vista trasera completa",
  },
  {
    key: "right",
    label: "Lado derecho",
    icon: "car-outline",
    description: "Lado del copiloto",
  },
  {
    key: "interiorFront",
    label: "Interior (delante)",
    icon: "albums-outline",
    description: "Asientos delanteros",
  },
  {
    key: "interiorBack",
    label: "Interior (atrás)",
    icon: "albums-outline",
    description: "Asientos traseros",
  },
  {
    key: "dashboard",
    label: "Tablero/Kilometraje",
    icon: "speedometer-outline",
    description: "Odómetro visible",
  },
  {
    key: "fuelLevel",
    label: "Nivel de gasolina",
    icon: "water-outline",
    description: "Medidor de combustible",
  },
];

export default function CheckOutPhotos() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservation, checkOutId } = route.params as {
    reservation: Reservation;
    checkOutId: string;
  };

  const [photos, setPhotos] = useState<PhotosType>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a la cámara para tomar fotos del vehículo.",
        [{ text: "Entendido" }],
      );
      return false;
    }
    return true;
  };

  const takePhoto = async (slot: PhotoSlot) => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const mediaTypes: any =
        (ImagePicker as any).MediaType?.Images ?? "images";
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(slot.key, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "No se pudo tomar la foto. Intenta de nuevo.");
    }
  };

  const uploadPhoto = async (key: keyof PhotosType, uri: string) => {
    try {
      if (!Firebaseauth.currentUser) {
        Alert.alert(
          "Error",
          "No estás autenticado. Por favor inicia sesión nuevamente.",
        );
        return;
      }
      setUploading(key);

      // Comprimir imagen antes de subir (igual que CheckIn)
      const maxWidth = Platform.OS === "android" ? 1024 : 1200;
      const compressQuality = Platform.OS === "android" ? 0.5 : 0.7;

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        {
          compress: compressQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      // Store in checkOuts folder
      const filename = `checkOuts/${checkOutId}/${key}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setPhotos((prev) => ({ ...prev, [key]: downloadURL }));

      // Limpiar archivos temporales en Android
      if (Platform.OS === "android") {
        try {
          const FileSystem = await import("expo-file-system");
          if (manipulatedImage.uri.startsWith("file://")) {
            await FileSystem.deleteAsync(manipulatedImage.uri, {
              idempotent: true,
            });
          }
          if (uri.startsWith("file://")) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch (_cleanupErr) {
          // Silently fail cleanup
        }
      }
    } catch (error: any) {
      // Manejo de errores mejorado
      if (error.code === "storage/unauthorized") {
        Alert.alert(
          "Error de permiso",
          "No tienes permiso para subir fotos. Verifica tu sesión.",
        );
      } else if (!navigator.onLine) {
        Alert.alert(
          "Sin conexión",
          "Verifica tu conexión a internet e intenta de nuevo.",
        );
      } else {
        Alert.alert("Error", "No se pudo subir la foto. Intenta de nuevo.");
      }
    } finally {
      setUploading(null);
    }
  };

  const retakePhoto = (slot: PhotoSlot) => {
    Alert.alert(
      "Retomar foto",
      `¿Quieres retomar la foto de ${slot.label.toLowerCase()}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Retomar", onPress: () => takePhoto(slot) },
      ],
    );
  };

  const handleContinue = async () => {
    const missingPhotos = PHOTO_SLOTS.filter((slot) => !photos[slot.key]);

    if (missingPhotos.length > 0) {
      Alert.alert(
        "Fotos incompletas",
        `Faltan ${missingPhotos.length} foto(s): ${missingPhotos.map((s) => s.label).join(", ")}. ¿Deseas continuar de todos modos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Continuar sin fotos",
            style: "destructive",
            onPress: () => skipToNextScreen(),
          },
        ],
      );
      return;
    }

    try {
      setSaving(true);
      await saveCheckOutPhotos(checkOutId, photos);
      navigation.navigate("CheckOutConditions", { reservation, checkOutId });
    } catch (error: any) {
      logger.error("Failed to save checkout photos", { error: error.message });
      Alert.alert(
        "Error",
        "No se pudieron guardar las fotos. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const skipToNextScreen = () => {
    // Skip directly to next screen for development
    navigation.navigate("CheckOutConditions", { reservation, checkOutId });
  };

  const completedCount = Object.keys(photos).length;
  const totalCount = PHOTO_SLOTS.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Fotos de Devolución</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount} de {totalCount} completadas
          </Text>
        </View>
        <TouchableOpacity
          onPress={skipToNextScreen}
          style={{
            backgroundColor: "#EF4444",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 10,
              fontFamily: typography.fonts.bold,
            }}
          >
            SKIP
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.instructionsCard}>
          <Ionicons name="camera" size={24} color="#0B729D" />
          <Text style={styles.instructionsText}>
            Es importante documentar el estado final del vehículo para evitar
            cargos injustificados y liberar tu fianza.
          </Text>
        </View>

        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>
            {reservation.vehicleSnapshot?.marca}{" "}
            {reservation.vehicleSnapshot?.modelo}
          </Text>
          <Text style={styles.vehicleYear}>
            {reservation.vehicleSnapshot?.anio}
          </Text>
        </View>

        <View style={styles.photoGrid}>
          {PHOTO_SLOTS.map((slot) => {
            const photoUri = photos[slot.key];
            const isUploading = uploading === slot.key;

            return (
              <View key={slot.key} style={styles.photoCard}>
                <View style={styles.photoHeader}>
                  <View style={styles.photoHeaderLeft}>
                    <Ionicons
                      name={slot.icon as any}
                      size={20}
                      color="#0B729D"
                    />
                    <View>
                      <Text style={styles.photoLabel}>{slot.label}</Text>
                      <Text style={styles.photoDescription}>
                        {slot.description}
                      </Text>
                    </View>
                  </View>
                  {photoUri && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#16A34A"
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={styles.photoPreview}
                  onPress={() =>
                    photoUri ? retakePhoto(slot) : takePhoto(slot)
                  }
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="large" color="#0B729D" />
                      <Text style={styles.uploadingText}>Subiendo...</Text>
                    </View>
                  ) : photoUri ? (
                    <>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                      <View style={styles.retakeOverlay}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.retakeText}>Retomar</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#BDBDBD" />
                      <Text style={styles.placeholderText}>Tomar foto</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📸 Importante</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Asegúrate de que el odómetro sea legible
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Fotografía cualquier daño nuevo si existe
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {completedCount < totalCount && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: "#FEF3C7",
              padding: 10,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="information-circle" size={18} color="#F59E0B" />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: "#92400E",
                fontFamily: typography.fonts.semiBold,
              }}
            >
              Faltan {totalCount - completedCount} fotos. Puedes continuar de
              todas formas.
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
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: "#333333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0B729D",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: typography.fonts.bold,
    color: "#0B729D",
    minWidth: 40,
    textAlign: "right",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
  vehicleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  vehicleName: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: "#333333",
  },
  vehicleYear: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  photoGrid: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  photoLabel: {
    fontSize: 15,
    fontFamily: typography.fonts.semiBold,
    color: "#333333",
  },
  photoDescription: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#757575",
    fontFamily: typography.fonts.medium,
  },
  uploadingText: {
    fontSize: 14,
    color: "#0B729D",
    fontFamily: typography.fonts.medium,
  },
  retakeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retakeText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: typography.fonts.semiBold,
  },
  tipsCard: {
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: typography.fonts.bold,
    color: "#92400E",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: "#92400E",
    marginRight: 8,
    fontFamily: typography.fonts.bold,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
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
    borderTopColor: "#FAFAFA",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#0B729D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
});
