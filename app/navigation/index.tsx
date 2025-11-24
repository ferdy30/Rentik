import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/Auth';
import Details from '../Screens/Details';
import HomeArrendatario from '../Screens/HomeArrendatario';
import Login from '../Screens/Login';
import PaymentSetup from '../Screens/Registro/PaymentSetupStripe';
import RegistroAddress from '../Screens/Registro/RegistroAddress';
import RegistroStep1 from '../Screens/Registro/RegistroStep1';
import RegistroStep2 from '../Screens/Registro/RegistroStep2';
import RegistroStep3 from '../Screens/Registro/RegistroStep3';
import Splash from '../Screens/Splash';
import ArrendadorStack from './ArrendadorStack';
import { getInitialRouteByRoleAndProfile, isArrendador } from './role';

// Tipos para las rutas de navegación - ayuda con TypeScript
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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  // Obtenemos el usuario y sus datos del contexto de Auth
  const { user, userData, loading } = useAuth();

  console.log('[NAV] Auth state:', { 
    hasUser: !!user, 
    uid: user?.uid,
    userData: userData ? { role: userData.role, profileComplete: userData.profileComplete } : null,
    loading 
  });

  // Mientras carga O si hay usuario pero sin datos aún (evita flash de Login)
  if (loading || (user && !userData)) {
    return <Splash />;
  }

  // Determinar la ruta inicial según el rol (cuando el usuario está autenticado)
  const profileComplete = Boolean(userData?.profileComplete);
  // Stripe: permitir pasar al Home si ya envió datos (detailsSubmitted) aunque aún no tenga chargesEnabled
  const stripeOkEnough = Boolean(userData?.stripe?.chargesEnabled || userData?.stripe?.detailsSubmitted);
  const shouldCompletePayment = Boolean(
    user &&
    isArrendador(userData?.role) &&
    !stripeOkEnough
  );
  const roleKnown = user ? (userData && (userData.role === 'arrendador' || userData.role === 'arrendatario')) : false;
  const isIncompleteProfile = Boolean(user && userData && userData.profileComplete === false);
  const initialRouteName = user
    ? (isIncompleteProfile
        ? 'RegistroStep1'
        : (shouldCompletePayment ? 'PaymentSetup' : getInitialRouteByRoleAndProfile(userData?.role, profileComplete)))
    : 'Splash';
  
  console.log('[NAV] Routing decision:', { 
    roleKnown, 
    isIncompleteProfile, 
    shouldCompletePayment, 
    initialRouteName 
  });

  // Key único para forzar remount del stack cuando cambia el estado de autenticación crítico
  const navigationKey = user 
    ? `authenticated-${userData?.role}-${userData?.profileComplete}-${userData?.stripe?.detailsSubmitted}` 
    : 'unauthenticated';

  return (
    <NavigationContainer>
      {/* @ts-ignore */}
      <Stack.Navigator
        key={navigationKey}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,      // Sin header nativo, usamos nuestros propios headers
          animation: 'fade'        // Transición suave entre pantallas
        }}
      >
        {user ? (
          !roleKnown ? (
            // Mientras aún no sabemos el rol (doc no creado o sincronizando), mantenemos Splash
            <Stack.Group>
              <Stack.Screen name="Splash" component={Splash} />
              {/* Fallback: incluir Login para evitar acciones REPLACE no manejadas durante transiciones */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
          ) : isIncompleteProfile ? (
            // Usuario autenticado pero con perfil incompleto: permitir completar registro (pasos 1-3)
            <Stack.Group>
              <Stack.Screen name="RegistroStep1" component={RegistroStep1} />
              <Stack.Screen name="RegistroStep2" component={RegistroStep2} />
              <Stack.Screen name="RegistroAddress" component={RegistroAddress} />
              <Stack.Screen name="RegistroStep3" component={RegistroStep3} />
              {/* Fallback */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
          ) : 
          // Stack para usuarios autenticados con guard por rol (arrendador/arrendatario)
          isArrendador(userData?.role) ? (
            // Stack para arrendadores autenticados
            <Stack.Group>
              <Stack.Screen name="PaymentSetup" component={PaymentSetup} />
              <Stack.Screen name="ArrendadorStack" component={ArrendadorStack} />
              <Stack.Screen name="Details" component={Details} />
              {/* Fallback */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
          ) : (
            <Stack.Group>
              <Stack.Screen name="HomeArrendatario" component={HomeArrendatario} />
              <Stack.Screen name="Details" component={Details} />
              {/* Fallback */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
          )
        ) : (
          // Stack para usuarios no autenticados (auth flow)
          <Stack.Group>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Login" component={Login} />
            {/* Flujo de registro simplificado: info personal, fotos licencia (ambas), rol + términos */}
            <Stack.Screen name="RegistroStep1" component={RegistroStep1} />
            <Stack.Screen name="RegistroStep2" component={RegistroStep2} />
            <Stack.Screen name="RegistroAddress" component={RegistroAddress} />
            <Stack.Screen name="RegistroStep3" component={RegistroStep3} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
