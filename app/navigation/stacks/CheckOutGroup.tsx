import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CheckOutComplete from '../../Screens/CheckOut/CheckOutComplete';
import CheckOutConditions from '../../Screens/CheckOut/CheckOutConditions';
import CheckOutPhotos from '../../Screens/CheckOut/CheckOutPhotos';
import CheckOutReview from '../../Screens/CheckOut/CheckOutReview';
import CheckOutStart from '../../Screens/CheckOut/CheckOutStart';
import RateExperience from '../../Screens/CheckOut/RateExperience';
import { RootStackParamList } from '../../types/navigation';

export function CheckOutGroup(Stack: ReturnType<typeof createNativeStackNavigator<RootStackParamList>>) {
  return (
    <Stack.Group>
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
    </Stack.Group>
  );
}
