import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/Auth';
import TripDetails from '../Screens/Arrendatario/TripDetails';
import ChatRoom from '../Screens/ChatRoom';
import Details from '../Screens/Details';
import HomeArrendatario from '../Screens/HomeArrendatario';
import Login from '../Screens/Login';
import PaymentSetup from '../Screens/Registro/PaymentSetupStripe';
import Splash from '../Screens/Splash';
import { RootStackParamList } from '../types/navigation';
import ArrendadorStack from './ArrendadorStack';
import { getInitialRouteByRoleAndProfile, isArrendador } from './role';
import { AuthGroup, RegistrationGroup } from './stacks/AuthGroup';
import { BookingGroup } from './stacks/BookingGroup';
import { CheckInGroup } from './stacks/CheckInGroup';
import { CheckOutGroup } from './stacks/CheckOutGroup';



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  // Obtenemos el usuario y sus datos del contexto de Auth
  const { user, userData, loading } = useAuth();

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
          isIncompleteProfile ? (
            // Usuario autenticado pero con perfil incompleto: permitir completar registro (pasos 1-3)
            RegistrationGroup(Stack)
          ) : !roleKnown ? (
            // Mientras aún no sabemos el rol (doc no creado o sincronizando), mantenemos Splash
            <Stack.Group>
              <Stack.Screen name="Splash" component={Splash} />
              {/* Fallback: incluir Login para evitar acciones REPLACE no manejadas durante transiciones */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
          ) :
          // Stack para usuarios autenticados con guard por rol (arrendador/arrendatario)
          <Stack.Group>
            {/* Pantallas principales según rol */}
            <Stack.Screen name="HomeArrendatario" component={HomeArrendatario} />
            <Stack.Screen name="ArrendadorStack" component={ArrendadorStack} />
            <Stack.Screen name="PaymentSetup" component={PaymentSetup} />
            <Stack.Screen name="Details" component={Details} />

            {/* Pantallas comunes para ambos roles */}
            <Stack.Screen name="TripDetails" component={TripDetails} />
            <Stack.Screen name="ChatRoom" component={ChatRoom} />
            
            {/* Check-in Flow */}
            {CheckInGroup(Stack)}
            
            {/* Check-out Flow */}
            {CheckOutGroup(Stack)}
            
            {/* Flujo de Booking */}
            {BookingGroup(Stack)}

            {/* Fallback */}
            <Stack.Screen name="Login" component={Login} />
          </Stack.Group>
        ) : (
          // Stack para usuarios no autenticados (auth flow)
          AuthGroup(Stack)
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
