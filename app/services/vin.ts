/**
 * VIN Service
 * Handles VIN decoding and vehicle data retrieval
 */

interface NHTSAResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: NHTSAResult[];
}

interface NHTSAResult {
  Make: string;
  Model: string;
  ModelYear: string;
  VIN: string;
  ErrorCode?: string;
  ErrorText?: string;
  [key: string]: any;
}

interface VehicleData {
  marca: string;
  modelo: string;
  anio: string;
  vin: string;
}

/**
 * Decode VIN using NHTSA API
 * Returns vehicle make, model, year
 */
export async function decodeVin(vin: string): Promise<VehicleData | null> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
    );

    if (!response.ok) {
      throw new Error('Error al consultar NHTSA API');
    }

    const data: NHTSAResponse = await response.json();

    if (data.Count === 0 || !data.Results || data.Results.length === 0) {
      throw new Error('No se encontró información del VIN');
    }

    const result = data.Results[0];

    // Check for errors from NHTSA
    if (result.ErrorCode && result.ErrorCode !== '0') {
      throw new Error(result.ErrorText || 'VIN inválido');
    }

    // Extract vehicle data
    const make = result.Make || '';
    const model = result.Model || '';
    const year = result.ModelYear || '';

    if (!make || !model || !year) {
      throw new Error('Información incompleta del VIN');
    }

    return {
      marca: make,
      modelo: model,
      anio: year,
      vin: vin
    };

  } catch (error: any) {
    console.error('Error decoding VIN:', error);
    throw error;
  }
}

/**
 * Validate VIN format (17 characters, no I/O/Q)
 */
export function isValidVinFormat(vin: string): boolean {
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(vin);
}

/**
 * Validate VIN checksum (9th digit)
 */
export function validateVinChecksum(vin: string): boolean {
  if (vin.length !== 17) return false;
  
  const translitMap: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
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
 * Map NHTSA make to your local MARCAS
 * Returns matched brand or original if not found
 */
export function mapMakeToMarca(make: string): string {
  const makeMap: { [key: string]: string } = {
    'TOYOTA': 'Toyota',
    'HONDA': 'Honda',
    'NISSAN': 'Nissan',
    'MAZDA': 'Mazda',
    'HYUNDAI': 'Hyundai',
    'KIA': 'Kia',
    'FORD': 'Ford',
    'CHEVROLET': 'Chevrolet',
    'VOLKSWAGEN': 'Volkswagen',
    'VW': 'Volkswagen',
    'MITSUBISHI': 'Mitsubishi',
    'JEEP': 'Jeep',
  };

  const upperMake = make.toUpperCase();
  return makeMap[upperMake] || make;
}
