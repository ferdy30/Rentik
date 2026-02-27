import { Ionicons } from "@expo/vector-icons";
import {
    CommonActions,
    useNavigation,
    useRoute,
} from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../FirebaseConfig";
import { CheckInReport, subscribeToCheckIn } from "../../services/checkIn";
import { Reservation } from "../../services/reservations";
import { logger } from "../../utils/logger";

export default function CheckInComplete() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservation, checkInId } = route.params as {
    reservation: Reservation;
    checkInId: string;
  };
  const [checkIn, setCheckIn] = useState<CheckInReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const autoRedirectRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRedirectActive, setAutoRedirectActive] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToCheckIn(checkInId, (data) => {
      if (isMounted) {
        setCheckIn(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
      logger.info("CheckInComplete listener cleanup");
    };
  }, [checkInId]);

  const generatePdf = async () => {
    if (!checkIn) return;

    setGeneratingPdf(true);
    try {
      const html = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica, sans-serif; padding: 20px; }
                        h1 { color: #0B729D; }
                        .section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .label { font-weight: bold; color: #555; }
                        .damage-item { background: #f9f9f9; padding: 10px; margin-bottom: 5px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h1>Reporte de Check-in - Rentik</h1>
                    <div class="section">
                        <div class="row"><span class="label">Reserva ID:</span> <span>${reservation.id}</span></div>
                        <div class="row"><span class="label">Vehículo:</span> <span>${reservation.vehicleSnapshot?.marca} ${reservation.vehicleSnapshot?.modelo}</span></div>
                        <div class="row"><span class="label">Fecha:</span> <span>${new Date().toLocaleDateString()}</span></div>
                    </div>

                    <div class="section">
                        <h2>Condiciones</h2>
                        <div class="row"><span class="label">Odómetro:</span> <span>${checkIn.conditions?.odometer} km</span></div>
                        <div class="row"><span class="label">Combustible:</span> <span>${checkIn.conditions?.fuelLevel}%</span></div>
                        <div class="row"><span class="label">Limpieza Ext:</span> <span>${checkIn.conditions?.exteriorCleanliness}/5</span></div>
                        <div class="row"><span class="label">Limpieza Int:</span> <span>${checkIn.conditions?.interiorCleanliness}/5</span></div>
                    </div>

                    <div class="section">
                        <h2>Daños Reportados (${checkIn.damages.length})</h2>
                        ${checkIn.damages
                          .map(
                            (d) => `
                            <div class="damage-item">
                                <div><strong>${d.location}</strong> - ${d.type} (${d.severity})</div>
                                <div>${d.notes}</div>
                            </div>
                        `,
                          )
                          .join("")}
                        ${checkIn.damages.length === 0 ? "<div>Sin daños reportados</div>" : ""}
                    </div>

                    <div class="section">
                        <h2>Firmas</h2>
                        <div class="row"><span class="label">Arrendatario:</span> <span>${checkIn.signatures?.renter ? "Firmado" : "Pendiente"}</span></div>
                        <div class="row"><span class="label">Arrendador:</span> <span>${checkIn.signatures?.owner ? "Firmado" : "Pendiente"}</span></div>
                    </div>
                </body>
                </html>
            `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const bothSigned = !!(
    checkIn?.signatures?.renter && checkIn?.signatures?.owner
  );

  /** Navigate to TripDetails with fresh reservation data, resetting the stack
   * so the user can freely go back to Home. */
  const navigateToTrip = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "reservations", reservation.id));
      const freshReservation = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as Reservation)
        : reservation;
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: "HomeArrendatario" },
            { name: "TripDetails", params: { reservation: freshReservation } },
          ],
        }),
      );
    } catch {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: "HomeArrendatario" },
            { name: "TripDetails", params: { reservation } },
          ],
        }),
      );
    }
  }, [navigation, reservation]);

  const handleFinish = () => {
    setAutoRedirectActive(false);
    // Always go to TripDetails so the user sees the trip / check-in state clearly
    navigateToTrip();
  };

  // Auto-redirigir solo cuando ambos firmaron (check-in fully complete)
  useEffect(() => {
    if (
      !loading &&
      checkIn &&
      autoRedirectActive &&
      !generatingPdf &&
      bothSigned
    ) {
      if (autoRedirectRef.current) {
        clearTimeout(autoRedirectRef.current);
        autoRedirectRef.current = null;
      }
      autoRedirectRef.current = setTimeout(() => {
        navigateToTrip();
      }, 5000);
    }
    return () => {
      if (autoRedirectRef.current) {
        clearTimeout(autoRedirectRef.current);
        autoRedirectRef.current = null;
        console.log("[CheckInComplete] 🧹 Auto-redirect timer cleared");
      }
    };
  }, [
    loading,
    checkIn,
    autoRedirectActive,
    generatingPdf,
    bothSigned,
    navigateToTrip,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B729D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={bothSigned ? "checkmark-done-circle" : "time-outline"}
            size={80}
            color={bothSigned ? "#10B981" : "#F59E0B"}
          />
        </View>

        <Text style={styles.title}>
          {bothSigned ? "¡Check-in Completado!" : "¡Firma guardada!"}
        </Text>
        <Text style={styles.subtitle}>
          {bothSigned
            ? "El proceso de entrega del vehículo ha sido registrado exitosamente."
            : "Tu firma fue guardada. Esperando que el anfitrión también firme para completar el check-in."}
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fotos tomadas</Text>
            <Text style={styles.summaryValue}>
              {Object.keys(checkIn?.photos || {}).length}/8
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Daños reportados</Text>
            <Text style={styles.summaryValue}>
              {checkIn?.damages?.length || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Firmas</Text>
            <View style={styles.signaturesRow}>
              <Ionicons
                name={
                  checkIn?.signatures?.renter
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={20}
                color={checkIn?.signatures?.renter ? "#10B981" : "#9CA3AF"}
              />
              <Ionicons
                name={
                  checkIn?.signatures?.owner
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={20}
                color={checkIn?.signatures?.owner ? "#10B981" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => {
            setAutoRedirectActive(false); // detener auto redirect mientras genera
            generatePdf();
          }}
          disabled={generatingPdf}
        >
          {generatingPdf ? (
            <ActivityIndicator color="#0B729D" />
          ) : (
            <>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#0B729D"
              />
              <Text style={styles.pdfButtonText}>Descargar Resumen PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>
            {bothSigned ? "Ver mi viaje" : "Volver a mis viajes"}
          </Text>
        </TouchableOpacity>
        {bothSigned && autoRedirectActive && !generatingPdf && (
          <Text style={styles.autoNote}>
            Serás redirigido a tu viaje en unos segundos...
          </Text>
        )}
        {!bothSigned && (
          <Text style={styles.autoNote}>
            El check-in se completará cuando el anfitrión también firme.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    alignItems: "center",
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  autoNote: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#374151",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  signaturesRow: {
    flexDirection: "row",
    gap: 8,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    width: "100%",
    justifyContent: "center",
  },
  pdfButtonText: {
    color: "#0B729D",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  finishButton: {
    backgroundColor: "#0B729D",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
