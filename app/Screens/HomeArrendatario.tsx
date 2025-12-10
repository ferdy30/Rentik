import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/Auth';
import { subscribeToUserChats } from '../services/chat';
import { getUserReservations } from '../services/reservations';
import BuscarScreen from './Arrendatario/Buscar';
import ChatScreen from './Arrendatario/Chat';
import FavoritosScreen from './Arrendatario/Favoritos';
import PerfilScreen from './Arrendatario/Perfil';
import ViajesScreen from './Arrendatario/Viajes';

const Tab = createBottomTabNavigator();

export default function Home() {
  const { user } = useAuth();
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Suscribirse a viajes activos
    const loadReservations = async () => {
      try {
        const reservations = await getUserReservations(user.uid);
        const active = reservations.filter(r => 
          r.status === 'pending' || r.status === 'confirmed'
        ).length;
        setActiveTripsCount(active);
      } catch (error) {
        console.error('Error loading reservations:', error);
      }
    };

    loadReservations();

    // Suscribirse a chats no leídos
    const unsubscribe = subscribeToUserChats(
      user.uid,
      20,
      (chats) => {
        const unread = chats.reduce((total, chat) => {
          return total + (chat.unreadCount?.[user.uid] || 0);
        }, 0);
        setUnreadChatsCount(unread);
      },
      (error) => console.error('Error subscribing to chats:', error)
    );

    return () => unsubscribe();
  }, [user]);

  const renderTabBarIcon = useCallback(({ route, color, focused }: any) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
    let badgeCount = 0;

    if (route.name === 'Buscar') iconName = focused ? 'search' : 'search-outline';
    if (route.name === 'Favoritos') iconName = focused ? 'heart' : 'heart-outline';
    if (route.name === 'Viajes') {
      iconName = focused ? 'briefcase' : 'briefcase-outline';
      badgeCount = activeTripsCount;
    }
    if (route.name === 'Chat') {
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
  }, [activeTripsCount, unreadChatsCount]);

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
        tabBarIcon: ({ color, focused }) => renderTabBarIcon({ route, color, focused }),
      })}
    >
      <Tab.Screen name="Buscar" component={BuscarScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
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

