import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

export default function Details() {
  const route = useRoute<DetailsRouteProp>();
  const { id } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del vehículo</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
      {/* TODO: cargar datos reales desde Firestore por id */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#032B3C',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
