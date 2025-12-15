import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonProps {
	width?: number | string;
	height?: number;
	borderRadius?: number;
	style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
	width = '100%',
	height = 20,
	borderRadius = 4,
	style,
}) => {
	const animatedValue = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(animatedValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(animatedValue, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		);
		animation.start();
		return () => animation.stop();
	}, []);

	const opacity = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0.3, 0.7],
	});

	return (
		<Animated.View
			style={[
				styles.skeleton,
				{
					width,
					height,
					borderRadius,
					opacity,
				},
				style,
			]}
		/>
	);
};

export const VehicleCardSkeleton: React.FC = () => (
	<View style={styles.cardSkeleton}>
		<Skeleton width="100%" height={180} borderRadius={12} />
		<View style={styles.cardContent}>
			<Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
			<Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
			<View style={styles.badgeContainer}>
				<Skeleton width={80} height={28} borderRadius={8} />
				<Skeleton width={80} height={28} borderRadius={8} />
				<Skeleton width={80} height={28} borderRadius={8} />
			</View>
			<View style={styles.priceRow}>
				<Skeleton width={100} height={32} borderRadius={8} />
				<Skeleton width={80} height={36} borderRadius={8} />
			</View>
		</View>
	</View>
);

export const FormInputSkeleton: React.FC = () => (
	<View style={styles.formInputContainer}>
		<Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
		<Skeleton width="100%" height={48} borderRadius={8} />
	</View>
);

export const PhotoPlaceholderSkeleton: React.FC = () => (
	<View style={styles.photoContainer}>
		<Skeleton width="100%" height={180} borderRadius={12} />
	</View>
);

export const ListItemSkeleton: React.FC = () => (
	<View style={styles.listItem}>
		<Skeleton width={60} height={60} borderRadius={30} />
		<View style={styles.listContent}>
			<Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
			<Skeleton width="60%" height={14} />
		</View>
	</View>
);

export const PriceSectionSkeleton: React.FC = () => (
	<View style={styles.priceSection}>
		<Skeleton width={150} height={20} style={{ marginBottom: 16 }} />
		<Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 12 }} />
		<Skeleton width="100%" height={40} borderRadius={8} />
	</View>
);

export const FeatureGridSkeleton: React.FC = () => (
	<View style={styles.featureGrid}>
		{[1, 2, 3, 4, 5, 6].map((i) => (
			<Skeleton key={i} width="48%" height={80} borderRadius={12} />
		))}
	</View>
);

const styles = StyleSheet.create({
	skeleton: {
		backgroundColor: '#E5E7EB',
	},
	cardSkeleton: {
		backgroundColor: 'white',
		borderRadius: 16,
		marginBottom: 16,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	cardContent: {
		padding: 16,
	},
	badgeContainer: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	priceRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	formInputContainer: {
		marginBottom: 20,
	},
	photoContainer: {
		marginBottom: 20,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		backgroundColor: 'white',
		borderRadius: 12,
		marginBottom: 12,
	},
	listContent: {
		flex: 1,
	},
	priceSection: {
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
	},
	featureGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		justifyContent: 'space-between',
	},
});
