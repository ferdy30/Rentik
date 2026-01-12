import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CheckInComplete from '../../Screens/CheckIn/CheckInComplete';
import CheckInConditions from '../../Screens/CheckIn/CheckInConditions';
import CheckInDamageReport from '../../Screens/CheckIn/CheckInDamageReport';
import CheckInKeys from '../../Screens/CheckIn/CheckInKeys';
import CheckInPhotos from '../../Screens/CheckIn/CheckInPhotos';
import CheckInPreparation from '../../Screens/CheckIn/CheckInPreparation';
import CheckInProcessExplanation from '../../Screens/CheckIn/CheckInProcessExplanation';
import CheckInSignature from '../../Screens/CheckIn/CheckInSignature';
import CheckInStart from '../../Screens/CheckIn/CheckInStart';
import { RootStackParamList } from '../../types/navigation';

export function CheckInGroup(Stack: ReturnType<typeof createNativeStackNavigator<RootStackParamList>>) {
  return (
    <Stack.Group>
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
    </Stack.Group>
  );
}
