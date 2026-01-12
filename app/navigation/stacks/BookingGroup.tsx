import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import BookingStep1Dates from '../../Screens/Booking/BookingStep1Dates';
import BookingStep2Location from '../../Screens/Booking/BookingStep2Location';
import BookingStep3Time from '../../Screens/Booking/BookingStep3Time';
import BookingStep4Confirmation from '../../Screens/Booking/BookingStep4Confirmation';
import { RootStackParamList } from '../../types/navigation';

export function BookingGroup(Stack: ReturnType<typeof createNativeStackNavigator<RootStackParamList>>) {
  return (
    <Stack.Group>
      <Stack.Screen name="BookingStep1Dates" component={BookingStep1Dates} />
      <Stack.Screen name="BookingStep2Location" component={BookingStep2Location} />
      <Stack.Screen name="BookingStep3Time" component={BookingStep3Time} />
      <Stack.Screen name="BookingStep4Confirmation" component={BookingStep4Confirmation} />
    </Stack.Group>
  );
}
