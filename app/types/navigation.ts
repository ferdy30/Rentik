import { NavigationProp } from '@react-navigation/native';
import { Reservation } from '../services/reservations';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  TripDetails: { reservation: Reservation };
  ChatRoom: { 
    reservationId: string; 
    participants: string[]; 
    vehicleInfo?: { marca: string; modelo: string; imagen: string };
  };
  RegistroStep1: undefined;
  RegistroStep2: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    countryCode: string;
    telefono: string;
    fechaNacimiento: string;
  };
  RegistroStep3: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    countryCode: string;
    telefono: string;
    fechaNacimiento: string;
    licensePhotos: {
      front: string;
      back: string;
      selfie?: string;
    };
    licenseData: {
      number: string;
      expiry: string;
      country: string;
    };
    address?: {
      formatted?: string;
      placeId?: string | null;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      location?: { latitude: number; longitude: number };
    };
  };
  RegistroAddress: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    countryCode: string;
    telefono: string;
    fechaNacimiento: string;
    licensePhotos: {
      front: string;
      back: string;
    };
  };
  HomeArrendatario: undefined;
  ArrendadorStack: undefined;
  PaymentSetup: undefined;
  Details: { vehicle: any };
  BookingStep1Dates: { vehicle: any };
  BookingStep2Location: { vehicle: any; startDate: string; endDate: string };
  BookingStep3Time: { vehicle: any; startDate: string; endDate: string; pickupLocation: string; returnLocation: string };
  BookingStep4Confirmation: { vehicle: any; startDate: string; endDate: string; pickupLocation: string; returnLocation: string; pickupTime: string; returnTime: string };
  CheckInPreparation: { reservation: Reservation; isArrendador?: boolean };
  CheckInStart: { reservation: Reservation };
  CheckInPhotos: { reservation: Reservation; checkInId: string };
  CheckInConditions: { reservation: Reservation; checkInId: string };
  CheckInDamageReport: { reservation: Reservation; checkInId: string };
  CheckInKeys: { reservation: Reservation; checkInId: string };
  CheckInSignature: { reservation: Reservation; checkInId: string };
  CheckInComplete: { reservation: Reservation; checkInId: string };
};

export type NavigationProps = NavigationProp<RootStackParamList>;