import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import BottomActionBar from '../components/Details/BottomActionBar';
import HostInfo from '../components/Details/HostInfo';
import VehicleCarousel from '../components/Details/VehicleCarousel';
import VehicleDescription from '../components/Details/VehicleDescription';
import VehicleFeatures from '../components/Details/VehicleFeatures';
import VehicleHeader from '../components/Details/VehicleHeader';
import VehicleLocationMap from '../components/Details/VehicleLocationMap';
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

          {/* Availability Badge */}
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityRow}>
              <Ionicons 
                name={vehicle.disponible ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={vehicle.disponible ? "#10B981" : "#EF4444"} 
              />
              <Text style={[
                styles.availabilityText,
                { color: vehicle.disponible ? "#10B981" : "#EF4444" }
              ]}>
                {vehicle.disponible ? "Disponible ahora" : "No disponible"}
              </Text>
            </View>
            {vehicle.disponible && (
              <Text style={styles.availabilitySubtext}>
                Reserva instantánea • Respuesta rápida
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          <VehicleSpecs
            transmision={vehicle.transmision}
            combustible={vehicle.combustible}
            pasajeros={vehicle.pasajeros}
            puertas={vehicle.puertas} 
          />

          <View style={styles.divider} />

			{/* Información Adicional */}
			{(vehicle.color || vehicle.kilometraje || vehicle.condicion || vehicle.mileageLimit === 'limited') && (
				<>
					<View style={{ marginBottom: 24 }}>
						<Text style={styles.sectionTitle}>Información Adicional</Text>
						{vehicle.color && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
								<Ionicons name="color-palette" size={20} color="#6B7280" style={{ marginRight: 12, width: 24 }} />
								<Text style={{ fontSize: 15, color: '#4B5563', flex: 1 }}>Color</Text>
								<Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{vehicle.color}</Text>
							</View>
						)}
						{vehicle.kilometraje && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
								<Ionicons name="speedometer" size={20} color="#6B7280" style={{ marginRight: 12, width: 24 }} />
								<Text style={{ fontSize: 15, color: '#4B5563', flex: 1 }}>Kilometraje</Text>
								<Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{vehicle.kilometraje?.toLocaleString()} km</Text>
							</View>
						)}
						{vehicle.condicion && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
								<Ionicons name="star" size={20} color="#6B7280" style={{ marginRight: 12, width: 24 }} />
								<Text style={{ fontSize: 15, color: '#4B5563', flex: 1 }}>Condición</Text>
								<Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{vehicle.condicion}</Text>
							</View>
						)}
						{vehicle.mileageLimit === 'limited' && vehicle.dailyKm && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
								<Ionicons name="warning" size={20} color="#F59E0B" style={{ marginRight: 12, width: 24 }} />
								<Text style={{ fontSize: 15, color: '#4B5563', flex: 1 }}>Límite diario</Text>
								<Text style={{ fontSize: 15, fontWeight: '600', color: '#F59E0B' }}>{vehicle.dailyKm} km/día</Text>
							</View>
						)}
					</View>
					<View style={styles.divider} />
				</>
			)}

			<VehicleDescription description={vehicle.descripcion} />

			<View style={styles.divider} />

			{/* Reglas y Descuentos */}
			{(vehicle.rules || vehicle.discounts) && (
				<>
					<View style={{ marginBottom: 24 }}>
						<Text style={styles.sectionTitle}>Reglas</Text>
						{vehicle.rules?.petsAllowed !== undefined && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
								<Ionicons 
									name={vehicle.rules.petsAllowed ? "checkmark-circle" : "close-circle"} 
									size={22} 
									color={vehicle.rules.petsAllowed ? "#10B981" : "#EF4444"} 
									style={{ marginRight: 10 }}
								/>
								<Text style={{ fontSize: 15, color: '#374151' }}>Mascotas {vehicle.rules.petsAllowed ? 'permitidas' : 'no permitidas'}</Text>
							</View>
						)}
						{vehicle.rules?.smokingAllowed !== undefined && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
								<Ionicons 
									name={vehicle.rules.smokingAllowed ? "checkmark-circle" : "close-circle"} 
									size={22} 
									color={vehicle.rules.smokingAllowed ? "#10B981" : "#EF4444"} 
									style={{ marginRight: 10 }}
								/>
								<Text style={{ fontSize: 15, color: '#374151' }}>Fumar {vehicle.rules.smokingAllowed ? 'permitido' : 'no permitido'}</Text>
							</View>
						)}
						{vehicle.rules?.outOfCityAllowed !== undefined && (
							<View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
								<Ionicons 
									name={vehicle.rules.outOfCityAllowed ? "checkmark-circle" : "close-circle"} 
									size={22} 
									color={vehicle.rules.outOfCityAllowed ? "#10B981" : "#EF4444"} 
									style={{ marginRight: 10 }}
								/>
								<Text style={{ fontSize: 15, color: '#374151' }}>Viajes fuera de ciudad {vehicle.rules.outOfCityAllowed ? 'permitidos' : 'no permitidos'}</Text>
							</View>
						)}
						
						{(vehicle.discounts?.weekly > 0 || vehicle.discounts?.monthly > 0) && (
							<View style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
								<Ionicons name="pricetag" size={20} color="#0B729D" style={{ marginRight: 10 }} />
								<View>
									{vehicle.discounts.weekly > 0 && (
										<Text style={{ fontSize: 14, fontWeight: '600', color: '#0B729D' }}>{vehicle.discounts.weekly}% descuento semanal</Text>
									)}
									{vehicle.discounts.monthly > 0 && (
										<Text style={{ fontSize: 14, fontWeight: '600', color: '#0B729D' }}>{vehicle.discounts.monthly}% descuento mensual</Text>
									)}
								</View>
							</View>
						)}
					</View>
					<View style={styles.divider} />
				</>
			)}

          <VehicleFeatures features={vehicle.caracteristicas} />

          <View style={styles.divider} />

          <VehiclePolicies features={vehicle.caracteristicas} />

          <View style={styles.divider} />

          {/* Ubicación con mapa */}
          <VehicleLocationMap 
            coordinates={vehicle.coordinates}
            ubicacion={vehicle.ubicacion}
          />

          <View style={styles.divider} />

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
        transparent={false}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
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
            style={styles.imageScrollView}
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
  availabilityCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 24,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '800',
  },
  availabilitySubtext: {
    fontSize: 13,
    color: '#059669',
    marginLeft: 28,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
  },
  imageScrollView: {
    flex: 1,
  },
  fullScreenImageContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
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
