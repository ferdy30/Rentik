import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/Auth';
import { subscribeToUserChats } from '../services/chat';
import { getOwnerReservations } from '../services/reservations';
import { logger } from '../utils/logger';
import ChatScreen from './Arrendador/Chat';
import DashboardScreen from './Arrendador/Dashboard';
import MisAutosScreen from './Arrendador/MisAutos';
import PerfilScreen from './Arrendador/Perfil';
import ReservasScreen from './Arrendador/Reservas';

const Tab = createBottomTabNavigator();

export default function HomeArrendador() {
  const { user } = useAuth();
  const [activeReservationsCount, setActiveReservationsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const fetchActiveReservations = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const reservations = await getOwnerReservations(user.uid);
      const active = reservations.filter(r => 
        r.status === 'pending' || r.status === 'confirmed'
      ).length;
      setActiveReservationsCount(active);
    } catch (error) {
      logger.error('Error fetching active reservations:', error);
    }
  }, [user?.uid]);

  // Actualizar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      fetchActiveReservations();
    }, [fetchActiveReservations])
  );

  useEffect(() => {
    if (!user?.uid) return;
    
    // Initial fetch
    fetchActiveReservations();
    
    // Subscribe to chats for unread count
    const unsubscribe = subscribeToUserChats(
      user.uid,
      20,
      (chats) => {
        const unread = chats.reduce((total, chat) => {
          return total + (chat.unreadCount?.[user.uid] || 0);
        }, 0);
        setUnreadChatsCount(unread);
      },
      (error) => logger.error('Error subscribing to chats:', error)
    );
    
    return () => {
      unsubscribe();
    };
  }, [user?.uid]); // Removed fetchActiveReservations from deps to avoid re-subscription

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
          let badgeCount = 0;
          
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Mis autos') iconName = focused ? 'car' : 'car-outline';
          if (route.name === 'Reservas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
            badgeCount = activeReservationsCount;
          }
          if (route.name === 'Mensajes') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            badgeCount = unreadChatsCount;
          }
          if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          
          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={20} color={color} />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 9 ? '9+' : badgeCount}
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

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
