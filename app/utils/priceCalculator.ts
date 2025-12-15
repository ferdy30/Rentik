/**
 * Calculadora de precios sugeridos para vehículos en renta
 * Basado en características del vehículo
 */

interface VehicleData {
	marca?: string;
	modelo?: string;
	año?: string;
	transmision?: string;
	combustible?: string;
	puertas?: string;
	pasajeros?: string;
	caracteristicas?: string[];
}

interface PriceEstimate {
	min: number;
	max: number;
	suggested: number;
	confidence: 'low' | 'medium' | 'high';
	factors: string[];
}

// Precios base por marca (USD/día)
const BRAND_BASE_PRICES: { [key: string]: number } = {
	// Premium
	'Mercedes-Benz': 80,
	'BMW': 75,
	'Audi': 70,
	'Porsche': 150,
	'Tesla': 90,
	'Lexus': 75,
	// Mid-range
	'Honda': 35,
	'Toyota': 35,
	'Mazda': 40,
	'Nissan': 35,
	'Volkswagen': 38,
	'Hyundai': 30,
	'Kia': 30,
	'Ford': 35,
	'Chevrolet': 30,
	// Economy
	'Suzuki': 20,
	'Mitsubishi': 25,
	'Dodge': 28,
	'Kia': 25,
	'Hyundai': 25,
	'default': 30,
};

// Multiplicadores por año
const getYearMultiplier = (year: string): number => {
	const yearNum = parseInt(year);
	const currentYear = new Date().getFullYear();
	const age = currentYear - yearNum;

	if (age <= 1) return 1.3; // Modelo reciente
	if (age <= 3) return 1.15;
	if (age <= 5) return 1.0;
	if (age <= 8) return 0.9;
	if (age <= 10) return 0.8;
	return 0.7; // Más de 10 años
};

// Multiplicadores por características
const FEATURE_VALUES: { [key: string]: number } = {
	'Aire Acondicionado': 1.1,
	'GPS / Navegación': 1.08,
	'Bluetooth': 1.03,
	'Cámara de Reversa': 1.05,
	'Sensores de Parqueo': 1.05,
	'Apple CarPlay': 1.07,
	'Android Auto': 1.07,
	'Asientos de Cuero': 1.12,
	'Sunroof / Quemacocos': 1.15,
	'4x4 / AWD': 1.2,
	'Tercera Fila': 1.15,
	'Asientos Calefactables': 1.08,
	'Entrada sin Llave': 1.05,
};

// Multiplicador por transmisión
const TRANSMISSION_MULTIPLIER: { [key: string]: number } = {
	'Automática': 1.15,
	'Manual': 0.95,
	'CVT': 1.1,
};

// Multiplicador por combustible
const FUEL_MULTIPLIER: { [key: string]: number } = {
	'Eléctrico': 1.3,
	'Híbrido': 1.2,
	'Gasolina': 1.0,
	'Diésel': 1.05,
};

/**
 * Calcula el precio sugerido basado en las características del vehículo
 */
export const calculateSuggestedPrice = (vehicleData: VehicleData): PriceEstimate => {
	const factors: string[] = [];
	let basePrice = BRAND_BASE_PRICES[vehicleData.marca || ''] || BRAND_BASE_PRICES.default;
	let multiplier = 1.0;
	let confidence: 'low' | 'medium' | 'high' = 'medium';

	// Factor: Marca
	if (vehicleData.marca) {
		if (BRAND_BASE_PRICES[vehicleData.marca]) {
			factors.push(`Marca ${vehicleData.marca}`);
			confidence = 'high';
		}
	}

	// Factor: Año
	if (vehicleData.año) {
		const yearMult = getYearMultiplier(vehicleData.año);
		multiplier *= yearMult;
		const yearNum = parseInt(vehicleData.año);
		const age = new Date().getFullYear() - yearNum;
		
		if (age <= 1) {
			factors.push('Modelo muy reciente (+30%)');
		} else if (age <= 3) {
			factors.push('Modelo reciente (+15%)');
		} else if (age > 8) {
			factors.push(`Modelo antiguo (${age} años)`);
		}
	}

	// Factor: Transmisión
	if (vehicleData.transmision && TRANSMISSION_MULTIPLIER[vehicleData.transmision]) {
		multiplier *= TRANSMISSION_MULTIPLIER[vehicleData.transmision];
		if (vehicleData.transmision === 'Automática') {
			factors.push('Transmisión automática (+15%)');
		}
	}

	// Factor: Combustible
	if (vehicleData.combustible && FUEL_MULTIPLIER[vehicleData.combustible]) {
		multiplier *= FUEL_MULTIPLIER[vehicleData.combustible];
		if (vehicleData.combustible === 'Eléctrico') {
			factors.push('Vehículo eléctrico (+30%)');
		} else if (vehicleData.combustible === 'Híbrido') {
			factors.push('Vehículo híbrido (+20%)');
		}
	}

	// Factor: Características premium
	const premiumFeatures = vehicleData.caracteristicas?.filter(
		feat => FEATURE_VALUES[feat] && FEATURE_VALUES[feat] >= 1.1
	) || [];

	if (premiumFeatures.length > 0) {
		const featuresMultiplier = premiumFeatures.reduce(
			(acc, feat) => acc * (FEATURE_VALUES[feat] || 1),
			1
		);
		multiplier *= featuresMultiplier;
		factors.push(`${premiumFeatures.length} características premium`);
	}

	// Factor: Capacidad
	if (vehicleData.pasajeros) {
		const passengers = parseInt(vehicleData.pasajeros);
		if (passengers >= 7) {
			multiplier *= 1.15;
			factors.push('Alta capacidad (7+ pasajeros)');
		}
	}

	// Calcular precio final
	const suggestedPrice = Math.round(basePrice * multiplier);
	const minPrice = Math.round(suggestedPrice * 0.85);
	const maxPrice = Math.round(suggestedPrice * 1.15);

	// Ajustar confianza
	if (factors.length >= 4) {
		confidence = 'high';
	} else if (factors.length <= 1) {
		confidence = 'low';
	}

	return {
		min: minPrice,
		max: maxPrice,
		suggested: suggestedPrice,
		confidence,
		factors,
	};
};

/**
 * Obtiene el rango de precios competitivos en el mercado
 */
export const getMarketPriceRange = (vehicleData: VehicleData): { min: number; max: number } => {
	const estimate = calculateSuggestedPrice(vehicleData);
	return {
		min: Math.round(estimate.suggested * 0.75),
		max: Math.round(estimate.suggested * 1.25),
	};
};

/**
 * Compara el precio ingresado con el mercado
 */
export const comparePriceToMarket = (
	price: number,
	vehicleData: VehicleData
): { status: 'low' | 'competitive' | 'high'; message: string; percentage: number } => {
	const estimate = calculateSuggestedPrice(vehicleData);
	const difference = ((price - estimate.suggested) / estimate.suggested) * 100;

	if (price < estimate.min) {
		return {
			status: 'low',
			message: `${Math.abs(Math.round(difference))}% por debajo del mercado`,
			percentage: difference,
		};
	} else if (price > estimate.max) {
		return {
			status: 'high',
			message: `${Math.round(difference)}% por encima del mercado`,
			percentage: difference,
		};
	} else {
		return {
			status: 'competitive',
			message: 'Precio competitivo',
			percentage: difference,
		};
	}
};
