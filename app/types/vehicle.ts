export interface VehiclePhotos {
  front: string;
  sideLeft: string;
  sideRight: string;
  interior: string;
  [key: string]: string; // Para fotos adicionales (photo_4, photo_5, etc.)
}

export interface VehicleRules {
  pets?: boolean;
  smoking?: boolean;
  crossBorder?: boolean;
}

export interface VehicleDiscounts {
  weekly?: number;
  monthly?: number;
}

export interface Vehicle {
  id: string;
  arrendadorId: string;
  
  // Información Básica
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  tipo: string; // 'Sedán', 'SUV', etc.
  transmision: string; // 'Automático', 'Manual'
  combustible: string; // 'Gasolina', 'Híbrido', etc.
  
  // Especificaciones
  pasajeros: number;
  puertas: number;
  color: string;
  kilometraje: number;
  condicion: string; // 'Excelente', 'Bueno', etc.
  caracteristicas: string[]; // ['A/C', 'Bluetooth', etc.]
  
  // Multimedia (Normalizado)
  photos: VehiclePhotos;
  // Campos legacy para compatibilidad hacia atrás (opcionales)
  imagen?: string; 
  imagenes?: string[];

  // Precio y Ubicación
  precio: number;
  descripcion: string;
  ubicacion: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
  
  // Disponibilidad y Reglas
  availableFrom?: string;
  blockedDates?: string[];
  flexibleHours?: boolean;
  deliveryHours?: {
    start: string;
    end: string;
  };
  airportDelivery?: boolean;
  airportFee?: number;
  
  mileageLimit?: string; // 'unlimited', 'limited'
  dailyKm?: number;
  
  advanceNotice?: number;
  minTripDuration?: number;
  maxTripDuration?: number;
  
  rules?: VehicleRules;
  discounts?: VehicleDiscounts;
  deposit?: number;
  protectionPlan?: string;

  // Metadatos
  createdAt: Date | any; // any para soportar Timestamp de Firestore
  rating: number;
  reviewCount?: number;
  trips: number;
  status: 'active' | 'inactive' | 'rented';
  disponible?: boolean; // Legacy
}
