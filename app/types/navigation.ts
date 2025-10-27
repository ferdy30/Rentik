import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Registro: undefined;
  HomeArrendatario: undefined;
  HomeArrendador: undefined;
  Details: { id: string };
  PerfilVehiculo: undefined;
  LicenseUpload: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;