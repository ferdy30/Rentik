import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import BookingBottomSheet from '../components/Details/BookingBottomSheet';
import BottomActionBar from '../components/Details/BottomActionBar';
import DetailsSkeleton from '../components/Details/DetailsSkeleton';
import FadeInSection from '../components/Details/FadeInSection';
import HostInfo from '../components/Details/HostInfo';
import VehicleAdditionalInfo from '../components/Details/VehicleAdditionalInfo';
import VehicleBookingTerms from '../components/Details/VehicleBookingTerms';
import VehicleCarousel from '../components/Details/VehicleCarousel';
import VehicleDeliveryOptions from '../components/Details/VehicleDeliveryOptions';
import VehicleDescription from '../components/Details/VehicleDescription';
import VehicleFeatures from '../components/Details/VehicleFeatures';
import VehicleHeader from '../components/Details/VehicleHeader';
import VehicleLocationMap from '../components/Details/VehicleLocationMap';
import VehiclePolicies from '../components/Details/VehiclePolicies';
import VehicleReviews from '../components/Details/VehicleReviews';
import VehicleSpecs from '../components/Details/VehicleSpecs';
import { useFavorites } from '../context/FavoritesContext';
import { normalizeVehicleData } from '../services/vehicles';
import type { RootStackParamList } from '../types/navigation';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Details() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRouteProp>();
  const { vehicle: rawVehicle } = route.params;
  const { favorites, toggleFavorite } = useFavorites();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  
  // Normalizar datos para asegurar consistencia
  const vehicle = React.useMemo(() => {
    const normalized = normalizeVehicleData(rawVehicle.id || '', rawVehicle);
    console.log('📋 Vehicle Data en Details:', {
      id: normalized.id,
      marca: normalized.marca,
      modelo: normalized.modelo,
      descripcion: normalized.descripcion,
      caracteristicas: normalized.caracteristicas,
      caracteristicasLength: normalized.caracteristicas?.length
    });
    return normalized;
  }, [rawVehicle]);

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
  
  const isFavorite = favorites.includes(vehicle.id);
  
  // Mock reviews data (en producción vendría de Firestore)
  const mockReviews = [
    {
      id: '1',
      userName: 'Carlos Mendoza',
      rating: 5,
      date: 'Hace 2 semanas',
      comment: 'Excelente vehículo, muy limpio y el anfitrión fue muy atento. La experiencia fue perfecta.',
      tripDuration: 'Rentó por 5 días',
    },
    {
      id: '2',
      userName: 'María González',
      rating: 5,
      date: 'Hace 1 mes',
      comment: 'Todo impecable, el auto en perfectas condiciones. Totalmente recomendado.',
      tripDuration: 'Rentó por 3 días',
    },
  ];

  useEffect(() => {
    // Simular loading inicial
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
  }, [vehicle.arrendadorId]);

  // Usar las imágenes normalizadas
  const images = vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes : [vehicle.imagen || 'https://via.placeholder.com/400'];

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

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
        <VehicleCarousel
          images={images}
          onBackPress={() => navigation.goBack()}
          onSharePress={handleShare}
          onImagePress={handleImagePress}
          onFavoritePress={() => toggleFavorite(vehicle.id)}
          isFavorite={isFavorite}
        />

        <View style={styles.content}>
          <FadeInSection delay={0}>
            <VehicleHeader
              marca={vehicle.marca}
              modelo={vehicle.modelo}
              anio={vehicle.anio}
              rating={vehicle.rating}
              reviewCount={vehicle.reviewCount}
            />
          </FadeInSection>

          {/* Availability Badge */}
          <FadeInSection delay={100}>
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
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={200}>
            <VehicleSpecs
            transmision={vehicle.transmision}
            combustible={vehicle.combustible}
            pasajeros={vehicle.pasajeros}
            puertas={vehicle.puertas} 
            />
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={300}>
            <VehicleAdditionalInfo 
            color={vehicle.color}
            kilometraje={vehicle.kilometraje}
            condicion={vehicle.condicion}
            mileageLimit={vehicle.mileageLimit}
            dailyKm={vehicle.dailyKm}
            />
          </FadeInSection>

          <FadeInSection delay={400}>
			      <VehicleDescription description={vehicle.descripcion} />
          </FadeInSection>

			<View style={styles.divider} />

            {/* Descuentos */}
            {(vehicle.discounts?.weekly > 0 || vehicle.discounts?.monthly > 0) && (
                <>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={styles.sectionTitle}>Descuentos</Text>
                        <View style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
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
                    </View>
                    <View style={styles.divider} />
                </>
            )}

          <FadeInSection delay={500}>
            <VehicleFeatures features={vehicle.caracteristicas} />
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={600}>
            <VehicleReviews
              reviews={mockReviews}
              averageRating={vehicle.rating}
              totalReviews={vehicle.reviewCount}
              ratingBreakdown={{
                cleanliness: 4.9,
                communication: 4.8,
                accuracy: 5.0,
                value: 4.7,
              }}
            />
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={700}>
            <VehiclePolicies rules={vehicle.rules} />
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={800}>
            <VehicleBookingTerms 
            deposit={vehicle.deposit}
            advanceNotice={vehicle.advanceNotice}
            minTripDuration={vehicle.minTripDuration}
            maxTripDuration={vehicle.maxTripDuration}
            protectionPlan={vehicle.protectionPlan}
            />
          </FadeInSection>

          <FadeInSection delay={900}>
            <VehicleDeliveryOptions 
            flexibleHours={vehicle.flexibleHours}
            deliveryHours={vehicle.deliveryHours}
            airportDelivery={vehicle.airportDelivery}
            airportFee={vehicle.airportFee}
            />
          </FadeInSection>

          {/* Ubicación con mapa */}
          <FadeInSection delay={1000}>
            <VehicleLocationMap 
            coordinates={vehicle.coordinates}
            ubicacion={vehicle.ubicacion}
            />
          </FadeInSection>

          <View style={styles.divider} />

          <FadeInSection delay={1100}>
            {loadingHost ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ color: '#6B7280' }}>Cargando anfitrión…</Text>
              </View>
            ) : (
              <HostInfo name={hostName} joinedDate={hostJoined} photoURL={hostPhoto} rating={hostRating} completedTrips={hostTrips} />
            )}
            {errorHost && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: '#DC2626', fontSize: 12 }}>{errorHost}</Text>
              </View>
            )}
          </FadeInSection>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomActionBar
        price={vehicle.precio}
        onBookPress={() => setShowBookingSheet(true)}
      />

      {/* Booking Bottom Sheet */}
      <BookingBottomSheet
        visible={showBookingSheet}
        onClose={() => setShowBookingSheet(false)}
        onConfirm={(startDate, endDate) => {
          navigation.navigate('BookingStep1Dates', { 
            vehicle,
            preselectedDates: { startDate, endDate }
          });
        }}
        pricePerDay={vehicle.precio}
        weeklyDiscount={vehicle.discounts?.weekly}
        monthlyDiscount={vehicle.discounts?.monthly}
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
