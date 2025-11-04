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
  HomeArrendador: undefined;
  PaymentSetup: undefined;
  Details: { id: string };
};

export type NavigationProps = NavigationProp<RootStackParamList>;