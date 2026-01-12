import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Login from '../../Screens/Login';
import RegistroAddress from '../../Screens/Registro/RegistroAddress';
import RegistroStep1 from '../../Screens/Registro/RegistroStep1';
import RegistroStep2 from '../../Screens/Registro/RegistroStep2';
import RegistroStep3 from '../../Screens/Registro/RegistroStep3';
import Splash from '../../Screens/Splash';
import { RootStackParamList } from '../../types/navigation';

export function AuthGroup(Stack: ReturnType<typeof createNativeStackNavigator<RootStackParamList>>) {
  return (
    <Stack.Group>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RegistroStep1" component={RegistroStep1} />
      <Stack.Screen name="RegistroStep2" component={RegistroStep2} />
      <Stack.Screen name="RegistroAddress" component={RegistroAddress} />
      <Stack.Screen name="RegistroStep3" component={RegistroStep3} />
    </Stack.Group>
  );
}

export function RegistrationGroup(Stack: ReturnType<typeof createNativeStackNavigator<RootStackParamList>>) {
  return (
    <Stack.Group>
      <Stack.Screen name="RegistroStep1" component={RegistroStep1} />
      <Stack.Screen name="RegistroStep2" component={RegistroStep2} />
      <Stack.Screen name="RegistroAddress" component={RegistroAddress} />
      <Stack.Screen name="RegistroStep3" component={RegistroStep3} />
       {/* Fallback */}
       <Stack.Screen name="Login" component={Login} />
    </Stack.Group>
  );
}
