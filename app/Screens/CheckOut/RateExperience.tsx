import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../FirebaseConfig';
import { useAuth } from '../../context/Auth';

export default function RateExperience() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { reservationId, vehicleId, ownerId } = route.params as { 
        reservationId: string, 
        vehicleId: string, 
        ownerId: string 
    };
    const { user, userData } = useAuth();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRate = (value: number) => {
        setRating(value);
    };

    const handleFinish = () => {
        // Try to go back to the start of the stack (usually HomeArrendatario or ArrendadorStack)
        if (navigation.canGoBack()) {
            navigation.popToTop();
        } else {
            // Fallback if we can't pop (e.g. deep link)
            // If user is Arrendador, they might prefer ArrendadorStack, but since this is a Renter flow,
            // HomeArrendatario is also a valid default.
            // We'll use the role to decide the "Home".
            const target = userData?.role === 'arrendador' ? 'ArrendadorStack' : 'HomeArrendatario';
            
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: target }],
                })
            );
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Calificación requerida', 'Por favor selecciona una calificación de 1 a 5 estrellas.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Review Document
            const reviewData = {
                reservationId,
                vehicleId,
                ownerId,
                authorId: user?.uid,
                authorName: userData?.nombre || 'Usuario',
                rating,
                comment: comment.trim() || '',
                createdAt: serverTimestamp(),
                type: 'vehicle_review',
                visible: true
            };

            const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);

            // 2. Update Vehicle Average Rating using transaction
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            
            await runTransaction(db, async (transaction) => {
                const vehicleDoc = await transaction.get(vehicleRef);
                if (!vehicleDoc.exists()) {
                    console.error('Vehicle not found');
                    return;
                }

                const data = vehicleDoc.data();
                const currentRating = data.rating || 0;
                const currentCount = data.reviewCount || 0;

                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                transaction.update(vehicleRef, {
                    rating: Number(newRating.toFixed(1)),
                    reviewCount: newCount,
                    updatedAt: serverTimestamp()
                });
            });

            Alert.alert(
                '¡Gracias!',
                'Tu opinión ayuda a mejorar la comunidad Rentik.',
                [{ 
                    text: 'Continuar', 
                    onPress: handleFinish
                }]
            );

        } catch (error: any) {
            console.error('Error submitting review:', error);
            
            let errorMessage = 'No se pudo guardar tu calificación. Intenta de nuevo.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'No tienes permiso para enviar esta calificación. Por favor contacta con soporte.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.';
            } else if (error.code === 'not-found') {
                errorMessage = 'El vehículo no fue encontrado. La calificación no se guardó.';
            }
            
            Alert.alert('Error', errorMessage, [
                { text: 'Intentar de nuevo', style: 'default' },
                { text: 'Saltar', style: 'cancel', onPress: handleFinish }
            ]);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        handleFinish();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Califica tu Experiencia</Text>
                            <Text style={styles.subtitle}>
                                ¿Qué tal estuvo el vehículo y la atención del propietario?
                            </Text>
                        </View>

                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity 
                                    key={star} 
                                    onPress={() => handleRate(star)}
                                    style={styles.starButton}
                                >
                                    <Ionicons 
                                        name={star <= rating ? "star" : "star-outline"} 
                                        size={48} 
                                        color="#F59E0B" 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <Text style={styles.ratingLabel}>
                            {rating === 1 && "Malo"}
                            {rating === 2 && "Regular"}
                            {rating === 3 && "Bueno"}
                            {rating === 4 && "Muy Bueno"}
                            {rating === 5 && "Excelente"}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Comentarios (Opcional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe aquí tu opinión..."
                                multiline
                                numberOfLines={4}
                                value={comment}
                                onChangeText={setComment}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity 
                                style={[styles.submitButton, submitting && styles.disabledButton]} 
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Enviar Calificación</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.skipButton} 
                                onPress={handleSkip}
                                disabled={submitting}
                            >
                                <Text style={styles.skipButtonText}>Saltar por ahora</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
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
        fontWeight: '700',
        color: '#F59E0B',
        marginBottom: 40,
        textAlign: 'center',
        height: 28,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        height: 140,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    footer: {
        width: '100%',
        gap: 12,
        paddingTop: 20,
    },
    submitButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    skipButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
});
