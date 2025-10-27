import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Firebaseauth } from '../../FirebaseConfig';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const SAMPLE_CARS = [
  {
    id: '1',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: '2020',
    precio: '$25/día',
    ubicacion: 'San Salvador',
    image: 'https://picsum.photos/300/200',
  },
  {
    id: '2',
    marca: 'Honda',
    modelo: 'Civic',
    anio: '2019',
    precio: '$30/día',
    ubicacion: 'Santa Tecla',
    image: 'https://picsum.photos/300/201',
  },
  {
    id: '3',
    marca: 'Nissan',
    modelo: 'Sentra',
    anio: '2021',
    precio: '$28/día',
    ubicacion: 'Antiguo Cuscatlán',
    image: 'https://picsum.photos/300/202',
  },
  {
    id: '4',
    marca: 'Hyundai',
    modelo: 'Accent',
    anio: '2018',
    precio: '$22/día',
    ubicacion: 'Soyapango',
    image: 'https://picsum.photos/300/203',
  },
];

export default function Home({navigation}: RouterProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header con logo y botón de logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Arrendatario</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Firebaseauth.signOut()}
        >
          <Ionicons name="log-out-outline" size={24} color="#0B729D" />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda (funcionalidad futura) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <Text style={styles.searchText}>Buscar carros disponibles...</Text>
        </View>
      </View>

      {/* Lista de carros disponibles con ScrollView */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Carros Disponibles</Text>
        
        {/* Grid de cards de carros */}
        <View style={styles.grid}>
          {SAMPLE_CARS.map((car) => (
            <TouchableOpacity
              key={car.id}
              style={styles.card}
              onPress={() => navigation.navigate('Details', { id: car.id })}
            >
              {/* Imagen del carro */}
              <Image
                source={{ uri: car.image }}
                style={styles.cardImage}
              />
              {/* Info del carro */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{car.marca} {car.modelo}</Text>
                <Text style={styles.cardSubtitle}>{car.anio}</Text>
                <Text style={styles.cardPrice}>{car.precio}</Text>
                {/* Ubicación con icono */}
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.locationText}>{car.ubicacion}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
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
    backgroundColor: '#fff',
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchText: {
    marginLeft: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 15,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#0B729D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 14,
    color: '#0B729D',
    fontWeight: '600',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
