import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SignatureScreen from "react-native-signature-canvas";
import { useAuth } from "../../context/Auth";
import {
    CheckInReport,
    saveCheckInSignatures,
    subscribeToCheckIn,
    updateCheckInStatus,
} from "../../services/checkIn";
import { Reservation } from "../../services/reservations";
import { logger } from "../../utils/logger";

export default function CheckInSignature() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { reservation, checkInId } = route.params as {
    reservation: Reservation;
    checkInId: string;
  };

  const [checkIn, setCheckIn] = useState<CheckInReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const ref = useRef<any>(null);

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
      logger.info("CheckInSignature listener cleanup");
    };
  }, [checkInId]);

  const handleSignature = async (signature: string) => {
    if (!user || !checkIn) return;

    setSaving(true);
    try {
      const isRenter = user.uid === checkIn.renterId;
      const userType = isRenter ? "renter" : "owner";

      logger.info("Saving signature", { userType, checkInId });

      const newSignatures = {
        ...checkIn.signatures,
        [userType]: signature,
      };

      await saveCheckInSignatures(checkInId, newSignatures);
      logger.info("Signature saved successfully");

      // Check if both parties have signed (Logic updated)
      const bothSigned = newSignatures.renter && newSignatures.owner;
      logger.info("Both signed check", { bothSigned });

      if (bothSigned) {
        logger.info("Both parties signed - completing check-in", { checkInId });
        // Mark check-in as completed (this now also updates reservation.status to 'in-progress')
        await updateCheckInStatus(checkInId, "completed");
        logger.info("Check-in status updated to completed");
      } else {
        logger.info("Waiting for other party to sign");
      }

      // Navegar al resumen de Check-in primero (pantalla de confirmación)
      logger.info("Navigating to CheckInComplete");
      navigation.replace("CheckInComplete", { 
        reservation: {
          id: reservation.id,
          vehicleId: reservation.vehicleId,
          userId: reservation.userId,
          arrendadorId: reservation.arrendadorId,
          vehicleSnapshot: reservation.vehicleSnapshot,
        },
        checkInId 
      });
    } catch (error: any) {
      logger.error("Error saving signature", { error: error.message });
      Alert.alert("Error", "No se pudo guardar la firma.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B729D" />
      </View>
    );
  }

  const isRenter = user?.uid === checkIn?.renterId;
  const roleName = isRenter ? "Viajero" : "Anfitrión";
  const alreadySigned = isRenter
    ? checkIn?.signatures?.renter
    : checkIn?.signatures?.owner;

  if (alreadySigned) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.successTitle}>¡Firma Registrada!</Text>
          <Text style={styles.successText}>Ya has firmado este check-in.</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() =>
              navigation.replace("CheckInComplete", { reservation, checkInId })
            }
          >
            <Text style={styles.continueButtonText}>Ver Resumen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Firma de Conformidad</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Por favor firma a continuación para confirmar que has revisado el
          estado del vehículo y aceptas las condiciones reportadas.
        </Text>

        <View style={styles.signatureBox}>
          <SignatureScreen
            ref={ref}
            onOK={handleSignature}
            webStyle={`
                            .m-signature-pad { box-shadow: none; border: none; } 
                            .m-signature-pad--body { border: none; }
                            .m-signature-pad--footer { display: none; margin: 0px; }
                            body,html { width: 100%; height: 100%; }
                        `}
            backgroundColor="#F5F5F5"
            penColor="#000000"
          />
        </View>

        <Text style={styles.signerLabel}>Firmando como: {roleName}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Borrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, saving && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Firma</Text>
          )}
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 20,
    lineHeight: 20,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  signerLabel: {
    textAlign: "center",
    color: "#757575",
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#424242",
    fontWeight: "700",
    fontSize: 16,
  },
  confirmButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#0B729D",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: "#0B729D",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
