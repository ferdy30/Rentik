/**
 * Base de datos de sugerencias inteligentes por marca y modelo
 */

interface VehicleSuggestion {
	tipo?: string;
	combustible?: string;
	transmision?: string;
	puertas?: string;
	pasajeros?: string;
	caracteristicas?: string[];
	tips?: string[];
}

// Sugerencias por marca
const BRAND_SUGGESTIONS: { [key: string]: Partial<VehicleSuggestion> } = {
	'Toyota': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth'],
		tips: ['Toyota es conocido por su confiabilidad. Menciona el bajo consumo de combustible.'],
	},
	'Honda': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'Cámara de Reversa'],
		tips: ['Los Honda son populares por su eficiencia. Resalta características tecnológicas.'],
	},
	'Mazda': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'GPS / Navegación'],
		tips: ['Mazda destaca por su diseño deportivo. Menciona la experiencia de conducción.'],
	},
	'Nissan': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth'],
		tips: ['Nissan ofrece gran comodidad. Resalta el espacio interior y confort.'],
	},
	'Mercedes-Benz': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		transmision: 'Automática',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'GPS / Navegación', 'Asientos de Cuero', 'Apple CarPlay'],
		tips: ['Mercedes-Benz es lujo premium. Destaca características exclusivas y confort superior.'],
	},
	'BMW': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		transmision: 'Automática',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'GPS / Navegación', 'Asientos de Cuero', 'Apple CarPlay'],
		tips: ['BMW combina lujo y deportividad. Menciona la experiencia de manejo premium.'],
	},
	'Audi': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		transmision: 'Automática',
		caracteristicas: ['Aire Acondicionado', 'GPS / Navegación', 'Asientos de Cuero', 'Apple CarPlay', 'Entrada sin Llave'],
		tips: ['Audi es sinónimo de tecnología. Resalta innovaciones y diseño vanguardista.'],
	},
	'Tesla': {
		tipo: 'Sedán',
		combustible: 'Eléctrico',
		transmision: 'Automática',
		puertas: '4',
		pasajeros: '5',
		caracteristicas: ['Aire Acondicionado', 'GPS / Navegación', 'Cámara de Reversa', 'Sensores de Parqueo', 'Entrada sin Llave'],
		tips: ['Tesla es el futuro. Destaca autonomía eléctrica, autopilot y cero emisiones.'],
	},
	'Ford': {
		tipo: 'Pickup',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', '4x4 / AWD'],
		tips: ['Ford es resistencia y capacidad. Menciona robustez y utilidad para trabajo/aventura.'],
	},
	'Chevrolet': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth'],
		tips: ['Chevrolet ofrece versatilidad. Resalta el balance precio-calidad.'],
	},
	'Hyundai': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'Cámara de Reversa'],
		tips: ['Hyundai combina tecnología y economía. Menciona garantía y eficiencia.'],
	},
	'Kia': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'Cámara de Reversa'],
		tips: ['Kia ofrece gran valor. Resalta características modernas a buen precio.'],
	},
	'Volkswagen': {
		tipo: 'Sedán',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', 'Bluetooth', 'GPS / Navegación'],
		tips: ['Volkswagen es ingeniería alemana. Menciona calidad de construcción y seguridad.'],
	},
	'Jeep': {
		tipo: 'SUV',
		combustible: 'Gasolina',
		caracteristicas: ['Aire Acondicionado', '4x4 / AWD', 'Sensores de Parqueo'],
		tips: ['Jeep es aventura. Resalta capacidad off-road y versatilidad.'],
	},
	'Subaru': {
		tipo: 'SUV',
		combustible: 'Gasolina',
		transmision: 'Automática',
		caracteristicas: ['Aire Acondicionado', '4x4 / AWD', 'Cámara de Reversa'],
		tips: ['Subaru es confiabilidad y AWD. Menciona seguridad en cualquier clima.'],
	},
};

// Sugerencias específicas por modelo
const MODEL_SUGGESTIONS: { [key: string]: { [model: string]: Partial<VehicleSuggestion> } } = {
	'Toyota': {
		'Corolla': {
			tipo: 'Sedán',
			puertas: '4',
			pasajeros: '5',
			tips: ['El Corolla es el sedán más vendido del mundo. Destaca confiabilidad y bajo mantenimiento.'],
		},
		'Camry': {
			tipo: 'Sedán',
			puertas: '4',
			pasajeros: '5',
			tips: ['El Camry es lujo asequible. Resalta espacio interior y confort.'],
		},
		'RAV4': {
			tipo: 'SUV',
			puertas: '4',
			pasajeros: '5',
			caracteristicas: ['4x4 / AWD'],
			tips: ['La RAV4 es la SUV familiar perfecta. Menciona espacio y versatilidad.'],
		},
		'Tacoma': {
			tipo: 'Pickup',
			puertas: '4',
			pasajeros: '5',
			caracteristicas: ['4x4 / AWD'],
			tips: ['La Tacoma es legendaria. Resalta durabilidad y capacidad off-road.'],
		},
	},
	'Honda': {
		'Civic': {
			tipo: 'Sedán',
			puertas: '4',
			pasajeros: '5',
			tips: ['El Civic es deportivo y eficiente. Destaca diseño moderno y tecnología.'],
		},
		'Accord': {
			tipo: 'Sedán',
			puertas: '4',
			pasajeros: '5',
			tips: ['El Accord es elegancia y espacio. Resalta confort y características premium.'],
		},
		'CR-V': {
			tipo: 'SUV',
			puertas: '4',
			pasajeros: '5',
			tips: ['La CR-V es práctica y confiable. Menciona espacio de carga y economía.'],
		},
	},
	'Tesla': {
		'Model 3': {
			tipo: 'Sedán',
			puertas: '4',
			pasajeros: '5',
			tips: ['Model 3 es el eléctrico más popular. Destaca autonomía de 400+ km y aceleración instantánea.'],
		},
		'Model Y': {
			tipo: 'SUV',
			puertas: '4',
			pasajeros: '7',
			tips: ['Model Y es espacio eléctrico. Resalta tercera fila opcional y gran maletero.'],
		},
	},
	'Ford': {
		'F-150': {
			tipo: 'Pickup',
			puertas: '4',
			pasajeros: '5',
			caracteristicas: ['4x4 / AWD'],
			tips: ['F-150 es la pickup más vendida. Destaca capacidad de carga y remolque.'],
		},
		'Explorer': {
			tipo: 'SUV',
			puertas: '4',
			pasajeros: '7',
			caracteristicas: ['Tercera Fila'],
			tips: ['Explorer es la SUV familiar grande. Menciona espacio para 7 y comodidad.'],
		},
	},
};

/**
 * Obtiene sugerencias basadas en la marca del vehículo
 */
export const getSuggestionsByBrand = (marca: string): Partial<VehicleSuggestion> | null => {
	return BRAND_SUGGESTIONS[marca] || null;
};

/**
 * Obtiene sugerencias específicas basadas en marca y modelo
 */
export const getSuggestionsByModel = (
	marca: string,
	modelo: string
): Partial<VehicleSuggestion> | null => {
	return MODEL_SUGGESTIONS[marca]?.[modelo] || null;
};

/**
 * Combina sugerencias de marca y modelo (modelo tiene prioridad)
 */
export const getSmartSuggestions = (marca: string, modelo?: string): Partial<VehicleSuggestion> => {
	const brandSuggestions = getSuggestionsByBrand(marca) || {};
	const modelSuggestions = modelo ? getSuggestionsByModel(marca, modelo) || {} : {};

	return {
		...brandSuggestions,
		...modelSuggestions,
		caracteristicas: [
			...(brandSuggestions.caracteristicas || []),
			...(modelSuggestions.caracteristicas || []),
		],
		tips: [...(brandSuggestions.tips || []), ...(modelSuggestions.tips || [])],
	};
};

/**
 * Genera una descripción sugerida basada en los datos del vehículo
 */
export const generateSuggestedDescription = (vehicleData: {
	marca?: string;
	modelo?: string;
	año?: string;
	tipo?: string;
	caracteristicas?: string[];
}): string => {
	const { marca, modelo, año, tipo, caracteristicas } = vehicleData;

	if (!marca || !modelo) return '';

	const suggestions = getSmartSuggestions(marca, modelo);
	const parts: string[] = [];

	// Intro
	parts.push(`${marca} ${modelo} ${año || ''} en excelente estado.`);

	// Tipo de vehículo
	if (tipo) {
		parts.push(`Este ${tipo.toLowerCase()} es perfecto para`);
		if (tipo === 'SUV') {
			parts.push('familias y aventuras.');
		} else if (tipo === 'Sedán') {
			parts.push('viajes cómodos y ejecutivos.');
		} else if (tipo === 'Pickup') {
			parts.push('trabajo y aventuras off-road.');
		} else {
			parts.push('tus necesidades de transporte.');
		}
	}

	// Características destacadas
	if (caracteristicas && caracteristicas.length > 0) {
		const topFeatures = caracteristicas.slice(0, 3);
		parts.push(`\n\nIncluye ${topFeatures.join(', ')}.`);
	}

	// Tips específicos
	if (suggestions.tips && suggestions.tips.length > 0) {
		parts.push(`\n\n${suggestions.tips[0]}`);
	}

	// Llamado a la acción
	parts.push('\n\nIdeal para viajes de trabajo, vacaciones o uso diario. ¡Reserva ahora!');

	return parts.join(' ');
};
