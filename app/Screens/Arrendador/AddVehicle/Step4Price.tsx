import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../../context/Auth';
import LocationPicker from '../../../components/LocationPicker';
import { StepIndicator } from '../../../components/StepIndicator';
import { VehiclePreview } from '../../../components/VehiclePreview';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { addVehicle } from '../../../services/vehicles';
import { calculateSuggestedPrice, comparePriceToMarket } from '../../../utils/priceCalculator';
import { generateSuggestedDescription } from '../../../utils/vehicleSuggestions';
import { styles } from './styles';


const localStyles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#032B3C'
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8
    },
    priceSymbol: {
        fontSize: 24,
        fontWeight: '600',
        color: '#9CA3AF',
        marginRight: 4
    },
    priceInput: {
        fontSize: 36,
        fontWeight: '800',
        color: '#032B3C',
        minWidth: 80,
        textAlign: 'center'
    }
});

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep4Price'>;

export default function Step4Price() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { user } = useAuth();
	const { vehicleData } = route.params || {};
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const successScale = useRef(new Animated.Value(0)).current;

	const [suggestedPrice, setSuggestedPrice] = useState<{
		min: number;
		max: number;
		suggested: number;
		confidence: string;
		factors: string[];
	} | null>(null);

	const [priceComparison, setPriceComparison] = useState<{
		status: 'low' | 'competitive' | 'high';
		message: string;
		percentage: number;
	} | null>(null);

	const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);
	const [suggestedDescriptionText, setSuggestedDescriptionText] = useState('');

	// Disponibilidad
	const [availableFrom, setAvailableFrom] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [blockedDates, setBlockedDates] = useState<string[]>([]);
	const [showCalendarModal, setShowCalendarModal] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

    const getFormattedDate = (date: Date, day: number) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };

	const toggleDateBlock = (day: number) => {
		const dateStr = getFormattedDate(currentMonth, day);
		setBlockedDates(prev => 
			prev.includes(dateStr) 
				? prev.filter(d => d !== dateStr)
				: [...prev, dateStr]
		);
	};

	const changeMonth = (increment: number) => {
		const newDate = new Date(currentMonth);
		newDate.setMonth(newDate.getMonth() + increment);
		setCurrentMonth(newDate);
	};

	// Planes de Protección
	const [protectionPlan, setProtectionPlan] = useState<'basic' | 'standard' | 'premium'>('standard');
	const PROTECTION_PLANS = {
		basic: { name: 'Básico', commission: 20, deductible: 3000, desc: 'Mayor ganancia, mayor riesgo' },
		standard: { name: 'Estándar', commission: 25, deductible: 1000, desc: 'Balance ideal (Recomendado)' },
		premium: { name: 'Premium', commission: 35, deductible: 0, desc: 'Menor ganancia, cero riesgo' }
	};

	// Horarios
	const [flexibleHours, setFlexibleHours] = useState(true);
	const [deliveryHours, setDeliveryHours] = useState('9:00 AM - 8:00 PM');
	const [airportDelivery, setAirportDelivery] = useState(false);
	const [airportFee, setAirportFee] = useState('25');

	// Condiciones de Renta
	const [mileageLimit, setMileageLimit] = useState<'unlimited' | 'limited'>('unlimited');
	const [dailyKm, setDailyKm] = useState('200');
	const [advanceNotice, setAdvanceNotice] = useState('12'); // horas
	const [minTripDuration, setMinTripDuration] = useState('1'); // días
	const [maxTripDuration, setMaxTripDuration] = useState('30'); // días

	// Reglas
	const [rules, setRules] = useState({
		petsAllowed: false,
		smokingAllowed: false,
		outOfCityAllowed: true,
	});

	// Descuentos
	const [discounts, setDiscounts] = useState({
		weekly: '5',
		monthly: '15',
	});

	// Depósito
	const [depositType, setDepositType] = useState<'auto' | 'custom'>('auto');
	const [customDeposit, setCustomDeposit] = useState('');

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

	// Calcular precio sugerido basado en datos del vehículo
	useEffect(() => {
		if (vehicleData) {
			const estimate = calculateSuggestedPrice(vehicleData);
			setSuggestedPrice(estimate);

			// Generar descripción sugerida
			const suggested = generateSuggestedDescription(vehicleData);
			setSuggestedDescriptionText(suggested);
		}
	}, [vehicleData]);

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

		// Comparar precio con el mercado
		if (field === 'precio' && value && vehicleData) {
			const precio = parseFloat(value);
			if (!isNaN(precio) && precio > 0) {
				const comparison = comparePriceToMarket(precio, vehicleData);
				setPriceComparison(comparison);
			} else {
				setPriceComparison(null);
			}
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
			
			// Calcular depósito
			const calculatedDeposit = depositType === 'auto' 
				? Math.round(precio * 2) 
				: parseFloat(customDeposit) || Math.round(precio * 2);

			const finalData = {
				...vehicleData,
				precio,
				descripcion: formData.descripcion,
				ubicacion: locationData.address,
				coordinates: locationData.coordinates,
				placeId: locationData.placeId,
				availableFrom: availableFrom.toISOString(),
				flexibleHours,
				deliveryHours,
				rules,
				discounts: {
					weekly: parseFloat(discounts.weekly) || 0,
					monthly: parseFloat(discounts.monthly) || 0,
				},
				deposit: calculatedDeposit,
			};

			await addVehicle(finalData, user.uid);

			// Mostrar animación de éxito
			setLoading(false);
			setShowSuccessModal(true);
			Animated.spring(successScale, {
				toValue: 1,
				friction: 4,
				tension: 80,
				useNativeDriver: true,
			}).start();

			// Navegar después de 2 segundos
			setTimeout(() => {
				setShowSuccessModal(false);
				navigation.navigate('HomeArrendador');
			}, 2500);
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
					<Text style={styles.headerSubtitle}>Último paso</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>
		{/* Step Indicator */}
		<StepIndicator 
			currentStep={4} 
			totalSteps={4}
			labels={['Básico', 'Specs', 'Fotos', 'Precio']}
		/>
			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '100%' }]} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<View style={{ marginBottom: 12 }}>
						<Text style={styles.sectionTitle}>¡Casi listo!</Text>
						<Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 }}>
							Establece el precio y ubicación de tu vehículo
						</Text>
					</View>

					{/* Vista Previa Live del Vehículo */}
					{vehicleData && (
						<VehiclePreview
							vehicleData={vehicleData}
							precio={formData.precio && !errors.precio ? formData.precio : undefined}
							ubicacion={locationData?.address}
							descripcion={formData.descripcion && formData.descripcion.length >= 20 ? formData.descripcion : undefined}
						/>
					)}

					{/* Precio */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="cash-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Precio por día</Text>
								<Text style={localStyles.cardSubtitle}>¿Cuánto quieres ganar?</Text>
							</View>
						</View>

						<View style={localStyles.priceInputContainer}>
							<Text style={localStyles.priceSymbol}>$</Text>
							<TextInput
								style={localStyles.priceInput}
								placeholder="0"
								value={formData.precio}
								onChangeText={(precio) => handleFieldChange('precio', precio)}
								onBlur={() => handleFieldBlur('precio')}
								keyboardType="numeric"
								placeholderTextColor="#D1D5DB"
							/>
						</View>

						{suggestedPrice && (
							<View style={{ alignItems: 'center', marginBottom: 16 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
									<Ionicons name="bulb" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
									<Text style={{ fontSize: 12, color: '#B45309', fontWeight: '600' }}>
										Sugerido: ${suggestedPrice.min} - ${suggestedPrice.max}
									</Text>
								</View>
							</View>
						)}

						{touched.precio && errors.precio ? (
							<View style={[styles.errorContainer, { justifyContent: 'center' }]}>
								<Ionicons name="alert-circle" size={14} color="#DC2626" />
								<Text style={styles.errorText}>{errors.precio}</Text>
							</View>
						) : formData.precio && !errors.precio ? (
							<>
								<View style={{ alignItems: 'center', marginBottom: 12 }}>
									<Text style={{ fontSize: 14, color: '#16A34A', fontWeight: '600' }}>
										Tu ganancia: ${(parseFloat(formData.precio) * 0.85).toFixed(2)}
									</Text>
									<Text style={{ fontSize: 12, color: '#6B7280' }}>
										(Comisión Rentik 15%)
									</Text>
								</View>
								
								{/* Indicador de comparación con mercado */}
								{priceComparison && (
									<View style={[
										styles.priceComparisonCard,
										priceComparison.status === 'low' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
										priceComparison.status === 'competitive' && { backgroundColor: '#D1FAE5', borderColor: '#16A34A' },
										priceComparison.status === 'high' && { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
									]}>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<Ionicons
											name={
												priceComparison.status === 'low' ? 'arrow-down-circle' :
												priceComparison.status === 'high' ? 'arrow-up-circle' :
												'checkmark-circle'
											}
											size={20}
											color={
												priceComparison.status === 'low' ? '#F59E0B' :
												priceComparison.status === 'high' ? '#DC2626' :
												'#16A34A'
											}
											style={{ marginRight: 8 }}
											/>
											<View style={{ flex: 1 }}>
												<Text style={[
													styles.priceComparisonTitle,
													priceComparison.status === 'low' && { color: '#F59E0B' },
													priceComparison.status === 'competitive' && { color: '#16A34A' },
													priceComparison.status === 'high' && { color: '#DC2626' },
												]}>
													{priceComparison.message}
												</Text>
											</View>
										</View>
									</View>
								)}
							</>
						) : null}
					</View>

					{/* Ubicación */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="location-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Ubicación de entrega</Text>
								<Text style={localStyles.cardSubtitle}>¿Dónde entregarás el auto?</Text>
							</View>
						</View>
						<LocationPicker
							initialLocation={locationData || undefined}
							onLocationSelected={setLocationData}
							title=""
							subtitle=""
						/>
					</View>

					{/* Descripción */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="text-outline" size={24} color="#0B729D" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={localStyles.cardTitle}>Descripción</Text>
								<Text style={localStyles.cardSubtitle}>Destaca tu vehículo</Text>
							</View>
							{!formData.descripcion && suggestedDescriptionText && (
								<TouchableOpacity
									style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}
									onPress={() => {
										setFormData({ ...formData, descripcion: suggestedDescriptionText });
										setShowDescriptionSuggestions(true);
									}}
								>
									<Ionicons name="sparkles" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
									<Text style={{ fontSize: 11, color: '#8B5CF6', fontWeight: '700' }}>
										Auto-completar
									</Text>
								</TouchableOpacity>
							)}
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
						
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
							{touched.descripcion && errors.descripcion ? (
								<Text style={styles.errorText}>{errors.descripcion}</Text>
							) : (
								<View />
							)}
							<Text 
								style={[
									styles.charCounter,
									formData.descripcion.length < 20 && styles.charCounterDanger,
									formData.descripcion.length >= 20 && formData.descripcion.length < 100 && styles.charCounterWarning,
									formData.descripcion.length >= 100 && formData.descripcion.length <= 500 && styles.charCounterSuccess,
									formData.descripcion.length > 500 && styles.charCounterDanger,
								]}
							>
								{formData.descripcion.length}/500
							</Text>
						</View>
					</View>

					{/* Disponibilidad y Calendario */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="calendar-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Disponibilidad</Text>
								<Text style={localStyles.cardSubtitle}>Gestiona tus fechas</Text>
							</View>
						</View>
						
						<TouchableOpacity
							style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								justifyContent: 'space-between',
								backgroundColor: '#F9FAFB',
								padding: 16,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: '#E5E7EB'
							}}
							onPress={() => setShowCalendarModal(true)}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
									<Ionicons name="calendar" size={20} color="#374151" />
								</View>
								<View>
									<Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>
										Abrir Calendario
									</Text>
									<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
										{blockedDates.length > 0 
											? `${blockedDates.length} días bloqueados` 
											: 'Disponible todos los días'}
									</Text>
								</View>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
						</TouchableOpacity>
					</View>

					{/* Planes de Protección */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="shield-checkmark-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Plan de Protección</Text>
								<Text style={localStyles.cardSubtitle}>Elige tu nivel de cobertura</Text>
							</View>
						</View>

						{Object.entries(PROTECTION_PLANS).map(([key, plan]) => (
							<TouchableOpacity
								key={key}
								style={{
									borderWidth: protectionPlan === key ? 2 : 1,
									borderColor: protectionPlan === key ? '#0B729D' : '#E5E7EB',
									borderRadius: 12,
									padding: 16,
									marginBottom: 12,
									backgroundColor: protectionPlan === key ? '#F0F9FF' : 'white',
									shadowColor: protectionPlan === key ? '#0B729D' : '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: protectionPlan === key ? 0.1 : 0,
									shadowRadius: 4,
									elevation: protectionPlan === key ? 2 : 0,
								}}
								onPress={() => setProtectionPlan(key as any)}
							>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
									<Text style={{ fontSize: 16, fontWeight: '700', color: '#032B3C' }}>
										Plan {plan.name}
									</Text>
									{protectionPlan === key ? (
										<Ionicons name="checkmark-circle" size={24} color="#0B729D" />
									) : (
										<View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB' }} />
									)}
								</View>
								<Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 12 }}>
									{plan.desc}
								</Text>
								<View style={{ flexDirection: 'row', gap: 16 }}>
									<View style={{ backgroundColor: protectionPlan === key ? '#E0F2FE' : '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
										<Text style={{ fontSize: 12, fontWeight: '700', color: protectionPlan === key ? '#0369A1' : '#374151' }}>
											Comisión: {plan.commission}%
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>

					{/* Horarios */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="time-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Horarios de entrega</Text>
								<Text style={localStyles.cardSubtitle}>¿Cuándo puedes entregar?</Text>
							</View>
						</View>

						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
							<View style={{ flex: 1, paddingRight: 16 }}>
								<Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Horarios flexibles</Text>
								<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
									Coordinarás directamente con el cliente
								</Text>
							</View>
							<Switch
								value={flexibleHours}
								onValueChange={setFlexibleHours}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>
						
						{!flexibleHours && (
							<View>
								<Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Horario específico</Text>
								<TextInput
									style={styles.input}
									placeholder="Ej: 9:00 AM - 8:00 PM"
									value={deliveryHours}
									onChangeText={setDeliveryHours}
									placeholderTextColor="#9CA3AF"
								/>
							</View>
						)}
					</View>
					{/* Entrega en Aeropuerto */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="airplane" size={24} color="#0B729D" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={localStyles.cardTitle}>Entrega en Aeropuerto</Text>
								<Text style={localStyles.cardSubtitle}>Ofrece entrega en Comalapa (AIES)</Text>
							</View>
							<Switch
								value={airportDelivery}
								onValueChange={setAirportDelivery}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>

						{airportDelivery && (
							<Animated.View style={{ marginTop: 8, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
								<Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' }}>Costo adicional por entrega ($)</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={{ fontSize: 18, color: '#374151', marginRight: 8, fontWeight: '600' }}>$</Text>
									<TextInput
										style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: 'white' }]}
										value={airportFee}
										onChangeText={setAirportFee}
										keyboardType="numeric"
										placeholder="25"
									/>
								</View>
								<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
									El precio promedio por entrega en aeropuerto es $20-$35
								</Text>
							</Animated.View>
						)}
					</View>

					{/* Condiciones de Renta */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="speedometer" size={24} color="#0B729D" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={localStyles.cardTitle}>Límite de Kilometraje</Text>
								<Text style={localStyles.cardSubtitle}>Define cuánto pueden conducir</Text>
							</View>
						</View>

						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
							<Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>Kilometraje Ilimitado</Text>
							<Switch
								value={mileageLimit === 'unlimited'}
								onValueChange={(val) => setMileageLimit(val ? 'unlimited' : 'limited')}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>

						{mileageLimit === 'limited' && (
							<Animated.View style={{ marginTop: 8, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
								<Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' }}>Límite diario (km)</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<TextInput
										style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: 'white' }]}
										value={dailyKm}
										onChangeText={setDailyKm}
										keyboardType="numeric"
										placeholder="200"
									/>
									<Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8 }}>km/día</Text>
								</View>
								<Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
									El exceso se cobrará automáticamente a $0.10 por km adicional.
								</Text>
							</Animated.View>
						)}
						
						<View style={localStyles.divider} />

						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="hourglass" size={24} color="#0B729D" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={localStyles.cardTitle}>Tiempo de Preaviso</Text>
								<Text style={localStyles.cardSubtitle}>Anticipación requerida</Text>
							</View>
						</View>

						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
							{['1', '3', '6', '12', '24', '48'].map((hours) => (
								<TouchableOpacity
									key={hours}
									onPress={() => setAdvanceNotice(hours)}
									style={{
										width: '30%',
										aspectRatio: 2.5,
										justifyContent: 'center',
										alignItems: 'center',
										borderRadius: 12,
										backgroundColor: advanceNotice === hours ? '#0B729D' : 'white',
										borderWidth: 1,
										borderColor: advanceNotice === hours ? '#0B729D' : '#E5E7EB',
									}}
								>
									<Text style={{ fontSize: 16, fontWeight: '700', color: advanceNotice === hours ? 'white' : '#374151' }}>{hours}h</Text>
								</TouchableOpacity>
							))}
						</View>

						<View style={localStyles.divider} />

						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="calendar" size={24} color="#0B729D" />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={localStyles.cardTitle}>Duración del Viaje</Text>
								<Text style={localStyles.cardSubtitle}>Mínimo y máximo de días</Text>
							</View>
						</View>

						<View style={{ gap: 16 }}>
							<View>
								<Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Mínimo de días</Text>
								<View style={{ flexDirection: 'row', gap: 8 }}>
									{['1', '2', '3'].map((days) => (
										<TouchableOpacity
											key={days}
											onPress={() => setMinTripDuration(days)}
											style={{
												flex: 1,
												paddingVertical: 12,
												alignItems: 'center',
												borderRadius: 10,
												backgroundColor: minTripDuration === days ? '#0B729D' : 'white',
												borderWidth: 1,
												borderColor: minTripDuration === days ? '#0B729D' : '#E5E7EB',
											}}
										>
											<Text style={{ fontWeight: '600', color: minTripDuration === days ? 'white' : '#374151' }}>{days} {days === '1' ? 'Día' : 'Días'}</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>

							<View>
								<Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Máximo de días</Text>
								<View style={{ flexDirection: 'row', gap: 8 }}>
									{['5', '15', '30'].map((days) => (
										<TouchableOpacity
											key={days}
											onPress={() => setMaxTripDuration(days)}
											style={{
												flex: 1,
												paddingVertical: 12,
												alignItems: 'center',
												borderRadius: 10,
												backgroundColor: maxTripDuration === days ? '#0B729D' : 'white',
												borderWidth: 1,
												borderColor: maxTripDuration === days ? '#0B729D' : '#E5E7EB',
											}}
										>
											<Text style={{ fontWeight: '600', color: maxTripDuration === days ? 'white' : '#374151' }}>{days} Días</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						</View>
					</View>

					{/* Reglas del vehículo */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="document-text-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Reglas del vehículo</Text>
								<Text style={localStyles.cardSubtitle}>Establece tus condiciones</Text>
							</View>
						</View>

						<View style={[styles.ruleItem, { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, marginBottom: 12 }]}>
							<View style={{ flex: 1 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="paw-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
									<Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>Mascotas permitidas</Text>
								</View>
							</View>
							<Switch
								value={rules.petsAllowed}
								onValueChange={(value) => setRules({ ...rules, petsAllowed: value })}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>
						<View style={[styles.ruleItem, { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, marginBottom: 12 }]}>
							<View style={{ flex: 1 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="ban-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
									<Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>Fumar permitido</Text>
								</View>
							</View>
							<Switch
								value={rules.smokingAllowed}
								onValueChange={(value) => setRules({ ...rules, smokingAllowed: value })}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>
						<View style={styles.ruleItem}>
							<View style={{ flex: 1 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="map-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
									<Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>Viajes fuera de la ciudad</Text>
								</View>
							</View>
							<Switch
								value={rules.outOfCityAllowed}
								onValueChange={(value) => setRules({ ...rules, outOfCityAllowed: value })}
								trackColor={{ false: '#D1D5DB', true: '#0B729D' }}
								thumbColor={'#FFFFFF'}
							/>
						</View>
					</View>

					{/* Descuentos */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="pricetag-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Descuentos (Opcional)</Text>
								<Text style={localStyles.cardSubtitle}>Atrae rentas largas</Text>
							</View>
						</View>

						<View style={{ flexDirection: 'row', marginBottom: 12 }}>
							<View style={{ flex: 1, marginRight: 8 }}>
								<Text style={{ fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 6 }}>
									Semanal (7+ días)
								</Text>
								<View style={{ position: 'relative' }}>
									<TextInput
										style={[styles.input, { paddingRight: 36 }]}
										placeholder="5"
										value={discounts.weekly}
										onChangeText={(value) => setDiscounts({ ...discounts, weekly: value })}
										keyboardType="numeric"
										maxLength={2}
										placeholderTextColor="#9CA3AF"
									/>
									<Text style={{ position: 'absolute', right: 16, top: 14, fontSize: 14, color: '#6B7280' }}>%</Text>
								</View>
							</View>
							<View style={{ flex: 1, marginLeft: 8 }}>
								<Text style={{ fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 6 }}>
									Mensual (30+ días)
								</Text>
								<View style={{ position: 'relative' }}>
									<TextInput
										style={[styles.input, { paddingRight: 36 }]}
										placeholder="15"
										value={discounts.monthly}
										onChangeText={(value) => setDiscounts({ ...discounts, monthly: value })}
										keyboardType="numeric"
										maxLength={2}
										placeholderTextColor="#9CA3AF"
									/>
									<Text style={{ position: 'absolute', right: 16, top: 14, fontSize: 14, color: '#6B7280' }}>%</Text>
								</View>
							</View>
						</View>
						{(discounts.weekly || discounts.monthly) && formData.precio && (
							<View style={{ backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' }}>
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
									<Ionicons name="information-circle" size={16} color="#0284C7" style={{ marginRight: 6 }} />
									<Text style={{ fontSize: 12, color: '#0284C7', fontWeight: '600' }}>Vista previa de precios</Text>
								</View>
								{discounts.weekly && (
									<Text style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
										• Semanal: ${(parseFloat(formData.precio) * 7 * (1 - parseFloat(discounts.weekly) / 100)).toFixed(2)} 
										{' '}(${parseFloat(formData.precio)} - {discounts.weekly}%)
									</Text>
								)}
								{discounts.monthly && (
									<Text style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
										• Mensual: ${(parseFloat(formData.precio) * 30 * (1 - parseFloat(discounts.monthly) / 100)).toFixed(2)} 
										{' '}(${parseFloat(formData.precio)} - {discounts.monthly}%)
									</Text>
								)}
							</View>
						)}
					</View>

					{/* Depósito de seguridad */}
					<View style={localStyles.card}>
						<View style={localStyles.cardHeader}>
							<View style={localStyles.cardIconContainer}>
								<Ionicons name="shield-checkmark-outline" size={24} color="#0B729D" />
							</View>
							<View>
								<Text style={localStyles.cardTitle}>Depósito de seguridad</Text>
								<Text style={localStyles.cardSubtitle}>Protección adicional</Text>
							</View>
						</View>

						<View style={{ flexDirection: 'row', marginBottom: 12, backgroundColor: '#F3F4F6', padding: 4, borderRadius: 12 }}>
							<TouchableOpacity
								style={{
									flex: 1,
									paddingVertical: 10,
									alignItems: 'center',
									borderRadius: 10,
									backgroundColor: depositType === 'auto' ? 'white' : 'transparent',
									shadowColor: depositType === 'auto' ? '#000' : 'transparent',
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: depositType === 'auto' ? 0.1 : 0,
									shadowRadius: 2,
									elevation: depositType === 'auto' ? 2 : 0,
								}}
								onPress={() => setDepositType('auto')}
							>
								<Text style={{
									fontSize: 14,
									fontWeight: '600',
									color: depositType === 'auto' ? '#032B3C' : '#6B7280'
								}}>Automático (2x)</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									flex: 1,
									paddingVertical: 10,
									alignItems: 'center',
									borderRadius: 10,
									backgroundColor: depositType === 'custom' ? 'white' : 'transparent',
									shadowColor: depositType === 'custom' ? '#000' : 'transparent',
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: depositType === 'custom' ? 0.1 : 0,
									shadowRadius: 2,
									elevation: depositType === 'custom' ? 2 : 0,
								}}
								onPress={() => setDepositType('custom')}
							>
								<Text style={{
									fontSize: 14,
									fontWeight: '600',
									color: depositType === 'custom' ? '#032B3C' : '#6B7280'
								}}>Personalizado</Text>
							</TouchableOpacity>
						</View>
						{depositType === 'custom' ? (
							<View style={{ position: 'relative' }}>
								<Text style={{ position: 'absolute', left: 16, top: 14, fontSize: 16, color: '#374151', zIndex: 1 }}>$</Text>
								<TextInput
									style={[styles.input, { paddingLeft: 30 }]}
									placeholder="Ingresa monto"
									value={customDeposit}
									onChangeText={setCustomDeposit}
									keyboardType="numeric"
									placeholderTextColor="#9CA3AF"
								/>
							</View>
						) : formData.precio ? (
							<View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }}>
								<Text style={{ fontSize: 13, color: '#16A34A', fontWeight: '600' }}>
									Depósito: ${(parseFloat(formData.precio) * 2).toFixed(2)}
								</Text>
								<Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
									Se reembolsa al terminar la renta si no hay daños
								</Text>
							</View>
						) : null}
					</View>

					<View style={{ height: 100 }} />
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Footer */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.nextButton, (!isFormValid() || loading) && styles.nextButtonDisabled]}
					onPress={() => setShowPreviewModal(true)}
					disabled={!isFormValid() || loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<>
							<Text style={styles.nextButtonText}>Ver Vista Previa</Text>
							<Ionicons name="eye-outline" size={20} color="white" />
						</>
					)}
				</TouchableOpacity>
			</View>

			{/* Modal de Vista Previa */}
			<Modal
				visible={showPreviewModal}
				animationType="slide"
				onRequestClose={() => setShowPreviewModal(false)}
			>
				<View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: Platform.OS === 'ios' ? 50 : 16 }}>
						<TouchableOpacity onPress={() => setShowPreviewModal(false)}>
							<Ionicons name="close" size={28} color="#374151" />
						</TouchableOpacity>
						<Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>Vista Previa</Text>
						<View style={{ width: 28 }} />
					</View>
					
					<ScrollView contentContainerStyle={{ padding: 16 }}>
						{/* Card de Preview */}
						<View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 24 }}>
							<Image 
								source={{ uri: vehicleData?.photos?.front || 'https://via.placeholder.com/400x250' }} 
								style={{ width: '100%', height: 220 }} 
							/>
							<View style={{ padding: 16 }}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
									<View>
										<Text style={{ fontSize: 20, fontWeight: '800', color: '#032B3C' }}>
											{vehicleData?.marca} {vehicleData?.modelo} {vehicleData?.anio}
										</Text>
										<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
											<Ionicons name="star" size={16} color="#F59E0B" />
											<Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 }}>Nuevo</Text>
											<Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 4 }}>• 0 viajes</Text>
										</View>
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text style={{ fontSize: 20, fontWeight: '700', color: '#0B729D' }}>${formData.precio}</Text>
										<Text style={{ fontSize: 12, color: '#6B7280' }}>/día</Text>
									</View>
								</View>
								
								<View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
								
								<Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 20 }} numberOfLines={3}>
									{formData.descripcion || 'Sin descripción'}
								</Text>

								<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
									<View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
										<Text style={{ fontSize: 12, color: '#374151' }}>{vehicleData?.transmision}</Text>
									</View>
									<View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
										<Text style={{ fontSize: 12, color: '#374151' }}>{vehicleData?.combustible}</Text>
									</View>
									<View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
										<Text style={{ fontSize: 12, color: '#374151' }}>{vehicleData?.pasajeros} Pasajeros</Text>
									</View>
								</View>
							</View>
						</View>

						<View style={{ backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginBottom: 24 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
								<Ionicons name="shield-checkmark" size={24} color="#0B729D" style={{ marginRight: 8 }} />
								<Text style={{ fontSize: 16, fontWeight: '700', color: '#032B3C' }}>Tu Ganancia Estimada</Text>
							</View>
							<Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 12 }}>
								Con el Plan {PROTECTION_PLANS[protectionPlan].name} ({PROTECTION_PLANS[protectionPlan].commission}% comisión):
							</Text>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8 }}>
								<Text style={{ fontSize: 16, color: '#374151' }}>Por día de renta:</Text>
								<Text style={{ fontSize: 20, fontWeight: '700', color: '#16A34A' }}>
									${(parseFloat(formData.precio || '0') * (1 - PROTECTION_PLANS[protectionPlan].commission / 100)).toFixed(2)}
								</Text>
							</View>
						</View>

						<TouchableOpacity
							style={{
								backgroundColor: '#0B729D',
								padding: 18,
								borderRadius: 12,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: 30,
								shadowColor: '#0B729D',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.3,
								shadowRadius: 8,
								elevation: 6,
							}}
							onPress={handleFinish}
						>
							<Text style={{ fontSize: 18, fontWeight: '700', color: 'white', marginRight: 8 }}>Publicar Ahora</Text>
							<Ionicons name="rocket-outline" size={24} color="white" />
						</TouchableOpacity>
					</ScrollView>
				</View>
			</Modal>

			{/* Modal de Calendario */}
			<Modal
				visible={showCalendarModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowCalendarModal(false)}
			>
				<View style={{ flex: 1, backgroundColor: 'white' }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: Platform.OS === 'ios' ? 20 : 16 }}>
						<TouchableOpacity onPress={() => setShowCalendarModal(false)}>
							<Text style={{ fontSize: 16, color: '#6B7280' }}>Cancelar</Text>
						</TouchableOpacity>
						<Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>Disponibilidad</Text>
						<TouchableOpacity onPress={() => setShowCalendarModal(false)}>
							<Text style={{ fontSize: 16, color: '#0B729D', fontWeight: '600' }}>Guardar</Text>
						</TouchableOpacity>
					</View>

					<View style={{ padding: 16 }}>
						<Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 20 }}>
							Toca los días que NO quieres rentar tu auto (días bloqueados).
						</Text>
						
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
							<TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
								<Ionicons name="chevron-back" size={24} color="#374151" />
							</TouchableOpacity>
							<Text style={{ fontSize: 18, fontWeight: '600', color: '#032B3C', textTransform: 'capitalize' }}>
								{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
							</Text>
							<TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
								<Ionicons name="chevron-forward" size={24} color="#374151" />
							</TouchableOpacity>
						</View>

						<View style={{ flexDirection: 'row', marginBottom: 10 }}>
							{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
								<Text key={day} style={{ flex: 1, textAlign: 'center', color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>{day}</Text>
							))}
						</View>

						<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
							{Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
								<View key={`empty-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />
							))}
							{Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
								const day = i + 1;
								const dateStr = getFormattedDate(currentMonth, day);
								const isBlocked = blockedDates.includes(dateStr);
								const isPast = new Date(dateStr) < new Date(new Date().setDate(new Date().getDate() - 1));

								return (
									<TouchableOpacity
										key={day}
										style={{
											width: '14.28%',
											aspectRatio: 1,
											justifyContent: 'center',
											alignItems: 'center',
											marginVertical: 2,
										}}
										onPress={() => !isPast && toggleDateBlock(day)}
										disabled={isPast}
									>
										<View style={{
											width: 36,
											height: 36,
											borderRadius: 18,
											backgroundColor: isBlocked ? '#EF4444' : 'transparent',
											justifyContent: 'center',
											alignItems: 'center',
											borderWidth: isBlocked ? 0 : 1,
											borderColor: isBlocked ? 'transparent' : '#E5E7EB',
											opacity: isPast ? 0.3 : 1
										}}>
											<Text style={{
												color: isBlocked ? 'white' : '#374151',
												fontWeight: isBlocked ? '700' : '400'
											}}>
												{day}
											</Text>
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
						
						<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 24 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 }} />
								<Text style={{ fontSize: 12, color: '#6B7280' }}>Disponible</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginRight: 8 }} />
								<Text style={{ fontSize: 12, color: '#6B7280' }}>Bloqueado</Text>
							</View>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal de Éxito */}
			<Modal
				visible={showSuccessModal}
				transparent
				animationType="fade"
			>
				<View style={styles.successModalOverlay}>
					<Animated.View style={[styles.successModalContent, { transform: [{ scale: successScale }] }]}>
						<View style={styles.successIconCircle}>
							<Ionicons name="checkmark" size={60} color="#16A34A" />
						</View>
						<Text style={styles.successModalTitle}>¡Vehículo Registrado!</Text>
						<Text style={styles.successModalText}>Tu vehículo ha sido publicado exitosamente</Text>
					</Animated.View>
				</View>
			</Modal>

			{/* DateTimePicker */}
			{showDatePicker && (
				Platform.OS === 'ios' ? (
					<Modal
						visible={showDatePicker}
						transparent
						animationType="slide"
						onRequestClose={() => setShowDatePicker(false)}
					>
						<View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
							<View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 }}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
									<TouchableOpacity onPress={() => setShowDatePicker(false)}>
										<Text style={{ fontSize: 16, color: '#6B7280' }}>Cancelar</Text>
									</TouchableOpacity>
									<Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>Selecciona Fecha</Text>
									<TouchableOpacity onPress={() => setShowDatePicker(false)}>
										<Text style={{ fontSize: 16, color: '#0B729D', fontWeight: '600' }}>Listo</Text>
									</TouchableOpacity>
								</View>
								<DateTimePicker
									value={availableFrom}
									mode="date"
									display="spinner"
									onChange={(event, selectedDate) => {
										if (selectedDate) {
											setAvailableFrom(selectedDate);
										}
									}}
									minimumDate={new Date()}
									style={{ height: 200 }}
								/>
							</View>
						</View>
					</Modal>
				) : (
					<DateTimePicker
						value={availableFrom}
						mode="date"
						display="default"
						onChange={(event, selectedDate) => {
							setShowDatePicker(false);
							if (selectedDate) {
								setAvailableFrom(selectedDate);
							}
						}}
						minimumDate={new Date()}
					/>
				)
			)}
		</View>
	);
}
