import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StatusBar,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { db, functions } from '../../../../FirebaseConfig';
import { StepIndicator } from '../../../components/StepIndicator';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { decodeVin, isValidVinFormat, mapMakeToMarca } from '../../../services/vin';
import { styles } from './styles';

const MARCAS = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Mitsubishi', 'Jeep'];

// Base de datos de modelos populares por marca
const MODELOS_POR_MARCA: { [key: string]: string[] } = {
	Toyota: ['Corolla', 'RAV4', 'Camry', 'Hilux', 'Yaris', 'Fortuner', 'Land Cruiser', 'Prado'],
	Honda: ['Civic', 'CR-V', 'Accord', 'HR-V', 'Fit', 'Pilot', 'City'],
	Nissan: ['Sentra', 'Versa', 'X-Trail', 'Kicks', 'Altima', 'Frontier', 'Pathfinder'],
	Mazda: ['Mazda3', 'CX-5', 'CX-3', 'CX-9', 'Mazda6', 'MX-5'],
	Hyundai: ['Elantra', 'Tucson', 'Accent', 'Santa Fe', 'Kona', 'Creta', 'i10'],
	Kia: ['Sportage', 'Rio', 'Sorento', 'Seltos', 'Forte', 'Picanto', 'Soul'],
	Ford: ['Escape', 'Explorer', 'F-150', 'Ranger', 'Focus', 'Mustang', 'Bronco'],
	Chevrolet: ['Spark', 'Sail', 'Cruze', 'Tracker', 'Equinox', 'Silverado', 'Trailblazer'],
	Volkswagen: ['Jetta', 'Tiguan', 'Golf', 'Passat', 'Polo', 'T-Cross', 'Amarok'],
	Mitsubishi: ['Outlander', 'ASX', 'Montero', 'L200', 'Mirage', 'Eclipse Cross'],
	Jeep: ['Wrangler', 'Grand Cherokee', 'Compass', 'Renegade', 'Cherokee', 'Gladiator'],
};

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

	const [showTooltip, setShowTooltip] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [showYearPicker, setShowYearPicker] = useState(false);
	const [showModeloSuggestions, setShowModeloSuggestions] = useState(false);
	const [modeloSuggestions, setModeloSuggestions] = useState<string[]>([]);
	const [checkingPlaca, setCheckingPlaca] = useState(false);
	const [placaDuplicada, setPlacaDuplicada] = useState(false);
	
	// Draft recovery modal
	const [showDraftRecoveryModal, setShowDraftRecoveryModal] = useState(false);
	const [draftData, setDraftData] = useState<{ step1: any; timestamp: string } | null>(null);
	
	// VIN scanning states
	const [scanningVin, setScanningVin] = useState(false);
	const [showVinModal, setShowVinModal] = useState(false);
	const [vinData, setVinData] = useState<{
		vin: string;
		marca: string;
		modelo: string;
		anio: string;
	} | null>(null);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const progressAnim = useRef(new Animated.Value(0)).current;

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i);

	const [showManualVin, setShowManualVin] = useState(false);
	const [manualVin, setManualVin] = useState('');

	// Cargar borrador y mostrar modal de recuperación
	useEffect(() => {
		const loadDraft = async () => {
			try {
				const draft = await AsyncStorage.getItem('@add_vehicle_draft');
				if (draft) {
					const parsed = JSON.parse(draft);
					if (parsed.step1 && Object.keys(parsed.step1).length > 0) {
						// Verificar si el draft es reciente (menos de 7 días)
						const draftDate = new Date(parsed.timestamp);
						const daysSinceDraft = (Date.now() - draftDate.getTime()) / (1000 * 60 * 60 * 24);
						
						if (daysSinceDraft < 7) {
							// Mostrar modal de recuperación
							setDraftData(parsed);
							setShowDraftRecoveryModal(true);
						} else {
							// Borrador muy antiguo, eliminarlo
							await AsyncStorage.removeItem('@add_vehicle_draft');
						}
					}
				}
			} catch (error) {
				console.log('Error loading draft:', error);
			}
		};
		loadDraft();
	}, []);

	const handleRecoverDraft = () => {
		if (draftData && draftData.step1) {
			setFormData(draftData.step1);
			setLastSaved(new Date(draftData.timestamp));
			setShowDraftRecoveryModal(false);
			Alert.alert('Borrador recuperado', 'Tus datos han sido restaurados. Puedes continuar donde lo dejaste.');
		}
	};

	const handleDiscardDraft = async () => {
		try {
			await AsyncStorage.removeItem('@add_vehicle_draft');
			setDraftData(null);
			setShowDraftRecoveryModal(false);
		} catch (error) {
			console.log('Error discarding draft:', error);
		}
	};

	// Animación de entrada
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, slideAnim]);

	// Animar progreso
	useEffect(() => {
		const completedFields = Object.values(formData).filter(Boolean).length;
		const progress = (completedFields / 4) * 0.25;
		Animated.spring(progressAnim, {
			toValue: progress,
			friction: 8,
			useNativeDriver: false,
		}).start();
	}, [formData, progressAnim]);

	// Actualizar sugerencias de modelo cuando cambia la marca
	useEffect(() => {
		if (formData.marca && MODELOS_POR_MARCA[formData.marca]) {
			setModeloSuggestions(MODELOS_POR_MARCA[formData.marca]);
		} else {
			setModeloSuggestions([]);
		}
	}, [formData.marca]);

	// Validar placa duplicada en Firestore
	const checkPlacaDuplicada = async (placa: string) => {
		if (!placa || placa.length < 6) return;
		setCheckingPlaca(true);
		try {
			const vehiclesRef = collection(db, 'vehicles');
			const q = query(vehiclesRef, where('placa', '==', placa.toUpperCase()));
			const snapshot = await getDocs(q);
			setPlacaDuplicada(!snapshot.empty);
			if (!snapshot.empty) {
				setErrors(prev => ({ ...prev, placa: 'Esta placa ya está registrada' }));
			}
		} catch (error) {
			console.log('Error checking placa:', error);
		} finally {
			setCheckingPlaca(false);
		}
	};

	// Autoguardado
	const saveDraft = async () => {
		if (!formData.marca && !formData.modelo) return;
		setIsSaving(true);
		try {
			const draft = {
				step1: formData,
				timestamp: new Date().toISOString(),
			};
			await AsyncStorage.setItem('@add_vehicle_draft', JSON.stringify(draft));
			setLastSaved(new Date());
		} catch (error) {
			console.log('Error saving draft:', error);
		} finally {
			setTimeout(() => setIsSaving(false), 500);
		}
	};

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
				// Validación para placas de El Salvador (P 123-456, P123456, A 123-456)
				// Acepta: Letra(s) + Espacio/Guion opcional + Números
				const placaRegex = /^[A-Z]{1,2}\s?-?\s?[0-9]{3,6}$/;
				if (!placaRegex.test(value.trim().toUpperCase())) return 'Formato inválido (Ej: P 123-456)';
				if (placaDuplicada) return 'Esta placa ya está registrada';
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

		// Verificar placa duplicada después de 1 segundo
		if (field === 'placa' && value.length >= 6) {
			const timeoutId = setTimeout(() => {
				checkPlacaDuplicada(value);
			}, 1000);
			return () => clearTimeout(timeoutId);
		}

		// Mostrar sugerencias de modelo al escribir
		if (field === 'modelo' && value && formData.marca) {
			const filtered = modeloSuggestions.filter(m => 
				m.toLowerCase().includes(value.toLowerCase())
			);
			setShowModeloSuggestions(filtered.length > 0 && value.length > 0);
		} else if (field === 'modelo') {
			setShowModeloSuggestions(false);
		}
	};

	const handleFieldBlur = (field: string) => {
		setTouched({ ...touched, [field]: true });
		const error = validateField(field, formData[field as keyof typeof formData]);
		setErrors({ ...errors, [field]: error });
	};

	// VIN Scanning Handlers
	const validateVinChecksum = (vin: string): boolean => {
		// Validación de VIN usando algoritmo de checksum (dígito de verificación)
		const transliterate = 'ABCDEFGHJKLMNPRSTUVWXYZ';
		const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
		const transliterationTable: { [key: string]: number } = {
			'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
			'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
			'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
		};

		let sum = 0;
		for (let i = 0; i < 17; i++) {
			const char = vin.charAt(i);
			let value: number;

			if (!isNaN(parseInt(char))) {
				value = parseInt(char);
			} else if (transliterationTable[char]) {
				value = transliterationTable[char];
			} else {
				return false; // Carácter inválido
			}

			sum += value * weights[i];
		}

		const checkDigit = sum % 11;
		const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();
		
		return vin.charAt(8) === expectedChar;
	};

	const isVinFormatValid = (vin: string): { valid: boolean; error?: string } => {
		// Longitud exacta de 17 caracteres
		if (vin.length !== 17) {
			return { valid: false, error: 'El VIN debe tener exactamente 17 caracteres' };
		}

		// Solo letras mayúsculas y números
		if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
			return { valid: false, error: 'VIN contiene caracteres inválidos. No se permiten I, O, Q' };
		}

		// Validar checksum
		if (!validateVinChecksum(vin)) {
			return { valid: false, error: 'El dígito de verificación del VIN no es válido' };
		}

		return { valid: true };
	};

	const handleManualVinSubmit = async () => {
		if (!manualVin || manualVin.length < 17) {
			Alert.alert('Error', 'El VIN debe tener 17 caracteres');
			return;
		}

		const vinUpper = manualVin.toUpperCase();
		
		// Validar formato y checksum
		const validation = isVinFormatValid(vinUpper);
		if (!validation.valid) {
			Alert.alert('VIN Inválido', validation.error || 'El VIN no es válido');
			return;
		}
		
		setScanningVin(true);
		try {
			// Decode VIN to get vehicle info
			const vehicleInfo = await decodeVin(vinUpper);

			if (!vehicleInfo) {
				Alert.alert(
					'No se pudo decodificar',
					'El VIN es válido pero no se encontró información del vehículo. Podrás ingresar los datos manualmente.',
					[
						{ text: 'Cancelar', style: 'cancel' },
						{ 
							text: 'Continuar sin VIN', 
							onPress: () => {
								setManualVin('');
								setShowManualVin(false);
							}
						}
					]
				);
				setScanningVin(false);
				return;
			}

			// Map to local MARCAS
			const mappedMarca = mapMakeToMarca(vehicleInfo.marca);

			// Store VIN data
			setVinData({
				vin: vinUpper,
				marca: mappedMarca,
				modelo: vehicleInfo.modelo,
				anio: vehicleInfo.anio,
			});

			// Show confirmation modal
			setShowVinModal(true);
		} catch (error) {
			console.error('Error processing manual VIN:', error);
			Alert.alert('Error', 'Hubo un problema al procesar el VIN. Intenta de nuevo.');
		} finally {
			setScanningVin(false);
		}
	};

	const handleScanVin = async () => {
		try {
			// Request camera permissions
			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			
			if (status !== 'granted') {
				Alert.alert(
					'Permiso necesario',
					'Necesitamos acceso a la cámara para escanear el VIN.',
					[{ text: 'OK' }]
				);
				return;
			}

			setScanningVin(true);

			// Launch camera
			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ['images'],
				quality: 0.8,
				base64: true,
				allowsEditing: false,
			});

			if (result.canceled || !result.assets?.[0]) {
				setScanningVin(false);
				return;
			}

			const asset = result.assets[0];
			
			if (!asset.base64) {
				Alert.alert('Error', 'No se pudo procesar la imagen');
				setScanningVin(false);
				return;
			}

			// Call Firebase Function for OCR
			const detectVinFunction = httpsCallable(functions, 'detectVin');
			const response = await detectVinFunction({ imageBase64: asset.base64 });
			
			const data = response.data as {
				success: boolean;
				vin?: string;
				confidence?: number;
				error?: string;
			};

			if (!data.success || !data.vin) {
				Alert.alert(
					'VIN no detectado',
					data.error || 'No se pudo leer el VIN. Intenta de nuevo con mejor iluminación.',
					[{ text: 'OK' }]
				);
				setScanningVin(false);
				return;
			}

			const vinUpper = data.vin.toUpperCase();

			// Validate VIN format and checksum
			const validation = isVinFormatValid(vinUpper);
			if (!validation.valid) {
				Alert.alert(
					'VIN inválido',
					validation.error || 'El VIN detectado no es válido. Intenta ingresarlo manualmente.',
					[
						{ text: 'Cancelar', style: 'cancel' },
						{ text: 'Ingresar manualmente', onPress: () => setShowManualVin(true) }
					]
				);
				setScanningVin(false);
				return;
			}

			// Decode VIN to get vehicle info
			const vehicleInfo = await decodeVin(vinUpper);

			if (!vehicleInfo) {
				Alert.alert(
					'No se pudo decodificar',
					'El VIN es válido pero no se encontró información del vehículo.',
					[{ text: 'OK' }]
				);
				setScanningVin(false);
				return;
			}

			// Map to local MARCAS
			const mappedMarca = mapMakeToMarca(vehicleInfo.marca);

			// Store VIN data
			setVinData({
				vin: vinUpper,
				marca: mappedMarca,
				modelo: vehicleInfo.modelo,
				anio: vehicleInfo.anio,
			});

			// Show confirmation modal
			setShowVinModal(true);
			setScanningVin(false);

		} catch (error: any) {
			console.error('Error scanning VIN:', error);
			Alert.alert(
				'Error',
				'Hubo un problema al escanear el VIN: ' + (error.message || 'Intenta de nuevo'),
				[{ text: 'OK' }]
			);
			setScanningVin(false);
		}
	};

	const handleConfirmVin = () => {
		if (!vinData) return;

		// Auto-fill form data
		setFormData({
			marca: vinData.marca,
			modelo: vinData.modelo,
			anio: vinData.anio,
			placa: formData.placa, // Keep current placa if any
		});

		// Clear errors
		setErrors({
			marca: '',
			modelo: '',
			anio: '',
			placa: errors.placa, // Keep placa error if any
		});

		// Mark fields as touched
		setTouched({
			marca: true,
			modelo: true,
			anio: true,
			placa: touched.placa,
		});

		// Close modal
		setShowVinModal(false);
		setVinData(null);

		// Show success message
		Alert.alert(
			'VIN detectado',
			'Los datos del vehículo se llenaron automáticamente. Verifica que sean correctos.',
			[{ text: 'OK' }]
		);
	};

	const handleCancelVin = () => {
		setShowVinModal(false);
		setVinData(null);
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
					<Text style={styles.headerTitle}>Nuevo Vehículo</Text>
					<Text style={styles.headerSubtitle}>Información básica</Text>
				</View>
				<TouchableOpacity 
					style={styles.backButton}
					onPress={() => setShowTooltip(!showTooltip)}
				>
					<Ionicons name="help-circle-outline" size={24} color="#0B729D" />
				</TouchableOpacity>
			</View>

			{/* Step Indicator */}
			<StepIndicator 
				currentStep={1} 
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
						Paso 1 • {Math.round((Object.values(formData).filter(Boolean).length / 4) * 100)}% completo
					</Text>
				</View>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Animated.View
						style={{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						}}
					>
						<View style={{ marginBottom: 8 }}>
							<Text style={styles.sectionTitle}>¿Qué auto vas a rentar?</Text>
							<Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 }}>
								Completa la información básica de tu vehículo
							</Text>
						</View>

						{/* VIN Scanner Button */}
						<View style={{ marginBottom: 20 }}>
							<TouchableOpacity
								style={{
									backgroundColor: '#F0F9FF',
									borderWidth: 1,
									borderColor: '#0B729D',
									borderRadius: 12,
									padding: 16,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									borderStyle: 'dashed',
									marginBottom: 12,
								}}
								onPress={handleScanVin}
								disabled={scanningVin}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
									<View
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: '#0B729D',
											alignItems: 'center',
											justifyContent: 'center',
											marginRight: 12,
										}}
									>
										{scanningVin ? (
											<ActivityIndicator size="small" color="#FFF" />
										) : (
											<Ionicons name="camera" size={20} color="#FFF" />
										)}
									</View>
									<View style={{ flex: 1 }}>
										<Text style={{ fontSize: 16, fontWeight: '600', color: '#032B3C', marginBottom: 2 }}>
											{scanningVin ? 'Procesando...' : 'Escanear VIN'}
										</Text>
										<Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 16 }}>
											Auto-completa los datos con una foto del VIN
										</Text>
									</View>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#0B729D" />
							</TouchableOpacity>

							{!showManualVin ? (
								<TouchableOpacity 
									onPress={() => setShowManualVin(true)}
									style={{ alignSelf: 'center', padding: 8 }}
								>
									<Text style={{ color: '#0B729D', fontWeight: '600', fontSize: 14 }}>
										O ingresa el VIN manualmente
									</Text>
								</TouchableOpacity>
							) : (
								<View style={{ marginTop: 8 }}>
									<View style={{ flexDirection: 'row', gap: 8 }}>
										<TextInput
											style={[styles.input, { flex: 1, textTransform: 'uppercase' }]}
											placeholder="Ingresa los 17 caracteres del VIN"
											value={manualVin}
											onChangeText={setManualVin}
											maxLength={17}
											autoCapitalize="characters"
										/>
										<TouchableOpacity
											style={{
												backgroundColor: '#0B729D',
												borderRadius: 12,
												paddingHorizontal: 16,
												justifyContent: 'center',
												alignItems: 'center',
												opacity: manualVin.length === 17 ? 1 : 0.5
											}}
											onPress={handleManualVinSubmit}
											disabled={manualVin.length !== 17 || scanningVin}
										>
											{scanningVin ? (
												<ActivityIndicator color="white" size="small" />
											) : (
												<Ionicons name="arrow-forward" size={24} color="white" />
											)}
										</TouchableOpacity>
									</View>
									<TouchableOpacity 
										onPress={() => setShowManualVin(false)}
										style={{ alignSelf: 'flex-end', marginTop: 4 }}
									>
										<Text style={{ color: '#6B7280', fontSize: 12 }}>Cancelar</Text>
									</TouchableOpacity>
								</View>
							)}
						</View>

						{/* Tooltip */}
						{showTooltip && (
							<View style={styles.tooltipCard}>
								<Ionicons name="information-circle" size={20} color="#0B729D" />
								<Text style={styles.tooltipText}>
									Los datos correctos ayudarán a los arrendatarios a encontrar tu auto más fácilmente en las búsquedas.
								</Text>
							</View>
						)}

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
									onPress={() => {
										setFormData({ ...formData, marca, modelo: '' });
										setShowModeloSuggestions(true);
									}}
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
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						<Text style={styles.label}>Modelo *</Text>
						{formData.marca && modeloSuggestions.length > 0 && (
							<TouchableOpacity onPress={() => setShowModeloSuggestions(!showModeloSuggestions)}>
								<Text style={{ fontSize: 12, color: '#0B729D', fontWeight: '600' }}>
									{showModeloSuggestions ? 'Ocultar' : 'Ver'} sugerencias
								</Text>
							</TouchableOpacity>
						)}
					</View>
					<TextInput
						style={[styles.input, touched.modelo && errors.modelo ? styles.inputError : formData.modelo && !errors.modelo ? styles.inputSuccess : {}]}
						placeholder={formData.marca ? `Ej: ${modeloSuggestions[0] || 'Corolla'}` : "Ej: Corolla, Civic, Sentra"}
						value={formData.modelo}
						onChangeText={(modelo) => handleFieldChange('modelo', modelo)}
						onBlur={() => handleFieldBlur('modelo')}
						onFocus={() => formData.marca && setShowModeloSuggestions(true)}
						placeholderTextColor="#9CA3AF"
					/>
					{showModeloSuggestions && modeloSuggestions.length > 0 && (
						<View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
							<Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, fontWeight: '600' }}>Modelos populares de {formData.marca}:</Text>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
								{modeloSuggestions.map((modelo) => (
									<TouchableOpacity
										key={modelo}
										style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#D1D5DB' }}
										onPress={() => {
											setFormData({ ...formData, modelo });
											setTouched({ ...touched, modelo: true });
											setErrors({ ...errors, modelo: '' });
											setShowModeloSuggestions(false);
										}}
									>
										<Text style={{ fontSize: 13, color: '#374151' }}>{modelo}</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}
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
				</View>
				
				{/* Año y Placa */}
				<View style={styles.row}>
					<View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
						<Text style={styles.label}>Año *</Text>
						<TouchableOpacity
							style={[styles.input, { justifyContent: 'center' }, touched.anio && errors.anio ? styles.inputError : formData.anio && !errors.anio ? styles.inputSuccess : {}]}
							onPress={() => setShowYearPicker(true)}
						>
							<Text style={{ color: formData.anio ? '#374151' : '#9CA3AF', fontSize: 16 }}>
								{formData.anio || currentYear.toString()}
							</Text>
							<Ionicons name="chevron-down" size={20} color="#6B7280" style={{ position: 'absolute', right: 12 }} />
						</TouchableOpacity>
						{touched.anio && errors.anio ? (
							<Text style={styles.errorTextSmall}>{errors.anio}</Text>
						) : null}
					</View>
					<View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
						<Text style={styles.label}>Placa *</Text>
						<View style={{ position: 'relative' }}>
							<TextInput
								style={[styles.input, touched.placa && errors.placa ? styles.inputError : formData.placa && !errors.placa && !placaDuplicada ? styles.inputSuccess : {}]}
								placeholder="ABC-1234"
								value={formData.placa}
								onChangeText={(placa) => {
									setPlacaDuplicada(false);
									handleFieldChange('placa', placa.toUpperCase());
								}}
								onBlur={() => handleFieldBlur('placa')}
								autoCapitalize="characters"
								maxLength={10}
								placeholderTextColor="#9CA3AF"
							/>
							{checkingPlaca && (
								<View style={{ position: 'absolute', right: 12, top: 14 }}>
									<Text style={{ fontSize: 12, color: '#6B7280' }}>Verificando...</Text>
								</View>
							)}
						</View>
						{touched.placa && errors.placa ? (
							<Text style={styles.errorTextSmall}>{errors.placa}</Text>
						) : formData.placa && !errors.placa && !placaDuplicada ? (
							<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
								<Ionicons name="checkmark-circle" size={14} color="#16A34A" />
								<Text style={{ fontSize: 11, color: '#16A34A', marginLeft: 4 }}>Placa disponible</Text>
							</View>
						) : null}
					</View>
					</View>

					<View style={{ height: 100 }} />
			</Animated.View>
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

			{/* Year Picker Modal */}
			<Modal
				visible={showYearPicker}
				transparent
				animationType="slide"
				onRequestClose={() => setShowYearPicker(false)}
			>
				<View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
							<Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>Selecciona el Año</Text>
							<TouchableOpacity onPress={() => setShowYearPicker(false)}>
								<Ionicons name="close" size={28} color="#6B7280" />
							</TouchableOpacity>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							{years.map((year) => (
								<TouchableOpacity
									key={year}
									style={{
										padding: 16,
										borderBottomWidth: 1,
										borderBottomColor: '#F3F4F6',
										backgroundColor: formData.anio === year.toString() ? '#EFF6FF' : 'white',
									}}
									onPress={() => {
										setFormData({ ...formData, anio: year.toString() });
										setTouched({ ...touched, anio: true });
										setErrors({ ...errors, anio: '' });
										setShowYearPicker(false);
									}}
								>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
										<Text style={{ fontSize: 16, color: formData.anio === year.toString() ? '#0B729D' : '#374151', fontWeight: formData.anio === year.toString() ? '600' : '400' }}>
											{year}
										</Text>
										{formData.anio === year.toString() && (
											<Ionicons name="checkmark-circle" size={24} color="#0B729D" />
										)}
									</View>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Draft Recovery Modal */}
			<Modal
				visible={showDraftRecoveryModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDraftRecoveryModal(false)}
			>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
					<View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, margin: 20, maxWidth: 400, width: '90%' }}>
						{/* Icon */}
						<View style={{ alignItems: 'center', marginBottom: 16 }}>
							<View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
								<Ionicons name="document-text" size={40} color="#0B729D" />
							</View>
							<Text style={{ fontSize: 22, fontWeight: '800', color: '#032B3C', textAlign: 'center', marginBottom: 8 }}>
								Borrador Encontrado
							</Text>
							<Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
								Encontramos un borrador guardado de un vehículo que estabas agregando.
							</Text>
						</View>

						{/* Draft Info */}
						{draftData && draftData.step1 && (
							<View style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 20 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
									<Ionicons name="time-outline" size={16} color="#6B7280" />
									<Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
										Guardado: {new Date(draftData.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
									</Text>
								</View>
								{draftData.step1.marca && (
									<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
										<Ionicons name="car-sport" size={16} color="#0B729D" />
										<Text style={{ fontSize: 14, color: '#032B3C', marginLeft: 6, fontWeight: '600' }}>
											{draftData.step1.marca} {draftData.step1.modelo} {draftData.step1.anio}
										</Text>
									</View>
								)}
								{draftData.step1.placa && (
									<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
										<Ionicons name="card" size={16} color="#6B7280" />
										<Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
											Placa: {draftData.step1.placa}
										</Text>
									</View>
								)}
							</View>
						)}

						{/* Actions */}
						<View style={{ gap: 12 }}>
							<TouchableOpacity
								style={{
									backgroundColor: '#0B729D',
									padding: 16,
									borderRadius: 12,
									alignItems: 'center',
									flexDirection: 'row',
									justifyContent: 'center',
								}}
								onPress={handleRecoverDraft}
							>
								<Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
								<Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
									Recuperar Borrador
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									backgroundColor: '#F3F4F6',
									padding: 16,
									borderRadius: 12,
									alignItems: 'center',
								}}
								onPress={handleDiscardDraft}
							>
								<Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280' }}>
									Comenzar Desde Cero
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* VIN Confirmation Modal */}
			<Modal
				visible={showVinModal}
				transparent
				animationType="fade"
				onRequestClose={handleCancelVin}
			>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
					<View style={{ 
						backgroundColor: 'white', 
						borderRadius: 20, 
						padding: 24, 
						width: '85%',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.3,
						shadowRadius: 8,
						elevation: 8,
					}}>
						<View style={{ alignItems: 'center', marginBottom: 20 }}>
							<View style={{ 
								width: 60, 
								height: 60, 
								borderRadius: 30, 
								backgroundColor: '#DCFCE7', 
								alignItems: 'center', 
								justifyContent: 'center',
								marginBottom: 12 
							}}>
								<Ionicons name="checkmark-circle" size={36} color="#16A34A" />
							</View>
							<Text style={{ fontSize: 20, fontWeight: '700', color: '#032B3C', marginBottom: 4 }}>
								VIN Detectado
							</Text>
							<Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
								Confirma que los datos sean correctos
							</Text>
						</View>

						{vinData && (
							<View style={{ 
								backgroundColor: '#F9FAFB', 
								borderRadius: 12, 
								padding: 16, 
								marginBottom: 20,
								borderWidth: 1,
								borderColor: '#E5E7EB',
							}}>
								<View style={{ marginBottom: 12 }}>
									<Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>VIN</Text>
									<Text style={{ fontSize: 14, fontWeight: '600', color: '#032B3C', fontFamily: 'monospace' }}>
										{vinData.vin}
									</Text>
								</View>
								<View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
								<View style={{ marginBottom: 8 }}>
									<Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Marca</Text>
									<Text style={{ fontSize: 16, fontWeight: '600', color: '#032B3C' }}>
										{vinData.marca}
									</Text>
								</View>
								<View style={{ marginBottom: 8 }}>
									<Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Modelo</Text>
									<Text style={{ fontSize: 16, fontWeight: '600', color: '#032B3C' }}>
										{vinData.modelo}
									</Text>
								</View>
								<View>
									<Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Año</Text>
									<Text style={{ fontSize: 16, fontWeight: '600', color: '#032B3C' }}>
										{vinData.anio}
									</Text>
								</View>
							</View>
						)}

						<View style={{ flexDirection: 'row', gap: 12 }}>
							<TouchableOpacity
								style={{
									flex: 1,
									backgroundColor: '#F3F4F6',
									padding: 14,
									borderRadius: 12,
									alignItems: 'center',
								}}
								onPress={handleCancelVin}
							>
								<Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
									Cancelar
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									flex: 1,
									backgroundColor: '#0B729D',
									padding: 14,
									borderRadius: 12,
									alignItems: 'center',
								}}
								onPress={handleConfirmVin}
							>
								<Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
									Confirmar
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
