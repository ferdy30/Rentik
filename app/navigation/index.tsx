import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/Auth';
import TripDetails from '../Screens/Arrendatario/TripDetails';
import BookingStep1Dates from '../Screens/Booking/BookingStep1Dates';
import BookingStep2Location from '../Screens/Booking/BookingStep2Location';
import BookingStep3Time from '../Screens/Booking/BookingStep3Time';
import BookingStep4Confirmation from '../Screens/Booking/BookingStep4Confirmation';
import ChatRoom from '../Screens/ChatRoom';
import CheckInComplete from '../Screens/CheckIn/CheckInComplete';
import CheckInConditions from '../Screens/CheckIn/CheckInConditions';
import CheckInDamageReport from '../Screens/CheckIn/CheckInDamageReport';
import CheckInKeys from '../Screens/CheckIn/CheckInKeys';
import CheckInPhotos from '../Screens/CheckIn/CheckInPhotos';
import CheckInPreparation from '../Screens/CheckIn/CheckInPreparation';
import CheckInProcessExplanation from '../Screens/CheckIn/CheckInProcessExplanation';
import CheckInSignature from '../Screens/CheckIn/CheckInSignature';
import CheckInStart from '../Screens/CheckIn/CheckInStart';
import CheckOutComplete from '../Screens/CheckOut/CheckOutComplete';
import CheckOutConditions from '../Screens/CheckOut/CheckOutConditions';
import CheckOutPhotos from '../Screens/CheckOut/CheckOutPhotos';
import CheckOutReview from '../Screens/CheckOut/CheckOutReview';
import CheckOutStart from '../Screens/CheckOut/CheckOutStart';
import RateExperience from '../Screens/CheckOut/RateExperience';
import Details from '../Screens/Details';
import HomeArrendatario from '../Screens/HomeArrendatario';
import Login from '../Screens/Login';
import PaymentSetup from '../Screens/Registro/PaymentSetupStripe';
import RegistroAddress from '../Screens/Registro/RegistroAddress';
import RegistroStep1 from '../Screens/Registro/RegistroStep1';
import RegistroStep2 from '../Screens/Registro/RegistroStep2';
import RegistroStep3 from '../Screens/Registro/RegistroStep3';
import Splash from '../Screens/Splash';
import { RootStackParamList } from '../types/navigation';
import ArrendadorStack from './ArrendadorStack';
import { getInitialRouteByRoleAndProfile, isArrendador } from './role';



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
          isIncompleteProfile ? (
            // Usuario autenticado pero con perfil incompleto: permitir completar registro (pasos 1-3)
            <Stack.Group>
              <Stack.Screen name="RegistroStep1" component={RegistroStep1} />
              <Stack.Screen name="RegistroStep2" component={RegistroStep2} />
              <Stack.Screen name="RegistroAddress" component={RegistroAddress} />
              <Stack.Screen name="RegistroStep3" component={RegistroStep3} />
              {/* Fallback */}
              <Stack.Screen name="Login" component={Login} />
            </Stack.Group>
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
            <Stack.Screen name="CheckInPreparation" component={CheckInPreparation} />
            <Stack.Screen name="CheckInProcessExplanation" component={CheckInProcessExplanation} />
            <Stack.Screen name="CheckInStart" component={CheckInStart} />
            <Stack.Screen 
              name="CheckInPhotos" 
              component={CheckInPhotos} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckInConditions" 
              component={CheckInConditions} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckInDamageReport" 
              component={CheckInDamageReport} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckInKeys" 
              component={CheckInKeys} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckInSignature" 
              component={CheckInSignature} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckInComplete" 
              component={CheckInComplete} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            
            {/* Check-out Flow */}
            <Stack.Screen name="CheckOutStart" component={CheckOutStart} />
            <Stack.Screen 
              name="CheckOutPhotos" 
              component={CheckOutPhotos} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckOutConditions" 
              component={CheckOutConditions} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckOutReview" 
              component={CheckOutReview} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="RateExperience" 
              component={RateExperience} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="CheckOutComplete" 
              component={CheckOutComplete} 
              options={{ headerShown: false, gestureEnabled: false }}
            />
            
            {/* Flujo de Booking (Común o específico de arrendatario, pero accesible) */}
            <Stack.Screen name="BookingStep1Dates" component={BookingStep1Dates} />
            <Stack.Screen name="BookingStep2Location" component={BookingStep2Location} />
            <Stack.Screen name="BookingStep3Time" component={BookingStep3Time} />
            <Stack.Screen name="BookingStep4Confirmation" component={BookingStep4Confirmation} />
            {/* Fallback */}
            <Stack.Screen name="Login" component={Login} />
          </Stack.Group>
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
