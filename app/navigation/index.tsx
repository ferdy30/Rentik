import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/Auth';
import Details from '../Screens/Details';
import HomeArrendador from '../Screens/HomeArrendador';
import HomeArrendatario from '../Screens/HomeArrendatario';
import LicenseUpload from '../Screens/LicenseUpload';
import Login from '../Screens/Login';
import PerfilVehiculo from '../Screens/PerfilVehiculo';
import Registro from '../Screens/Registro';
import Splash from '../Screens/Splash';
import { getInitialRouteByRoleAndProfile, isArrendador } from './role';

// Tipos para las rutas de navegación - ayuda con TypeScript
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  // Obtenemos el usuario y sus datos del contexto de Auth
  const { user, userData, loading } = useAuth();

  // Mientras carga, mostramos un splash simple (sin navegación)
  if (loading) {
    return <Splash />;
  }

  // Determinar la ruta inicial según el rol (cuando el usuario está autenticado)
  const hasLicense = Boolean(userData?.licensePhotoURL);
  const vehicleProfileComplete = Boolean(userData?.vehicleProfileComplete);
  const initialRouteName = user
    ? getInitialRouteByRoleAndProfile(userData?.role, hasLicense, vehicleProfileComplete)
    : 'Splash';

  return (
    <NavigationContainer>
      {/* @ts-ignore */}
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,      // Sin header nativo, usamos nuestros propios headers
          animation: 'fade'        // Transición suave entre pantallas
        }}
      >
        {user ? (
          // Stack para usuarios autenticados con guard por rol (arrendador/arrendatario)
          isArrendador(userData?.role) ? (
            // Nota: mantenemos todas las pantallas del flujo del arrendador disponibles
            // y controlamos la pantalla inicial con initialRouteName para evitar bloqueos
            // por datos de perfil que aún no han refrescado en el contexto.
            <Stack.Group>
              <Stack.Screen name="LicenseUpload" component={LicenseUpload} />
              <Stack.Screen name="PerfilVehiculo" component={PerfilVehiculo} />
              <Stack.Screen name="HomeArrendador" component={HomeArrendador} />
              <Stack.Screen name="Details" component={Details} />
            </Stack.Group>
          ) : (
            <Stack.Group>
              <Stack.Screen name="HomeArrendatario" component={HomeArrendatario} />
              <Stack.Screen name="Details" component={Details} />
            </Stack.Group>
          )
        ) : (
          // Stack para usuarios no autenticados (auth flow)
          <Stack.Group>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Registro" component={Registro} />
            {/* LicenseUpload y PerfilVehiculo están aquí también para el flujo de registro de arrendadores */}
            <Stack.Screen name="LicenseUpload" component={LicenseUpload} />
            <Stack.Screen name="PerfilVehiculo" component={PerfilVehiculo} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
