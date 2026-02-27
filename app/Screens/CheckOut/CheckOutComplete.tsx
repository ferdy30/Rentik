import { Ionicons } from "@expo/vector-icons";
import {
    CommonActions,
    useNavigation,
    useRoute,
} from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../FirebaseConfig";

export default function CheckOutComplete() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservationId } = route.params as {
    checkOutId: string;
    reservationId: string;
  };
  const [reservationData, setReservationData] = useState<any>(null);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const docRef = doc(db, "reservations", reservationId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReservationData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching reservation for rating:", error);
      }
    };
    fetchReservation();
  }, [reservationId]);

  const handleSkip = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "HomeArrendatario" }],
      }),
    );
  };

  const handleRate = () => {
    if (reservationData) {
      navigation.replace("RateExperience", {
        reservationId,
        vehicleId: reservationData.vehicleId,
        ownerId: reservationData.arrendadorId,
      });
    } else {
      // Fallback if data load failed
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "HomeArrendatario" }],
        }),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>

        <Text style={styles.title}>¡Devolución Exitosa!</Text>
        <Text style={styles.subtitle}>
          Has completado el proceso de devolución correctamente.
        </Text>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Ionicons name="key" size={24} color="#0B729D" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Entrega de Llaves</Text>
              <Text style={styles.stepDesc}>
                Por favor entrega las llaves al propietario para finalizar.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Ionicons name="document-text" size={24} color="#0B729D" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Comprobante</Text>
              <Text style={styles.stepDesc}>
                Se ha enviado un resumen de la devolución a tu correo
                electrónico.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleRate}>
          <Text style={styles.buttonText}>Calificar Experiencia</Text>
          <Ionicons
            name="star"
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Omitir por ahora</Text>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FAFAFA",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
    marginLeft: 56,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
  },
  button: {
    backgroundColor: "#0B729D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#0B729D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  skipButtonText: {
    color: "#9E9E9E",
    fontSize: 14,
    fontWeight: "500",
  },
});
