import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ONBOARDING_KEY = '@rentik_add_vehicle_onboarding';

interface OnboardingStep {
	title: string;
	message: string;
	icon: keyof typeof Ionicons.glyphMap;
	position?: 'top' | 'center' | 'bottom';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		title: '¡Bienvenido!',
		message: 'Te guiaremos paso a paso para publicar tu vehículo. Toma solo 5 minutos.',
		icon: 'hand-right',
		position: 'center',
	},
	{
		title: 'Información Básica',
		message: 'Primero ingresa los datos principales de tu vehículo. Usa el autocompletado para mayor rapidez.',
		icon: 'car-sport',
		position: 'top',
	},
	{
		title: 'Características',
		message: 'Selecciona todas las características que tenga tu auto. ¡Más detalles = más rentas!',
		icon: 'checkmark-circle',
		position: 'top',
	},
	{
		title: 'Fotos Profesionales',
		message: 'Sube fotos claras con buena iluminación. Los autos con buenas fotos se rentan 3x más rápido.',
		icon: 'camera',
		position: 'top',
	},
	{
		title: 'Precio Inteligente',
		message: 'Usa nuestro calculador automático para fijar el mejor precio según tu vehículo.',
		icon: 'calculator',
		position: 'top',
	},
	{
		title: 'Borrador Automático',
		message: 'No te preocupes, guardamos tu progreso automáticamente. Puedes continuar después.',
		icon: 'save',
		position: 'bottom',
	},
];

interface OnboardingModalProps {
	step: number;
	onComplete: () => void;
	visible: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
	step,
	onComplete,
	visible,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const fadeAnim = useState(new Animated.Value(0))[0];
	const scaleAnim = useState(new Animated.Value(0.8))[0];

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					friction: 8,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, currentStep, fadeAnim, scaleAnim]);

	if (!visible || currentStep >= ONBOARDING_STEPS.length) return null;

	const stepData = ONBOARDING_STEPS[currentStep];

	const handleNext = () => {
		if (currentStep < ONBOARDING_STEPS.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onComplete();
		}
	};

	const handleSkip = () => {
		onComplete();
	};

	return (
		<Modal visible={visible} transparent animationType="none">
			<View style={styles.overlay}>
				<Animated.View
					style={[
						styles.container,
						stepData.position === 'top' && styles.containerTop,
						stepData.position === 'bottom' && styles.containerBottom,
						{
							opacity: fadeAnim,
							transform: [{ scale: scaleAnim }],
						},
					]}
				>
					<View style={styles.iconContainer}>
						<View style={styles.iconCircle}>
							<Ionicons name={stepData.icon} size={40} color="#0B729D" />
						</View>
					</View>

					<Text style={styles.title}>{stepData.title}</Text>
					<Text style={styles.message}>{stepData.message}</Text>

					<View style={styles.footer}>
						<View style={styles.dotsContainer}>
							{ONBOARDING_STEPS.map((_, index) => (
								<View
									key={index}
									style={[
										styles.dot,
										index === currentStep && styles.dotActive,
									]}
								/>
							))}
						</View>

						<View style={styles.buttonsContainer}>
							{currentStep < ONBOARDING_STEPS.length - 1 && (
								<TouchableOpacity
									style={styles.skipButton}
									onPress={handleSkip}
								>
									<Text style={styles.skipText}>Omitir</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={styles.nextButton}
								onPress={handleNext}
							>
								<Text style={styles.nextText}>
									{currentStep < ONBOARDING_STEPS.length - 1
										? 'Siguiente'
										: 'Entendido'}
								</Text>
								<Ionicons
									name={
										currentStep < ONBOARDING_STEPS.length - 1
											? 'arrow-forward'
											: 'checkmark'
									}
									size={20}
									color="white"
								/>
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

/**
 * Hook para manejar el onboarding
 */
export const useOnboarding = () => {
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		checkOnboardingStatus();
	}, []);

	const checkOnboardingStatus = async () => {
		try {
			const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
			if (!completed) {
				setShowOnboarding(true);
			}
		} catch (error) {
			console.error('Error checking onboarding:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const completeOnboarding = async () => {
		try {
			await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
			setShowOnboarding(false);
		} catch (error) {
			console.error('Error saving onboarding:', error);
		}
	};

	const resetOnboarding = async () => {
		try {
			await AsyncStorage.removeItem(ONBOARDING_KEY);
			setShowOnboarding(true);
		} catch (error) {
			console.error('Error resetting onboarding:', error);
		}
	};

	return {
		showOnboarding,
		isLoading,
		completeOnboarding,
		resetOnboarding,
	};
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	container: {
		backgroundColor: 'white',
		borderRadius: 24,
		padding: 24,
		width: width - 40,
		maxWidth: 400,
		alignItems: 'center',
	},
	containerTop: {
		position: 'absolute',
		top: 100,
	},
	containerBottom: {
		position: 'absolute',
		bottom: 120,
	},
	iconContainer: {
		marginBottom: 20,
	},
	iconCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#EFF6FF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1F2937',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 24,
	},
	footer: {
		width: '100%',
	},
	dotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 20,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#D1D5DB',
	},
	dotActive: {
		backgroundColor: '#0B729D',
		width: 24,
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	skipButton: {
		padding: 12,
	},
	skipText: {
		fontSize: 16,
		color: '#6B7280',
		fontWeight: '600',
	},
	nextButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#0B729D',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 12,
		flex: 1,
		justifyContent: 'center',
	},
	nextText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
