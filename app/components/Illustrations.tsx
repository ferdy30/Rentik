import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface EmptyPhotoIllustrationProps {
	size?: number;
	color?: string;
}

export const EmptyPhotoIllustration: React.FC<EmptyPhotoIllustrationProps> = ({
	size = 120,
	color = '#9CA3AF',
}) => (
	<View style={[styles.container, { width: size, height: size }]}>
		<View style={[styles.circle, { width: size, height: size, backgroundColor: '#F3F4F6' }]}>
			<Ionicons name="camera-outline" size={size * 0.4} color={color} />
		</View>
		<View style={styles.addBadge}>
			<Ionicons name="add-circle" size={size * 0.25} color="#0B729D" />
		</View>
	</View>
);

export const CarIllustration: React.FC<{ size?: number }> = ({ size = 100 }) => (
	<View style={[styles.container, { width: size, height: size }]}>
		<View style={[styles.circle, { width: size, height: size, backgroundColor: '#EFF6FF' }]}>
			<Ionicons name="car-sport" size={size * 0.5} color="#0B729D" />
		</View>
	</View>
);

export const DocumentIllustration: React.FC<{ size?: number }> = ({ size = 100 }) => (
	<View style={[styles.container, { width: size, height: size }]}>
		<View style={[styles.circle, { width: size, height: size, backgroundColor: '#FEF3C7' }]}>
			<Ionicons name="document-text" size={size * 0.5} color="#F59E0B" />
		</View>
	</View>
);

export const PriceTagIllustration: React.FC<{ size?: number }> = ({ size = 100 }) => (
	<View style={[styles.container, { width: size, height: size }]}>
		<View style={[styles.circle, { width: size, height: size, backgroundColor: '#ECFDF5' }]}>
			<Ionicons name="pricetag" size={size * 0.5} color="#16A34A" />
		</View>
	</View>
);

export const LoadingDotsIllustration: React.FC<{ size?: number }> = ({ size = 80 }) => (
	<View style={[styles.dotsContainer, { width: size, height: size }]}>
		<View style={[styles.dot, { opacity: 0.3 }]} />
		<View style={[styles.dot, { opacity: 0.6 }]} />
		<View style={[styles.dot, { opacity: 0.9 }]} />
	</View>
);

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	circle: {
		borderRadius: 1000,
		justifyContent: 'center',
		alignItems: 'center',
	},
	addBadge: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: 'white',
		borderRadius: 20,
	},
	dotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
	},
	dot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#0B729D',
	},
});
