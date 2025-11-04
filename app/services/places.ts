/**
 * Google Places API Services
 * 
 * Wrapper para llamadas a Cloud Functions de Google Places
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { Firebaseapp } from '../../FirebaseConfig';

const functions = getFunctions(Firebaseapp);

/**
 * Buscar direcciones con autocompletado
 */
export async function fetchPlacesAutocomplete(input: string): Promise<any[]> {
  try {
    const autocomplete = httpsCallable(functions, 'placesAutocomplete');
    const result = await autocomplete({ input });
    const data = result.data as { predictions: any[]; status: string };
    return data.predictions || [];
  } catch (error) {
    console.error('[PLACES] Autocomplete error:', error);
    throw error;
  }
}

/**
 * Obtener detalles de un lugar específico
 */
export async function fetchPlaceDetailsById(placeId: string): Promise<any> {
  try {
    const details = httpsCallable(functions, 'placesDetails');
    const result = await details({ placeId });
    const data = result.data as { result: any; status: string };
    return data.result;
  } catch (error) {
    console.error('[PLACES] Details error:', error);
    throw error;
  }
}
