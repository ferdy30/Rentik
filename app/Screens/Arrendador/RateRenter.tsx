import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../FirebaseConfig";
import { useAuth } from "../../context/Auth";

export default function RateRenter() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { reservation, renterName } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const ratingLabels = [
    "",
    "Muy malo",
    "Malo",
    "Regular",
    "Bueno",
    "Excelente",
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Calificación requerida",
        "Por favor selecciona una calificación",
      );
      return;
    }

    setLoading(true);
    try {
      // Create review for the renter (deterministic ID prevents duplicates)
      const reviewRef = doc(db, "reviews", `${reservation.id}_host_to_renter`);

      // Guard: check if review already exists before transaction
      const existing = await getDoc(reviewRef);
      if (existing.exists()) {
        Alert.alert(
          "Ya calificaste",
          "Ya enviaste una calificación para este arrendatario.",
          [{ text: "OK", onPress: () => navigation.navigate("Reservas") }],
        );
        return;
      }

      // reservation.userId is the renter's UID
      const renterId = reservation.userId;
      await runTransaction(db, async (transaction) => {
        // Double-check inside transaction (avoid race conditions)
        const existingInTx = await transaction.get(reviewRef);
        if (existingInTx.exists()) {
          throw Object.assign(new Error("already_reviewed"), {
            code: "already_reviewed",
          });
        }

        // Get renter profile
        const renterRef = doc(db, "users", renterId);
        const renterDoc = await transaction.get(renterRef);

        if (!renterDoc.exists()) {
          throw new Error("El arrendatario no fue encontrado");
        }

        const currentRating = renterDoc.data()?.rating || 0;
        const reviewCount = renterDoc.data()?.reviewCount || 0;
        const newReviewCount = reviewCount + 1;
        const newRating =
          (currentRating * reviewCount + rating) / newReviewCount;

        // Create review document
        transaction.set(reviewRef, {
          reservationId: reservation.id,
          vehicleId: reservation.vehicleId,
          renterId,
          hostId: user?.uid,
          authorId: user?.uid,
          authorName: user?.displayName || "Anfitrión",
          rating,
          comment: comment.trim(),
          createdAt: serverTimestamp(),
          type: "host_to_renter",
          visible: true,
        });

        // Update renter's rating
        transaction.update(renterRef, {
          rating: Number(newRating.toFixed(1)),
          reviewCount: newReviewCount,
        });
      });

      Alert.alert(
        "Calificación enviada",
        "Gracias por calificar a tu arrendatario",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Reservas"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Error submitting rating:", error);

      // Handle specific Firebase errors
      if (error.code === "already_reviewed") {
        Alert.alert(
          "Ya calificaste",
          "Ya enviaste una calificación para este arrendatario.",
          [{ text: "OK", onPress: () => navigation.navigate("Reservas") }],
        );
      } else if (error.code === "permission-denied") {
        Alert.alert(
          "Error de permisos",
          "No tienes permiso para calificar a este arrendatario. Por favor verifica que la reserva te pertenece.",
          [
            { text: "Reintentar", onPress: handleSubmit },
            { text: "Saltar", onPress: () => navigation.navigate("Reservas") },
          ],
        );
      } else if (error.code === "unavailable") {
        Alert.alert(
          "Sin conexión",
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
          [
            { text: "Reintentar", onPress: handleSubmit },
            { text: "Saltar", onPress: () => navigation.navigate("Reservas") },
          ],
        );
      } else if (error.code === "not-found") {
        Alert.alert("Error", "El arrendatario no fue encontrado.", [
          { text: "OK", onPress: () => navigation.navigate("Reservas") },
        ]);
      } else {
        Alert.alert(
          "Error",
          "Hubo un problema al enviar tu calificación. Intenta nuevamente.",
          [
            { text: "Reintentar", onPress: handleSubmit },
            { text: "Saltar", onPress: () => navigation.navigate("Reservas") },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert("Saltar calificación", "¿Deseas calificar más tarde?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Saltar", onPress: () => navigation.navigate("Reservas") },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            ¿Cómo fue tu experiencia con {renterName || "el arrendatario"}?
          </Text>
          <Text style={styles.subtitle}>
            Tu calificación ayuda a otros propietarios
          </Text>
        </View>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={48}
                color={star <= rating ? "#F59E0B" : "#D1D5DB"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>
          {rating > 0 ? ratingLabels[rating] : ""}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Cuéntanos más (opcional)</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="¿Qué tal fue su comportamiento? ¿Dejó el vehículo en buen estado?"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, rating === 0 && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={rating === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Calificación</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Saltar por ahora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F59E0B",
    marginBottom: 40,
    textAlign: "center",
    height: 28,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    height: 140,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  footer: {
    width: "100%",
    gap: 12,
    paddingTop: 20,
  },
  submitButton: {
    backgroundColor: "#0B729D",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0B729D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
});
