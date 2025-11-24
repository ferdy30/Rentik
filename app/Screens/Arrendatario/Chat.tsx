import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { styles } from './styles';

export default function ChatScreen() {
  const chats = [
    { id: 'c1', nombre: 'Carlos M.', ultimo: '¿A qué hora entrego?', unread: 2 },
    { id: 'c2', nombre: 'Ana P.', ultimo: 'Gracias!', unread: 0 },
  ];
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
        {chats.map(c => (
          <View key={c.id} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={20} color="#0B729D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{c.nombre}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{c.ultimo}</Text>
              </View>
              {c.unread > 0 && (
                <View style={{ minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{c.unread}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
