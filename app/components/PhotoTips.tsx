import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TIPS = [
	{
		icon: 'sunny-outline' as const,
		title: 'Luz Natural',
		description: 'Toma fotos durante el día con buena iluminación',
	},
	{
		icon: 'sparkles-outline' as const,
		title: 'Auto Limpio',
		description: 'Limpia interior y exterior antes de fotografiar',
	},
	{
		icon: 'camera-outline' as const,
		title: 'Ángulos Múltiples',
		description: 'Captura diferentes perspectivas del vehículo',
	},
	{
		icon: 'images-outline' as const,
		title: 'Sin Filtros',
		description: 'Usa fotos reales sin edición excesiva',
	},
];

export const PhotoTips: React.FC = () => {
	const [expanded, setExpanded] = useState(false);
	const [animation] = useState(new Animated.Value(0));

	const toggleExpanded = () => {
		const toValue = expanded ? 0 : 1;
		Animated.spring(animation, {
			toValue,
			friction: 8,
			useNativeDriver: false,
		}).start();
		setExpanded(!expanded);
	};

	const maxHeight = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 300],
	});

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={styles.header}
				onPress={toggleExpanded}
				activeOpacity={0.7}
			>
				<View style={styles.headerLeft}>
					<View style={styles.iconCircle}>
						<Ionicons name="bulb" size={20} color="#F59E0B" />
					</View>
					<Text style={styles.headerTitle}>Consejos para Mejores Fotos</Text>
				</View>
				<Ionicons
					name={expanded ? 'chevron-up' : 'chevron-down'}
					size={20}
					color="#6B7280"
				/>
			</TouchableOpacity>

			<Animated.View style={[styles.content, { maxHeight }]}>
				{TIPS.map((tip, index) => (
					<View key={index} style={styles.tipItem}>
						<View style={styles.tipIcon}>
							<Ionicons name={tip.icon} size={20} color="#0B729D" />
						</View>
						<View style={styles.tipContent}>
							<Text style={styles.tipTitle}>{tip.title}</Text>
							<Text style={styles.tipDescription}>{tip.description}</Text>
						</View>
					</View>
				))}
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#FEF3C7',
		borderRadius: 12,
		marginBottom: 20,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#FDE68A',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	iconCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#92400E',
	},
	content: {
		overflow: 'hidden',
	},
	tipItem: {
		flexDirection: 'row',
		padding: 16,
		paddingTop: 0,
		gap: 12,
	},
	tipIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	tipContent: {
		flex: 1,
	},
	tipTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#92400E',
		marginBottom: 2,
	},
	tipDescription: {
		fontSize: 13,
		color: '#78350F',
		lineHeight: 18,
	},
});
