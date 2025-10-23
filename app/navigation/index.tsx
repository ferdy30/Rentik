import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/Auth';
import Details from '../Screens/Details';
import Home from '../Screens/Home';
import LicenseUpload from '../Screens/LicenseUpload';
import Login from '../Screens/Login';
import PerfilVehiculo from '../Screens/PerfilVehiculo';
import Registro from '../Screens/Registro';
import Splash from '../Screens/Splash';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Registro: undefined;
  List: undefined;
  Details: { id: string };
  PerfilVehiculo: undefined;
  LicenseUpload: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade'
        }}
        initialRouteName={user ? 'List' : 'Login'}
      >
        {user ? (
          // Authenticated stack
          <Stack.Group>
            <Stack.Screen name="List" component={Home} />
            <Stack.Screen name="Details" component={Details} />
            <Stack.Screen name="PerfilVehiculo" component={PerfilVehiculo} />
            <Stack.Screen name="LicenseUpload" component={LicenseUpload} />
          </Stack.Group>
        ) : (
          // Auth stack
          <Stack.Group>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Registro" component={Registro} />
            <Stack.Screen name="PerfilVehiculo" component={PerfilVehiculo} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
