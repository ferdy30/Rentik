import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ColorPicker } from '../../../components/ColorPicker';
import { StepIndicator } from '../../../components/StepIndicator';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

const TIPOS = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Minivan', 'Coupé'];
const TRANSMISIONES = ['Automático', 'Manual'];
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
const CONDICIONES = [
	{ value: 'excelente', label: 'Excelente', desc: 'Como nuevo', icon: 'star' as const },
	{ value: 'muy_bueno', label: 'Muy Bueno', desc: 'Bien mantenido', icon: 'star-half' as const },
	{ value: 'bueno', label: 'Bueno', desc: 'Uso normal', icon: 'thumbs-up' as const },
	{ value: 'regular', label: 'Regular', desc: 'Desgaste visible', icon: 'warning' as const },
];

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
		kilometraje: '',
		condicion: '',
	});

	const [errors, setErrors] = useState({
		pasajeros: '',
		puertas: '',
		kilometraje: '',
	});

	const [touched, setTouched] = useState({
		pasajeros: false,
		puertas: false,
		kilometraje: false,
	});

	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const progressAnim = useRef(new Animated.Value(0.25)).current;

	// Cargar borrador
	useEffect(() => {
		const loadDraft = async () => {
			try {
				const draft = await AsyncStorage.getItem('@add_vehicle_draft');
				if (draft) {
					const parsed = JSON.parse(draft);
					if (parsed.step2) {
						setFormData(parsed.step2);
						setLastSaved(new Date(parsed.timestamp));
					}
				}
			} catch (error) {
				console.log('Error loading draft:', error);
			}
		};
		loadDraft();
	}, []);

	// Animación de entrada
	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 500,
			useNativeDriver: true,
		}).start();
	}, [fadeAnim]);

	// Animar progreso
	useEffect(() => {
		const total = 8; // Aumentado a 8 campos
		const completed = Object.values(formData).filter(Boolean).length;
		const progress = 0.25 + (completed / total) * 0.25;
		Animated.spring(progressAnim, {
			toValue: progress,
			friction: 8,
			useNativeDriver: false,
		}).start();
	}, [formData, progressAnim]);

	// Autoguardado
	const saveDraft = async () => {
		if (!formData.tipo && !formData.combustible) return;
		setIsSaving(true);
		try {
			let existing = {};
			const draft = await AsyncStorage.getItem('@add_vehicle_draft');
			if (draft) existing = JSON.parse(draft);
			await AsyncStorage.setItem(
				'@add_vehicle_draft',
				JSON.stringify({
					...existing,
					step2: formData,
					timestamp: new Date().toISOString(),
				})
			);
			setLastSaved(new Date());
		} catch (error) {
			console.log('Error saving draft:', error);
		} finally {
			setTimeout(() => setIsSaving(false), 500);
		}
	};

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
			case 'kilometraje':
				if (!value) return 'Requerido';
				const km = parseInt(value.replace(/,/g, ''));
				if (isNaN(km)) return 'Debe ser un número';
				if (km < 0) return 'No puede ser negativo';
				if (km > 500000) return 'Máximo 500,000 km';
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
			formData.kilometraje &&
			formData.condicion &&
			!errors.pasajeros &&
			!errors.puertas &&
			!errors.kilometraje
		);
	};

	const handleNext = () => {
		const pasajerosError = validateField('pasajeros', formData.pasajeros);
		const puertasError = validateField('puertas', formData.puertas);
		const kilometrajeError = validateField('kilometraje', formData.kilometraje);

		if (pasajerosError || puertasError || kilometrajeError || !formData.tipo || !formData.transmision || !formData.combustible || !formData.condicion) {
			setTouched({ pasajeros: true, puertas: true, kilometraje: true });
			setErrors({ pasajeros: pasajerosError, puertas: puertasError, kilometraje: kilometrajeError });
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
					<Text style={styles.headerSubtitle}>Detalles técnicos</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Step Indicator */}
			<StepIndicator 
				currentStep={2} 
				totalSteps={4}
				labels={['Básico', 'Specs', 'Fotos', 'Precio']}
			/>

			{/* Progress Bar Animado */}
			<View style={styles.progressContainer}>
				<Animated.View 
					style={[
						styles.progressBar, 
						{ 
							width: progressAnim.interpolate({
								inputRange: [0, 1],
								outputRange: ['0%', '100%'],
							})
						}
					]} 
				/>
				<View style={styles.progressTextContainer}>
					<Text style={styles.progressText}>
						Paso 2 • {Math.round((Object.values(formData).filter(Boolean).length / 6) * 100)}% completo
					</Text>
				</View>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={{ marginBottom: 8 }}>
					<Text style={styles.sectionTitle}>Características del Vehículo</Text>
					<Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 }}>
						Agrega los detalles técnicos de tu auto
					</Text>
				</View>

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
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
							{formData.tipo && (
								<View style={[styles.previewBadge, { marginRight: 8, marginBottom: 8 }]}>
										<Ionicons name="car-sport" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.tipo}</Text>
									</View>
								)}
								{formData.transmision && (
									<View style={[styles.previewBadge, { marginRight: 8, marginBottom: 8 }]}>
										<Ionicons name="settings" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.transmision}</Text>
									</View>
								)}
								{formData.combustible && (
									<View style={[styles.previewBadge, { marginRight: 8, marginBottom: 8 }]}>
										<Ionicons name="flash" size={12} color="#6B7280" />
										<Text style={styles.previewPlate}>{formData.combustible}</Text>
									</View>
								)}
								{formData.pasajeros && (
									<View style={[styles.previewBadge, { marginBottom: 8 }]}>
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

				{/* Kilometraje */}
				<View style={styles.inputGroup}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						<Text style={styles.label}>Kilometraje actual (km) *</Text>
						<Ionicons name="speedometer-outline" size={18} color="#6B7280" />
					</View>
					<TextInput
						style={[styles.input, touched.kilometraje && errors.kilometraje ? styles.inputError : formData.kilometraje && !errors.kilometraje ? styles.inputSuccess : {}]}
						placeholder="Ej: 50,000"
						value={formData.kilometraje}
						onChangeText={(km) => {
							const formatted = km.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
							handleFieldChange('kilometraje', formatted);
						}}
						onBlur={() => handleFieldBlur('kilometraje')}
						keyboardType="numeric"
						placeholderTextColor="#9CA3AF"
					/>
					{touched.kilometraje && errors.kilometraje ? (
						<View style={styles.errorContainer}>
							<Ionicons name="alert-circle" size={14} color="#DC2626" />
							<Text style={styles.errorText}>{errors.kilometraje}</Text>
						</View>
					) : formData.kilometraje && !errors.kilometraje ? (
						<View style={styles.successContainer}>
							<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
							<Text style={styles.successText}>Kilometraje registrado</Text>
						</View>
					) : null}
				</View>

				{/* Condición */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Condición del Vehículo *</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
						{CONDICIONES.map((cond) => (
							<TouchableOpacity
								key={cond.value}
								style={[
									{
										width: '48%',
										backgroundColor: formData.condicion === cond.value ? '#EFF6FF' : 'white',
										borderWidth: 2,
										borderColor: formData.condicion === cond.value ? '#0B729D' : '#E5E7EB',
										borderRadius: 12,
										padding: 12,
										marginRight: '2%',
										marginBottom: 12,
									}
								]}
								onPress={() => setFormData({ ...formData, condicion: cond.value })}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
									<Ionicons name={cond.icon} size={20} color={formData.condicion === cond.value ? '#0B729D' : '#6B7280'} />
									<Text style={{ fontSize: 14, fontWeight: '700', color: formData.condicion === cond.value ? '#0B729D' : '#374151', marginLeft: 6 }}>
										{cond.label}
									</Text>
								</View>
								<Text style={{ fontSize: 11, color: '#6B7280' }}>{cond.desc}</Text>
								{formData.condicion === cond.value && (
									<View style={{ position: 'absolute', top: 8, right: 8 }}>
										<Ionicons name="checkmark-circle" size={20} color="#0B729D" />
									</View>
								)}
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Color */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Color (opcional)</Text>
				<ColorPicker
					selectedColor={formData.color}
					onSelectColor={(color) => setFormData({ ...formData, color })}
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
			</KeyboardAvoidingView>
		</View>
	);
}
