import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

// Recibe el objeto Vehicle completo (ya normalizado)
export const VehiclePreview = ({ vehicle, isLoading = false }) => {
	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#0B729D" />
				<Text style={styles.loadingText}>Cargando vista previa...</Text>
			</View>
		);
	}

	// Foto principal
	const mainPhoto = vehicle?.photos?.front || vehicle?.photos?.sideLeft || vehicle?.photos?.sideRight || vehicle?.photos?.interior;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Ionicons name="eye-outline" size={20} color="#0B729D" />
				<Text style={styles.headerTitle}>Vista Previa del Anuncio</Text>
			</View>

			<View style={styles.card}>
				{/* Foto principal */}
				{mainPhoto ? (
					<Image source={{ uri: mainPhoto }} style={styles.mainImage} />
				) : (
					<View style={[styles.mainImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}> 
						<Ionicons name="car-sport" size={48} color="#D1D5DB" />
					</View>
				)}

				{/* Información del vehículo */}
				<View style={styles.content}>
					<View style={styles.titleRow}>
						<Text style={styles.vehicleName}>
							{vehicle.marca} {vehicle.modelo}
						</Text>
						{vehicle.precio && (
							<View style={styles.priceTag}>
								<Text style={styles.priceText}>${vehicle.precio}</Text>
								<Text style={styles.pricePer}>/día</Text>
							</View>
						)}
					</View>
					{vehicle.anio && (
						<Text style={styles.year}>{vehicle.anio}</Text>
					)}

					{/* Badges principales */}
					<View style={styles.badgesContainer}>
						{vehicle.tipo && (
							<View style={styles.badge}>
								<Ionicons name="car-sport" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{vehicle.tipo}</Text>
							</View>
						)}
						{vehicle.transmision && (
							<View style={styles.badge}>
								<Ionicons name="settings" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{vehicle.transmision}</Text>
							</View>
						)}
						{vehicle.pasajeros && (
							<View style={styles.badge}>
								<Ionicons name="people" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{vehicle.pasajeros} pasajeros</Text>
							</View>
						)}
						{vehicle.combustible && (
							<View style={styles.badge}>
								<Ionicons name="flame" size={14} color="#6B7280" />
								<Text style={styles.badgeText}>{vehicle.combustible}</Text>
							</View>
						)}
					</View>

				{/* Mensaje si faltan datos */}
				{(!vehicle.descripcion || vehicle.descripcion.length < 20) && (
					<View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginTop: 8 }}>
						<Text style={{ color: '#92400E', fontSize: 13 }}>💡 Agrega una descripción para atraer más clientes</Text>
					</View>
				)}
				{(!vehicle.caracteristicas || vehicle.caracteristicas.length === 0) && (
					<View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginTop: 8 }}>
						<Text style={{ color: '#92400E', fontSize: 13 }}>💡 Agrega características para destacar tu vehículo</Text>
					</View>
				)}
				</View>
			</View>
		</View>
	);
};

// ...existing code...

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
