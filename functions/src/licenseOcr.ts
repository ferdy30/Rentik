/**
 * License OCR Function
 * Uses Google Cloud Vision API to detect Driver's License info
 */

import * as functions from 'firebase-functions';

interface LicenseOcrResponse {
  success: boolean;
  data?: {
    licenseNumber?: string;
    expirationDate?: string;
    name?: string;
  };
  rawText?: string;
  error?: string;
}

/**
 * Extract License info from text using regex
 * This is a basic implementation and might need adjustment for specific country formats
 */
function extractLicenseInfo(text: string) {
  const lines = text.split('\n');
  let licenseNumber = '';
  let expirationDate = '';
  let name = '';

  // Regex patterns (Generic / El Salvador examples)
  // License format often: 1234-567890-123-4 or similar
  const licenseRegex = /\b\d{4}-\d{6}-\d{3}-\d{1}\b|\b\d{8,14}\b/;
  
  // Date format: DD/MM/YYYY or DD-MM-YYYY
  const dateRegex = /\b\d{2}[/-]\d{2}[/-]\d{4}\b/;

  for (const line of lines) {
    // Look for License Number
    if (!licenseNumber) {
      const match = line.match(licenseRegex);
      if (match) licenseNumber = match[0];
    }

    // Look for Expiration Date (often labeled VENCE, EXP, etc)
    if (!expirationDate && (line.toUpperCase().includes('VENCE') || line.toUpperCase().includes('EXP'))) {
      const match = line.match(dateRegex);
      if (match) expirationDate = match[0];
    } else if (!expirationDate) {
        // Fallback: just look for a date in the future? 
        // For now, simple regex match on line
        const match = line.match(dateRegex);
        if (match) {
            // Simple check if year > 2020 to avoid birth dates
            const year = parseInt(match[0].slice(-4));
            if (year > 2023) expirationDate = match[0];
        }
    }
  }

  // Name extraction is harder without specific labels, usually top lines
  // Skipping for now to avoid bad data
  
  return { licenseNumber, expirationDate, name };
}

/**
 * Detect License Data from image using Google Cloud Vision
 */
export const detectLicense = functions.https.onCall(async (data, context) => {
  try {
    const requestData = data as { imageBase64?: string };
    
    if (!requestData.imageBase64) {
      return { success: false, error: 'No se proporcionó imagen' } as LicenseOcrResponse;
    }

    // Import Vision API
    const vision = await import('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();

    // Decode base64 image
    const imageBuffer = Buffer.from(requestData.imageBase64, 'base64');

    // Detect text
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return { success: false, error: 'No se detectó texto' } as LicenseOcrResponse;
    }

    const fullText = detections[0].description || '';
    const extracted = extractLicenseInfo(fullText);

    return {
      success: true,
      data: extracted,
      rawText: fullText
    } as LicenseOcrResponse;

  } catch (error: any) {
    console.error('Error in detectLicense:', error);
    return {
      success: false,
      error: error.message || 'Error interno al procesar la imagen'
    } as LicenseOcrResponse;
  }
});
