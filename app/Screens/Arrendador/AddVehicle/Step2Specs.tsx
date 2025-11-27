import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

const TIPOS = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Minivan', 'Coupé'];
const TRANSMISIONES = ['Automático', 'Manual'];
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep2Specs'>;

export default function Step2Specs() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { vehicleData } = route.params || {};

	const [formData, setFormData] = useState({
		tipo: '',
		transmision: '',
		combustible: '',
		pasajeros: '',
		puertas: '',
		color: '',
	});

	const [errors, setErrors] = useState({
		pasajeros: '',
		puertas: '',
	});

	const [touched, setTouched] = useState({
		pasajeros: false,
		puertas: false,
	});

	const validateField = (field: string, value: string) => {
		switch (field) {
			case 'pasajeros':
				if (!value) return 'Requerido';
				const pasajeros = parseInt(value);
				if (isNaN(pasajeros)) return 'Debe ser un número';
				if (pasajeros < 1) return 'Mínimo 1';
				if (pasajeros > 20) return 'Máximo 20';
				return '';
			case 'puertas':
				if (!value) return 'Requerido';
				const puertas = parseInt(value);
				if (isNaN(puertas)) return 'Debe ser un número';
				if (puertas < 2) return 'Mínimo 2';
				if (puertas > 5) return 'Máximo 5';
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
			formData.tipo &&
			formData.transmision &&
			formData.combustible &&
			formData.pasajeros &&
			formData.puertas &&
			!errors.pasajeros &&
			!errors.puertas
		);
	};

	const handleNext = () => {
		const pasajerosError = validateField('pasajeros', formData.pasajeros);
		const puertasError = validateField('puertas', formData.puertas);

		if (pasajerosError || puertasError || !formData.tipo || !formData.transmision || !formData.combustible) {
			setTouched({ pasajeros: true, puertas: true });
			setErrors({ pasajeros: pasajerosError, puertas: puertasError });
			Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios');
			return;
		}

		navigation.navigate('AddVehicleStep2Features', {
			vehicleData: { ...vehicleData, ...formData }
		});
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
					<Text style={styles.headerTitle}>Especificaciones</Text>
					<Text style={styles.headerSubtitle}>Paso 2 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '50%' }]} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.sectionTitle}>Características del Vehículo</Text>

				{/* Vista Previa Acumulativa */}
				{vehicleData && (
					<View style={styles.previewCard}>
						<View style={styles.previewHeader}>
							<Ionicons name="eye-outline" size={18} color="#0B729D" />
							<Text style={styles.previewTitle}>Vista Previa</Text>
						</View>
						<View style={styles.previewContent}>
							<Text style={styles.previewVehicleName}>
								{vehicleData.marca} {vehicleData.modelo} {vehicleData.anio}
							</Text>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
								{formData.tipo && (
									<View style={styles.previewBadge}>
										<Ionicons name="car-sport" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.tipo}</Text>
									</View>
								)}
								{formData.transmision && (
									<View style={styles.previewBadge}>
										<Ionicons name="settings" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.transmision}</Text>
									</View>
								)}
								{formData.combustible && (
									<View style={styles.previewBadge}>
										<Ionicons name="flash" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.combustible}</Text>
									</View>
								)}
								{formData.pasajeros && (
									<View style={styles.previewBadge}>
										<Ionicons name="people" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.pasajeros} pasajeros</Text>
									</View>
								)}
							</View>
						</View>
					</View>
				)}

				{/* Tipo */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Tipo de Vehículo *</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
						{TIPOS.map((tipo) => (
							<TouchableOpacity
								key={tipo}
								style={[styles.chip, formData.tipo === tipo && styles.chipSelected]}
								onPress={() => setFormData({ ...formData, tipo })}
							>
								<Text style={[styles.chipText, formData.tipo === tipo && styles.chipTextSelected]}>
									{tipo}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Transmisión */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Transmisión *</Text>
					<View style={styles.optionsRow}>
						{TRANSMISIONES.map((trans) => (
							<TouchableOpacity
								key={trans}
								style={[styles.optionCard, formData.transmision === trans && styles.optionCardSelected]}
								onPress={() => setFormData({ ...formData, transmision: trans })}
							>
								<Ionicons
									name={trans === 'Automático' ? 'settings-outline' : 'cog-outline'}
									size={24}
									color={formData.transmision === trans ? '#0B729D' : '#6B7280'}
								/>
								<Text style={[styles.optionText, formData.transmision === trans && styles.optionTextSelected]}>
									{trans}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Combustible */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Tipo de Combustible *</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
						{COMBUSTIBLES.map((comb) => (
							<TouchableOpacity
								key={comb}
								style={[styles.chip, formData.combustible === comb && styles.chipSelected]}
								onPress={() => setFormData({ ...formData, combustible: comb })}
							>
								<Text style={[styles.chipText, formData.combustible === comb && styles.chipTextSelected]}>
									{comb}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Pasajeros y Puertas */}
				<View style={styles.row}>
					<View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
						<Text style={styles.label}>Pasajeros *</Text>
						<TextInput
							style={[styles.input, touched.pasajeros && errors.pasajeros ? styles.inputError : formData.pasajeros && !errors.pasajeros ? styles.inputSuccess : {}]}
							placeholder="Ej: 5"
							value={formData.pasajeros}
							onChangeText={(pasajeros) => handleFieldChange('pasajeros', pasajeros)}
							onBlur={() => handleFieldBlur('pasajeros')}
							keyboardType="numeric"
							maxLength={2}
							placeholderTextColor="#9CA3AF"
						/>
						{touched.pasajeros && errors.pasajeros ? (
							<Text style={styles.errorTextSmall}>{errors.pasajeros}</Text>
						) : null}
					</View>
					<View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
						<Text style={styles.label}>Puertas *</Text>
						<TextInput
							style={[styles.input, touched.puertas && errors.puertas ? styles.inputError : formData.puertas && !errors.puertas ? styles.inputSuccess : {}]}
							placeholder="Ej: 4"
							value={formData.puertas}
							onChangeText={(puertas) => handleFieldChange('puertas', puertas)}
							onBlur={() => handleFieldBlur('puertas')}
							keyboardType="numeric"
							maxLength={1}
							placeholderTextColor="#9CA3AF"
						/>
						{touched.puertas && errors.puertas ? (
							<Text style={styles.errorTextSmall}>{errors.puertas}</Text>
						) : null}
					</View>
				</View>

				{/* Color */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Color (opcional)</Text>
					<TextInput
						style={styles.input}
						placeholder="Ej: Blanco, Negro, Azul"
						value={formData.color}
						onChangeText={(color) => setFormData({ ...formData, color })}
						placeholderTextColor="#9CA3AF"
					/>
				</View>

				<View style={{ height: 100 }} />
			</ScrollView>

			{/* Footer */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
					onPress={handleNext}
					disabled={!isFormValid()}
				>
					<Text style={styles.nextButtonText}>Siguiente</Text>
					<Ionicons name="arrow-forward" size={20} color="white" />
				</TouchableOpacity>
			</View>
		</View>
	);
}
