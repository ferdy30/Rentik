import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import { Firebaseauth } from '../../../FirebaseConfig';
import { styles } from './styles';

export default function PerfilScreen() {
  const { user, userData } = useAuth();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>
      <View style={[styles.content, { gap: 12 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={28} color="#0B729D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#032B3C' }}>{userData?.nombre} {userData?.apellido}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{user?.email}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
            <Text style={{ fontSize: 14, color: '#032B3C', fontWeight: '600' }}>Rol: {userData?.role ?? '—'}</Text>
          </View>
        </View>
        <TouchableOpacity style={{ backgroundColor: '#0B729D', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 50, flexDirection: 'row', gap: 8 }} onPress={() => Firebaseauth.signOut()}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
