import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../context/Auth';
import { getOwnerReservations } from '../services/reservations';
import ChatScreen from './Arrendador/Chat';
import DashboardScreen from './Arrendador/Dashboard';
import MisAutosScreen from './Arrendador/MisAutos';
import PerfilScreen from './Arrendador/Perfil';
import ReservasScreen from './Arrendador/Reservas';

const Tab = createBottomTabNavigator();

export default function HomeArrendador() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingReservations = useCallback(async () => {
    if (!user) return;
    try {
      const reservations = await getOwnerReservations(user.uid);
      const pending = reservations.filter(r => r.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Error fetching pending reservations:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingReservations();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchPendingReservations, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingReservations]);

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
          return (
            <View>
              <Ionicons name={iconName} size={20} color={color} />
              {route.name === 'Reservas' && pendingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -8,
                  top: -4,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  width: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          );
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
