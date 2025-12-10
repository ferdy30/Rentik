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
import { db } from '../../../FirebaseConfig';
import { useAuth } from '../../../context/Auth';
import { typography } from '../../constants/typography';

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
                rating,
                comment,
                createdAt: serverTimestamp(),
                type: 'vehicle_review'
            };

            await addDoc(collection(db, 'reviews'), reviewData);

            // 2. Update Vehicle Average Rating (Client-side aggregation for now)
            // Ideally this should be a Cloud Function to avoid concurrency issues
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            
            await runTransaction(db, async (transaction) => {
                const vehicleDoc = await transaction.get(vehicleRef);
                if (!vehicleDoc.exists()) return;

                const data = vehicleDoc.data();
                const currentRating = data.rating || 0;
                const currentCount = data.reviewCount || 0;

                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                transaction.update(vehicleRef, {
                    rating: newRating,
                    reviewCount: newCount
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

        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Error', 'No se pudo guardar tu calificación. Intenta de nuevo.');
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
        backgroundColor: '#fff',
    },
    content: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontFamily: typography.fonts.bold,
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    starButton: {
        padding: 4,
    },
    ratingLabel: {
        fontSize: 18,
        fontFamily: typography.fonts.semiBold,
        color: '#F59E0B',
        marginBottom: 40,
        height: 24,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        height: 120,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },
    footer: {
        width: '100%',
        gap: 16,
    },
    submitButton: {
        backgroundColor: '#0B729D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: typography.fonts.bold,
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontFamily: typography.fonts.medium,
    },
});
