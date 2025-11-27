/**
 * Google Places API Services
 * 
 * Wrapper para llamadas a Cloud Functions de Google Places
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { Firebaseapp } from '../../FirebaseConfig';
import { getUserFriendlyError, logError } from '../utils/errorHandler';

const functions = getFunctions(Firebaseapp);

/**
 * Buscar direcciones con autocompletado
 */
export async function fetchPlacesAutocomplete(input: string): Promise<any[]> {
  try {
    if (!input || input.trim().length < 3) {
      return [];
    }

    const autocomplete = httpsCallable(functions, 'placesAutocomplete');
    const result = await autocomplete({ input });
    const data = result.data as { predictions: any[]; status: string };
    return data.predictions || [];
  } catch (error) {
    logError('PLACES_AUTOCOMPLETE', error);
    const errorResponse = getUserFriendlyError(error);
    throw new Error(errorResponse.userMessage);
  }
}

/**
 * Obtener detalles de un lugar específico
 */
export async function fetchPlaceDetailsById(placeId: string): Promise<any> {
  try {
    if (!placeId || placeId.trim() === '') {
      throw new Error('ID de lugar inválido');
    }

    const details = httpsCallable(functions, 'placesDetails');
    const result = await details({ placeId });
    const data = result.data as { result: any; status: string };
    return data.result;
  } catch (error) {
    logError('PLACES_DETAILS', error);
    const errorResponse = getUserFriendlyError(error);
    throw new Error(errorResponse.userMessage);
  }
}
