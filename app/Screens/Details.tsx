import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import BottomActionBar from '../components/Details/BottomActionBar';
import HostInfo from '../components/Details/HostInfo';
import VehicleCarousel from '../components/Details/VehicleCarousel';
import VehicleDescription from '../components/Details/VehicleDescription';
import VehicleFeatures from '../components/Details/VehicleFeatures';
import VehicleHeader from '../components/Details/VehicleHeader';
import VehiclePolicies from '../components/Details/VehiclePolicies';
import VehicleSpecs from '../components/Details/VehicleSpecs';
import type { RootStackParamList } from '../types/navigation';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Details() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRouteProp>();
  const { vehicle } = route.params;
  const [hostName, setHostName] = useState('Arrendador Verificado');
  const [hostJoined, setHostJoined] = useState('Se unió recientemente');
  const [hostPhoto, setHostPhoto] = useState<string | undefined>(undefined);
  const [loadingHost, setLoadingHost] = useState<boolean>(true);
  const [errorHost, setErrorHost] = useState<string | null>(null);
  const [hostRating, setHostRating] = useState<number | undefined>(undefined);
  const [hostTrips, setHostTrips] = useState<number | undefined>(undefined);

  // Full screen image state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchHost = async () => {
      const ownerId = vehicle.arrendadorId || vehicle.propietarioId;
      if (ownerId) {
        try {
          setLoadingHost(true);
          const userDoc = await getDoc(doc(db, 'users', ownerId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.nombre) {
              setHostName(`${data.nombre} ${data.apellido || ''}`.trim());
            }
            if (data.photoURL) {
              setHostPhoto(data.photoURL);
            }
            const created = data.createdAt;
            if (created && typeof created.toDate === 'function') {
              const year = created.toDate().getFullYear();
              setHostJoined(`Se unió en ${year}`);
            }
            if (typeof data.rating === 'number') {
              setHostRating(data.rating);
            }
            if (typeof data.completedTrips === 'number') {
              setHostTrips(data.completedTrips);
            }
            setErrorHost(null);
          }
        } catch (e) {
          console.error('Error fetching host:', e);
          setErrorHost('No se pudo cargar la información del anfitrión');
        }
        setLoadingHost(false);
      }
    };
    fetchHost();
  }, [vehicle.arrendadorId, vehicle.propietarioId]);

  const images = vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes : [vehicle.imagen];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este ${vehicle.marca} ${vehicle.modelo} en Rentik! $${vehicle.precio}/día`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
        <VehicleCarousel
          images={images}
          onBackPress={() => navigation.goBack()}
          onSharePress={handleShare}
          onImagePress={handleImagePress}
        />

        <View style={styles.content}>
          <VehicleHeader
            marca={vehicle.marca}
            modelo={vehicle.modelo}
            anio={vehicle.anio}
            rating={vehicle.rating}
            reviewCount={vehicle.reviewCount}
          />

          <View style={styles.divider} />

          <VehicleSpecs
            transmision={vehicle.transmision}
            combustible={vehicle.combustible}
            pasajeros={vehicle.pasajeros}
            puertas={vehicle.puertas} 
          />

          <View style={styles.divider} />

          <VehicleDescription description={vehicle.descripcion} />

          <View style={styles.divider} />

          <VehicleFeatures features={vehicle.caracteristicas} />

          <View style={styles.divider} />

          <VehiclePolicies features={vehicle.caracteristicas} />

          <View style={styles.divider} />

          {/* Ubicación de recogida */}
          {vehicle.pickupLocation ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>Recogida</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#374151' }}>{vehicle.pickupLocation}</Text>
              </View>
            </View>
          ) : null}

          {vehicle.pickupLocation && <View style={styles.divider} />}

          {loadingHost ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#6B7280' }}>Cargando anfitrión…</Text>
            </View>
          ) : (
            <HostInfo name={hostName} joinedDate={hostJoined} photoURL={hostPhoto} rating={hostRating} completedTrips={hostTrips} />
          )}
          {errorHost ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#DC2626', fontSize: 12 }}>{errorHost}</Text>
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomActionBar
        price={vehicle.precio}
        onBookPress={() => navigation.navigate('BookingStep1Dates', { vehicle })}
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((img: string, index: number) => (
              <View key={index} style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri: img }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>{selectedImageIndex + 1} / {images.length}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  fullScreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
