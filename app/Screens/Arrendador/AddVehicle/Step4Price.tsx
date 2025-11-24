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
		ubicacion: '',
	});

	const isFormValid = () => {
		return formData.precio && formData.descripcion && formData.ubicacion;
	};

	const handleFinish = async () => {
		if (!isFormValid()) {
			Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios');
			return;
		}

		const precio = parseFloat(formData.precio);
		if (isNaN(precio) || precio <= 0) {
			Alert.alert('Precio inválido', 'El precio debe ser mayor a 0');
			return;
		}

		if (formData.descripcion.length < 20) {
			Alert.alert('Descripción muy corta', 'Por favor escribe una descripción más detallada (mínimo 20 caracteres)');
			return;
		}

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
				ubicacion: formData.ubicacion,
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

					{/* Precio */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Precio por día (USD) *</Text>
						<View style={{ position: 'relative' }}>
							<Text style={{ position: 'absolute', left: 16, top: 14, fontSize: 16, color: '#374151', zIndex: 1 }}>$</Text>
							<TextInput
								style={[styles.input, { paddingLeft: 30 }]}
								placeholder="Ej: 45"
								value={formData.precio}
								onChangeText={(precio) => setFormData({ ...formData, precio })}
								keyboardType="numeric"
								placeholderTextColor="#9CA3AF"
							/>
						</View>
						<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
							Rentik cobra una comisión del 15% sobre este precio.
						</Text>
					</View>

					{/* Ubicación */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Ubicación de entrega *</Text>
						<TextInput
							style={styles.input}
							placeholder="Ej: San Benito, San Salvador"
							value={formData.ubicacion}
							onChangeText={(ubicacion) => setFormData({ ...formData, ubicacion })}
							placeholderTextColor="#9CA3AF"
						/>
					</View>

					{/* Descripción */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Descripción del vehículo *</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="Describe las mejores características de tu auto..."
							value={formData.descripcion}
							onChangeText={(descripcion) => setFormData({ ...formData, descripcion })}
							multiline
							numberOfLines={4}
							placeholderTextColor="#9CA3AF"
						/>
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
