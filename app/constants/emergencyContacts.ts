/**
 * Emergency Contacts Configuration
 * Centralized emergency contact information for trip emergencies
 */

export interface EmergencyContact {
  id: string;
  title: string;
  description: string;
  phone: string;
  icon: string;
  color: string;
  backgroundColor: string;
  urgent?: boolean;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    title: 'Policía',
    description: 'Accidentes, robo o emergencias de seguridad',
    phone: '911',
    icon: 'shield-outline',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    urgent: true,
  },
  {
    id: 'medical',
    title: 'Emergencia Médica',
    description: 'Ambulancia o asistencia médica urgente',
    phone: '911',
    icon: 'medkit-outline',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    urgent: true,
  },
  {
    id: 'tow',
    title: 'Grúa',
    description: 'Vehículo averiado o necesita remolque',
    phone: '+503-2222-3333',
    icon: 'car-outline',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  {
    id: 'roadside',
    title: 'Asistencia Vial',
    description: 'Problemas mecánicos, llanta ponchada, batería',
    phone: '+503-2222-4444',
    icon: 'build-outline',
    color: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  {
    id: 'insurance',
    title: 'Seguro',
    description: 'Reportar siniestro o daños al vehículo',
    phone: '+503-2222-5555',
    icon: 'shield-checkmark-outline',
    color: '#0891B2',
    backgroundColor: '#ECFEFF',
  },
  {
    id: 'support',
    title: 'Soporte Rentik',
    description: 'Ayuda con la app o preguntas sobre tu renta',
    phone: '+503-2222-6666',
    icon: 'headset-outline',
    color: '#0B729D',
    backgroundColor: '#F0F9FF',
  },
];

export const getUrgentContacts = (): EmergencyContact[] => {
  return EMERGENCY_CONTACTS.filter(contact => contact.urgent);
};

export const getNonUrgentContacts = (): EmergencyContact[] => {
  return EMERGENCY_CONTACTS.filter(contact => !contact.urgent);
};

export const getContactById = (id: string): EmergencyContact | undefined => {
  return EMERGENCY_CONTACTS.find(contact => contact.id === id);
};
