import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { styles } from './styles';

export default function ViajesScreen() {
  const trips = [
    { id: 't1', auto: 'Corolla 2020', fechas: '12-14 Nov', estado: 'En curso' },
    { id: 't2', auto: 'Civic 2019', fechas: '20-22 Nov', estado: 'Próximo' },
    { id: 't3', auto: 'Sentra 2021', fechas: '05-07 Dic', estado: 'Completado' },
  ];
  const badgeStyle = (estado: string) => {
    if (estado === 'En curso') return { backgroundColor: '#DBEAFE' };
    if (estado === 'Próximo') return { backgroundColor: '#FEF9C3' };
    return { backgroundColor: '#DCFCE7' };
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Viajes</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
        {trips.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{t.auto}</Text>
              <View style={[{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }, badgeStyle(t.estado)]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#032B3C' }}>{t.estado}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>{t.fechas}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
