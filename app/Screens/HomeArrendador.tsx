import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Firebaseauth } from '../../FirebaseConfig';

interface RouterProps {
  navigation: any;
}

const SAMPLE_CARS = [
  {
    id: '1',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: '2020',
    placa: 'ABC-123',
    precio: '$25/día',
    status: 'disponible',
    ganancias: '$1,250',
    reservas: 50,
  },
  {
    id: '2',
    marca: 'Honda',
    modelo: 'Civic',
    anio: '2019',
    placa: 'XYZ-789',
    precio: '$30/día',
    status: 'rentado',
    ganancias: '$2,100',
    reservas: 70,
  },
];

export default function HomeArrendador({ navigation }: RouterProps) {
  const [cars, setCars] = useState(SAMPLE_CARS);

  const handleAddCar = () => {
    navigation.navigate('PerfilVehiculo');
  };

  const handleEditCar = (carId: string) => {
    Alert.alert('Editar Vehículo', `Editar vehículo ${carId}`);
  };

  const handleDeleteCar = (carId: string) => {
    Alert.alert(
      'Eliminar Vehículo',
      '¿Estás seguro de que quieres eliminar este vehículo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCars(cars.filter(car => car.id !== carId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Vehículos</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Firebaseauth.signOut()}
        >
          <Ionicons name="log-out-outline" size={24} color="#0B729D" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>HOME ARRENDADOR</Text>

        {cars.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
            <Text style={styles.emptySubtext}>
              Agrega tu primer vehículo para comenzar a ganar dinero
            </Text>
          </View>
        ) : (
          <View style={styles.carsList}>
            {cars.map((car) => (
              <View key={car.id} style={styles.carCard}>
                <View style={styles.carHeader}>
                  <Text style={styles.carTitle}>
                    {car.marca} {car.modelo} {car.anio}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    car.status === 'disponible' ? styles.statusAvailable : styles.statusRented
                  ]}>
                    <Text style={styles.statusText}>
                      {car.status === 'disponible' ? 'Disponible' : 'Rentado'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.carDetails}>Placa: {car.placa}</Text>
                <Text style={styles.carPrice}>{car.precio}</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>{car.ganancias}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>{car.reservas} reservas</Text>
                  </View>
                </View>

                <View style={styles.carActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditCar(car.id)}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#032B3C" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCar(car.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddCar}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#032B3C',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  carsList: {
    gap: 15,
  },
  carCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#032B3C',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#D1FAE5',
  },
  statusRented: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#032B3C',
  },
  carDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  carPrice: {
    fontSize: 16,
    color: '#0B729D',
    fontWeight: '600',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  carActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 5,
  },
  editButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#032B3C',
  },
  deleteButtonText: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#0B729D',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});