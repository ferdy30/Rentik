import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = [
	{ name: 'Negro', hex: '#1F2937', icon: 'checkmark' },
	{ name: 'Blanco', hex: '#F9FAFB', icon: 'checkmark', textColor: '#1F2937' },
	{ name: 'Plata', hex: '#D1D5DB', icon: 'checkmark', textColor: '#1F2937' },
	{ name: 'Gris', hex: '#6B7280', icon: 'checkmark' },
	{ name: 'Rojo', hex: '#DC2626', icon: 'checkmark' },
	{ name: 'Azul', hex: '#2563EB', icon: 'checkmark' },
	{ name: 'Verde', hex: '#16A34A', icon: 'checkmark' },
	{ name: 'Amarillo', hex: '#FBBF24', icon: 'checkmark', textColor: '#1F2937' },
	{ name: 'Naranja', hex: '#EA580C', icon: 'checkmark' },
	{ name: 'Café', hex: '#92400E', icon: 'checkmark' },
	{ name: 'Beige', hex: '#FDE68A', icon: 'checkmark', textColor: '#1F2937' },
	{ name: 'Morado', hex: '#7C3AED', icon: 'checkmark' },
];

interface ColorPickerProps {
	selectedColor: string;
	onSelectColor: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
	selectedColor,
	onSelectColor,
}) => {
	return (
		<View style={styles.container}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{COLORS.map((color) => {
					const isSelected = selectedColor === color.name;
					return (
						<TouchableOpacity
							key={color.name}
							style={styles.itemWrapper}
							onPress={() => onSelectColor(color.name)}
							activeOpacity={0.7}
						>
							<View
								style={[
									styles.colorButton,
									{ backgroundColor: color.hex },
									isSelected && styles.colorButtonSelected,
								]}
							>
								{isSelected && (
									<Ionicons
										name="checkmark-circle"
										size={24}
										color={color.textColor || '#FFFFFF'}
									/>
								)}
							</View>
							<Text
								style={[
									styles.colorLabel,
									isSelected && styles.colorLabelSelected,
								]}
							>
								{color.name}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 8,
	},
	scrollContent: {
		paddingHorizontal: 4,
		gap: 12,
		paddingBottom: 8, // Add padding for shadow
	},
	itemWrapper: {
		alignItems: 'center',
		gap: 8,
		width: 60,
	},
	colorButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#E5E7EB',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	colorButtonSelected: {
		borderColor: '#0B729D',
		borderWidth: 3,
		transform: [{ scale: 1.1 }],
	},
	colorLabel: {
		fontSize: 11,
		color: '#6B7280',
		fontWeight: '500',
		textAlign: 'center',
	},
	colorLabelSelected: {
		color: '#0B729D',
		fontWeight: '700',
	},
});
