import { useCallback, useEffect, useRef, useState } from 'react';
import { clearDraft, getDraft, saveDraft, type VehicleDraft } from '../services/vehicleDrafts';

interface UseVehicleFormOptions {
	step: number;
	autoSaveDelay?: number; // Delay en ms para autoguardado (default: 2000)
}

interface UseVehicleFormReturn {
	vehicleData: VehicleDraft['data'];
	updateVehicleData: (data: Partial<VehicleDraft['data']>) => void;
	loadDraft: () => Promise<VehicleDraft | null>;
	clearDraftData: () => Promise<void>;
	isSaving: boolean;
	lastSaved: Date | null;
}

/**
 * Custom hook para manejar el estado del formulario de vehículo
 * con autoguardado y persistencia
 */
export const useVehicleForm = ({
	step,
	autoSaveDelay = 2000,
}: UseVehicleFormOptions): UseVehicleFormReturn => {
	const [vehicleData, setVehicleData] = useState<VehicleDraft['data']>({});
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Actualiza los datos del vehículo y programa autoguardado
	 */
	const updateVehicleData = useCallback(
		(data: Partial<VehicleDraft['data']>) => {
			setVehicleData((prev) => ({ ...prev, ...data }));

			// Cancelar autoguardado anterior
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Programar nuevo autoguardado
			saveTimeoutRef.current = setTimeout(async () => {
				try {
					setIsSaving(true);
					await saveDraft({
						step,
						data: { ...vehicleData, ...data },
						lastSaved: new Date().toISOString(),
					});
					setLastSaved(new Date());
				} catch (error) {
					console.error('Error en autoguardado:', error);
				} finally {
					setIsSaving(false);
				}
			}, autoSaveDelay);
		},
		[step, vehicleData, autoSaveDelay]
	);

	/**
	 * Carga el borrador guardado
	 */
	const loadDraft = useCallback(async (): Promise<VehicleDraft | null> => {
		try {
			const draft = await getDraft();
			if (draft) {
				setVehicleData(draft.data);
				setLastSaved(new Date(draft.lastSaved));
			}
			return draft;
		} catch (error) {
			console.error('Error cargando borrador:', error);
			return null;
		}
	}, []);

	/**
	 * Limpia el borrador
	 */
	const clearDraftData = useCallback(async (): Promise<void> => {
		try {
			await clearDraft();
			setVehicleData({});
			setLastSaved(null);
		} catch (error) {
			console.error('Error limpiando borrador:', error);
		}
	}, []);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	return {
		vehicleData,
		updateVehicleData,
		loadDraft,
		clearDraftData: clearDraftData,
		isSaving,
		lastSaved,
	};
};
