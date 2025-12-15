import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

interface VehiclePreviewProps {
	vehicleData: {
		marca?: string;
		modelo?: string;
		año?: string;
		tipo?: string;
		transmision?: string;
		pasajeros?: string;
		combustible?: string;
		color?: string;
		caracteristicas?: string[];
		photos?: { [key: string]: string | null };
	};
	precio?: string;
	ubicacion?: string;
	descripcion?: string;
	isLoading?: boolean;
}

/**
 * Componente de vista previa del vehículo
 * Muestra cómo se verá el anuncio final
 */
export const VehiclePreview: React.FC<VehiclePreviewProps> = ({
	vehicleData,
	precio,
	ubicacion,
	descripcion,
	isLoading = false,
}) => {
	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#0B729D" />
				<Text style={styles.loadingText}>Cargando vista previa...</Text>
			</View>
		);
	}

	const { marca, modelo, año, tipo, transmision, pasajeros, combustible, color, caracteristicas, photos } = vehicleData;

	// Obtener la primera foto disponible
	const mainPhoto = photos?.front || photos?.sideLeft || photos?.sideRight || photos?.interior;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Ionicons name="eye-outline" size={20} color="#0B729D" />
				<Text style={styles.headerTitle}>Vista Previa del Anuncio</Text>
			</View>

			<View style={styles.card}>
				{/* Foto principal */}
				{mainPhoto && (
					<Image source={{ uri: mainPhoto }} style={styles.mainImage} />
				)}

				{/* Información del vehículo */}
				<View style={styles.content}>
					<View style={styles.titleRow}>
						<Text style={styles.vehicleName}>
							{marca} {modelo}
						</Text>
						{precio && (
							<View style={styles.priceTag}>
								<Text style={styles.priceText}>${precio}</Text>
								<Text style={styles.pricePer}>/día</Text>
							</View>
						)}
					</View>

					{año && (
						<Text style={styles.year}>{año}</Text>
					)}

					{/* Badges de características principales */}
					<View style={styles.badgesContainer}>
						{tipo && (
							<View style={styles.badge}>
								<Ionicons name="car-sport" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{tipo}</Text>
							</View>
						)}
						{transmision && (
							<View style={styles.badge}>
								<Ionicons name="settings" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{transmision}</Text>
							</View>
						)}
						{pasajeros && (
							<View style={styles.badge}>
								<Ionicons name="people" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{pasajeros} pasajeros</Text>
							</View>
						)}
						{combustible && (
							<View style={styles.badge}>
								<Ionicons name="flash" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{combustible}</Text>
							</View>
						)}
						{color && (
							<View style={styles.badge}>
								<Ionicons name="color-palette" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{color}</Text>
							</View>
						)}
					</View>

					{/* Ubicación */}
					{ubicacion && (
						<View style={styles.locationContainer}>
							<Ionicons name="location" size={16} color="#0B729D" />
							<Text style={styles.locationText}>{ubicacion}</Text>
						</View>
					)}

					{/* Descripción */}
					{descripcion && descripcion.length >= 20 && (
						<Text style={styles.description} numberOfLines={3}>
							{descripcion}
						</Text>
					)}

					{/* Características destacadas */}
					{caracteristicas && caracteristicas.length > 0 && (
						<View style={styles.featuresContainer}>
							<Text style={styles.featuresTitle}>Características:</Text>
							<View style={styles.featuresList}>
								{caracteristicas.slice(0, 6).map((feat, index) => (
									<View key={index} style={styles.featureItem}>
										<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
										<Text style={styles.featureText}>{feat}</Text>
									</View>
								))}
								{caracteristicas.length > 6 && (
									<Text style={styles.moreFeatures}>
										+{caracteristicas.length - 6} más
									</Text>
								)}
							</View>
						</View>
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 24,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 12,
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1F2937',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: '#6B7280',
	},
	card: {
		backgroundColor: 'white',
		borderRadius: 16,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	mainImage: {
		width: '100%',
		height: 200,
		resizeMode: 'cover',
	},
	content: {
		padding: 16,
	},
	titleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 4,
	},
	vehicleName: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1F2937',
		flex: 1,
	},
	priceTag: {
		backgroundColor: '#16A34A',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	priceText: {
		fontSize: 18,
		fontWeight: '700',
		color: 'white',
	},
	pricePer: {
		fontSize: 12,
		color: 'white',
		marginLeft: 2,
	},
	year: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 12,
	},
	badgesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	badgeText: {
		fontSize: 12,
		color: '#374151',
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 12,
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: '#EFF6FF',
		borderRadius: 8,
	},
	locationText: {
		fontSize: 13,
		color: '#0B729D',
		fontWeight: '500',
	},
	description: {
		fontSize: 14,
		color: '#4B5563',
		lineHeight: 20,
		marginBottom: 16,
	},
	featuresContainer: {
		marginTop: 8,
	},
	featuresTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1F2937',
		marginBottom: 8,
	},
	featuresList: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#ECFDF5',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
	featureText: {
		fontSize: 11,
		color: '#16A34A',
		fontWeight: '500',
	},
	moreFeatures: {
		fontSize: 11,
		color: '#6B7280',
		fontStyle: 'italic',
		alignSelf: 'center',
	},
});
