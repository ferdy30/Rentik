import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
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
};

export type NavigationProps = NavigationProp<RootStackParamList>;