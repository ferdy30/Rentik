import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>
      <View style={[styles.content, { gap: 12 }]}>
        
        {/* Earnings Option */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Ingresos')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="cash-outline" size={24} color="#0B729D" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Mis Ingresos</Text>
            <Text style={styles.menuSubtitle}>Ver ganancias y reportes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16 }}>
          <Text style={{ color: '#032B3C', fontSize: 16, fontWeight: '700' }}>Próximamente</Text>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>Aquí podrás editar tu perfil, preferencias y datos de pago.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0B729D',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
