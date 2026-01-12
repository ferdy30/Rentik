import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'ambulance' | 'insurance' | 'roadside' | 'owner' | 'support';
  icon: string;
  color: string;
}

interface EmergencyModeProps {
  visible: boolean;
  onClose: () => void;
  ownerPhone?: string;
  ownerName?: string;
  vehiclePlate?: string;
  insurancePhone?: string;
}

export default function EmergencyMode({
  visible,
  onClose,
  ownerPhone,
  ownerName,
  vehiclePlate,
  insurancePhone,
}: EmergencyModeProps) {
  const emergencyContacts: EmergencyContact[] = [
    {
      id: 'police',
      name: 'Policía',
      phone: '911',
      type: 'police',
      icon: 'shield',
      color: '#1E40AF',
    },
    {
      id: 'ambulance',
      name: 'Ambulancia',
      phone: '911',
      type: 'ambulance',
      icon: 'medical',
      color: '#DC2626',
    },
    {
      id: 'owner',
      name: ownerName || 'Propietario',
      phone: ownerPhone || '',
      type: 'owner',
      icon: 'person',
      color: '#0B729D',
    },
    {
      id: 'insurance',
      name: 'Seguro del Vehículo',
      phone: insurancePhone || '2222-2222',
      type: 'insurance',
      icon: 'shield-checkmark',
      color: '#059669',
    },
    {
      id: 'roadside',
      name: 'Asistencia Vial',
      phone: '*2273',
      type: 'roadside',
      icon: 'car',
      color: '#F59E0B',
    },
    {
      id: 'support',
      name: 'Soporte Rentik',
      phone: '+503 7777-7777',
      type: 'support',
      icon: 'headset',
      color: '#8B5CF6',
    },
  ];

  const handleCall = (contact: EmergencyContact) => {
    if (!contact.phone) {
      Alert.alert(
        'Sin contacto',
        'No hay un número de teléfono disponible para este contacto.'
      );
      return;
    }

    Alert.alert(
      `Llamar a ${contact.name}`,
      `¿Deseas llamar a ${contact.name} (${contact.phone})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          style: 'default',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
          },
        },
      ]
    );
  };

  const handleShareLocation = async () => {
    Alert.alert(
      'Compartir Ubicación',
      'Se compartirá tu ubicación actual con el propietario del vehículo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Compartir',
          onPress: () => {
            // Implementar compartir ubicación
            Alert.alert('Ubicación compartida', 'Tu ubicación ha sido enviada.');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modo Emergencia</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Alert Banner */}
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.alertText}>
            Usa estos contactos solo en caso de emergencia real
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vehicle Info */}
          {vehiclePlate && (
            <View style={styles.vehicleInfo}>
              <Ionicons name="car" size={20} color="#6B7280" />
              <Text style={styles.vehicleText}>Vehículo: {vehiclePlate}</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={handleShareLocation}>
              <Ionicons name="location" size={24} color="#DC2626" />
              <Text style={styles.quickActionText}>Compartir Ubicación</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Contacts */}
          <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>

          {emergencyContacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => handleCall(contact)}
              disabled={!contact.phone}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${contact.color}20` }]}>
                <Ionicons name={contact.icon as any} size={28} color={contact.color} />
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>
                  {contact.phone || 'No disponible'}
                </Text>
              </View>

              {contact.phone && (
                <Ionicons name="call" size={24} color={contact.color} />
              )}
            </TouchableOpacity>
          ))}

          {/* Emergency Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>⚠️ En caso de emergencia:</Text>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>1.</Text>
              <Text style={styles.tipText}>
                Mantén la calma y evalúa la situación
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>2.</Text>
              <Text style={styles.tipText}>
                Si hay heridos, llama primero al 911
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>3.</Text>
              <Text style={styles.tipText}>
                Documenta con fotos y videos si es posible
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>4.</Text>
              <Text style={styles.tipText}>
                Contacta al propietario del vehículo
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>5.</Text>
              <Text style={styles.tipText}>
                No admitas responsabilidad sin hablar con el seguro
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function EmergencyButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.emergencyButton} onPress={onPress}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <Text style={styles.emergencyButtonText}>SOS</Text>
    </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#DC2626',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  quickActions: {
    marginTop: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginRight: 8,
    width: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
});
