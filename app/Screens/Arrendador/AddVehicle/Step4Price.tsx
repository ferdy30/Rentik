import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../../context/Auth';
import LocationPicker from '../../../components/LocationPicker';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { addVehicle } from '../../../services/vehicles';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep4Price'>;

export default function Step4Price() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { user } = useAuth();
	const { vehicleData } = route.params || {};
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState({
		precio: '',
		descripcion: '',
	});

	const [locationData, setLocationData] = useState<{
		address: string;
		coordinates: { latitude: number; longitude: number };
		placeId: string;
	} | null>(null);

	const [errors, setErrors] = useState({
		precio: '',
		descripcion: '',
	});

	const [touched, setTouched] = useState({
		precio: false,
		descripcion: false,
	});

	const validateField = (field: string, value: string) => {
		switch (field) {
			case 'precio':
				if (!value) return 'El precio es requerido';
				const precio = parseFloat(value);
				if (isNaN(precio) || precio <= 0) return 'Debe ser mayor a 0';
				if (precio < 5) return 'Mínimo $5 por día';
				if (precio > 500) return 'Máximo $500 por día';
				return '';
			case 'descripcion':
				if (!value) return 'La descripción es requerida';
				if (value.length < 20) return `Mínimo 20 caracteres (${value.length}/20)`;
				if (value.length > 500) return 'Máximo 500 caracteres';
				return '';
			default:
				return '';
		}
	};

	const handleFieldChange = (field: string, value: string) => {
		setFormData({ ...formData, [field]: value });
		
		if (touched[field as keyof typeof touched]) {
			const error = validateField(field, value);
			setErrors({ ...errors, [field]: error });
		}
	};

	const handleFieldBlur = (field: string) => {
		setTouched({ ...touched, [field]: true });
		const error = validateField(field, formData[field as keyof typeof formData]);
		setErrors({ ...errors, [field]: error });
	};

	const isFormValid = () => {
		return (
			formData.precio && 
			formData.descripcion && 
			locationData &&
			!errors.precio &&
			!errors.descripcion
		);
	};

	const handleFinish = async () => {
		const precioError = validateField('precio', formData.precio);
		const descripcionError = validateField('descripcion', formData.descripcion);

		if (precioError || descripcionError || !locationData) {
			setTouched({ precio: true, descripcion: true });
			setErrors({ precio: precioError, descripcion: descripcionError });
			Alert.alert('Campos incompletos', 'Por favor corrige los errores antes de publicar');
			return;
		}

		const precio = parseFloat(formData.precio);

		if (!user) {
			Alert.alert('Error', 'No se encontró la sesión del usuario');
			return;
		}

		try {
			setLoading(true);
			const finalData = {
				...vehicleData,
				precio,
				descripcion: formData.descripcion,
				ubicacion: locationData.address,
				coordinates: locationData.coordinates,
				placeId: locationData.placeId,
			};

			await addVehicle(finalData, user.uid);

			Alert.alert(
				'¡Vehículo Registrado!',
				'Tu vehículo ha sido publicado exitosamente.',
				[
					{ 
						text: 'Entendido', 
						onPress: () => navigation.navigate('HomeArrendador') 
					}
				]
			);
		} catch (error) {
			console.error(error);
			Alert.alert('Error', 'Hubo un problema al guardar el vehículo. Inténtalo de nuevo.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={24} color="#032B3C" />
				</TouchableOpacity>
				<View style={styles.headerCenter}>
					<Text style={styles.headerTitle}>Precio y Ubicación</Text>
					<Text style={styles.headerSubtitle}>Paso 4 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '100%' }]} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Text style={styles.sectionTitle}>Detalles Finales</Text>

					{/* Vista Previa Final Completa */}
					{vehicleData && (
						<View style={styles.previewCard}>
							<View style={styles.previewHeader}>
								<Ionicons name="eye-outline" size={18} color="#0B729D" />
								<Text style={styles.previewTitle}>Cómo se verá tu anuncio</Text>
							</View>
							<View style={styles.previewContent}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
									<Text style={styles.previewVehicleName}>
										{vehicleData.marca} {vehicleData.modelo} {vehicleData.anio}
									</Text>
									{formData.precio && !errors.precio && (
										<View style={{ backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
											<Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>${formData.precio}/día</Text>
										</View>
									)}
								</View>
								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
									{vehicleData.tipo && (
										<View style={styles.previewBadge}>
											<Ionicons name="car-sport" size={12} color="#6B7280" />
											<Text style={styles.previewPlate}>{vehicleData.tipo}</Text>
										</View>
									)}
									{vehicleData.transmision && (
										<View style={styles.previewBadge}>
											<Ionicons name="settings" size={12} color="#6B7280" />
											<Text style={styles.previewPlate}>{vehicleData.transmision}</Text>
										</View>
									)}
									{vehicleData.pasajeros && (
										<View style={styles.previewBadge}>
											<Ionicons name="people" size={12} color="#6B7280" />
											<Text style={styles.previewPlate}>{vehicleData.pasajeros} pasajeros</Text>
										</View>
									)}
									{locationData && (
										<View style={styles.previewBadge}>
											<Ionicons name="location" size={12} color="#6B7280" />
											<Text style={styles.previewPlate}>{locationData.address.split(',')[0]}</Text>
										</View>
									)}
								</View>
								{formData.descripcion && formData.descripcion.length >= 20 && (
									<Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 20 }} numberOfLines={3}>
										{formData.descripcion}
									</Text>
								)}
							</View>
						</View>
					)}

					{/* Precio */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Precio por día (USD) *</Text>
						<View style={{ position: 'relative' }}>
							<Text style={{ position: 'absolute', left: 16, top: 14, fontSize: 16, color: '#374151', zIndex: 1 }}>$</Text>
							<TextInput
								style={[styles.input, { paddingLeft: 30 }, touched.precio && errors.precio ? styles.inputError : formData.precio && !errors.precio ? styles.inputSuccess : {}]}
								placeholder="Ej: 45"
								value={formData.precio}
								onChangeText={(precio) => handleFieldChange('precio', precio)}
								onBlur={() => handleFieldBlur('precio')}
								keyboardType="numeric"
								placeholderTextColor="#9CA3AF"
							/>
						</View>
						{touched.precio && errors.precio ? (
							<View style={styles.errorContainer}>
								<Ionicons name="alert-circle" size={14} color="#DC2626" />
								<Text style={styles.errorText}>{errors.precio}</Text>
							</View>
						) : formData.precio && !errors.precio ? (
							<View style={styles.successContainer}>
								<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
								<Text style={styles.successText}>
									Ganarás ${(parseFloat(formData.precio) * 0.85).toFixed(2)}/día (después de comisión 15%)
								</Text>
							</View>
						) : (
							<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
								Rentik cobra una comisión del 15% sobre este precio.
							</Text>
						)}
					</View>

					{/* Ubicación */}
					<View style={styles.locationSection}>
						<LocationPicker
							initialLocation={locationData || undefined}
							onLocationSelected={setLocationData}
							title="Ubicación de entrega *"
							subtitle="Donde entregarás el vehículo al arrendatario"
						/>
					</View>

					{/* Descripción */}
					<View style={styles.inputGroup}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
							<Text style={styles.label}>Descripción del vehículo *</Text>
							<Text style={{ fontSize: 12, color: formData.descripcion.length < 20 ? '#DC2626' : formData.descripcion.length > 500 ? '#DC2626' : '#6B7280' }}>
								{formData.descripcion.length}/500
							</Text>
						</View>
						<TextInput
							style={[styles.input, styles.textArea, touched.descripcion && errors.descripcion ? styles.inputError : formData.descripcion && !errors.descripcion ? styles.inputSuccess : {}]}
							placeholder="Describe las mejores características de tu auto...\n\nEjemplo: Auto en excelente estado, aire acondicionado, Bluetooth, cámara de reversa. Perfecto para viajes largos o paseos por la ciudad."
							value={formData.descripcion}
							onChangeText={(descripcion) => handleFieldChange('descripcion', descripcion)}
							onBlur={() => handleFieldBlur('descripcion')}
							multiline
							numberOfLines={5}
							maxLength={500}
							placeholderTextColor="#9CA3AF"
						/>
						{touched.descripcion && errors.descripcion ? (
							<View style={styles.errorContainer}>
								<Ionicons name="alert-circle" size={14} color="#DC2626" />
								<Text style={styles.errorText}>{errors.descripcion}</Text>
							</View>
						) : formData.descripcion && formData.descripcion.length >= 20 && !errors.descripcion ? (
							<View style={styles.successContainer}>
								<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
								<Text style={styles.successText}>Descripción completa</Text>
							</View>
						) : (
							<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
								Una buena descripción aumenta tus posibilidades de renta
							</Text>
						)}
					</View>

					<View style={{ height: 100 }} />
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Footer */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.nextButton, (!isFormValid() || loading) && styles.nextButtonDisabled]}
					onPress={handleFinish}
					disabled={!isFormValid() || loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<>
							<Text style={styles.nextButtonText}>Publicar Vehículo</Text>
							<Ionicons name="checkmark-circle" size={20} color="white" />
						</>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}
