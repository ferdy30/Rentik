import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import ChatScreen from './Arrendador/Chat';
import DashboardScreen from './Arrendador/Dashboard';
import MisAutosScreen from './Arrendador/MisAutos';
import PerfilScreen from './Arrendador/Perfil';
import ReservasScreen from './Arrendador/Reservas';

const Tab = createBottomTabNavigator();

export default function HomeArrendador() {
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0B729D',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Mis autos') iconName = focused ? 'car' : 'car-outline';
          if (route.name === 'Reservas') iconName = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Mensajes') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Mis autos" component={MisAutosScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Mensajes" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
