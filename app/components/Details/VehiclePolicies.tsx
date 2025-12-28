import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VehicleRules } from '../../types/vehicle';

interface VehiclePoliciesProps {
  rules?: VehicleRules;
}

export default function VehiclePolicies({ rules }: VehiclePoliciesProps) {
  // Valores por defecto si no existen reglas definidas
  const petsAllowed = rules?.petsAllowed ?? false;
  const smokingAllowed = rules?.smokingAllowed ?? false;
  const crossBorderAllowed = rules?.crossBorderAllowed ?? false;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reglas y Políticas</Text>
      
      <View style={styles.policyGrid}>
        {/* Regla: Fumar */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: smokingAllowed ? '#DCFCE7' : '#FEE2E2' }]}>
            <Ionicons name={smokingAllowed ? "checkmark-circle-outline" : "ban-outline"} size={20} color={smokingAllowed ? '#16A34A' : '#DC2626'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>{smokingAllowed ? 'Fumar permitido' : 'Prohibido fumar'}</Text>
            <Text style={styles.policyDesc}>{smokingAllowed ? 'Se permite fumar' : 'Multa por olor a humo'}</Text>
          </View>
        </View>

        {/* Regla: Mascotas */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: petsAllowed ? '#DCFCE7' : '#F3F4F6' }]}>
            <Ionicons name="paw-outline" size={20} color={petsAllowed ? '#16A34A' : '#6B7280'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>{petsAllowed ? 'Mascotas permitidas' : 'Sin mascotas'}</Text>
            <Text style={styles.policyDesc}>{petsAllowed ? 'Se aceptan animales' : 'No se permiten animales'}</Text>
          </View>
        </View>

        {/* Regla: Viajes fuera de ciudad/país */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: crossBorderAllowed ? '#DCFCE7' : '#F3F4F6' }]}>
            <Ionicons name="map-outline" size={20} color={crossBorderAllowed ? '#16A34A' : '#6B7280'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>{crossBorderAllowed ? 'Viajes largos' : 'Solo ciudad'}</Text>
            <Text style={styles.policyDesc}>{crossBorderAllowed ? 'Permitido salir de la ciudad' : 'Uso local únicamente'}</Text>
          </View>
        </View>

        {/* Regla: Combustible (Estándar) */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="water-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>Combustible</Text>
            <Text style={styles.policyDesc}>Devolver con el mismo nivel</Text>
          </View>
        </View>


        {/* Regla: Limpieza */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEF9C3' }]}>
            <Ionicons name="sparkles-outline" size={20} color="#CA8A04" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>Limpieza</Text>
            <Text style={styles.policyDesc}>Devolver limpio y ordenado</Text>
          </View>
        </View>

        {/* Regla: Velocidad */}
        <View style={styles.policyItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="speedometer-outline" size={20} color="#DC2626" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.policyTitle}>Límites de velocidad</Text>
            <Text style={styles.policyDesc}>Respetar límites y normas de tránsito</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Tu protección</Text>
      <View style={styles.protectionContainer}>
        <View style={styles.protectionRow}>
          <Ionicons name="headset-outline" size={24} color="#0B729D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.protectionTitle}>Soporte 24/7</Text>
            <Text style={styles.protectionDesc}>Acceso a asistencia vial y soporte de Rentik en todo momento.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  policyGrid: {
    gap: 16,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  policyDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  protectionContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  protectionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  protectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  protectionDesc: {
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18,
  },
});
