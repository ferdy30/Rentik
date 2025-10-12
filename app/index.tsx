import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Login from './Screens/Login';

const Stack = createNativeStackNavigator();

export default function App() {
 
    return (
     
        <Stack.Navigator initialRouteName="Login">
               <Stack.Screen name="Login" component={Login} options={{headerShown: false}}/>
        </Stack.Navigator>
     
    )
  }


