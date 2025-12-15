import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FloatingSaveButtonProps {
	onSave: () => void;
	isSaving?: boolean;
	lastSaved?: Date | null;
	visible?: boolean;
}

export const FloatingSaveButton: React.FC<FloatingSaveButtonProps> = ({
	onSave,
	isSaving = false,
	lastSaved = null,
	visible = true,
}) => {
	const slideAnim = useRef(new Animated.Value(100)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (visible) {
			Animated.spring(slideAnim, {
				toValue: 0,
				friction: 8,
				tension: 40,
				useNativeDriver: true,
			}).start();
		} else {
			Animated.timing(slideAnim, {
				toValue: 100,
				duration: 200,
				useNativeDriver: true,
			}).start();
		}
	}, [visible]);

	useEffect(() => {
		if (isSaving) {
			const pulse = Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.1,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
				])
			);
			pulse.start();
			return () => pulse.stop();
		} else {
			pulseAnim.setValue(1);
		}
	}, [isSaving]);

	const getTimeSinceLastSave = (): string => {
		if (!lastSaved) return '';
		
		const now = new Date();
		const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
		
		if (diff < 60) return 'Guardado hace unos segundos';
		if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} min`;
		return `Guardado hace ${Math.floor(diff / 3600)} h`;
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
				},
			]}
		>
			<TouchableOpacity
				style={[styles.button, isSaving && styles.buttonSaving]}
				onPress={onSave}
				disabled={isSaving}
				activeOpacity={0.8}
			>
				<View style={styles.iconContainer}>
					{isSaving ? (
						<Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: ['0deg', '360deg'] }) }] }}>
							<Ionicons name="sync" size={22} color="white" />
						</Animated.View>
					) : (
						<Ionicons name="cloud-upload-outline" size={22} color="white" />
					)}
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.mainText}>
						{isSaving ? 'Guardando...' : 'Guardar Borrador'}
					</Text>
					{!isSaving && lastSaved && (
						<Text style={styles.subText}>{getTimeSinceLastSave()}</Text>
					)}
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 220,
		right: 16,
		zIndex: 1000,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 10,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#0B729D',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 50,
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.2)',
	},
	buttonSaving: {
		backgroundColor: '#059669',
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	iconContainer: {
		width: 26,
		height: 26,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
	},
	textContainer: {
		justifyContent: 'center',
	},
	mainText: {
		color: 'white',
		fontSize: 15,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	subText: {
		color: 'rgba(255, 255, 255, 0.85)',
		fontSize: 11,
		marginTop: 2,
		fontWeight: '500',
	},
});
