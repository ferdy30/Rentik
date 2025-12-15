import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = '@rentik_vehicle_draft';

export interface VehicleDraft {
	step: number;
	data: {
		marca?: string;
		modelo?: string;
		año?: string;
		placa?: string;
		color?: string;
		combustible?: string;
		transmision?: string;
		puertas?: string;
		pasajeros?: string;
		caracteristicas?: string[];
		photos?: { [key: string]: string | null };
		precio?: string;
		descripcion?: string;
		ubicacion?: string;
		coordinates?: { latitude: number; longitude: number };
		placeId?: string;
	};
	lastSaved: string;
}

/**
 * Guarda un borrador del vehículo en AsyncStorage
 */
export const saveDraft = async (draft: VehicleDraft): Promise<void> => {
	try {
		const draftWithTimestamp = {
			...draft,
			lastSaved: new Date().toISOString(),
		};
		await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTimestamp));
	} catch (error) {
		console.error('Error guardando borrador:', error);
		throw error;
	}
};

/**
 * Obtiene el borrador guardado
 */
export const getDraft = async (): Promise<VehicleDraft | null> => {
	try {
		const draft = await AsyncStorage.getItem(DRAFT_KEY);
		return draft ? JSON.parse(draft) : null;
	} catch (error) {
		console.error('Error obteniendo borrador:', error);
		return null;
	}
};

/**
 * Elimina el borrador
 */
export const clearDraft = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(DRAFT_KEY);
	} catch (error) {
		console.error('Error eliminando borrador:', error);
		throw error;
	}
};

/**
 * Verifica si existe un borrador
 */
export const hasDraft = async (): Promise<boolean> => {
	try {
		const draft = await AsyncStorage.getItem(DRAFT_KEY);
		return draft !== null;
	} catch (error) {
		console.error('Error verificando borrador:', error);
		return false;
	}
};
