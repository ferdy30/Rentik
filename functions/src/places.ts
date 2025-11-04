/**
 * Google Places API functions
 * Proxy para llamadas desde el cliente
 */

import { logger } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Autocomplete de direcciones usando Google Places API (New)
 */
export const placesAutocomplete = onCall(async (request) => {
  const { input } = request.data;

  if (!input || typeof input !== 'string') {
    throw new Error('Input es requerido');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    logger.error('GOOGLE_MAPS_API_KEY no está configurada');
    throw new Error('API key no configurada');
  }

  try {
    // Nueva Places API - Autocomplete (New)
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input: input,
        languageCode: 'es',
        includedRegionCodes: ['SV'], // Solo El Salvador
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Places API (New) error:', data);
      throw new Error(`Places API error: ${data.error?.message || 'Unknown error'}`);
    }

    // Convertir al formato antiguo para compatibilidad
    const predictions = (data.suggestions || []).map((suggestion: any) => ({
      place_id: suggestion.placePrediction?.placeId || '',
      description: suggestion.placePrediction?.text?.text || '',
      structured_formatting: {
        main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
        secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
      },
    }));

    return {
      predictions,
      status: 'OK',
    };
  } catch (error) {
    logger.error('Error in placesAutocomplete:', error);
    throw new Error('Error buscando lugares');
  }
});

/**
 * Obtener detalles de un lugar específico usando Places API (New)
 */
export const placesDetails = onCall(async (request) => {
  const { placeId } = request.data;

  if (!placeId || typeof placeId !== 'string') {
    throw new Error('placeId es requerido');
  }

  if (!GOOGLE_MAPS_API_KEY) {
    logger.error('GOOGLE_MAPS_API_KEY no está configurada');
    throw new Error('API key no configurada');
  }

  try {
    // Nueva Places API - Place Details (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Places Details API (New) error:', data);
      throw new Error(`Places Details API error: ${data.error?.message || 'Unknown error'}`);
    }

    // Convertir al formato antiguo para compatibilidad
    const result = {
      place_id: data.id,
      formatted_address: data.formattedAddress,
      address_components: data.addressComponents || [],
      geometry: {
        location: {
          lat: data.location?.latitude || 0,
          lng: data.location?.longitude || 0,
        },
      },
    };

    return {
      result,
      status: 'OK',
    };
  } catch (error) {
    logger.error('Error in placesDetails:', error);
    throw new Error('Error obteniendo detalles del lugar');
  }
});
