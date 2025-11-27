import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function Details() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRouteProp>();
  const { vehicle } = route.params;
  const [hostName, setHostName] = useState('Arrendador Verificado');
  const [hostJoined, setHostJoined] = useState('Se unió recientemente');
  const [hostPhoto, setHostPhoto] = useState<string | undefined>(undefined);
  const [loadingHost, setLoadingHost] = useState<boolean>(true);
  const [errorHost, setErrorHost] = useState<string | null>(null);
  const [priceInfoVisible, setPriceInfoVisible] = useState<boolean>(false);
  const [hostRating, setHostRating] = useState<number | undefined>(undefined);
  const [hostTrips, setHostTrips] = useState<number | undefined>(undefined);

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

  const priceBreakdown = useMemo(() => {
    const base = Number(vehicle.precio) || 0;
    const serviceFee = +(base * 0.12).toFixed(2);
    const taxes = +(base * 0.07).toFixed(2);
    const totalPerDay = +(base + serviceFee + taxes).toFixed(2);
    return { base, serviceFee, taxes, totalPerDay };
  }, [vehicle.precio]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este ${vehicle.marca} ${vehicle.modelo} en Rentik! $${vehicle.precio}/día`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChatHost = () => {
    navigation.navigate('ChatRoom', {
      reservationId: `preview-${vehicle.id}`,
      participants: [/* se completa al crear la reserva */],
      vehicleInfo: { marca: vehicle.marca, modelo: vehicle.modelo, imagen: images[0] }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
        <VehicleCarousel
          images={images}
          onBackPress={() => navigation.goBack()}
          onSharePress={handleShare}
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

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6',
                paddingVertical: 10,
                borderRadius: 10,
                gap: 6
              }}
              onPress={() => setPriceInfoVisible(true)}
            >
              <Ionicons name="cash-outline" size={18} color="#374151" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Ver desglose</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0B729D',
                paddingVertical: 10,
                borderRadius: 10,
                gap: 6
              }}
              onPress={handleChatHost}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Chatear con anfitrión</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomActionBar
        price={vehicle.precio}
        onBookPress={() => navigation.navigate('BookingStep1Dates', { vehicle })}
      />

      {/* Modal simple de desglose de precio */}
      {priceInfoVisible && (
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'
        }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Desglose por día</Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#374151' }}>Precio base</Text>
                <Text style={{ color: '#111827', fontWeight: '600' }}>${priceBreakdown.base.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#374151' }}>Servicio</Text>
                <Text style={{ color: '#111827', fontWeight: '600' }}>${priceBreakdown.serviceFee.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#374151' }}>Impuestos</Text>
                <Text style={{ color: '#111827', fontWeight: '600' }}>${priceBreakdown.taxes.toFixed(2)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Total/día</Text>
                <Text style={{ color: '#111827', fontWeight: '700' }}>${priceBreakdown.totalPerDay.toFixed(2)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10 }}
                onPress={() => setPriceInfoVisible(false)}
              >
                <Text style={{ textAlign: 'center', color: '#374151', fontWeight: '600' }}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#0B729D', paddingVertical: 12, borderRadius: 10 }}
                onPress={() => { setPriceInfoVisible(false); navigation.navigate('BookingStep1Dates', { vehicle }); }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>Reservar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
});
