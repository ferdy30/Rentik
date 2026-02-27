import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import React, { useCallback, useEffect, useState } from "react";
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
import { Firebaseauth, storage } from "../../FirebaseConfig";
import { saveCheckInPhotos } from "../../services/checkIn";
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

export default function CheckInPhotos() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservation, checkInId } = route.params as {
    reservation: Reservation;
    checkInId: string;
  };

  const [photos, setPhotos] = useState<PhotosType>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadExistingPhotos = useCallback(async () => {
    try {
      const { getCheckIn } = await import("../../services/checkIn");
      const checkIn = await getCheckIn(checkInId);
      if (checkIn?.photos) {
        setPhotos(checkIn.photos as PhotosType);
        logger.info("Loaded existing photos", {
          count: Object.keys(checkIn.photos).length,
        });
      }
    } catch (error: any) {
      logger.warn("Could not load existing photos", { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [checkInId]);

  // Cargar fotos existentes desde Firestore al montar
  useEffect(() => {
    loadExistingPhotos();
  }, [loadExistingPhotos]);

  // Recargar fotos cuando la pantalla vuelve a tener foco (después de usar la cámara)
  useFocusEffect(
    useCallback(() => {
      loadExistingPhotos();
    }, [loadExistingPhotos]),
  );

  // Recuperar resultado pendiente (Android Activity Killed)
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const recoverLostPhoto = async () => {
      try {
        logger.info("Checking for pending photo result");
        const pendingResult = await ImagePicker.getPendingResultAsync();

        if (
          pendingResult &&
          "assets" in pendingResult &&
          !pendingResult.canceled &&
          pendingResult.assets &&
          pendingResult.assets.length > 0
        ) {
          const slotKey = await AsyncStorage.getItem("currentPhotoSlot");

          if (slotKey) {
            logger.info("Recovering lost photo", { slot: slotKey });
            setUploading(slotKey);

            const photoUri = pendingResult.assets[0].uri;

            try {
              await uploadPhoto(slotKey as keyof PhotosType, photoUri);
              await AsyncStorage.removeItem("currentPhotoSlot");

              Alert.alert(
                "Foto recuperada",
                "Se ha recuperado y subido la foto que tomaste antes del reinicio.",
                [{ text: "OK" }],
              );

              logger.info("Photo recovered successfully");
            } catch (recoverError: any) {
              logger.error("Failed to recover photo", {
                error: recoverError.message,
              });
              await AsyncStorage.removeItem("currentPhotoSlot");

              Alert.alert(
                "Error al recuperar foto",
                "No se pudo subir la foto recuperada. Por favor toma la foto nuevamente.",
                [{ text: "OK" }],
              );
            }
          }
        } else {
          logger.info("No pending photo result found");
        }
      } catch (error: any) {
        logger.error("Error checking pending result", { error: error.message });
        // Limpiar storage en caso de error
        try {
          await AsyncStorage.removeItem("currentPhotoSlot");
        } catch {}
      }
    };

    recoverLostPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar - uploadPhoto no debe estar en dependencias

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
      if (Platform.OS === "android") {
        await AsyncStorage.setItem("currentPhotoSlot", slot.key);
      }

      const mediaTypes: any =
        (ImagePicker as any).MediaType?.Images ?? "images";

      // Configuración optimizada para prevenir crashes en Android
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes,
        allowsEditing: false,
        quality: Platform.OS === "android" ? 0.2 : 0.5, // MUY baja para Android
        allowsMultipleSelection: false,
        exif: false,
        base64: false, // No generar base64 para ahorrar memoria
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;

        // Verificar tamaño antes de procesar (Android)
        if (Platform.OS === "android") {
          try {
            const FileSystem = await import("expo-file-system");
            const fileInfo = await FileSystem.getInfoAsync(photoUri);

            if (fileInfo.exists && fileInfo.size) {
              const sizeMB = fileInfo.size / (1024 * 1024);
              logger.info("Photo captured", { sizeMB: sizeMB.toFixed(2) });

              // Si es mayor a 5MB, alertar (puede causar OOM)
              if (sizeMB > 5) {
                logger.warn("Photo too large", { sizeMB });
                Alert.alert(
                  "Foto muy grande",
                  "La foto es muy grande y puede causar problemas. Se comprimirá automáticamente.",
                  [{ text: "Continuar" }],
                );
              }
            }
          } catch (checkErr) {
            logger.warn("Could not check file size", {
              error: String(checkErr),
            });
          }
        }

        const Haptics = await import("expo-haptics");
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Upload con la URI obtenida
        await uploadPhoto(slot.key, photoUri);

        // Limpiar URI temporal después de procesar (Android)
        if (Platform.OS === "android") {
          try {
            const FileSystem = await import("expo-file-system");
            if (photoUri.startsWith("file://")) {
              await FileSystem.deleteAsync(photoUri, { idempotent: true });
              logger.info("Cleaned up temporary photo file");
            }
          } catch (cleanupError: any) {
            // No crítico si falla la limpieza
            logger.warn("Could not clean temp file", {
              error: cleanupError.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error("Error taking photo", {
        error: error.message,
        slot: slot.key,
      });

      // Mensaje más específico según el error
      let errorMessage = "No se pudo tomar la foto. Intenta de nuevo.";
      if (error.message?.includes("memory")) {
        errorMessage =
          "Memoria insuficiente. Cierra otras apps e intenta de nuevo.";
      } else if (error.message?.includes("Camera")) {
        errorMessage = "Error con la cámara. Verifica que esté disponible.";
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const uploadPhoto = async (key: keyof PhotosType, uri: string) => {
    let uploadTask: any = null;
    try {
      if (!Firebaseauth.currentUser) {
        Alert.alert(
          "Error",
          "No estás autenticado. Por favor inicia sesión nuevamente.",
        );
        return;
      }
      logger.info("Uploading photo", {
        user: Firebaseauth.currentUser.uid,
        slot: key,
      });
      setUploading(key);

      // Comprimir MUY agresivamente para Android para prevenir OOM
      logger.info("Compressing image", { platform: Platform.OS });
      const maxWidth = Platform.OS === "android" ? 800 : 1200; // Reducido de 1024 a 800 para Android
      const compressQuality = Platform.OS === "android" ? 0.4 : 0.7; // Reducido de 0.5 a 0.4

      // Timeout para compresión (prevenir cuelgues)
      const compressionPromise = ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        {
          compress: compressQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Compression timeout")), 15000),
      );

      const manipulatedImage = (await Promise.race([
        compressionPromise,
        timeoutPromise,
      ])) as any;

      logger.info("Image compressed successfully");

      // Fetch the compressed image con timeout
      const fetchPromise = fetch(manipulatedImage.uri);
      const fetchTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 10000),
      );

      const response = (await Promise.race([
        fetchPromise,
        fetchTimeout,
      ])) as Response;
      const blob = await response.blob();
      const sizeKB = blob.size / 1024;
      logger.info("Image size", { sizeKB: sizeKB.toFixed(2) });

      // Verificar tamaño máximo (500KB para Android, 1MB para iOS)
      const maxSizeKB = Platform.OS === "android" ? 500 : 1000;
      if (sizeKB > maxSizeKB) {
        logger.warn("Image too large, recompressing", { sizeKB });
        // Si es muy grande, comprimir más
        const recompressed = await ImageManipulator.manipulateAsync(
          manipulatedImage.uri,
          [{ resize: { width: maxWidth * 0.8 } }],
          {
            compress: 0.3,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );
        const reResponse = await fetch(recompressed.uri);
        const reBlob = await reResponse.blob();
        logger.info("Recompressed size", {
          sizeKB: (reBlob.size / 1024).toFixed(2),
        });

        // Limpiar la primera versión
        if (
          Platform.OS === "android" &&
          manipulatedImage.uri.startsWith("file://")
        ) {
          try {
            const FileSystem = await import("expo-file-system");
            await FileSystem.deleteAsync(manipulatedImage.uri, {
              idempotent: true,
            });
          } catch {}
        }
      }

      // Create storage reference
      const filename = `checkIns/${checkInId}/${key}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload con uploadBytesResumable (más robusto)
      uploadTask = uploadBytesResumable(storageRef, blob);

      // Esperar a que termine con timeout
      await new Promise((resolve, reject) => {
        const uploadTimeout = setTimeout(() => {
          if (uploadTask) uploadTask.cancel();
          reject(new Error("Upload timeout after 30s"));
        }, 30000);

        uploadTask.on(
          "state_changed",
          (snapshot: any) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progress % 25 === 0) {
              logger.info("Upload progress", { progress: progress.toFixed(0) });
            }
          },
          (error: any) => {
            clearTimeout(uploadTimeout);
            reject(error);
          },
          () => {
            clearTimeout(uploadTimeout);
            resolve(true);
          },
        );
      });

      // Get download URL con timeout
      const downloadURL = (await Promise.race([
        getDownloadURL(storageRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Download URL timeout")), 10000),
        ),
      ])) as string;

      logger.info("Photo uploaded successfully", { slot: key });

      // Actualizar state y guardar
      const updatedPhotos = { ...photos, [key]: downloadURL };
      setPhotos(updatedPhotos);
      await saveCheckInPhotos(checkInId, updatedPhotos);

      // Limpiar archivos temporales AGRESIVAMENTE en Android
      if (Platform.OS === "android") {
        try {
          const FileSystem = await import("expo-file-system");

          // Limpiar todas las imágenes temporales
          const filesToClean = [manipulatedImage.uri, uri].filter((path) =>
            path.startsWith("file://"),
          );

          for (const filePath of filesToClean) {
            try {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
            } catch {}
          }

          logger.info("Cleaned temporary files", {
            count: filesToClean.length,
          });

          // Forzar GC si está disponible (ayuda en desarrollo)
          if (__DEV__ && global.gc) {
            setTimeout(() => global.gc?.(), 100);
          }
        } catch (cleanupErr) {
          logger.warn("Cleanup warning", { error: String(cleanupErr) });
        }
      }

      // Pequeño delay para permitir que todo se complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      // Cancelar upload si está en progreso
      if (uploadTask) {
        try {
          uploadTask.cancel();
        } catch {}
      }

      logger.error("Photo upload failed", {
        error: error.message,
        slot: key,
        code: error.code,
      });

      // Manejo de errores mejorado con mensajes específicos
      let errorMessage = "No se pudo subir la foto. Intenta de nuevo.";
      let errorTitle = "Error";

      if (error.message?.includes("timeout")) {
        errorTitle = "Tiempo de espera agotado";
        errorMessage =
          "La subida tomó demasiado tiempo. Verifica tu conexión e intenta de nuevo.";
      } else if (error.code === "storage/unauthorized") {
        errorTitle = "Error de permiso";
        errorMessage =
          "No tienes permiso para subir fotos. Verifica tu sesión.";
      } else if (error.code === "storage/canceled") {
        errorTitle = "Subida cancelada";
        errorMessage = "La subida fue cancelada. Intenta de nuevo.";
      } else if (!navigator.onLine) {
        errorTitle = "Sin conexión";
        errorMessage = "Verifica tu conexión a internet e intenta de nuevo.";
      } else if (
        error.message?.includes("memory") ||
        error.message?.includes("OOM")
      ) {
        errorTitle = "Memoria insuficiente";
        errorMessage =
          "No hay suficiente memoria. Cierra otras apps e intenta de nuevo.";
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: "OK" },
        { text: "Reintentar", onPress: () => uploadPhoto(key, uri) },
      ]);
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
    // Check all photos are taken
    const missingPhotos = PHOTO_SLOTS.filter((slot) => !photos[slot.key]);

    if (missingPhotos.length > 0) {
      Alert.alert(
        "Fotos incompletas",
        `Faltan ${missingPhotos.length} foto(s): ${missingPhotos.map((s) => s.label).join(", ")}`,
        [{ text: "Entendido" }],
      );
      return;
    }

    try {
      setSaving(true);

      // Save photos to Firestore
      await saveCheckInPhotos(checkInId, photos);

      // Navigate to conditions screen with minimal data
      navigation.replace("CheckInConditions", {
        reservation: {
          id: reservation.id,
          vehicleId: reservation.vehicleId,
          userId: reservation.userId,
          arrendadorId: reservation.arrendadorId,
          isDelivery: reservation.isDelivery,
          deliveryAddress: reservation.deliveryAddress,
          vehicleSnapshot: reservation.vehicleSnapshot,
        },
        checkInId,
      });
    } catch (error: any) {
      logger.error("Error saving check-in photos", { error: error.message });
      Alert.alert(
        "Error",
        "No se pudieron guardar las fotos. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const completedCount = Object.keys(photos).length;
  const totalCount = PHOTO_SLOTS.length;
  const progress = (completedCount / totalCount) * 100;

  // Mostrar loader mientras se cargan las fotos existentes
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 16, color: "#757575" }}>
          Cargando fotos...
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
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.headerTitle}>Fotos del Vehículo</Text>
          <Text style={styles.headerSubtitle}>
            Paso 2 de 5 • {completedCount}/{totalCount} fotos
          </Text>
        </View>
      </View>

      {/* Progress bar */}
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
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#0B729D" />
          <Text style={styles.instructionsText}>
            Toma fotos claras de cada parte del vehículo. Estas fotos servirán
            como evidencia del estado actual.
          </Text>
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>
            {reservation.vehicleSnapshot?.marca}{" "}
            {reservation.vehicleSnapshot?.modelo}
          </Text>
          <Text style={styles.vehicleYear}>
            {reservation.vehicleSnapshot?.anio}
          </Text>
        </View>

        {/* Photo grid */}
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

                {/* Photo preview or placeholder */}
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

        {/* Tips section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Consejos para mejores fotos</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Toma las fotos con buena iluminación
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Asegúrate que no estén borrosas</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Captura todo el ángulo solicitado
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              El kilometraje y gasolina deben ser legibles
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            completedCount < totalCount && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={completedCount < totalCount || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                Continuar al checklist
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "500",
  },
  uploadingText: {
    fontSize: 14,
    color: "#0B729D",
    fontWeight: "500",
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
    fontWeight: "600",
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "700",
  },
});
