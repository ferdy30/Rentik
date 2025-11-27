import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
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
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

const MARCAS = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Mitsubishi'];

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep1Basic'>;

export default function Step1Basic() {
	const navigation = useNavigation<NavigationProp>();
	const [formData, setFormData] = useState({
		marca: '',
		modelo: '',
		anio: '',
		placa: '',
	});

	const [errors, setErrors] = useState({
		marca: '',
		modelo: '',
		anio: '',
		placa: '',
	});

	const [touched, setTouched] = useState({
		marca: false,
		modelo: false,
		anio: false,
		placa: false,
	});

	const currentYear = new Date().getFullYear();

	const validateField = (field: string, value: string) => {
		switch (field) {
			case 'modelo':
				if (!value) return 'El modelo es requerido';
				if (!/^[a-zA-Z]/.test(value.trim())) return 'Debe comenzar con una letra';
				if (value.length < 2) return 'Mínimo 2 caracteres';
				return '';
			case 'anio':
				if (!value) return 'El año es requerido';
				const anio = parseInt(value);
				if (isNaN(anio)) return 'Debe ser un número';
				if (anio < 1990) return `Mínimo 1990`;
				if (anio > currentYear + 1) return `Máximo ${currentYear + 1}`;
				return '';
			case 'placa':
				if (!value) return 'La placa es requerida';
				const placaRegex = /^[A-Z0-9]{3,4}[-]?[A-Z0-9]{3,4}$/;
				if (!placaRegex.test(value.trim())) return 'Formato: ABC-1234 o ABC1234';
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
			formData.marca &&
			formData.modelo &&
			formData.anio &&
			formData.placa &&
			!errors.modelo &&
			!errors.anio &&
			!errors.placa
		);
	};

	const handleNext = () => {
		// Validar todos los campos antes de continuar
		const modeloError = validateField('modelo', formData.modelo);
		const anioError = validateField('anio', formData.anio);
		const placaError = validateField('placa', formData.placa);

		if (modeloError || anioError || placaError || !formData.marca) {
			setTouched({ marca: true, modelo: true, anio: true, placa: true });
			setErrors({ marca: formData.marca ? '' : 'Selecciona una marca', modelo: modeloError, anio: anioError, placa: placaError });
			Alert.alert('Campos incompletos', 'Por favor corrige los errores antes de continuar');
			return;
		}

		navigation.navigate('AddVehicleStep2Specs', {
			vehicleData: formData
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
					<Text style={styles.headerTitle}>Información Básica</Text>
					<Text style={styles.headerSubtitle}>Paso 1 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '25%' }]} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Text style={styles.sectionTitle}>¿Qué auto vas a rentar?</Text>

				{/* Vista Previa */}
				{(formData.marca || formData.modelo || formData.anio) && (
					<View style={styles.previewCard}>
						<View style={styles.previewHeader}>
							<Ionicons name="eye-outline" size={18} color="#0B729D" />
							<Text style={styles.previewTitle}>Vista Previa</Text>
						</View>
						<View style={styles.previewContent}>
							<Text style={styles.previewVehicleName}>
								{formData.marca || 'Marca'} {formData.modelo || 'Modelo'}
								{formData.anio ? ` ${formData.anio}` : ''}
							</Text>
							{formData.placa && (
								<View style={styles.previewBadge}>
									<Ionicons name="car-outline" size={12} color="#6B7280" />
									<Text style={styles.previewPlate}>{formData.placa}</Text>
								</View>
							)}
						</View>
					</View>
				)}

					{/* Marca */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Marca *</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
							{MARCAS.map((marca) => (
								<TouchableOpacity
									key={marca}
									style={[styles.chip, formData.marca === marca && styles.chipSelected]}
									onPress={() => setFormData({ ...formData, marca })}
								>
									<Text style={[styles.chipText, formData.marca === marca && styles.chipTextSelected]}>
										{marca}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

				{/* Modelo */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Modelo *</Text>
					<TextInput
						style={[styles.input, touched.modelo && errors.modelo ? styles.inputError : formData.modelo && !errors.modelo ? styles.inputSuccess : {}]}
						placeholder="Ej: Corolla, Civic, Sentra"
						value={formData.modelo}
						onChangeText={(modelo) => handleFieldChange('modelo', modelo)}
						onBlur={() => handleFieldBlur('modelo')}
						placeholderTextColor="#9CA3AF"
					/>
					{touched.modelo && errors.modelo ? (
						<View style={styles.errorContainer}>
							<Ionicons name="alert-circle" size={14} color="#DC2626" />
							<Text style={styles.errorText}>{errors.modelo}</Text>
						</View>
					) : formData.modelo && !errors.modelo ? (
						<View style={styles.successContainer}>
							<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
							<Text style={styles.successText}>Modelo válido</Text>
						</View>
					) : null}
				</View>					{/* Año y Placa */}
					<View style={styles.row}>
					<View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
						<Text style={styles.label}>Año *</Text>
						<TextInput
							style={[styles.input, touched.anio && errors.anio ? styles.inputError : formData.anio && !errors.anio ? styles.inputSuccess : {}]}
							placeholder={currentYear.toString()}
							value={formData.anio}
							onChangeText={(anio) => handleFieldChange('anio', anio)}
							onBlur={() => handleFieldBlur('anio')}
							keyboardType="numeric"
							maxLength={4}
							placeholderTextColor="#9CA3AF"
						/>
						{touched.anio && errors.anio ? (
							<Text style={styles.errorTextSmall}>{errors.anio}</Text>
						) : null}
					</View>
					<View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
						<Text style={styles.label}>Placa *</Text>
						<TextInput
							style={[styles.input, touched.placa && errors.placa ? styles.inputError : formData.placa && !errors.placa ? styles.inputSuccess : {}]}
							placeholder="ABC-1234"
							value={formData.placa}
							onChangeText={(placa) => handleFieldChange('placa', placa.toUpperCase())}
							onBlur={() => handleFieldBlur('placa')}
							autoCapitalize="characters"
							maxLength={10}
							placeholderTextColor="#9CA3AF"
						/>
						{touched.placa && errors.placa ? (
							<Text style={styles.errorTextSmall}>{errors.placa}</Text>
						) : null}
					</View>
					</View>

					<View style={{ height: 100 }} />
				</ScrollView>
			</KeyboardAvoidingView>

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
