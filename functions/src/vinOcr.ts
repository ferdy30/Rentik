/**
 * VIN OCR Function
 * Uses Google Cloud Vision API to detect VIN from photos
 */

import * as functions from 'firebase-functions';

// Removed unused interface VinOcrRequest

interface VinOcrResponse {
  success: boolean;
  vin?: string;
  confidence?: number;
  rawText?: string;
  error?: string;
}

/**
 * Extract VIN from text using regex
 * VIN format: 17 characters, uppercase letters and digits
 * Excludes I, O, Q to avoid confusion with 1, 0
 */
function extractVin(text: string): string | null {
  const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
  const matches = text.match(vinRegex);
  
  if (matches && matches.length > 0) {
    // Return the first match
    return matches[0];
  }
  
  return null;
}

/**
 * Validate VIN checksum (9th digit)
 * Returns true if valid, false otherwise
 */
function validateVinChecksum(vin: string): boolean {
  if (vin.length !== 17) return false;
  
  // VIN transliteration map
  const translitMap: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
  // Weight factors for each position
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = translitMap[char];
    if (value === undefined) return false;
    sum += value * weights[i];
  }
  
  const checkDigit = sum % 11;
  const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return vin[8] === expectedChar;
}

/**
 * Detect VIN from image using Google Cloud Vision
 */
export const detectVin = functions.https.onCall(async (data, context) => {
  try {
    const requestData = data as { imageBase64?: string };
    
    // Validate request
    if (!requestData.imageBase64) {
      return {
        success: false,
        error: 'No se proporcionó imagen'
      } as VinOcrResponse;
    }

    // Check authentication (optional but recommended)
    // Note: context.auth is available in onCall but TypeScript types might be tricky depending on version
    const auth = (context as any).auth;
    if (auth) {
      // Authenticated user
    } else {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario debe estar autenticado'
      );
    }

    // Import Vision API
    const vision = await import('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();

    // Decode base64 image
    const imageBuffer = Buffer.from(requestData.imageBase64, 'base64');

    // Call Vision API for text detection
    const [result] = await client.textDetection({
      image: { content: imageBuffer }
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return {
        success: false,
        error: 'No se detectó texto en la imagen'
      } as VinOcrResponse;
    }

    // First annotation contains full text
    const fullText = detections[0].description || '';
    
    // Extract VIN from text
    const vin = extractVin(fullText.toUpperCase());
    
    if (!vin) {
      return {
        success: false,
        rawText: fullText,
        error: 'No se detectó un VIN válido. Intenta de nuevo con mejor iluminación.'
      } as VinOcrResponse;
    }

    // Validate VIN checksum
    const isValid = validateVinChecksum(vin);
    
    if (!isValid) {
      return {
        success: false,
        vin: vin,
        rawText: fullText,
        error: 'El VIN detectado no pasó la validación. Verifica manualmente.'
      } as VinOcrResponse;
    }

    // Success - return VIN with confidence
    const confidence = detections[0].confidence || 0.9;
    
    return {
      success: true,
      vin: vin,
      confidence: confidence,
      rawText: fullText
    } as VinOcrResponse;

  } catch (error: any) {
    console.error('Error in detectVin:', error);
    
    return {
      success: false,
      error: 'Error al procesar la imagen: ' + error.message
    } as VinOcrResponse;
  }
});
